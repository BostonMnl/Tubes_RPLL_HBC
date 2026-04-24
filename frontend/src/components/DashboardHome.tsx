import { Row, Col, Card } from 'react-bootstrap';
import AttendanceList from './AttendanceList';


export default function DashboardHome() {

  // dummy data (nanti dari backend)
  const totalUsers = 25;
  const hadirHariIni = 18;
  const reimburstRequest = 5;

  return (
    <>
      <h3 className="text-primary fw-bold">Dashboard Overview</h3>

      {/* ===== STATS ===== */}
      <Row className="g-3 mt-2">
        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small className="text-muted">Total Karyawan</small>
            <h3>{totalUsers}</h3>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small className="text-muted">Kehadiran Hari Ini</small>
            <h3 className="text-success">{hadirHariIni}</h3>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small className="text-muted">Reimbursement Request</small>
            <h3 className="text-danger">{reimburstRequest}</h3>
          </Card>
        </Col>
      </Row>

      <AttendanceList/>
    </>
  );
}


