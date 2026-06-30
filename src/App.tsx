import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import OwnersPage from "@/pages/OwnersPage";
import FeatureRequestsPage from "@/pages/FeatureRequestsPage";

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
          <Route
            index
            element={
              <ErrorBoundary>
                <DashboardPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="businesses"
            element={
              <ErrorBoundary>
                <BusinessesPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="businesses/:id"
            element={
              <ErrorBoundary>
                <BusinessDetailPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="verifications"
            element={
              <ErrorBoundary>
                <VerificationsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="analytics"
            element={
              <ErrorBoundary>
                <AnalyticsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="search"
            element={
              <ErrorBoundary>
                <SearchPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="audit"
            element={
              <ErrorBoundary>
                <AuditLogsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="notifications"
            element={
              <ErrorBoundary>
                <NotificationsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="admins"
            element={
              <ErrorBoundary>
                <AdminManagementPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="subscriptions"
            element={
              <ErrorBoundary>
                <SubscriptionsPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="owners"
            element={
              <ErrorBoundary>
                <OwnersPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="feature-requests"
            element={
              <ErrorBoundary>
                <FeatureRequestsPage />
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
