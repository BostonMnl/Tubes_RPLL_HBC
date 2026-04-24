import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

type Employee = {
  id: number;
  name: string;
  role: string;
};

type WageDetailProps = {
  employee: Employee;
  goBack: () => void;
};

export default function WageDetail({ employee, goBack }: WageDetailProps) {

  const salaryData = [500, 700, 650, 800, 900];

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Salary',
        data: salaryData,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
      }
    ]
  };

  const total = salaryData.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / salaryData.length);
  const max = Math.max(...salaryData);

  return (
    <div>
      <Button variant="secondary" className="mb-3" onClick={goBack}>
        ← Back
      </Button>

      {/* Header */}
      <Card className="p-4 shadow-sm mb-4">
        <h4 className="mb-1">{employee.name}</h4>
        <Badge bg="primary">{employee.role}</Badge>
      </Card>

      {/* Stats */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small>Total Salary</small>
            <h4 className="text-primary">${total}</h4>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small>Average</small>
            <h4>${avg}</h4>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="p-3 shadow-sm text-center">
            <small>Highest</small>
            <h4>${max}</h4>
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card className="p-4 shadow-sm">
        <h5 className="mb-3">Salary Trend</h5>
        <div style={{ height: '300px' }}>
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true }
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
}