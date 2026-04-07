import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartPulse,
  ArrowLeft,
  LogOut,
  Users,
  CalendarDays,
  Pill,
  FileText,
  Calculator,
  FlaskConical,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { SyncIndicator } from "@/components/SyncIndicator";
import { SyncConflictModal } from "@/components/SyncConflictModal";
import { initSyncListeners } from "@/services/sync";
import type { UserRole } from "@/types";

/* ---------- pill nav items ---------- */

interface PillItem {
  label: string;
  shortLabel: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const pillItems: PillItem[] = [
  { label: "Patients", shortLabel: "Patients", path: "/patients", icon: Users, roles: ["admin", "doctor", "nurse"] },
  { label: "Appointments", shortLabel: "Appts", path: "/appointments", icon: CalendarDays },
  { label: "Medications", shortLabel: "Meds", path: "/medications", icon: Pill, roles: ["admin", "doctor", "nurse"] },
  { label: "Instructions", shortLabel: "Instructions", path: "/instructions", icon: FileText, roles: ["admin", "doctor", "nurse"] },
  { label: "Risk Calculators", shortLabel: "Risk", path: "/risk-calculators", icon: Calculator, roles: ["admin", "doctor", "nurse"] },
  { label: "Drug Interactions", shortLabel: "Drug", path: "/drug-interactions", icon: FlaskConical, roles: ["admin", "doctor", "nurse"] },
  { label: "User Management", shortLabel: "Users", path: "/users", icon: UserCog, roles: ["admin", "doctor"] },
  { label: "Audit Log", shortLabel: "Audit", path: "/audit-log", icon: ShieldCheck, roles: ["admin", "doctor"] },
];

/* ---------- helpers ---------- */

function roleBadgeColor(role: UserRole) {
  switch (role) {
    case "admin":
      return "bg-purple-50 text-purple-700 ring-1 ring-purple-600/10";
    case "doctor":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10";
    case "nurse":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10";
    case "receptionist":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-600/10";
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -4 },
};

/* ---------- component ---------- */

export function CardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [conflictOpen, setConflictOpen] = useState(false);

  useEffect(() => initSyncListeners(), []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isHome = location.pathname === "/";

  const visiblePills = pillItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background">
        {/* ---- Top Bar ---- */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between bg-white/80 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:px-6">
          {/* Left: Logo or Back */}
          <div className="flex items-center gap-3">
            {isHome ? (
              <>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/25">
                  <HeartPulse size={22} className="text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-800">
                  Maadi Clinic
                </span>
              </>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <ArrowLeft size={16} />
                Home
              </button>
            )}
          </div>

          {/* Center: Pill Navigation (inner pages only) */}
          {!isHome && (
            <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
              <div className="flex items-center gap-1.5">
                {visiblePills.map((pill) => {
                  const isActive = location.pathname.startsWith(pill.path);
                  return (
                    <NavLink
                      key={pill.path}
                      to={pill.path}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                      )}
                    >
                      {pill.shortLabel}
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Right: Sync, Theme Toggle, User, Logout */}
          <div className="flex items-center gap-3">
            <SyncIndicator onConflictClick={() => setConflictOpen(true)} />
            <ThemeToggle />
            {user && (
              <>
                <div className="hidden h-5 w-px bg-slate-200 sm:block" />
                <span
                  className={cn(
                    "hidden items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize sm:inline-flex",
                    roleBadgeColor(user.role)
                  )}
                >
                  {user.role}
                </span>
                <span className="hidden text-sm font-medium text-slate-500 sm:block">
                  {user.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* ---- Mobile pill navigation (below header) ---- */}
        {!isHome && (
          <div className="sticky top-16 z-20 overflow-x-auto border-b border-slate-100 bg-white/90 px-4 py-2 backdrop-blur-md md:hidden">
            <div className="flex items-center gap-2">
              {visiblePills.map((pill) => {
                const isActive = location.pathname.startsWith(pill.path);
                return (
                  <NavLink
                    key={pill.path}
                    to={pill.path}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-500"
                    )}
                  >
                    {pill.shortLabel}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Page Content ---- */}
        <main className="flex-1">
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
      <SyncConflictModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
      />
    </ToastProvider>
  );
}
