import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import BusinessesPage from "@/pages/BusinessesPage";
import BusinessDetailPage from "@/pages/BusinessDetailPage";
import VerificationsPage from "@/pages/VerificationsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SearchPage from "@/pages/SearchPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminManagementPage from "@/pages/AdminManagementPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="businesses/:id" element={<BusinessDetailPage />} />
          <Route path="verifications" element={<VerificationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="audit" element={<AuditLogsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
