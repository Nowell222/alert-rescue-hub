import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Dashboards
import ResidentDashboard from "./pages/resident/ResidentDashboard";
import RescuerDashboard from "./pages/rescuer/RescuerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OfficialDashboard from "./pages/official/OfficialDashboard";

// Resident Pages
import EmergencySOS from "./pages/resident/EmergencySOS";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Resident Routes */}
            <Route path="/resident" element={<DashboardLayout />}>
              <Route index element={<ResidentDashboard />} />
              <Route path="emergency" element={<EmergencySOS />} />
              <Route path="map" element={<ResidentDashboard />} />
              <Route path="alerts" element={<ResidentDashboard />} />
              <Route path="requests" element={<ResidentDashboard />} />
              <Route path="family" element={<ResidentDashboard />} />
              <Route path="profile" element={<ResidentDashboard />} />
            </Route>

            {/* Rescuer Routes */}
            <Route path="/rescuer" element={<DashboardLayout />}>
              <Route index element={<RescuerDashboard />} />
              <Route path="missions" element={<RescuerDashboard />} />
              <Route path="map" element={<RescuerDashboard />} />
              <Route path="equipment" element={<RescuerDashboard />} />
              <Route path="history" element={<RescuerDashboard />} />
              <Route path="report" element={<RescuerDashboard />} />
              <Route path="profile" element={<RescuerDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="requests" element={<AdminDashboard />} />
              <Route path="rescuers" element={<AdminDashboard />} />
              <Route path="alerts" element={<AdminDashboard />} />
              <Route path="centers" element={<AdminDashboard />} />
              <Route path="inventory" element={<AdminDashboard />} />
              <Route path="map" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminDashboard />} />
              <Route path="profile" element={<AdminDashboard />} />
            </Route>

            {/* Barangay Official Routes */}
            <Route path="/official" element={<DashboardLayout />}>
              <Route index element={<OfficialDashboard />} />
              <Route path="center" element={<OfficialDashboard />} />
              <Route path="evacuees" element={<OfficialDashboard />} />
              <Route path="supplies" element={<OfficialDashboard />} />
              <Route path="alerts" element={<OfficialDashboard />} />
              <Route path="zone" element={<OfficialDashboard />} />
              <Route path="contact" element={<OfficialDashboard />} />
              <Route path="profile" element={<OfficialDashboard />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
