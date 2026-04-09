import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
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
  ClipboardList,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { SyncIndicator } from "@/components/SyncIndicator";
import { SyncConflictModal } from "@/components/SyncConflictModal";
import { initSyncListeners } from "@/services/sync";
import type { UserRole } from "@/types";

/* ---------- pill nav items (clinical only) ---------- */

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
  { label: "Prescriptions", shortLabel: "Prescriptions", path: "/prescriptions", icon: ClipboardList, roles: ["admin", "doctor"] },
  { label: "Medications", shortLabel: "Meds", path: "/medications", icon: Pill, roles: ["admin", "doctor", "nurse"] },
  { label: "Instructions", shortLabel: "Instructions", path: "/instructions", icon: FileText, roles: ["admin", "doctor", "nurse"] },
  { label: "Risk Calculators", shortLabel: "Risk", path: "/risk-calculators", icon: Calculator, roles: ["admin", "doctor", "nurse"] },
  { label: "Drug Interactions", shortLabel: "Drug", path: "/drug-interactions", icon: FlaskConical, roles: ["admin", "doctor", "nurse"] },
];

/* ---------- settings menu items ---------- */

interface SettingsItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const settingsItems: SettingsItem[] = [
  { label: "User Management", path: "/users", icon: UserCog, roles: ["admin", "doctor"] },
  { label: "Audit Log", path: "/audit-log", icon: ShieldCheck, roles: ["admin", "doctor"] },
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => initSyncListeners(), []);

  // Close settings dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isHome = location.pathname === "/";

  const visiblePills = pillItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const visibleSettings = settingsItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const isSettingsPage = settingsItems.some((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background">
        {/* ---- Top Bar ---- */}
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between bg-white/80 px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:px-6">
          {/* Left: Logo or Back */}
          <div className="flex items-center gap-3">
            {isHome ? (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <img
                  src="/logo.png"
                  alt="Maadi Clinic"
                  className="h-16 w-auto"
                />
              </button>
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

          {/* Right: Sync, Settings gear, Theme Toggle, User, Logout */}
          <div className="flex items-center gap-3">
            <SyncIndicator onConflictClick={() => setConflictOpen(true)} />

            {/* Settings gear dropdown */}
            {visibleSettings.length > 0 && (
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    "rounded-lg p-2 transition-colors",
                    settingsOpen || isSettingsPage
                      ? "bg-slate-100 text-slate-700"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  )}
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                    >
                      {visibleSettings.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setSettingsOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                            )}
                          >
                            <Icon size={16} />
                            {item.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

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
          <div className="sticky top-20 z-20 overflow-x-auto border-b border-slate-100 bg-white/90 px-4 py-2 backdrop-blur-md md:hidden">
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
