import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/authStore";
import { SyncIndicator } from "@/components/SyncIndicator";
import { SyncConflictModal } from "@/components/SyncConflictModal";
import { initSyncListeners } from "@/services/sync";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { UserRole } from "@/types";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/appointments": "Appointments",
  "/medications": "Medications",
  "/risk-calculators": "Maadi Clinic",
  "/drug-interactions": "Maadi Clinic",
  "/users": "User Management",
  "/audit-log": "Audit Log",
};

function roleBadgeColor(role: UserRole) {
  switch (role) {
    case "doctor":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10";
    case "nurse":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10";
    case "receptionist":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10";
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -4 },
};

export function AppLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [conflictOpen, setConflictOpen] = useState(false);

  // Initialise offline sync listeners once at mount
  useEffect(() => initSyncListeners(), []);

  const basePath =
    "/" +
    location.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 1)
      .join("/");
  const title =
    pageTitles[basePath === "/" ? "/" : basePath] ??
    pageTitles[location.pathname] ??
    "Maadi Clinic";

  // Build breadcrumb segments
  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumb = segments.length > 0 ? segments : ["dashboard"];

  return (
    <ToastProvider>
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between bg-white/80 px-6 pl-16 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:pl-6">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {breadcrumb.map((seg, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-slate-300">/</span>
                  )}
                  <span className={i === breadcrumb.length - 1 ? "text-slate-500" : ""}>
                    {seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ")}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator onConflictClick={() => setConflictOpen(true)} />
            <ThemeToggle />
            {user && (
              <>
                <div className="h-5 w-px bg-slate-200" />
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeColor(user.role)}`}
                >
                  {user.role}
                </span>
                <div className="h-5 w-px bg-slate-200" />
                <span className="text-sm font-medium text-slate-500">
                  {user.full_name}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    <SyncConflictModal open={conflictOpen} onClose={() => setConflictOpen(false)} />
    </ToastProvider>
  );
}
