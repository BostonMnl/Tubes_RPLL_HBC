import { Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import CalendarView from './leave/CalendarView';

interface LogActivity {
  _id: string;
  userId: string;
  code: number;
  message: string;
  createdAt: string;
}

interface ProfileData {
  user: {
    nama: string;
    email: string;
    jabatan: string;
    role: string;
    departemen: string;
    gambar?: string;
  };
  attendance: { date: string; status: string }[];
  total_reimburse: number;
  total_cuti: number;
  gaji: number;
}

const API_BASE = 'http://localhost:3000/api';

const fetchWithToken = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default function ManagerDashboard() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [logs, setLogs] = useState<LogActivity[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchWithToken(`${API_BASE}/me`)
      .then((r) => r.json())
      .then((res) => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoadingProfile(false));

    fetchWithToken(`${API_BASE}/log_activity/me`)
      .then((r) => r.json())
      .then((res) => setLogs(res.data?.logs || []))
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
  }, []);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return '#22c55e';
    if (code >= 400 && code < 500) return '#f97316';
    return '#ef4444';
  };

  const statCards = loadingProfile
    ? []
    : [
        {
          label: 'Total Cuti',
          value: profile?.total_cuti ?? 0,
          icon: '🏖️',
          color: '#ff6fa5',
          bg: '#fff0f5',
        },
        {
          label: 'Total Reimburse',
          value: profile?.total_reimburse ?? 0,
          icon: '🧾',
          color: '#ff3d7f',
          bg: '#ffe4ef',
        },
        {
          label: 'Gaji',
          value: formatRupiah(profile?.gaji ?? 0),
          icon: '💰',
          color: '#e91e8c',
          bg: '#fce4f0',
        },
        {
          label: 'Departemen',
          value: profile?.user.departemen ?? '-',
          icon: '🏢',
          color: '#c2185b',
          bg: '#fce4ec',
        },
      ];

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 24 }}>

      {/* ===== HEADER ===== */}
      <div
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #ff6fa5 0%, #ff3d7f 60%, #c2185b 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative circle */}
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)'
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -60,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }} />

        <div className="d-flex align-items-center gap-3" style={{ position: 'relative' }}>
          {profile?.user.gambar ? (
            <img
              src={`http://localhost:3000${profile.user.gambar}`}
              alt="avatar"
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }}
            />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28
            }}>👤</div>
          )}
          <div>
            <h4 className="mb-0 fw-bold">
              {loadingProfile ? 'Loading...' : `Halo, ${profile?.user.nama ?? 'Manager'} 👋`}
            </h4>
            <small style={{ opacity: 0.85 }}>
              {profile?.user.jabatan} · {profile?.user.departemen}
            </small>
          </div>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      {loadingProfile ? (
        <div className="text-center py-4"><Spinner animation="border" style={{ color: '#ff3d7f' }} /></div>
      ) : (
        <Row className="g-3 mb-4">
          {statCards.map((s, i) => (
            <Col key={i} xs={6} md={3}>
              <Card
                className="border-0 shadow-sm h-100"
                style={{ borderRadius: 16, background: s.bg }}
              >
                <Card.Body className="p-3">
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{s.label}</div>
                  <div className="fw-bold" style={{ fontSize: 20, color: s.color }}>
                    {s.value}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ===== ATTENDANCE BADGE ===== */}
      {profile?.attendance && profile.attendance.length > 0 && (
        <div className="mb-4 d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted" style={{ fontSize: 13 }}>Absensi :</span>
          {profile.attendance.map((a, i) => (
            <Badge
              key={i}
              style={{
                background: a.status === 'Hadir' ? '#22c55e' : a.status === 'Telat' ? '#f59e0b' : '#ef4444',
                fontSize: 13, padding: '6px 14px', borderRadius: 20
              }}
            >
              {a.status} · {a.date}
            </Badge>
          ))}
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <Row className="g-3">

        {/* Calendar */}
        <Col md={7}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span style={{ fontSize: 20 }}>📅</span>
                <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Kalender Cuti</h5>
              </div>
              <CalendarView />
            </Card.Body>
          </Card>
        </Col>

        {/* Activity Log */}
        <Col md={5}>
          <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span style={{ fontSize: 20 }}>📋</span>
                <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Log Aktivitas</h5>
              </div>

              {loadingLogs ? (
                <div className="text-center py-4">
                  <Spinner animation="border" style={{ color: '#ff3d7f' }} />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-muted text-center py-4">Belum ada aktivitas.</p>
              ) : (
                <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className="mb-2 p-3"
                      style={{
                        borderRadius: 12,
                        background: '#fff8fb',
                        borderLeft: `4px solid ${getCodeColor(log.code)}`,
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <span
                          className="fw-semibold"
                          style={{ fontSize: 12, color: getCodeColor(log.code) }}
                        >
                          {log.code}
                        </span>
                        <span className="text-muted" style={{ fontSize: 10 }}>
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>
  );
}