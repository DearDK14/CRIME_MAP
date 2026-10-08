import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';

// Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MapPage from './pages/MapPage';
import IncidentsPage from './pages/IncidentsPage';
import StationsPage from './pages/StationsPage';
import HotspotsPage from './pages/HotspotsPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import ImportPage from './pages/ImportPage';
import OfficerPage from './pages/OfficerPage';
import AnalystPage from './pages/AnalystPage';
import AdminPage from './pages/AdminPage';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Initializing CRIMEMAP C4I System...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Role-based Route Guard
function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Application Layout with persistent Header and Sidebar
function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070d18] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#070d18] p-3 md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Fullscreen layout specifically for Interactive Map
function MapLayout() {
  return (
    <div className="h-screen flex flex-col bg-[#070d18] text-slate-100 font-sans overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative bg-[#070d18]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Standard Dashboard & Operational Layout Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/map" element={<Navigate to="/dashboard" replace />} />
              <Route path="/risk" element={<Navigate to="/analytics" replace />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/stations" element={<StationsPage />} />
              <Route path="/hotspots" element={<HotspotsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/import" element={<ImportPage />} />

              {/* Role-Specific Workbenches */}
              <Route
                path="/officer"
                element={
                  <RoleRoute roles={['police_officer', 'admin']}>
                    <OfficerPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/analyst"
                element={
                  <RoleRoute roles={['analyst', 'admin']}>
                    <AnalystPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <RoleRoute roles={['admin']}>
                    <AdminPage />
                  </RoleRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
