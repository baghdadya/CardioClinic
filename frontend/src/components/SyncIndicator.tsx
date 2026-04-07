import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  subscribeSyncState,
  processQueue,
  type SyncState,
} from "@/services/sync";

// ---------------------------------------------------------------------------
// Visual config per state
// ---------------------------------------------------------------------------

type IndicatorMode = "online" | "offline" | "syncing" | "conflict";

function deriveMode(s: SyncState): IndicatorMode {
  if (s.conflictCount > 0) return "conflict";
  if (s.isSyncing) return "syncing";
  if (s.connection === "offline") return "offline";
  return "online";
}

const modeConfig: Record<
  IndicatorMode,
  {
    label: (s: SyncState) => string;
    dotClass: string;
    bgClass: string;
    textClass: string;
  }
> = {
  online: {
    label: () => "Online",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50 ring-emerald-200",
    textClass: "text-emerald-700",
  },
  offline: {
    label: (s) =>
      s.pendingCount > 0
        ? `Offline \u2014 ${s.pendingCount} change${s.pendingCount === 1 ? "" : "s"} saved locally`
        : "Offline",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50 ring-amber-200",
    textClass: "text-amber-700",
  },
  syncing: {
    label: (s) =>
      `Syncing ${s.pendingCount} change${s.pendingCount === 1 ? "" : "s"}\u2026`,
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50 ring-blue-200",
    textClass: "text-blue-700",
  },
  conflict: {
    label: (s) =>
      `${s.conflictCount} sync conflict${s.conflictCount === 1 ? "" : "s"}`,
    dotClass: "bg-rose-500",
    bgClass: "bg-rose-50 ring-rose-200",
    textClass: "text-rose-700",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SyncIndicatorProps {
  /** If provided, clicking the conflict badge opens the conflict modal */
  onConflictClick?: () => void;
  className?: string;
}

export function SyncIndicator({ onConflictClick, className }: SyncIndicatorProps) {
  const [state, setState] = React.useState<SyncState>({
    connection: navigator.onLine ? "online" : "offline",
    pendingCount: 0,
    conflictCount: 0,
    isSyncing: false,
  });

  React.useEffect(() => subscribeSyncState(setState), []);

  const mode = deriveMode(state);
  const cfg = modeConfig[mode];
  const label = cfg.label(state);

  const isClickable = mode === "conflict" && !!onConflictClick;

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={mode}
        type="button"
        disabled={!isClickable && !(mode === "online" && state.pendingCount > 0)}
        onClick={() => {
          if (isClickable) onConflictClick?.();
          // Allow manual re-sync when online with pending items
          if (mode === "online" && state.pendingCount > 0) processQueue();
        }}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1",
          cfg.bgClass,
          cfg.textClass,
          isClickable && "cursor-pointer hover:brightness-95",
          !isClickable && "cursor-default",
          className,
        )}
        aria-label={label}
      >
        {/* Animated dot / spinner */}
        {mode === "syncing" ? (
          <RefreshCw size={12} className="animate-spin" />
        ) : mode === "conflict" ? (
          <AlertTriangle size={12} />
        ) : (
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                cfg.dotClass,
                mode === "offline" && "animate-ping",
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                cfg.dotClass,
              )}
            />
          </span>
        )}

        <span>{label}</span>

        {/* Conflict badge count */}
        {mode === "conflict" && (
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {state.conflictCount}
          </span>
        )}
      </motion.button>
    </AnimatePresence>
  );
}
