import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Row,
  Col,
  Spinner,
  Alert
} from 'react-bootstrap';
import { useState, useEffect } from 'react';
import type { Reimburse } from '../../model/Reimburse';
import { reimburseServices } from '../../services/apiServices';

export default function ReimbursePage() {
  const [data, setData] = useState<Reimburse[]>([]);
  const [selected, setSelected] = useState<Reimburse | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================
  // FETCH DATA
  // =========================
  const fetchReimburse = async () => {
    try {
      setLoading(true);
      const res = await reimburseServices.getAllReimburse();
      console.log(res)
      setData(res.data.reimburse || res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimburse();
  }, []);

  // =========================
  // FORMAT
  // =========================
  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(num);

  const display = (val: any) => (val ? val : '-');

  // =========================
  // UPDATE STATUS (API)
  // =========================
  const updateStatus = async (id: string, status: string) => {
    try {
      await reimburseServices.updateReimburseStatus(id, status);
      await fetchReimburse(); // refresh data
    } catch (err) {
      alert('Gagal update status');
    }
  };

  const approve = (id: string) => updateStatus(id, 'approved');
  const reject = (id: string) => updateStatus(id, 'rejected');

  // =========================
  // DELETE (optional local)
  // =========================
  const remove = (id: string) => {
    if (confirm('Yakin hapus data?')) {
      setData(prev => prev.filter(d => d.reimburse_id !== id));
    }
  };

  // =========================
  // EDIT HANDLER
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!selected) return;

    setSelected({
      ...selected,
      [e.target.name]:
        e.target.name === 'nominal'
          ? Number(e.target.value)
          : e.target.value
    });
  };

  const saveEdit = () => {
    if (!selected) return;

    setData(prev =>
      prev.map(d =>
        d.reimburse_id === selected.reimburse_id ? selected : d
      )
    );
    setEditMode(false);
  };

  // =========================
  // STATUS BADGE
  // =========================
  const renderStatus = (status: string) => {
    if (status === 'approved') return <Badge bg="success">Approved</Badge>;
    if (status === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return (
      <Badge bg="warning" text="dark">
        Pending
      </Badge>
    );
  };

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>
      
      {/* HEADER */}
      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white'
        }}
      >
        <h3 className="mb-1">Reimbursement</h3>
        <small>Manage employee reimbursements</small>
      </Card>

      {/* ERROR */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* TABLE */}
      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <h5 className="mb-3" style={{ color: '#ff3d7f' }}>
          Reimbursement List
        </h5>

        {loading ? (
          <div className="text-center py-5">
            <Spinner />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table hover className="align-middle">
              <thead style={{ background: '#ffe4ec' }}>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Keterangan</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {data.map(d => (
                  <tr key={d.reimburse_id}>
                    <td>{d.reimburse_id}</td>
                    <td>{d.user_id}</td>
                    <td>{display(d.keterangan)}</td>

                    <td style={{ color: '#ff3d7f', fontWeight: 600 }}>
                      {formatRupiah(d.nominal)}
                    </td>

                    <td>{renderStatus(d.status)}</td>

                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end flex-wrap">
                        <Button
                          size="sm"
                          style={{ background: '#ffc0cb', border: 'none' }}
                          onClick={() => setSelected(d)}
                        >
                          Detail
                        </Button>

                        <Button
                          size="sm"
                          variant="success"
                          disabled={d.status === 'approved'}
                          onClick={() => approve(d.reimburse_id)}
                        >
                          ✔
                        </Button>

                        <Button
                          size="sm"
                          variant="warning"
                          disabled={d.status === 'rejected'}
                          onClick={() => reject(d.reimburse_id)}
                        >
                          ✖
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => remove(d.reimburse_id)}
                        >
                          🗑
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* MODAL */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton style={{ background: '#fff0f5' }}>
          <Modal.Title style={{ color: '#ff3d7f' }}>
            Detail Reimbursement
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selected && !editMode && (
            <Row>
              <Col md={6}>
                <p><b>User</b><br />{display(selected.user_id)}</p>
                <p><b>Tanggal</b><br />{display(selected.tanggal)}</p>
                <p><b>Status</b><br />{renderStatus(selected.status)}</p>
              </Col>

              <Col md={6}>
                <p><b>Nominal</b><br />
                  <span style={{ color: '#ff3d7f', fontWeight: 600 }}>
                    {formatRupiah(selected.nominal)}
                  </span>
                </p>
                <p><b>Keterangan</b><br />{display(selected.keterangan)}</p>
              </Col>

              {selected.gambar && (
                <Col md={12}>
                  <img
                    src={selected.gambar}
                    alt="bukti"
                    className="mt-3"
                    style={{ width: '100%', borderRadius: 12 }}
                  />
                </Col>
              )}
            </Row>
          )}

          {selected && editMode && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Keterangan</Form.Label>
                <Form.Control
                  name="keterangan"
                  value={selected.keterangan}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Nominal</Form.Label>
                <Form.Control
                  name="nominal"
                  type="number"
                  value={selected.nominal}
                  onChange={handleChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          {!editMode ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button variant="warning" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={saveEdit}>
                Save
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}