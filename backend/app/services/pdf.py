"""
Prescription PDF generation using WeasyPrint.
Generates bilingual (English + Arabic) prescription documents
matching the Maadi Clinic prescription letterhead template exactly.

Assets stored in backend/app/static/prescription/ (JPEG, ~255KB total).
"""

import base64
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

ASSETS_DIR = Path(__file__).resolve().parent.parent / "static" / "prescription"

_IMG_CACHE: dict[str, str] = {}


def _img(filename: str) -> str:
    if filename not in _IMG_CACHE:
        path = ASSETS_DIR / filename
        if not path.exists():
            _IMG_CACHE[filename] = ""
        else:
            data = base64.b64encode(path.read_bytes()).decode()
            ext = path.suffix.lower()
            mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}.get(ext, "image/png")
            _IMG_CACHE[filename] = f"data:{mime};base64,{data}"
    return _IMG_CACHE[filename]


def _calculate_age(dob: date) -> str:
    today = date.today()
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return f"{years} years"


# ---------------------------------------------------------------------------
# CSS — pixel-matched to the original prescription_template_reduced.pdf
# ---------------------------------------------------------------------------
_BASE_CSS = """
@page {
    size: A4;
    margin: 0;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Inter', 'Noto Sans Arabic', sans-serif;
    color: #1a1a1a;
    font-size: 11pt;
    line-height: 1.5;
    width: 210mm;
    height: 297mm;
    position: relative;
}

/* ---- Full-page background (position:fixed = rendered on every page in paged media) ---- */
.bg-texture {
    position: fixed;
    top: 0; left: 0;
    width: 210mm;
    height: 297mm;
    z-index: -10;
}

/* ---- Center watermark (crescent horizontal line aligned with middle arabesque) ---- */
.watermark {
    position: fixed;
    top: 119mm;
    left: 50%;
    margin-left: -60mm;
    width: 120mm;
    opacity: 0.10;
    z-index: -1;
    mix-blend-mode: multiply;
}

/* ---- Right-side arabesques (below patient info separator) ---- */
.deco-top {
    position: fixed;
    top: 82mm;
    right: 8mm;
    width: 34mm;
    opacity: 0.35;
    z-index: -1;
}
.deco-mid {
    position: fixed;
    top: 150mm;
    right: 8mm;
    width: 34mm;
    opacity: 0.35;
    z-index: -1;
}
.deco-bot {
    position: fixed;
    top: 218mm;
    right: 8mm;
    width: 34mm;
    opacity: 0.35;
    z-index: -1;
}

/* ---- Content area (simulates page margins) ---- */
.content {
    padding: 10mm 16mm 0 16mm;
}

/* ---- Footer pinned to page bottom ---- */
.footer-wrap {
    position: fixed;
    bottom: 5mm;
    left: 0;
    width: 210mm;
    padding: 0 16mm;
    z-index: 2;
}

/* ---- Header ---- */
.header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4mm;
}
.header-table td { vertical-align: top; padding: 0; }
.header-left { width: 35%; }
.header-center { width: 30%; text-align: center; }
.header-right { width: 35%; text-align: right; }
.header-center img { width: 55mm; height: auto; mix-blend-mode: multiply; }
.header-sep { border: none; border-top: 2px solid #2d5016; margin: 0 0 3mm 0; }
.patient-sep { border: none; border-top: 2px solid #2d5016; margin: 2mm 0 3mm 0; }
.doctor-name {
    font-size: 12pt;
    font-weight: 700;
    color: #1a3a5c;
}
.doctor-name-ar {
    font-family: 'Noto Sans Arabic', sans-serif;
    font-size: 13pt;
    font-weight: 700;
    color: #1a3a5c;
    direction: rtl;
}
.doctor-title {
    font-size: 8.5pt;
    color: #444;
    margin: 0.5px 0;
}
.doctor-title-ar {
    font-family: 'Noto Sans Arabic', sans-serif;
    font-size: 8.5pt;
    color: #444;
    direction: rtl;
    margin: 0.5px 0;
}

/* ---- Patient info ---- */
.patient-info {
    padding: 2mm 0;
    font-size: 11pt;
}
.patient-info-row { margin: 1mm 0; }
.patient-info-label {
    font-weight: 700;
    display: inline-block;
    width: 16mm;
}
.patient-info-ar {
    font-family: 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    display: inline;
    color: #444;
}

/* ---- Rx ---- */
.rx-mark {
    font-size: 22pt;
    font-weight: 700;
    font-style: italic;
    color: #1a3a5c;
    margin: 3mm 0 4mm 0;
}

/* ---- Medication table ---- */
.med-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2mm 0 4mm;
}
.med-table thead th {
    background: #2d5016;
    color: #fff;
    padding: 4px 8px;
    font-size: 8.5pt;
    font-weight: 600;
    text-align: left;
    text-transform: uppercase;
}
.med-table tbody td {
    padding: 4px 8px;
    font-size: 10pt;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
}
.med-table tbody tr:nth-child(even) { background: rgba(0,0,0,0.02); }

/* ---- Notes ---- */
.notes-box {
    margin: 3mm 0;
    padding: 2mm 4mm;
    background: rgba(255,251,235,0.8);
    border-left: 3px solid #d4a017;
    font-size: 10pt;
}

/* ---- Voided ---- */
.voided-banner {
    margin-top: 3mm;
    padding: 3mm;
    background: #fee2e2;
    text-align: center;
    font-weight: 700;
    color: #991b1b;
    font-size: 12pt;
}

/* ---- Footer ---- */
.footer-content {
    text-align: center;
    position: relative;
}
.footer-sep { border: none; border-top: 2px solid #2d5016; margin: 0 35mm 2mm 35mm; }
.footer-address {
    font-family: 'Noto Sans Arabic', 'Inter', sans-serif;
    font-size: 9pt;
    color: #333;
    margin-bottom: 1px;
}
.footer-contacts {
    font-size: 8.5pt;
    color: #444;
    line-height: 1.4;
}
.footer-stamp {
    position: absolute;
    left: 0;
    bottom: -2mm;
    width: 28mm;
    height: auto;
}
.footer-cairo {
    position: absolute;
    right: 0;
    bottom: -2mm;
    width: 28mm;
    height: auto;
}

/* ---- Blank lines ---- */
.blank-line {
    border-bottom: 1px solid #ddd;
    height: 30px;
}
"""


