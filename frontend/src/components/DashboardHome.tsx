import { Row, Col, Card } from 'react-bootstrap';

export default function DashboardHome() {
  return (
    <>
      <h3 className="text-primary fw-bold">Dashboard Overview</h3>
      <Row className="g-3 mt-2">
        {["Users", "Revenue", "Deals", "Growth"].map((t, i) => (
          <Col md={3} key={i}>
            <Card className="p-3 shadow-sm">
              <small className="text-primary">{t}</small>
              <h4>123</h4>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}