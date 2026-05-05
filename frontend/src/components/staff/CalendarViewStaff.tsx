import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, Modal, Button, Form, Badge, Alert, Spinner, Col } from 'react-bootstrap';
import { leaveServices } from '../../services/apiServices';

type LeaveRequest = {
  id: number;
  nama: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  keterangan: string;
  jenis_cuti?: string;
  status: string;
};

const defaultForm = {
  tanggal_mulai: '',
  tanggal_akhir: '',
  jenis_cuti: 'Cuti_Tahunan',
  keterangan: '',
};
interface LogActivity {
  _id: string;
  userId: string;
  code: number;
  message: string;
  createdAt: string;
}

const API_BASE = 'http://localhost:3000/api';

const fetchWithToken = (url: string) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function CalendarViewStaff() {
  const [allLeave, setAllLeave] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal calendar detail
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Modal request cuti
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(defaultForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [logs, setLogs] = useState<LogActivity[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);



  useEffect(() => {
    fetchLeaves();

    fetchWithToken(`${API_BASE}/log_activity/me`)
      .then((r) => r.json())
      .then((res) => setLogs(res.data?.logs || []))
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await leaveServices.getAllLeaves();
      const data = res.data?.cuti ?? [];
      const mapped: LeaveRequest[] = data.map((item: any) => ({
        id: item.cuti_id,
        nama: item.nama || item.user?.nama || '-',
        tanggal_mulai: item.tanggal_mulai,
        tanggal_akhir: item.tanggal_akhir,
        keterangan: item.keterangan,
        jenis_cuti: item.jenis_cuti,
        status: item.status,
      }));
      setAllLeave(mapped);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const leaveEvents = allLeave.map(item => ({
    title: `${item.nama}`,
    start: item.tanggal_mulai,
    end: item.tanggal_akhir,
    color:
      item.status.toLowerCase() === 'approved' ? '#28a745' :
        item.status.toLowerCase() === 'rejected' ? '#dc3545' : '#ff6b9d',
    extendedProps: {
      nama: item.nama,
      keterangan: item.keterangan,
      status: item.status,
      jenis_cuti: item.jenis_cuti,
    },
  }));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return '#22c55e';
    if (code >= 400 && code < 500) return '#f97316';
    return '#ef4444';
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setAddForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddSubmit = async () => {
    if (!addForm.tanggal_mulai || !addForm.tanggal_akhir || !addForm.keterangan) {
      setAddError('Semua field wajib diisi');
      return;
    }
    if (addForm.tanggal_akhir < addForm.tanggal_mulai) {
      setAddError('Tanggal akhir tidak boleh sebelum tanggal mulai');
      return;
    }

    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    try {
      await leaveServices.requestLeave({
        tanggal_mulai: addForm.tanggal_mulai,
        tanggal_akhir: addForm.tanggal_akhir,
        jenis_cuti: addForm.jenis_cuti,
        keterangan: addForm.keterangan,
      });
      setAddSuccess('Pengajuan cuti berhasil dikirim! Menunggu persetujuan.');
      setAddForm(defaultForm);
      await fetchLeaves();
      setTimeout(() => {
        setAddModal(false);
        setAddSuccess('');
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'Gagal mengajukan cuti');
    } finally {
      setAddLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'pending') return <Badge bg="warning" text="dark">Pending</Badge>;
    return <Badge bg="danger">Rejected</Badge>;
  };

  const renderJenisCuti = (jenis?: string) =>
    jenis ? jenis.replace(/_/g, ' ') : '-';

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>

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
            <h3 className="mb-1">Calendar Cuti</h3>
            <small>Lihat jadwal cuti karyawan & ajukan cuti kamu</small>
          </div>
          <Button
            onClick={() => { setAddModal(true); setAddError(''); setAddSuccess(''); }}
            style={{
              background: 'white',
              color: '#ff3d7f',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            + Ajukan Cuti
          </Button>
        </div>
      </Card>

      {/* ===== LEGEND ===== */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        {[
          { color: '#ff6b9d', label: 'Pending' },
          { color: '#28a745', label: 'Approved' },
          { color: '#dc3545', label: 'Rejected' },
        ].map(({ color, label }) => (
          <div key={label} className="d-flex align-items-center gap-2">
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 13, color: '#8b5a6b' }}>{label}</span>
          </div>
        ))}
      </div>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      {/* ===== CALENDAR ===== */}
      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
          Jadwal Cuti Karyawan
        </h5>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={leaveEvents}
            eventClick={handleEventClick}
            height="580px"
            eventDisplay="block"
            dayMaxEvents={3}
          />
        )}
      </Card>

      {/* ===== MODAL DETAIL CALENDAR ===== */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>
            Detail Cuti
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <div style={{ fontSize: 14 }}>
              <div
                className="p-3 mb-3 rounded"
                style={{ background: '#fff0f3' }}
              >
                <div style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>
                  {selectedEvent.extendedProps.nama}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  {renderJenisCuti(selectedEvent.extendedProps.jenis_cuti)}
                </div>
              </div>
              <p><b>Tanggal Mulai:</b> {selectedEvent.startStr}</p>
              <p><b>Keterangan:</b> {selectedEvent.extendedProps.keterangan || '-'}</p>
              <p className="mb-0">
                <b>Status:</b> {renderStatus(selectedEvent.extendedProps.status)}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL AJUKAN CUTI ===== */}
      <Modal show={addModal} onHide={() => setAddModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>
            Ajukan Cuti
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}
          {addSuccess && <Alert variant="success">{addSuccess}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>Jenis Cuti</Form.Label>
            <Form.Select
              name="jenis_cuti"
              value={addForm.jenis_cuti}
              onChange={handleAddChange}
            >
              <option value="Cuti_Tahunan">Cuti Tahunan</option>
              <option value="Cuti_Sakit">Cuti Sakit</option>
              <option value="Cuti_Melahirkan">Cuti Melahirkan</option>
              <option value="Cuti_Lainnya">Cuti Lainnya</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Cuti Tahunan, Sakit, dan Melahirkan termasuk cuti berbayar.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>
              Tanggal Mulai <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              name="tanggal_mulai"
              value={addForm.tanggal_mulai}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>
              Tanggal Akhir <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="date"
              name="tanggal_akhir"
              value={addForm.tanggal_akhir}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: 13 }}>
              Keterangan <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="keterangan"
              placeholder="Alasan pengajuan cuti..."
              value={addForm.keterangan}
              onChange={handleAddChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #ffe3ec' }}>
          <Button
            onClick={handleAddSubmit}
            disabled={addLoading}
            style={{
              background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
              border: 'none',
            }}
          >
            {addLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
          </Button>
          <Button variant="secondary" onClick={() => setAddModal(false)}>
            Batal
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Activity Log */}
      <Col md={5}>
        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span style={{ fontSize: 20 }}>📋</span>
              <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Log Aktivitas</h5>
            </div>

            {loadingLogs ? (
              <div className="text-center py-4">
                <Spinner animation="border" style={{ color: '#ff3d7f' }} />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-muted text-center py-4">Belum ada aktivitas.</p>
            ) : (
              <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {logs.map((log) => (
                  <div
                    key={log._id}
                    className="mb-2 p-3"
                    style={{
                      borderRadius: 12,
                      background: '#fff8fb',
                      borderLeft: `4px solid ${getCodeColor(log.code)}`,
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <span
                        className="fw-semibold"
                        style={{ fontSize: 12, color: getCodeColor(log.code) }}
                      >
                        {log.code}
                      </span>
                      <span className="text-muted" style={{ fontSize: 10 }}>
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>

    </div>
  );
}