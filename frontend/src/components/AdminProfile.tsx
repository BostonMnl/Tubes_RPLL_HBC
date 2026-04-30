import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { userServices } from '../services/apiServices';
import type { User } from '../model/User';
import { decodeToken, getToken } from '../utils/tokenManager';

export default function AdminProfile() {
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

    if (!userId) {
      setError('ID User tidak ditemukan. Silakan login ulang.');
      setLoading(false); 
      return;
    }

    try {
      const res = await userServices.getUserById(userId);
      const userData = res.data || res;

      setForm(userData.user || userData);
      setPreview(userData.user.gambar || '');
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
    const userId = user?.user_id || (user as any)?.id;
    if (!userId) return;

    setSaving(true);
    setError('');
    try {
      await userServices.updateUser(userId, form);
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
    <div className="p-4">
      <Card className="shadow border-0 rounded-4 p-4">
        {error && <Alert variant="danger">{error}</Alert>}
        <Row>
          <Col md={4} className="text-center border-end">
            <div className="position-relative mb-3">
              <img
                src={preview || form.gambar || 'https://via.placeholder.com/150'}
                alt="profile"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #ff6b9d'
                }}
              />

              {/* Upload button */}
              {isEdit && (
                <Form.Control
                  type="file"
                  onChange={handleImage}
                  className="mt-3"
                />
              )}
            </div>

            <h5 className="fw-bold">{form.nama}</h5>
            <Badge bg="primary" className="mb-2">{form.role}</Badge>

            <div className="text-muted small">
              <p className="mb-1">{form.email}</p>
              <p className="mb-1">{form.nomor_telepon}</p>
            </div>

            <Button
              variant={isEdit ? 'secondary' : 'warning'}
              size="sm"
              className="mt-2"
              onClick={() => setIsEdit(!isEdit)}
            >
              {isEdit ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Col>

          {/* 🔥 RIGHT SIDE */}
          <Col md={8}>
            <h5 className="mb-3 fw-semibold">Profile Information</h5>

            {!isEdit ? (
              <Row>
                <Col md={6}>
                  <p><b>Full Name</b><br />{form.nama}</p>
                  <p><b>Email</b><br />{form.email}</p>
                </Col>
                <Col md={6}>
                  <p><b>Phone</b><br />{form.nomor_telepon}</p>
                  <p><b>Address</b><br />{form.alamat}</p>
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

                <Button variant="success" onClick={handleSave} disabled={saving}>
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