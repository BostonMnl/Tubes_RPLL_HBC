import {
  Card,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert,
} from 'react-bootstrap';

import { useState, useEffect } from 'react';

import type { Reimburse } from '../../model/Reimburse';
import { reimburseServices } from '../../services/apiServices';
import { useAuth } from '../../context/AuthContext';

const defaultForm = {
  nominal: '',
  tanggal: '',
  keterangan: '',
  gambar: null as File | null,
};

export default function ReimburseStaff() {
  const { user } = useAuth();

  const [data, setData] = useState<Reimburse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [selected, setSelected] = useState<Reimburse | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [preview, setPreview] = useState('');
  const [addForm, setAddForm] = useState(defaultForm);

  useEffect(() => {
    fetchMyReimburse();
  }, []);

  const fetchMyReimburse = async () => {
    try {
      setLoading(true);
      const res = await reimburseServices.getMyReimburse();
      setData(res.data?.reimburse || []);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  const display = (value: any) => value || '-';

  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="warning" text="dark">Pending</Badge>;
  };

  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAddForm((prev) => ({ ...prev, gambar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setAddModal(false);
    setAddForm(defaultForm);
    setPreview('');
    setAddError('');
  };

  const handleAddSubmit = async () => {
    if (!addForm.nominal || !addForm.tanggal || !addForm.keterangan) {
      setAddError('Nominal, tanggal, dan keterangan wajib diisi');
      return;
    }
    try {
      setAddLoading(true);
      setAddError('');
      const formData = new FormData();
      formData.append('nominal', addForm.nominal);
      formData.append('tanggal', addForm.tanggal);
      formData.append('keterangan', addForm.keterangan);
      if (addForm.gambar) formData.append('gambar', addForm.gambar);
      await reimburseServices.requestReimburse(formData);
      resetForm();
      fetchMyReimburse();
    } catch (err: any) {
      setAddError(err.message || 'Gagal mengajukan reimburse');
    } finally {
      setAddLoading(false);
    }
  };

  const totalPending = data.filter((i) => i.status?.toLowerCase() === 'pending').length;
  const totalApproved = data.filter((i) => i.status?.toLowerCase() === 'approved').length;
  const totalRejected = data.filter((i) => i.status?.toLowerCase() === 'rejected').length;
  const totalNominal = data
    .filter((i) => i.status?.toLowerCase() === 'approved')
    .reduce((sum, i) => sum + i.nominal, 0);

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

      {/* ── HEADER ── */}
      <Card
        className="p-4 mb-4 border-0 shadow-sm"
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg,#ff6fa5,#ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-0">Reimbursement</h3>
            <small>{user?.nama}</small>
          </div>
          <Button
            variant="light"
            onClick={() => setAddModal(true)}
          >
            + Ajukan
          </Button>
        </div>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ── SUMMARY CARDS ── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Pending', value: totalPending },
          { label: 'Approved', value: totalApproved },
          { label: 'Rejected', value: totalRejected },
          { label: 'Dicairkan', value: formatRupiah(totalNominal) },
        ].map((item) => (
          <div key={item.label} className="col-md-3">
            <Card className="p-3 text-center border-0 shadow-sm">
              <h4>{item.value}</h4>
              <small>{item.label}</small>
            </Card>
          </div>
        ))}
      </div>

      {/* ── LIST ── */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#ff3d7f' }} />
        </div>
      ) : data.length === 0 ? (
        <Card className="p-4 border-0 shadow-sm text-center">
          <p className="text-muted mb-0">Belum ada pengajuan.</p>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {data.map((item) => (
            <Card
              key={item.reimburse_id}
              className="border-0 shadow-sm"
              style={{ cursor: 'pointer', borderRadius: '12px' }}
              onClick={() => setSelected(item)}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{display(item.keterangan)}</div>
                    <small className="text-muted">
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold">{formatRupiah(item.nominal)}</div>
                    <div className="mt-1">{renderStatus(item.status)}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* ── MODAL: ADD REQUEST ── */}
      <Modal show={addModal} onHide={resetForm} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>+ Pengajuan Saya</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Nominal (IDR)</Form.Label>
            <Form.Control
              type="number"
              name="nominal"
              min={0}
              placeholder="Contoh: 150000"
              value={addForm.nominal}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tanggal</Form.Label>
            <Form.Control
              type="date"
              name="tanggal"
              value={addForm.tanggal}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Keterangan</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="keterangan"
              placeholder="Deskripsi pengeluaran..."
              value={addForm.keterangan}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Bukti (foto)</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
          </Form.Group>

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-3"
              style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 200 }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetForm} disabled={addLoading}>
            Batal
          </Button>
          <Button
            style={{ background: '#ff3d7f', border: 'none' }}
            onClick={handleAddSubmit}
            disabled={addLoading}
          >
            {addLoading ? <Spinner size="sm" animation="border" /> : 'Ajukan'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── MODAL: DETAIL ── */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>Detail Reimburse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <table className="table table-borderless table-sm">
                <tbody>
                  <tr>
                    <th style={{ width: '35%' }}>Nominal</th>
                    <td>{formatRupiah(selected.nominal)}</td>
                  </tr>
                  <tr>
                    <th>Tanggal</th>
                    <td>
                      {selected.tanggal
                        ? new Date(selected.tanggal).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{renderStatus(selected.status)}</td>
                  </tr>
                  <tr>
                    <th>Keterangan</th>
                    <td>{display(selected.keterangan)}</td>
                  </tr>
                </tbody>
              </table>
              {selected.gambar && (
                <img
                  src={`http://localhost:3000${selected.gambar}`}
                  alt="bukti"
                  style={{ width: '100%', borderRadius: 12 }}
                />
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}