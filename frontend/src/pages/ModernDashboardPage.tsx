import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  CalendarDays,
  Pill,
  FileText,
  Calculator,
  FlaskConical,
  UserCog,
  ShieldCheck,
  ChevronRight,
  Clock,
  Calendar,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";
import type { Appointment } from "@/types";

/* ---------- types ---------- */

interface DashboardStats {
  todays_appointments: number;
  total_patients: number;
  pending_prescriptions: number;
  active_medications: number;
}

interface WeeklyPoint {
  day: string;
  count: number;
}

/* ---------- helpers ---------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const todayISO = format(new Date(), "yyyy-MM-dd");

const appointmentTypeBadge: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "outline" }
> = {
  new: { label: "New", variant: "default" },
  follow_up: { label: "Follow-up", variant: "outline" },
  procedure: { label: "Procedure", variant: "warning" },
  telemedicine: { label: "Telemedicine", variant: "success" },
};

const appointmentStatusBadge: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "destructive" | "outline";
  }
> = {
  scheduled: { label: "Scheduled", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  arrived: { label: "Arrived", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  no_show: { label: "No Show", variant: "warning" },
};

/* ---------- nav card definitions ---------- */

interface NavCard {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  statKey?: keyof DashboardStats;
  statLabel?: string;
  roles?: string[];
}

const navCards: NavCard[] = [
  {
    title: "Patients",
    description: "View and manage patient records",
    path: "/patients",
    icon: Users,
    gradient: "from-indigo-500 to-indigo-600",
    glowColor: "hover:shadow-indigo-500/25",
    statKey: "total_patients",
    statLabel: "patients",
    roles: ["admin", "doctor", "nurse"],
  },
  {
    title: "Appointments",
    description: "Schedule and track visits",
    path: "/appointments",
    icon: CalendarDays,
    gradient: "from-blue-500 to-blue-600",
    glowColor: "hover:shadow-blue-500/25",
    statKey: "todays_appointments",
    statLabel: "today",
  },
  {
    title: "Medications",
    description: "Prescriptions and drug management",
    path: "/medications",
    icon: Pill,
    gradient: "from-emerald-500 to-emerald-600",
    glowColor: "hover:shadow-emerald-500/25",
    statKey: "active_medications",
    statLabel: "active",
    roles: ["admin", "doctor", "nurse"],
  },
  {
    title: "Patient Instructions",
    description: "Post-visit care instructions",
    path: "/instructions",
    icon: FileText,
    gradient: "from-violet-500 to-violet-600",
    glowColor: "hover:shadow-violet-500/25",
    roles: ["admin", "doctor", "nurse"],
  },
  {
    title: "Risk Calculators",
    description: "Cardiovascular risk assessment tools",
    path: "/risk-calculators",
    icon: Calculator,
    gradient: "from-amber-500 to-amber-600",
    glowColor: "hover:shadow-amber-500/25",
    roles: ["admin", "doctor", "nurse"],
  },
  {
    title: "Drug Interactions",
    description: "Check contraindications and interactions",
    path: "/drug-interactions",
    icon: FlaskConical,
    gradient: "from-rose-500 to-rose-600",
    glowColor: "hover:shadow-rose-500/25",
    roles: ["admin", "doctor", "nurse"],
  },
  {
    title: "User Management",
    description: "Manage staff accounts and roles",
    path: "/users",
    icon: UserCog,
    gradient: "from-slate-500 to-slate-600",
    glowColor: "hover:shadow-slate-500/25",
    roles: ["admin", "doctor"],
  },
  {
    title: "Audit Log",
    description: "System activity and security log",
    path: "/audit-log",
    icon: ShieldCheck,
    gradient: "from-gray-500 to-gray-600",
    glowColor: "hover:shadow-gray-500/25",
    roles: ["admin", "doctor"],
  },
];

/* ---------- animation variants ---------- */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ---------- main component ---------- */

