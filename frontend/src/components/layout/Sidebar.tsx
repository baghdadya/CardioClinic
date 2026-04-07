import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { APP_VERSION } from "@/version";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Pill,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  HeartPulse,
  ChevronLeft,
  Calculator,
  FlaskConical,
  FileText,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
  { label: "Patients", path: "/patients", icon: <Users size={20} /> },
  {
    label: "Appointments",
    path: "/appointments",
    icon: <CalendarDays size={20} />,
  },
  { label: "Medications", path: "/medications", icon: <Pill size={20} /> },
  {
    label: "Patient Instructions",
    path: "/instructions",
    icon: <FileText size={20} />,
  },
  {
    label: "Risk Calculators",
    path: "/risk-calculators",
    icon: <Calculator size={20} />,
  },
  {
    label: "Drug Interactions",
    path: "/drug-interactions",
    icon: <FlaskConical size={20} />,
  },
  {
    label: "User Management",
    path: "/users",
    icon: <UserCog size={20} />,
    roles: ["doctor"],
  },
  {
    label: "Audit Log",
    path: "/audit-log",
    icon: <ShieldCheck size={20} />,
    roles: ["doctor"],
  },
];

function RoleBadge({ role }: { role: UserRole }) {
  const colors: Record<UserRole, string> = {
    doctor: "bg-indigo-400/20 text-indigo-200",
    nurse: "bg-emerald-400/20 text-emerald-200",
    receptionist: "bg-amber-400/20 text-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize tracking-wide",
        colors[role]
      )}
    >
      {role}
    </span>
  );
}

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg shadow-indigo-500/25">
          <HeartPulse size={22} className="text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold tracking-tight text-white"
          >
            Maadi Clinic
          </motion.span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-white/[0.12] text-white nav-active-glow"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
              )
            }
          >
            <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden items-center justify-center p-3 text-white/30 transition-colors hover:text-white/70 lg:flex"
      >
        <ChevronLeft
          size={16}
          className={cn(
            "transition-transform duration-300",
            collapsed && "rotate-180"
          )}
        />
      </button>

      {/* User info */}
      <div className="mx-3 mb-3 rounded-xl bg-white/[0.06] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold text-white shadow-md shadow-indigo-500/20">
            {user?.full_name?.charAt(0) ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white/90">
                {user?.full_name}
              </p>
              {user && <RoleBadge role={user.role} />}
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-1.5 text-white/30 transition-all duration-200 hover:bg-white/[0.08] hover:text-white/80"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        {!collapsed && (
          <p className="mt-2 text-center text-[10px] text-white/20">v{APP_VERSION}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-2.5 text-white shadow-lg shadow-indigo-500/25 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[272px] bg-gradient-sidebar lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-white/50 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-screen flex-col bg-gradient-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
          collapsed ? "w-[72px]" : "w-[272px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
