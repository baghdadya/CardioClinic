import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  User,
  Activity,
  FileText,
  Stethoscope,
  FlaskConical,
  Pill,
  ClipboardList,
  CalendarCheck,
  Phone,
  Cigarette,
  Plus,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Weight,
  Gauge,
  Clock,
  Edit,
  Trash2,
  ShieldAlert,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import {
  AddPresentHistoryDialog,
  EditPastFamilyHistoryDialog,
  AddExaminationDialog,
  AddInvestigationDialog,
  AddFollowUpDialog,
  AddMedicationDialog,
  AddPrescriptionDialog,
} from "@/components/clinical/ClinicalForms";
import { PrescriptionView } from "@/components/clinical/PrescriptionView";
import type {
  Patient,
  PresentHistory,
  PastFamilyHistory,
  Examination,
  Investigation,
  PatientMedication,
  Prescription,
  FollowUp,
  Sex,
  MaritalStatus,
  SmokingStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const tabs = [
  { key: "overview", label: "Overview", icon: <Heart size={16} /> },
  { key: "present", label: "Present History", icon: <Activity size={16} /> },
  { key: "past_family", label: "Past / Family", icon: <FileText size={16} /> },
  { key: "examinations", label: "Examinations", icon: <Stethoscope size={16} /> },
  { key: "investigations", label: "Investigations", icon: <FlaskConical size={16} /> },
  { key: "medications", label: "Medications", icon: <Pill size={16} /> },
  { key: "prescriptions", label: "Prescriptions", icon: <ClipboardList size={16} /> },
  { key: "followups", label: "Follow-ups", icon: <CalendarCheck size={16} /> },
] as const;

type TabKey = (typeof tabs)[number]["key"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return new Date(dateStr).toLocaleDateString();
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM");
  } catch {
    return dateStr;
  }
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "items" in data) {
    return (data as { items: T[] }).items ?? [];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-36 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  color = "primary",
}: {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "same" | null;
  color?: "primary" | "rose" | "amber" | "emerald";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    rose: "bg-rose-500/10 text-rose-600",
    amber: "bg-amber-500/10 text-amber-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
  };
  const trendIcon =
    trend === "up" ? (
      <TrendingUp size={14} className="text-rose-500" />
    ) : trend === "down" ? (
      <TrendingDown size={14} className="text-emerald-500" />
    ) : trend === "same" ? (
      <Minus size={14} className="text-muted-foreground" />
    ) : null;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorMap[color])}>
          {icon}
        </div>
        {trendIcon && <div className="flex items-center gap-1">{trendIcon}</div>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">
          {value ?? "--"}
          {unit && value != null && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  icon,
  count,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          {count} record{count !== 1 && "s"}
        </p>
      </div>
      <div className="text-2xl font-bold text-primary/30 transition-colors group-hover:text-primary/50">
        {count}
      </div>
    </button>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No {label} found</p>
      <p className="mt-1 text-xs text-muted-foreground/60">Click the + Add button above to create one</p>
    </div>
  );
}

function ClinicalCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-6 transition-all duration-200",
        "hover:border-primary/15 hover:shadow-md",
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-xl before:bg-gradient-to-b before:from-primary/40 before:to-primary/10 before:opacity-0 before:transition-opacity before:duration-200",
        "hover:before:opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vitals Trend Chart
// ---------------------------------------------------------------------------

