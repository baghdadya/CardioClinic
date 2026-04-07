import React, { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  PastFamilyHistory,
  Medication,
  ChestPainType,
  PalpitationFrequency,
  SyncopeType,
  ActivityLevel,
} from "@/types";

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

interface ClinicalDialogProps {
  patientId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full mb-1 mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </h3>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 text-sm text-foreground select-none",
        className
      )}
    >
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// 1. AddPresentHistoryDialog
// ---------------------------------------------------------------------------

export function AddPresentHistoryDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: ClinicalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chestPain, setChestPain] = useState<ChestPainType>("none");
  const [chestPainRemarks, setChestPainRemarks] = useState("");
  const [dyspneaExertional, setDyspneaExertional] = useState(false);
  const [dyspneaPnd, setDyspneaPnd] = useState(false);
  const [dyspneaOrthopnea, setDyspneaOrthopnea] = useState(false);
  const [dyspneaGrade, setDyspneaGrade] = useState("");
  const [palpitations, setPalpitations] = useState<PalpitationFrequency>("none");
  const [syncope, setSyncope] = useState<SyncopeType>("none");
  const [lowerLimbEdema, setLowerLimbEdema] = useState(false);
  const [abdominalSwelling, setAbdominalSwelling] = useState(false);
  const [lcoDizziness, setLcoDizziness] = useState(false);
  const [lcoBlurring, setLcoBlurring] = useState(false);
  const [lcoFatigue, setLcoFatigue] = useState(false);
  const [neurologicalSymptoms, setNeurologicalSymptoms] = useState("");
  const [gitSymptoms, setGitSymptoms] = useState(false);
  const [urinarySymptoms, setUrinarySymptoms] = useState(false);
  const [chestSymptoms, setChestSymptoms] = useState(false);
  const [remarks, setRemarks] = useState("");

  function reset() {
    setChestPain("none");
    setChestPainRemarks("");
    setDyspneaExertional(false);
    setDyspneaPnd(false);
    setDyspneaOrthopnea(false);
    setDyspneaGrade("");
    setPalpitations("none");
    setSyncope("none");
    setLowerLimbEdema(false);
    setAbdominalSwelling(false);
    setLcoDizziness(false);
    setLcoBlurring(false);
    setLcoFatigue(false);
    setNeurologicalSymptoms("");
    setGitSymptoms(false);
    setUrinarySymptoms(false);
    setChestSymptoms(false);
    setRemarks("");
    setError(null);
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/present-history`, {
        chest_pain: chestPain,
        chest_pain_remarks: chestPainRemarks || undefined,
        dyspnea_exertional: dyspneaExertional,
        dyspnea_pnd: dyspneaPnd,
        dyspnea_orthopnea: dyspneaOrthopnea,
        dyspnea_grade: dyspneaGrade ? Number(dyspneaGrade) : undefined,
        palpitations,
        syncope,
        lower_limb_edema: lowerLimbEdema,
        abdominal_swelling: abdominalSwelling,
        low_cardiac_output_dizziness: lcoDizziness,
        low_cardiac_output_blurring: lcoBlurring,
        low_cardiac_output_fatigue: lcoFatigue,
        neurological_symptoms: neurologicalSymptoms || undefined,
        git_symptoms: gitSymptoms,
        urinary_symptoms: urinarySymptoms,
        chest_symptoms: chestSymptoms,
        remarks: remarks || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save present history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add Present History</DialogTitle>
        <DialogDescription>Record the patient's current symptoms.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-present-history" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SectionHeader>Chest Pain</SectionHeader>
            <Select
              label="Chest Pain"
              value={chestPain}
              onChange={(e) => setChestPain(e.target.value as ChestPainType)}
              options={[
                { value: "none", label: "None" },
                { value: "typical", label: "Typical" },
                { value: "atypical", label: "Atypical" },
                { value: "non_cardiac", label: "Non-cardiac" },
              ]}
            />
            <Textarea
              label="Chest Pain Remarks"
              value={chestPainRemarks}
              onChange={(e) => setChestPainRemarks(e.target.value)}
              placeholder="Optional"
              rows={2}
            />

            <SectionHeader>Dyspnea</SectionHeader>
            <Checkbox
              label="Exertional"
              checked={dyspneaExertional}
              onChange={setDyspneaExertional}
            />
            <Checkbox label="PND" checked={dyspneaPnd} onChange={setDyspneaPnd} />
            <Checkbox
              label="Orthopnea"
              checked={dyspneaOrthopnea}
              onChange={setDyspneaOrthopnea}
            />
            <Input
              label="Dyspnea Grade (0-4)"
              type="number"
              min={0}
              max={4}
              value={dyspneaGrade}
              onChange={(e) => setDyspneaGrade(e.target.value)}
              placeholder="Optional"
            />

            <SectionHeader>Cardiovascular</SectionHeader>
            <Select
              label="Palpitations"
              value={palpitations}
              onChange={(e) => setPalpitations(e.target.value as PalpitationFrequency)}
              options={[
                { value: "none", label: "None" },
                { value: "occasional", label: "Occasional" },
                { value: "frequent", label: "Frequent" },
                { value: "constant", label: "Constant" },
              ]}
            />
            <Select
              label="Syncope"
              value={syncope}
              onChange={(e) => setSyncope(e.target.value as SyncopeType)}
              options={[
                { value: "none", label: "None" },
                { value: "pre_syncope", label: "Pre-syncope" },
                { value: "syncope", label: "Syncope" },
              ]}
            />
            <Checkbox
              label="Lower Limb Edema"
              checked={lowerLimbEdema}
              onChange={setLowerLimbEdema}
            />
            <Checkbox
              label="Abdominal Swelling"
              checked={abdominalSwelling}
              onChange={setAbdominalSwelling}
            />

            <SectionHeader>Low Cardiac Output</SectionHeader>
            <Checkbox label="Dizziness" checked={lcoDizziness} onChange={setLcoDizziness} />
            <Checkbox label="Blurring" checked={lcoBlurring} onChange={setLcoBlurring} />
            <Checkbox label="Fatigue" checked={lcoFatigue} onChange={setLcoFatigue} />

            <SectionHeader>Other Symptoms</SectionHeader>
            <Input
              label="Neurological Symptoms"
              value={neurologicalSymptoms}
              onChange={(e) => setNeurologicalSymptoms(e.target.value)}
              placeholder="Optional"
            />
            <Checkbox label="GIT Symptoms" checked={gitSymptoms} onChange={setGitSymptoms} />
            <Checkbox
              label="Urinary Symptoms"
              checked={urinarySymptoms}
              onChange={setUrinarySymptoms}
            />
            <Checkbox
              label="Chest Symptoms"
              checked={chestSymptoms}
              onChange={setChestSymptoms}
            />

            <div className="col-span-full">
              <Textarea
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-present-history" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 2. EditPastFamilyHistoryDialog
// ---------------------------------------------------------------------------

interface EditPastFamilyHistoryProps extends ClinicalDialogProps {
  initialData?: PastFamilyHistory | null;
}

export function EditPastFamilyHistoryDialog({
  patientId,
  open,
  onClose,
  onSuccess,
  initialData,
}: EditPastFamilyHistoryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diabetes, setDiabetes] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [rheumaticHD, setRheumaticHD] = useState(false);
  const [ischemicHD, setIschemicHD] = useState(false);
  const [cabg, setCabg] = useState("");
  const [valveReplacement, setValveReplacement] = useState("");
  const [otherConditions, setOtherConditions] = useState("");
  const [familyConsanguinity, setFamilyConsanguinity] = useState(false);
  const [familyHypertension, setFamilyHypertension] = useState(false);
  const [familyDiabetes, setFamilyDiabetes] = useState(false);
  const [familyIhd, setFamilyIhd] = useState(false);
  const [familyOther, setFamilyOther] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initialData) {
      setDiabetes(initialData.diabetes);
      setHypertension(initialData.hypertension);
      setRheumaticHD(initialData.rheumatic_heart_disease);
      setIschemicHD(initialData.ischemic_heart_disease);
      setCabg(initialData.cabg ?? "");
      setValveReplacement(initialData.valve_replacement ?? "");
      setOtherConditions(initialData.other_conditions ?? "");
      setFamilyConsanguinity(initialData.family_consanguinity);
      setFamilyHypertension(initialData.family_hypertension);
      setFamilyDiabetes(initialData.family_diabetes);
      setFamilyIhd(initialData.family_ihd);
      setFamilyOther(initialData.family_other ?? "");
      setComments(initialData.comments ?? "");
    } else {
      setDiabetes(false);
      setHypertension(false);
      setRheumaticHD(false);
      setIschemicHD(false);
      setCabg("");
      setValveReplacement("");
      setOtherConditions("");
      setFamilyConsanguinity(false);
      setFamilyHypertension(false);
      setFamilyDiabetes(false);
      setFamilyIhd(false);
      setFamilyOther("");
      setComments("");
    }
  }, [open, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.put(`/patients/${patientId}/past-family-history`, {
        diabetes,
        hypertension,
        rheumatic_heart_disease: rheumaticHD,
        ischemic_heart_disease: ischemicHD,
        cabg: cabg || undefined,
        valve_replacement: valveReplacement || undefined,
        other_conditions: otherConditions || undefined,
        family_consanguinity: familyConsanguinity,
        family_hypertension: familyHypertension,
        family_diabetes: familyDiabetes,
        family_ihd: familyIhd,
        family_other: familyOther || undefined,
        comments: comments || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save past/family history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Past & Family History</DialogTitle>
        <DialogDescription>Update the patient's past medical and family history.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-past-family" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SectionHeader>Past Medical History</SectionHeader>
            <Checkbox label="Diabetes" checked={diabetes} onChange={setDiabetes} />
            <Checkbox label="Hypertension" checked={hypertension} onChange={setHypertension} />
            <Checkbox
              label="Rheumatic Heart Disease"
              checked={rheumaticHD}
              onChange={setRheumaticHD}
            />
            <Checkbox
              label="Ischemic Heart Disease"
              checked={ischemicHD}
              onChange={setIschemicHD}
            />
            <Input
              label="CABG"
              value={cabg}
              onChange={(e) => setCabg(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Valve Replacement"
              value={valveReplacement}
              onChange={(e) => setValveReplacement(e.target.value)}
              placeholder="Optional"
            />
            <div className="col-span-full">
              <Input
                label="Other Conditions"
                value={otherConditions}
                onChange={(e) => setOtherConditions(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <SectionHeader>Family History</SectionHeader>
            <Checkbox
              label="Consanguinity"
              checked={familyConsanguinity}
              onChange={setFamilyConsanguinity}
            />
            <Checkbox
              label="Hypertension"
              checked={familyHypertension}
              onChange={setFamilyHypertension}
            />
            <Checkbox label="Diabetes" checked={familyDiabetes} onChange={setFamilyDiabetes} />
            <Checkbox label="IHD" checked={familyIhd} onChange={setFamilyIhd} />
            <Input
              label="Family Other"
              value={familyOther}
              onChange={(e) => setFamilyOther(e.target.value)}
              placeholder="Optional"
            />
            <div className="col-span-full">
              <Input
                label="Comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-past-family" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 3. AddExaminationDialog
// ---------------------------------------------------------------------------

export function AddExaminationDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: ClinicalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pulseBpm, setPulseBpm] = useState("");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("sedentary");
  const [headNeck, setHeadNeck] = useState("");
  const [upperLimb, setUpperLimb] = useState("");
  const [lowerLimb, setLowerLimb] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [chest, setChest] = useState("");
  const [neurology, setNeurology] = useState("");
  const [cardiacApex, setCardiacApex] = useState("");
  const [cardiacS1, setCardiacS1] = useState(false);
  const [cardiacS2, setCardiacS2] = useState(false);
  const [cardiacS3, setCardiacS3] = useState(false);
  const [cardiacS4, setCardiacS4] = useState(false);
  const [cardiacMurmurs, setCardiacMurmurs] = useState("");
  const [cardiacAdditional, setCardiacAdditional] = useState("");
  const [remarks, setRemarks] = useState("");

  const bmi =
    weightKg && heightCm
      ? (Number(weightKg) / (Number(heightCm) / 100) ** 2).toFixed(1)
      : null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPulseBpm("");
    setBpSystolic("");
    setBpDiastolic("");
    setWeightKg("");
    setHeightCm("");
    setActivityLevel("sedentary");
    setHeadNeck("");
    setUpperLimb("");
    setLowerLimb("");
    setAbdomen("");
    setChest("");
    setNeurology("");
    setCardiacApex("");
    setCardiacS1(false);
    setCardiacS2(false);
    setCardiacS3(false);
    setCardiacS4(false);
    setCardiacMurmurs("");
    setCardiacAdditional("");
    setRemarks("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/examinations`, {
        pulse_bpm: pulseBpm ? Number(pulseBpm) : undefined,
        bp_systolic: bpSystolic ? Number(bpSystolic) : undefined,
        bp_diastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
        weight_kg: weightKg ? Number(weightKg) : undefined,
        height_cm: heightCm ? Number(heightCm) : undefined,
        activity_level: activityLevel,
        head_neck: headNeck || undefined,
        upper_limb: upperLimb || undefined,
        lower_limb: lowerLimb || undefined,
        abdomen: abdomen || undefined,
        chest: chest || undefined,
        neurology: neurology || undefined,
        cardiac_apex: cardiacApex || undefined,
        cardiac_s1: cardiacS1,
        cardiac_s2: cardiacS2,
        cardiac_s3: cardiacS3,
        cardiac_s4: cardiacS4,
        cardiac_murmurs: cardiacMurmurs || undefined,
        cardiac_additional_sounds: cardiacAdditional || undefined,
        remarks: remarks || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save examination.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add Examination</DialogTitle>
        <DialogDescription>Record a physical examination.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-examination" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SectionHeader>Vitals</SectionHeader>
            <Input
              label="Pulse (bpm)"
              type="number"
              value={pulseBpm}
              onChange={(e) => setPulseBpm(e.target.value)}
            />
            <Input
              label="BP Systolic"
              type="number"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(e.target.value)}
            />
            <Input
              label="BP Diastolic"
              type="number"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(e.target.value)}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
            {bmi && (
              <div className="flex items-end">
                <span className="text-sm text-muted-foreground">
                  BMI: <strong className="text-foreground">{bmi}</strong>
                </span>
              </div>
            )}
            <Select
              label="Activity Level"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              options={[
                { value: "sedentary", label: "Sedentary" },
                { value: "light", label: "Light" },
                { value: "moderate", label: "Moderate" },
                { value: "active", label: "Active" },
              ]}
            />

            <SectionHeader>General Examination</SectionHeader>
            <Input
              label="Head & Neck"
              value={headNeck}
              onChange={(e) => setHeadNeck(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Upper Limb"
              value={upperLimb}
              onChange={(e) => setUpperLimb(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Lower Limb"
              value={lowerLimb}
              onChange={(e) => setLowerLimb(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Abdomen"
              value={abdomen}
              onChange={(e) => setAbdomen(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Chest"
              value={chest}
              onChange={(e) => setChest(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Neurology"
              value={neurology}
              onChange={(e) => setNeurology(e.target.value)}
              placeholder="Optional"
            />

            <SectionHeader>Cardiac Auscultation</SectionHeader>
            <Input
              label="Cardiac Apex"
              value={cardiacApex}
              onChange={(e) => setCardiacApex(e.target.value)}
              placeholder="Optional"
            />
            <div className="col-span-full grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Checkbox label="S1" checked={cardiacS1} onChange={setCardiacS1} />
              <Checkbox label="S2" checked={cardiacS2} onChange={setCardiacS2} />
              <Checkbox label="S3" checked={cardiacS3} onChange={setCardiacS3} />
              <Checkbox label="S4" checked={cardiacS4} onChange={setCardiacS4} />
            </div>
            <Input
              label="Murmurs"
              value={cardiacMurmurs}
              onChange={(e) => setCardiacMurmurs(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Additional Sounds"
              value={cardiacAdditional}
              onChange={(e) => setCardiacAdditional(e.target.value)}
              placeholder="Optional"
            />

            <div className="col-span-full">
              <Textarea
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-examination" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 4. AddInvestigationDialog
// ---------------------------------------------------------------------------

export function AddInvestigationDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: ClinicalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [investigationDate, setInvestigationDate] = useState(todayISO());
  const [ecgResult, setEcgResult] = useState("");
  const [stressTest, setStressTest] = useState("");
  const [cardiacCath, setCardiacCath] = useState("");
  const [echoLvedd, setEchoLvedd] = useState("");
  const [echoLvesd, setEchoLvesd] = useState("");
  const [echoIvs, setEchoIvs] = useState("");
  const [echoPwt, setEchoPwt] = useState("");
  const [echoFs, setEchoFs] = useState("");
  const [echoEf, setEchoEf] = useState("");
  const [echoAo, setEchoAo] = useState("");
  const [echoLa, setEchoLa] = useState("");
  const [echoAoValve, setEchoAoValve] = useState("");
  const [echoMitValve, setEchoMitValve] = useState("");
  const [echoPulmValve, setEchoPulmValve] = useState("");
  const [echoTricValve, setEchoTricValve] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setInvestigationDate(todayISO());
    setEcgResult("");
    setStressTest("");
    setCardiacCath("");
    setEchoLvedd("");
    setEchoLvesd("");
    setEchoIvs("");
    setEchoPwt("");
    setEchoFs("");
    setEchoEf("");
    setEchoAo("");
    setEchoLa("");
    setEchoAoValve("");
    setEchoMitValve("");
    setEchoPulmValve("");
    setEchoTricValve("");
    setDiagnosis("");
    setRemarks("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/investigations`, {
        investigation_date: investigationDate,
        ecg_result: ecgResult || undefined,
        stress_test: stressTest || undefined,
        cardiac_cath: cardiacCath || undefined,
        echo_lvedd: echoLvedd ? Number(echoLvedd) : undefined,
        echo_lvesd: echoLvesd ? Number(echoLvesd) : undefined,
        echo_ivs: echoIvs ? Number(echoIvs) : undefined,
        echo_pwt: echoPwt ? Number(echoPwt) : undefined,
        echo_fs: echoFs ? Number(echoFs) : undefined,
        echo_ef: echoEf ? Number(echoEf) : undefined,
        echo_ao: echoAo ? Number(echoAo) : undefined,
        echo_la: echoLa ? Number(echoLa) : undefined,
        echo_ao_valve: echoAoValve || undefined,
        echo_mit_valve: echoMitValve || undefined,
        echo_pulm_valve: echoPulmValve || undefined,
        echo_tric_valve: echoTricValve || undefined,
        diagnosis: diagnosis || undefined,
        remarks: remarks || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save investigation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add Investigation</DialogTitle>
        <DialogDescription>Record investigation results and echo measurements.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-investigation" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Investigation Date"
              type="date"
              value={investigationDate}
              onChange={(e) => setInvestigationDate(e.target.value)}
            />
            <div /> {/* spacer */}

            <SectionHeader>Test Results</SectionHeader>
            <Input
              label="ECG Result"
              value={ecgResult}
              onChange={(e) => setEcgResult(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Stress Test"
              value={stressTest}
              onChange={(e) => setStressTest(e.target.value)}
              placeholder="Optional"
            />
            <div className="col-span-full">
              <Input
                label="Cardiac Catheterization"
                value={cardiacCath}
                onChange={(e) => setCardiacCath(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <SectionHeader>Echo Measurements</SectionHeader>
            <Input
              label="LVEDD"
              type="number"
              step="0.1"
              value={echoLvedd}
              onChange={(e) => setEchoLvedd(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="LVESD"
              type="number"
              step="0.1"
              value={echoLvesd}
              onChange={(e) => setEchoLvesd(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="IVS"
              type="number"
              step="0.1"
              value={echoIvs}
              onChange={(e) => setEchoIvs(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="PWT"
              type="number"
              step="0.1"
              value={echoPwt}
              onChange={(e) => setEchoPwt(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="FS (%)"
              type="number"
              step="0.1"
              value={echoFs}
              onChange={(e) => setEchoFs(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="EF (%)"
              type="number"
              step="0.1"
              value={echoEf}
              onChange={(e) => setEchoEf(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="AO"
              type="number"
              step="0.1"
              value={echoAo}
              onChange={(e) => setEchoAo(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="LA"
              type="number"
              step="0.1"
              value={echoLa}
              onChange={(e) => setEchoLa(e.target.value)}
              placeholder="Optional"
            />

            <SectionHeader>Echo Valves</SectionHeader>
            <Input
              label="Aortic Valve"
              value={echoAoValve}
              onChange={(e) => setEchoAoValve(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Mitral Valve"
              value={echoMitValve}
              onChange={(e) => setEchoMitValve(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Pulmonary Valve"
              value={echoPulmValve}
              onChange={(e) => setEchoPulmValve(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Tricuspid Valve"
              value={echoTricValve}
              onChange={(e) => setEchoTricValve(e.target.value)}
              placeholder="Optional"
            />

            <SectionHeader>Assessment</SectionHeader>
            <div className="col-span-full">
              <Textarea
                label="Diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
            <div className="col-span-full">
              <Textarea
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-investigation" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 5. AddFollowUpDialog
// ---------------------------------------------------------------------------

export function AddFollowUpDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: ClinicalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [visitDate, setVisitDate] = useState(todayISO());
  const [complaint, setComplaint] = useState("");
  const [presentHistory, setPresentHistory] = useState("");
  const [pulseBpm, setPulseBpm] = useState("");
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [examination, setExamination] = useState("");
  const [investigation, setInvestigation] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVisitDate(todayISO());
    setComplaint("");
    setPresentHistory("");
    setPulseBpm("");
    setBpSystolic("");
    setBpDiastolic("");
    setExamination("");
    setInvestigation("");
    setDiagnosis("");
    setPlan("");
    setNextFollowUp("");
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/follow-ups`, {
        visit_date: visitDate,
        complaint: complaint || undefined,
        present_history: presentHistory || undefined,
        pulse_bpm: pulseBpm ? Number(pulseBpm) : undefined,
        bp_systolic: bpSystolic ? Number(bpSystolic) : undefined,
        bp_diastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
        examination: examination || undefined,
        investigation: investigation || undefined,
        diagnosis: diagnosis || undefined,
        plan: plan || undefined,
        next_follow_up: nextFollowUp || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save follow-up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add Follow-Up</DialogTitle>
        <DialogDescription>Record a follow-up visit.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-followup" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Visit Date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
            <div /> {/* spacer */}

            <div className="col-span-full">
              <Textarea
                label="Complaint"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={2}
              />
            </div>
            <div className="col-span-full">
              <Textarea
                label="Present History"
                value={presentHistory}
                onChange={(e) => setPresentHistory(e.target.value)}
                rows={2}
              />
            </div>

            <SectionHeader>Vitals</SectionHeader>
            <Input
              label="Pulse (bpm)"
              type="number"
              value={pulseBpm}
              onChange={(e) => setPulseBpm(e.target.value)}
            />
            <Input
              label="BP Systolic"
              type="number"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(e.target.value)}
            />
            <Input
              label="BP Diastolic"
              type="number"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(e.target.value)}
            />
            <div /> {/* spacer */}

            <SectionHeader>Assessment</SectionHeader>
            <div className="col-span-full">
              <Textarea
                label="Examination"
                value={examination}
                onChange={(e) => setExamination(e.target.value)}
                rows={2}
              />
            </div>
            <div className="col-span-full">
              <Textarea
                label="Investigation"
                value={investigation}
                onChange={(e) => setInvestigation(e.target.value)}
                rows={2}
              />
            </div>
            <div className="col-span-full">
              <Textarea
                label="Diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
              />
            </div>
            <div className="col-span-full">
              <Textarea
                label="Plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={2}
              />
            </div>

            <Input
              label="Next Follow-Up"
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
            />
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-followup" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 6. AddMedicationDialog
// ---------------------------------------------------------------------------

export function AddMedicationDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: ClinicalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [instructions, setInstructions] = useState("");
  const [instructionsAr, setInstructionsAr] = useState("");

  const fetchMedications = useCallback(async () => {
    try {
      const { data } = await api.get("/medications", {
        params: { search: medSearch || undefined, page_size: 50 },
      });
      setMedications(data.items ?? data);
    } catch {
      // silent — user can retry
    }
  }, [medSearch]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMedicationId("");
    setDosage("");
    setFrequency("");
    setInstructions("");
    setInstructionsAr("");
    setMedSearch("");
  }, [open]);

  useEffect(() => {
    if (open) fetchMedications();
  }, [open, fetchMedications]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicationId) {
      setError("Please select a medication.");
      return;
    }
    if (!dosage || !frequency) {
      setError("Dosage and frequency are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/medications`, {
        medication_id: medicationId,
        dosage,
        frequency,
        instructions: instructions || undefined,
        instructions_ar: instructionsAr || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save medication.");
    } finally {
      setLoading(false);
    }
  }

  const filteredMeds = medications.filter(
    (m) =>
      !medSearch ||
      m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.generic_name?.toLowerCase().includes(medSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add Medication</DialogTitle>
        <DialogDescription>Prescribe a medication to this patient.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-medication" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Medication
              </label>
              <Input
                placeholder="Search medications..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
              />
              <Select
                value={medicationId}
                onChange={(e) => setMedicationId(e.target.value)}
                placeholder="Select medication"
                options={filteredMeds.map((m) => ({
                  value: m.id,
                  label: m.generic_name
                    ? `${m.name} (${m.generic_name})`
                    : m.name,
                }))}
              />
            </div>
            <Input
              label="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 50mg"
            />
            <Input
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="e.g. twice daily"
            />
            <Input
              label="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Instructions (Arabic)"
              value={instructionsAr}
              onChange={(e) => setInstructionsAr(e.target.value)}
              placeholder="Optional"
              dir="rtl"
            />
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-medication" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// 7. AddPrescriptionDialog
// ---------------------------------------------------------------------------

interface PrescriptionItemRow {
  key: string;
  medication_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

function emptyItem(): PrescriptionItemRow {
  return {
    key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    medication_id: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

export function AddPrescriptionDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: ClinicalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItemRow[]>([emptyItem()]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotes("");
    setItems([emptyItem()]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await api.get("/medications", { params: { page_size: 200 } });
        setMedications(data.items ?? data);
      } catch {
        // silent
      }
    })();
  }, [open]);

  function updateItem(key: string, field: keyof PrescriptionItemRow, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const next = prev.filter((item) => item.key !== key);
      return next.length === 0 ? [emptyItem()] : next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter(
      (i) => i.medication_id && i.dosage && i.frequency
    );
    if (validItems.length === 0) {
      setError("Add at least one complete prescription item (medication, dosage, frequency).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${patientId}/prescriptions`, {
        notes: notes || undefined,
        items: validItems.map((i, idx) => ({
          medication_id: i.medication_id,
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration || undefined,
          instructions: i.instructions || undefined,
          sort_order: idx,
        })),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save prescription.");
    } finally {
      setLoading(false);
    }
  }

  const medOptions = medications.map((m) => ({
    value: m.id,
    label: m.generic_name ? `${m.name} (${m.generic_name})` : m.name,
  }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Add Prescription</DialogTitle>
        <DialogDescription>Create a new prescription with one or more items.</DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[65vh] overflow-y-auto">
        <form id="form-prescription" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="space-y-4">
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional prescription notes"
              rows={2}
            />

            <SectionHeader>Prescription Items</SectionHeader>

            {items.map((item, idx) => (
              <div
                key={item.key}
                className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Item {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="col-span-full">
                    <Select
                      label="Medication"
                      value={item.medication_id}
                      onChange={(e) => updateItem(item.key, "medication_id", e.target.value)}
                      placeholder="Select medication"
                      options={medOptions}
                    />
                  </div>
                  <Input
                    label="Dosage"
                    value={item.dosage}
                    onChange={(e) => updateItem(item.key, "dosage", e.target.value)}
                    placeholder="e.g. 50mg"
                  />
                  <Input
                    label="Frequency"
                    value={item.frequency}
                    onChange={(e) => updateItem(item.key, "frequency", e.target.value)}
                    placeholder="e.g. twice daily"
                  />
                  <Input
                    label="Duration"
                    value={item.duration}
                    onChange={(e) => updateItem(item.key, "duration", e.target.value)}
                    placeholder="Optional (e.g. 7 days)"
                  />
                  <Input
                    label="Instructions"
                    value={item.instructions}
                    onChange={(e) => updateItem(item.key, "instructions", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              + Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="form-prescription" loading={loading}>
          Save
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