# ---------------------------------------------------------------------------
# Background & decoration layers
# ---------------------------------------------------------------------------
def _decorations_html() -> str:
    parts = []
    uri = _img("background.jpg")
    if uri:
        parts.append(f'<img class="bg-texture" src="{uri}" />')
    uri = _img("watermark.jpg")
    if uri:
        parts.append(f'<img class="watermark" src="{uri}" />')
    # 3 arabesques on the right: top + bottom = arabesque1, middle = arabesque2
    uri1 = _img("arabesque1.jpg")
    uri2 = _img("arabesque2.jpg")
    if uri1:
        parts.append(f'<img class="deco-top" src="{uri1}" />')
    if uri2:
        parts.append(f'<img class="deco-mid" src="{uri2}" />')
    if uri1:
        parts.append(f'<img class="deco-bot" src="{uri1}" />')
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
def _clinic_header_html() -> str:
    logo_uri = _img("logo.png")
    return f"""
    <table class="header-table">
        <tr>
            <td class="header-left">
                <p class="doctor-name">Dr. Yasser M.K. Baghdady, MD</p>
                <p class="doctor-title">Professor of Cardiovascular Medicine</p>
                <p class="doctor-title">Faculty of Medicine — Cairo University</p>
                <p class="doctor-title">Kasr Al-Ainy</p>
            </td>
            <td class="header-center">
                <img src="{logo_uri}" alt="Maadi Clinic" />
            </td>
            <td class="header-right">
                <p class="doctor-name-ar">دكتـــور</p>
                <p class="doctor-name-ar">ياسر محمد كامل بغدادي</p>
                <p class="doctor-title-ar">أستاذ أمراض القلب والأوعية الدموية</p>
                <p class="doctor-title-ar">كلية الطب - جامعة القاهرة</p>
                <p class="doctor-title-ar">قصر العيني</p>
            </td>
        </tr>
    </table>
    <hr class="header-sep" />
    """


# ---------------------------------------------------------------------------
# Footer (pinned to bottom via .footer-wrap)
# ---------------------------------------------------------------------------
def _clinic_footer_html() -> str:
    stamp_uri = _img("stamp.jpg")
    cairo_uri = _img("cairo_cardio.jpg")
    return f"""
    <div class="footer-wrap">
        <div class="footer-content">
            <img class="footer-stamp" src="{stamp_uri}" alt="" />
            <img class="footer-cairo" src="{cairo_uri}" alt="" />
            <hr class="footer-sep" />
            <p class="footer-address">45 ش النصر&ensp;ميدان الجزائر - المعادى الجديدة - القاهرة</p>
            <p class="footer-contacts">
                ت: 25199911 - 01284894747<br>
                <b>WhatsApp:</b> 01001775521<br>
                <b>eHotline:</b> www.10777.tel
            </p>
        </div>
    </div>
    """


