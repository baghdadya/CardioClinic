"""
Seed script for CardioClinic.
Populates medications_master and dosage_instructions with common cardiology data.

Usage:
  cd backend
  python scripts/seed_data.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import async_session, engine
from app.core.security import hash_password
from app.models.dosage_instruction import DosageInstruction
from app.models.enums import UserRole
from app.models.medication import MedicationMaster
from app.models.user import User


MEDICATIONS = [
    # Antihypertensives
    {"name": "Amlodipine", "name_ar": "أملوديبين", "generic_name": "Amlodipine Besylate", "category": "Calcium Channel Blocker", "default_dosage": "5mg"},
    {"name": "Lisinopril", "name_ar": "ليزينوبريل", "generic_name": "Lisinopril", "category": "ACE Inhibitor", "default_dosage": "10mg"},
    {"name": "Losartan", "name_ar": "لوسارتان", "generic_name": "Losartan Potassium", "category": "ARB", "default_dosage": "50mg"},
    {"name": "Valsartan", "name_ar": "فالسارتان", "generic_name": "Valsartan", "category": "ARB", "default_dosage": "80mg"},
    {"name": "Ramipril", "name_ar": "راميبريل", "generic_name": "Ramipril", "category": "ACE Inhibitor", "default_dosage": "5mg"},
    {"name": "Enalapril", "name_ar": "إنالابريل", "generic_name": "Enalapril Maleate", "category": "ACE Inhibitor", "default_dosage": "10mg"},
    {"name": "Bisoprolol", "name_ar": "بيسوبرولول", "generic_name": "Bisoprolol Fumarate", "category": "Beta Blocker", "default_dosage": "5mg"},
    {"name": "Metoprolol", "name_ar": "ميتوبرولول", "generic_name": "Metoprolol Succinate", "category": "Beta Blocker", "default_dosage": "50mg"},
    {"name": "Carvedilol", "name_ar": "كارفيديلول", "generic_name": "Carvedilol", "category": "Beta Blocker", "default_dosage": "12.5mg"},
    {"name": "Atenolol", "name_ar": "أتينولول", "generic_name": "Atenolol", "category": "Beta Blocker", "default_dosage": "50mg"},
    {"name": "Hydrochlorothiazide", "name_ar": "هيدروكلوروثيازيد", "generic_name": "Hydrochlorothiazide", "category": "Thiazide Diuretic", "default_dosage": "25mg"},
    {"name": "Indapamide", "name_ar": "إنداباميد", "generic_name": "Indapamide", "category": "Thiazide-like Diuretic", "default_dosage": "1.5mg"},
    {"name": "Furosemide", "name_ar": "فوروسيميد", "generic_name": "Furosemide", "category": "Loop Diuretic", "default_dosage": "40mg"},
    {"name": "Spironolactone", "name_ar": "سبيرونولاكتون", "generic_name": "Spironolactone", "category": "Potassium-Sparing Diuretic", "default_dosage": "25mg"},

    # Anticoagulants & Antiplatelets
    {"name": "Aspirin", "name_ar": "أسبرين", "generic_name": "Acetylsalicylic Acid", "category": "Antiplatelet", "default_dosage": "81mg"},
    {"name": "Clopidogrel", "name_ar": "كلوبيدوجريل", "generic_name": "Clopidogrel Bisulfate", "category": "Antiplatelet", "default_dosage": "75mg"},
    {"name": "Ticagrelor", "name_ar": "تيكاجريلور", "generic_name": "Ticagrelor", "category": "Antiplatelet", "default_dosage": "90mg"},
    {"name": "Warfarin", "name_ar": "وارفارين", "generic_name": "Warfarin Sodium", "category": "Anticoagulant", "default_dosage": "5mg"},
    {"name": "Rivaroxaban", "name_ar": "ريفاروكسابان", "generic_name": "Rivaroxaban", "category": "NOAC", "default_dosage": "20mg"},
    {"name": "Apixaban", "name_ar": "أبيكسابان", "generic_name": "Apixaban", "category": "NOAC", "default_dosage": "5mg"},
    {"name": "Dabigatran", "name_ar": "دابيجاتران", "generic_name": "Dabigatran Etexilate", "category": "NOAC", "default_dosage": "150mg"},
    {"name": "Enoxaparin", "name_ar": "إينوكسابارين", "generic_name": "Enoxaparin Sodium", "category": "LMWH", "default_dosage": "40mg SC"},

    # Statins & Lipid-lowering
    {"name": "Atorvastatin", "name_ar": "أتورفاستاتين", "generic_name": "Atorvastatin Calcium", "category": "Statin", "default_dosage": "20mg"},
    {"name": "Rosuvastatin", "name_ar": "روسوفاستاتين", "generic_name": "Rosuvastatin Calcium", "category": "Statin", "default_dosage": "10mg"},
    {"name": "Simvastatin", "name_ar": "سيمفاستاتين", "generic_name": "Simvastatin", "category": "Statin", "default_dosage": "20mg"},
    {"name": "Ezetimibe", "name_ar": "إيزيتيميب", "generic_name": "Ezetimibe", "category": "Cholesterol Absorption Inhibitor", "default_dosage": "10mg"},
    {"name": "Fenofibrate", "name_ar": "فينوفيبرات", "generic_name": "Fenofibrate", "category": "Fibrate", "default_dosage": "145mg"},

    # Antiarrhythmics
    {"name": "Amiodarone", "name_ar": "أميودارون", "generic_name": "Amiodarone HCl", "category": "Antiarrhythmic", "default_dosage": "200mg"},
    {"name": "Digoxin", "name_ar": "ديجوكسين", "generic_name": "Digoxin", "category": "Cardiac Glycoside", "default_dosage": "0.25mg"},
    {"name": "Flecainide", "name_ar": "فليكاينيد", "generic_name": "Flecainide Acetate", "category": "Antiarrhythmic", "default_dosage": "100mg"},
    {"name": "Propafenone", "name_ar": "بروبافينون", "generic_name": "Propafenone HCl", "category": "Antiarrhythmic", "default_dosage": "150mg"},

    # Nitrates & Antianginals
    {"name": "Isosorbide Mononitrate", "name_ar": "إيزوسوربيد مونونيترات", "generic_name": "Isosorbide Mononitrate", "category": "Nitrate", "default_dosage": "30mg"},
    {"name": "Nitroglycerin", "name_ar": "نيتروجليسرين", "generic_name": "Nitroglycerin", "category": "Nitrate", "default_dosage": "0.4mg SL"},
    {"name": "Ranolazine", "name_ar": "رانولازين", "generic_name": "Ranolazine", "category": "Antianginal", "default_dosage": "500mg"},
    {"name": "Ivabradine", "name_ar": "إيفابرادين", "generic_name": "Ivabradine", "category": "If Channel Inhibitor", "default_dosage": "5mg"},

    # Heart Failure
    {"name": "Sacubitril/Valsartan", "name_ar": "ساكوبيتريل/فالسارتان", "generic_name": "Sacubitril/Valsartan", "category": "ARNI", "default_dosage": "49/51mg"},
    {"name": "Dapagliflozin", "name_ar": "داباجليفلوزين", "generic_name": "Dapagliflozin", "category": "SGLT2 Inhibitor", "default_dosage": "10mg"},
    {"name": "Empagliflozin", "name_ar": "إمباجليفلوزين", "generic_name": "Empagliflozin", "category": "SGLT2 Inhibitor", "default_dosage": "10mg"},
    {"name": "Hydralazine", "name_ar": "هيدرالازين", "generic_name": "Hydralazine HCl", "category": "Vasodilator", "default_dosage": "25mg"},

    # Other Cardiovascular
    {"name": "Nifedipine", "name_ar": "نيفيديبين", "generic_name": "Nifedipine", "category": "Calcium Channel Blocker", "default_dosage": "30mg"},
    {"name": "Diltiazem", "name_ar": "ديلتيازيم", "generic_name": "Diltiazem HCl", "category": "Calcium Channel Blocker", "default_dosage": "120mg"},
    {"name": "Verapamil", "name_ar": "فيراباميل", "generic_name": "Verapamil HCl", "category": "Calcium Channel Blocker", "default_dosage": "120mg"},
    {"name": "Potassium Chloride", "name_ar": "كلوريد البوتاسيوم", "generic_name": "Potassium Chloride", "category": "Electrolyte", "default_dosage": "600mg"},
    {"name": "Magnesium Oxide", "name_ar": "أكسيد المغنيسيوم", "generic_name": "Magnesium Oxide", "category": "Electrolyte", "default_dosage": "400mg"},

    # Common Co-prescriptions
    {"name": "Omeprazole", "name_ar": "أوميبرازول", "generic_name": "Omeprazole", "category": "PPI", "default_dosage": "20mg"},
    {"name": "Pantoprazole", "name_ar": "بانتوبرازول", "generic_name": "Pantoprazole Sodium", "category": "PPI", "default_dosage": "40mg"},
    {"name": "Metformin", "name_ar": "ميتفورمين", "generic_name": "Metformin HCl", "category": "Antidiabetic", "default_dosage": "500mg"},
    {"name": "Insulin Glargine", "name_ar": "إنسولين جلارجين", "generic_name": "Insulin Glargine", "category": "Insulin", "default_dosage": "10 units SC"},
    {"name": "Levothyroxine", "name_ar": "ليفوثيروكسين", "generic_name": "Levothyroxine Sodium", "category": "Thyroid Hormone", "default_dosage": "50mcg"},
    {"name": "Allopurinol", "name_ar": "ألوبيورينول", "generic_name": "Allopurinol", "category": "Xanthine Oxidase Inhibitor", "default_dosage": "100mg"},
]

DOSAGE_INSTRUCTIONS = [
    {"text_en": "Once daily in the morning", "text_ar": "مرة واحدة يومياً في الصباح", "sort_order": 1},
    {"text_en": "Once daily at bedtime", "text_ar": "مرة واحدة يومياً عند النوم", "sort_order": 2},
    {"text_en": "Once daily", "text_ar": "مرة واحدة يومياً", "sort_order": 3},
    {"text_en": "Twice daily", "text_ar": "مرتين يومياً", "sort_order": 4},
    {"text_en": "Three times daily", "text_ar": "ثلاث مرات يومياً", "sort_order": 5},
    {"text_en": "Four times daily", "text_ar": "أربع مرات يومياً", "sort_order": 6},
    {"text_en": "Every 8 hours", "text_ar": "كل ٨ ساعات", "sort_order": 7},
    {"text_en": "Every 12 hours", "text_ar": "كل ١٢ ساعة", "sort_order": 8},
    {"text_en": "Before meals", "text_ar": "قبل الأكل", "sort_order": 9},
    {"text_en": "After meals", "text_ar": "بعد الأكل", "sort_order": 10},
    {"text_en": "With food", "text_ar": "مع الطعام", "sort_order": 11},
    {"text_en": "On an empty stomach", "text_ar": "على معدة فارغة", "sort_order": 12},
    {"text_en": "As needed (PRN)", "text_ar": "عند الحاجة", "sort_order": 13},
    {"text_en": "Under the tongue (sublingual)", "text_ar": "تحت اللسان", "sort_order": 14},
    {"text_en": "Subcutaneous injection", "text_ar": "حقن تحت الجلد", "sort_order": 15},
    {"text_en": "Half tablet daily", "text_ar": "نصف قرص يومياً", "sort_order": 16},
    {"text_en": "One tablet daily", "text_ar": "قرص واحد يومياً", "sort_order": 17},
    {"text_en": "Two tablets daily", "text_ar": "قرصين يومياً", "sort_order": 18},
    {"text_en": "Before breakfast", "text_ar": "قبل الإفطار", "sort_order": 19},
    {"text_en": "Before lunch and dinner", "text_ar": "قبل الغداء والعشاء", "sort_order": 20},
    {"text_en": "Do not crush or chew", "text_ar": "لا تسحق أو تمضغ", "sort_order": 21},
    {"text_en": "Take with plenty of water", "text_ar": "تناول مع كمية كافية من الماء", "sort_order": 22},
    {"text_en": "Avoid grapefruit juice", "text_ar": "تجنب عصير الجريب فروت", "sort_order": 23},
    {"text_en": "Monitor blood pressure regularly", "text_ar": "راقب ضغط الدم بانتظام", "sort_order": 24},
    {"text_en": "Report any unusual bleeding", "text_ar": "أبلغ عن أي نزيف غير طبيعي", "sort_order": 25},
]


async def seed():
    async with async_session() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        med_count = (await db.execute(select(func.count()).select_from(MedicationMaster))).scalar_one()
        if med_count > 0:
            print(f"Database already has {med_count} medications. Skipping seed.")
            return

        # Seed medications
        for med_data in MEDICATIONS:
            db.add(MedicationMaster(**med_data))
        print(f"Seeded {len(MEDICATIONS)} medications")

        # Seed dosage instructions
        for instr_data in DOSAGE_INSTRUCTIONS:
            db.add(DosageInstruction(**instr_data))
        print(f"Seeded {len(DOSAGE_INSTRUCTIONS)} dosage instructions")

        # Create default doctor user if none exists
        user_count = (await db.execute(select(func.count()).select_from(User))).scalar_one()
        if user_count == 0:
            doctor = User(
                email="doctor@cardioclinic.com",
                password_hash=hash_password("CardioClinic2026!"),
                full_name="Dr. Ahmed",
                role=UserRole.doctor,
            )
            db.add(doctor)
            print("Created default doctor: doctor@cardioclinic.com / CardioClinic2026!")

        await db.commit()
        print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
