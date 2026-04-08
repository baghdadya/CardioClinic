# Equipment Integration Plan

**Status:** Awaiting Dr. Yasser's equipment list (questionnaire sent 2026-04-07)
**Timeline:** Post-v1.0

## Device Integration Matrix

| Device | Common Models | Protocol | Auto-Captured Fields | Priority |
|--------|--------------|----------|---------------------|----------|
| **Echo/Ultrasound** | GE Vivid E95/S70, Philips EPIQ, Siemens Acuson | **DICOM SR** (Structured Report) | LVEDD, LVESD, IVS, PWT, FS, EF%, AO, LA, valve assessments (AO/MV/PV/TV), wall motion, diastolic function | **P0 — Highest** |
| **ECG/EKG** | GE MAC 2000/5500, Philips PageWriter, Schiller AT-2 | **DICOM ECG** or **SCP-ECG** or **XML** | Heart rate, rhythm, PR/QRS/QT/QTc intervals, axis, ST changes, interpretation text | **P1 — High** |
| **Holter Monitor** | GE SEER 1000, Philips DigiTrak, Mortara H3+ | **PDF export** + **XML/CSV** | Min/max/avg HR, arrhythmia events, pauses, ST episodes, HRV, total recording time | **P2 — Medium** |
| **Stress Test / Treadmill** | GE CASE, Mortara XScribe, Schiller CS-200 | **DICOM** or **PDF** | Protocol (Bruce/Modified), duration, max HR, % predicted HR, BP response, ST changes, METs, reason stopped, conclusion | **P2 — Medium** |
| **Ambulatory BP Monitor** | Spacelabs 90217/90227, Welch Allyn ABPM 7100 | **CSV/XML export** | 24h avg SBP/DBP, daytime avg, nighttime avg, dipping status, max/min readings, pulse pressure | **P2 — Medium** |
| **Vital Signs Monitor** | Philips IntelliVue, GE Carescape B450 | **HL7 v2** (ADT/ORU messages) | HR, BP (sys/dia/mean), SpO2, RR, temp, ECG rhythm | **P3 — Low** |
| **Spirometer** | MIR Spirobank, ndd EasyOne | **PDF** or **GDT/XML** | FVC, FEV1, FEV1/FVC ratio, PEF, predicted %, interpretation | **P3 — Low** |
| **Pulse Oximeter** | Masimo Rad-97, Nonin 3150 | **Bluetooth/USB** | SpO2, pulse rate, perfusion index, pleth waveform | **P3 — Low** |
| **Defibrillator/AED** | Philips HeartStart, Zoll R Series | **PDF/USB log** | Event log only (shocks delivered, rhythms) — not routine import | **P4 — On demand** |
| **Cardiac CT/MRI** | Typically referred out | **DICOM images** | Calcium score, coronary stenosis %, LV function, reports as PDF | **P4 — If in-clinic** |

## Integration Standards

### DICOM (Primary — Echo, ECG, Imaging)
- **Protocol:** DICOM 3.0, Structured Reports (SR), Waveforms
- **Implementation:** DICOM listener (C-STORE SCP) running as a service
- **How it works:** Echo machine sends study to our DICOM node → parser extracts measurements → auto-populates Investigation record
- **Libraries:** pydicom, pynetdicom (Python), Orthanc (open-source DICOM server)
- **Network:** Device and server on same LAN, device configured with our AE Title + IP + port

### HL7 FHIR (Modern — Vitals, Lab)
- **Protocol:** HL7 FHIR R4 (REST API)
- **Resources:** Observation (vitals, labs), DiagnosticReport, ImagingStudy
- **Implementation:** FHIR endpoint that devices POST to, or poll from hospital FHIR server
- **Libraries:** fhir.resources (Python)

### HL7 v2 (Legacy — Monitors, some ECG)
- **Protocol:** HL7 v2.x messages (ADT, ORU) over TCP/MLLP
- **Implementation:** MLLP listener parsing ORU^R01 messages
- **Libraries:** hl7apy, python-hl7

### PDF/File Upload (Universal Fallback)
- **For:** Any device that can export PDF, CSV, XML, or images
- **Implementation:** Upload endpoint, file stored in S3/local, linked to Investigation or Image record
- **OCR option:** Extract values from PDF reports using Tesseract/AWS Textract (future)

## Architecture

```
┌─────────────────┐     DICOM C-STORE     ┌──────────────────┐
│  Echo Machine   │ ───────────────────▶   │  DICOM Listener  │
│  (GE Vivid)     │                        │  (pynetdicom)    │
└─────────────────┘                        └────────┬─────────┘
                                                    │ parse SR
┌─────────────────┐     SCP-ECG/XML        ┌────────▼─────────┐
│  ECG Machine    │ ───────────────────▶   │  Device Ingestion │
│  (GE MAC)       │                        │  Service          │
└─────────────────┘                        │  (FastAPI worker) │
                                           └────────┬─────────┘
┌─────────────────┐     CSV/PDF upload              │ 
│  Holter/ABP/    │ ───────────────────▶            │ write to DB
│  Other devices  │                        ┌────────▼─────────┐
└─────────────────┘                        │  PostgreSQL       │
                                           │  investigations   │
                                           │  lab_results      │
                                           │  images           │
                                           └──────────────────┘
```

## Echo Integration Detail (Priority P0)

The echo machine is the most critical integration. Most clinics use GE Vivid series.

### Data Flow
1. Sonographer completes echo study on GE Vivid
2. Machine sends DICOM Structured Report to our listener (configured AE Title)
3. Listener receives C-STORE, parses SR using pydicom
4. Extracted measurements mapped to `investigations` table columns:

| DICOM SR Tag | Database Column | Unit |
|-------------|----------------|------|
| LV Internal Dimension - Diastole | echo_lvedd | mm |
| LV Internal Dimension - Systole | echo_lvesd | mm |
| Interventricular Septum - Diastole | echo_ivs | mm |
| LV Posterior Wall - Diastole | echo_pwt | mm |
| Fractional Shortening | echo_fs | % |
| Ejection Fraction (Biplane) | echo_ef | % |
| Aortic Root Dimension | echo_ao | mm |
| Left Atrial Dimension | echo_la | mm |
| Aortic Valve Assessment | echo_ao_valve | text |
| Mitral Valve Assessment | echo_mit_valve | text |
| Pulmonary Valve Assessment | echo_pulm_valve | text |
| Tricuspid Valve Assessment | echo_tric_valve | text |

5. New Investigation record created, linked to patient (matched by patient ID or MRN)
6. Notification shown in app: "New echo report received for [Patient Name]"

### Setup Requirements (from Dr. Yasser)
- Echo machine brand and model
- Network connectivity (LAN IP or Wi-Fi)
- Current DICOM configuration (existing PACS?)
- Whether measurements are stored as DICOM SR or only images
- Patient ID matching method (legacy ID, name, or new MRN)

## Questions for Dr. Yasser (Sent 2026-04-07)

1. What echo machine do you use? (Brand, model, year)
2. What ECG machine do you use?
3. Do you have a Holter monitor? Which one?
4. Ambulatory BP monitor?
5. Stress test / treadmill system?
6. Vital signs monitor in clinic?
7. Spirometer?
8. Any other diagnostic equipment?
9. Is cardiac CT/MRI done in-clinic or referred out?
10. What network/PC setup exists? (LAN, Wi-Fi, USB connections)
11. Do any devices currently export to a PACS or shared folder?
