-- ============================================================================
-- CardioClinic: Seed Data - Egyptian Brand Name Medications
-- Maps international cardiac drugs to their Egyptian brand equivalents.
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- ============================================================================

BEGIN;

-- Uses name (Egyptian brand) + generic_name (international/INN name)
-- ON CONFLICT on name to avoid duplicates

INSERT INTO medications_master (id, name, generic_name, category, default_dosage, is_active, created_at)
VALUES
  -- Beta Blockers
  (gen_random_uuid(), 'Concor', 'Bisoprolol', 'Beta Adrenergic Blocker', '5 mg once daily', true, now()),
  (gen_random_uuid(), 'Concor Plus', 'Bisoprolol/HCTZ', 'Beta Adrenergic Blocker', '5/12.5 mg once daily', true, now()),
  (gen_random_uuid(), 'Nebilet', 'Nebivolol', 'Beta Adrenergic Blocker', '5 mg once daily', true, now()),
  (gen_random_uuid(), 'Tenormin', 'Atenolol', 'Beta Adrenergic Blocker', '50 mg once daily', true, now()),
  (gen_random_uuid(), 'Inderal', 'Propranolol', 'Beta Adrenergic Blocker', '40 mg twice daily', true, now()),
  (gen_random_uuid(), 'Dilatrend', 'Carvedilol', 'Beta Adrenergic Blocker', '6.25 mg twice daily', true, now()),

  -- ARBs
  (gen_random_uuid(), 'Coaprovel', 'Irbesartan/HCTZ', 'Angiotensin 2 Receptor Blocker', '150/12.5 mg once daily', true, now()),
  (gen_random_uuid(), 'Aprovel', 'Irbesartan', 'Angiotensin 2 Receptor Blocker', '150 mg once daily', true, now()),
  (gen_random_uuid(), 'Atacand', 'Candesartan', 'Angiotensin 2 Receptor Blocker', '8 mg once daily', true, now()),
  (gen_random_uuid(), 'Atacand Plus', 'Candesartan/HCTZ', 'Angiotensin 2 Receptor Blocker', '16/12.5 mg once daily', true, now()),
  (gen_random_uuid(), 'Diovan', 'Valsartan', 'Angiotensin 2 Receptor Blocker', '80 mg once daily', true, now()),
  (gen_random_uuid(), 'Co-Diovan', 'Valsartan/HCTZ', 'Angiotensin 2 Receptor Blocker', '80/12.5 mg once daily', true, now()),
  (gen_random_uuid(), 'Micardis', 'Telmisartan', 'Angiotensin 2 Receptor Blocker', '40 mg once daily', true, now()),
  (gen_random_uuid(), 'Olmetec', 'Olmesartan', 'Angiotensin 2 Receptor Blocker', '20 mg once daily', true, now()),

  -- ACE Inhibitors
  (gen_random_uuid(), 'Tritace', 'Ramipril', 'Angiotensin Converting Enzyme Inhibitor', '5 mg once daily', true, now()),
  (gen_random_uuid(), 'Coversyl', 'Perindopril', 'Angiotensin Converting Enzyme Inhibitor', '5 mg once daily', true, now()),
  (gen_random_uuid(), 'Zestril', 'Lisinopril', 'Angiotensin Converting Enzyme Inhibitor', '10 mg once daily', true, now()),
  (gen_random_uuid(), 'Capoten', 'Captopril', 'Angiotensin Converting Enzyme Inhibitor', '25 mg twice daily', true, now()),

  -- Calcium Channel Blockers
  (gen_random_uuid(), 'Norvasc', 'Amlodipine', 'Calcium Channel Blocker', '5 mg once daily', true, now()),
  (gen_random_uuid(), 'Isoptin', 'Verapamil', 'Calcium Channel Blocker', '80 mg three times daily', true, now()),
  (gen_random_uuid(), 'Isoptin SR', 'Verapamil SR', 'Calcium Channel Blocker', '240 mg once daily', true, now()),

  -- Antiplatelets
  (gen_random_uuid(), 'Plavix', 'Clopidogrel', 'Platelet Aggregation Inhibitor', '75 mg once daily', true, now()),
  (gen_random_uuid(), 'Brilinta', 'Ticagrelor', 'Platelet Aggregation Inhibitor', '90 mg twice daily', true, now()),

  -- Statins
  (gen_random_uuid(), 'Lipitor', 'Atorvastatin', 'HMG-CoA Reductase Inhibitor', '20 mg once daily', true, now()),
  (gen_random_uuid(), 'Crestor', 'Rosuvastatin', 'HMG-CoA Reductase Inhibitor', '10 mg once daily', true, now()),
  (gen_random_uuid(), 'Zocor', 'Simvastatin', 'HMG-CoA Reductase Inhibitor', '20 mg once daily at bedtime', true, now()),

  -- Diuretics
  (gen_random_uuid(), 'Lasix', 'Furosemide', 'Loop Diuretic', '40 mg once daily', true, now()),
  (gen_random_uuid(), 'Aldactone', 'Spironolactone', 'Potassium Sparing Diuretic', '25 mg once daily', true, now()),
  (gen_random_uuid(), 'Inspra', 'Eplerenone', 'Potassium Sparing Diuretic', '25 mg once daily', true, now()),

  -- Antiarrhythmics & Cardiac Glycosides
  (gen_random_uuid(), 'Cordarone', 'Amiodarone', 'Antiarrhythmic', '200 mg once daily', true, now()),
  (gen_random_uuid(), 'Lanoxin', 'Digoxin', 'Cardiac Glycoside', '0.25 mg once daily', true, now()),
  (gen_random_uuid(), 'Procoralan', 'Ivabradine', 'Heart Rate Reducer', '5 mg twice daily', true, now()),

  -- ARNI (Neprilysin Inhibitor)
  (gen_random_uuid(), 'Entresto', 'Sacubitril/Valsartan', 'Neprilysin Inhibitor', '49/51 mg twice daily', true, now()),

  -- Anticoagulants
  (gen_random_uuid(), 'Xarelto', 'Rivaroxaban', 'Anticoagulant', '20 mg once daily with food', true, now()),
  (gen_random_uuid(), 'Eliquis', 'Apixaban', 'Anticoagulant', '5 mg twice daily', true, now()),
  (gen_random_uuid(), 'Clexane', 'Enoxaparin', 'Anticoagulant', '40 mg SC once daily', true, now()),
  (gen_random_uuid(), 'Marevan', 'Warfarin', 'Anticoagulant', '5 mg once daily', true, now()),

  -- SGLT2 Inhibitors
  (gen_random_uuid(), 'Jardiance', 'Empagliflozin', 'SGLT2 Inhibitor', '10 mg once daily', true, now()),
  (gen_random_uuid(), 'Forxiga', 'Dapagliflozin', 'SGLT2 Inhibitor', '10 mg once daily', true, now()),

  -- Nitrates / Vasodilators
  (gen_random_uuid(), 'Imdur', 'Isosorbide Mononitrate', 'Nitrate Vasodilator', '30 mg once daily', true, now()),
  (gen_random_uuid(), 'Effox', 'Isosorbide-5-Mononitrate', 'Nitrate Vasodilator', '20 mg twice daily', true, now()),
  (gen_random_uuid(), 'Nitromak', 'Nitroglycerin', 'Nitrate Vasodilator', '2.5 mg twice daily', true, now())

ON CONFLICT DO NOTHING;

COMMIT;
