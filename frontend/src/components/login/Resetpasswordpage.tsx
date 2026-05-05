import { useState } from 'react';
import { Container, Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !newPassword || !confirmPassword) {
      setError('Semua field harus diisi!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok!');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mereset password');
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
          maxWidth: '420px',
          borderRadius: '20px',
        }}
      >
        <Card.Body className="p-4 p-md-5">
          {/* Back button */}
          <button
            onClick={() => navigate('/forgot-password')}
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
            ← Kembali
          </button>

          <h3
            className="text-center fw-bold mb-2"
            style={{ color: '#d63384' }}
          >
            Reset Password
          </h3>
          <p className="text-center text-muted mb-4" style={{ fontSize: '14px' }}>
            Masukkan token yang dikirim ke email Anda beserta password baru.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          {success ? (
            <Alert variant="success">
              <strong>Password berhasil direset!</strong>
              <br />
              Silahkan login menggunakan password baru Anda.
              <br />
              <Button
                variant="link"
                onClick={() => navigate('/')}
                style={{
                  color: '#d63384',
                  padding: 0,
                  marginTop: '8px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Pergi ke halaman Login →
              </Button>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              {/* Token field */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Token Reset</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Masukkan token dari email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                  style={{ borderRadius: '10px', letterSpacing: '2px' }}
                />
                <Form.Text className="text-muted" style={{ fontSize: '12px' }}>
                  Cek folder inbox atau spam email Anda.
                </Form.Text>
              </Form.Group>

              {/* New password field */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Password Baru</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    style={{
                      borderRadius: '10px 0 0 10px',
                      borderRight: 'none',
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      borderRadius: '0 10px 10px 0',
                      borderLeft: 'none',
                      background: 'white',
                      color: '#6c757d',
                      fontSize: '13px',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </Button>
                </InputGroup>
              </Form.Group>

              {/* Confirm password field */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Konfirmasi Password</Form.Label>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    borderRadius: '10px',
                    borderColor:
                      confirmPassword && newPassword !== confirmPassword
                        ? '#dc3545'
                        : undefined,
                  }}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <Form.Text style={{ color: '#dc3545', fontSize: '12px' }}>
                    Password tidak cocok
                  </Form.Text>
                )}
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
                {loading ? 'Menyimpan...' : 'Reset Password'}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}