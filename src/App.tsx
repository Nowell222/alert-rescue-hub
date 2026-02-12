import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Shared Pages
import ProfilePage from "./pages/shared/ProfilePage";

// Resident Pages
import ResidentDashboard from "./pages/resident/ResidentDashboard";
import EmergencySOS from "./pages/resident/EmergencySOS";
import MyRequests from "./pages/resident/MyRequests";
import AlertsPage from "./pages/resident/AlertsPage";
import FloodMap from "./pages/resident/FloodMap";
import FamilyStatus from "./pages/resident/FamilyStatus";

// Rescuer Pages
import RescuerDashboard from "./pages/rescuer/RescuerDashboard";
import MissionsPage from "./pages/rescuer/MissionsPage";
import EquipmentPage from "./pages/rescuer/EquipmentPage";
import HistoryPage from "./pages/rescuer/HistoryPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AlertsManagement from "./pages/admin/AlertsManagement";
import RequestsManagement from "./pages/admin/RequestsManagement";
import CentersManagement from "./pages/admin/CentersManagement";
import RescuersManagement from "./pages/admin/RescuersManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";

// Official Pages
import OfficialDashboard from "./pages/official/OfficialDashboard";
import EvacueesManagement from "./pages/official/EvacueesManagement";
import SuppliesManagement from "./pages/official/SuppliesManagement";
import HouseholdMapView from "./pages/official/HouseholdMapView";
import RegisteredResidents from "./pages/official/RegisteredResidents";
import ResidentsMap from "./pages/official/ResidentsMap";

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
              <Route path="map" element={<FloodMap />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="requests" element={<MyRequests />} />
              <Route path="family" element={<FamilyStatus />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Rescuer Routes */}
            <Route path="/rescuer" element={<DashboardLayout />}>
              <Route index element={<RescuerDashboard />} />
              <Route path="missions" element={<MissionsPage />} />
              <Route path="map" element={<FloodMap />} />
              <Route path="equipment" element={<EquipmentPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="report" element={<RescuerDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="requests" element={<RequestsManagement />} />
              <Route path="rescuers" element={<RescuersManagement />} />
              <Route path="alerts" element={<AlertsManagement />} />
              <Route path="centers" element={<CentersManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="residents" element={<RegisteredResidents />} />
              <Route path="residents-map" element={<ResidentsMap />} />
              <Route path="map" element={<FloodMap />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Barangay Official Routes */}
            <Route path="/official" element={<DashboardLayout />}>
              <Route index element={<OfficialDashboard />} />
              <Route path="center" element={<OfficialDashboard />} />
              <Route path="evacuees" element={<EvacueesManagement />} />
              <Route path="residents" element={<RegisteredResidents />} />
              <Route path="residents-map" element={<ResidentsMap />} />
              <Route path="supplies" element={<SuppliesManagement />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="zone" element={<HouseholdMapView />} />
              <Route path="contact" element={<OfficialDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
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
