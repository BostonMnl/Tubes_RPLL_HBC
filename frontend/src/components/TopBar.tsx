import { Navbar, Form, FormControl, Badge } from 'react-bootstrap';

export default function Topbar() {
  return (
    <Navbar bg="light" className="px-4 shadow-sm">
      <Form className="d-flex w-50">
        <FormControl placeholder="Search..." />
      </Form>
      <div className="ms-auto d-flex align-items-center gap-3">
        <Badge bg="primary">3</Badge>
        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
          SJ
        </div>
        <span>Sarah Johnson</span>
      </div>
    </Navbar>
  );
}