import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Loader2,
  Info,
  RefreshCw,
  Database,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import api from "@/services/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Medication {
  id: string;
  name: string;
  generic_name: string;
  category: string;
}

interface Interaction {
  drug_a: string;
  drug_b: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
}

interface InteractionResponse {
  interactions: Interaction[];
  checked_count: number;
}

interface SyncStatus {
  last_synced_at: string | null;
  medications_with_interactions: number;
  total_medications: number;
}

interface SyncResult {
  synced_count: number;
  total_medications: number;
  errors: string[];
  synced_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityConfig: Record<
  Interaction["severity"],
  { color: string; bg: string; border: string; icon: string }
> = {
  mild: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "bg-emerald-100",
  },
  moderate: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "bg-amber-100",
  },
  severe: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "bg-red-100",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DrugInteractionsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<Medication[]>([]);

  const [interactions, setInteractions] = useState<Interaction[] | null>(null);
  const [checkedCount, setCheckedCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  /* Sync state */
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [showSyncErrors, setShowSyncErrors] = useState(false);

  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Fetch medication catalog */
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const { data } = await api.get("/medications");
        const items = Array.isArray(data) ? data : data.items ?? [];
        setMedications(items);
      } catch {
        setMedications([]);
      } finally {
        setLoadingMeds(false);
      }
    };
    fetchMedications();
  }, []);

  /* Fetch sync status */
  const fetchSyncStatus = useCallback(async () => {
    try {
      const { data } = await api.get<SyncStatus>("/interactions/sync-status");
      setSyncStatus(data);
    } catch {
      // Non-critical — just leave it null
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  /* Trigger sync */
  const handleSync = async () => {
    setSyncing(true);
    setSyncErrors([]);
    setShowSyncErrors(false);
    try {
      const { data } = await api.post<SyncResult>("/interactions/sync");
      toast({
        variant: "success",
        title: `Drug database synced — ${data.synced_count} medications updated`,
      });
      if (data.errors.length > 0) {
        setSyncErrors(data.errors);
      }
      fetchSyncStatus();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Sync failed. Please try again.";
      toast({ variant: "error", title: msg });
    } finally {
      setSyncing(false);
    }
  };

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Auto-check interactions whenever 2+ medications are selected */
  const checkInteractions = useCallback(async (meds: Medication[]) => {
    if (meds.length < 2) {
      setInteractions(null);
      setCheckedCount(0);
      return;
    }
    setError("");
    setChecking(true);
    try {
      const { data } = await api.post<InteractionResponse>(
        "/interactions/check",
        { medication_ids: meds.map((m) => m.id) }
      );
      setInteractions(data.interactions ?? []);
      setCheckedCount(data.checked_count);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Interaction check failed. Please try again.";
      setError(msg);
    } finally {
      setChecking(false);
    }
  }, []);

  /* Filtered list for search dropdown */
  const filteredMeds =
    searchQuery.trim().length < 1
      ? []
      : medications
          .filter(
            (med) =>
              !selectedMeds.some((s) => s.id === med.id) &&
              (med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (med.generic_name ?? "")
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()))
          )
          .slice(0, 8);

  const addMedication = (med: Medication) => {
    if (!selectedMeds.some((s) => s.id === med.id)) {
      const next = [...selectedMeds, med];
      setSelectedMeds(next);
      checkInteractions(next);
    }
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeMedication = (id: string) => {
    const next = selectedMeds.filter((m) => m.id !== id);
    setSelectedMeds(next);
    checkInteractions(next);
  };

  const canCheck = selectedMeds.length >= 2;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Drug Interactions
        </h2>
        <p className="text-sm text-muted-foreground">
          Check for potential drug-drug interactions before prescribing
        </p>
      </div>

      {/* Step-by-step instructions */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />
        <div className="space-y-1 text-sm text-blue-800">
          <p className="font-semibold">How to use</p>
          <ol className="list-inside list-decimal space-y-0.5">
            <li>Search and add medications below</li>
            <li>Interactions are checked automatically</li>
          </ol>
        </div>
      </div>

      {/* Search & selection card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-visible rounded-xl border border-border bg-card shadow-sm"
      >
        <Card className="overflow-visible border-0 shadow-none">
          <CardHeader>
            <CardTitle>Select Medications</CardTitle>
            <CardDescription>
              Type a medication name to search, then click to add it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Prominent search input */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    loadingMeds
                      ? "Loading medications..."
                      : "Start typing a medication name (e.g. Aspirin, Warfarin)..."
                  }
                  disabled={loadingMeds}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full rounded-xl border-2 border-primary/30 bg-background py-3.5 pl-12 pr-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowDropdown(false);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              <AnimatePresence>
                {showDropdown && filteredMeds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
                  >
                    {filteredMeds.map((med) => (
                      <button
                        key={med.id}
                        onClick={() => addMedication(med)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Pill size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">
                            {med.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {med.generic_name} &middot; {med.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No results */}
              {showDropdown &&
                searchQuery.trim().length >= 1 &&
                filteredMeds.length === 0 &&
                !loadingMeds && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground shadow-lg">
                    No medications found for "{searchQuery}"
                  </div>
                )}
            </div>

            {/* Selected medications as chips */}
            {selectedMeds.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected medications ({selectedMeds.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {selectedMeds.map((med) => (
                      <motion.span
                        key={med.id}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        <Pill size={14} />
                        {med.name}
                        <button
                          onClick={() => removeMedication(med.id)}
                          aria-label={`Remove ${med.name}`}
                          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/10"
                        >
                          <X size={14} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                <Pill size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No medications selected yet. Use the search above to add medications.
                </p>
              </div>
            )}

            {/* Friendly guidance when less than 2 meds */}
            {selectedMeds.length > 0 && selectedMeds.length < 2 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                <Info size={16} className="shrink-0" />
                Add at least 2 medications to check for interactions
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Auto-check status / manual re-check */}
            {checking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Checking interactions...
              </div>
            )}

            {canCheck && !checking && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkInteractions(selectedMeds)}
              >
                <ShieldCheck size={16} />
                Re-check Interactions
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {interactions !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Results</h3>
              <span className="text-sm text-muted-foreground">
                {checkedCount} combination{checkedCount !== 1 ? "s" : ""}{" "}
                checked
              </span>
            </div>

            {interactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                    <ShieldCheck size={28} className="text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No known interactions
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The selected medications have no documented interactions
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction, idx) => {
                  const config = severityConfig[interaction.severity];
                  return (
                    <motion.div
                      key={`${interaction.drug_a}-${interaction.drug_b}-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "rounded-xl border p-5",
                        config.bg,
                        config.border
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            config.icon
                          )}
                        >
                          <AlertTriangle
                            size={18}
                            className={config.color}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {interaction.drug_a}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              +
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {interaction.drug_b}
                            </span>
                            <Badge
                              variant={
                                interaction.severity === "severe"
                                  ? "destructive"
                                  : interaction.severity === "moderate"
                                    ? "warning"
                                    : "success"
                              }
                              className="ml-auto capitalize"
                            >
                              {interaction.severity}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {interaction.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/*  Sync Drug Database                                              */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database size={18} className="text-primary" />
              <CardTitle>Sync Drug Database</CardTitle>
            </div>
            <CardDescription>
              Fetch interaction data from the NLM RxNorm database to keep
              drug-drug interaction checks up to date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={14} />
                <span>
                  {syncStatus?.last_synced_at
                    ? `Last synced: ${new Date(syncStatus.last_synced_at).toLocaleString()}`
                    : "Never synced"}
                </span>
              </div>
              {syncStatus && (
                <div className="text-muted-foreground">
                  {syncStatus.medications_with_interactions} of{" "}
                  {syncStatus.total_medications} medications have interaction data
                </div>
              )}
            </div>

            {/* Progress bar (visible while syncing) */}
            {syncing && (
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: "5%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 90, ease: "linear" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Syncing with NLM RxNorm — this may take 1-2 minutes...
                </p>
              </div>
            )}

            {/* Sync button */}
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Sync Now
                </>
              )}
            </Button>

            {/* Errors (expandable) */}
            {syncErrors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50">
                <button
                  onClick={() => setShowSyncErrors((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-amber-800"
                >
                  <span>
                    {syncErrors.length} medication{syncErrors.length !== 1 ? "s" : ""}{" "}
                    could not be matched
                  </span>
                  {showSyncErrors ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <AnimatePresence>
                  {showSyncErrors && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="border-t border-amber-200 px-4 py-2.5 text-sm text-amber-700">
                        {syncErrors.map((err, i) => (
                          <li key={i} className="py-0.5">
                            {err}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
