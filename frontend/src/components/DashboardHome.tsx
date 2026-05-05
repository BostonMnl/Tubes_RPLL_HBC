import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import AttendanceList from './Attendance/AttendanceList';
import {
  userServices,
  attendanceServices,
  logServices,
} from '../services/apiServices';

// ─── Types ─────────────────────────────────────────────────────

interface LogEntry {
  _id: string;
  userId: string | null;
  code: number;
  message: string;
  createdAt: string;
}

interface UserProfile {
  nama: string;
  email: string;
  jabatan: string;
  role: string;
  departemen: string;
  alamat: string;
  nomor_telepon: string | null;
  gambar: string | null;
}

// ─── Date Helpers ─────────────────────────────────────────────

const today = new Date();
const todayISO = today.toISOString().split('T')[0];
const todayStr = today.toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// ─── Component ────────────────────────────────────────────────

export default function DashboardHome() {
  const [hadirHariIni, setHadirHariIni] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [loading, setLoading] = useState({
    profile: true,
    attendance: true,
    logs: true,
  });

  const [error, setError] = useState('');

  // ─── Fetch All ───────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      fetchProfile(),
      fetchAttendance(),
      fetchLogs(),
    ]);
  };

  const fetchProfile = async () => {
    try {
      const data = await userServices.getMyProfile();
      setProfile(data.data?.user ?? null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  };

  const fetchAttendance = async () => {
    try {
      const data = await attendanceServices.getAttendanceManage({
        from: todayISO,
        to: todayISO,
        status: 'Hadir',
      });

      const list = data.data?.attendance ?? [];
      setHadirHariIni(list.length);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat kehadiran');
    } finally {
      setLoading((prev) => ({ ...prev, attendance: false }));
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await logServices.getMyLogs();
      setLogs(data.data?.logs ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading((prev) => ({ ...prev, logs: false }));
    }
  };

  // ─── Helpers ────────────────────────────────────────────────

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getCodeStyle = (code: number) => {
    if (code >= 200 && code < 300)
      return { bg: '#dcfce7', color: '#16a34a' };
    if (code >= 400 && code < 500)
      return { bg: '#fef9c3', color: '#ca8a04' };
    return { bg: '#fee2e2', color: '#dc2626' };
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const getRoleLabel = (role: string) => {
    const map: any = {
      admin: 'Administrator',
      manager: 'Manager',
      karyawan: 'Karyawan',
    };
    return map[role] || role;
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 24 }}>

      {/* HEADER */}
      <div className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg,#ff6fa5,#ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between flex-wrap gap-3">

          {/* LEFT */}
          <div>
            <h4 className="fw-bold mb-1">Dashboard Overview</h4>
            <small>{todayStr}</small>

            <div className="mt-3">
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: 12,
                display: 'inline-flex',
                gap: 10,
                alignItems: 'center'
              }}>
                <span>✅</span>
                {loading.attendance ? (
                  <Spinner size="sm" />
                ) : (
                  <b style={{ fontSize: 20 }}>{hadirHariIni}</b>
                )}
              </div>
            </div>
          </div>

          {/* PROFILE */}
          {loading.profile ? (
            <Spinner size="sm" />
          ) : profile && (
            <div className="d-flex align-items-center gap-2">
              {profile.gambar ? (
                <img
                  src={profile.gambar}
                  style={{ width: 40, height: 40, borderRadius: '50%' }}
                />
              ) : (
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#fff3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {getInitials(profile.nama)}
                </div>
              )}

              <div style={{ fontSize: 12 }}>
                <b>{profile.nama}</b><br />
                {getRoleLabel(profile.role)} · {profile.departemen}
              </div>
            </div>
          )}

        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* CONTENT */}
      <Row className="g-3">

        {/* ATTENDANCE */}
        <Col md={7}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="fw-bold mb-3" style={{ color: '#ff3d7f' }}>
                📋 Data Kehadiran
              </h6>
              <AttendanceList />
            </Card.Body>
          </Card>
        </Col>

        {/* LOG */}
        <Col md={5}>
          <Card className="shadow-sm border-0">
            <Card.Body>

              <h6 className="fw-bold mb-2" style={{ color: '#ff3d7f' }}>
                🕐 Log Aktivitas
              </h6>

              {loading.logs ? (
                <Spinner />
              ) : logs.length === 0 ? (
                <div className="text-muted text-center py-3">
                  Tidak ada log
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {logs.map((log) => {
                    const s = getCodeStyle(log.code);
                    return (
                      <div key={log._id}
                        className="mb-2 p-2"
                        style={{
                          background: '#fff8fb',
                          borderLeft: `4px solid ${s.color}`,
                          borderRadius: 10
                        }}>
                        <div className="d-flex justify-content-between">
                          <span style={{
                            background: s.bg,
                            color: s.color,
                            padding: '2px 6px',
                            fontSize: 11,
                            borderRadius: 6
                          }}>
                            {log.code}
                          </span>
                          <small>{formatTime(log.createdAt)}</small>
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {log.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>

      </Row>
    </div>
  );
}