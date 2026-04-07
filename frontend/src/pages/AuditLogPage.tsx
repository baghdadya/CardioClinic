import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ScrollText,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import api from "@/services/api";

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: "create" | "update" | "delete" | "restore";
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { id: string; full_name: string; email: string };
}

interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

const actionBadgeClass: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  restore: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDetails(entry: AuditLogEntry): string {
  if (entry.action === "create" && entry.new_values) {
    const keys = Object.keys(entry.new_values);
    if (keys.length === 0) return "-";
    return `Set ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ` +${keys.length - 3} more` : ""}`;
  }
  if (entry.action === "update" && entry.new_values) {
    const keys = Object.keys(entry.new_values);
    if (keys.length === 0) return "-";
    return `Changed ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ` +${keys.length - 3} more` : ""}`;
  }
  if (entry.action === "delete") return "Record deleted";
  if (entry.action === "restore" && entry.new_values) {
    const keys = Object.keys(entry.new_values);
    if (keys.length === 0) return "-";
    return `Restored ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ` +${keys.length - 3} more` : ""}`;
  }
  return "-";
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "(empty)";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function canRestore(entry: AuditLogEntry): boolean {
  return (
    (entry.action === "update" || entry.action === "delete") &&
    entry.old_values !== null &&
    Object.keys(entry.old_values).length > 0
  );
}

export default function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const pageSize = 50;

  const [restoreTarget, setRestoreTarget] = useState<AuditLogEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (search.trim()) {
        // The API supports entity_type filter; use search as entity_type filter
        params.entity_type = search.trim();
      }
      const { data } = await api.get<AuditLogResponse>("/audit", { params });
      setLogs(data.items);
      setTotal(data.total);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await api.post(`/audit/${restoreTarget.id}/restore`);
      toast({
        variant: "success",
        title: "Record restored",
        description: `${restoreTarget.entity_type} has been restored to its previous state.`,
      });
      setRestoreTarget(null);
      fetchLogs();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to restore record";
      toast({
        variant: "error",
        title: "Restore failed",
        description: message,
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            {total} entr{total === 1 ? "y" : "ies"} total
          </p>
        </div>
      </div>

      {/* Search / filter by entity type */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Filter by entity type (e.g. patient, appointment)..."
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
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="hidden h-4 w-20 sm:block" />
                <Skeleton className="hidden h-4 w-28 md:block" />
                <Skeleton className="hidden h-4 w-40 lg:block" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ScrollText size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {search ? "No audit entries match your filter" : "No audit entries yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try adjusting your filter"
                : "Actions will appear here as they are performed"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Entity Type
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Entity ID
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Details
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {formatTimestamp(entry.created_at)}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-muted-foreground sm:table-cell">
                      {entry.user?.full_name ?? entry.user_id.slice(0, 8) + "..."}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          actionBadgeClass[entry.action] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-muted-foreground">
                      {entry.entity_type}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm font-mono text-muted-foreground md:table-cell">
                      {entry.entity_id ? entry.entity_id.slice(0, 8) + "..." : "-"}
                    </td>
                    <td className="hidden max-w-xs truncate px-6 py-4 text-sm text-muted-foreground lg:table-cell">
                      {formatDetails(entry)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {canRestore(entry) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRestoreTarget(entry)}
                        >
                          <RotateCcw size={14} className="mr-1.5" />
                          Restore
                        </Button>
                      )}
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

      {/* Restore Confirmation Modal */}
      <Dialog
        open={restoreTarget !== null}
        onClose={() => {
          if (!restoring) setRestoreTarget(null);
        }}
      >
        {restoreTarget && (
          <>
            <DialogHeader>
              <DialogTitle>Restore Record</DialogTitle>
              <DialogDescription>
                You are about to restore this record to its previous state.
              </DialogDescription>
            </DialogHeader>
            <DialogContent>
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span className="font-medium">
                    WARNING: This will overwrite the current record.
                  </span>
                </div>
              </div>

              <div className="mb-2 text-sm text-slate-600">
                <span className="font-medium">Entity:</span>{" "}
                <span className="capitalize">{restoreTarget.entity_type}</span>
                {restoreTarget.entity_id && (
                  <>
                    {" "}
                    <span className="font-mono text-xs text-slate-400">
                      ({restoreTarget.entity_id.slice(0, 8)}...)
                    </span>
                  </>
                )}
              </div>

              {/* Before / After comparison — only changed fields */}
              {(() => {
                const changedFields = restoreTarget.old_values
                  ? Object.entries(restoreTarget.old_values).filter(
                      ([field, oldVal]) => {
                        const newVal = restoreTarget.new_values?.[field];
                        return formatValue(oldVal) !== formatValue(newVal);
                      }
                    )
                  : [];

                if (changedFields.length === 0) {
                  return (
                    <p className="text-sm text-slate-500 italic">
                      No differences detected between old and current values.
                    </p>
                  );
                }

                return (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">
                            Field
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">
                            Current Value
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-600">
                            Will Be Restored To
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {changedFields.map(([field, oldVal]) => (
                          <tr key={field} className="bg-amber-50/50">
                            <td className="px-3 py-2 font-mono text-xs font-medium text-slate-700">
                              {field}
                            </td>
                            <td className="max-w-[150px] truncate px-3 py-2 text-xs text-red-600 line-through">
                              {restoreTarget.new_values
                                ? formatValue(restoreTarget.new_values[field])
                                : "(unknown)"}
                            </td>
                            <td className="max-w-[150px] truncate px-3 py-2 text-xs font-semibold text-emerald-700">
                              {formatValue(oldVal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </DialogContent>
            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                disabled={restoring}
                onClick={() => setRestoreTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={restoring}
                onClick={handleRestore}
              >
                {restoring ? "Restoring..." : "Confirm Restore"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
