import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { userServices } from '../services/apiServices';
import type { User } from '../model/User';
import { decodeToken, getToken } from '../utils/tokenManager';
import dummny from '../../public/dummy.jpg'


export default function MyProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<Partial<User>>({});
  const [preview, setPreview] = useState<string>('');

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
      console.log(userId);

      if (!userId) {
        setError('ID User tidak ditemukan. Silakan login ulang.');
        setLoading(false);
        return;
      }

      try {
        const response = await userServices.getMyProfile();
        const userData = response.data?.user || response.data || response;

        setForm(userData);
        setPreview(
          userData.gambar
            ? `http://localhost:3000${userData.gambar}`
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

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPreview(url);
      setForm({ ...form, gambar: url });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Payload hanya field yang diterima API PATCH /me
      const payload = {
        nama: form.nama ?? '',
        email: form.email ?? '',
        alamat: form.alamat ?? null,
        nomor_telepon: form.nomor_telepon ?? null,
        gambar: form.gambar ?? null,
      } as Partial<User>;


      // PATCH /me — tidak perlu userId karena backend ambil dari token
      const response = await userServices.updateMe(payload);
      const updatedUser = response.data?.user;

      // Update form dengan data terbaru dari server
      if (updatedUser) {
        setForm(prev => ({ ...prev, ...updatedUser }));
        setPreview(
          updatedUser.gambar
            ? `http://localhost:3000${updatedUser.gambar}`
            : dummny
        );
      }

      setIsEdit(false);
      alert('Profil berhasil diperbarui!');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Memuat profil...</p>
      </div>
    );
  }

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

      <Card className="shadow-sm border-0 p-4" style={{ borderRadius: 16 }}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          {/* LEFT */}
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
                onChange={handleImage}
                className="mt-3"
              />
            )}

            <h5 className="fw-bold mt-3">{form.nama}</h5>

            <div className="d-flex justify-content-center gap-2 mt-2">
              <Badge bg="danger">{form.role}</Badge>
              <Badge bg="secondary">{form.departemen}</Badge>
            </div>

            <div className="text-muted small mt-2">
              <p className="mb-1">{form.email}</p>
              <p className="mb-1">{form.nomor_telepon}</p>
            </div>

            <Button
              size="sm"
              className="mt-3"
              onClick={() => setIsEdit(!isEdit)}
              style={{
                background: isEdit
                  ? '#ccc'
                  : 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                border: 'none'
              }}
            >
              {isEdit ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Col>

          {/* RIGHT */}
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
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        name="email"
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
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Form>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
}