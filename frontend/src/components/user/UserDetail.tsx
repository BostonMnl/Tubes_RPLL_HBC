import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Table, Form, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import type { User } from '../../model/User';
import { userServices } from '../../services/apiServices';
import dummny from '../../../public/dummy.jpg';

type Props = {
  userId: string;
  goBack: () => void;
};

const defaultUser: User = {
  user_id: '',
  nama: '',
  alamat: '',
  tanggal_lahir: '',
  email: '',
  nomor_telepon: '',
  password: '',
  jabatan: 'staff',
  manager_id: '',
  gambar: '',
  role: 'staff',
  departemen: 'IT',
};

export default function UserDetail({ userId, goBack }: Props) {
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<User>(defaultUser);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ✅ State untuk modal reset password
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userServices.getUserById(userId);
      const userData = response.data.user || response;
      setForm(userData);
      setPreview(
        userData.gambar
          ? `http://localhost:3000${userData.gambar}`
          : dummny
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const attendance = [
    { date: '2026-04-20', status: 'Hadir' },
    { date: '2026-04-21', status: 'Telat' },
    { date: '2026-04-22', status: 'Cuti' },
  ];

  const display = (val: any) => (val ? val : '-');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError('');
    try {
      const formData = new FormData();
      formData.append('nama', form.nama ?? '');
      formData.append('email', form.email ?? '');
      formData.append('alamat', form.alamat ?? '');
      formData.append('tanggal_lahir', form.tanggal_lahir?.split('T')[0] ?? '');
      formData.append('nomor_telepon', form.nomor_telepon ?? '');
      formData.append('jabatan', form.jabatan ?? '');
      formData.append('role', form.role ?? '');
      formData.append('departemen', form.departemen ?? '');
      formData.append('manager_id', form.manager_id ?? '');
      if (imageFile) formData.append('gambar', imageFile, imageFile.name);

      await userServices.updateUser(userId, formData);
      setIsEdit(false);
      setImageFile(null);
      alert('Data user berhasil diperbarui!');
      await fetchUserData();
    } catch (err: any) {
      setSaveError(err.message || 'Gagal memperbarui user');
    } finally {
      setSaveLoading(false);
    }
  };

  // ✅ Handle reset password — kirim { newPassword } sesuai backend
  const handleResetPassword = async () => {
    setResetError('');

    if (!newPassword) {
      setResetError('Password baru wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Konfirmasi password tidak cocok');
      return;
    }

    setResetLoading(true);
    try {
      await userServices.resetPassword(userId, { newPassword });

      // Tutup modal dan reset form
      setShowResetModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setResetError('');
      alert(`Password ${form.nama} berhasil direset!`);
    } catch (err: any) {
      setResetError(err.message || 'Gagal mereset password');
    } finally {
      setResetLoading(false);
    }
  };

  // ✅ Tutup modal dan bersihkan state
  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setShowPassword(false);
  };

  const renderStatus = (status: string) => {
    if (status === 'Hadir') return <Badge bg="success">Hadir</Badge>;
    if (status === 'Telat') return <Badge bg="warning" text="dark">Telat</Badge>;
    return <Badge bg="danger">Cuti</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
        <p>Loading data user...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-danger text-center py-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={goBack}>← Back</Button>
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

          {/* ===== LEFT ===== */}
          <Col md={4} className="text-center border-end">
            <img
              src={preview || 'https://via.placeholder.com/150'}
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

            <div className="d-flex flex-column gap-2 mt-3 px-3">
              {/* Tombol Edit */}
              <Button
                size="sm"
                onClick={() => setIsEdit(!isEdit)}
                style={{
                  background: isEdit ? '#ccc' : 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                  border: 'none',
                }}
              >
                {isEdit ? 'Cancel Edit' : '✏️ Edit'}
              </Button>

              {/* ✅ Tombol Reset Password */}
              <Button
                size="sm"
                onClick={() => setShowResetModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #f7971e, #ffd200)',
                  border: 'none',
                  color: '#333',
                  fontWeight: 500,
                }}
              >
                🔑 Reset Password
              </Button>
            </div>
          </Col>

          {/* ===== RIGHT ===== */}
          <Col md={8}>
            <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
              Informasi User
            </h5>

            {!isEdit ? (
              <Row>
                <Col md={6}>
                  <p><b>Email</b><br />{display(form.email)}</p>
                  <p><b>Nomor Telp</b><br />{display(form.nomor_telepon)}</p>
                  <p><b>Tanggal Lahir</b><br />{form.tanggal_lahir?.split('T')[0] || '-'}</p>
                </Col>
                <Col md={6}>
                  <p><b>Alamat</b><br />{display(form.alamat)}</p>
                  <p><b>Departemen</b><br />{display(form.departemen)}</p>
                  <p><b>Role</b><br />{display(form.role)}</p>
                </Col>
              </Row>
            ) : (
              <Form>
                {saveError && <Alert variant="danger">{saveError}</Alert>}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nama</Form.Label>
                      <Form.Control name="nama" value={form.nama} onChange={handleChange} />
                    </Form.Group>
                    {/* <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control name="email" value={form.email} onChange={handleChange} />
                    </Form.Group> */}
                    <Form.Group className="mb-3">
                      <Form.Label>Nomor Telepon</Form.Label>
                      <Form.Control name="nomor_telepon" value={form.nomor_telepon || ''} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Tanggal Lahir</Form.Label>
                      <Form.Control
                        type="date"
                        name="tanggal_lahir"
                        value={form.tanggal_lahir ? form.tanggal_lahir.split('T')[0] : ''}
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Foto Profil</Form.Label>
                      <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Alamat</Form.Label>
                      <Form.Control name="alamat" value={form.alamat || ''} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Jabatan</Form.Label>
                      <Form.Select name="jabatan" value={form.jabatan} onChange={handleChange}>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="supervisor">Supervisor</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Departemen</Form.Label>
                      <Form.Select name="departemen" value={form.departemen} onChange={handleChange}>
                        <option value="SALES">Sales</option>
                        <option value="IT">IT</option>
                        <option value="FINANCE">Finance</option>
                        <option value="PURCHASE">Purchase</option>
                      </Form.Select>
                    </Form.Group>

                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saveLoading}
                    style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', border: 'none' }}
                  >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEdit(false)}>
                    Cancel
                  </Button>
                </div>
              </Form>
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
            {attendance.map((a, i) => (
              <tr key={i}>
                <td>{a.date}</td>
                <td>{renderStatus(a.status)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* ===== MODAL RESET PASSWORD ===== */}
      <Modal show={showResetModal} onHide={handleCloseResetModal} centered>
        <Modal.Header
          closeButton
          style={{ background: '#fff0f5', borderBottom: '1px solid #ffe0e7' }}
        >
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>
            🔑 Reset Password — {form.nama}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {resetError && <Alert variant="danger">{resetError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Password Baru</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password baru"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <Button
                variant="outline-secondary"
                style={{ whiteSpace: 'nowrap', fontSize: 13 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈 Hide' : '👁 Show'}
              </Button>
            </div>
            <Form.Text className="text-muted">Minimal 6 karakter</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Konfirmasi Password</Form.Label>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer style={{ borderTop: '1px solid #ffe0e7' }}>
          <Button
            onClick={handleResetPassword}
            disabled={resetLoading}
            style={{
              background: 'linear-gradient(135deg, #f7971e, #ffd200)',
              border: 'none',
              color: '#333',
              fontWeight: 500,
            }}
          >
            {resetLoading ? 'Memproses...' : '🔑 Reset Password'}
          </Button>
          <Button variant="secondary" onClick={handleCloseResetModal}>
            Batal
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}