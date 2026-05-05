import { useEffect, useState } from 'react';
import { Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { wageServices } from '../../services/apiServices';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

type GajiItem = {
  nominal: number;
  tanggal_berlaku: string;
  keterangan?: string;
  tipe?: string;
};

export default function WageStaff() {
  const { user } = useAuth();

  const [gajiList, setGajiList] = useState<GajiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGaji = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);

        const res = await wageServices.getMyGaji();

        // 🔥 FIX: API kamu return OBJECT, bukan array
        const gajiObj = res.data?.gaji;

        const data: GajiItem[] = gajiObj ? [gajiObj] : [];

        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.tanggal_berlaku).getTime() -
            new Date(b.tanggal_berlaku).getTime()
        );

        setGajiList(sorted);
      } catch (err: any) {
        setError('Gaji Belum di Input');
      } finally {
        setLoading(false);
      }
    };

    fetchGaji();
  }, [user?.user_id]);

  const salaryData = gajiList.map(g => g.nominal);
  const labels = gajiList.map(g =>
    new Date(g.tanggal_berlaku).toLocaleDateString('id-ID', {
      month: 'short',
      year: 'numeric',
    })
  );

  const total = salaryData.reduce((a, b) => a + b, 0);
  const avg = salaryData.length ? Math.round(total / salaryData.length) : 0;
  const max = salaryData.length ? Math.max(...salaryData) : 0;
  const latest = salaryData.length ? salaryData[salaryData.length - 1] : 0;

  const formatRp = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Gaji',
        data: salaryData,
        tension: 0.4,
        borderWidth: 3,
        borderColor: '#ff6fa5',
        backgroundColor: 'rgba(255, 111, 165, 0.08)',
        pointBackgroundColor: '#ff3d7f',
        pointRadius: 5,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => formatRp(ctx.raw),
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val: any) => `Rp ${(val / 1_000_000).toFixed(1)}jt`,
          color: '#ff99aa',
          font: { size: 11 },
        },
        grid: { color: '#ffe0e7' },
      },
      x: {
        ticks: { color: '#ff99aa', font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>

      {/* HEADER */}
      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h3 className="mb-1">Gaji Saya</h3>
            <small>Riwayat dan informasi gaji kamu</small>
          </div>
          <div className="text-end">
            <div style={{ fontSize: 13, opacity: 0.85 }}>{user?.nama}</div>
            <div className="d-flex gap-2 mt-1 justify-content-end">
              <Badge bg="light" text="dark">{user?.jabatan}</Badge>
              <Badge bg="dark">{user?.departemen}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : gajiList.length === 0 ? (
        <Card className="p-4 text-center border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <p className="text-muted mb-0">Belum ada data gaji</p>
        </Card>
      ) : (
        <>
          {/* GAJI TERKINI */}
          <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div style={{ fontSize: 13, color: '#ff99aa' }}>Gaji Terkini</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ff3d7f' }}>
                  {formatRp(latest)}
                </div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  Per {labels[labels.length - 1]}
                </div>
              </div>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: '#fff0f3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
              }}>
                💰
              </div>
            </div>
          </Card>

          {/* STATS */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Rata-rata', value: avg, icon: '📊' },
              { label: 'Tertinggi', value: max, icon: '📈' },
              { label: 'Total', value: total, icon: '🏦' },
            ].map((item) => (
              <div className="col-4" key={item.label}>
                <Card className="p-3 text-center border-0 shadow-sm" style={{ borderRadius: 14 }}>
                  <div style={{ fontSize: 20 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: '#ff99aa' }}>{item.label}</div>
                  <div style={{ fontWeight: 700, color: '#ff3d7f' }}>
                    {formatRp(item.value)}
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* CHART */}
          <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
            <h5 style={{ color: '#ff3d7f' }}>Tren Gaji</h5>
            <div style={{ height: 280 }}>
              <Line data={chartData} options={chartOptions as any} />
            </div>
          </Card>

          {/* RIWAYAT */}
          <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
            <h5 style={{ color: '#ff3d7f' }}>Riwayat Gaji</h5>

            {gajiList.slice().reverse().map((item, i) => (
              <div
                key={i}
                className="d-flex justify-content-between p-3 mt-2 rounded"
                style={{
                  background: i === 0 ? '#fff0f3' : '#fafafa',
                  border: '1px solid #eee',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(item.tanggal_berlaku).toLocaleDateString('id-ID')}
                  </div>
                  {item.keterangan && (
                    <div style={{ fontSize: 12, color: '#aaa' }}>
                      {item.keterangan}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: '#ff3d7f' }}>
                  {formatRp(item.nominal)}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}