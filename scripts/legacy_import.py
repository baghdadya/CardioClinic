"""
Legacy Data Import Script
Imports patient data from the original 2001 VB6/Access application
into the CardioClinic PostgreSQL database.

Supported import sources:
  1. Microsoft Access (.mdb) — via pyodbc or mdbtools
  2. Crystal Reports (.rpt) — parse report definitions for field mappings
  3. CSV exports — column mapping config per table (fallback)
  4. CAB archive (.cab) — extract with cabextract, process contents

Known legacy files (in Source/):
  - DBHT.mdb          — Main Access database (patient data)
  - Cardiac.CAB        — Compressed application archive
  - rh.rpt, rhb.rpt   — Crystal Reports templates (prescription/report layouts)

Usage:
  python legacy_import.py --mdb path/to/DBHT.mdb
  python legacy_import.py --rpt path/to/rh.rpt --extract-mappings
  python legacy_import.py --csv-dir path/to/csv/exports/
  python legacy_import.py --cab path/to/Cardiac.CAB --extract
  python legacy_import.py --mdb path/to/DBHT.mdb --dry-run

Flags:
  --dry-run       Validate and report without writing to database
  --encoding      Source text encoding (default: cp1256 for Arabic Windows)
  --log-file      Path to import log output
"""


def main():
    raise NotImplementedError("Legacy import not yet implemented")


if __name__ == "__main__":
    main()
