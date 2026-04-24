import { useState } from 'react';
import { Card, Row, Col, Form, Button, Badge } from 'react-bootstrap';

type Admin = {
  name: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  image: string;
};

export default function AdminProfile() {
  const [isEdit, setIsEdit] = useState(false);

  const [form, setForm] = useState<Admin>({
    name: 'Sarah Johnson',
    email: 'sarah@mail.com',
    role: 'Admin',
    phone: '08123456789',
    address: 'Jakarta, Indonesia',
    image: ''
  });

  const [preview, setPreview] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPreview(url);
      setForm({ ...form, image: url });
    }
  };

  const handleSave = () => {
    console.log('SAVE ADMIN:', form);
    setIsEdit(false);
  };

  return (
    <div className="p-4">
      <Card className="shadow border-0 rounded-4 p-4">
        <Row>
          {/* 🔥 LEFT SIDE */}
          <Col md={4} className="text-center border-end">
            <div className="position-relative mb-3">
              <img
                src={preview || form.image || 'https://via.placeholder.com/150'}
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

            <h5 className="fw-bold">{form.name}</h5>
            <Badge bg="primary" className="mb-2">{form.role}</Badge>

            <div className="text-muted small">
              <p className="mb-1">{form.email}</p>
              <p className="mb-1">{form.phone}</p>
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
                  <p><b>Full Name</b><br />{form.name}</p>
                  <p><b>Email</b><br />{form.email}</p>
                </Col>
                <Col md={6}>
                  <p><b>Phone</b><br />{form.phone}</p>
                  <p><b>Address</b><br />{form.address}</p>
                </Col>
              </Row>
            ) : (
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                      />
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
    </div>
  );
}