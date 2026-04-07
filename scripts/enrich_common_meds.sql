-- ============================================================================
-- CardioClinic: Bulk-enrich legacy medications with generic names & categories
-- Targets ~1,500 bare-name records imported from the legacy VB6 DBHT.mdb
--
-- Uses ILIKE for fuzzy brand-name matching so "Adalat LA 30 tab" matches '%adalat%'.
-- Only updates rows where generic_name IS NULL (safe to re-run).
--
-- Run via:  docker compose exec -T db psql -U cardioclinic -d cardioclinic < scripts/enrich_common_meds.sql
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ACE Inhibitors
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Captopril',     category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '25 mg twice daily'    WHERE name ILIKE '%capoten%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Enalapril',     category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '10 mg once daily'     WHERE name ILIKE '%renitec%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Enalapril',     category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '10 mg once daily'     WHERE name ILIKE '%ezapril%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lisinopril',    category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '10 mg once daily'     WHERE name ILIKE '%zestril%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lisinopril',    category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '10 mg once daily'     WHERE name ILIKE '%sinopril%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ramipril',      category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '5 mg once daily'      WHERE name ILIKE '%tritace%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ramipril',      category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '5 mg once daily'      WHERE name ILIKE '%ramipril%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Perindopril',   category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '5 mg once daily'      WHERE name ILIKE '%coversyl%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Perindopril',   category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '5 mg once daily'      WHERE name ILIKE '%coverex%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fosinopril',    category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '20 mg once daily'     WHERE name ILIKE '%monopril%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Quinapril',     category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '20 mg once daily'     WHERE name ILIKE '%accupril%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Benazepril',    category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '10 mg once daily'     WHERE name ILIKE '%lotensin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Cilazapril',    category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '2.5 mg once daily'    WHERE name ILIKE '%inhibace%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Trandolapril',  category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '2 mg once daily'      WHERE name ILIKE '%gopten%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Perindopril/Amlodipine', category = 'Angiotensin Converting Enzyme Inhibitor', default_dosage = '5/5 mg once daily' WHERE name ILIKE '%coveram%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ARBs (Angiotensin II Receptor Blockers)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Candesartan',       category = 'Angiotensin 2 Receptor Blocker', default_dosage = '8 mg once daily'       WHERE name ILIKE '%atacand%'   AND generic_name IS NULL AND name NOT ILIKE '%plus%';
UPDATE medications_master SET generic_name = 'Candesartan/HCTZ',  category = 'Angiotensin 2 Receptor Blocker', default_dosage = '16/12.5 mg once daily' WHERE name ILIKE '%atacand%plus%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Losartan',          category = 'Angiotensin 2 Receptor Blocker', default_dosage = '50 mg once daily'      WHERE name ILIKE '%cozaar%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Losartan',          category = 'Angiotensin 2 Receptor Blocker', default_dosage = '50 mg once daily'      WHERE name ILIKE '%lozar%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Losartan/HCTZ',     category = 'Angiotensin 2 Receptor Blocker', default_dosage = '50/12.5 mg once daily' WHERE name ILIKE '%hyzaar%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Valsartan',         category = 'Angiotensin 2 Receptor Blocker', default_dosage = '80 mg once daily'      WHERE name ILIKE '%diovan%'    AND generic_name IS NULL AND name NOT ILIKE '%co-%';
UPDATE medications_master SET generic_name = 'Valsartan/HCTZ',    category = 'Angiotensin 2 Receptor Blocker', default_dosage = '80/12.5 mg once daily' WHERE name ILIKE '%co-diovan%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Valsartan',         category = 'Angiotensin 2 Receptor Blocker', default_dosage = '80 mg once daily'      WHERE name ILIKE '%tareg%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Irbesartan',        category = 'Angiotensin 2 Receptor Blocker', default_dosage = '150 mg once daily'     WHERE name ILIKE '%aprovel%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Irbesartan/HCTZ',   category = 'Angiotensin 2 Receptor Blocker', default_dosage = '150/12.5 mg once daily' WHERE name ILIKE '%coaprovel%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Telmisartan',       category = 'Angiotensin 2 Receptor Blocker', default_dosage = '40 mg once daily'      WHERE name ILIKE '%micardis%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Telmisartan',       category = 'Angiotensin 2 Receptor Blocker', default_dosage = '40 mg once daily'      WHERE name ILIKE '%telma%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Olmesartan',        category = 'Angiotensin 2 Receptor Blocker', default_dosage = '20 mg once daily'      WHERE name ILIKE '%olmetec%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Olmesartan',        category = 'Angiotensin 2 Receptor Blocker', default_dosage = '20 mg once daily'      WHERE name ILIKE '%benicar%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Azilsartan',        category = 'Angiotensin 2 Receptor Blocker', default_dosage = '40 mg once daily'      WHERE name ILIKE '%edarbi%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Eprosartan',        category = 'Angiotensin 2 Receptor Blocker', default_dosage = '600 mg once daily'     WHERE name ILIKE '%teveten%'   AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Beta Blockers
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Bisoprolol',        category = 'Beta Adrenergic Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%concor%'    AND generic_name IS NULL AND name NOT ILIKE '%plus%';
UPDATE medications_master SET generic_name = 'Bisoprolol/HCTZ',   category = 'Beta Adrenergic Blocker', default_dosage = '5/12.5 mg once daily'  WHERE name ILIKE '%concor%plus%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Bisoprolol',        category = 'Beta Adrenergic Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%bisoprolol%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Atenolol',          category = 'Beta Adrenergic Blocker', default_dosage = '50 mg once daily'      WHERE name ILIKE '%tenormin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Atenolol',          category = 'Beta Adrenergic Blocker', default_dosage = '50 mg once daily'      WHERE name ILIKE '%atenolol%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Atenolol',          category = 'Beta Adrenergic Blocker', default_dosage = '50 mg once daily'      WHERE name ILIKE '%blokium%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Propranolol',       category = 'Beta Adrenergic Blocker', default_dosage = '40 mg twice daily'     WHERE name ILIKE '%inderal%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Metoprolol',        category = 'Beta Adrenergic Blocker', default_dosage = '50 mg twice daily'     WHERE name ILIKE '%betaloc%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Metoprolol',        category = 'Beta Adrenergic Blocker', default_dosage = '50 mg twice daily'     WHERE name ILIKE '%lopressor%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Metoprolol',        category = 'Beta Adrenergic Blocker', default_dosage = '50 mg twice daily'     WHERE name ILIKE '%seloken%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nebivolol',         category = 'Beta Adrenergic Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%nebilet%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nebivolol',         category = 'Beta Adrenergic Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%nebilong%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Carvedilol',        category = 'Beta Adrenergic Blocker', default_dosage = '6.25 mg twice daily'   WHERE name ILIKE '%dilatrend%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Carvedilol',        category = 'Beta Adrenergic Blocker', default_dosage = '6.25 mg twice daily'   WHERE name ILIKE '%carvid%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Carvedilol',        category = 'Beta Adrenergic Blocker', default_dosage = '6.25 mg twice daily'   WHERE name ILIKE '%carvedilol%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Labetalol',         category = 'Beta Adrenergic Blocker', default_dosage = '100 mg twice daily'    WHERE name ILIKE '%trandate%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sotalol',           category = 'Beta Adrenergic Blocker', default_dosage = '80 mg twice daily'     WHERE name ILIKE '%sotacor%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sotalol',           category = 'Beta Adrenergic Blocker', default_dosage = '80 mg twice daily'     WHERE name ILIKE '%sotalol%'   AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Calcium Channel Blockers
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Nifedipine',    category = 'Calcium Channel Blocker', default_dosage = '30 mg once daily'      WHERE name ILIKE '%adalat%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nifedipine',    category = 'Calcium Channel Blocker', default_dosage = '30 mg once daily'      WHERE name ILIKE '%epilat%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amlodipine',    category = 'Calcium Channel Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%norvasc%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amlodipine',    category = 'Calcium Channel Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%amlodipine%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amlodipine',    category = 'Calcium Channel Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%amlor%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amlodipine',    category = 'Calcium Channel Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%myodura%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Verapamil',     category = 'Calcium Channel Blocker', default_dosage = '80 mg three times daily' WHERE name ILIKE '%isoptin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Verapamil',     category = 'Calcium Channel Blocker', default_dosage = '80 mg three times daily' WHERE name ILIKE '%verapamil%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diltiazem',     category = 'Calcium Channel Blocker', default_dosage = '60 mg three times daily' WHERE name ILIKE '%tildi%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diltiazem',     category = 'Calcium Channel Blocker', default_dosage = '60 mg three times daily' WHERE name ILIKE '%altiazem%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diltiazem',     category = 'Calcium Channel Blocker', default_dosage = '60 mg three times daily' WHERE name ILIKE '%diltiazem%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Felodipine',    category = 'Calcium Channel Blocker', default_dosage = '5 mg once daily'       WHERE name ILIKE '%plendil%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lercanidipine', category = 'Calcium Channel Blocker', default_dosage = '10 mg once daily'      WHERE name ILIKE '%lercapress%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lercanidipine', category = 'Calcium Channel Blocker', default_dosage = '10 mg once daily'      WHERE name ILIKE '%zanidip%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amlodipine/Valsartan', category = 'Calcium Channel Blocker', default_dosage = '5/160 mg once daily' WHERE name ILIKE '%exforge%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Statins (HMG-CoA Reductase Inhibitors)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Atorvastatin',  category = 'HMG-CoA Reductase Inhibitor', default_dosage = '20 mg once daily'         WHERE name ILIKE '%lipitor%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Atorvastatin',  category = 'HMG-CoA Reductase Inhibitor', default_dosage = '20 mg once daily'         WHERE name ILIKE '%ator%'       AND generic_name IS NULL AND name NOT ILIKE '%atorex%';
UPDATE medications_master SET generic_name = 'Atorvastatin',  category = 'HMG-CoA Reductase Inhibitor', default_dosage = '20 mg once daily'         WHERE name ILIKE '%lipicure%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Rosuvastatin',  category = 'HMG-CoA Reductase Inhibitor', default_dosage = '10 mg once daily'         WHERE name ILIKE '%crestor%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Rosuvastatin',  category = 'HMG-CoA Reductase Inhibitor', default_dosage = '10 mg once daily'         WHERE name ILIKE '%rosuva%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Simvastatin',   category = 'HMG-CoA Reductase Inhibitor', default_dosage = '20 mg once daily at bedtime' WHERE name ILIKE '%zocor%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Simvastatin',   category = 'HMG-CoA Reductase Inhibitor', default_dosage = '20 mg once daily at bedtime' WHERE name ILIKE '%simvast%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pravastatin',   category = 'HMG-CoA Reductase Inhibitor', default_dosage = '40 mg once daily at bedtime' WHERE name ILIKE '%pravachol%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fluvastatin',   category = 'HMG-CoA Reductase Inhibitor', default_dosage = '40 mg once daily at bedtime' WHERE name ILIKE '%lescol%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pitavastatin',  category = 'HMG-CoA Reductase Inhibitor', default_dosage = '2 mg once daily'          WHERE name ILIKE '%livalo%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ezetimibe',     category = 'Cholesterol Absorption Inhibitor',  default_dosage = '10 mg once daily'    WHERE name ILIKE '%ezetrol%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ezetimibe',     category = 'Cholesterol Absorption Inhibitor',  default_dosage = '10 mg once daily'    WHERE name ILIKE '%zetia%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ezetimibe/Simvastatin', category = 'HMG-CoA Reductase Inhibitor', default_dosage = '10/20 mg once daily' WHERE name ILIKE '%inegy%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ezetimibe/Simvastatin', category = 'HMG-CoA Reductase Inhibitor', default_dosage = '10/20 mg once daily' WHERE name ILIKE '%vytorin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fenofibrate',   category = 'Fibrate', default_dosage = '200 mg once daily'                             WHERE name ILIKE '%lipanthyl%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fenofibrate',   category = 'Fibrate', default_dosage = '200 mg once daily'                             WHERE name ILIKE '%fenofibrate%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Gemfibrozil',   category = 'Fibrate', default_dosage = '600 mg twice daily'                            WHERE name ILIKE '%lopid%'     AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Anticoagulants
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Warfarin',      category = 'Anticoagulant', default_dosage = '5 mg once daily'           WHERE name ILIKE '%coumadin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Warfarin',      category = 'Anticoagulant', default_dosage = '5 mg once daily'           WHERE name ILIKE '%marevan%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Warfarin',      category = 'Anticoagulant', default_dosage = '5 mg once daily'           WHERE name ILIKE '%warfarin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Enoxaparin',    category = 'Anticoagulant', default_dosage = '40 mg SC once daily'       WHERE name ILIKE '%clexane%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Enoxaparin',    category = 'Anticoagulant', default_dosage = '40 mg SC once daily'       WHERE name ILIKE '%enoxaparin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Rivaroxaban',   category = 'Anticoagulant', default_dosage = '20 mg once daily with food' WHERE name ILIKE '%xarelto%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Apixaban',      category = 'Anticoagulant', default_dosage = '5 mg twice daily'          WHERE name ILIKE '%eliquis%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Dabigatran',    category = 'Anticoagulant', default_dosage = '150 mg twice daily'        WHERE name ILIKE '%pradaxa%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Edoxaban',      category = 'Anticoagulant', default_dosage = '60 mg once daily'          WHERE name ILIKE '%lixiana%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Heparin',       category = 'Anticoagulant', default_dosage = '5000 IU SC q12h'           WHERE name ILIKE '%heparin%'   AND generic_name IS NULL AND name NOT ILIKE '%enox%';
UPDATE medications_master SET generic_name = 'Nadroparin',    category = 'Anticoagulant', default_dosage = '0.3 ml SC once daily'      WHERE name ILIKE '%fraxiparine%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Antiplatelets
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Aspirin',       category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%aspocid%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Aspirin',       category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%aspirin%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Aspirin',       category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%jusprin%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Aspirin',       category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%ezacard%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Aspirin',       category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%rivo%'      AND generic_name IS NULL AND name NOT ILIKE '%rivarox%';
UPDATE medications_master SET generic_name = 'Clopidogrel',   category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%plavix%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Clopidogrel',   category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%clopid%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Clopidogrel',   category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%plavicard%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Clopidogrel',   category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg once daily'    WHERE name ILIKE '%pidogrel%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ticagrelor',    category = 'Platelet Aggregation Inhibitor', default_dosage = '90 mg twice daily'   WHERE name ILIKE '%brilinta%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ticagrelor',    category = 'Platelet Aggregation Inhibitor', default_dosage = '90 mg twice daily'   WHERE name ILIKE '%brilique%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Prasugrel',     category = 'Platelet Aggregation Inhibitor', default_dosage = '10 mg once daily'    WHERE name ILIKE '%effient%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Dipyridamole',  category = 'Platelet Aggregation Inhibitor', default_dosage = '75 mg three times daily' WHERE name ILIKE '%persantin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Cilostazol',    category = 'Platelet Aggregation Inhibitor', default_dosage = '100 mg twice daily'  WHERE name ILIKE '%pletal%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Aspirin/Clopidogrel', category = 'Platelet Aggregation Inhibitor', default_dosage = '75/75 mg once daily' WHERE name ILIKE '%duoplavin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Aspirin/Clopidogrel', category = 'Platelet Aggregation Inhibitor', default_dosage = '75/75 mg once daily' WHERE name ILIKE '%clopilot plus%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Diuretics
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Furosemide',        category = 'Loop Diuretic',             default_dosage = '40 mg once daily'       WHERE name ILIKE '%lasix%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Furosemide',        category = 'Loop Diuretic',             default_dosage = '40 mg once daily'       WHERE name ILIKE '%furosemide%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Bumetanide',        category = 'Loop Diuretic',             default_dosage = '1 mg once daily'        WHERE name ILIKE '%burinex%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Torsemide',         category = 'Loop Diuretic',             default_dosage = '10 mg once daily'       WHERE name ILIKE '%torsemide%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Spironolactone',    category = 'Potassium Sparing Diuretic', default_dosage = '25 mg once daily'      WHERE name ILIKE '%aldactone%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Spironolactone',    category = 'Potassium Sparing Diuretic', default_dosage = '25 mg once daily'      WHERE name ILIKE '%spironolactone%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Eplerenone',        category = 'Potassium Sparing Diuretic', default_dosage = '25 mg once daily'      WHERE name ILIKE '%inspra%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Hydrochlorothiazide', category = 'Thiazide Diuretic',       default_dosage = '25 mg once daily'       WHERE name ILIKE '%hydrochlorothiazide%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Hydrochlorothiazide', category = 'Thiazide Diuretic',       default_dosage = '25 mg once daily'       WHERE name ILIKE '%esidrex%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amiloride/HCTZ',   category = 'Diuretic Combination',      default_dosage = '5/50 mg once daily'     WHERE name ILIKE '%moduretic%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Indapamide',        category = 'Thiazide-like Diuretic',    default_dosage = '1.5 mg once daily'      WHERE name ILIKE '%natrilix%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Indapamide',        category = 'Thiazide-like Diuretic',    default_dosage = '1.5 mg once daily'      WHERE name ILIKE '%fludex%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Chlorthalidone',    category = 'Thiazide-like Diuretic',    default_dosage = '12.5 mg once daily'     WHERE name ILIKE '%hygroton%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Triamterene/HCTZ',  category = 'Diuretic Combination',      default_dosage = '50/25 mg once daily'    WHERE name ILIKE '%dyazide%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Perindopril/Indapamide', category = 'ACE Inhibitor + Diuretic', default_dosage = '5/1.25 mg once daily' WHERE name ILIKE '%preterax%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. Nitrates / Vasodilators
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Isosorbide Mononitrate', category = 'Nitrate Vasodilator', default_dosage = '20 mg twice daily'    WHERE name ILIKE '%effox%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Isosorbide Mononitrate', category = 'Nitrate Vasodilator', default_dosage = '30 mg once daily'     WHERE name ILIKE '%imdur%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Isosorbide Mononitrate', category = 'Nitrate Vasodilator', default_dosage = '20 mg twice daily'    WHERE name ILIKE '%mononit%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Isosorbide Dinitrate',   category = 'Nitrate Vasodilator', default_dosage = '10 mg three times daily' WHERE name ILIKE '%isoket%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Isosorbide Dinitrate',   category = 'Nitrate Vasodilator', default_dosage = '10 mg three times daily' WHERE name ILIKE '%isordil%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Isosorbide Dinitrate',   category = 'Nitrate Vasodilator', default_dosage = '10 mg three times daily' WHERE name ILIKE '%risordan%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nitroglycerin',          category = 'Nitrate Vasodilator', default_dosage = '2.5 mg twice daily'   WHERE name ILIKE '%nitromak%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nitroglycerin',          category = 'Nitrate Vasodilator', default_dosage = '0.5 mg sublingual PRN' WHERE name ILIKE '%nitrolingual%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nitroglycerin',          category = 'Nitrate Vasodilator', default_dosage = '2.5 mg twice daily'   WHERE name ILIKE '%nitroderm%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Nicorandil',             category = 'Nitrate Vasodilator', default_dosage = '10 mg twice daily'    WHERE name ILIKE '%ikorel%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Molsidomine',            category = 'Nitrate Vasodilator', default_dosage = '2 mg three times daily' WHERE name ILIKE '%corvaton%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Trimetazidine',          category = 'Anti-anginal',        default_dosage = '35 mg twice daily'     WHERE name ILIKE '%vastarel%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Trimetazidine',          category = 'Anti-anginal',        default_dosage = '35 mg twice daily'     WHERE name ILIKE '%trimetazidine%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ranolazine',             category = 'Anti-anginal',        default_dosage = '500 mg twice daily'    WHERE name ILIKE '%ranexa%'    AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 10. Antiarrhythmics
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Amiodarone',    category = 'Antiarrhythmic', default_dosage = '200 mg once daily'       WHERE name ILIKE '%cordarone%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amiodarone',    category = 'Antiarrhythmic', default_dosage = '200 mg once daily'       WHERE name ILIKE '%amiodarone%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Flecainide',    category = 'Antiarrhythmic', default_dosage = '100 mg twice daily'      WHERE name ILIKE '%tambocor%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Propafenone',   category = 'Antiarrhythmic', default_dosage = '150 mg three times daily' WHERE name ILIKE '%rytmonorm%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Dronedarone',   category = 'Antiarrhythmic', default_dosage = '400 mg twice daily'      WHERE name ILIKE '%multaq%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Mexiletine',    category = 'Antiarrhythmic', default_dosage = '200 mg three times daily' WHERE name ILIKE '%mexitil%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ivabradine',    category = 'Heart Rate Reducer', default_dosage = '5 mg twice daily'    WHERE name ILIKE '%procoralan%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ivabradine',    category = 'Heart Rate Reducer', default_dosage = '5 mg twice daily'    WHERE name ILIKE '%ivabradine%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Digoxin',       category = 'Cardiac Glycoside',  default_dosage = '0.25 mg once daily'  WHERE name ILIKE '%lanoxin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Digoxin',       category = 'Cardiac Glycoside',  default_dosage = '0.25 mg once daily'  WHERE name ILIKE '%digoxin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Adenosine',     category = 'Antiarrhythmic', default_dosage = '6 mg IV push'            WHERE name ILIKE '%adenocor%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 11. Heart Failure Drugs (ARNI, SGLT2i, Hydralazine)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Sacubitril/Valsartan', category = 'Neprilysin Inhibitor', default_dosage = '49/51 mg twice daily' WHERE name ILIKE '%entresto%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Empagliflozin',   category = 'SGLT2 Inhibitor', default_dosage = '10 mg once daily'    WHERE name ILIKE '%jardiance%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Dapagliflozin',   category = 'SGLT2 Inhibitor', default_dosage = '10 mg once daily'    WHERE name ILIKE '%forxiga%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Canagliflozin',   category = 'SGLT2 Inhibitor', default_dosage = '100 mg once daily'   WHERE name ILIKE '%invokana%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Hydralazine',     category = 'Vasodilator',     default_dosage = '25 mg three times daily' WHERE name ILIKE '%hydralazine%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Hydralazine',     category = 'Vasodilator',     default_dosage = '25 mg three times daily' WHERE name ILIKE '%apresoline%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vericiguat',      category = 'Soluble Guanylate Cyclase Stimulator', default_dosage = '10 mg once daily' WHERE name ILIKE '%verquvo%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 12. Proton Pump Inhibitors (commonly co-prescribed)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Esomeprazole',  category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%nexium%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Esomeprazole',  category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%esomplex%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pantoprazole',  category = 'Proton Pump Inhibitor', default_dosage = '40 mg once daily'  WHERE name ILIKE '%controloc%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pantoprazole',  category = 'Proton Pump Inhibitor', default_dosage = '40 mg once daily'  WHERE name ILIKE '%pantoloc%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pantoprazole',  category = 'Proton Pump Inhibitor', default_dosage = '40 mg once daily'  WHERE name ILIKE '%pantozol%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Omeprazole',    category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%omepak%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Omeprazole',    category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%losec%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Omeprazole',    category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%omeprazole%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Omeprazole',    category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%pepzol%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lansoprazole',  category = 'Proton Pump Inhibitor', default_dosage = '30 mg once daily'  WHERE name ILIKE '%lanzor%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lansoprazole',  category = 'Proton Pump Inhibitor', default_dosage = '30 mg once daily'  WHERE name ILIKE '%lansoprazole%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Rabeprazole',   category = 'Proton Pump Inhibitor', default_dosage = '20 mg once daily'  WHERE name ILIKE '%pariet%'     AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 13. Diabetes Drugs (common in cardiology patients)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Metformin',       category = 'Antidiabetic - Biguanide',       default_dosage = '500 mg twice daily'  WHERE name ILIKE '%glucophage%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Metformin',       category = 'Antidiabetic - Biguanide',       default_dosage = '500 mg twice daily'  WHERE name ILIKE '%metformin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Metformin',       category = 'Antidiabetic - Biguanide',       default_dosage = '500 mg twice daily'  WHERE name ILIKE '%cidophage%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Gliclazide',      category = 'Antidiabetic - Sulfonylurea',    default_dosage = '60 mg once daily'    WHERE name ILIKE '%diamicron%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Gliclazide',      category = 'Antidiabetic - Sulfonylurea',    default_dosage = '60 mg once daily'    WHERE name ILIKE '%gliclazide%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Glimepiride',     category = 'Antidiabetic - Sulfonylurea',    default_dosage = '2 mg once daily'     WHERE name ILIKE '%amaryl%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Glimepiride',     category = 'Antidiabetic - Sulfonylurea',    default_dosage = '2 mg once daily'     WHERE name ILIKE '%dolcyl%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Glibenclamide',   category = 'Antidiabetic - Sulfonylurea',    default_dosage = '5 mg once daily'     WHERE name ILIKE '%daonil%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sitagliptin',     category = 'Antidiabetic - DPP-4 Inhibitor', default_dosage = '100 mg once daily'   WHERE name ILIKE '%januvia%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vildagliptin',    category = 'Antidiabetic - DPP-4 Inhibitor', default_dosage = '50 mg twice daily'   WHERE name ILIKE '%galvus%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Saxagliptin',     category = 'Antidiabetic - DPP-4 Inhibitor', default_dosage = '5 mg once daily'     WHERE name ILIKE '%onglyza%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Linagliptin',     category = 'Antidiabetic - DPP-4 Inhibitor', default_dosage = '5 mg once daily'     WHERE name ILIKE '%trajenta%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pioglitazone',    category = 'Antidiabetic - Thiazolidinedione', default_dosage = '15 mg once daily'  WHERE name ILIKE '%actos%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Liraglutide',     category = 'Antidiabetic - GLP-1 Agonist',  default_dosage = '1.2 mg SC once daily' WHERE name ILIKE '%victoza%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Semaglutide',     category = 'Antidiabetic - GLP-1 Agonist',  default_dosage = '0.5 mg SC weekly'    WHERE name ILIKE '%ozempic%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Dulaglutide',     category = 'Antidiabetic - GLP-1 Agonist',  default_dosage = '0.75 mg SC weekly'   WHERE name ILIKE '%trulicity%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Insulin Glargine', category = 'Insulin',                      default_dosage = '10 IU SC at bedtime' WHERE name ILIKE '%lantus%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Insulin Aspart',   category = 'Insulin',                      default_dosage = 'Per sliding scale'   WHERE name ILIKE '%novorapid%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Insulin Mix 70/30', category = 'Insulin',                     default_dosage = 'Per sliding scale'   WHERE name ILIKE '%mixtard%'    AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 14. Anxiolytics / Sedatives
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Alprazolam',    category = 'Anxiolytic - Benzodiazepine', default_dosage = '0.25 mg twice daily'  WHERE name ILIKE '%xanax%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Bromazepam',    category = 'Anxiolytic - Benzodiazepine', default_dosage = '3 mg twice daily'     WHERE name ILIKE '%lexotanil%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Bromazepam',    category = 'Anxiolytic - Benzodiazepine', default_dosage = '3 mg twice daily'     WHERE name ILIKE '%calmepam%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diazepam',      category = 'Anxiolytic - Benzodiazepine', default_dosage = '5 mg twice daily'     WHERE name ILIKE '%valium%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Clonazepam',    category = 'Anxiolytic - Benzodiazepine', default_dosage = '0.5 mg twice daily'   WHERE name ILIKE '%rivotril%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Lorazepam',     category = 'Anxiolytic - Benzodiazepine', default_dosage = '1 mg twice daily'     WHERE name ILIKE '%ativan%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Midazolam',     category = 'Anxiolytic - Benzodiazepine', default_dosage = '7.5 mg at bedtime'    WHERE name ILIKE '%dormicum%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Zolpidem',      category = 'Sedative-Hypnotic',           default_dosage = '10 mg at bedtime'     WHERE name ILIKE '%ambien%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Zolpidem',      category = 'Sedative-Hypnotic',           default_dosage = '10 mg at bedtime'     WHERE name ILIKE '%stilnox%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Buspirone',     category = 'Anxiolytic',                  default_dosage = '10 mg twice daily'    WHERE name ILIKE '%buspar%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Hydroxyzine',   category = 'Anxiolytic - Antihistamine',  default_dosage = '25 mg three times daily' WHERE name ILIKE '%atarax%'  AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 15. Antidepressants (SSRIs commonly used in cardiac patients)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Sertraline',    category = 'Antidepressant - SSRI', default_dosage = '50 mg once daily'     WHERE name ILIKE '%lustral%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sertraline',    category = 'Antidepressant - SSRI', default_dosage = '50 mg once daily'     WHERE name ILIKE '%zoloft%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Escitalopram',  category = 'Antidepressant - SSRI', default_dosage = '10 mg once daily'     WHERE name ILIKE '%cipralex%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fluoxetine',    category = 'Antidepressant - SSRI', default_dosage = '20 mg once daily'     WHERE name ILIKE '%prozac%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Paroxetine',    category = 'Antidepressant - SSRI', default_dosage = '20 mg once daily'     WHERE name ILIKE '%seroxat%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Mirtazapine',   category = 'Antidepressant',        default_dosage = '15 mg at bedtime'     WHERE name ILIKE '%remeron%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Trazodone',     category = 'Antidepressant',        default_dosage = '50 mg at bedtime'     WHERE name ILIKE '%trittico%'   AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 16. Vitamins & Supplements (cardiac care)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Potassium Chloride', category = 'Electrolyte Supplement', default_dosage = '600 mg once daily'  WHERE name ILIKE '%slow-k%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Potassium Chloride', category = 'Electrolyte Supplement', default_dosage = '600 mg once daily'  WHERE name ILIKE '%slow k%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Potassium Chloride', category = 'Electrolyte Supplement', default_dosage = '600 mg once daily'  WHERE name ILIKE '%kcl%'        AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Magnesium',          category = 'Electrolyte Supplement', default_dosage = '400 mg once daily'  WHERE name ILIKE '%mag%'        AND generic_name IS NULL AND name NOT ILIKE '%image%' AND name NOT ILIKE '%omag%';
UPDATE medications_master SET generic_name = 'Coenzyme Q10',       category = 'Supplement',             default_dosage = '100 mg once daily'  WHERE name ILIKE '%coq10%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Coenzyme Q10',       category = 'Supplement',             default_dosage = '100 mg once daily'  WHERE name ILIKE '%co q 10%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Omega-3 Fatty Acids', category = 'Supplement',            default_dosage = '1000 mg once daily' WHERE name ILIKE '%omega%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Omega-3 Fatty Acids', category = 'Supplement',            default_dosage = '1000 mg once daily' WHERE name ILIKE '%fish oil%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vitamin D3',         category = 'Vitamin',                default_dosage = '1000 IU once daily' WHERE name ILIKE '%vitamin d%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vitamin D3',         category = 'Vitamin',                default_dosage = '1000 IU once daily' WHERE name ILIKE '%vidrop%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vitamin D3',         category = 'Vitamin',                default_dosage = '1000 IU once daily' WHERE name ILIKE '%devarol%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vitamin B Complex',  category = 'Vitamin',                default_dosage = '1 tablet once daily' WHERE name ILIKE '%neurobion%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Vitamin B12',        category = 'Vitamin',                default_dosage = '1000 mcg once daily' WHERE name ILIKE '%b12%'       AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Folic Acid',         category = 'Vitamin',                default_dosage = '5 mg once daily'    WHERE name ILIKE '%folic%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Iron',               category = 'Mineral Supplement',     default_dosage = '100 mg once daily'  WHERE name ILIKE '%feroglobin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Iron',               category = 'Mineral Supplement',     default_dosage = '100 mg once daily'  WHERE name ILIKE '%haemup%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Iron',               category = 'Mineral Supplement',     default_dosage = '100 mg once daily'  WHERE name ILIKE '%ferro sanol%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Calcium/Vitamin D',  category = 'Mineral Supplement',     default_dosage = '600/400 mg once daily' WHERE name ILIKE '%caltrate%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Calcium/Vitamin D',  category = 'Mineral Supplement',     default_dosage = '600/400 mg once daily' WHERE name ILIKE '%calcimate%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Multivitamin',       category = 'Vitamin',                default_dosage = '1 tablet once daily' WHERE name ILIKE '%abc plus%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Multivitamin',       category = 'Vitamin',                default_dosage = '1 tablet once daily' WHERE name ILIKE '%centrum%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Multivitamin',       category = 'Vitamin',                default_dosage = '1 tablet once daily' WHERE name ILIKE '%pharma nord%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Zinc',               category = 'Mineral Supplement',     default_dosage = '50 mg once daily'   WHERE name ILIKE '%zinc%'       AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'L-Carnitine',        category = 'Supplement',             default_dosage = '500 mg twice daily'  WHERE name ILIKE '%carnitine%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'L-Carnitine',        category = 'Supplement',             default_dosage = '500 mg twice daily'  WHERE name ILIKE '%carnivita%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 17. Thyroid medications (common comorbidity in cardiac patients)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Levothyroxine', category = 'Thyroid Hormone',    default_dosage = '50 mcg once daily'  WHERE name ILIKE '%eltroxin%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Levothyroxine', category = 'Thyroid Hormone',    default_dosage = '50 mcg once daily'  WHERE name ILIKE '%euthyrox%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Levothyroxine', category = 'Thyroid Hormone',    default_dosage = '50 mcg once daily'  WHERE name ILIKE '%synthroid%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Carbimazole',   category = 'Antithyroid',        default_dosage = '10 mg three times daily' WHERE name ILIKE '%neo-mercazole%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Propylthiouracil', category = 'Antithyroid',     default_dosage = '100 mg three times daily' WHERE name ILIKE '%thyrocil%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 18. Gout medications (allopurinol - common with diuretics)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Allopurinol',   category = 'Antigout', default_dosage = '100 mg once daily'   WHERE name ILIKE '%allopurinol%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Allopurinol',   category = 'Antigout', default_dosage = '100 mg once daily'   WHERE name ILIKE '%zyloric%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Colchicine',    category = 'Antigout', default_dosage = '0.5 mg twice daily'  WHERE name ILIKE '%colchicine%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Febuxostat',    category = 'Antigout', default_dosage = '40 mg once daily'    WHERE name ILIKE '%feburic%'     AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 19. Bronchodilators (cardiac patients with COPD/asthma)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Salbutamol',         category = 'Bronchodilator', default_dosage = '2 puffs PRN'        WHERE name ILIKE '%ventolin%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Salbutamol',         category = 'Bronchodilator', default_dosage = '2 puffs PRN'        WHERE name ILIKE '%farcolin%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ipratropium',        category = 'Bronchodilator', default_dosage = '2 puffs four times daily' WHERE name ILIKE '%atrovent%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Tiotropium',         category = 'Bronchodilator', default_dosage = '18 mcg once daily'  WHERE name ILIKE '%spiriva%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Budesonide/Formoterol', category = 'Inhaled Corticosteroid + Bronchodilator', default_dosage = '2 puffs twice daily' WHERE name ILIKE '%symbicort%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fluticasone/Salmeterol', category = 'Inhaled Corticosteroid + Bronchodilator', default_dosage = '2 puffs twice daily' WHERE name ILIKE '%seretide%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Montelukast',        category = 'Leukotriene Inhibitor', default_dosage = '10 mg once daily at bedtime' WHERE name ILIKE '%singulair%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 20. Pain / Anti-inflammatory (with cardiac caution notes)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Paracetamol',   category = 'Analgesic',             default_dosage = '500 mg every 6 hours PRN' WHERE name ILIKE '%panadol%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Paracetamol',   category = 'Analgesic',             default_dosage = '500 mg every 6 hours PRN' WHERE name ILIKE '%cetal%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Paracetamol',   category = 'Analgesic',             default_dosage = '500 mg every 6 hours PRN' WHERE name ILIKE '%abimol%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Paracetamol',   category = 'Analgesic',             default_dosage = '500 mg every 6 hours PRN' WHERE name ILIKE '%paracetamol%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Celecoxib',     category = 'NSAID - COX-2 Inhibitor', default_dosage = '200 mg once daily'     WHERE name ILIKE '%celebrex%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diclofenac',    category = 'NSAID',                 default_dosage = '50 mg twice daily'       WHERE name ILIKE '%voltaren%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diclofenac',    category = 'NSAID',                 default_dosage = '50 mg twice daily'       WHERE name ILIKE '%olfen%'      AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ibuprofen',     category = 'NSAID',                 default_dosage = '400 mg three times daily' WHERE name ILIKE '%brufen%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Pregabalin',    category = 'Neuropathic Pain',      default_dosage = '75 mg twice daily'       WHERE name ILIKE '%lyrica%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Gabapentin',    category = 'Neuropathic Pain',      default_dosage = '300 mg three times daily' WHERE name ILIKE '%neurontin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Tramadol',      category = 'Opioid Analgesic',      default_dosage = '50 mg twice daily'       WHERE name ILIKE '%tramadol%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Tramadol',      category = 'Opioid Analgesic',      default_dosage = '50 mg twice daily'       WHERE name ILIKE '%tramal%'     AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 21. Antihypertensives - Alpha blockers / Centrally acting
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Doxazosin',     category = 'Alpha-1 Blocker',      default_dosage = '4 mg once daily'       WHERE name ILIKE '%cardura%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Prazosin',      category = 'Alpha-1 Blocker',      default_dosage = '1 mg twice daily'      WHERE name ILIKE '%minipress%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Methyldopa',    category = 'Central Alpha Agonist', default_dosage = '250 mg twice daily'   WHERE name ILIKE '%aldomet%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Methyldopa',    category = 'Central Alpha Agonist', default_dosage = '250 mg twice daily'   WHERE name ILIKE '%methyldopa%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Clonidine',     category = 'Central Alpha Agonist', default_dosage = '0.1 mg twice daily'   WHERE name ILIKE '%catapres%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Moxonidine',    category = 'Central Alpha Agonist', default_dosage = '0.2 mg once daily'    WHERE name ILIKE '%physiotens%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Minoxidil',     category = 'Vasodilator',           default_dosage = '5 mg twice daily'     WHERE name ILIKE '%loniten%'    AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 22. Antibiotics (sometimes needed in endocarditis prophylaxis)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Amoxicillin',           category = 'Antibiotic', default_dosage = '500 mg three times daily' WHERE name ILIKE '%amoxil%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Amoxicillin/Clavulanate', category = 'Antibiotic', default_dosage = '1 g twice daily'       WHERE name ILIKE '%augmentin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Azithromycin',          category = 'Antibiotic', default_dosage = '500 mg once daily x3 days' WHERE name ILIKE '%zithromax%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ciprofloxacin',         category = 'Antibiotic', default_dosage = '500 mg twice daily'      WHERE name ILIKE '%cipro%'      AND generic_name IS NULL AND name NOT ILIKE '%cipralex%';
UPDATE medications_master SET generic_name = 'Ceftriaxone',           category = 'Antibiotic', default_dosage = '1 g IV once daily'       WHERE name ILIKE '%ceftriaxone%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 23. H2 blockers / GI drugs
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Ranitidine',    category = 'H2 Blocker',      default_dosage = '150 mg twice daily'       WHERE name ILIKE '%zantac%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Famotidine',    category = 'H2 Blocker',      default_dosage = '40 mg once daily'         WHERE name ILIKE '%pepcid%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Domperidone',   category = 'Prokinetic',      default_dosage = '10 mg three times daily'  WHERE name ILIKE '%motilium%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Metoclopramide', category = 'Prokinetic',     default_dosage = '10 mg three times daily'  WHERE name ILIKE '%primperan%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sucralfate',    category = 'GI Protectant',   default_dosage = '1 g four times daily'     WHERE name ILIKE '%antepsin%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Itopride',      category = 'Prokinetic',      default_dosage = '50 mg three times daily'  WHERE name ILIKE '%ganaton%'    AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 24. Erectile dysfunction (PDE5 inhibitors - cardiac relevance)
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Sildenafil',    category = 'PDE5 Inhibitor', default_dosage = '50 mg PRN'               WHERE name ILIKE '%viagra%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Tadalafil',     category = 'PDE5 Inhibitor', default_dosage = '10 mg PRN'               WHERE name ILIKE '%cialis%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sildenafil',    category = 'PDE5 Inhibitor', default_dosage = '50 mg PRN'               WHERE name ILIKE '%erec%'       AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 25. Pulmonary Hypertension
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Sildenafil',    category = 'Pulmonary Vasodilator', default_dosage = '20 mg three times daily' WHERE name ILIKE '%revatio%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Bosentan',      category = 'Endothelin Receptor Antagonist', default_dosage = '125 mg twice daily' WHERE name ILIKE '%tracleer%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Ambrisentan',   category = 'Endothelin Receptor Antagonist', default_dosage = '5 mg once daily'   WHERE name ILIKE '%volibris%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Macitentan',    category = 'Endothelin Receptor Antagonist', default_dosage = '10 mg once daily'  WHERE name ILIKE '%opsumit%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Tadalafil',     category = 'Pulmonary Vasodilator', default_dosage = '40 mg once daily'          WHERE name ILIKE '%adcirca%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Riociguat',     category = 'Soluble Guanylate Cyclase Stimulator', default_dosage = '2.5 mg three times daily' WHERE name ILIKE '%adempas%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 26. Antihistamines
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Cetirizine',    category = 'Antihistamine', default_dosage = '10 mg once daily'   WHERE name ILIKE '%zyrtec%'     AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Loratadine',    category = 'Antihistamine', default_dosage = '10 mg once daily'   WHERE name ILIKE '%claritine%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Fexofenadine',  category = 'Antihistamine', default_dosage = '180 mg once daily'  WHERE name ILIKE '%telfast%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Chlorpheniramine', category = 'Antihistamine', default_dosage = '4 mg three times daily' WHERE name ILIKE '%allergex%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 27. Miscellaneous cardiac-adjacent drugs
-- ────────────────────────────────────────────────────────────────────────────
UPDATE medications_master SET generic_name = 'Pentoxifylline',  category = 'Peripheral Vasodilator',   default_dosage = '400 mg three times daily' WHERE name ILIKE '%trental%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diosmin/Hesperidin', category = 'Venotonic',             default_dosage = '500 mg twice daily'       WHERE name ILIKE '%daflon%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Diosmin/Hesperidin', category = 'Venotonic',             default_dosage = '500 mg twice daily'       WHERE name ILIKE '%diosmin%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Sulodexide',      category = 'Antithrombotic',           default_dosage = '250 LRU twice daily'      WHERE name ILIKE '%vessel%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Acetylcysteine',  category = 'Mucolytic',                default_dosage = '600 mg once daily'        WHERE name ILIKE '%acc%'      AND generic_name IS NULL AND name NOT ILIKE '%accupril%';
UPDATE medications_master SET generic_name = 'Silymarin',       category = 'Hepatoprotective',         default_dosage = '140 mg three times daily' WHERE name ILIKE '%legalon%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Alfuzosin',       category = 'Alpha-1 Blocker (Urologic)', default_dosage = '10 mg once daily'       WHERE name ILIKE '%xatral%'   AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Tamsulosin',      category = 'Alpha-1 Blocker (Urologic)', default_dosage = '0.4 mg once daily'      WHERE name ILIKE '%omnic%'    AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Finasteride',     category = 'BPH Treatment',             default_dosage = '5 mg once daily'         WHERE name ILIKE '%proscar%'  AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Dexamethasone',   category = 'Corticosteroid',            default_dosage = '0.5 mg once daily'       WHERE name ILIKE '%decadron%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Prednisolone',    category = 'Corticosteroid',            default_dosage = '5 mg once daily'         WHERE name ILIKE '%hostacortin%' AND generic_name IS NULL;
UPDATE medications_master SET generic_name = 'Prednisolone',    category = 'Corticosteroid',            default_dosage = '5 mg once daily'         WHERE name ILIKE '%solupred%' AND generic_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Report results
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    total_meds  INTEGER;
    enriched    INTEGER;
    remaining   INTEGER;
BEGIN
    SELECT count(*) INTO total_meds FROM medications_master;
    SELECT count(*) INTO enriched FROM medications_master WHERE generic_name IS NOT NULL;
    SELECT count(*) INTO remaining FROM medications_master WHERE generic_name IS NULL;

    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE 'ENRICHMENT COMPLETE';
    RAISE NOTICE '  Total medications : %', total_meds;
    RAISE NOTICE '  With generic_name : % (enriched)', enriched;
    RAISE NOTICE '  Still missing     : %', remaining;
    RAISE NOTICE '══════════════════════════════════════════════════════';
END
$$;

COMMIT;
