"""
Drug interaction checking service.
Checks for known interactions between medications using the JSONB interactions
field on medications_master.

Interaction data structure in medications_master.interactions:
{
    "medication_id_or_name": {
        "severity": "major|moderate|minor",
        "description": "Clinical description of the interaction"
    }
}
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.medication import MedicationMaster


async def check_interactions(
    db: AsyncSession,
    medication_ids: list[UUID],
) -> list[dict]:
    """
    Check for drug interactions between a list of medications.
    Returns a list of interaction warnings.
    """
    if len(medication_ids) < 2:
        return []

    result = await db.execute(
        select(MedicationMaster).where(MedicationMaster.id.in_(medication_ids))
    )
    medications = {m.id: m for m in result.scalars().all()}

    warnings = []
    checked_pairs: set[tuple[UUID, UUID]] = set()

    for med_id, med in medications.items():
        if not med.interactions:
            continue

        for other_id, other_med in medications.items():
            if med_id == other_id:
                continue

            pair = tuple(sorted([med_id, other_id], key=str))
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            # Check by ID
            interaction = med.interactions.get(str(other_id))

            # Check by name
            if not interaction and other_med:
                interaction = med.interactions.get(other_med.name)
                if not interaction and other_med.generic_name:
                    interaction = med.interactions.get(other_med.generic_name)

            if interaction:
                warnings.append({
                    "medication_1": {
                        "id": str(med_id),
                        "name": med.name,
                    },
                    "medication_2": {
                        "id": str(other_id),
                        "name": other_med.name if other_med else str(other_id),
                    },
                    "severity": interaction.get("severity", "unknown"),
                    "description": interaction.get("description", "Potential interaction detected"),
                })

    # Sort by severity (major first)
    severity_order = {"major": 0, "moderate": 1, "minor": 2, "unknown": 3}
    warnings.sort(key=lambda w: severity_order.get(w["severity"], 3))

    return warnings


async def check_prescription_interactions(
    db: AsyncSession,
    medication_ids: list[UUID],
    patient_current_medication_ids: list[UUID] | None = None,
) -> list[dict]:
    """
    Check interactions for a prescription, including against patient's current medications.
    """
    all_med_ids = list(set(medication_ids))

    if patient_current_medication_ids:
        all_med_ids = list(set(all_med_ids + patient_current_medication_ids))

    return await check_interactions(db, all_med_ids)
