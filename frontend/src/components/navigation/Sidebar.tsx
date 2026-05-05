import { Nav } from 'react-bootstrap';
import { BiReceipt } from 'react-icons/bi';
import {
  BsSpeedometer2,
  BsPeople,
  BsCalendar,
  BsCashStack,
  BsTree,
  BsPersonBadge,
  BsCoin,
  BsQrCode,
  BsQrCodeScan,
} from 'react-icons/bs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isManagerOrSupervisor =
    user?.jabatan === 'manager' || user?.jabatan === 'supervisor';
  const isStaff = !isAdmin && !isManagerOrSupervisor;

  const basePath = isAdmin
    ? '/admin'
    : isManagerOrSupervisor
    ? '/manager'
    : '/staff';

  // Menu admin
  const adminMenu = [
    { path: '', label: 'Dashboard', icon: <BsSpeedometer2 /> },
    { path: '/user', label: 'User', icon: <BsPeople /> },
    { path: '/tree', label: 'Management Tree', icon: <BsTree /> },
    { path: '/calendar', label: 'Calendar View', icon: <BsCalendar /> },
    { path: '/reimburse', label: 'Reimbursement', icon: <BiReceipt /> },
    { path: '/wage', label: 'Setting Wage', icon: <BsCashStack /> },
    { path: '/penalti', label: 'Penalties', icon: <BsPersonBadge /> },
    { path: '/insentif', label: 'Insentif', icon: <BsCoin /> },
    { path: '/qr', label: 'Generate QR', icon: <BsQrCode /> },
    { path: '/qrPage', label: 'QR Pulang', icon: <BsQrCodeScan /> },
  ];
  
  // Menu manager / supervisor
  const managerMenu = [
    { path: '', label: 'Dashboard', icon: <BsSpeedometer2 /> },
    { path: '/user', label: 'User', icon: <BsPeople /> },
    { path: '/tree', label: 'Management Tree', icon: <BsTree /> },
    { path: '/calendar', label: 'Calendar View', icon: <BsCalendar /> },
    { path: '/reimburse', label: 'Reimbursement', icon: <BiReceipt /> },
    { path: '/wage', label: 'Setting Wage', icon: <BsCashStack /> },
    { path: '/penalti', label: 'Penalties', icon: <BsPersonBadge /> },
    { path: '/insentif', label: 'Insentif', icon: <BsCoin /> },
    { path: '/qrPage', label: 'QR Pulang', icon: <BsQrCodeScan /> },
  ];
  
  // Menu staff
  const staffMenu = [
    { path: '/', label: 'Management Tree', icon: <BsTree /> },
    { path: '/calendar', label: 'Calendar View', icon: <BsCalendar /> },
    { path: '/reimburse', label: 'Reimbursement', icon: <BiReceipt /> },
    { path: '/wage', label: 'My wages', icon: <BsCashStack /> },
    { path: '/penalti', label: 'Penalties', icon: <BsPersonBadge /> },
    { path: '/qrPage', label: 'QR Pulang', icon: <BsQrCodeScan /> },
  ];

  const menu = isAdmin
    ? adminMenu
    : isManagerOrSupervisor
    ? managerMenu
    : staffMenu;

  return (
    <div
      style={{
        width: 250,
        background: '#fff',
        minHeight: '100vh',
        borderRight: '1px solid #ffe0e7',
      }}
      className="p-3 shadow-sm d-flex flex-column"
    >
      <div className="mb-4">
        <h4 style={{ color: '#ff3d7f', fontWeight: 700 }}>HBCOMPANY</h4>
        <div
          className="mt-2 p-2 rounded"
          style={{ background: '#fff0f5', fontSize: 12 }}
        >
          <div style={{ fontWeight: 600, color: '#333' }}>{user?.nama}</div>
          <div style={{ color: '#ff99aa' }}>
            {user?.jabatan} · {user?.departemen}
          </div>
        </div>
      </div>

      {/* NAV */}
      <Nav className="flex-column">
        {menu.map(item => {
          const fullPath = basePath + item.path;
          const isActive = location.pathname === fullPath;

          return (
            <Nav.Link
              key={fullPath}
              onClick={() => navigate(fullPath)}
              className="d-flex align-items-center gap-2 mb-1 rounded"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #ff6fa5, #ff3d7f)'
                  : 'transparent',
                color: isActive ? 'white' : '#4a4a4a',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                padding: '9px 12px',
                transition: 'background .15s',
              }}
              onMouseEnter={e => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = '#fff0f5';
              }}
              onMouseLeave={e => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Nav.Link>
          );
        })}
      </Nav>

      <div className="mt-auto pt-3" style={{ borderTop: '1px solid #ffe0e7' }}>
        <div
          className="text-center py-1 rounded"
          style={{
            fontSize: 11,
            background: '#fff0f5',
            color: '#ff99aa',
            letterSpacing: '0.05em',
          }}
        >
          {isAdmin ? '👑 Admin' : isManagerOrSupervisor ? '🗂 Manager' : '👤 Staff'}
        </div>
      </div>
    </div>
  );
}