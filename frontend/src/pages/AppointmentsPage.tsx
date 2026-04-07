import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarPlus,
  Filter,
  X,
  Clock,
  Calendar,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  Patient,
  PaginatedResponse,
} from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  confirmed: "bg-indigo-50 text-indigo-700",
  arrived: "bg-emerald-50 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-amber-50 text-amber-700",
};

const typeLabels: Record<AppointmentType, string> = {
  new: "New Visit",
  follow_up: "Follow-up",
  procedure: "Procedure",
  telemedicine: "Telemedicine",
};

const allStatuses: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "arrived",
  "completed",
  "cancelled",
  "no_show",
];

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [showNewDialog, setShowNewDialog] = useState(false);

  // New appointment form state
  const [newForm, setNewForm] = useState({
    patient_id: "",
    scheduled_at: "",
    duration_minutes: 30,
    type: "new" as AppointmentType,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Patient search state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search patients by name with debounce
  const searchPatients = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }
    setPatientSearching(true);
    try {
      const { data } = await api.get<PaginatedResponse<Patient>>("/patients", {
        params: { search: query, page_size: 5 },
      });
      const items = Array.isArray(data) ? data : data.items ?? [];
      setPatientResults(items);
      setShowPatientDropdown(items.length > 0);
    } catch {
      setPatientResults([]);
    } finally {
      setPatientSearching(false);
    }
  }, []);

  const handlePatientQueryChange = (value: string) => {
    setPatientQuery(value);
    setSelectedPatient(null);
    setNewForm((f) => ({ ...f, patient_id: "" }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchPatients(value), 300);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientQuery(patient.full_name);
    setNewForm((f) => ({ ...f, patient_id: patient.id }));
    setShowPatientDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        patientSearchRef.current &&
        !patientSearchRef.current.contains(e.target as Node)
      ) {
        setShowPatientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetForm = () => {
    setNewForm({
      patient_id: "",
      scheduled_at: "",
      duration_minutes: 30,
      type: "new",
      notes: "",
    });
    setPatientQuery("");
    setSelectedPatient(null);
    setPatientResults([]);
    setShowPatientDropdown(false);
    setFormError("");
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<
        PaginatedResponse<Appointment> | Appointment[]
      >("/appointments", { params });
      const items = Array.isArray(data) ? data : data.items ?? [];
      setAppointments(items);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleNewAppointment = async () => {
    setFormError("");
    if (!newForm.patient_id || !newForm.scheduled_at) {
      setFormError("Please select a patient and choose a date/time.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/appointments", newForm);
      setShowNewDialog(false);
      resetForm();
      toast({ title: "Appointment created", variant: "default" });
      fetchAppointments();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create appointment";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Appointments</h2>
          <p className="text-sm text-muted-foreground">
            Manage and schedule patient appointments
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <CalendarPlus size={18} />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AppointmentStatus | "")
            }
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {allStatuses.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <button
            onClick={() => {
              setDateFilter("");
              setStatusFilter("");
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto h-4 w-24" />
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Clock size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No appointments found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dateFilter
                ? "No appointments for this date"
                : "Schedule your first appointment"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date / Time
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Duration
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {apt.patient_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(apt.scheduled_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground sm:table-cell">
                      {apt.duration_minutes} min
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground md:table-cell">
                      {typeLabels[apt.type]}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                          statusColors[apt.status]
                        )}
                      >
                        {apt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-6 py-4 text-sm text-muted-foreground lg:table-cell">
                      {apt.notes ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* New Appointment Dialog */}
      <AnimatePresence>
        {showNewDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowNewDialog(false); resetForm(); }}
              className="fixed inset-0 z-40 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    New Appointment
                  </h3>
                  <button
                    onClick={() => { setShowNewDialog(false); resetForm(); }}
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div ref={patientSearchRef} className="relative">
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Patient
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="text"
                        value={patientQuery}
                        onChange={(e) =>
                          handlePatientQueryChange(e.target.value)
                        }
                        onFocus={() => {
                          if (patientResults.length > 0 && !selectedPatient)
                            setShowPatientDropdown(true);
                        }}
                        className={cn(
                          "w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                          selectedPatient && "border-emerald-400 bg-emerald-50/50"
                        )}
                        placeholder="Search by patient name..."
                      />
                      {patientSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      )}
                      {selectedPatient && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(null);
                            setPatientQuery("");
                            setNewForm((f) => ({ ...f, patient_id: "" }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {showPatientDropdown && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPatient(p)}
                            className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {p.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {p.phone ?? "No phone"} &middot; DOB:{" "}
                              {new Date(p.date_of_birth).toLocaleDateString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newForm.scheduled_at}
                      onChange={(e) =>
                        setNewForm({ ...newForm, scheduled_at: e.target.value })
                      }
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={newForm.duration_minutes}
                        onChange={(e) =>
                          setNewForm({
                            ...newForm,
                            duration_minutes: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Type
                      </label>
                      <select
                        value={newForm.type}
                        onChange={(e) =>
                          setNewForm({
                            ...newForm,
                            type: e.target.value as AppointmentType,
                          })
                        }
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      >
                        {Object.entries(typeLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Notes
                    </label>
                    <textarea
                      value={newForm.notes}
                      onChange={(e) =>
                        setNewForm({ ...newForm, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => { setShowNewDialog(false); resetForm(); }}
                  >
                    Cancel
                  </Button>
                  <Button loading={submitting} onClick={handleNewAppointment}>
                    Create Appointment
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
