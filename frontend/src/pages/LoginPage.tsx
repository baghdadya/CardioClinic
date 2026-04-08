import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { APP_VERSION } from "@/version";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated mesh orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mesh-orb absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-indigo-400/20 blur-[100px]" />
        <div className="mesh-orb-delay absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-purple-500/15 blur-[120px]" />
        <div className="mesh-orb-delay-2 absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10 blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] px-4"
      >
        {/* Glassmorphism card */}
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.08] p-1 shadow-2xl shadow-black/20 backdrop-blur-2xl">
          <div className="rounded-[20px] bg-white p-8 sm:p-10">
            {/* Branding */}
            <div className="mb-10 flex flex-col items-center">
              <img
                src="/logo.png"
                alt="Maadi Clinic"
                className="mb-4 h-32 w-auto"
              />
              <p className="text-sm text-slate-500">
                Sign in to your account
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-2.5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-600/10"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800",
                    "ring-1 ring-slate-200",
                    "placeholder:text-slate-400",
                    "transition-all duration-200",
                    "hover:ring-slate-300",
                    "focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                  )}
                  placeholder="doctor@cardioclinic.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "w-full rounded-xl bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-800",
                      "ring-1 ring-slate-200",
                      "placeholder:text-slate-400",
                      "transition-all duration-200",
                      "hover:ring-slate-300",
                      "focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          Powered by Maadi Clinic v{APP_VERSION}
        </p>
      </motion.div>
    </div>
  );
}
