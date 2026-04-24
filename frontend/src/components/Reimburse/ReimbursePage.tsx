import { Card, Table, Button, Modal, Form, Badge, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import type { Reimburse } from '../../model/Reimburse';

export default function ReimbursePage() {
  const [data, setData] = useState<Reimburse[]>([
    {
      reimburse_id: 'R001',
      user_id: 'U001',
      keterangan: 'Transport',
      nominal: 200000,
      gambar: '',
      status: 'pending',
      tanggal: '2026-04-24'
    }
  ]);

  const [selected, setSelected] = useState<Reimburse | null>(null);
  const [editMode, setEditMode] = useState(false);

  // 🔥 FORMAT RUPIAH
  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(num);

  // 🔥 HANDLE EMPTY
  const display = (val: any) => (val ? val : '-');

  // APPROVE
  const approve = (id: string) => {
    setData(prev =>
      prev.map(d =>
        d.reimburse_id === id ? { ...d, status: 'approved' } : d
      )
    );
  };

  // REJECT
  const reject = (id: string) => {
    setData(prev =>
      prev.map(d =>
        d.reimburse_id === id ? { ...d, status: 'rejected' } : d
      )
    );
  };

  // DELETE
  const remove = (id: string) => {
    if (confirm('Yakin hapus data?')) {
      setData(prev => prev.filter(d => d.reimburse_id !== id));
    }
  };

  // EDIT
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

  const renderStatus = (status: string) => {
    if (status === 'approved') return <Badge bg="success">Approved</Badge>;
    if (status === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="warning">Pending</Badge>;
  };

  return (
    <Card className="p-4 shadow border-0 rounded-4">
      <h4 className="fw-semibold">Reimbursement</h4>

      <Table hover responsive className="mt-3 align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Keterangan</th>
            <th>Nominal</th>
            <th>Status</th>
            <th style={{ width: '260px' }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map(d => (
            <tr key={d.reimburse_id}>
              <td>{d.reimburse_id}</td>
              <td>{d.user_id}</td>
              <td>{display(d.keterangan)}</td>
              <td className="fw-semibold text-success">
                {formatRupiah(d.nominal)}
              </td>
              <td>{renderStatus(d.status)}</td>

              <td>
                <div className="d-flex gap-2 flex-wrap">
                  <Button size="sm" variant="info" onClick={() => setSelected(d)}>
                    Detail
                  </Button>

                  <Button
                    size="sm"
                    variant="success"
                    disabled={d.status === 'approved'}
                    onClick={() => approve(d.reimburse_id)}
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="warning"
                    disabled={d.status === 'rejected'}
                    onClick={() => reject(d.reimburse_id)}
                  >
                    Reject
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => remove(d.reimburse_id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* 🔥 MODAL */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detail Reimbursement</Modal.Title>
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
                  <span className="text-success fw-bold">
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
                    style={{ width: '100%', borderRadius: 10 }}
                  />
                </Col>
              )}
            </Row>
          )}

          {/* EDIT MODE */}
          {selected && editMode && (
            <Form>
              <Form.Group className="mb-2">
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
    </Card>
  );
}