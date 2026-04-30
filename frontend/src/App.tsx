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
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
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
        <Route path="dashboard-manage" element={<ManagerDashboard />} />
      </Route>
    </Routes>
  );
}