import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';
import { qrGeneratorService } from '../services/apiServices';

export default function QRGeneratorCheckoutPage() {
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCheckoutQR = async () => {
    try {
      setError('');

      const res = await qrGeneratorService.getCheckoutQR();

      setQrValue(res.data.qr_);
    } catch (err: any) {
      console.error(err);
      setError('Belum Tersedia QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutQR();

    intervalRef.current = setInterval(() => {
      fetchCheckoutQR();
    }, 10000);

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
          background: 'linear-gradient(135deg, #6fa8ff, #3d7fff)',
          color: 'white'
        }}
      >
        <h3 className="mb-1">QR Checkout Attendance</h3>
        <small>QR khusus untuk absensi keluar (auto refresh tiap 10 detik)</small>
      </Card>

      <Card className="shadow-sm border-0 p-4 text-center" style={{ borderRadius: 16 }}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Row>
          <Col>

            <h5 style={{ color: '#3d7fff' }}>QR Absensi Keluar</h5>

            <div className="mb-3">
              <Badge bg="primary">CHECKOUT</Badge>
            </div>

            {loading && !qrValue ? (
              <Spinner animation="border" />
            ) : qrValue ? (
              <>
                <QRCodeCanvas
                  value={qrValue}
                  size={260}
                  bgColor="#ffffff"
                  fgColor="#3d7fff"
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