import {
  Card,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert
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

  // ✅ Add modal
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(defaultForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [preview, setPreview] = useState('');

  // ✅ Detail modal
  const [selected, setSelected] = useState<Reimburse | null>(null);

  const fetchReimburse = async () => {
    try {
      setLoading(true);
      const res = await reimburseServices.getAllReimburse();
      const all: Reimburse[] = res.data?.reimburse || res || [];
      // ✅ Filter hanya milik user yang login
      const mine = all.filter(r => r.user_id === user?.user_id);
      setData(mine);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimburse();
  }, []);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  const display = (val: any) => (val ? val : '-');

  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="warning" text="dark">Pending</Badge>;
  };

  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAddForm(prev => ({ ...prev, gambar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.nominal || !addForm.tanggal || !addForm.keterangan) {
      setAddError('Nominal, tanggal, dan keterangan wajib diisi');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      const formData = new FormData();
      formData.append('user_id', user?.user_id ?? '');
      formData.append('nominal', addForm.nominal);
      formData.append('tanggal', addForm.tanggal);
      formData.append('keterangan', addForm.keterangan);
      if (addForm.gambar) formData.append('gambar', addForm.gambar, addForm.gambar.name);

    //   await reimburseServices.createReimburse(formData);
      await fetchReimburse();
      setAddModal(false);
      setAddForm(defaultForm);
      setPreview('');
    } catch (err: any) {
      setAddError(err.message || 'Gagal mengajukan reimburse');
    } finally {
      setAddLoading(false);
    }
  };

  // ✅ Hitung ringkasan
  const totalPending = data.filter(d => d.status?.toLowerCase() === 'pending').length;
  const totalApproved = data.filter(d => d.status?.toLowerCase() === 'approved').length;
  const totalRejected = data.filter(d => d.status?.toLowerCase() === 'rejected').length;
  const totalNominal = data
    .filter(d => d.status?.toLowerCase() === 'approved')
    .reduce((sum, d) => sum + d.nominal, 0);

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

      {/* ===== HEADER ===== */}
      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-1">Reimbursement</h3>
            <small>Pengajuan reimburse saya — {user?.nama}</small>
          </div>
          <Button
            onClick={() => { setAddModal(true); setAddError(''); }}
            style={{
              background: 'white',
              color: '#ff3d7f',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            + Ajukan Reimburse
          </Button>
        </div>
      </Card>

      {/* ===== RINGKASAN STATUS ===== */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Pending', value: totalPending, bg: '#fff4e0', color: '#c97c00', badge: 'warning' },
          { label: 'Approved', value: totalApproved, bg: '#eafff2', color: '#1a7a3c', badge: 'success' },
          { label: 'Rejected', value: totalRejected, bg: '#fff0f0', color: '#a32d2d', badge: 'danger' },
          { label: 'Total Dicairkan', value: formatRupiah(totalNominal), bg: '#fff0f5', color: '#ff3d7f', badge: null },
        ].map(({ label, value, bg, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <Card
              className="p-3 shadow-sm border-0 text-center h-100"
              style={{ borderRadius: 14, background: bg }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#8b5a6b', marginTop: 4 }}>{label}</div>
            </Card>
          </div>
        ))}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ===== LIST CARD — bukan tabel ===== */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
      ) : data.length === 0 ? (
        <Card className="p-4 text-center border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <p className="text-muted mb-2">Belum ada pengajuan reimburse</p>
          <Button
            size="sm"
            onClick={() => setAddModal(true)}
            style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', border: 'none', borderRadius: 8 }}
          >
            + Ajukan Sekarang
          </Button>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-3">
          {data.map(d => (
            <Card
              key={d.reimburse_id}
              className="shadow-sm border-0"
              style={{ borderRadius: 14, cursor: 'pointer' }}
              onClick={() => setSelected(d)}
            >
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start">

                  {/* KIRI */}
                  <div className="d-flex gap-3 align-items-center">
                    {/* Icon */}
                    <div
                      style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: '#fff0f3',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                      }}
                    >
                      🧾
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>
                        {display(d.keterangan)}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {display(d.tanggal)}
                      </div>
                    </div>
                  </div>

                  {/* KANAN */}
                  <div className="text-end">
                    <div style={{ fontWeight: 700, color: '#ff3d7f', fontSize: 15 }}>
                      {formatRupiah(d.nominal)}
                    </div>
                    <div className="mt-1">{renderStatus(d.status)}</div>
                  </div>

                </div>

                {/* Bukti gambar thumbnail kalau ada */}
                {d.gambar && (
                  <div className="mt-2">
                    <img
                      src={d.gambar.startsWith('http') ? d.gambar : `http://localhost:3000${d.gambar}`}
                      alt="bukti"
                      style={{
                        height: 60, borderRadius: 8,
                        objectFit: 'cover', border: '1px solid #ffe0e7',
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* ===== MODAL ADD ===== */}
      <Modal show={addModal} onHide={() => setAddModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>
            Ajukan Reimburse
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Nominal <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="number" name="nominal"
              placeholder="Contoh: 150000"
              value={addForm.nominal}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Tanggal <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="date" name="tanggal"
              value={addForm.tanggal}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Keterangan <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea" rows={3} name="keterangan"
              placeholder="Contoh: Pembelian alat tulis kantor"
              value={addForm.keterangan}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label style={{ fontSize: 13 }}>Bukti / Struk</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
          </Form.Group>

          {preview && (
            <div className="mt-2">
              <img
                src={preview} alt="preview bukti"
                style={{ width: '100%', borderRadius: 10, border: '1px solid #ffe0e7' }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #ffe3ec' }}>
          <Button
            onClick={handleAddSubmit}
            disabled={addLoading}
            style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', border: 'none' }}
          >
            {addLoading ? 'Menyimpan...' : 'Ajukan'}
          </Button>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Batal</Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL DETAIL ===== */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>
            Detail Reimburse
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div style={{ fontSize: 14 }}>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3"
                style={{ background: '#fff0f3', borderRadius: 12 }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ff3d7f' }}>
                    {formatRupiah(selected.nominal)}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>{display(selected.tanggal)}</div>
                </div>
                {renderStatus(selected.status)}
              </div>

              <p><b>Keterangan</b><br />{display(selected.keterangan)}</p>

              {selected.gambar && (
                <div className="mt-2">
                  <p className="mb-1"><b>Bukti</b></p>
                  <img
                    src={selected.gambar.startsWith('http') ? selected.gambar : `http://localhost:3000${selected.gambar}`}
                    alt="bukti"
                    style={{ width: '100%', borderRadius: 10, border: '1px solid #ffe0e7' }}
                  />
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelected(null)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}