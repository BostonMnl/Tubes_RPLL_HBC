import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import dummny from '../../../public/dummy.jpg';
import { userServices } from '../../services/apiServices';

type Props = {
  userId: string;
  goBack: () => void;
  onPromoteSuccess?: () => void;
};

export default function UserDetail({ userId, goBack, onPromoteSuccess }: Props) {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const display = (val: any) => (val ? val : '-');

  // 🔥 FETCH USER BY ID
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await userServices.getUserByIdManagerial(userId);

        const userData = res.data?.user ?? res.user ?? res;

        setForm(userData);
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

  // 🔥 PROMOTE (masih lokal / bisa diganti API)
  const handlePromote = async () => {
    if (!window.confirm(`Yakin ingin menaikkan jabatan ${form?.nama} menjadi Manager?`)) return;

    setSaveLoading(true);
    setSaveError('');

    try {
      // kalau sudah ada API:
      // await userServices.promoteUser(userId);

      await new Promise(resolve => setTimeout(resolve, 800));

      setForm((prev: any) => ({ ...prev, jabatan: 'manager' }));

      onPromoteSuccess?.();
      alert(`${form?.nama} berhasil dinaikkan menjadi Manager!`);
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

  // 🔥 LOADING UI
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
                <p><b>Tanggal Lahir</b><br />{display(form?.tanggal_lahir)}</p>
              </Col>
              <Col md={6}>
                <p><b>Alamat</b><br />{display(form?.alamat)}</p>
                <p><b>Departemen</b><br />{display(form?.departemen)}</p>
                <p><b>Role</b><br />{display(form?.role)}</p>
              </Col>
            </Row>

            {saveError && <Alert variant="danger">{saveError}</Alert>}

            {/* PROMOTE */}
            {form?.jabatan === 'staff' ? (
              <div className="mt-3 p-3" style={{ background: '#fff0f3', borderRadius: 12 }}>
                <p className="mb-1 fw-semibold" style={{ color: '#ff3d7f' }}>
                  Promosi Jabatan
                </p>
                <p className="mb-3 text-muted" style={{ fontSize: 13 }}>
                  Naikkan jabatan <b>{form?.nama}</b> ke Manager
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
                  {saveLoading ? 'Memproses...' : '⬆ Naikkan ke Manager'}
                </Button>
              </div>
            ) : (
              <div className="mt-3 p-3" style={{ background: '#f0fff4', borderRadius: 12 }}>
                <p className="mb-0 text-muted" style={{ fontSize: 13 }}>
                  Jabatan sudah <b>{form?.jabatan}</b>
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* ABSENSI (dummy tetap boleh) */}
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
            {[
              { date: '2026-04-20', status: 'Hadir' },
              { date: '2026-04-21', status: 'Telat' },
              { date: '2026-04-22', status: 'Hadir' },
            ].map((a, i) => (
              <tr key={i}>
                <td>{a.date}</td>
                <td>{renderStatus(a.status)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

    </div>
  );
}