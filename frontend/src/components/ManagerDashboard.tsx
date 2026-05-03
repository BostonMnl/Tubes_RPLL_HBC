import { Row, Col, Card } from 'react-bootstrap';
import CalendarView from './leave/CalendarView';

export default function ManagerDashboard() {
  const totalCuti = 12;
  const pendingReimburse = 4;
  const teamSize = 8;

  return (
    <>
      <h3 className="text-primary fw-bold mb-3">Manager Dashboard</h3>

      {/* ===== STATS ===== */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small className="text-muted">Jumlah Cuti Tim</small>
            <h3 className="text-warning">{totalCuti}</h3>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small className="text-muted">Pending Reimburse</small>
            <h3 className="text-danger">{pendingReimburse}</h3>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small className="text-muted">Jumlah Tim</small>
            <h3 className="text-success">{teamSize}</h3>
          </Card>
        </Col>
      </Row>

      {/* ===== CONTENT ===== */}
      <Row className="mt-4 g-3">

        {/* Calendar */}
        <Col md={7}>
          <Card className="p-3 shadow-sm">
            <h5 className="mb-3">Kalender Cuti</h5>
            <CalendarView />
          </Card>
        </Col>
      </Row>
    </>
  );
}