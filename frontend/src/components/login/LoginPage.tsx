import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user.jabatan === 'manager') {
      navigate('/manager', { replace: true });
    } else {
      setError('Akun tidak dikenali');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email dan password harus diisi!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // jangan navigate di sini (biar useEffect yang handle)
    } catch (err: any) {
      setError(err.message || 'Login gagal, silahkan cek email dan password');
    } finally {
      setLoading(false);
    }
  };

  console.log("USER LOGIN:", user);
  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body className="p-4 p-md-5">
          <h3 className="text-center fw-bold mb-4">Login</h3>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Button
              variant="primary"
              size="lg"
              className="w-100"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}