import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Table, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import type { User } from '../../model/User';
import { userServices } from '../../services/apiServices';

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

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userServices.getUserById(userId);
      const userData = response.data.user || response;
      setForm(userData);
      setPreview(userData.gambar || '');
      console.log(response.data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data user');
      console.error('Error fetching user:', err);
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
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
const [imageFile, setImageFile] = useState<File | null>(null);

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    setImageFile(file); // simpan file asli
    setPreview(URL.createObjectURL(file));
  }
};
const handleSave = async () => {
  setSaveLoading(true);
  setSaveError('');

  try {
    const formData = new FormData();

    formData.append('nama', form.nama);
    formData.append('email', form.email);
    formData.append('alamat', form.alamat);
    formData.append('tanggal_lahir', form.tanggal_lahir);
    formData.append('nomor_telepon', form.nomor_telepon);
    formData.append('jabatan', form.jabatan);
    formData.append('role', form.role);
    formData.append('departemen', form.departemen);
    formData.append('manager_id',form.manager_id);
    console.log(form.manager_id)

    if (imageFile) {
      formData.append('gambar', imageFile);
    }

    await userServices.updateUser(userId, formData);

    setIsEdit(false);
    alert('Data user berhasil diperbarui!');
    await fetchUserData();

  } catch (err: any) {
    setSaveError(err.message || 'Gagal memperbarui user');
  } finally {
    setSaveLoading(false);
  }
};
  const renderStatus = (status: string) => {
    if (status === 'Hadir') return <Badge bg="success">Hadir</Badge>;
    if (status === 'Telat') return <Badge bg="warning">Telat</Badge>;
    return <Badge bg="danger">Cuti</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="mb-2" />
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
    <div>
      <Button className="mb-3" onClick={goBack}>
        ← Back
      </Button>

      {/* 🔥 PROFILE CARD */}
      <Card className="p-4 shadow border-0 rounded-4 mb-4">
        <Row>
          {/* LEFT */}
          <Col md={4} className="text-center border-end">
            <img
              src={preview || 'https://via.placeholder.com/150'}
              alt="profile"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #ff6b9d'
              }}
            />

            {isEdit && (
              <Form.Control
                type="file"
                className="mt-3"
                onChange={handleImageChange}
              />
            )}

            <h5 className="mt-3 fw-bold">{display(form.nama)}</h5>
            <Badge bg="primary">{display(form.jabatan)}</Badge>
            <div className="text-muted small"></div>
            <Button
              variant={isEdit ? 'secondary' : 'warning'}
              size="sm"
              className="mt-3"
              onClick={() => setIsEdit(!isEdit)}
            >
              {isEdit ? 'Cancel' : 'Edit'}
            </Button>
          </Col>

          {/* RIGHT */}
          <Col md={8}>
            <h5 className="mb-3 fw-semibold">Informasi User</h5>

            {!isEdit ? (
              <Row>
                <Col md={6}>
                  <p><b>User ID</b><br />{display(userId)}</p>
                  <p><b>Email</b><br />{display(form.email)}</p>
                  <p><b>Nomor Telp</b><br />{display(form.nomor_telepon)}</p>
                  <p>
                    <b>Tanggal Lahir</b><br />
                    {form.tanggal_lahir ? form.tanggal_lahir.split('T')[0] : '-'}
                  </p>

                </Col>
                <Col md={6}>
                  <p><b>Alamat</b><br />{display(form.alamat)}</p>
                  <p><b>Departemen</b><br />{display(form.departemen)}</p>
                  <p><b>Role</b><br />{display(form.role)}</p>
                </Col>
              </Row>
            ) : (
              <Form>
                {saveError && <Alert variant="danger" className="mb-3">{saveError}</Alert>}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nama</Form.Label>
                      <Form.Control name="nama" value={form.nama} onChange={handleChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control name="email" value={form.email} onChange={handleChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Nomor Telepon</Form.Label>
                      <Form.Control name="nomor_telepon" value={form.nomor_telepon || ''} onChange={handleChange} />
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
                  <Button variant="success" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="secondary" onClick={() => { setIsEdit(false); setSaveError(''); }}>
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Col>
        </Row>
      </Card>

      {/* 🔥 ABSENSI */}
      <Card className="p-4 shadow border-0 rounded-4">
        <h5 className="fw-semibold">Log Absensi</h5>

        <Table hover responsive className="mt-3 align-middle">
          <thead className="table-dark">
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
    </div>
  );
}