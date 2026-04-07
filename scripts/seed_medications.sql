-- ============================================================================
-- CardioClinic: Seed Data - Medications Master & Dosage Instructions
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- ============================================================================

BEGIN;

-- ============================================================================
-- dosage_instructions  (20 common templates)
-- ============================================================================
INSERT INTO dosage_instructions (id, text_en, text_ar, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'Once daily in the morning',           'مرة واحدة يومياً في الصباح',           1,  true),
  (gen_random_uuid(), 'Once daily in the evening',           'مرة واحدة يومياً في المساء',           2,  true),
  (gen_random_uuid(), 'Once daily at bedtime',               'مرة واحدة يومياً عند النوم',           3,  true),
  (gen_random_uuid(), 'Twice daily',                         'مرتين يومياً',                          4,  true),
  (gen_random_uuid(), 'Twice daily with meals',              'مرتين يومياً مع الطعام',                5,  true),
  (gen_random_uuid(), 'Three times daily',                   'ثلاث مرات يومياً',                      6,  true),
  (gen_random_uuid(), 'Three times daily with meals',        'ثلاث مرات يومياً مع الطعام',            7,  true),
  (gen_random_uuid(), 'Four times daily',                    'أربع مرات يومياً',                      8,  true),
  (gen_random_uuid(), 'Every 12 hours',                      'كل 12 ساعة',                            9,  true),
  (gen_random_uuid(), 'Every 8 hours',                       'كل 8 ساعات',                           10,  true),
  (gen_random_uuid(), 'Every 6 hours',                       'كل 6 ساعات',                           11,  true),
  (gen_random_uuid(), 'As needed (PRN)',                     'عند الحاجة',                            12,  true),
  (gen_random_uuid(), 'Once weekly',                         'مرة واحدة أسبوعياً',                    13,  true),
  (gen_random_uuid(), 'Sublingual as needed',                'تحت اللسان عند الحاجة',                14,  true),
  (gen_random_uuid(), 'Before meals',                        'قبل الطعام',                            15,  true),
  (gen_random_uuid(), 'After meals',                         'بعد الطعام',                            16,  true),
  (gen_random_uuid(), 'On empty stomach',                    'على معدة فارغة',                        17,  true),
  (gen_random_uuid(), 'With food',                           'مع الطعام',                             18,  true),
  (gen_random_uuid(), 'At the same time every day',          'في نفس الوقت كل يوم',                  19,  true),
  (gen_random_uuid(), 'Subcutaneous injection once daily',   'حقنة تحت الجلد مرة يومياً',            20,  true)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- medications_master  (48 common cardiology medications)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Antiplatelets
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Aspirin', 'أسبرين', 'Acetylsalicylic acid',
 'Antiplatelets', '81 mg once daily',
 'Active GI bleeding; Aspirin allergy; Severe hepatic impairment; Last trimester of pregnancy',
 '{"Warfarin": "Increased bleeding risk", "Ibuprofen": "May reduce antiplatelet effect of aspirin", "Clopidogrel": "Additive bleeding risk", "Methotrexate": "Increased methotrexate toxicity", "Heparin": "Increased bleeding risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Clopidogrel', 'كلوبيدوغريل', 'Clopidogrel bisulfate',
 'Antiplatelets', '75 mg once daily',
 'Active pathological bleeding; Hypersensitivity to clopidogrel',
 '{"Aspirin": "Additive bleeding risk", "Warfarin": "Increased bleeding risk", "Omeprazole": "Reduced clopidogrel efficacy via CYP2C19 inhibition", "NSAIDs": "Increased GI bleeding risk", "Rivaroxaban": "Increased bleeding risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Ticagrelor', 'تيكاغريلور', 'Ticagrelor',
 'Antiplatelets', '90 mg twice daily',
 'Active pathological bleeding; History of intracranial hemorrhage; Severe hepatic impairment',
 '{"Aspirin": "Doses >100 mg/day reduce ticagrelor effectiveness", "Simvastatin": "Increased simvastatin levels", "Digoxin": "Increased digoxin levels", "CYP3A4 inhibitors": "Increased ticagrelor levels", "CYP3A4 inducers": "Reduced ticagrelor efficacy"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Prasugrel', 'براسوغريل', 'Prasugrel hydrochloride',
 'Antiplatelets', '10 mg once daily',
 'Active pathological bleeding; Prior TIA or stroke; Age >=75 (relative); Body weight <60 kg (relative)',
 '{"Aspirin": "Additive bleeding risk", "Warfarin": "Increased bleeding risk", "NSAIDs": "Increased GI bleeding risk"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Anticoagulants
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Warfarin', 'وارفارين', 'Warfarin sodium',
 'Anticoagulants', '5 mg once daily (adjust per INR)',
 'Active major bleeding; Pregnancy; Severe hepatic disease; Unsupervised patients with high fall risk',
 '{"Aspirin": "Increased bleeding risk", "Amiodarone": "Increased warfarin effect - reduce dose by 30-50%", "Rifampin": "Markedly reduced warfarin effect", "Metronidazole": "Increased warfarin effect", "Vitamin K": "Antagonizes warfarin effect"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Rivaroxaban', 'ريفاروكسابان', 'Rivaroxaban',
 'Anticoagulants', '20 mg once daily with food',
 'Active clinically significant bleeding; Severe hepatic impairment (Child-Pugh C)',
 '{"Aspirin": "Increased bleeding risk", "Clopidogrel": "Increased bleeding risk", "Ketoconazole": "Increased rivaroxaban levels", "Rifampin": "Reduced rivaroxaban efficacy", "Carbamazepine": "Reduced rivaroxaban efficacy"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Apixaban', 'أبيكسابان', 'Apixaban',
 'Anticoagulants', '5 mg twice daily',
 'Active pathological bleeding; Severe hepatic impairment; Prosthetic heart valves',
 '{"Aspirin": "Increased bleeding risk", "Ketoconazole": "Increased apixaban levels", "Rifampin": "Reduced apixaban efficacy", "Diltiazem": "Modest increase in apixaban levels", "NSAIDs": "Increased bleeding risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Heparin', 'هيبارين', 'Unfractionated heparin',
 'Anticoagulants', '5000 units IV bolus then infusion per protocol',
 'Active major bleeding; Severe thrombocytopenia; History of HIT',
 '{"Aspirin": "Increased bleeding risk", "Warfarin": "Additive anticoagulation", "NSAIDs": "Increased bleeding risk", "Thrombolytics": "Markedly increased bleeding risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Enoxaparin', 'إينوكسابارين', 'Enoxaparin sodium',
 'Anticoagulants', '1 mg/kg SC every 12 hours',
 'Active major bleeding; History of HIT with enoxaparin; Severe renal impairment (relative)',
 '{"Aspirin": "Increased bleeding risk", "Warfarin": "Additive anticoagulation", "Clopidogrel": "Increased bleeding risk", "NSAIDs": "Increased bleeding risk", "Thrombolytics": "Markedly increased bleeding risk"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Beta-Blockers
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Metoprolol Succinate', 'ميتوبرولول', 'Metoprolol succinate',
 'Beta-Blockers', '25-50 mg once daily',
 'Severe bradycardia; Heart block (2nd/3rd degree without pacemaker); Decompensated heart failure; Cardiogenic shock',
 '{"Verapamil": "Risk of severe bradycardia and heart block", "Diltiazem": "Additive AV node depression", "Digoxin": "Additive bradycardia", "Clonidine": "Rebound hypertension on withdrawal", "Amiodarone": "Additive bradycardia and AV block"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Bisoprolol', 'بيسوبرولول', 'Bisoprolol fumarate',
 'Beta-Blockers', '2.5-5 mg once daily',
 'Severe bradycardia; Heart block (2nd/3rd degree without pacemaker); Cardiogenic shock; Decompensated heart failure',
 '{"Verapamil": "Risk of severe bradycardia and heart block", "Diltiazem": "Additive AV node depression", "Digoxin": "Additive bradycardia", "Clonidine": "Rebound hypertension on withdrawal", "Amiodarone": "Additive bradycardia"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Carvedilol', 'كارفيديلول', 'Carvedilol',
 'Beta-Blockers', '3.125 mg twice daily',
 'Severe bradycardia; Decompensated heart failure; Severe hepatic impairment; Bronchial asthma; Heart block (2nd/3rd degree)',
 '{"Digoxin": "Increased digoxin levels and additive bradycardia", "Insulin": "Masking of hypoglycemia symptoms", "Diltiazem": "Additive AV node depression", "Rifampin": "Reduced carvedilol levels", "Cyclosporine": "Increased cyclosporine levels"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Atenolol', 'أتينولول', 'Atenolol',
 'Beta-Blockers', '25-50 mg once daily',
 'Severe bradycardia; Heart block (2nd/3rd degree without pacemaker); Cardiogenic shock',
 '{"Verapamil": "Risk of severe bradycardia", "Clonidine": "Rebound hypertension", "Digoxin": "Additive bradycardia"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Propranolol', 'بروبرانولول', 'Propranolol hydrochloride',
 'Beta-Blockers', '40 mg twice daily',
 'Bronchial asthma; Severe bradycardia; Heart block; Cardiogenic shock; Prinzmetal angina',
 '{"Verapamil": "Severe bradycardia and heart block", "Insulin": "Masking of hypoglycemia", "Lidocaine": "Increased lidocaine levels", "Theophylline": "Reduced bronchodilator effect", "Digoxin": "Additive bradycardia"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- ACE Inhibitors
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Enalapril', 'إنالابريل', 'Enalapril maleate',
 'ACE Inhibitors', '5 mg once daily',
 'Pregnancy; History of angioedema with ACE inhibitors; Bilateral renal artery stenosis',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium toxicity", "NSAIDs": "Reduced antihypertensive effect and renal risk", "Sacubitril/Valsartan": "Contraindicated - risk of angioedema (36-hour washout required)"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Ramipril', 'راميبريل', 'Ramipril',
 'ACE Inhibitors', '2.5 mg once daily',
 'Pregnancy; History of angioedema with ACE inhibitors; Bilateral renal artery stenosis',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium toxicity", "NSAIDs": "Reduced antihypertensive effect", "Sacubitril/Valsartan": "Contraindicated - risk of angioedema"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Lisinopril', 'ليسينوبريل', 'Lisinopril',
 'ACE Inhibitors', '5-10 mg once daily',
 'Pregnancy; History of angioedema; Bilateral renal artery stenosis',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium toxicity", "NSAIDs": "Reduced antihypertensive effect and renal risk", "Aliskiren": "Contraindicated in diabetics"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Perindopril', 'بيريندوبريل', 'Perindopril erbumine',
 'ACE Inhibitors', '4 mg once daily',
 'Pregnancy; History of angioedema; Bilateral renal artery stenosis',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium toxicity"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- ARBs (Angiotensin II Receptor Blockers)
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Losartan', 'لوسارتان', 'Losartan potassium',
 'ARBs', '50 mg once daily',
 'Pregnancy; Bilateral renal artery stenosis',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium levels", "NSAIDs": "Reduced antihypertensive effect", "ACE Inhibitors": "Dual RAAS blockade - increased adverse effects"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Valsartan', 'فالسارتان', 'Valsartan',
 'ARBs', '80 mg once daily',
 'Pregnancy; Bilateral renal artery stenosis; Severe hepatic impairment',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium levels", "NSAIDs": "Reduced antihypertensive effect", "ACE Inhibitors": "Dual RAAS blockade - increased adverse effects"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Telmisartan', 'تيلميسارتان', 'Telmisartan',
 'ARBs', '40 mg once daily',
 'Pregnancy; Biliary obstruction; Severe hepatic impairment',
 '{"Potassium supplements": "Risk of hyperkalemia", "Digoxin": "Increased digoxin levels", "Lithium": "Increased lithium levels", "NSAIDs": "Reduced antihypertensive effect"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Candesartan', 'كانديسارتان', 'Candesartan cilexetil',
 'ARBs', '8 mg once daily',
 'Pregnancy; Bilateral renal artery stenosis; Severe hepatic impairment',
 '{"Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "Lithium": "Increased lithium levels"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Calcium Channel Blockers
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Amlodipine', 'أملوديبين', 'Amlodipine besylate',
 'Calcium Channel Blockers', '5 mg once daily',
 'Severe aortic stenosis; Cardiogenic shock; Unstable angina (without beta-blocker)',
 '{"Simvastatin": "Limit simvastatin to 20 mg/day", "Cyclosporine": "Increased cyclosporine levels", "Tacrolimus": "Increased tacrolimus levels", "CYP3A4 inhibitors": "Increased amlodipine levels"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Nifedipine', 'نيفيديبين', 'Nifedipine',
 'Calcium Channel Blockers', '30 mg once daily (extended release)',
 'Cardiogenic shock; Severe aortic stenosis; Acute MI (immediate-release)',
 '{"Beta-Blockers": "Additive hypotension", "Digoxin": "Increased digoxin levels", "Cimetidine": "Increased nifedipine levels", "Rifampin": "Reduced nifedipine efficacy", "Grapefruit juice": "Increased nifedipine levels"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Diltiazem', 'ديلتيازيم', 'Diltiazem hydrochloride',
 'Calcium Channel Blockers', '120 mg once daily (extended release)',
 'Severe bradycardia; Heart block (2nd/3rd degree); Sick sinus syndrome without pacemaker; Acute MI with pulmonary congestion',
 '{"Beta-Blockers": "Risk of severe bradycardia and heart block", "Simvastatin": "Limit simvastatin dose - increased levels", "Cyclosporine": "Increased cyclosporine levels", "Carbamazepine": "Increased carbamazepine toxicity", "Digoxin": "Increased digoxin levels"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Verapamil', 'فيراباميل', 'Verapamil hydrochloride',
 'Calcium Channel Blockers', '120 mg once daily (extended release)',
 'Severe LV dysfunction; Severe bradycardia; Heart block (2nd/3rd degree); Sick sinus syndrome without pacemaker; WPW with atrial fibrillation',
 '{"Beta-Blockers": "Risk of severe bradycardia, heart block, and heart failure", "Digoxin": "Increased digoxin levels by 50-75%", "Simvastatin": "Limit simvastatin to 10 mg/day", "Dantrolene": "Risk of hyperkalemia and cardiovascular collapse", "Lithium": "Neurotoxicity risk"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Statins (HMG-CoA Reductase Inhibitors)
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Atorvastatin', 'أتورفاستاتين', 'Atorvastatin calcium',
 'Statins', '20 mg once daily',
 'Active liver disease; Unexplained persistent elevated transaminases; Pregnancy; Breastfeeding',
 '{"Gemfibrozil": "Increased risk of rhabdomyolysis", "Cyclosporine": "Increased statin levels - risk of myopathy", "Clarithromycin": "Increased atorvastatin levels", "Diltiazem": "Increased atorvastatin levels", "Grapefruit juice": "Increased atorvastatin levels with large quantities"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Rosuvastatin', 'روسوفاستاتين', 'Rosuvastatin calcium',
 'Statins', '10 mg once daily',
 'Active liver disease; Unexplained persistent elevated transaminases; Pregnancy; Breastfeeding; Severe renal impairment (40 mg dose)',
 '{"Gemfibrozil": "Increased risk of rhabdomyolysis", "Cyclosporine": "Markedly increased rosuvastatin levels", "Warfarin": "Increased INR", "Antacids": "Reduced rosuvastatin absorption if given together"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Simvastatin', 'سيمفاستاتين', 'Simvastatin',
 'Statins', '20 mg once daily at bedtime',
 'Active liver disease; Pregnancy; Breastfeeding; Concomitant strong CYP3A4 inhibitors',
 '{"Amiodarone": "Limit simvastatin to 20 mg/day", "Amlodipine": "Limit simvastatin to 20 mg/day", "Diltiazem": "Limit simvastatin to 10 mg/day", "Verapamil": "Limit simvastatin to 10 mg/day", "Gemfibrozil": "Contraindicated combination - rhabdomyolysis risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Pravastatin', 'برافاستاتين', 'Pravastatin sodium',
 'Statins', '40 mg once daily',
 'Active liver disease; Pregnancy; Breastfeeding',
 '{"Gemfibrozil": "Increased risk of myopathy", "Cyclosporine": "Increased pravastatin levels", "Clarithromycin": "Increased pravastatin levels"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Diuretics
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Furosemide', 'فوروسيمايد', 'Furosemide',
 'Diuretics', '20-40 mg once daily',
 'Anuria; Severe hyponatremia; Severe hypokalemia; Hepatic coma',
 '{"Digoxin": "Hypokalemia increases digoxin toxicity", "ACE Inhibitors": "Risk of first-dose hypotension", "Aminoglycosides": "Increased ototoxicity", "Lithium": "Increased lithium toxicity", "NSAIDs": "Reduced diuretic effect"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Hydrochlorothiazide', 'هيدروكلوروثيازيد', 'Hydrochlorothiazide',
 'Diuretics', '12.5-25 mg once daily',
 'Anuria; Severe renal impairment; Sulfonamide allergy; Severe hyponatremia',
 '{"Digoxin": "Hypokalemia increases digoxin toxicity", "Lithium": "Increased lithium toxicity", "NSAIDs": "Reduced diuretic and antihypertensive effect", "Antidiabetics": "May increase blood glucose", "Cholestyramine": "Reduced HCTZ absorption"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Spironolactone', 'سبيرونولاكتون', 'Spironolactone',
 'Diuretics', '25 mg once daily',
 'Hyperkalemia; Severe renal impairment; Addison disease',
 '{"ACE Inhibitors": "Risk of severe hyperkalemia", "ARBs": "Risk of severe hyperkalemia", "Potassium supplements": "Risk of severe hyperkalemia", "Digoxin": "Increased digoxin levels", "NSAIDs": "Reduced diuretic effect and hyperkalemia risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Indapamide', 'إنداباميد', 'Indapamide',
 'Diuretics', '1.5 mg once daily',
 'Severe hepatic impairment; Severe renal failure; Hypokalemia',
 '{"Digoxin": "Hypokalemia increases digoxin toxicity", "Lithium": "Increased lithium toxicity", "NSAIDs": "Reduced antihypertensive effect"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Nitrates & Antianginals
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Nitroglycerin', 'نيتروغليسرين', 'Glyceryl trinitrate',
 'Nitrates', '0.4 mg sublingual PRN',
 'Severe anemia; Increased intracranial pressure; Concomitant PDE5 inhibitors; Severe hypotension',
 '{"Sildenafil": "Severe life-threatening hypotension - contraindicated", "Tadalafil": "Severe life-threatening hypotension - contraindicated", "Amlodipine": "Additive hypotension", "Beta-Blockers": "Additive hypotension", "Alcohol": "Severe additive hypotension"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Isosorbide Mononitrate', 'إيزوسوربيد مونونيترات', 'Isosorbide mononitrate',
 'Nitrates', '30-60 mg once daily (extended release)',
 'Severe anemia; Increased intracranial pressure; Concomitant PDE5 inhibitors; Severe hypotension',
 '{"Sildenafil": "Severe life-threatening hypotension - contraindicated", "Tadalafil": "Severe life-threatening hypotension - contraindicated", "Amlodipine": "Additive hypotension", "Alcohol": "Additive hypotension"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Isosorbide Dinitrate', 'إيزوسوربيد ثنائي النترات', 'Isosorbide dinitrate',
 'Nitrates', '20 mg three times daily (with nitrate-free interval)',
 'Severe anemia; Increased intracranial pressure; Concomitant PDE5 inhibitors',
 '{"Sildenafil": "Severe life-threatening hypotension - contraindicated", "Tadalafil": "Severe life-threatening hypotension - contraindicated", "Hydralazine": "Combination used in heart failure (BiDil)"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Ranolazine', 'رانولازين', 'Ranolazine',
 'Antianginals', '500 mg twice daily',
 'Severe hepatic impairment; Concomitant strong CYP3A4 inhibitors; QT prolongation',
 '{"Simvastatin": "Limit simvastatin dose", "Metformin": "Increased metformin levels", "Digoxin": "Increased digoxin levels", "Diltiazem": "Increased ranolazine levels - limit dose to 500 mg BID", "Ketoconazole": "Contraindicated - markedly increased ranolazine levels"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Antiarrhythmics
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Amiodarone', 'أميودارون', 'Amiodarone hydrochloride',
 'Antiarrhythmics', '200 mg once daily (maintenance)',
 'Severe sinus node dysfunction; Heart block (2nd/3rd degree without pacemaker); Thyroid dysfunction (relative); Iodine allergy',
 '{"Warfarin": "Increases warfarin effect by 30-50% - reduce dose", "Digoxin": "Increases digoxin levels by 70-100% - halve digoxin dose", "Simvastatin": "Limit simvastatin to 20 mg/day - rhabdomyolysis risk", "Beta-Blockers": "Additive bradycardia and AV block", "Diltiazem": "Additive AV block and bradycardia"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Digoxin', 'ديجوكسين', 'Digoxin',
 'Antiarrhythmics', '0.125-0.25 mg once daily',
 'Ventricular fibrillation; Hypertrophic obstructive cardiomyopathy; WPW syndrome; Hypokalemia',
 '{"Amiodarone": "Amiodarone doubles digoxin levels - halve dose", "Verapamil": "Increases digoxin levels by 50-75%", "Spironolactone": "Increases digoxin levels", "Diuretics": "Hypokalemia increases digoxin toxicity", "Quinidine": "Doubles digoxin levels"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Flecainide', 'فليكاينيد', 'Flecainide acetate',
 'Antiarrhythmics', '50-100 mg twice daily',
 'Structural heart disease; Post-MI; Heart failure; Bundle branch block (without pacemaker)',
 '{"Amiodarone": "Increased flecainide levels", "Beta-Blockers": "Additive negative inotropic effect", "Verapamil": "Additive negative inotropic effect", "Digoxin": "Increased digoxin levels"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Heart Failure Medications
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Sacubitril/Valsartan', 'ساكوبيتريل/فالسارتان', 'Sacubitril/Valsartan',
 'Heart Failure', '24/26 mg twice daily (starting dose)',
 'ACE inhibitor use within 36 hours; History of angioedema; Pregnancy; Severe hepatic impairment',
 '{"ACE Inhibitors": "Contraindicated within 36 hours - angioedema risk", "Potassium supplements": "Risk of hyperkalemia", "Spironolactone": "Risk of hyperkalemia", "NSAIDs": "Reduced efficacy and renal risk", "Lithium": "Increased lithium levels"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Ivabradine', 'إيفابرادين', 'Ivabradine hydrochloride',
 'Heart Failure', '5 mg twice daily',
 'Resting HR <70 bpm prior to treatment; Severe hepatic impairment; Sick sinus syndrome; SA block; Acute MI; Severe hypotension',
 '{"Diltiazem": "Contraindicated - additive HR reduction", "Verapamil": "Contraindicated - additive HR reduction", "CYP3A4 inhibitors": "Increased ivabradine levels", "Beta-Blockers": "Additive HR reduction - monitor closely", "QT-prolonging drugs": "Additive QT prolongation risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Hydralazine', 'هيدرالازين', 'Hydralazine hydrochloride',
 'Heart Failure', '25 mg three times daily',
 'Severe tachycardia; High-output heart failure; Mitral valve rheumatic heart disease; Dissecting aortic aneurysm; SLE (relative)',
 '{"Beta-Blockers": "Additive hypotension - may be therapeutic", "Diuretics": "Additive hypotension", "NSAIDs": "Reduced antihypertensive effect"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- SGLT2 Inhibitors (Cardiology indications)
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Empagliflozin', 'إمباغليفلوزين', 'Empagliflozin',
 'SGLT2 Inhibitors', '10 mg once daily',
 'Dialysis; Severe renal impairment (eGFR <20 for HF indication); Type 1 diabetes; Diabetic ketoacidosis',
 '{"Insulin": "Increased risk of hypoglycemia - consider dose reduction", "Diuretics": "Additive diuretic effect - risk of dehydration", "Sulfonylureas": "Increased risk of hypoglycemia", "Lithium": "Increased lithium clearance"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Dapagliflozin', 'داباغليفلوزين', 'Dapagliflozin',
 'SGLT2 Inhibitors', '10 mg once daily',
 'Dialysis; Severe renal impairment (eGFR <20 for HF indication); Type 1 diabetes; Diabetic ketoacidosis',
 '{"Insulin": "Increased risk of hypoglycemia - consider dose reduction", "Diuretics": "Additive diuretic effect - risk of dehydration", "Sulfonylureas": "Increased risk of hypoglycemia", "Lithium": "Increased lithium clearance"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Inotropes / Vasopressors (used in acute cardiac care)
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Dobutamine', 'دوبيوتامين', 'Dobutamine hydrochloride',
 'Inotropes', '2-20 mcg/kg/min IV infusion',
 'Hypertrophic obstructive cardiomyopathy; Idiopathic hypertrophic subaortic stenosis',
 '{"Beta-Blockers": "Antagonize dobutamine effects", "MAO Inhibitors": "Hypertensive crisis risk", "General anesthetics": "Increased risk of arrhythmias"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Dopamine', 'دوبامين', 'Dopamine hydrochloride',
 'Inotropes', '2-20 mcg/kg/min IV infusion (dose-dependent effects)',
 'Pheochromocytoma; Uncorrected tachyarrhythmias; Ventricular fibrillation',
 '{"MAO Inhibitors": "Hypertensive crisis - reduce dose by 90%", "Beta-Blockers": "Antagonize cardiac effects", "Phenytoin": "Hypotension and bradycardia", "General anesthetics": "Increased risk of arrhythmias"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Milrinone', 'ميلرينون', 'Milrinone lactate',
 'Inotropes', '0.375-0.75 mcg/kg/min IV infusion',
 'Severe aortic or pulmonic valve disease; Severe hypovolemia',
 '{"Diuretics": "Additive hypotension and hypokalemia", "Digoxin": "Additive inotropic effect"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- MRA (Mineralocorticoid Receptor Antagonists)
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Eplerenone', 'إبليرينون', 'Eplerenone',
 'MRA', '25 mg once daily',
 'Hyperkalemia (K+ >5.0); Severe renal impairment (CrCl <30); Concomitant strong CYP3A4 inhibitors',
 '{"ACE Inhibitors": "Risk of hyperkalemia - monitor potassium", "ARBs": "Risk of hyperkalemia - monitor potassium", "Potassium supplements": "Risk of severe hyperkalemia", "Ketoconazole": "Contraindicated - markedly increased eplerenone levels", "NSAIDs": "Reduced efficacy and hyperkalemia risk"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Additional commonly used cardiac drugs
