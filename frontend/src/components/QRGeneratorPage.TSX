import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';
import { qrGeneratorService } from '../services/apiServices';

export default function QRGeneratorPage() {
  const [hours, setHours] = useState(23);
  const [minutes, setMinutes] = useState(10);

  const [qrValue, setQrValue] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const formatTime = () => {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // 🔄 GET QR tiap interval
  const fetchQR = async () => {
    try {
      const res = await qrGeneratorService.getQR();

      // ⚠️ Sesuaikan dengan backend kamu
      setQrValue(res.data.qr_token);
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengambil QR');
    }
  };

  // ▶️ START
  const startGenerator = async () => {
    setError('');
      console.log('🔥 START CLICKED');
    // VALIDASI
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setError('Jam / menit tidak valid');
      return;
    }

    try {
      setLoading(true);
      
      const time = formatTime();

      // 1️⃣ POST ke backend
      const res = await qrGeneratorService.recordStart(time);

      const token = res.data.qr_token;

      // tampilkan QR pertama
      setQrValue(token);

      setIsRunning(true);

      // 2️⃣ loop tiap 10 detik
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

  // cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
        <h3 className="mb-1">QR Attendance Generator</h3>
        <small>Generate QR dari server setiap 10 detik</small>
      </Card>

      <Card className="shadow-sm border-0 p-4" style={{ borderRadius: 16 }}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          {/* LEFT */}
          <Col md={4} className="border-end">
            <h5 style={{ color: '#ff3d7f' }}>Set Start Time</h5>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Jam</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>

              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Menit</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Preview */}
            <p className="text-muted small">
              Time: {formatTime()}
            </p>

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