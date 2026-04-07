"""
RxNorm drug interaction sync service.

Fetches interaction data from the NLM RxNorm REST API and updates the
medications_master JSONB `interactions` field.  Manually-added interactions
are preserved (merge, not overwrite).
"""

import asyncio
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medication import MedicationMaster

logger = logging.getLogger(__name__)

RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST"
REQUEST_DELAY = 0.06  # ~16 req/s, well within 20/s limit


async def _get_rxcui(client: httpx.AsyncClient, drug_name: str) -> str | None:
    """Look up the RxCUI for a drug name.  Returns None if not found."""
    try:
        resp = await client.get(
            f"{RXNORM_BASE}/rxcui.json",
            params={"name": drug_name},
        )
        resp.raise_for_status()
        data = resp.json()
        id_group = data.get("idGroup", {})
        rxnorm_ids = id_group.get("rxnormId")
        if rxnorm_ids:
            return rxnorm_ids[0]
    except Exception as exc:
        logger.warning("RxCUI lookup failed for %s: %s", drug_name, exc)
    return None


async def _get_rxcui_approximate(client: httpx.AsyncClient, drug_name: str) -> str | None:
    """Fallback approximate match for a drug name."""
    try:
        resp = await client.get(
            f"{RXNORM_BASE}/approximateTerm.json",
            params={"term": drug_name, "maxEntries": 1},
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = (
            data.get("approximateGroup", {})
            .get("candidate", [])
        )
        if candidates:
            return candidates[0].get("rxcui")
    except Exception as exc:
        logger.warning("Approximate RxCUI lookup failed for %s: %s", drug_name, exc)
    return None


def _normalise_severity(raw: str) -> str:
    """Map NLM severity strings to our standard values."""
    low = raw.lower()
    if "high" in low or "major" in low or "critical" in low:
        return "major"
    if "moderate" in low or "medium" in low:
        return "moderate"
    return "minor"


async def _get_interactions(client: httpx.AsyncClient, rxcui: str) -> dict[str, dict]:
    """
    Fetch interactions for one RxCUI.
    Returns { "drug_name": { "severity": "...", "description": "..." }, ... }
    """
    interactions: dict[str, dict] = {}
    try:
        resp = await client.get(
            f"{RXNORM_BASE}/interaction/interaction.json",
            params={"rxcui": rxcui},
        )
        resp.raise_for_status()
        data = resp.json()

        for group in data.get("interactionTypeGroup", []):
            for itype in group.get("interactionType", []):
                for pair in itype.get("interactionPair", []):
                    severity = _normalise_severity(pair.get("severity", "N/A"))
                    description = pair.get("description", "")

                    # Get the *other* drug in the pair
                    concepts = pair.get("interactionConcept", [])
                    for concept in concepts:
                        source_concept = concept.get("minConceptItem", {})
                        other_rxcui = source_concept.get("rxcui", "")
                        other_name = source_concept.get("name", "")
                        if other_rxcui != rxcui and other_name:
                            interactions[other_name] = {
                                "severity": severity,
                                "description": description,
                            }
    except Exception as exc:
        logger.warning("Interaction fetch failed for rxcui %s: %s", rxcui, exc)

    return interactions


async def sync_interactions(
    db: AsyncSession,
    *,
    progress_callback: None = None,  # reserved for future SSE progress
) -> dict:
    """
    Main sync routine.  Returns a summary dict:
    {
        "synced_count": int,
        "total_medications": int,
        "errors": list[str],
        "synced_at": str (ISO datetime),
    }
    """
    result = await db.execute(
        select(MedicationMaster).where(MedicationMaster.is_active.is_(True))
    )
    medications = list(result.scalars().all())
    total = len(medications)

    errors: list[str] = []
    synced_count = 0
    now = datetime.now(timezone.utc)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Phase 1: Resolve RxCUIs for medications that don't have one cached
        for med in medications:
            if med.rxcui:
                continue  # already resolved from a prior sync

            name_to_try = med.generic_name or med.name
            rxcui = await _get_rxcui(client, name_to_try)

            # Fallback: try trade name if generic didn't match
            if not rxcui and med.generic_name and med.name != med.generic_name:
                rxcui = await _get_rxcui(client, med.name)

            # Last resort: approximate match
            if not rxcui:
                rxcui = await _get_rxcui_approximate(client, name_to_try)

            if rxcui:
                med.rxcui = rxcui
            else:
                errors.append(f"RxCUI not found: {med.name}")

            await asyncio.sleep(REQUEST_DELAY)

        # Phase 2: Fetch interactions for each medication with an RxCUI
        for med in medications:
            if not med.rxcui:
                continue

            new_interactions = await _get_interactions(client, med.rxcui)

            if new_interactions:
                # Merge with existing manual interactions (don't overwrite)
                existing = dict(med.interactions) if med.interactions else {}
                merged = {**new_interactions, **existing}  # existing wins on conflict
                med.interactions = merged
                synced_count += 1

            # Always mark as synced (even if no new interactions found)
            med.interactions_synced_at = now

            await asyncio.sleep(REQUEST_DELAY)

    await db.commit()

    return {
        "synced_count": synced_count,
        "total_medications": total,
        "errors": errors,
        "synced_at": now.isoformat(),
    }


async def get_sync_status(db: AsyncSession) -> dict:
    """Return current sync status summary."""
    total_result = await db.execute(
        select(func.count(MedicationMaster.id)).where(
            MedicationMaster.is_active.is_(True)
        )
    )
    total = total_result.scalar() or 0

    with_interactions_result = await db.execute(
        select(func.count(MedicationMaster.id)).where(
            MedicationMaster.is_active.is_(True),
            MedicationMaster.interactions_synced_at.isnot(None),
        )
    )
    with_interactions = with_interactions_result.scalar() or 0

    last_synced_result = await db.execute(
        select(func.max(MedicationMaster.interactions_synced_at))
    )
    last_synced = last_synced_result.scalar()

    return {
        "last_synced_at": last_synced.isoformat() if last_synced else None,
        "medications_with_interactions": with_interactions,
        "total_medications": total,
    }
