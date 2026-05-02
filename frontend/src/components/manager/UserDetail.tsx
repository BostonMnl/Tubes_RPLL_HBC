import { useState } from 'react';
import { Card, Button, Row, Col, Table, Badge, Alert } from 'react-bootstrap';
import dummny from '../../../public/dummy.jpg';

type Props = {
  userId: string;
  goBack: () => void;
  onPromoteSuccess?: () => void;
};

// ✅ Data dummy per user
const dummyUsers: Record<string, any> = {
  '1': {
    user_id: '1',
    nama: 'Budi Santoso',
    email: 'budi@company.com',
    nomor_telepon: '08111111111',
    tanggal_lahir: '1995-03-15',
    alamat: 'Jl. Mawar No. 10, Bandung',
    jabatan: 'staff',
    departemen: 'IT',
    role: 'staff',
    manager_id: '',
    gambar: '',
  },
  '2': {
    user_id: '2',
    nama: 'Siti Rahayu',
    email: 'siti@company.com',
    nomor_telepon: '08222222222',
    tanggal_lahir: '1997-07-20',
    alamat: 'Jl. Melati No. 5, Jakarta',
    jabatan: 'staff',
    departemen: 'IT',
    role: 'staff',
    manager_id: '',
    gambar: '',
  },
  '3': {
    user_id: '3',
    nama: 'Andi Wijaya',
    email: 'andi@company.com',
    nomor_telepon: '08333333333',
    tanggal_lahir: '1990-11-02',
    alamat: 'Jl. Kenanga No. 8, Surabaya',
    jabatan: 'supervisor',
    departemen: 'IT',
    role: 'staff',
    manager_id: '',
    gambar: '',
  },
  '4': {
    user_id: '4',
    nama: 'Dewi Lestari',
    email: 'dewi@company.com',
    nomor_telepon: '08444444444',
    tanggal_lahir: '1998-01-30',
    alamat: 'Jl. Anggrek No. 3, Medan',
    jabatan: 'staff',
    departemen: 'IT',
    role: 'staff',
    manager_id: '',
    gambar: '',
  },
  '5': {
    user_id: '5',
    nama: 'Rizky Pratama',
    email: 'rizky@company.com',
    nomor_telepon: '08555555555',
    tanggal_lahir: '1996-06-12',
    alamat: 'Jl. Dahlia No. 7, Yogyakarta',
    jabatan: 'staff',
    departemen: 'IT',
    role: 'staff',
    manager_id: '',
    gambar: '',
  },
};

const dummyAttendance = [
  { date: '2026-04-20', status: 'Hadir' },
  { date: '2026-04-21', status: 'Telat' },
  { date: '2026-04-22', status: 'Hadir' },
  { date: '2026-04-23', status: 'Cuti' },
  { date: '2026-04-24', status: 'Hadir' },
];

export default function UserDetail({ userId, goBack, onPromoteSuccess }: Props) {
  // ✅ Ambil dari dummy, bukan dari API
  const [form, setForm] = useState(dummyUsers[userId] ?? {
    nama: 'Unknown',
    email: '-',
    nomor_telepon: '-',
    tanggal_lahir: '',
    alamat: '-',
    jabatan: 'staff',
    departemen: '-',
    role: '-',
    gambar: '',
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const display = (val: any) => (val ? val : '-');

  const preview = form.gambar
    ? `http://localhost:3000${form.gambar}`
    : dummny;

  // ✅ Promote dummy — update state lokal saja, tanpa API
  const handlePromote = async () => {
    if (!window.confirm(`Yakin ingin menaikkan jabatan ${form.nama} menjadi Manager?`)) return;

    setSaveLoading(true);
    setSaveError('');
    try {
      // Simulasi delay seperti API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update state lokal
      setForm((prev: any) => ({ ...prev, jabatan: 'manager' }));

      // Update juga data dummy global supaya kalau balik ke list, badge ikut berubah
      if (dummyUsers[userId]) {
        dummyUsers[userId].jabatan = 'manager';
      }

      alert(`${form.nama} berhasil dinaikkan menjadi Manager!`);
      onPromoteSuccess?.();
    } catch (err: any) {
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

          {/* ===== LEFT ===== */}
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

            <h5 className="mt-3 fw-bold">{display(form.nama)}</h5>

            <div className="d-flex justify-content-center gap-2 mt-2">
              <Badge bg="danger">{display(form.jabatan)}</Badge>
              <Badge bg="secondary">{display(form.departemen)}</Badge>
            </div>
          </Col>

          {/* ===== RIGHT ===== */}
          <Col md={8}>
            <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
              Informasi User
            </h5>

            <Row>
              <Col md={6}>
                <p><b>Email</b><br />{display(form.email)}</p>
                <p><b>Nomor Telp</b><br />{display(form.nomor_telepon)}</p>
                <p><b>Tanggal Lahir</b><br />{form.tanggal_lahir || '-'}</p>
              </Col>
              <Col md={6}>
                <p><b>Alamat</b><br />{display(form.alamat)}</p>
                <p><b>Departemen</b><br />{display(form.departemen)}</p>
                <p><b>Role</b><br />{display(form.role)}</p>
              </Col>
            </Row>

            {/* ===== PROMOTE SECTION ===== */}
            {saveError && <Alert variant="danger">{saveError}</Alert>}

            {form.jabatan === 'staff' ? (
              <div className="mt-3 p-3" style={{ background: '#fff0f3', borderRadius: 12 }}>
                <p className="mb-1 fw-semibold" style={{ color: '#ff3d7f' }}>
                  Promosi Jabatan
                </p>
                <p className="mb-3 text-muted" style={{ fontSize: 13 }}>
                  Naikkan jabatan <b>{form.nama}</b> dari <b>Staff</b> ke Manager
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
                  Jabatan <b>{form.nama}</b> sudah <b>{form.jabatan}</b> — tidak perlu dipromosikan.
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* ===== LOG ABSENSI ===== */}
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
            {dummyAttendance.map((a, i) => (
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