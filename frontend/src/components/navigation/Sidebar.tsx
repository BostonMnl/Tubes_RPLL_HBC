import { Nav } from 'react-bootstrap';
import { BiReceipt } from 'react-icons/bi';
import {
  BsSpeedometer2,
  BsPeople,
  BsCalendar,
  BsCashStack,
  BsTree,
} from 'react-icons/bs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/manager';

  const menu = [
    { path: '', label: 'Dashboard', icon: <BsSpeedometer2 /> },

    ...(isAdmin
      ? [{ path: '/user', label: 'User', icon: <BsPeople /> }]
      : []),

    { path: '/tree', label: 'Management Tree', icon: <BsTree /> },
    { path: '/calendar', label: 'Calendar View', icon: <BsCalendar /> },
    { path: '/reimburse', label: 'Reimbursement', icon: <BiReceipt /> },
    { path: '/wage', label: 'Setting Wage', icon: <BsCashStack /> },
  ];

  return (
    <div style={{ width: 250, background: '#fff' }} className="p-3 shadow-sm">
      <h4 className="text-primary fw-bold">HBCOMPANY</h4>

      <Nav className="flex-column mt-4">
        {menu.map(item => {
          const fullPath = basePath + item.path;

          return (
            <Nav.Link
              key={fullPath}
              onClick={() => navigate(fullPath)}
              className={`d-flex align-items-center gap-2 mb-2 rounded ${
                location.pathname === fullPath
                  ? 'bg-primary text-white'
                  : 'text-dark'
              }`}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </Nav.Link>
          );
        })}
      </Nav>
    </div>
  );
}