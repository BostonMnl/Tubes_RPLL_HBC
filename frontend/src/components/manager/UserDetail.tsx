import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import dummny from '../../../public/dummy.jpg';
import { userServices } from '../../services/apiServices';
import { getUser } from '../../utils/tokenManager';

type Props = {
  userId: string;
  goBack: () => void;
  onPromoteSuccess?: () => void;
};
type Jabatan = 'staff' | 'manager' | 'supervisor';

type User = {
  user_id: string;
  nama: string;
  email: string;
  jabatan: Jabatan;
  role: string;
  departemen: string;
  nomor_telepon?: string;
  tanggal_lahir?: string;
  alamat?: string;
  gambar?: string;
};

export default function UserDetail({ userId, goBack, onPromoteSuccess }: Props) {
  const [form, setForm] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);

  const currentUser = getUser();

  const display = (val: any) => (val ? val : '-');

  const NEXT_JABATAN: Record<Jabatan, Jabatan | null> = {
    staff: 'manager',
    manager: 'supervisor',
    supervisor: null,
  };

  // 🔥 fetch user
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await userServices.getUserByIdManagerial(userId);
        const userData = res.data ?? res.user ?? res;
        setForm(userData.user);
        setAttendance(userData.attendance || []);
      } catch (err) {
        console.error('Gagal ambil user detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const preview = form?.gambar
    ? `http://localhost:3000${form.gambar}`
    : dummny;

  // 🔥 cek apakah boleh promote
  const canPromote = () => {
    if (!form || !currentUser) return false;

    if (currentUser.jabatan === 'manager') {
      return form.jabatan === 'staff';
    }

    if (currentUser.jabatan === 'supervisor') {
      return form.jabatan === 'staff' || form.jabatan === 'manager';
    }

    return false;
  };

  // 🔥 target jabatan
  const getNextJabatan = () => {
    if (!form) return null;
    return NEXT_JABATAN[form.jabatan];
  };

  // 🔥 PROMOTE
  const handlePromote = async () => {
    const nextJabatan = getNextJabatan();
    if (!nextJabatan) return;

    if (!window.confirm(`Naikkan ${form?.nama} ke ${nextJabatan}?`)) return;

    setSaveLoading(true);
    setSaveError('');

    try {
      let payload: any = {
        jabatan: nextJabatan,
      };

      if (nextJabatan === 'manager') {
        payload.manager_id = currentUser.user_id;
      }

      if (nextJabatan === 'supervisor') {
        payload.manager_id = null;
      }
      console.log(currentUser.jabatan)

      await userServices.promoteUser(userId, {
        jabatan: nextJabatan,
      });

      setForm(prev => prev ? { ...prev, jabatan: nextJabatan } : prev);

      onPromoteSuccess?.();
      alert(`${form?.nama} berhasil naik ke ${nextJabatan}!`);
    } catch (err) {
      setSaveError('Gagal promote jabatan');
    } finally {
      setSaveLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'Hadir') return <Badge bg="success">Hadir</Badge>;
    if (status === 'Telat') return <Badge bg="warning" text="dark">Telat</Badge>;
    return <Badge bg="danger">Cuti</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>

      <Button
        className="mb-3"
        onClick={goBack}
        style={{ background: '#ffc0cb', border: 'none', color: '#333', borderRadius: '10px' }}
      >
        ← Back
      </Button>

      <Card className="p-4 shadow-sm mb-4" style={{ borderRadius: 16, border: 'none' }}>
        <Row>

          {/* LEFT */}
          <Col md={4} className="text-center border-end">
            <img
              src={preview}
              alt="profile"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #ff3d7f',
              }}
            />

            <h5 className="mt-3 fw-bold">{display(form?.nama)}</h5>

            <div className="d-flex justify-content-center gap-2 mt-2">
              <Badge bg="danger">{display(form?.jabatan)}</Badge>
              <Badge bg="secondary">{display(form?.departemen)}</Badge>
            </div>
          </Col>

          {/* RIGHT */}
          <Col md={8}>
            <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
              Informasi User
            </h5>

            <Row>
              <Col md={6}>
                <p><b>Email</b><br />{display(form?.email)}</p>
                <p><b>Nomor Telp</b><br />{display(form?.nomor_telepon)}</p>
                <p><b>Tanggal Lahir</b><br />{display(form?.tanggal_lahir?.split('T')[0] ?? '')}</p>
              </Col>
              <Col md={6}>
                <p><b>Alamat</b><br />{display(form?.alamat)}</p>
                <p><b>Departemen</b><br />{display(form?.departemen)}</p>
                <p><b>Role</b><br />{display(form?.role)}</p>
              </Col>
            </Row>

            {saveError && <Alert variant="danger">{saveError}</Alert>}

            {/* 🔥 PROMOTE SECTION */}
            {canPromote() ? (
              <div className="mt-3 p-3" style={{ background: '#fff0f3', borderRadius: 12 }}>
                <p className="mb-1 fw-semibold" style={{ color: '#ff3d7f' }}>
                  Promosi Jabatan
                </p>

                <p className="mb-3 text-muted" style={{ fontSize: 13 }}>
                  Naikkan <b>{form?.nama}</b> ke <b>{getNextJabatan()}</b>
                </p>

                <Button
                  size="sm"
                  onClick={handlePromote}
                  disabled={saveLoading}
                  style={{
                    background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                    border: 'none',
                    borderRadius: 8,
                  }}
                >
                  {saveLoading ? 'Memproses...' : `⬆ Naik ke ${getNextJabatan()}`}
                </Button>
              </div>
            ) : (
              <div className="mt-3 p-3" style={{ background: '#f0fff4', borderRadius: 12 }}>
                <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
                  Tidak ada aksi promosi
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* ABSENSI */}
      <Card className="p-4 shadow-sm" style={{ borderRadius: 16, border: 'none' }}>
        <h5 style={{ color: '#ff3d7f' }}>Log Absensi</h5>

        <Table hover className="mt-3 align-middle">
          <thead style={{ background: '#ffe4ec' }}>
            <tr>
              <th>Tanggal</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attendance.length > 0 ? (
              attendance.map((a, i) => (
                <tr key={i}>
                  <td>{a.date}</td>
                  <td>{renderStatus(a.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center text-muted">
                  Belum ada data absensi
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

    </div>
  );
}