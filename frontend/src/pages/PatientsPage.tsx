import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Patient, PaginatedResponse, Sex, MaritalStatus, SmokingStatus } from "@/types";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

const emptyPatientForm = {
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
};

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

export default function PatientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const pageSize = 15;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Add Patient dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(emptyPatientForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Open dialog when URL has ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowAddDialog(true);
    }
  }, [searchParams]);

  const closeAddDialog = () => {
    setShowAddDialog(false);
    setAddForm(emptyPatientForm);
    setAddErrors({});
    // Remove ?new=1 from URL if present
    if (searchParams.get("new")) {
      const params = new URLSearchParams(searchParams);
      params.delete("new");
      setSearchParams(params, { replace: true });
    }
  };

  const handleAddPatient = async () => {
    const errors: Record<string, string> = {};
    if (!addForm.full_name.trim()) errors.full_name = "Name is required";
    if (!addForm.date_of_birth) errors.date_of_birth = "Date of birth is required";
    if (!addForm.sex) errors.sex = "Sex is required";
    if (Object.keys(errors).length) {
      setAddErrors(errors);
      return;
    }
    setAddErrors({});
    setAddSubmitting(true);
    try {
      // Build payload, omitting empty optional fields
      const payload: Record<string, unknown> = {
        full_name: addForm.full_name.trim(),
        date_of_birth: addForm.date_of_birth,
        sex: addForm.sex,
      };
      if (addForm.full_name_ar.trim()) payload.full_name_ar = addForm.full_name_ar.trim();
      if (addForm.marital_status) payload.marital_status = addForm.marital_status;
      if (addForm.phone.trim()) payload.phone = addForm.phone.trim();
      if (addForm.phone_alt.trim()) payload.phone_alt = addForm.phone_alt.trim();
      if (addForm.email.trim()) payload.email = addForm.email.trim();
      if (addForm.address.trim()) payload.address = addForm.address.trim();
      if (addForm.smoking_status) payload.smoking_status = addForm.smoking_status;
      if (addForm.notes.trim()) payload.notes = addForm.notes.trim();

      const { data } = await api.post<Patient>("/patients", payload);
      toast({ variant: "success", title: "Patient created successfully" });
      setShowAddDialog(false);
      setAddForm(emptyPatientForm);
      setAddErrors({});
      fetchPatients();
      navigate(`/patients/${data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create patient";
      toast({ variant: "error", title: msg });
    } finally {
      setAddSubmitting(false);
    }
  };

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get<PaginatedResponse<Patient>>("/patients", {
        params,
      });
      setPatients(data.items);
      setTotal(data.total);
    } catch {
      setPatients([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.q = search;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [search, page, setSearchParams]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Patient Records
          </h2>
          <p className="text-sm text-muted-foreground">
            {total} patient{total !== 1 && "s"} total
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus size={18} />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className={cn(
            "w-full rounded-xl border border-input bg-card py-2.5 pl-11 pr-10 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          )}
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
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
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto hidden h-4 w-28 sm:block" />
                <Skeleton className="hidden h-4 w-16 md:block" />
                <Skeleton className="hidden h-4 w-24 lg:block" />
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {search ? "No patients match your search" : "No patients yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search terms"
                : "Add your first patient to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Phone
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Sex
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Date of Birth
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {patient.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {patient.full_name}
                          </p>
                          {patient.email && (
                            <p className="truncate text-xs text-muted-foreground">
                              {patient.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground sm:table-cell">
                      {patient.phone ?? "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-sm capitalize text-muted-foreground md:table-cell">
                      {patient.sex}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground lg:table-cell">
                      {patient.date_of_birth}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/patients/${patient.id}`);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
      {/* Add Patient Dialog */}
      <Dialog open={showAddDialog} onClose={closeAddDialog}>
        <DialogHeader>
          <DialogTitle>Add Patient</DialogTitle>
          <DialogDescription>Register a new patient record</DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                placeholder="Patient full name"
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                error={addErrors.full_name}
              />
              <Input
                label="Full Name (Arabic)"
                placeholder="الاسم الكامل"
                value={addForm.full_name_ar}
                onChange={(e) => setAddForm({ ...addForm, full_name_ar: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Date of Birth *"
                type="date"
                value={addForm.date_of_birth}
                onChange={(e) => setAddForm({ ...addForm, date_of_birth: e.target.value })}
                error={addErrors.date_of_birth}
              />
              <Select
                label="Sex *"
                placeholder="Select sex"
                value={addForm.sex}
                onChange={(e) => setAddForm({ ...addForm, sex: e.target.value as Sex })}
                options={sexOptions}
                error={addErrors.sex}
              />
            </div>
            <Select
              label="Marital Status"
              placeholder="Select marital status"
              value={addForm.marital_status}
              onChange={(e) => setAddForm({ ...addForm, marital_status: e.target.value as MaritalStatus })}
              options={maritalOptions}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                type="tel"
                placeholder="Primary phone"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              />
              <Input
                label="Alternate Phone"
                type="tel"
                placeholder="Secondary phone"
                value={addForm.phone_alt}
                onChange={(e) => setAddForm({ ...addForm, phone_alt: e.target.value })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="patient@example.com"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            />
            <Input
              label="Address"
              placeholder="Full address"
              value={addForm.address}
              onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
            />
            <Select
              label="Smoking Status"
              placeholder="Select smoking status"
              value={addForm.smoking_status}
              onChange={(e) => setAddForm({ ...addForm, smoking_status: e.target.value as SmokingStatus })}
              options={smokingOptions}
            />
            <Textarea
              label="Notes"
              placeholder="Optional notes..."
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              rows={3}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={closeAddDialog}>
            Cancel
          </Button>
          <Button loading={addSubmitting} onClick={handleAddPatient}>
            Create Patient
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
