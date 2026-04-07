import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  HeartPulse,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import api from "@/services/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AscvdForm {
  age: string;
  sex: "male" | "female";
  race: "white" | "aa";
  total_cholesterol: string;
  hdl_cholesterol: string;
  systolic_bp: string;
  bp_treatment: boolean;
  diabetes: boolean;
  smoker: boolean;
}

interface AscvdResult {
  risk_percent: number;
  category: string;
  valid: boolean;
}

interface ChadForm {
  age: string;
  sex: "male" | "female";
  chf: boolean;
  hypertension: boolean;
  stroke_tia: boolean;
  vascular_disease: boolean;
  diabetes: boolean;
}

interface ChadResult {
  score: number;
  risk_category: string;
  recommendation: string;
}

interface HeartForm {
  history: 0 | 1 | 2;
  ecg: 0 | 1 | 2;
  age: 0 | 1 | 2;
  risk_factors: 0 | 1 | 2;
  troponin: 0 | 1 | 2;
}

interface HeartResult {
  score: number;
  risk_category: string;
  recommendation: string;
}

type TabKey = "ascvd" | "cha2ds2" | "heart";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

const riskColor = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("low")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (c.includes("moderate") || c.includes("intermediate") || c.includes("borderline"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
};

const riskDot = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("low")) return "bg-emerald-500";
  if (c.includes("moderate") || c.includes("intermediate") || c.includes("borderline"))
    return "bg-amber-500";
  return "bg-red-500";
};

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "ascvd", label: "ASCVD Risk", icon: <HeartPulse size={18} /> },
  {
    key: "cha2ds2",
    label: "CHA\u2082DS\u2082-VASc",
    icon: <Activity size={18} />,
  },
  { key: "heart", label: "HEART Score", icon: <AlertTriangle size={18} /> },
];

const scoreOptions = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
];

/* ------------------------------------------------------------------ */
/*  Checkbox helper                                                    */
/* ------------------------------------------------------------------ */

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-primary/20"
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  ASCVD Calculator                                                   */
/* ------------------------------------------------------------------ */

