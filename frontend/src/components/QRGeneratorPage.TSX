import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';
import { qrGeneratorService } from '../services/apiServices';

export default function QRGeneratorPage() {
  const [qrValue, setQrValue] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🔄 GET QR
  const fetchQR = async () => {
    try {
      const res = await qrGeneratorService.getQR();
      setQrValue(res.data.qr_token);
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengambil QR');
    }
  };

  // ▶️ START (langsung generate tanpa input)
  const startGenerator = async () => {
    setError('');

    try {
      setLoading(true);

      // 1️⃣ trigger backend start (tanpa time)
      const res = await qrGeneratorService.recordStart(); // <- ubah backend kalau perlu

      setQrValue(res.data.qr_token);

      setIsRunning(true);

      // 2️⃣ interval refresh QR
      intervalRef.current = setInterval(() => {
        fetchQR();
      }, 10000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memulai QR');
    } finally {
      setLoading(false);
    }
  };

  // ⛔ STOP
  const stopGenerator = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>

      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white'
        }}
      >
        <h3 className="mb-1">QR Attendance Generator</h3>
        <small>Auto generate QR setiap 10 detik</small>
      </Card>

      <Card className="shadow-sm border-0 p-4" style={{ borderRadius: 16 }}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>

          {/* LEFT */}
          <Col md={4} className="border-end">
            <h5 style={{ color: '#ff3d7f' }}>Control</h5>

            <div className="d-flex gap-2">
              <Button
                onClick={startGenerator}
                disabled={isRunning || loading}
                style={{
                  background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                  border: 'none'
                }}
              >
                {loading ? 'Starting...' : 'Start'}
              </Button>

              <Button variant="secondary" onClick={stopGenerator}>
                Stop
              </Button>
            </div>

            <div className="mt-3">
              Status:{' '}
              <Badge bg={isRunning ? 'success' : 'secondary'}>
                {isRunning ? 'Running' : 'Stopped'}
              </Badge>
            </div>
          </Col>

          {/* RIGHT */}
          <Col md={8} className="text-center">
            <h5 style={{ color: '#ff3d7f' }}>QR Code</h5>

            {loading && !qrValue ? (
              <Spinner animation="border" />
            ) : qrValue ? (
              <>
                <QRCodeCanvas
                  value={qrValue}
                  size={250}
                  bgColor="#ffffff"
                  fgColor="#ff3d7f"
                />

                <p className="mt-3 small text-muted">
                  {qrValue}
                </p>
              </>
            ) : (
              <p className="text-muted">QR belum tersedia</p>
            )}
          </Col>

        </Row>
      </Card>
    </div>
  );
}