import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/TopBar';
import DashboardHome from './components/DashboardHome';
import UserPage from './components/UserPage';
import CalendarView from './components/CalendarView';
import HRStats from './components/HRStats';
import WageSettings from './components/WageSettings';

export default function App() {
  const [active, setActive] = useState('dashboard');

  const renderPage = () => {
    switch (active) {
      case 'user': return <UserPage />;
      case 'calendar': return <CalendarView />;
      case 'hr': return <HRStats />;
      case 'wage': return <WageSettings />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-grow-1">
        <Topbar />
        <div className="p-4">{renderPage()}</div>
      </div>
    </div>
  );
}