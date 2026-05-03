import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Outlet } from 'react-router-dom';

import Sidebar from './components/navigation/Sidebar';
import Topbar from './components/navigation/TopBar';

import DashboardHome from './components/DashboardHome';
import UserPage from './components/user/UserPage';
import CalendarView from './components/leave/CalendarView';
import WageSettings from './components/wage/WageSettings';
import AdminProfile from './components/AdminProfile';
import ReimbursePage from './components/Reimburse/ReimbursePage';

import LoginPage from './components/login/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';

import ManagementTree from './components/ManagementTree';
import ManagerDashboard from './components/ManagerDashboard';
import RoleRoute from './routes/RoleRoute';
import UserPageManager from './components/manager/UserPageManager';

function DashboardLayout() {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-grow-1">
        <Topbar />
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* ===== ADMIN ===== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowRole={['admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="user" element={<UserPage />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="reimburse" element={<ReimbursePage />} />
        <Route path="wage" element={<WageSettings />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="tree" element={<ManagementTree />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* ===== MANAGER ===== */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <RoleRoute allowJabatan={['manager', 'supervisor']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="user" element={<UserPageManager />} />

        <Route path="calendar" element={<CalendarView />} />
        <Route path="reimburse" element={<ReimbursePage />} />
        <Route path="wage" element={<WageSettings />} />
        <Route path="tree" element={<ManagementTree />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );

}