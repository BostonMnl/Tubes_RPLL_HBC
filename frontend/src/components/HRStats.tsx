// pages/HRStats.jsx
import { Row, Col, Card } from 'react-bootstrap';
import { useState } from 'react';
import ResetPage from './ResetPage';
import LeavePage from './LeavePage';
import ReimbursePage from './ReimbursePage';


export default function HRStats() {
  const [page, setPage] = useState('main');

  if (page === 'reset') return <ResetPage goBack={() => setPage('main')} />;
  if (page === 'cuti') return <LeavePage goBack={() => setPage('main')} />;
  if (page === 'reimburs') return <ReimbursePage goBack={() => setPage('main')} />;

  return (
    <>
      <h4>HR Statistics</h4>
      <Row className="g-3 mt-2">
        <Col md={4}>
          <Card className="p-3 shadow-sm text-center" style={{ cursor: 'pointer' }} onClick={() => setPage('reset')}>
            <small>Password Reset</small>
            <h4>12</h4>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm text-center" style={{ cursor: 'pointer' }} onClick={() => setPage('cuti')}>
            <small>Jumlah Cuti</small>
            <h4>8</h4>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm text-center" style={{ cursor: 'pointer' }} onClick={() => setPage('reimburs')}>
            <small>Reimbursement</small>
            <h4>5</h4>
          </Card>
        </Col>
      </Row>
    </>
  );
}