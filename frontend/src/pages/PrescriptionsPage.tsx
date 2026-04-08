import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  ClipboardList,
  Plus,
  Printer,
  Eye,
  FileCheck,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { Prescription, Patient, PaginatedResponse, Medication } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { PrescriptionView } from "@/components/clinical/PrescriptionView";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/* ---------- Status badge ---------- */
const statusColors: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  finalized: "bg-emerald-100 text-emerald-800 border-emerald-200",
  voided: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        statusColors[status] ?? "bg-secondary text-secondary-foreground"
      )}
    >
      {status}
    </span>
  );
}

/* ---------- New Prescription Dialog ---------- */

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

function NewPrescriptionDialog({
  open,
  onClose,
  onSuccess,
  preselectedPatientId,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPatientId?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Medications catalog
  const [medications, setMedications] = useState<Medication[]>([]);

  // Form
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItemRow[]>([emptyItem()]);

  // Load medications on open
  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotes("");
    setItems([emptyItem()]);
    setSelectedPatient(null);
    setPatientSearch("");

    (async () => {
      try {
        const { data } = await api.get("/medications", { params: { page_size: 2000 } });
        setMedications(data.items ?? data);
      } catch {
        // silent
      }
    })();
  }, [open]);

  // Preselect patient if provided
  useEffect(() => {
    if (!open || !preselectedPatientId) return;
    (async () => {
      try {
        const { data } = await api.get(`/patients/${preselectedPatientId}`);
        setSelectedPatient(data);
        setPatientSearch(data.full_name);
      } catch {
        // silent
      }
    })();
  }, [open, preselectedPatientId]);

  // Search patients
  useEffect(() => {
    if (!open || patientSearch.length < 2 || selectedPatient) {
      setPatients([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/patients", {
          params: { search: patientSearch, page_size: 10 },
        });
        setPatients(data.items ?? data);
        setShowPatientDropdown(true);
      } catch {
        setPatients([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, open, selectedPatient]);

  function selectPatient(p: Patient) {
    setSelectedPatient(p);
    setPatientSearch(p.full_name);
    setShowPatientDropdown(false);
  }

  function clearPatient() {
    setSelectedPatient(null);
    setPatientSearch("");
  }

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

  // Auto-fill dosage when medication selected
  function handleMedicationChange(key: string, medId: string) {
    updateItem(key, "medication_id", medId);
    const med = medications.find((m) => m.id === medId);
    if (med?.default_dosage) {
      updateItem(key, "dosage", med.default_dosage);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setError("Please select a patient.");
      return;
    }
    const validItems = items.filter((i) => i.medication_id && i.dosage && i.frequency);
    if (validItems.length === 0) {
      setError("Add at least one complete item (medication, dosage, frequency).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/patients/${selectedPatient.id}/prescriptions`, {
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
      toast({ variant: "success", title: "Prescription created" });
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
        <DialogTitle>New Prescription</DialogTitle>
        <DialogDescription>
          Select a patient, add medications, dosages, and instructions.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="max-h-[70vh] overflow-y-auto">
        <form id="form-new-prescription" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Patient selector */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-foreground">Patient</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Search patient by name or ID..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    if (selectedPatient) setSelectedPatient(null);
                  }}
                  onFocus={() => patients.length > 0 && setShowPatientDropdown(true)}
                />
                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/50"
                        onClick={() => selectPatient(p)}
                      >
                        <span className="font-medium">{p.full_name}</span>
                        {p.legacy_id && (
                          <span className="text-xs text-muted-foreground">
                            ID: {p.legacy_id}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <button
                  type="button"
                  onClick={clearPatient}
                  className="shrink-0 rounded-lg border border-border px-2 py-2 text-xs text-muted-foreground hover:bg-secondary"
                >
                  Clear
                </button>
              )}
            </div>
            {selectedPatient && (
              <div className="mt-2 flex items-center gap-4 rounded-lg bg-secondary/50 p-3 text-sm">
                <div>
                  <span className="font-medium">{selectedPatient.full_name}</span>
                  {selectedPatient.full_name_ar && (
                    <span className="ml-2 text-muted-foreground" dir="rtl">
                      {selectedPatient.full_name_ar}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  ID: {selectedPatient.legacy_id || selectedPatient.id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Date: {new Date().toLocaleDateString("en-GB")}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Notes</label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] resize-y"
              placeholder="Optional prescription notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Prescription Items */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Prescription Items
            </label>

            {items.map((item, idx) => (
              <div
                key={item.key}
                className="mb-3 rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
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
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Medication
                    </label>
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                      value={item.medication_id}
                      onChange={(e) => handleMedicationChange(item.key, e.target.value)}
                    >
                      <option value="">Select medication...</option>
                      {medOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Dosage
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. 50mg"
                      value={item.dosage}
                      onChange={(e) => updateItem(item.key, "dosage", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Frequency
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. twice daily"
                      value={item.frequency}
                      onChange={(e) => updateItem(item.key, "frequency", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Duration
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Optional (e.g. 7 days)"
                      value={item.duration}
                      onChange={(e) => updateItem(item.key, "duration", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Instructions
                    </label>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Optional"
                      value={item.instructions}
                      onChange={(e) => updateItem(item.key, "instructions", e.target.value)}
                    />
                  </div>
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
        <Button type="submit" form="form-new-prescription" loading={loading}>
          Create Prescription
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Main Page ---------- */

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  // Expanded prescription view
  const [expandedRxId, setExpandedRxId] = useState<string | null>(null);

  // New prescription dialog
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Blank PDF
  const [downloadingBlank, setDownloadingBlank] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get("/prescriptions", { params });
      setPrescriptions(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Failed to load prescriptions",
        description: err.response?.data?.detail ?? "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const totalPages = Math.ceil(total / pageSize);

  async function handleDownloadBlank() {
    setDownloadingBlank(true);
    try {
      const { data } = await api.post("/prescriptions/blank-pdf", {}, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "prescription_blank.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ variant: "success", title: "Blank prescription downloaded" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Blank PDF failed",
        description: err.response?.data?.detail ?? "Something went wrong.",
      });
    } finally {
      setDownloadingBlank(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Prescriptions</h1>
            <p className="text-sm text-muted-foreground">
              {total} prescription{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={downloadingBlank}
            onClick={handleDownloadBlank}
          >
            <Printer size={16} />
            Print Blank
          </Button>
          <Button size="sm" onClick={() => setShowNewDialog(true)}>
            <Plus size={16} />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          {["", "draft", "finalized", "voided"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-border text-muted-foreground hover:border-indigo-200 hover:text-indigo-600"
              )}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16">
          <ClipboardList size={40} className="text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No prescriptions found</p>
          <Button size="sm" className="mt-4" onClick={() => setShowNewDialog(true)}>
            <Plus size={16} />
            Create First Prescription
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id}>
              {/* Collapsed row */}
              {expandedRxId !== rx.id ? (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:bg-secondary/30 cursor-pointer"
                  onClick={() => setExpandedRxId(rx.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {rx.patient_name || "Unknown Patient"}
                      </span>
                      <StatusBadge status={rx.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(rx.prescribed_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>{rx.items.length} item{rx.items.length !== 1 ? "s" : ""}</span>
                      {rx.prescriber_name && <span>by {rx.prescriber_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${rx.patient_id}`);
                      }}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="View patient"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Expanded view */
                <div className="space-y-2">
                  <button
                    onClick={() => setExpandedRxId(null)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={14} /> Collapse
                  </button>
                  <PrescriptionView
                    patientId={rx.patient_id}
                    prescription={rx}
                    patientName={rx.patient_name || ""}
                    onUpdate={fetchPrescriptions}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* New prescription dialog */}
      <NewPrescriptionDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onSuccess={fetchPrescriptions}
      />
    </motion.div>
  );
}