function AscvdCalculator() {
  const [form, setForm] = useState<AscvdForm>({
    age: "",
    sex: "male",
    race: "white",
    total_cholesterol: "",
    hdl_cholesterol: "",
    systolic_bp: "",
    bp_treatment: false,
    diabetes: false,
    smoker: false,
  });
  const [result, setResult] = useState<AscvdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    setError("");
    if (!form.age || !form.total_cholesterol || !form.hdl_cholesterol || !form.systolic_bp) {
      setError("Please fill in all numeric fields.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AscvdResult>("/calculators/ascvd", {
        age: Number(form.age),
        sex: form.sex,
        race: form.race,
        total_cholesterol: Number(form.total_cholesterol),
        hdl_cholesterol: Number(form.hdl_cholesterol),
        systolic_bp: Number(form.systolic_bp),
        bp_treatment: form.bp_treatment,
        diabetes: form.diabetes,
        smoker: form.smoker,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Calculation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Age"
          type="number"
          min={20}
          max={79}
          placeholder="40-79"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <Select
          label="Sex"
          value={form.sex}
          onChange={(e) =>
            setForm({ ...form, sex: e.target.value as "male" | "female" })
          }
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
        <Select
          label="Race"
          value={form.race}
          onChange={(e) =>
            setForm({ ...form, race: e.target.value as "white" | "aa" })
          }
          options={[
            { value: "white", label: "White" },
            { value: "aa", label: "African American" },
          ]}
        />
        <Input
          label="Total Cholesterol (mg/dL)"
          type="number"
          placeholder="130-320"
          value={form.total_cholesterol}
          onChange={(e) =>
            setForm({ ...form, total_cholesterol: e.target.value })
          }
        />
        <Input
          label="HDL Cholesterol (mg/dL)"
          type="number"
          placeholder="20-100"
          value={form.hdl_cholesterol}
          onChange={(e) =>
            setForm({ ...form, hdl_cholesterol: e.target.value })
          }
        />
        <Input
          label="Systolic BP (mmHg)"
          type="number"
          placeholder="90-200"
          value={form.systolic_bp}
          onChange={(e) => setForm({ ...form, systolic_bp: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <CheckboxField
          label="On BP Treatment"
          checked={form.bp_treatment}
          onChange={(v) => setForm({ ...form, bp_treatment: v })}
        />
        <CheckboxField
          label="Diabetes"
          checked={form.diabetes}
          onChange={(v) => setForm({ ...form, diabetes: v })}
        />
        <CheckboxField
          label="Current Smoker"
          checked={form.smoker}
          onChange={(v) => setForm({ ...form, smoker: v })}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button loading={loading} onClick={handleCalculate}>
        <Calculator size={18} />
        Calculate ASCVD Risk
      </Button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "rounded-xl border p-6",
              riskColor(result.category)
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("h-3 w-3 rounded-full", riskDot(result.category))} />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {result.category}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">
              {result.risk_percent.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm opacity-80">
              10-year ASCVD risk estimate
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CHA2DS2-VASc Calculator                                            */
/* ------------------------------------------------------------------ */

function ChadCalculator() {
  const [form, setForm] = useState<ChadForm>({
    age: "",
    sex: "male",
    chf: false,
    hypertension: false,
    stroke_tia: false,
    vascular_disease: false,
    diabetes: false,
  });
  const [result, setResult] = useState<ChadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    setError("");
    if (!form.age) {
      setError("Age is required.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<ChadResult>("/calculators/cha2ds2-vasc", {
        age: Number(form.age),
        sex: form.sex,
        chf: form.chf,
        hypertension: form.hypertension,
        stroke_tia: form.stroke_tia,
        vascular_disease: form.vascular_disease,
        diabetes: form.diabetes,
      });
      setResult(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Calculation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Age"
          type="number"
          placeholder="e.g. 72"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <Select
          label="Sex"
          value={form.sex}
          onChange={(e) =>
            setForm({ ...form, sex: e.target.value as "male" | "female" })
          }
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <CheckboxField
          label="CHF / LV Dysfunction"
          checked={form.chf}
          onChange={(v) => setForm({ ...form, chf: v })}
        />
        <CheckboxField
          label="Hypertension"
          checked={form.hypertension}
          onChange={(v) => setForm({ ...form, hypertension: v })}
        />
        <CheckboxField
          label="Stroke / TIA / Thromboembolism"
          checked={form.stroke_tia}
          onChange={(v) => setForm({ ...form, stroke_tia: v })}
        />
        <CheckboxField
          label="Vascular Disease"
          checked={form.vascular_disease}
          onChange={(v) => setForm({ ...form, vascular_disease: v })}
        />
        <CheckboxField
          label="Diabetes"
          checked={form.diabetes}
          onChange={(v) => setForm({ ...form, diabetes: v })}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button loading={loading} onClick={handleCalculate}>
        <Calculator size={18} />
        Calculate Score
      </Button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "rounded-xl border p-6",
              riskColor(result.risk_category)
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  riskDot(result.risk_category)
                )}
              />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {result.risk_category}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">Score: {result.score}</p>
            <p className="mt-2 text-sm opacity-80">{result.recommendation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HEART Score Calculator                                             */
/* ------------------------------------------------------------------ */

function HeartCalculator() {
  const [form, setForm] = useState<HeartForm>({
    history: 0,
    ecg: 0,
    age: 0,
    risk_factors: 0,
    troponin: 0,
  });
  const [result, setResult] = useState<HeartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<HeartResult>(
        "/calculators/heart-score",
        form
      );
      setResult(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Calculation failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    key: keyof HeartForm;
    label: string;
    descriptions: string[];
  }[] = [
    {
      key: "history",
      label: "History",
      descriptions: [
        "Slightly suspicious",
        "Moderately suspicious",
        "Highly suspicious",
      ],
    },
    {
      key: "ecg",
      label: "ECG",
      descriptions: [
        "Normal",
        "Non-specific repolarization",
        "Significant ST deviation",
      ],
    },
    {
      key: "age",
      label: "Age",
      descriptions: ["< 45", "45-64", ">= 65"],
    },
    {
      key: "risk_factors",
      label: "Risk Factors",
      descriptions: [
        "No known risk factors",
        "1-2 risk factors",
        ">=3 risk factors or history of atherosclerosis",
      ],
    },
    {
      key: "troponin",
      label: "Troponin",
      descriptions: ["Normal limit", "1-3x normal limit", ">3x normal limit"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {fields.map((field) => (
          <Select
            key={field.key}
            label={field.label}
            value={String(form[field.key])}
            onChange={(e) =>
              setForm({
                ...form,
                [field.key]: Number(e.target.value) as 0 | 1 | 2,
              })
            }
            options={scoreOptions.map((opt, i) => ({
              ...opt,
              label: `${opt.value} - ${field.descriptions[i]}`,
            }))}
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button loading={loading} onClick={handleCalculate}>
        <Calculator size={18} />
        Calculate HEART Score
      </Button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "rounded-xl border p-6",
              riskColor(result.risk_category)
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  riskDot(result.risk_category)
                )}
              />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {result.risk_category}
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold">Score: {result.score}/10</p>
            <p className="mt-2 text-sm opacity-80">{result.recommendation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RiskCalculatorsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ascvd");

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Risk Calculators
        </h2>
        <p className="text-sm text-muted-foreground">
          Evidence-based cardiovascular risk assessment tools
        </p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Calculator content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>
              {activeTab === "ascvd" && "ASCVD 10-Year Risk Calculator"}
              {activeTab === "cha2ds2" &&
                "CHA\u2082DS\u2082-VASc Score Calculator"}
              {activeTab === "heart" && "HEART Score Calculator"}
            </CardTitle>
            <CardDescription>
              {activeTab === "ascvd" &&
                "Estimates 10-year risk of a first atherosclerotic cardiovascular event"}
              {activeTab === "cha2ds2" &&
                "Stroke risk stratification in atrial fibrillation patients"}
              {activeTab === "heart" &&
                "Risk stratification for acute chest pain in the emergency setting"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "ascvd" && <AscvdCalculator />}
                {activeTab === "cha2ds2" && <ChadCalculator />}
                {activeTab === "heart" && <HeartCalculator />}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
