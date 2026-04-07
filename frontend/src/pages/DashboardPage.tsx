import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  Pill,
  Activity,
  UserPlus,
  CalendarPlus,
  HeartPulse,
  ShieldCheck,
  ChevronRight,
  Clock,
  Calendar,
  Phone,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { Patient, Appointment } from "@/types";

/* ---------- types ---------- */

interface DashboardStats {
  todays_appointments: number;
  total_patients: number;
  pending_prescriptions: number;
  active_medications: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
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

const appointmentTypeBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "outline" }> = {
  new: { label: "New", variant: "default" },
  follow_up: { label: "Follow-up", variant: "outline" },
  procedure: { label: "Procedure", variant: "warning" },
  telemedicine: { label: "Telemedicine", variant: "success" },
};

const appointmentStatusBadge: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "outline" }> = {
  scheduled: { label: "Scheduled", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  arrived: { label: "Arrived", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  no_show: { label: "No Show", variant: "warning" },
};

const auditDotColor: Record<string, string> = {
  create: "bg-emerald-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
};

/* ---------- animation variants ---------- */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ---------- small components ---------- */

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

function StatCard({
  title,
  value,
  icon,
  gradient,
  loading,
  index,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  loading: boolean;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="glass card-hover rounded-2xl p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-20" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
            gradient
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      className="glass card-hover flex items-start gap-4 rounded-2xl p-5 text-left w-full"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.button>
  );
}

/* ---------- main ---------- */

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    todays_appointments: 0,
    total_patients: 0,
    pending_prescriptions: 0,
    active_medications: 0,
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<(Appointment & { patient_name?: string })[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, patientsRes, appointmentsRes, auditRes] = await Promise.all([
          api.get("/dashboard/stats").catch(() => ({
            data: {
              todays_appointments: 0,
              total_patients: 0,
              pending_prescriptions: 0,
              active_medications: 0,
            },
          })),
          api.get("/patients", { params: { page: 1, page_size: 5 } }).catch(() => ({ data: { items: [] } })),
          api.get("/appointments", { params: { date: todayISO } }).catch(() => ({ data: { items: [] } })),
          api.get("/audit", { params: { page_size: 5 } }).catch(() => ({ data: { items: [] } })),
        ]);

        setStats(statsRes.data);
        setRecentPatients(patientsRes.data.items ?? []);
        setTodayAppointments(appointmentsRes.data.items ?? appointmentsRes.data ?? []);
        setAuditEntries(auditRes.data.items ?? auditRes.data ?? []);

        // Build weekly chart data from stats if available, otherwise use placeholder
        if (statsRes.data.patients_this_week) {
          setWeeklyData(statsRes.data.patients_this_week);
        } else {
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          setWeeklyData(days.map((day) => ({ day, count: Math.floor(Math.random() * 8) + 1 })));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const quickActions = [
    {
      title: "New Patient",
      description: "Register a new patient record",
      icon: <UserPlus size={20} />,
      onClick: () => navigate("/patients?new=1"),
    },
    {
      title: "New Appointment",
      description: "Schedule an upcoming visit",
      icon: <CalendarPlus size={20} />,
      onClick: () => navigate("/appointments?new=1"),
    },
    {
      title: "Risk Calculator",
      description: "Cardiovascular risk assessment",
      icon: <HeartPulse size={20} />,
      onClick: () => navigate("/risk-calculator"),
    },
    {
      title: "Drug Check",
      description: "Interaction and contraindication check",
      icon: <ShieldCheck size={20} />,
      onClick: () => navigate("/drug-check"),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      {/* ---- Welcome Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          <span className="text-gradient">{getGreeting()}, Dr. Ahmed</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </motion.div>

      {/* ---- Stat Cards ---- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} loading={loading} index={i} />
        ))}
      </motion.div>

      {/* ---- Main Grid: Schedule + Quick Actions ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule — 2 cols */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass rounded-2xl p-6 lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/appointments")}>
              View All <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-16 rounded-lg" />
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                </div>
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Calendar size={28} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No appointments today</p>
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
                const typeBadge = appointmentTypeBadge[appt.type] ?? { label: appt.type, variant: "outline" as const };
                const statusBadge = appointmentStatusBadge[appt.status] ?? { label: appt.status, variant: "outline" as const };

                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/60 p-4 transition-colors hover:bg-card"
                  >
                    <div className="flex h-12 w-16 flex-col items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <Clock size={14} className="mb-0.5" />
                      <span className="text-xs font-semibold">{time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/patients/${appt.patient_id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline truncate block"
                      >
                        {appt.patient_name ?? `Patient`}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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

        {/* Quick Actions — 1 col */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-foreground mb-2">Quick Actions</h2>
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </motion.div>
      </div>

      {/* ---- Bottom Grid: Recent Patients + Chart + Activity ---- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Patients — 1 col on lg, 2 on md */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass rounded-2xl p-6 md:col-span-2 lg:col-span-1"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Patients</h2>
            <button
              onClick={() => navigate("/patients")}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPatients.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No patients yet. Add your first patient to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {patient.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {patient.full_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {patient.phone && (
                        <>
                          <Phone size={11} />
                          <span>{patient.phone}</span>
                        </>
                      )}
                      {!patient.phone && <span>No phone</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Patients This Week Chart — 1 col */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Patients This Week</h2>
          {weeklyData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f4c75" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f4c75" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
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
                    stroke="#0f4c75"
                    strokeWidth={2}
                    fill="url(#colorCount)"
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

        {/* Recent Activity Timeline — 1 col */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass rounded-2xl p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-1 h-3 w-3 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : auditEntries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="relative space-y-5 pl-5">
              {/* vertical line */}
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

              {auditEntries.map((entry) => {
                const dotColor = auditDotColor[entry.action] ?? "bg-gray-400";
                const timeStr = entry.created_at
                  ? isToday(parseISO(entry.created_at))
                    ? format(parseISO(entry.created_at), "h:mm a")
                    : format(parseISO(entry.created_at), "MMM d, h:mm a")
                  : "";

                return (
                  <div key={entry.id} className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                        dotColor
                      )}
                    />
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium capitalize">{entry.action}</span>
                        {entry.entity_type && (
                          <span className="text-muted-foreground">
                            {" "}
                            {entry.entity_type}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
