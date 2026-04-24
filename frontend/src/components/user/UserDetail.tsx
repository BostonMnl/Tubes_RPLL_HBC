import { useState } from 'react';
import { Card, Button, Row, Col, Table, Form, Badge } from 'react-bootstrap';
import type { User } from '../../model/User';

type Props = {
  user: User;
  goBack: () => void;
};

export default function UserDetail({ user, goBack }: Props) {
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<User>(user);
  const [preview, setPreview] = useState<string>(user.gambar);

  const attendance = [
    { date: '2026-04-20', status: 'Hadir' },
    { date: '2026-04-21', status: 'Telat' },
    { date: '2026-04-22', status: 'Cuti' },
  ];

  // 🔥 helper biar kosong jadi "-"
  const display = (val: any) => (val ? val : '-');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);

      setPreview(imageUrl);
      setForm({ ...form, gambar: imageUrl });
    }
  };

  const handleSave = () => {
    console.log('SAVE DATA:', form);
    setIsEdit(false);
  };

  const renderStatus = (status: string) => {
    if (status === 'Hadir') return <Badge bg="success">Hadir</Badge>;
    if (status === 'Telat') return <Badge bg="warning">Telat</Badge>;
    return <Badge bg="danger">Cuti</Badge>;
  };

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
                  <p><b>User ID</b><br />{display(form.user_id)}</p>
                  <p><b>Email</b><br />{display(form.email)}</p>
                  <p><b>Nomor Telp</b><br />{display(form.nomor_telepon)}</p>
                </Col>
                <Col md={6}>
                  <p><b>Alamat</b><br />{display(form.alamat)}</p>
                  <p><b>Departemen</b><br />{display(form.departemen)}</p>
                  <p><b>Manager ID</b><br />{display(form.manager_id)}</p>
                </Col>
              </Row>
            ) : (
              <Form>
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
                      <Form.Control name="alamat" value={form.alamat} onChange={handleChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Jabatan</Form.Label>
                      <Form.Control name="jabatan" value={form.jabatan} onChange={handleChange} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Departemen</Form.Label>
                      <Form.Control name="departemen" value={form.departemen} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="success" onClick={handleSave}>
                  Save Changes
                </Button>
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