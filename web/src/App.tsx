import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import { useLocation } from 'react-router-dom';

const Login = lazy(() => import('./pages/Auth/Login'));
const Onboard = lazy(() => import('./pages/Auth/Onboard'));
const AcceptInvite = lazy(() => import('./pages/Auth/AcceptInvite'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const Landing = lazy(() => import('./pages/Home/Landing'));
const DashboardLayout = lazy(() => import('./pages/Dashboard/DashboardLayout'));
const TenantDashboard = lazy(() => import('./pages/Dashboard/TenantDashboard'));
const PatientList = lazy(() => import('./pages/Dashboard/Patients/PatientList'));
const PatientDetails = lazy(() => import('./pages/Dashboard/Patients/PatientDetails'));
const Analytics = lazy(() => import('./pages/Dashboard/Analytics'));
const PrescriptionList = lazy(() => import('./pages/Dashboard/Prescriptions/PrescriptionList'));
const Settings = lazy(() => import('./pages/Dashboard/Settings'));
const AuditLogs = lazy(() => import('./pages/Dashboard/AuditLogs'));
const Communications = lazy(() => import('./pages/Dashboard/Communications'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isSubscriptionActive } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isSubscriptionActive && location.pathname !== '/dashboard/settings') {
    return <Navigate to="/dashboard/settings" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboard" element={<Onboard />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TenantDashboard />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/:id" element={<PatientDetails />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="prescriptions" element={<PrescriptionList />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="communications" element={<Communications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App;
