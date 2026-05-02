import { useEffect, useState } from 'react';
import { Card, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
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
import { wageServices } from '../../services/apiServices';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

type Employee = {
  id: string;
  name: string;
  role: string;
  jabatan: string;
};

type WageDetailProps = {
  employee: Employee;
  goBack: () => void;
};

export default function WageDetail({ employee, goBack }: WageDetailProps) {

  const [salaryData, setSalaryData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGaji = async () => {
      try {
        const res = await wageServices.getGajiByUserId(employee.id);
        const gajiList = res.data.gaji;

        const sorted = [...gajiList].sort(
          (a, b) =>
            new Date(a.tanggal_berlaku).getTime() -
            new Date(b.tanggal_berlaku).getTime()
        );

        setSalaryData(sorted.map((item: any) => item.nominal));

        setLabels(
          sorted.map((item: any) =>
            new Date(item.tanggal_berlaku).toLocaleDateString('id-ID', {
              month: 'short',
              year: 'numeric'
            })
          )
        );

      } catch (err) {
        console.error("ERROR GAJI:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGaji();
  }, [employee.id]);

  const total = salaryData.reduce((a, b) => a + b, 0);
  const avg = salaryData.length ? Math.round(total / salaryData.length) : 0;
  const max = salaryData.length ? Math.max(...salaryData) : 0;

  const data = {
    labels,
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

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>
      
      {/* BACK BUTTON */}
      <Button
        onClick={goBack}
        style={{
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          border: 'none',
          borderRadius: '12px'
        }}
        className="mb-3 px-4 py-2 shadow-sm"
      >
        ← Back
      </Button>

      {/* HEADER */}
      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white'
        }}
      >
        <h3 className="mb-1">{employee.name}</h3>
        <div>
          <Badge bg="light" text="dark" className="me-2">
            {employee.role}
          </Badge>
          <Badge bg="dark">
            {employee.jabatan}
          </Badge>
        </div>
      </Card>

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <>
          {/* STATS */}
          <Row className="mb-4 g-3">
            {[ 
              { label: 'Total', value: total },
              { label: 'Average', value: avg },
              { label: 'Max', value: max }
            ].map((item, i) => (
              <Col md={4} key={i}>
                <Card
                  className="p-3 text-center shadow-sm"
                  style={{
                    borderRadius: '16px',
                    border: 'none',
                    background: 'white'
                  }}
                >
                  <small style={{ color: '#888' }}>{item.label}</small>
                  <h4 style={{ color: '#ff3d7f' }}>
                    Rp {item.value.toLocaleString('id-ID')}
                  </h4>
                </Card>
              </Col>
            ))}
          </Row>

          {/* CHART */}
          <Card
            className="p-4 shadow-sm"
            style={{
              borderRadius: '16px',
              border: 'none'
            }}
          >
            <h5 className="mb-3" style={{ color: '#ff3d7f' }}>
              Salary Trend
            </h5>

            <div style={{ height: '320px' }}>
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
        </>
      )}
    </div>
  );
}