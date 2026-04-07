"""
Prescription PDF generation using WeasyPrint.
Generates bilingual (English + Arabic) prescription documents
with the real clinic header/footer for Dr. Yasser M.K. Baghdady.
"""

from datetime import date, datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.instruction import PatientInstruction
from app.models.medication import MedicationMaster
from app.models.patient import Patient
from app.models.prescription import Prescription

UPLOAD_DIR = Path("uploads/prescriptions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# -- Accent colour used throughout the template ----------------------------
ACCENT = "#4F46E5"
ACCENT_LIGHT = "#EEF2FF"
ACCENT_DARK = "#3730A3"
BORDER_COLOR = "#E2E8F0"
TEXT_PRIMARY = "#1E293B"
TEXT_SECONDARY = "#64748B"


def _calculate_age(dob: date) -> str:
    """Return a human-readable age string."""
    today = date.today()
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return f"{years} years"


# ---------------------------------------------------------------------------
# CSS — shared across prescription & instruction pages
# ---------------------------------------------------------------------------
_BASE_CSS = f"""
@page {{
    size: A4;
    margin: 15mm 15mm 20mm 15mm;
    @bottom-center {{
        content: counter(page) " / " counter(pages);
        font-size: 9px;
        color: {TEXT_SECONDARY};
    }}
}}
/* Google Fonts — WeasyPrint resolves these at render time */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');

* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    font-family: 'Inter', 'Noto Sans Arabic', sans-serif;
    color: {TEXT_PRIMARY};
    font-size: 11pt;
    line-height: 1.5;
}}
.arabic {{
    font-family: 'Noto Sans Arabic', 'Inter', sans-serif;
    direction: rtl;
    text-align: right;
}}

/* ----- Header --------------------------------------------------------- */
.clinic-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 3px solid {ACCENT};
    margin-bottom: 18px;
}}
.clinic-header .left {{
    flex: 1;
}}
.clinic-header .right {{
    flex: 1;
    text-align: right;
}}
.clinic-header .center-logo {{
    width: 80px;
    text-align: center;
    padding: 0 12px;
}}
.doctor-name {{
    font-size: 18pt;
    font-weight: 700;
    color: {ACCENT};
    margin: 0;
    letter-spacing: 0.3px;
}}
.doctor-name-ar {{
    font-family: 'Noto Sans Arabic', sans-serif;
    font-size: 16pt;
    font-weight: 700;
    color: {ACCENT};
    direction: rtl;
    margin: 0;
}}
.doctor-title {{
    font-size: 10pt;
    color: {TEXT_SECONDARY};
    margin: 2px 0;
}}
.doctor-title-ar {{
    font-family: 'Noto Sans Arabic', sans-serif;
    font-size: 10pt;
    color: {TEXT_SECONDARY};
    direction: rtl;
    margin: 2px 0;
}}

/* ----- Patient info --------------------------------------------------- */
.patient-bar {{
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    background: {ACCENT_LIGHT};
    border-radius: 6px;
    margin-bottom: 16px;
    border-left: 4px solid {ACCENT};
}}
.patient-bar .col {{
    line-height: 1.7;
}}
.patient-bar .label {{
    font-weight: 600;
    color: {ACCENT_DARK};
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}
.patient-bar .value {{
    color: {TEXT_PRIMARY};
    font-size: 10.5pt;
}}

/* ----- Rx symbol ------------------------------------------------------ */
.rx-mark {{
    font-size: 28pt;
    color: {ACCENT};
    font-weight: 700;
    margin: 8px 0 4px;
}}

/* ----- Medication table ----------------------------------------------- */
.med-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px;
}}
.med-table thead th {{
    background: {ACCENT};
    color: #ffffff;
    padding: 7px 8px;
    font-size: 9pt;
    font-weight: 600;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}}
.med-table thead th:first-child {{
    border-radius: 4px 0 0 0;
}}
.med-table thead th:last-child {{
    border-radius: 0 4px 0 0;
}}
.med-table tbody td {{
    padding: 7px 8px;
    font-size: 10pt;
    border-bottom: 1px solid {BORDER_COLOR};
    vertical-align: top;
}}
.med-table tbody tr:last-child td {{
    border-bottom: none;
}}
.med-table tbody tr:nth-child(even) {{
    background: #F8FAFC;
}}
.med-name-ar {{
    font-family: 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    display: block;
    font-size: 9pt;
    color: {TEXT_SECONDARY};
    margin-top: 2px;
}}
.instr-ar {{
    font-family: 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    text-align: right;
    display: block;
    font-size: 9pt;
    color: {TEXT_SECONDARY};
    margin-top: 2px;
}}

/* ----- Notes ---------------------------------------------------------- */
.notes-box {{
    margin: 10px 0;
    padding: 8px 12px;
    background: #FFFBEB;
    border-left: 4px solid #F59E0B;
    border-radius: 0 6px 6px 0;
    font-size: 10pt;
}}

/* ----- Status badges -------------------------------------------------- */
.badge {{
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}
.badge-finalized {{ background: #DCFCE7; color: #166534; }}
.badge-voided    {{ background: #FEE2E2; color: #991B1B; }}
.badge-draft     {{ background: #FEF3C7; color: #92400E; }}

/* ----- Voided overlay ------------------------------------------------- */
.voided-banner {{
    margin-top: 16px;
    padding: 10px;
    background: #FEE2E2;
    border-radius: 6px;
    text-align: center;
    font-weight: 700;
    color: #991B1B;
    font-size: 12pt;
}}

/* ----- Footer --------------------------------------------------------- */
.clinic-footer {{
    margin-top: 30px;
    padding-top: 12px;
    border-top: 2px solid {BORDER_COLOR};
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}}
.clinic-footer .contact {{
    font-size: 8.5pt;
    color: {TEXT_SECONDARY};
    line-height: 1.6;
}}
.signature-block {{
    text-align: center;
    min-width: 180px;
}}
.signature-line {{
    border-top: 1px solid {TEXT_PRIMARY};
    margin-top: 40px;
    padding-top: 4px;
    font-size: 9pt;
    color: {TEXT_SECONDARY};
}}
.qr-placeholder {{
    width: 60px;
    height: 60px;
    border: 1px dashed {BORDER_COLOR};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7pt;
    color: {TEXT_SECONDARY};
    text-align: center;
}}
.system-note {{
    font-size: 7.5pt;
    color: {TEXT_SECONDARY};
    margin-top: 8px;
}}

/* ----- Instruction sheet --------------------------------------------- */
.instruction-page {{
    page-break-before: always;
}}
.instruction-title {{
    font-size: 14pt;
    font-weight: 700;
    color: {ACCENT};
    margin-bottom: 2px;
}}
.instruction-title-ar {{
    font-family: 'Noto Sans Arabic', sans-serif;
    font-size: 13pt;
    font-weight: 700;
    color: {ACCENT};
    direction: rtl;
    margin-bottom: 12px;
}}
.instruction-columns {{
    display: flex;
    gap: 20px;
    margin-top: 8px;
}}
.instruction-col {{
    flex: 1;
}}
.instruction-col ul {{
    list-style: none;
    padding: 0;
}}
.instruction-col li {{
    padding: 4px 0;
    font-size: 10pt;
    line-height: 1.55;
    border-bottom: 1px solid #F1F5F9;
}}
.instruction-col li::before {{
    content: "\\25B8\\00a0";
    color: {ACCENT};
    font-weight: 700;
}}
.instruction-col.rtl li::before {{
    content: "\\00a0\\25C2";
}}
.instruction-col.rtl li {{
    font-family: 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    text-align: right;
}}
.instruction-divider {{
    border: none;
    border-top: 1px solid {BORDER_COLOR};
    margin: 16px 0;
}}
"""


# ---------------------------------------------------------------------------
# Clinic header (shared)
# ---------------------------------------------------------------------------
def _clinic_header_html(date_str: str = "") -> str:
    return f"""
    <div class="clinic-header">
        <div class="left">
            <p class="doctor-name">Dr. Yasser M.K. Baghdady, MD</p>
            <p class="doctor-title">Lecturer of Cardiovascular Medicine</p>
            <p class="doctor-title">Faculty of Medicine &mdash; Cairo University</p>
        </div>
        <div class="center-logo">
            <!-- Logo placeholder: replace src with actual logo path -->
            <div style="width:60px;height:60px;border:2px solid {ACCENT};border-radius:50%;
                        display:flex;align-items:center;justify-content:center;margin:0 auto;">
                <span style="font-size:22pt;color:{ACCENT};font-weight:700;">&#9829;</span>
            </div>
        </div>
        <div class="right">
            <p class="doctor-name-ar">د. ياسر محمد خليل بغدادي</p>
            <p class="doctor-title-ar">مدرس أمراض القلب والأوعية الدموية</p>
            <p class="doctor-title-ar">كلية الطب &mdash; جامعة القاهرة</p>
            {f'<p style="margin-top:6px;font-size:9pt;color:{TEXT_SECONDARY};">Date: {date_str}</p>' if date_str else ''}
        </div>
    </div>
    """


# ---------------------------------------------------------------------------
# Clinic footer (shared)
# ---------------------------------------------------------------------------
def _clinic_footer_html(*, show_signature: bool = True) -> str:
    sig = ""
    if show_signature:
        sig = f"""
        <div class="signature-block">
            <div class="signature-line">Dr. Yasser M.K. Baghdady</div>
        </div>
        """
    return f"""
    <div class="clinic-footer">
        <div class="contact">
            <strong style="color:{ACCENT};">CardioClinic</strong><br>
            9 Horrya Square, Maadi, Cairo<br>
            Mobile: 010/1434754 &nbsp;|&nbsp; Tel: 3519561<br>
            Email: yasserbaghdady@hotmail.com
        </div>
        {sig}
        <div class="qr-placeholder">
            QR<br>Code
        </div>
    </div>
    <p class="system-note">This prescription was generated by CardioClinic.</p>
    """


# ---------------------------------------------------------------------------
# Prescription HTML builder
# ---------------------------------------------------------------------------
def _build_prescription_html(
    patient: Patient,
    prescription: Prescription,
    medications: dict[UUID, MedicationMaster],
    instructions: list[PatientInstruction] | None = None,
) -> str:
    now = prescription.finalized_at or prescription.prescribed_at
    date_str = now.strftime("%Y-%m-%d") if now else ""
    time_str = now.strftime("%H:%M") if now else ""

    age_str = _calculate_age(patient.date_of_birth) if patient.date_of_birth else ""

    # --- Medication rows --------------------------------------------------
    items_html = ""
    for i, item in enumerate(sorted(prescription.items, key=lambda x: x.sort_order), 1):
        med = medications.get(item.medication_id)
        med_name = med.name if med else "Unknown"
        med_name_ar = med.name_ar if med and med.name_ar else ""

        items_html += f"""
        <tr>
            <td style="text-align:center;color:{TEXT_SECONDARY};font-weight:600;">{i}</td>
            <td>
                <strong>{med_name}</strong>
                {f'<span class="med-name-ar">{med_name_ar}</span>' if med_name_ar else ''}
            </td>
            <td>{item.dosage}</td>
            <td>{item.frequency}</td>
            <td>{item.duration or '&mdash;'}</td>
            <td>
                {item.instructions or ''}
                {f'<span class="instr-ar">{item.instructions_ar}</span>' if item.instructions_ar else ''}
            </td>
        </tr>
        """

    # --- Notes ------------------------------------------------------------
    notes_html = ""
    if prescription.notes:
        notes_html = f'<div class="notes-box"><strong>Notes:</strong> {prescription.notes}</div>'

    # --- Voided banner ----------------------------------------------------
    voided_html = ""
    if prescription.status.value == "voided":
        voided_html = f'<div class="voided-banner">VOIDED &mdash; {prescription.void_reason or ""}</div>'

    # --- Instruction pages ------------------------------------------------
    instructions_html = ""
    if instructions:
        for inst in instructions:
            # DB stores content as text — split on newlines for bullet rendering
            en_lines = [ln.strip() for ln in inst.content_en.split("\n") if ln.strip()] if inst.content_en else []
            ar_lines = [ln.strip() for ln in inst.content_ar.split("\n") if ln.strip()] if inst.content_ar else []
            en_items = "".join(f"<li>{line}</li>" for line in en_lines)
            ar_items = "".join(f"<li>{line}</li>" for line in ar_lines)
            instructions_html += f"""
            <div class="instruction-page">
                {_clinic_header_html(date_str)}
                <p class="instruction-title">{inst.title_en}</p>
                <p class="instruction-title-ar">{inst.title_ar or ''}</p>
                <hr class="instruction-divider">
                <div class="instruction-columns">
                    <div class="instruction-col">
                        <ul>{en_items}</ul>
                    </div>
                    <div class="instruction-col rtl">
                        <ul>{ar_items}</ul>
                    </div>
                </div>
                {_clinic_footer_html(show_signature=False)}
            </div>
            """

    # --- Full document ----------------------------------------------------
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>{_BASE_CSS}</style>
</head>
<body>

    <!-- ========== PRESCRIPTION PAGE ========== -->
    {_clinic_header_html(date_str)}

    <!-- Patient info bar -->
    <div class="patient-bar">
        <div class="col">
            <span class="label">Patient</span><br>
            <span class="value">{patient.full_name}</span>
            {f'<br><span class="value arabic" style="font-size:10pt;">{patient.full_name_ar}</span>' if patient.full_name_ar else ''}
        </div>
        <div class="col" style="text-align:center;">
            <span class="label">DOB</span><br>
            <span class="value">{patient.date_of_birth.isoformat()}</span>
            <br><span class="label">Age</span> <span class="value">{age_str}</span>
        </div>
        <div class="col" style="text-align:center;">
            <span class="label">Sex</span><br>
            <span class="value">{patient.sex.value.title()}</span>
        </div>
        <div class="col" style="text-align:right;">
            <span class="label">Rx ID</span><br>
            <span class="value" style="font-family:monospace;">{str(prescription.id)[:8]}</span>
            <br><span class="label">Time</span> <span class="value">{time_str}</span>
            <br><span class="badge badge-{prescription.status.value}">{prescription.status.value}</span>
        </div>
    </div>

    <!-- Rx symbol -->
    <div class="rx-mark">&#8478;</div>

    <!-- Medications table -->
    <table class="med-table">
        <thead>
            <tr>
                <th style="width:28px;">#</th>
                <th>Medication</th>
                <th style="width:80px;">Dosage</th>
                <th style="width:90px;">Frequency</th>
                <th style="width:70px;">Duration</th>
                <th>Instructions</th>
            </tr>
        </thead>
        <tbody>
            {items_html}
        </tbody>
    </table>

    {notes_html}
    {voided_html}

    {_clinic_footer_html(show_signature=True)}

    <!-- ========== INSTRUCTION PAGES (if any) ========== -->
    {instructions_html}

</body>
</html>"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
async def generate_prescription_pdf(
    db: AsyncSession,
    prescription_id: UUID,
    instruction_ids: list[UUID] | None = None,
) -> str:
    """Generate a PDF for a prescription. Returns the file path.

    Args:
        db: Async database session.
        prescription_id: The prescription UUID.
        instruction_ids: Optional list of PatientInstruction UUIDs to
            append as additional instruction pages.
    """
    try:
        from weasyprint import HTML
    except ImportError:
        raise RuntimeError("WeasyPrint is not installed. Install with: pip install weasyprint")

    result = await db.execute(
        select(Prescription)
        .where(Prescription.id == prescription_id)
        .options(selectinload(Prescription.items))
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise ValueError("Prescription not found")

    patient_result = await db.execute(select(Patient).where(Patient.id == prescription.patient_id))
    patient = patient_result.scalar_one()

    # Load medication details
    med_ids = [item.medication_id for item in prescription.items]
    if med_ids:
        med_result = await db.execute(select(MedicationMaster).where(MedicationMaster.id.in_(med_ids)))
        medications = {m.id: m for m in med_result.scalars().all()}
    else:
        medications = {}

    # Load patient instructions from DB
    instructions: list[PatientInstruction] = []
    if instruction_ids:
        instr_result = await db.execute(
            select(PatientInstruction)
            .where(PatientInstruction.id.in_(instruction_ids), PatientInstruction.is_active.is_(True))
            .order_by(PatientInstruction.sort_order, PatientInstruction.title_en)
        )
        instructions = list(instr_result.scalars().all())

    html_content = _build_prescription_html(patient, prescription, medications, instructions or None)

    filename = f"rx_{str(prescription_id)[:8]}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = UPLOAD_DIR / filename

    HTML(string=html_content).write_pdf(str(filepath))

    # Update prescription with PDF path
    prescription.pdf_path = str(filepath)
    await db.commit()

    return str(filepath)
