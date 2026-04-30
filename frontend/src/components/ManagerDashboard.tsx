import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './navigation/Sidebar';
import Topbar from './navigation/TopBar';
import { Outlet } from 'react-router-dom';

export default function ManagerDashboard() {
  return (
    <Container fluid className="p-0 vh-100 d-flex">
      
      <Sidebar />

      <div className="flex-grow-1 d-flex flex-column">
        
        <Topbar />

        <div className="flex-grow-1 overflow-auto p-3 bg-light">
          <Outlet />
        </div>

      </div>
    </Container>
  );
}