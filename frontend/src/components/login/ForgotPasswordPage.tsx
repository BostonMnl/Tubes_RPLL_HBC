import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email harus diisi!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengirim email reset password');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan, silahkan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{
        background: 'linear-gradient(135deg, #ffe4ec, #ffd1dc)',
      }}
    >
      <Card
        className="shadow-lg border-0"
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '20px',
        }}
      >
        <Card.Body className="p-4 p-md-5">
          {/* Back button */}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#d63384',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Kembali ke Login
          </button>

          <h3
            className="text-center fw-bold mb-2"
            style={{ color: '#d63384' }}
          >
            Lupa Password
          </h3>
          <p className="text-center text-muted mb-4" style={{ fontSize: '14px' }}>
            Masukkan email Anda dan kami akan mengirimkan token reset password.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          {success ? (
            <Alert variant="success">
              <strong>Email terkirim!</strong>
              <br />
              Silahkan cek email Anda untuk mendapatkan token reset password.
              <br />
              <button
                onClick={() => navigate('/reset-password')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0d6efd',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '8px',
                  textDecoration: 'underline',
                  fontSize: '14px',
                }}
              >
                Lanjut ke halaman reset password →
              </button>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{ borderRadius: '10px' }}
                />
              </Form.Group>

              <Button
                size="lg"
                className="w-100 border-0"
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#d63384',
                  borderRadius: '10px',
                }}
              >
                {loading ? 'Mengirim...' : 'Kirim Token Reset'}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}