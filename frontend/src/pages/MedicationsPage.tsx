import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Pill, X, Plus, Pencil, Globe, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { Medication } from "@/types";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/* ---------- Types for form / FDA ---------- */

interface MedFormData {
  name: string;
  name_ar: string;
  generic_name: string;
  category: string;
  default_dosage: string;
  contraindications: string;
}

const emptyForm: MedFormData = {
  name: "",
  name_ar: "",
  generic_name: "",
  category: "",
  default_dosage: "",
  contraindications: "",
};

interface FdaResult {
  brand_name: string;
  generic_name: string;
  category: string;
}

/* ---------- Medication Form Dialog ---------- */

function MedicationFormDialog({
  open,
  onClose,
  initial,
  medicationId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: MedFormData;
  medicationId: string | null; // null = create, string = edit
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<MedFormData>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const set = (field: keyof MedFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ variant: "error", title: "Name is required" });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || undefined,
        generic_name: form.generic_name.trim() || undefined,
        category: form.category.trim() || undefined,
        default_dosage: form.default_dosage.trim() || undefined,
        contraindications: form.contraindications.trim() || undefined,
        is_active: true,
      };

      if (medicationId) {
        await api.patch(`/medications/${medicationId}`, payload);
        toast({ variant: "success", title: "Medication updated" });
      } else {
        await api.post("/medications", payload);
        toast({ variant: "success", title: "Medication created" });
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save medication";
      toast({ variant: "error", title: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          {medicationId ? "Edit Medication" : "Add Medication"}
        </DialogTitle>
        <DialogDescription>
          {medicationId
            ? "Update the medication details below."
            : "Fill in the details to add a new medication to the catalog."}
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <Input label="Name *" value={form.name} onChange={set("name")} placeholder="e.g. Aspirin" />
        <Input label="Arabic Name" value={form.name_ar} onChange={set("name_ar")} placeholder="e.g. أسبرين" dir="rtl" />
        <Input label="Generic Name" value={form.generic_name} onChange={set("generic_name")} placeholder="e.g. Acetylsalicylic acid" />
        <Input label="Category" value={form.category} onChange={set("category")} placeholder="e.g. Antiplatelet" />
        <Input label="Default Dosage" value={form.default_dosage} onChange={set("default_dosage")} placeholder="e.g. 81mg once daily" />
        <Input label="Contraindications" value={form.contraindications} onChange={set("contraindications")} placeholder="e.g. Active bleeding, peptic ulcer" />
      </DialogContent>
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={cn(
            "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors",
            "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {saving ? "Saving..." : medicationId ? "Update" : "Create"}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- FDA Import Dialog ---------- */

function FdaImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FdaResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingIdx, setImportingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setResults([]);
    try {
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(q)}"&limit=10`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          setResults([]);
          toast({ variant: "info", title: "No results found" });
          return;
        }
        throw new Error(`FDA API error: ${res.status}`);
      }
      const data = await res.json();
      const parsed: FdaResult[] = (data.results ?? [])
        .map((r: Record<string, unknown>) => {
          const openfda = r.openfda as Record<string, string[]> | undefined;
          if (!openfda?.brand_name?.[0]) return null;
          return {
            brand_name: openfda.brand_name[0],
            generic_name: openfda.generic_name?.[0] ?? "",
            category: openfda.pharm_class_epc?.[0] ?? "",
          };
        })
        .filter(Boolean) as FdaResult[];

      // Deduplicate by brand_name
      const seen = new Set<string>();
      const unique = parsed.filter((r) => {
        const key = r.brand_name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setResults(unique);
      if (unique.length === 0) {
        toast({ variant: "info", title: "No results found" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "FDA search failed";
      toast({ variant: "error", title: message });
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (idx: number) => {
    const drug = results[idx];
    setImportingIdx(idx);
    try {
      await api.post("/medications", {
        name: drug.brand_name,
        generic_name: drug.generic_name || undefined,
        category: drug.category || undefined,
        is_active: true,
      });
      toast({ variant: "success", title: `Imported "${drug.brand_name}"` });
      onImported();
      // Remove imported item from list
      setResults((prev) => prev.filter((_, i) => i !== idx));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to import medication";
      toast({ variant: "error", title: message });
    } finally {
      setImportingIdx(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Import from FDA</DialogTitle>
        <DialogDescription>
          Search the OpenFDA drug database and import medications into your catalog.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand name..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className={cn(
              "shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors",
              "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {results.map((drug, idx) => (
              <div
                key={`${drug.brand_name}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {drug.brand_name}
                  </p>
                  {drug.generic_name && (
                    <p className="truncate text-xs text-muted-foreground">
                      {drug.generic_name}
                    </p>
                  )}
                  {drug.category && (
                    <p className="truncate text-xs text-muted-foreground italic">
                      {drug.category}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleImport(idx)}
                  disabled={importingIdx === idx}
                  className={cn(
                    "shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors",
                    "hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {importingIdx === idx ? "Importing..." : "Import"}
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Close
        </button>
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Bulk FDA Import Dialog ---------- */

function BulkFdaImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported_count: number;
    skipped_duplicates: number;
    total_found: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const { data } = await api.post("/medications/import-fda", {});
      setResult(data);
      toast({
        variant: "success",
        title: `Imported ${data.imported_count} medications (${data.skipped_duplicates} duplicates skipped)`,
      });
      onImported();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "FDA bulk import failed";
      toast({ variant: "error", title: message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Import Cardiology Drugs</DialogTitle>
        <DialogDescription>
          This will import all cardiology-class medications from the FDA database
          including ACE inhibitors, ARBs, beta blockers, statins, anticoagulants,
          and more. This may take a minute.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        {result && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-1">
            <p>
              <span className="font-medium">Total found:</span> {result.total_found}
            </p>
            <p>
              <span className="font-medium text-emerald-600">Imported:</span>{" "}
              {result.imported_count}
            </p>
            <p>
              <span className="font-medium text-amber-600">Skipped (duplicates):</span>{" "}
              {result.skipped_duplicates}
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-red-600">Errors:</p>
                <ul className="list-disc pl-5 text-xs text-red-600">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <button
            onClick={handleImport}
            disabled={importing}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors",
              "hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {importing ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <Download size={16} />
                Import
              </>
            )}
          </button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Egyptian Sync Dialog ---------- */

function EgyptianSyncDialog({
  open,
  onClose,
  onSynced,
}: {
  open: boolean;
  onClose: () => void;
  onSynced: () => void;
}) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    synced_count: number;
    new_count: number;
    updated_count: number;
    total_in_catalog: number;
  } | null>(null);

  useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const { data } = await api.post("/medications/sync-egyptian", {});
      setResult(data);
      toast({
        variant: "success",
        title: `Synced ${data.synced_count} medications (${data.new_count} new, ${data.updated_count} updated)`,
      });
      onSynced();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Egyptian catalog sync failed";
      toast({ variant: "error", title: message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Sync Egyptian Brands</DialogTitle>
        <DialogDescription>
          Sync Egyptian brand-name medications from the built-in catalog.
          This will add new medications and update existing ones with Egyptian
          brand names and Arabic labels. Safe to run repeatedly.
        </DialogDescription>
      </DialogHeader>
      <DialogContent className="space-y-4">
        {result && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-1">
            <p>
              <span className="font-medium">Total in catalog:</span>{" "}
              {result.total_in_catalog}
            </p>
            <p>
              <span className="font-medium text-emerald-600">New medications:</span>{" "}
              {result.new_count}
            </p>
            <p>
              <span className="font-medium text-blue-600">Updated:</span>{" "}
              {result.updated_count}
            </p>
            <p>
              <span className="font-medium">Total synced:</span>{" "}
              {result.synced_count}
            </p>
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          {result ? "Close" : "Cancel"}
        </button>
        {!result && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors",
              "hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {syncing ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Sync Now
              </>
            )}
          </button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

/* ---------- Main Page ---------- */

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [fdaOpen, setFdaOpen] = useState(false);
  const [bulkFdaOpen, setBulkFdaOpen] = useState(false);
  const [egyptianSyncOpen, setEgyptianSyncOpen] = useState(false);

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/medications");
      // Handle both array and { items: Medication[] } response shapes
      const items: Medication[] = Array.isArray(data) ? data : data.items ?? [];
      setMedications(items);
    } catch {
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const filtered = medications.filter((med) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      med.name.toLowerCase().includes(q) ||
      med.name_ar?.toLowerCase().includes(q) ||
      med.generic_name?.toLowerCase().includes(q) ||
      med.category?.toLowerCase().includes(q)
    );
  });

  const openEdit = (med: Medication) => {
    setEditingMed(med);
    setEditOpen(true);
  };

  const editInitial: MedFormData = editingMed
    ? {
        name: editingMed.name,
        name_ar: editingMed.name_ar ?? "",
        generic_name: editingMed.generic_name ?? "",
        category: editingMed.category ?? "",
        default_dosage: editingMed.default_dosage ?? "",
        contraindications: editingMed.contraindications ?? "",
      }
    : emptyForm;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Medication Catalog
          </h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} medication{filtered.length !== 1 && "s"}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "transition-colors hover:bg-primary/90"
            )}
          >
            <Plus size={16} />
            Add Medication
          </button>
          <button
            onClick={() => setFdaOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground",
              "transition-colors hover:bg-secondary"
            )}
          >
            <Globe size={16} />
            Import from FDA
          </button>
          <button
            onClick={() => setBulkFdaOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white",
              "transition-colors hover:bg-emerald-700"
            )}
          >
            <Download size={16} />
            Import Cardiology Drugs
          </button>
          <button
            onClick={() => setEgyptianSyncOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white",
              "transition-colors hover:bg-blue-700"
            )}
          >
            <RefreshCw size={16} />
            Sync Egyptian Brands
          </button>
        </div>
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, generic name, or category..."
          className={cn(
            "w-full rounded-xl border border-input bg-card py-2.5 pl-11 pr-10 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          )}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
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
                <Skeleton className="hidden h-4 w-24 md:block" />
                <Skeleton className="hidden h-4 w-20 lg:block" />
                <Skeleton className="hidden h-4 w-16 xl:block" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Pill size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {search ? "No medications match your search" : "No medications found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search terms"
                : "The medication catalog is empty"}
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
                    Arabic Name
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Generic Name
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Category
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground xl:table-cell">
                    Default Dosage
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((med) => (
                  <tr
                    key={med.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {med.name.charAt(0)}
                        </div>
                        <p className="truncate font-medium text-foreground">
                          {med.name}
                        </p>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground sm:table-cell" dir="rtl">
                      {med.name_ar ?? "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground md:table-cell">
                      {med.generic_name ?? "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground lg:table-cell">
                      {med.category ?? "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-muted-foreground xl:table-cell">
                      {med.default_dosage ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          med.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {med.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(med)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground",
                          "transition-colors hover:bg-secondary hover:text-foreground"
                        )}
                        title="Edit medication"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Dialog */}
      <MedicationFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initial={emptyForm}
        medicationId={null}
        onSaved={fetchMedications}
      />

      {/* Edit Dialog */}
      <MedicationFormDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingMed(null);
        }}
        initial={editInitial}
        medicationId={editingMed?.id ?? null}
        onSaved={fetchMedications}
      />

      {/* FDA Import Dialog */}
      <FdaImportDialog
        open={fdaOpen}
        onClose={() => setFdaOpen(false)}
        onImported={fetchMedications}
      />

      {/* Bulk FDA Import Dialog */}
      <BulkFdaImportDialog
        open={bulkFdaOpen}
        onClose={() => setBulkFdaOpen(false)}
        onImported={fetchMedications}
      />

      {/* Egyptian Sync Dialog */}
      <EgyptianSyncDialog
        open={egyptianSyncOpen}
        onClose={() => setEgyptianSyncOpen(false)}
        onSynced={fetchMedications}
      />
    </div>
  );
}
