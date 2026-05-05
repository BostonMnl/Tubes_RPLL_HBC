import {
  Card,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal,
  Button,
} from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { pinaltiServices } from '../../services/apiServices';

interface Penalti {
  penalti_id: string;
  jenis: string;
  keterangan: string;
  nominal: number;
  tanggal: string;
  gambar: string | null;
  user_id: string;
  payroll_id: string | null;
  createdAt: string;
  user?: {
    nama: string;
    jabatan: string;
  };
}

export default function PenaltiStaffPage() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.user_id || currentUser?.id;

  const [myData, setMyData] = useState<Penalti[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Penalti | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await pinaltiServices.getMyPinalti();
      const all: Penalti[] = res.data?.penalti || res.data || [];
      // Only show own penalties
      setMyData(all.filter((x) => x.user_id === currentUserId));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data penalti');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);

  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  const renderStatus = (payroll_id: string | null) =>
    payroll_id
      ? <Badge bg="secondary">🔒 Locked</Badge>
      : <Badge bg="warning" text="dark">Active</Badge>;

  const totalNominal = myData.reduce((sum, item) => sum + (item.nominal || 0), 0);

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <Card
        className="p-4 mb-4 border-0 shadow-sm"
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="mb-0">Penalti Saya</h3>
            <small>Riwayat potongan &amp; penalti yang dikenakan</small>
          </div>
          <div
            className="text-end"
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '10px 18px',
            }}
          >
            <div style={{ fontSize: '12px', opacity: 0.85 }}>Total Penalti</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatRupiah(totalNominal)}</div>
          </div>
        </div>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary cards */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        <Card
          className="border-0 shadow-sm flex-fill text-center"
          style={{ borderRadius: '14px', padding: '16px' }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff3d7f' }}>{myData.length}</div>
          <div style={{ fontSize: '13px', color: '#888' }}>Total Penalti</div>
        </Card>
        <Card
          className="border-0 shadow-sm flex-fill text-center"
          style={{ borderRadius: '14px', padding: '16px' }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
            {myData.filter((x) => !x.payroll_id).length}
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>Belum Diproses</div>
        </Card>
        <Card
          className="border-0 shadow-sm flex-fill text-center"
          style={{ borderRadius: '14px', padding: '16px' }}
        >
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#6b7280' }}>
            {myData.filter((x) => !!x.payroll_id).length}
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>Sudah Dipotong</div>
        </Card>
      </div>

      {/* Table */}
      <Card className="p-4 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <h5 className="mb-3 fw-bold" style={{ color: '#ff3d7f' }}>Riwayat Penalti</h5>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#ff3d7f' }} />
          </div>
        ) : myData.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '48px' }}>🎉</div>
            <p className="text-muted mt-2">Belum ada penalti untuk Anda.</p>
          </div>
        ) : (
          <Table hover responsive>
            <thead>
              <tr style={{ background: '#fff0f5' }}>
                <th>#</th>
                <th>Jenis</th>
                <th>Nominal</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {myData.map((item, idx) => (
                <tr key={item.penalti_id} style={{ opacity: item.payroll_id ? 0.7 : 1 }}>
                  <td>{idx + 1}</td>
                  <td>
                    <span
                      style={{
                        background: '#fff0f5',
                        color: '#ff3d7f',
                        borderRadius: '8px',
                        padding: '2px 10px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {item.jenis}
                    </span>
                  </td>
                  <td className="fw-semibold text-danger">{formatRupiah(item.nominal)}</td>
                  <td>{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.keterangan || '-'}
                  </td>
                  <td>{renderStatus(item.payroll_id)}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      style={{ borderRadius: '8px' }}
                      onClick={() => setSelected(item)}
                    >
                      Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#fff0f5', fontWeight: 700 }}>
                <td colSpan={2} className="text-end">Total</td>
                <td className="text-danger">{formatRupiah(totalNominal)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header
          closeButton
          style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', color: 'white' }}
        >
          <Modal.Title>Detail Penalti</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <table className="table table-borderless table-sm">
                <tbody>
                  <tr>
                    <th style={{ width: '35%', color: '#888' }}>Jenis</th>
                    <td className="fw-semibold">{selected.jenis}</td>
                  </tr>
                  <tr>
                    <th style={{ color: '#888' }}>Nominal</th>
                    <td className="fw-bold text-danger">{formatRupiah(selected.nominal)}</td>
                  </tr>
                  <tr>
                    <th style={{ color: '#888' }}>Tanggal</th>
                    <td>{formatDate(selected.tanggal)}</td>
                  </tr>
                  <tr>
                    <th style={{ color: '#888' }}>Keterangan</th>
                    <td>{selected.keterangan || '-'}</td>
                  </tr>
                  <tr>
                    <th style={{ color: '#888' }}>Status</th>
                    <td>{renderStatus(selected.payroll_id)}</td>
                  </tr>
                  {selected.payroll_id && (
                    <tr>
                      <th style={{ color: '#888' }}>Info</th>
                      <td>
                        <small className="text-muted">
                          Penalti ini sudah diproses dalam payroll dan tidak dapat diubah.
                        </small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {selected.gambar && (
                <div className="mt-3">
                  <p className="text-muted mb-1" style={{ fontSize: '13px' }}>Bukti Foto</p>
                  <img
                    src={`http://localhost:3000${selected.gambar.startsWith('/') ? '' : '/'}${selected.gambar}`}
                    alt="bukti"
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      border: '1px solid #ffd1dc',
                      objectFit: 'cover',
                      maxHeight: '260px',
                    }}
                  />
                </div>
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