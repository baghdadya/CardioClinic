import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CardLayout } from "@/components/layout/CardLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useThemeStore } from "@/stores/themeStore";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ModernDashboardPage from "@/pages/ModernDashboardPage";
import PatientsPage from "@/pages/PatientsPage";
import PatientDetailPage from "@/pages/PatientDetailPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import UsersPage from "@/pages/UsersPage";
import MedicationsPage from "@/pages/MedicationsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import RiskCalculatorsPage from "@/pages/RiskCalculatorsPage";
import DrugInteractionsPage from "@/pages/DrugInteractionsPage";
import InstructionsPage from "@/pages/InstructionsPage";

const PrescriptionsPage = lazy(() => import("@/pages/PrescriptionsPage"));

function App() {
  const layout = useThemeStore((s) => s.layout);
  const isModern = layout === "modern";
  const LayoutComponent = isModern ? CardLayout : AppLayout;
  const HomePage = isModern ? ModernDashboardPage : DashboardPage;

  return (
    <BrowserRouter>
      <InstallPrompt />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <LayoutComponent />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/prescriptions" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><PrescriptionsPage /></Suspense>} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/risk-calculators" element={<RiskCalculatorsPage />} />
          <Route path="/drug-interactions" element={<DrugInteractionsPage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
