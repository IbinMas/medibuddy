import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Onboard from './pages/Auth/Onboard';
import VerifyEmail from './pages/Auth/VerifyEmail';
import AcceptInvite from './pages/Auth/AcceptInvite';
import Landing from './pages/Home/Landing';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import TenantDashboard from './pages/Dashboard/TenantDashboard';
import PatientList from './pages/Dashboard/Patients/PatientList';
import PatientDetails from './pages/Dashboard/Patients/PatientDetails';
import Analytics from './pages/Dashboard/Analytics';
import PrescriptionList from './pages/Dashboard/Prescriptions/PrescriptionList';
import Settings from './pages/Dashboard/Settings';
import AuditLogs from './pages/Dashboard/AuditLogs';
import Communications from './pages/Dashboard/Communications';
import { useAuth } from './hooks/useAuth';

import { useLocation } from 'react-router-dom';

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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        
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
    </Router>
  )
}

export default App;
