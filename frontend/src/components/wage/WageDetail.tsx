import { useEffect, useState } from 'react';
import {
  Card, Button, Row, Col, Badge,
  Spinner, Alert, Form, Table, Modal
} from 'react-bootstrap';
import { wageServices } from '../../services/apiServices';

type Employee = {
  user_id: string;
  name: string;
  role: string;
  jabatan: string;
  departemen: string;
};

type Gaji = {
  gaji_id: string;
  user_id: string;
  nominal: number;
  tanggal_berlaku: string;
};

type Props = {
  employee: Employee;
  currentUser: any;
  goBack: () => void;
};

export default function WageDetail({ employee, currentUser, goBack }: Props) {
  const [gajiList, setGajiList] = useState<Gaji[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEmpty, setIsEmpty] = useState(false);

  const [formData, setFormData] = useState({
    nominal: '',
    tanggal_berlaku: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ================= FETCH =================
  const fetchGaji = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setIsEmpty(false);

      const res = await wageServices.getGajiByUserId(employee.user_id);
      let data: Gaji[] = [];

      const gaji = res?.data?.gaji;
      if (gaji) {
        data = Array.isArray(gaji) ? gaji : [gaji];
      }

      if (data.length === 0) {
        setIsEmpty(true);
        return;
      }

      data.sort(
        (a, b) =>
          new Date(a.tanggal_berlaku).getTime() -
          new Date(b.tanggal_berlaku).getTime()
      );

      setGajiList(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsEmpty(true);
      } else {
        setErrorMsg('Gagal mengambil data gaji');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaji();
  }, [employee.user_id]);

  // ================= PERMISSION =================
  const canAdd = (): boolean => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') return true;

    if (currentUser.jabatan === 'manager') {
      return employee.jabatan === 'staff';
    }

    if (currentUser.jabatan === 'supervisor') {
      return (
        employee.user_id === currentUser.user_id ||
        employee.jabatan === 'staff' ||
        employee.jabatan === 'manager'
      );
    }

    return false;
  };

  // ================= ADD =================
  const handleAdd = async () => {
    if (!formData.nominal || !formData.tanggal_berlaku) {
      alert('Semua field wajib diisi');
      return;
    }

    try {
      setSubmitting(true);

      await wageServices.createGaji({
        user_id: employee.user_id,
        nominal: Number(formData.nominal),
        tanggal_berlaku: formData.tanggal_berlaku,
      });

      setFormData({ nominal: '', tanggal_berlaku: '' });
      setShowModal(false);
      fetchGaji();

    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ================= CALC =================
  const total = gajiList.reduce((a, b) => a + b.nominal, 0);
  const avg = gajiList.length ? Math.round(total / gajiList.length) : 0;

  // ================= UI =================
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #fff0f5, #ffe4ec)',
        minHeight: '100vh',
        padding: '24px'
      }}
    >
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-4">
        <Button variant="outline-secondary" onClick={goBack}>
          ← Kembali
        </Button>

        {canAdd() && (
          <Button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
              border: 'none',
              borderRadius: '12px'
            }}
          >
            + Tambah Gaji
          </Button>
        )}
      </div>

      {/* PROFILE */}
      <Card
        className="p-4 mb-4 shadow-sm border-0"
        style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white'
        }}
      >
        <h3>{employee.name}</h3>
        <div className="mt-1">
          <Badge bg="light" text="dark">{employee.role}</Badge>
          <Badge bg="dark" className="ms-2">{employee.jabatan}</Badge>
          <Badge bg="light" text="dark" className="ms-2">{employee.departemen}</Badge>
        </div>
      </Card>

      {/* LOADING */}
      {loading && (
        <div className="text-center">
          <Spinner />
        </div>
      )}

      {/* ERROR */}
      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {/* EMPTY */}
      {!loading && isEmpty && (
        <Alert variant="warning" className="text-center">
          Belum ada data gaji
        </Alert>
      )}

      {/* DATA */}
      {!loading && !isEmpty && (
        <>
          <Row className="mb-4 g-3">
            <Col md={6}>
              <Card className="p-3 text-center shadow-sm border-0">
                <small className="text-muted">Total Gaji</small>
                <h4 style={{ color: '#ff3d7f' }}>
                  Rp {total.toLocaleString('id-ID')}
                </h4>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="p-3 text-center shadow-sm border-0">
                <small className="text-muted">Rata-rata</small>
                <h4 style={{ color: '#ff3d7f' }}>
                  Rp {avg.toLocaleString('id-ID')}
                </h4>
              </Card>
            </Col>
          </Row>

          <Card className="p-3 shadow-sm border-0">
            <h5 style={{ color: '#ff3d7f' }}>Riwayat Gaji</h5>

            <Table hover responsive>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal Berlaku</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {gajiList.map((g, i) => (
                  <tr key={g.gaji_id}>
                    <td>{i + 1}</td>
                    <td>
                      {new Date(g.tanggal_berlaku).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      Rp {g.nominal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {/* MODAL ADD */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Gaji</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nominal</Form.Label>
              <Form.Control
                type="number"
                placeholder="Contoh: 4500000"
                value={formData.nominal}
                onChange={(e) =>
                  setFormData({ ...formData, nominal: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Tanggal Berlaku</Form.Label>
              <Form.Control
                type="date"
                value={formData.tanggal_berlaku}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal_berlaku: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>

          <Button
            style={{
              background: '#ff3d7f',
              border: 'none'
            }}
            onClick={handleAdd}
            disabled={submitting}
          >
            {submitting ? <Spinner size="sm" /> : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}