# ---------------------------------------------------------------------------
# Filled prescription
# ---------------------------------------------------------------------------
def _build_prescription_html(
    patient: Patient,
    prescription: Prescription,
    medications: dict[UUID, MedicationMaster],
    instructions: list[PatientInstruction] | None = None,
) -> str:
    now = prescription.finalized_at or prescription.prescribed_at
    date_str = now.strftime("%Y-%m-%d") if now else ""
    patient_id_display = patient.legacy_id or str(patient.id)[:8]

    items_html = ""
    for i, item in enumerate(sorted(prescription.items, key=lambda x: x.sort_order), 1):
        med = medications.get(item.medication_id)
        med_name = med.name if med else "Unknown"
        items_html += f"""
        <tr>
            <td style="text-align:center;color:#666;font-weight:600;">{i}</td>
            <td><strong>{med_name}</strong></td>
            <td>{item.dosage}</td>
            <td>{item.frequency}</td>
            <td>{item.duration or '—'}</td>
            <td>{item.instructions or ''}</td>
        </tr>
        """

    notes_html = ""
    if prescription.notes:
        notes_html = f'<div class="notes-box"><strong>Notes:</strong> {prescription.notes}</div>'

    voided_html = ""
    if prescription.status.value == "voided":
        voided_html = f'<div class="voided-banner">VOIDED — {prescription.void_reason or ""}</div>'

    ar_name = ""
    if patient.full_name_ar:
        ar_name = f'&emsp;<span class="patient-info-ar">{patient.full_name_ar}</span>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><style>{_BASE_CSS}</style></head>
<body>

{_decorations_html()}
{_clinic_footer_html()}

<div class="content">
    {_clinic_header_html()}

    <div class="patient-info">
        <div class="patient-info-row"><span class="patient-info-label">ID</span>: {patient_id_display}</div>
        <div class="patient-info-row"><span class="patient-info-label">Name</span>: {patient.full_name}{ar_name}</div>
        <div class="patient-info-row"><span class="patient-info-label">Date</span>: {date_str}</div>
    </div>
    <hr class="patient-sep" />

    <div class="rx-mark">R/</div>

    <table class="med-table">
        <thead><tr>
            <th style="width:24px;">#</th>
            <th>Medication</th>
            <th style="width:80px;">Dosage</th>
            <th style="width:85px;">Frequency</th>
            <th style="width:65px;">Duration</th>
            <th>Instructions</th>
        </tr></thead>
        <tbody>{items_html}</tbody>
    </table>

    {notes_html}
    {voided_html}
</div>

</body>
</html>"""


# ---------------------------------------------------------------------------
# Blank prescription
# ---------------------------------------------------------------------------
def _build_blank_prescription_html(
    patient: Patient | None = None,
    date_str: str = "",
) -> str:
    patient_id_display = ""
    patient_name = ""
    ar_name = ""
    if patient:
        patient_id_display = str(patient.legacy_id or str(patient.id)[:8])
        patient_name = patient.full_name
        if patient.full_name_ar:
            ar_name = f'&emsp;<span class="patient-info-ar">{patient.full_name_ar}</span>'
    if not date_str:
        date_str = date.today().strftime("%Y-%m-%d")

    blank_lines = "\n".join('<div class="blank-line"></div>' for _ in range(20))

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><style>{_BASE_CSS}</style></head>
<body>

{_decorations_html()}
{_clinic_footer_html()}

<div class="content">
    {_clinic_header_html()}

    <div class="patient-info">
        <div class="patient-info-row"><span class="patient-info-label">ID</span>: {patient_id_display}</div>
        <div class="patient-info-row"><span class="patient-info-label">Name</span>: {patient_name}{ar_name}</div>
        <div class="patient-info-row"><span class="patient-info-label">Date</span>: {date_str}</div>
    </div>
    <hr class="patient-sep" />

    <div class="rx-mark">R/</div>

    {blank_lines}
</div>

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
    try:
        from weasyprint import HTML
    except ImportError:
        raise RuntimeError("WeasyPrint is not installed.")

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

    med_ids = [item.medication_id for item in prescription.items]
    medications = {}
    if med_ids:
        med_result = await db.execute(select(MedicationMaster).where(MedicationMaster.id.in_(med_ids)))
        medications = {m.id: m for m in med_result.scalars().all()}

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

    prescription.pdf_path = str(filepath)
    await db.commit()
    return str(filepath)


async def generate_blank_prescription_pdf(
    db: AsyncSession,
    patient_id: UUID | None = None,
) -> str:
    try:
        from weasyprint import HTML
    except ImportError:
        raise RuntimeError("WeasyPrint is not installed.")

    patient = None
    if patient_id:
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = result.scalar_one_or_none()

    html_content = _build_blank_prescription_html(patient)

    filename = f"rx_blank_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = UPLOAD_DIR / filename
    HTML(string=html_content).write_pdf(str(filepath))
    return str(filepath)
