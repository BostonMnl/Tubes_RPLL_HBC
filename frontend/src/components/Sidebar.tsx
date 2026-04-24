import { Nav } from 'react-bootstrap';
import { BiReceipt } from 'react-icons/bi';
import {
  BsSpeedometer2,
  BsPeople,
  BsCalendar,
  BsBarChart,
  BsCashStack
} from 'react-icons/bs';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { path: '/', label: 'Dashboard', icon: <BsSpeedometer2 /> },
    { path: '/user', label: 'User', icon: <BsPeople /> },
    { path: '/calendar', label: 'Calendar View', icon: <BsCalendar /> },
    { path: '/Reimburse', label: 'Reimbursement', icon: <BiReceipt /> },
    { path: '/wage', label: 'Setting Wage', icon: <BsCashStack /> },
  ];

  return (
    <div style={{ width: 250, background: '#fff' }} className="p-3 shadow-sm">
      <h4 className="text-primary fw-bold">HBCOMPANY</h4>

      <Nav className="flex-column mt-4">
        {menu.map(item => (
          <Nav.Link
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`d-flex align-items-center gap-2 mb-2 rounded ${
              location.pathname === item.path
                ? 'bg-primary text-white'
                : ''
            }`}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
}