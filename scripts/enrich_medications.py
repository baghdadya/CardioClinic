#!/usr/bin/env python3
"""
CardioClinic: Enrich legacy medication records via OpenFDA API.

Fetches medications_master rows where generic_name IS NULL, queries the
OpenFDA drug/label endpoint by brand name, and backfills:
  - generic_name   (from openfda.generic_name)
  - category        (from openfda.pharm_class_epc)

Usage:
    python enrich_medications.py                # live run
    python enrich_medications.py --dry-run      # preview without writing
    python enrich_medications.py --batch 50     # process first 50 only
    python enrich_medications.py --verbose      # extra logging

Requires: psycopg2-binary, requests
"""

import argparse
import logging
import re
import sys
import time
from typing import Optional

import psycopg2
import psycopg2.extras
import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DB_DSN = "postgresql://cardioclinic:cardioclinic@localhost:5432/cardioclinic"

FDA_ENDPOINT = "https://api.fda.gov/drug/label.json"
FDA_RATE_LIMIT = 0.5  # seconds between requests (~2 req/s)

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"

# Dosage-form tokens to strip before querying FDA
DOSAGE_FORM_TOKENS = re.compile(
    r"\b(tab|tabs|tablet|tablets|cap|caps|capsule|capsules|"
    r"amp|ampoule|ampoules|inj|injection|vial|syrup|susp|"
    r"suspension|cream|oint|ointment|gel|drops|patch|patches|"
    r"sr|cr|la|xl|xr|er|mr|retard|forte|plus|"
    r"sachet|sachets|powder|solution|spray|inhaler|"
    r"mg|mcg|gm|g|ml|iu)\b",
    re.IGNORECASE,
)
DIGIT_PATTERN = re.compile(r"\b\d+([./]\d+)?\b")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def clean_brand_name(raw_name: str) -> str:
    """Strip dosage forms, strengths, and extra whitespace from a medication name."""
    name = raw_name.strip()
    # Remove dosage-form tokens
    name = DOSAGE_FORM_TOKENS.sub("", name)
    # Remove standalone numbers (strengths like "30", "12.5")
    name = DIGIT_PATTERN.sub("", name)
    # Remove stray punctuation left behind
    name = re.sub(r"[/\-]+\s*$", "", name)
    # Collapse whitespace
    name = re.sub(r"\s{2,}", " ", name).strip()
    return name


def query_fda(brand_name: str, session: requests.Session) -> Optional[dict]:
    """
    Query OpenFDA drug/label endpoint for a brand name.
    Returns a dict with generic_name and category, or None.
    """
    cleaned = clean_brand_name(brand_name)
    if not cleaned:
        return None

    # Try exact match first, then cleaned name
    for query_name in [cleaned]:
        params = {
            "search": f'openfda.brand_name:"{query_name}"',
            "limit": "1",
        }
        try:
            resp = session.get(FDA_ENDPOINT, params=params, timeout=15)

            if resp.status_code == 404:
                continue
            if resp.status_code == 429:
                logging.warning("Rate limited by FDA API, backing off 10s...")
                time.sleep(10)
                resp = session.get(FDA_ENDPOINT, params=params, timeout=15)

            resp.raise_for_status()
            data = resp.json()

            results = data.get("results", [])
            if not results:
                continue

            result = results[0]
            openfda = result.get("openfda", {})

            generic_names = openfda.get("generic_name", [])
            pharm_classes = openfda.get("pharm_class_epc", [])

            generic_name = generic_names[0].title() if generic_names else None
            category = pharm_classes[0] if pharm_classes else None

            if generic_name:
                return {
                    "generic_name": generic_name,
                    "category": category,
                }
        except requests.RequestException as e:
            logging.warning("FDA API error for '%s': %s", query_name, e)
            continue

    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Enrich legacy medications via OpenFDA API"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to the database",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=0,
        help="Limit to N medications (0 = all)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format=LOG_FORMAT,
    )
    log = logging.getLogger("enrich")

    # ---- Connect ----
    log.info("Connecting to database...")
    try:
        conn = psycopg2.connect(DB_DSN)
        conn.autocommit = False
    except psycopg2.Error as e:
        log.error("Cannot connect to database: %s", e)
        sys.exit(1)

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # ---- Fetch incomplete medications ----
    query = "SELECT id, name FROM medications_master WHERE generic_name IS NULL ORDER BY name"
    if args.batch > 0:
        query += f" LIMIT {args.batch}"

    cur.execute(query)
    rows = cur.fetchall()
    total = len(rows)
    log.info("Found %d medications missing generic_name", total)

    if total == 0:
        log.info("Nothing to do.")
        cur.close()
        conn.close()
        return

    # ---- Process ----
    session = requests.Session()
    session.headers.update({"User-Agent": "CardioClinic/1.0 (medication enrichment)"})

    stats = {"found": 0, "not_found": 0, "error": 0}

    for idx, row in enumerate(rows, 1):
        med_id = row["id"]
        med_name = row["name"]

        log.info("[%d/%d] Looking up: %s", idx, total, med_name)

        result = query_fda(med_name, session)

        if result:
            log.info(
                "  -> Found: generic=%s, category=%s",
                result["generic_name"],
                result.get("category", "(none)"),
            )
            stats["found"] += 1

            if not args.dry_run:
                try:
                    cur.execute(
                        """
                        UPDATE medications_master
                        SET generic_name = %s,
                            category = COALESCE(%s, category)
                        WHERE id = %s AND generic_name IS NULL
                        """,
                        (result["generic_name"], result.get("category"), med_id),
                    )
                except psycopg2.Error as e:
                    log.error("  -> DB update failed for %s: %s", med_name, e)
                    conn.rollback()
                    stats["error"] += 1
        else:
            log.info("  -> Not found in FDA database")
            stats["not_found"] += 1

        # Rate limit
        time.sleep(FDA_RATE_LIMIT)

    # ---- Commit ----
    if not args.dry_run:
        conn.commit()
        log.info("Changes committed to database.")
    else:
        conn.rollback()
        log.info("DRY RUN: no changes written.")

    # ---- Summary ----
    log.info("=" * 60)
    log.info("ENRICHMENT COMPLETE")
    log.info("  Total processed : %d", total)
    log.info("  Found (updated) : %d", stats["found"])
    log.info("  Not found       : %d", stats["not_found"])
    log.info("  Errors          : %d", stats["error"])
    log.info("=" * 60)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
