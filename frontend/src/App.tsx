import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, Outlet } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Topbar from './components/TopBar';

import DashboardHome from './components/DashboardHome';
import UserPage from './components/user/UserPage';
import CalendarView from './components/leave/CalendarView';
import WageSettings from './components/wage/WageSettings';
import AdminProfile from './components/AdminProfile';
import ReimbursePage from './components/Reimburse/ReimbursePage';

import LoginPage from './components/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';

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
      </Route>
    </Routes>
  );
}