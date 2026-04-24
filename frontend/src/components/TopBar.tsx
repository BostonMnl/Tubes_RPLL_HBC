import { Navbar, Form, FormControl, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';


export default function Topbar() {
  const navigate = useNavigate();
  return (
    <Navbar bg="light" className="px-4 shadow-sm">
      <Form className="d-flex w-50">
        <FormControl placeholder="Search..." />
      </Form>

      <div className="ms-auto d-flex align-items-center gap-3">
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="light"
            className="d-flex align-items-center gap-2 border-0 bg-transparent"
          >
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40 }}
            >
              SJ
            </div>
            <span>Sarah Johnson</span>
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
            <Dropdown.Item href="/settings">Settings</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item href="/logout">Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
}