import { Navbar, Form, FormControl, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getBasePath = () => {
    if (user?.role === 'admin') return '/admin';
    const jabatan = user?.jabatan?.toLowerCase();
    if (jabatan === 'manager' || jabatan === 'supervisor') return '/manager';
    return '/staff';
  };

  const basePath = getBasePath();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <Navbar bg="white" className="px-4 shadow-sm border-bottom">
      {/* Search Bar */}
      {/* <Form className="d-flex w-50">
        <FormControl
          placeholder="Search..."
          className="bg-light border-0"
          style={{ borderRadius: '8px' }}
        />
      </Form> */}

      <div className="ms-auto d-flex align-items-center gap-3">
        {/* Info Role */}
        <span className="badge bg-light text-primary border me-2">
          {user?.role?.toUpperCase()}
        </span>

        <Dropdown align="end">
          <Dropdown.Toggle
            variant="light"
            className="d-flex align-items-center gap-2 border-0 bg-transparent p-0"
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: 38, height: 38, fontSize: '14px' }}
            >
              {getInitials(user?.nama)}
            </div>
            <div className="text-start d-none d-sm-block">
              <p className="mb-0 fw-semibold text-dark" style={{ fontSize: '14px', lineHeight: '1.2' }}>
                {user?.nama || 'User'}
              </p>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow border-0 mt-2">
            <Dropdown.Item onClick={() => navigate(`${basePath}/profile`)}>
              My Profile
            </Dropdown.Item>
            {/* <Dropdown.Item onClick={() => navigate(`${basePath}/settings`)}>
              Settings
            </Dropdown.Item> */}
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
}