function VitalsTrendChart({
  examinations,
  followUps,
}: {
  examinations: Examination[];
  followUps: FollowUp[];
}) {
  const chartData = useMemo(() => {
    // Merge exam and follow-up vitals, sorted by date
    const points: {
      date: string;
      label: string;
      systolic?: number;
      diastolic?: number;
      pulse?: number;
    }[] = [];

    examinations.forEach((e) => {
      if (e.bp_systolic || e.pulse_bpm) {
        points.push({
          date: e.examined_at,
          label: formatShortDate(e.examined_at),
          systolic: e.bp_systolic ?? undefined,
          diastolic: e.bp_diastolic ?? undefined,
          pulse: e.pulse_bpm ?? undefined,
        });
      }
    });

    followUps.forEach((f) => {
      if (f.bp_systolic || f.pulse_bpm) {
        points.push({
          date: f.visit_date,
          label: formatShortDate(f.visit_date),
          systolic: f.bp_systolic ?? undefined,
          diastolic: f.bp_diastolic ?? undefined,
          pulse: f.pulse_bpm ?? undefined,
        });
      }
    });

    return points.sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [examinations, followUps]);

  if (chartData.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Need at least 2 vitals records to show trends
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Vitals Trend</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-rose-500" /> Systolic
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-blue-500" /> Diastolic
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-amber-500" /> Pulse
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Systolic" connectNulls />
          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" connectNulls />
          <Line type="monotone" dataKey="pulse" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Pulse" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EF Trend Chart
// ---------------------------------------------------------------------------

function EFTrendChart({ investigations }: { investigations: Investigation[] }) {
  const chartData = useMemo(() => {
    return investigations
      .filter((inv) => inv.echo_ef != null)
      .map((inv) => ({
        date: inv.investigation_date,
        label: formatShortDate(inv.investigation_date),
        ef: inv.echo_ef,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);
  }, [investigations]);

  if (chartData.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ejection Fraction Trend</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-4 rounded bg-emerald-500" /> EF%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis domain={[0, 80]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}%`, "EF"]}
          />
          <Line type="monotone" dataKey="ef" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} name="EF%" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Score badges
// ---------------------------------------------------------------------------

function useRiskAssessment(patient: Patient | null, pastFamily: PastFamilyHistory | null) {
  return useMemo(() => {
    if (!patient) return [];
    const age = calculateAge(patient.date_of_birth);
    const scores: { label: string; value: string; variant: "success" | "warning" | "destructive" }[] = [];

    // Simplified ASCVD risk indicator based on available data
    let ascvdFactors = 0;
    if (age >= 55) ascvdFactors++;
    if (patient.sex === "male") ascvdFactors++;
    if (patient.smoking_status === "current") ascvdFactors += 2;
    if (patient.smoking_status === "former") ascvdFactors++;
    if (pastFamily?.hypertension) ascvdFactors++;
    if (pastFamily?.diabetes) ascvdFactors++;
    if (pastFamily?.ischemic_heart_disease) ascvdFactors++;
    if (pastFamily?.family_ihd) ascvdFactors++;

    const ascvdLevel = ascvdFactors >= 5 ? "High" : ascvdFactors >= 3 ? "Moderate" : "Low";
    const ascvdVariant = ascvdFactors >= 5 ? "destructive" : ascvdFactors >= 3 ? "warning" : "success";
    scores.push({ label: "CV Risk", value: ascvdLevel, variant: ascvdVariant });

    // CHA2DS2-VASc estimation (simplified)
    let cha2ds2 = 0;
    if (age >= 75) cha2ds2 += 2;
    else if (age >= 65) cha2ds2 += 1;
    if (patient.sex === "female") cha2ds2 += 1;
    if (pastFamily?.hypertension) cha2ds2 += 1;
    if (pastFamily?.diabetes) cha2ds2 += 1;
    if (pastFamily?.ischemic_heart_disease || pastFamily?.rheumatic_heart_disease) cha2ds2 += 1;

    if (cha2ds2 > 0 || pastFamily) {
      const chaVariant = cha2ds2 >= 4 ? "destructive" : cha2ds2 >= 2 ? "warning" : "success";
      scores.push({ label: "CHA2DS2-VASc", value: String(cha2ds2), variant: chaVariant });
    }

    return scores;
  }, [patient, pastFamily]);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const sexOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];
const maritalOptions = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];
const smokingOptions = [
  { value: "never", label: "Never" },
  { value: "former", label: "Former" },
  { value: "current", label: "Current" },
];

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);

  // All clinical data loaded eagerly
  const [presentHistory, setPresentHistory] = useState<PresentHistory[]>([]);
  const [pastFamily, setPastFamily] = useState<PastFamilyHistory | null>(null);
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Dialog states
  const [showPresentDialog, setShowPresentDialog] = useState(false);
  const [showPastFamilyDialog, setShowPastFamilyDialog] = useState(false);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    full_name_ar: "",
    date_of_birth: "",
    sex: "" as Sex | "",
    marital_status: "" as MaritalStatus | "",
    phone: "",
    phone_alt: "",
    email: "",
    address: "",
    smoking_status: "" as SmokingStatus | "",
    notes: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTab = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openEditPatient = () => {
    if (!patient) return;
    setEditForm({
      full_name: patient.full_name,
      full_name_ar: patient.full_name_ar ?? "",
      date_of_birth: patient.date_of_birth,
      sex: patient.sex,
      marital_status: patient.marital_status ?? "",
      phone: patient.phone ?? "",
      phone_alt: patient.phone_alt ?? "",
      email: patient.email ?? "",
      address: patient.address ?? "",
      smoking_status: patient.smoking_status ?? "",
      notes: patient.notes ?? "",
    });
    setShowEditPatientDialog(true);
  };

  const handleEditPatient = async () => {
    if (!editForm.full_name.trim() || !editForm.date_of_birth || !editForm.sex) {
      toast({ variant: "error", title: "Name, date of birth, and sex are required" });
      return;
    }
    setEditSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: editForm.full_name.trim(),
        full_name_ar: editForm.full_name_ar.trim() || undefined,
        date_of_birth: editForm.date_of_birth,
        sex: editForm.sex,
        marital_status: editForm.marital_status || undefined,
        phone: editForm.phone.trim() || undefined,
        phone_alt: editForm.phone_alt.trim() || undefined,
        email: editForm.email.trim() || undefined,
        address: editForm.address.trim() || undefined,
        smoking_status: editForm.smoking_status || undefined,
        notes: editForm.notes.trim() || undefined,
      };
      const { data } = await api.patch<Patient>(`/patients/${id}`, payload);
      setPatient(data);
      setShowEditPatientDialog(false);
      toast({ variant: "success", title: "Patient updated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update patient";
      toast({ variant: "error", title: message });
    } finally {
      setEditSubmitting(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePatient = async () => {
    setDeleting(true);
    try {
      await api.delete(`/patients/${id}`);
      toast({ variant: "success", title: "Patient archived" });
      navigate("/patients", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive patient";
      toast({ variant: "error", title: message });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Load patient
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get<Patient>(`/patients/${id}`);
        setPatient(data);
      } catch {
        navigate("/patients", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id, navigate]);

  // Load ALL clinical data on mount (and on refreshKey change)
  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        const [phRes, pfRes, exRes, invRes, medRes, rxRes, fuRes] = await Promise.allSettled([
          api.get(`/patients/${id}/present-history`),
          api.get(`/patients/${id}/past-family-history`),
          api.get(`/patients/${id}/examinations`),
          api.get(`/patients/${id}/investigations`),
          api.get(`/patients/${id}/medications`),
          api.get(`/patients/${id}/prescriptions`),
          api.get(`/patients/${id}/follow-ups`),
        ]);

        if (phRes.status === "fulfilled") setPresentHistory(normalizeArray(phRes.value.data));
        if (pfRes.status === "fulfilled") {
          const pfData = pfRes.value.data;
          setPastFamily(pfData && typeof pfData === "object" && "id" in pfData ? pfData : null);
        }
        if (exRes.status === "fulfilled") setExaminations(normalizeArray(exRes.value.data));
        if (invRes.status === "fulfilled") setInvestigations(normalizeArray(invRes.value.data));
        if (medRes.status === "fulfilled") setMedications(normalizeArray(medRes.value.data));
        if (rxRes.status === "fulfilled") setPrescriptions(normalizeArray(rxRes.value.data));
        if (fuRes.status === "fulfilled") setFollowUps(normalizeArray(fuRes.value.data));
      } finally {
        setDataLoaded(true);
      }
    };
    fetchAll();
  }, [id, refreshKey]);

  // Computed vitals
  const latestExam = useMemo(
    () => [...examinations].sort((a, b) => b.examined_at.localeCompare(a.examined_at))[0] ?? null,
    [examinations]
  );
  const previousExam = useMemo(
    () => [...examinations].sort((a, b) => b.examined_at.localeCompare(a.examined_at))[1] ?? null,
    [examinations]
  );

  function getTrend(current?: number | null, previous?: number | null): "up" | "down" | "same" | null {
    if (current == null || previous == null) return null;
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "same";
  }

  // Recent activity across all clinical areas
  const recentActivity = useMemo(() => {
    const items: { type: string; date: string; label: string; detail: string }[] = [];

    presentHistory.forEach((ph) =>
      items.push({ type: "Present History", date: ph.recorded_at, label: "Present History", detail: ph.chest_pain ? `Chest pain: ${ph.chest_pain}` : "Symptom assessment" })
    );
    examinations.forEach((e) =>
      items.push({ type: "Examination", date: e.examined_at, label: "Examination", detail: e.bp_systolic ? `BP ${e.bp_systolic}/${e.bp_diastolic}` : "Physical exam" })
    );
    investigations.forEach((inv) =>
      items.push({ type: "Investigation", date: inv.investigation_date, label: "Investigation", detail: inv.echo_ef != null ? `EF ${inv.echo_ef}%` : inv.ecg_result ?? "Lab work" })
    );
    medications.forEach((med) =>
      items.push({ type: "Medication", date: med.started_at, label: "Medication", detail: `${med.medication_id} ${med.dosage}` })
    );
    prescriptions.forEach((rx) =>
      items.push({ type: "Prescription", date: rx.prescribed_at, label: "Prescription", detail: `${rx.items.length} item(s) - ${rx.status}` })
    );
    followUps.forEach((fu) =>
      items.push({ type: "Follow-up", date: fu.visit_date, label: "Follow-up", detail: fu.complaint ?? fu.diagnosis ?? "Visit" })
    );

    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [presentHistory, examinations, investigations, medications, prescriptions, followUps]);

  const riskScores = useRiskAssessment(patient, pastFamily);

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-6 h-36 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) return null;

  const age = calculateAge(patient.date_of_birth);

  // ======================================================================
  // PATIENT HEADER
  // ======================================================================
  const renderHeader = () => (
    <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.02] p-6 shadow-sm">
      {/* Back nav */}
      <button
        onClick={() => navigate("/patients")}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} />
        Back to Patients
      </button>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {patient.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{patient.full_name}</h1>
            {patient.full_name_ar && (
              <p className="text-sm text-muted-foreground" dir="rtl">{patient.full_name_ar}</p>
            )}

            {/* Badges row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{age} years</Badge>
              <Badge variant="outline" className="capitalize">{patient.sex}</Badge>
              {patient.marital_status && (
                <Badge variant="outline" className="capitalize">{patient.marital_status}</Badge>
              )}
              {patient.smoking_status && (
                <Badge
                  variant={patient.smoking_status === "current" ? "destructive" : patient.smoking_status === "former" ? "warning" : "success"}
                  className="flex items-center gap-1"
                >
                  <Cigarette size={12} />
                  {patient.smoking_status === "current"
                    ? `Smoker${patient.smoking_packs_day ? ` (${patient.smoking_packs_day} ppd)` : ""}`
                    : patient.smoking_status === "former"
                      ? "Ex-smoker"
                      : "Non-smoker"}
                </Badge>
              )}

              {/* Risk scores */}
              {riskScores.map((score) => (
                <Badge key={score.label} variant={score.variant} className="flex items-center gap-1">
                  <ShieldAlert size={12} />
                  {score.label}: {score.value}
                </Badge>
              ))}
            </div>

            {/* Contact row */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {patient.phone && (
                <a href={`tel:${patient.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-primary">
                  <Phone size={14} />
                  {patient.phone}
                </a>
              )}
              {patient.updated_at && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  Last updated: {formatDate(patient.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={openEditPatient}>
            <Edit size={15} />
            Edit Patient
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={15} />
            Archive
          </Button>
        </div>
      </div>
    </div>
  );

  // ======================================================================
  // OVERVIEW TAB
  // ======================================================================
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Vitals at a glance */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Vitals at a Glance
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Blood Pressure"
            value={latestExam?.bp_systolic ? `${latestExam.bp_systolic}/${latestExam.bp_diastolic}` : null}
            unit="mmHg"
            icon={<HeartPulse size={20} />}
            trend={getTrend(latestExam?.bp_systolic, previousExam?.bp_systolic)}
            color="rose"
          />
          <StatCard
            label="Pulse Rate"
            value={latestExam?.pulse_bpm ?? null}
            unit="bpm"
            icon={<Activity size={20} />}
            trend={getTrend(latestExam?.pulse_bpm, previousExam?.pulse_bpm)}
            color="amber"
          />
          <StatCard
            label="Weight"
            value={latestExam?.weight_kg ?? null}
            unit="kg"
            icon={<Weight size={20} />}
            trend={getTrend(latestExam?.weight_kg, previousExam?.weight_kg)}
            color="primary"
          />
          <StatCard
            label="BMI"
            value={latestExam?.bmi ? latestExam.bmi.toFixed(1) : null}
            icon={<Gauge size={20} />}
            trend={getTrend(latestExam?.bmi, previousExam?.bmi)}
            color="emerald"
          />
        </div>
      </div>

      {/* Vitals Trend Chart */}
      <VitalsTrendChart examinations={examinations} followUps={followUps} />

      {/* Quick Summary Cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Clinical Summary
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard title="Present History" icon={<Activity size={18} />} count={presentHistory.length} onClick={() => setActiveTab("present")} />
          <SummaryCard title="Examinations" icon={<Stethoscope size={18} />} count={examinations.length} onClick={() => setActiveTab("examinations")} />
          <SummaryCard title="Investigations" icon={<FlaskConical size={18} />} count={investigations.length} onClick={() => setActiveTab("investigations")} />
          <SummaryCard title="Medications" icon={<Pill size={18} />} count={medications.filter((m) => !m.ended_at).length} onClick={() => setActiveTab("medications")} />
          <SummaryCard title="Prescriptions" icon={<ClipboardList size={18} />} count={prescriptions.length} onClick={() => setActiveTab("prescriptions")} />
          <SummaryCard title="Follow-ups" icon={<CalendarCheck size={18} />} count={followUps.length} onClick={() => setActiveTab("followups")} />
        </div>
      </div>

      {/* Contact info card */}
      {(patient.address || patient.email || patient.notes) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Additional Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {patient.email && <InfoRow label="Email" value={patient.email} />}
            {patient.phone_alt && <InfoRow label="Alt Phone" value={patient.phone_alt} />}
            {patient.address && <InfoRow label="Address" value={patient.address} />}
          </div>
          {patient.notes && (
            <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{patient.notes}</p>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <Badge variant="outline" className="text-[10px]">{formatDate(item.date)}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ======================================================================
  // PRESENT HISTORY TAB
  // ======================================================================
  const renderPresent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Present History</h3>
        <Button size="sm" onClick={() => setShowPresentDialog(true)}>
          <Plus size={16} /> Add Record
        </Button>
      </div>
      {presentHistory.length === 0 ? (
        <EmptyTab label="present history records" />
      ) : (
        presentHistory
          .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
          .map((ph) => (
            <ClinicalCard key={ph.id}>
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline">{formatDate(ph.recorded_at)}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Chest Pain" value={ph.chest_pain && ph.chest_pain !== "none" ? <span className="capitalize">{ph.chest_pain}</span> : "None"} />
                <InfoRow label="Palpitations" value={ph.palpitations ? <span className="capitalize">{ph.palpitations}</span> : null} />
                <InfoRow label="Syncope" value={ph.syncope ? <span className="capitalize">{ph.syncope}</span> : null} />
                <InfoRow label="Dyspnea (exertional)" value={ph.dyspnea_exertional ? <Badge variant="warning">Yes</Badge> : "No"} />
                <InfoRow label="Dyspnea (PND)" value={ph.dyspnea_pnd ? <Badge variant="warning">Yes</Badge> : "No"} />
                <InfoRow label="Dyspnea (orthopnea)" value={ph.dyspnea_orthopnea ? <Badge variant="warning">Yes</Badge> : "No"} />
                <InfoRow label="Lower Limb Edema" value={ph.lower_limb_edema ? <Badge variant="warning">Yes</Badge> : "No"} />
                <InfoRow label="Abdominal Swelling" value={ph.abdominal_swelling ? <Badge variant="warning">Yes</Badge> : "No"} />
                {ph.dyspnea_grade != null && <InfoRow label="Dyspnea Grade" value={`Grade ${ph.dyspnea_grade}`} />}
              </div>
              {/* Low cardiac output symptoms */}
              {(ph.low_cardiac_output_dizziness || ph.low_cardiac_output_blurring || ph.low_cardiac_output_fatigue) && (
                <div className="mt-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                  <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-400">Low Cardiac Output Symptoms</p>
                  <div className="flex flex-wrap gap-2 text-xs text-amber-600 dark:text-amber-400">
                    {ph.low_cardiac_output_dizziness && <Badge variant="warning">Dizziness</Badge>}
                    {ph.low_cardiac_output_blurring && <Badge variant="warning">Blurring</Badge>}
                    {ph.low_cardiac_output_fatigue && <Badge variant="warning">Fatigue</Badge>}
                  </div>
                </div>
              )}
              {ph.remarks && (
                <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{ph.remarks}</p>
              )}
            </ClinicalCard>
          ))
      )}
    </div>
  );

  // ======================================================================
  // PAST / FAMILY HISTORY TAB
  // ======================================================================
  const renderPastFamily = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Past / Family History</h3>
        <Button size="sm" onClick={() => setShowPastFamilyDialog(true)}>
          <Plus size={16} /> {pastFamily ? "Edit" : "Add"} History
        </Button>
      </div>
      {!pastFamily ? (
        <EmptyTab label="past / family history" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Personal History */}
          <ClinicalCard>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <User size={14} />
              Personal History
            </h4>
            <div className="grid gap-2">
              <InfoRow label="Diabetes" value={pastFamily.diabetes ? <Badge variant="destructive">Yes</Badge> : "No"} />
              <InfoRow label="Hypertension" value={pastFamily.hypertension ? <Badge variant="destructive">Yes</Badge> : "No"} />
              <InfoRow label="Rheumatic HD" value={pastFamily.rheumatic_heart_disease ? <Badge variant="destructive">Yes</Badge> : "No"} />
              <InfoRow label="Ischemic HD" value={pastFamily.ischemic_heart_disease ? <Badge variant="destructive">Yes</Badge> : "No"} />
              {pastFamily.cabg && <InfoRow label="CABG" value={pastFamily.cabg} />}
              {pastFamily.valve_replacement && <InfoRow label="Valve Replacement" value={pastFamily.valve_replacement} />}
              {pastFamily.other_conditions && <InfoRow label="Other" value={pastFamily.other_conditions} />}
            </div>
          </ClinicalCard>

          {/* Family History */}
          <ClinicalCard>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText size={14} />
              Family History
            </h4>
            <div className="grid gap-2">
              <InfoRow label="Consanguinity" value={pastFamily.family_consanguinity ? <Badge variant="warning">Yes</Badge> : "No"} />
              <InfoRow label="Hypertension" value={pastFamily.family_hypertension ? <Badge variant="destructive">Yes</Badge> : "No"} />
              <InfoRow label="Diabetes" value={pastFamily.family_diabetes ? <Badge variant="destructive">Yes</Badge> : "No"} />
              <InfoRow label="IHD" value={pastFamily.family_ihd ? <Badge variant="destructive">Yes</Badge> : "No"} />
              {pastFamily.family_other && <InfoRow label="Other" value={pastFamily.family_other} />}
            </div>
          </ClinicalCard>

          {pastFamily.comments && (
            <div className="lg:col-span-2">
              <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">{pastFamily.comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ======================================================================
  // EXAMINATIONS TAB
  // ======================================================================
  const renderExaminations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Examinations</h3>
        <Button size="sm" onClick={() => setShowExamDialog(true)}>
          <Plus size={16} /> Add Examination
        </Button>
      </div>

      {/* Mini vitals chart at top */}
      {examinations.length >= 2 && <VitalsTrendChart examinations={examinations} followUps={[]} />}

      {examinations.length === 0 ? (
        <EmptyTab label="examination records" />
      ) : (
        examinations
          .sort((a, b) => b.examined_at.localeCompare(a.examined_at))
          .map((exam) => (
            <ClinicalCard key={exam.id}>
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline">{formatDate(exam.examined_at)}</Badge>
                <div className="flex items-center gap-2">
                  {exam.bp_systolic && (
                    <Badge variant={exam.bp_systolic >= 140 ? "destructive" : "success"}>
                      BP {exam.bp_systolic}/{exam.bp_diastolic}
                    </Badge>
                  )}
                  {exam.pulse_bpm && (
                    <Badge variant={exam.pulse_bpm > 100 || exam.pulse_bpm < 60 ? "warning" : "success"}>
                      {exam.pulse_bpm} bpm
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {exam.weight_kg != null && <InfoRow label="Weight" value={`${exam.weight_kg} kg`} />}
                {exam.height_cm != null && <InfoRow label="Height" value={`${exam.height_cm} cm`} />}
                {exam.bmi != null && <InfoRow label="BMI" value={exam.bmi.toFixed(1)} />}
                {exam.activity_level && <InfoRow label="Activity" value={<span className="capitalize">{exam.activity_level}</span>} />}
                {exam.head_neck && <InfoRow label="Head & Neck" value={exam.head_neck} />}
                {exam.upper_limb && <InfoRow label="Upper Limb" value={exam.upper_limb} />}
                {exam.lower_limb && <InfoRow label="Lower Limb" value={exam.lower_limb} />}
                {exam.abdomen && <InfoRow label="Abdomen" value={exam.abdomen} />}
                {exam.chest && <InfoRow label="Chest" value={exam.chest} />}
                {exam.neurology && <InfoRow label="Neurology" value={exam.neurology} />}
                {exam.cardiac_apex && <InfoRow label="Cardiac Apex" value={exam.cardiac_apex} />}
                {exam.cardiac_murmurs && <InfoRow label="Murmurs" value={exam.cardiac_murmurs} />}
                {exam.cardiac_additional_sounds && <InfoRow label="Additional Sounds" value={exam.cardiac_additional_sounds} />}
              </div>
              {/* Heart sounds */}
              <div className="mt-3 flex flex-wrap gap-2">
                {exam.cardiac_s1 && <Badge>S1</Badge>}
                {exam.cardiac_s2 && <Badge>S2</Badge>}
                {exam.cardiac_s3 && <Badge variant="warning">S3</Badge>}
                {exam.cardiac_s4 && <Badge variant="warning">S4</Badge>}
              </div>
              {exam.remarks && (
                <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{exam.remarks}</p>
              )}
            </ClinicalCard>
          ))
      )}
    </div>
  );

  // ======================================================================
  // INVESTIGATIONS TAB
  // ======================================================================
  const renderInvestigations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Investigations</h3>
        <Button size="sm" onClick={() => setShowInvestigationDialog(true)}>
          <Plus size={16} /> Add Investigation
        </Button>
      </div>

      {/* EF trend chart */}
      <EFTrendChart investigations={investigations} />

      {investigations.length === 0 ? (
        <EmptyTab label="investigation records" />
      ) : (
        investigations
          .sort((a, b) => b.investigation_date.localeCompare(a.investigation_date))
          .map((inv) => (
            <ClinicalCard key={inv.id}>
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline">{formatDate(inv.investigation_date)}</Badge>
                {inv.echo_ef != null && (
                  <Badge variant={inv.echo_ef < 40 ? "destructive" : inv.echo_ef < 55 ? "warning" : "success"}>
                    EF {inv.echo_ef}%
                  </Badge>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inv.ecg_result && <InfoRow label="ECG" value={inv.ecg_result} />}
                {inv.stress_test && <InfoRow label="Stress Test" value={inv.stress_test} />}
                {inv.cardiac_cath && <InfoRow label="Cardiac Cath" value={inv.cardiac_cath} />}
                {inv.echo_ef != null && <InfoRow label="Echo EF" value={`${inv.echo_ef}%`} />}
                {inv.echo_lvedd != null && <InfoRow label="LVEDD" value={`${inv.echo_lvedd} mm`} />}
                {inv.echo_lvesd != null && <InfoRow label="LVESD" value={`${inv.echo_lvesd} mm`} />}
                {inv.echo_ivs != null && <InfoRow label="IVS" value={`${inv.echo_ivs} mm`} />}
                {inv.echo_pwt != null && <InfoRow label="PWT" value={`${inv.echo_pwt} mm`} />}
                {inv.echo_fs != null && <InfoRow label="FS" value={`${inv.echo_fs}%`} />}
                {inv.echo_ao != null && <InfoRow label="Ao" value={`${inv.echo_ao} mm`} />}
                {inv.echo_la != null && <InfoRow label="LA" value={`${inv.echo_la} mm`} />}
                {inv.echo_ao_valve && <InfoRow label="Ao Valve" value={inv.echo_ao_valve} />}
                {inv.echo_mit_valve && <InfoRow label="Mitral Valve" value={inv.echo_mit_valve} />}
                {inv.echo_pulm_valve && <InfoRow label="Pulm Valve" value={inv.echo_pulm_valve} />}
                {inv.echo_tric_valve && <InfoRow label="Tric Valve" value={inv.echo_tric_valve} />}
                {inv.diagnosis && <InfoRow label="Diagnosis" value={inv.diagnosis} />}
              </div>
              {inv.lab_results && inv.lab_results.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lab Results
                  </h4>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {inv.lab_results.map((lr) => (
                      <div
                        key={lr.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                          lr.is_abnormal
                            ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                            : "bg-muted/50"
                        )}
                      >
                        <span className="font-medium">{lr.test_name}</span>
                        <span>
                          {lr.value}
                          {lr.unit && <span className="ml-1 text-muted-foreground">{lr.unit}</span>}
                          {lr.reference_range && (
                            <span className="ml-1 text-xs text-muted-foreground">({lr.reference_range})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {inv.remarks && (
                <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{inv.remarks}</p>
              )}
            </ClinicalCard>
          ))
      )}
    </div>
  );

  // ======================================================================
  // MEDICATIONS TAB
  // ======================================================================
  const renderMedications = () => {
    const active = medications.filter((m) => !m.ended_at);
    const stopped = medications.filter((m) => m.ended_at);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Medications</h3>
          <Button size="sm" onClick={() => setShowMedicationDialog(true)}>
            <Plus size={16} /> Add Medication
          </Button>
        </div>
        {medications.length === 0 ? (
          <EmptyTab label="medication records" />
        ) : (
          <>
            {/* Active medications */}
            {active.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Active ({active.length})
                </h4>
                <div className="space-y-2">
                  {active.map((med) => (
                    <ClinicalCard key={med.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{med.medication_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} &mdash; {med.frequency}
                          </p>
                          {med.instructions && (
                            <p className="mt-1 text-xs text-muted-foreground">{med.instructions}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="success">Active</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">Since {formatDate(med.started_at)}</p>
                        </div>
                      </div>
                    </ClinicalCard>
                  ))}
                </div>
              </div>
            )}

            {/* Stopped medications */}
            {stopped.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stopped ({stopped.length})
                </h4>
                <div className="space-y-2">
                  {stopped.map((med) => (
                    <ClinicalCard key={med.id} className="opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{med.medication_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} &mdash; {med.frequency}
                          </p>
                          {med.reason_stopped && (
                            <p className="mt-1 text-xs text-amber-600">Reason: {med.reason_stopped}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Stopped</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(med.started_at)} - {formatDate(med.ended_at!)}
                          </p>
                        </div>
                      </div>
                    </ClinicalCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ======================================================================
  // PRESCRIPTIONS TAB
  // ======================================================================
  const renderPrescriptions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Prescriptions</h3>
        <Button size="sm" onClick={() => setShowPrescriptionDialog(true)}>
          <Plus size={16} /> New Prescription
        </Button>
      </div>
      {prescriptions.length === 0 ? (
        <EmptyTab label="prescriptions" />
      ) : (
        prescriptions
          .sort((a, b) => b.prescribed_at.localeCompare(a.prescribed_at))
          .map((rx) => (
            <PrescriptionView
              key={rx.id}
              patientId={id!}
              prescription={rx}
              patientName={patient?.full_name ?? ""}
              onUpdate={refreshTab}
            />
          ))
      )}
    </div>
  );

  // ======================================================================
  // FOLLOW-UPS TAB
  // ======================================================================
  const renderFollowUps = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Follow-ups</h3>
        <Button size="sm" onClick={() => setShowFollowUpDialog(true)}>
          <Plus size={16} /> Add Follow-up
        </Button>
      </div>
      {followUps.length === 0 ? (
        <EmptyTab label="follow-up records" />
      ) : (
        followUps
          .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
          .map((fu) => (
            <ClinicalCard key={fu.id}>
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="outline">{formatDate(fu.visit_date)}</Badge>
                <div className="flex items-center gap-2">
                  {fu.bp_systolic && (
                    <Badge variant={fu.bp_systolic >= 140 ? "destructive" : "success"}>
                      BP {fu.bp_systolic}/{fu.bp_diastolic}
                    </Badge>
                  )}
                  {fu.pulse_bpm && (
                    <Badge variant={fu.pulse_bpm > 100 || fu.pulse_bpm < 60 ? "warning" : "success"}>
                      {fu.pulse_bpm} bpm
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {fu.complaint && <InfoRow label="Complaint" value={fu.complaint} />}
                {fu.present_history && <InfoRow label="Present History" value={fu.present_history} />}
                {fu.examination && <InfoRow label="Examination" value={fu.examination} />}
                {fu.investigation && <InfoRow label="Investigation" value={fu.investigation} />}
                {fu.diagnosis && <InfoRow label="Diagnosis" value={fu.diagnosis} />}
                {fu.plan && <InfoRow label="Plan" value={fu.plan} />}
              </div>
              {fu.next_follow_up && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                  <CalendarCheck size={14} className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Next follow-up: {formatDate(fu.next_follow_up)}
                  </span>
                </div>
              )}
            </ClinicalCard>
          ))
      )}
    </div>
  );

  // ======================================================================
  // TAB CONTENT MAP
  // ======================================================================
  const tabContent: Record<TabKey, () => React.ReactNode> = {
    overview: renderOverview,
    present: renderPresent,
    past_family: renderPastFamily,
    examinations: renderExaminations,
    investigations: renderInvestigations,
    medications: renderMedications,
    prescriptions: renderPrescriptions,
    followups: renderFollowUps,
  };

  // ======================================================================
  // RENDER
  // ======================================================================
  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      {/* Patient Header */}
      {renderHeader()}

      {/* Tab Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-0.5 rounded-xl bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {!dataLoaded ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            tabContent[activeTab]()
          )}
        </motion.div>
      </AnimatePresence>

      {/* Clinical form dialogs */}
      <AddPresentHistoryDialog
        patientId={id!}
        open={showPresentDialog}
        onClose={() => setShowPresentDialog(false)}
        onSuccess={refreshTab}
      />
      <EditPastFamilyHistoryDialog
        patientId={id!}
        open={showPastFamilyDialog}
        onClose={() => setShowPastFamilyDialog(false)}
        onSuccess={refreshTab}
        initialData={pastFamily}
      />
      <AddExaminationDialog
        patientId={id!}
        open={showExamDialog}
        onClose={() => setShowExamDialog(false)}
        onSuccess={refreshTab}
      />
      <AddInvestigationDialog
        patientId={id!}
        open={showInvestigationDialog}
        onClose={() => setShowInvestigationDialog(false)}
        onSuccess={refreshTab}
      />
      <AddMedicationDialog
        patientId={id!}
        open={showMedicationDialog}
        onClose={() => setShowMedicationDialog(false)}
        onSuccess={refreshTab}
      />
      <AddPrescriptionDialog
        patientId={id!}
        open={showPrescriptionDialog}
        onClose={() => setShowPrescriptionDialog(false)}
        onSuccess={refreshTab}
      />
      <AddFollowUpDialog
        patientId={id!}
        open={showFollowUpDialog}
        onClose={() => setShowFollowUpDialog(false)}
        onSuccess={refreshTab}
      />

      {/* Archive Patient Confirmation */}
      <Dialog open={showDeleteConfirm} onClose={() => { if (!deleting) setShowDeleteConfirm(false); }}>
        <DialogHeader>
          <DialogTitle>Archive Patient</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong>{patient?.full_name}</strong>? The record will be hidden but not permanently deleted. It can be restored from the audit log.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeletePatient} loading={deleting}>
            Archive Patient
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditPatientDialog} onClose={() => { if (!editSubmitting) setShowEditPatientDialog(false); }}>
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
          <DialogDescription>Update patient demographics and contact information</DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                placeholder="Patient full name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
              <Input
                label="Full Name (Arabic)"
                placeholder="الاسم الكامل"
                value={editForm.full_name_ar}
                onChange={(e) => setEditForm({ ...editForm, full_name_ar: e.target.value })}
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Date of Birth *"
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
              />
              <Select
                label="Sex *"
                placeholder="Select sex"
                value={editForm.sex}
                onChange={(e) => setEditForm({ ...editForm, sex: e.target.value as Sex })}
                options={sexOptions}
              />
            </div>
            <Select
              label="Marital Status"
              placeholder="Select marital status"
              value={editForm.marital_status}
              onChange={(e) => setEditForm({ ...editForm, marital_status: e.target.value as MaritalStatus })}
              options={maritalOptions}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                type="tel"
                placeholder="Primary phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Input
                label="Alternate Phone"
                type="tel"
                placeholder="Secondary phone"
                value={editForm.phone_alt}
                onChange={(e) => setEditForm({ ...editForm, phone_alt: e.target.value })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="patient@example.com"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Address"
              placeholder="Full address"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
            <Select
              label="Smoking Status"
              placeholder="Select smoking status"
              value={editForm.smoking_status}
              onChange={(e) => setEditForm({ ...editForm, smoking_status: e.target.value as SmokingStatus })}
              options={smokingOptions}
            />
            <Textarea
              label="Notes"
              placeholder="Optional notes..."
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowEditPatientDialog(false)} disabled={editSubmitting}>
            Cancel
          </Button>
          <Button loading={editSubmitting} onClick={handleEditPatient}>
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
