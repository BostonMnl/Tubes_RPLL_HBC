import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { userServices } from '../services/apiServices';
import type { User } from '../model/User';
import { decodeToken, getToken } from '../utils/tokenManager';
import dummny from '../../public/dummy.jpg';

export default function MyProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<Partial<User>>({});
  const [preview, setPreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null); // ← NEW: simpan file asli
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;

    const fetchProfile = async () => {
      let userId = user?.user_id || (user as any)?.id;

      if (!userId) {
        const token = getToken();
        if (token) {
          const decoded = decodeToken(token);
          userId = decoded?.id;
        }
      }

      if (!userId) {
        setError('ID User tidak ditemukan. Silakan login ulang.');
        setLoading(false);
        return;
      }

      try {
        const response = await userServices.getMyProfile();
        const userData = response.data || response;

        setForm(userData.user);
        setAttendance(userData.attendance);
        setPreview(
          userData.user?.gambar
            ? `http://localhost:3000${userData.user.gambar}`
            : dummny
        );
      } catch (err: any) {
        setError(err.message || 'Gagal memuat profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ← FIXED: simpan File asli, bukan blob URL ke form state
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);                        // simpan File binary
      setPreview(URL.createObjectURL(file));     // preview pakai blob URL (hanya untuk tampilan)
    }
  };

  // ← FIXED: kirim pakai FormData agar bisa upload file
  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('nama', form.nama ?? '');
      formData.append('email', form.email ?? '');
      formData.append('alamat', form.alamat ?? '');
      formData.append('nomor_telepon', form.nomor_telepon ?? '');

      if (imageFile) {
        formData.append('gambar', imageFile);   // kirim file binary ke server
      }

      const response = await userServices.updateMe(formData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        setForm(prev => ({ ...prev, ...updatedUser }));
        setPreview(
          updatedUser.gambar
            ? `http://localhost:3000${updatedUser.gambar}`
            : dummny
        );
        setImageFile(null); // reset file setelah berhasil save
      }

      setIsEdit(false);
      alert('Profil berhasil diperbarui!');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEdit(false);
    setImageFile(null);
    // kembalikan preview ke gambar dari server
    setPreview(
      form.gambar
        ? `http://localhost:3000${form.gambar}`
        : dummny
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Memuat profil...</p>
      </div>
    );
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case 'Hadir':
        return <Badge bg="success">Hadir</Badge>;
      case 'Telat':
        return <Badge bg="warning" text="dark">Telat</Badge>;
      case 'Alpha':
        return <Badge bg="danger">Alpha</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
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
          color: 'white'
        }}
      >
        <h3 className="mb-1">My Profile</h3>
        <small>Manage your personal information</small>
      </Card>

      {/* PROFILE CARD */}
      <Card className="shadow-sm border-0 p-4 mb-4" style={{ borderRadius: 16 }}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          {/* LEFT — Avatar & Info Singkat */}
          <Col md={4} className="text-center border-end">
            <img
              src={preview || dummny}
              alt="profile"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #ff3d7f'
              }}
            />

            {isEdit && (
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="mt-3"
              />
            )}

            <h5 className="fw-bold mt-3">{form.nama || '-'}</h5>

            <div className="d-flex justify-content-center gap-2 mt-2">
              {form.role && <Badge bg="danger">{form.role}</Badge>}
              {form.departemen && <Badge bg="secondary">{form.departemen}</Badge>}
            </div>

            <div className="text-muted small mt-2">
              <p className="mb-1">{form.email || '-'}</p>
              <p className="mb-1">{form.nomor_telepon || '-'}</p>
            </div>

            <Button
              size="sm"
              className="mt-3"
              onClick={() => isEdit ? handleCancelEdit() : setIsEdit(true)}
              style={{
                background: isEdit
                  ? '#ccc'
                  : 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                border: 'none',
                color: isEdit ? '#333' : 'white'
              }}
            >
              {isEdit ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Col>

          {/* RIGHT — Detail / Form Edit */}
          <Col md={8}>
            <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
              Profile Information
            </h5>

            {!isEdit ? (
              <Row>
                <Col md={6}>
                  <p><b>Full Name</b><br />{form.nama || '-'}</p>
                  <p><b>Email</b><br />{form.email || '-'}</p>
                </Col>
                <Col md={6}>
                  <p><b>Phone</b><br />{form.nomor_telepon || '-'}</p>
                  <p><b>Address</b><br />{form.alamat || '-'}</p>
                </Col>
              </Row>
            ) : (
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        name="nama"
                        value={form.nama || ''}
                        onChange={handleChange}
                        disabled
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        name="email"
                        type="email"
                        value={form.email || ''}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        name="nomor_telepon"
                        value={form.nomor_telepon || ''}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        name="alamat"
                        value={form.alamat || ''}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                    border: 'none'
                  }}
                >
                  {saving ? <><Spinner size="sm" animation="border" className="me-2" />Saving...</> : 'Save Changes'}
                </Button>
              </Form>
            )}
          </Col>
        </Row>
      </Card>

      {/* LOG ABSENSI */}
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