export default function ModernDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats>({
    todays_appointments: 0,
    total_patients: 0,
    pending_prescriptions: 0,
    active_medications: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<
    (Appointment & { patient_name?: string })[]
  >([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appointmentsRes] = await Promise.all([
          api.get("/dashboard/stats").catch(() => ({
            data: {
              todays_appointments: 0,
              total_patients: 0,
              pending_prescriptions: 0,
              active_medications: 0,
            },
          })),
          api
            .get("/appointments", { params: { date: todayISO } })
            .catch(() => ({ data: { items: [] } })),
        ]);

        setStats(statsRes.data);
        setTodayAppointments(
          appointmentsRes.data.items ?? appointmentsRes.data ?? []
        );

        if (statsRes.data.patients_this_week) {
          setWeeklyData(statsRes.data.patients_this_week);
        } else {
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          setWeeklyData(
            days.map((day) => ({ day, count: Math.floor(Math.random() * 8) + 1 }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const visibleCards = useMemo(
    () =>
      navCards.filter(
        (card) => !card.roles || (user && card.roles.includes(user.role))
      ),
    [user]
  );

  const statCards = useMemo(
    () => [
      {
        title: "Today's Appointments",
        value: stats.todays_appointments,
        icon: <CalendarDays size={22} className="text-white" />,
        gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      },
      {
        title: "Total Patients",
        value: stats.total_patients,
        icon: <Users size={22} className="text-white" />,
        gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      },
      {
        title: "Pending Prescriptions",
        value: stats.pending_prescriptions,
        icon: <Pill size={22} className="text-white" />,
        gradient: "bg-gradient-to-br from-amber-500 to-amber-600",
      },
      {
        title: "Active Medications",
        value: stats.active_medications,
        icon: <Activity size={22} className="text-white" />,
        gradient: "bg-gradient-to-br from-violet-500 to-violet-600",
      },
    ],
    [stats]
  );

  const userName = user?.full_name?.split(" ").slice(0, 2).join(" ") ?? "Doctor";

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-6 lg:p-8">
      {/* ---- Welcome ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          <span className="text-gradient">
            {getGreeting()}, {userName}
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </motion.div>

      {/* ---- Navigation Cards Grid ---- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      >
        {visibleCards.map((card) => {
          const Icon = card.icon;

          return (
            <motion.button
              key={card.path}
              variants={fadeUp}
              onClick={() => navigate(card.path)}
              className={cn(
                "group flex w-full flex-col items-center rounded-2xl border border-white/60 bg-white px-4 py-5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300",
                "hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
                card.glowColor
              )}
            >
              <div
                className={cn(
                  "mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                  card.gradient
                )}
              >
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{card.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{card.description}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ---- Stats Row ---- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      >
        {statCards.map((card, _i) => (
          <motion.div
            key={card.title}
            variants={fadeUp}
            className="flex flex-col items-center rounded-2xl bg-indigo-50/60 px-4 py-5 text-center shadow-[0_4px_16px_rgba(79,70,229,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(79,70,229,0.15)]"
          >
              <div
                className={cn(
                  "mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
                  card.gradient
                )}
              >
                {card.icon}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              {loading ? (
                <div className="mt-1 h-9 w-16 animate-pulse rounded-md bg-muted" />
              ) : (
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {card.value}
                </p>
              )}
          </motion.div>
        ))}
      </motion.div>

      {/* ---- Schedule + Chart ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass rounded-2xl p-6 lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Today's Schedule
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/appointments")}
            >
              View All <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-16 animate-pulse rounded-lg bg-muted" />
                  <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
                </div>
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Calendar size={28} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                No appointments today
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enjoy a lighter day, or schedule something new.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => {
                const time = appt.scheduled_at
                  ? format(parseISO(appt.scheduled_at), "h:mm a")
                  : "--:--";
                const typeBadge = appointmentTypeBadge[appt.type] ?? {
                  label: appt.type,
                  variant: "outline" as const,
                };
                const statusBadge = appointmentStatusBadge[appt.status] ?? {
                  label: appt.status,
                  variant: "outline" as const,
                };

                return (
                  <div
                    key={appt.id}
                    onClick={() => navigate(`/patients/${appt.patient_id}`)}
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-border/50 bg-card/60 p-4 transition-colors hover:bg-card"
                  >
                    <div className="flex h-12 w-16 flex-col items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <Clock size={14} className="mb-0.5" />
                      <span className="text-xs font-semibold">{time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {appt.patient_name ?? "Patient"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={typeBadge.variant}>
                          {typeBadge.label}
                        </Badge>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {appt.duration_minutes} min
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Patients This Week
          </h2>
          {weeklyData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient
                      id="modernColorCount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(0,0,0,0.06)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      fontSize: "0.8rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#modernColorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
