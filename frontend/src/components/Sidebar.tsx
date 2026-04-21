import { Nav } from 'react-bootstrap';
import {
  BsSpeedometer2,
  BsPeople,
  BsCalendar,
  BsBarChart,
  BsCashStack
} from 'react-icons/bs';

type SidebarProps = {
  active: string;
  setActive: (value: string) => void;
};

export default function Sidebar({ active, setActive }: SidebarProps) {

  const menu = [
    { key: 'dashboard', label: 'Dashboard', icon: <BsSpeedometer2 /> },
    { key: 'user', label: 'User', icon: <BsPeople /> },
    { key: 'calendar', label: 'Calendar View', icon: <BsCalendar /> },
    { key: 'hr', label: 'HR Stats', icon: <BsBarChart /> },
    { key: 'wage', label: 'Setting Wage', icon: <BsCashStack /> },
  ];

  return (
    <div style={{ width: 250, background: '#fff' }} className="p-3 shadow-sm">
      <h4 className="text-primary fw-bold">HBCOMPANY</h4>

      <Nav className="flex-column mt-4">
        {menu.map(item => (
          <Nav.Link
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`d-flex align-items-center gap-2 mb-2 rounded ${
              active === item.key ? 'bg-primary text-white' : ''
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