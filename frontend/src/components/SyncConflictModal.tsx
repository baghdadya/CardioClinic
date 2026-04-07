import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getQueueItems,
  resolveKeepLocal,
  resolveKeepServer,
  subscribeSyncState,
  type SyncState,
} from "@/services/sync";
import type { SyncQueueItem } from "@/services/offlineDb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfirmAction = "keep-local" | "keep-server" | null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonSafe(raw?: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Build a human-readable diff between server and local payloads. */
function buildDiffLines(
  item: SyncQueueItem,
): { field: string; serverValue: string; localValue: string }[] {
  const server = parseJsonSafe(item.serverData);
  const local = parseJsonSafe(item.body);
  if (!server || !local) return [];

  const diffs: { field: string; serverValue: string; localValue: string }[] = [];
  const allKeys = new Set([...Object.keys(server), ...Object.keys(local)]);

  for (const key of allKeys) {
    // Skip meta fields
    if (["id", "created_at", "updated_at", "_syncStatus"].includes(key)) continue;

    const sv = server[key];
    const lv = local[key];
    if (JSON.stringify(sv) !== JSON.stringify(lv)) {
      diffs.push({
        field: key,
        serverValue: sv == null ? "(empty)" : String(sv),
        localValue: lv == null ? "(empty)" : String(lv),
      });
    }
  }
  return diffs;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return "unknown";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SyncConflictModalProps {
  open: boolean;
  onClose: () => void;
}

export function SyncConflictModal({ open, onClose }: SyncConflictModalProps) {
  const [conflicts, setConflicts] = React.useState<SyncQueueItem[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction>(null);
  const [loading, setLoading] = React.useState(false);

  // Load conflicts whenever the modal opens or sync state changes
  const loadConflicts = React.useCallback(async () => {
    const items = await getQueueItems("conflict");
    setConflicts(items);
    if (items.length === 0) {
      setActiveIndex(0);
      onClose();
    }
  }, [onClose]);

  React.useEffect(() => {
    if (open) loadConflicts();
  }, [open, loadConflicts]);

  // Also subscribe so we refresh if sync runs in background
  React.useEffect(() => {
    return subscribeSyncState((s: SyncState) => {
      if (open && s.conflictCount === 0) onClose();
    });
  }, [open, onClose]);

  const current = conflicts[activeIndex] ?? null;
  const serverData = parseJsonSafe(current?.serverData);
  const serverTimestamp = serverData?.updated_at as string | undefined;
  const localTimestamp = current?.timestamp;
  const diffs = current ? buildDiffLines(current) : [];

  // ---- Actions ----

  async function handleKeepLocal() {
    if (!current?.id) return;
    setLoading(true);
    const ok = await resolveKeepLocal(current.id);
    setLoading(false);
    if (ok) {
      setConfirmAction(null);
      await loadConflicts();
    }
  }

  async function handleKeepServer() {
    if (!current?.id) return;
    setLoading(true);
    await resolveKeepServer(current.id);
    setLoading(false);
    setConfirmAction(null);
    await loadConflicts();
  }

  // ---- Render ----

  if (!current) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      {/* ---------- Main view ---------- */}
      {confirmAction === null && (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle size={20} />
              Sync Conflict Detected
            </DialogTitle>
            <DialogDescription>
              {conflicts.length > 1
                ? `Conflict ${activeIndex + 1} of ${conflicts.length}`
                : "A record was modified on the server while you were offline."}
            </DialogDescription>
          </DialogHeader>

          <DialogContent>
            <p className="text-sm text-slate-600">
              <span className="font-medium">{current.description}</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Server version
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Updated at {formatTimestamp(serverTimestamp)}
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Local version
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Queued at {formatTimestamp(localTimestamp)}
                </p>
              </div>
            </div>

            {diffs.length > 0 && (
              <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  Changed fields
                </p>
                <ul className="space-y-1.5 text-xs">
                  {diffs.map((d) => (
                    <li key={d.field} className="flex flex-col">
                      <span className="font-medium text-slate-700">
                        {d.field}
                      </span>
                      <span className="text-slate-500">
                        Server:{" "}
                        <span className="font-mono text-blue-600">
                          {d.serverValue}
                        </span>{" "}
                        &rarr; Local:{" "}
                        <span className="font-mono text-amber-600">
                          {d.localValue}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogContent>

          <DialogFooter>
            {conflicts.length > 1 && (
              <div className="mr-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => i - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeIndex >= conflicts.length - 1}
                  onClick={() => setActiveIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmAction("keep-server")}
            >
              Keep Server Data
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmAction("keep-local")}
            >
              Keep Local Data
            </Button>
          </DialogFooter>
        </>
      )}

      {/* ---------- Confirm: Keep Local (overwrite server) ---------- */}
      {confirmAction === "keep-local" && (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={20} />
              WARNING
            </DialogTitle>
            <DialogDescription>
              Server data will be overwritten with your local changes.
            </DialogDescription>
          </DialogHeader>

          <DialogContent>
            <p className="text-sm font-medium text-slate-700">
              The following records will be affected:
            </p>
            {diffs.length > 0 ? (
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600">
                {diffs.map((d, i) => (
                  <li key={i}>
                    <span className="font-medium">{d.field}:</span>{" "}
                    <span className="text-blue-600">{d.serverValue}</span>
                    {" \u2192 "}
                    <span className="text-amber-600">{d.localValue}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {current.description}
              </p>
            )}
          </DialogContent>

          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={loading}
              onClick={handleKeepLocal}
            >
              Confirm Overwrite
            </Button>
          </DialogFooter>
        </>
      )}

      {/* ---------- Confirm: Keep Server (discard local) ---------- */}
      {confirmAction === "keep-server" && (
        <>
          <DialogHeader>
            <DialogTitle>Discard Local Changes?</DialogTitle>
            <DialogDescription>
              Your local changes will be discarded.
            </DialogDescription>
          </DialogHeader>

          <DialogContent>
            {diffs.length > 0 ? (
              <ol className="list-inside list-decimal space-y-1 text-sm text-slate-600">
                {diffs.map((d, i) => (
                  <li key={i}>
                    <span className="font-medium">{d.field}:</span>{" "}
                    local value{" "}
                    <span className="font-mono text-amber-600">
                      {d.localValue}
                    </span>{" "}
                    will be discarded
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">{current.description}</p>
            )}
          </DialogContent>

          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={handleKeepServer}
            >
              Discard Local Changes
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