-- ---------------------------------------------------------------------------
INSERT INTO medications_master (id, name, name_ar, generic_name, category, default_dosage, contraindications, interactions, is_active, created_at)
VALUES
(gen_random_uuid(),
 'Clopidogrel + Aspirin (DAPT)', 'كلوبيدوغريل + أسبرين', 'Clopidogrel 75 mg + Aspirin 81 mg',
 'Antiplatelets', '75/81 mg once daily',
 'Active pathological bleeding; Severe hepatic impairment',
 '{"Warfarin": "Triple therapy - significantly increased bleeding risk", "Omeprazole": "Reduced clopidogrel efficacy", "NSAIDs": "Increased GI bleeding risk"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Dabigatran', 'دابيغاتران', 'Dabigatran etexilate',
 'Anticoagulants', '150 mg twice daily',
 'Active pathological bleeding; Prosthetic heart valves; Severe renal impairment (CrCl <30)',
 '{"P-gp inhibitors": "Increased dabigatran levels", "Rifampin": "Reduced dabigatran efficacy", "Aspirin": "Increased bleeding risk", "Ketoconazole": "Increased dabigatran levels - contraindicated in renal impairment", "Amiodarone": "Increased dabigatran levels by 12-60%"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Trimetazidine', 'تريميتازيدين', 'Trimetazidine dihydrochloride',
 'Antianginals', '35 mg twice daily (modified release)',
 'Parkinson disease; Parkinsonian symptoms; Severe renal impairment',
 '{"No clinically significant interactions documented": "Generally well tolerated in combination therapy"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Nicorandil', 'نيكورانديل', 'Nicorandil',
 'Antianginals', '10-20 mg twice daily',
 'Cardiogenic shock; LV failure with low filling pressures; Hypotension; Concomitant PDE5 inhibitors',
 '{"Sildenafil": "Severe hypotension - contraindicated", "Tadalafil": "Severe hypotension - contraindicated", "Nitrates": "Additive hypotension", "Antihypertensives": "Additive hypotension"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Adenosine', 'أدينوسين', 'Adenosine',
 'Antiarrhythmics', '6 mg rapid IV push (may repeat 12 mg)',
 'Heart block (2nd/3rd degree without pacemaker); Sick sinus syndrome; Severe asthma or COPD',
 '{"Dipyridamole": "Potentiates adenosine effect - reduce dose", "Carbamazepine": "Increased heart block risk", "Theophylline": "Antagonizes adenosine effect - higher doses needed", "Caffeine": "Antagonizes adenosine effect"}'::jsonb,
 true, now()),

(gen_random_uuid(),
 'Fondaparinux', 'فوندابارينوكس', 'Fondaparinux sodium',
 'Anticoagulants', '2.5 mg SC once daily',
 'Active major bleeding; Severe renal impairment (CrCl <20); Bacterial endocarditis; Body weight <50 kg (for treatment doses)',
 '{"Aspirin": "Increased bleeding risk", "Warfarin": "Additive anticoagulation", "NSAIDs": "Increased bleeding risk", "Thrombolytics": "Markedly increased bleeding risk"}'::jsonb,
 true, now())

ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- Verification queries (optional - uncomment to check counts)
-- ============================================================================
-- SELECT 'medications_master' AS table_name, COUNT(*) AS row_count FROM medications_master
-- UNION ALL
-- SELECT 'dosage_instructions', COUNT(*) FROM dosage_instructions;
