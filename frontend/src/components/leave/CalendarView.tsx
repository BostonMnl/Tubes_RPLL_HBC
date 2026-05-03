import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, Modal, Button, Table, Badge, Form, Alert } from 'react-bootstrap';
import { leaveServices } from '../../services/apiServices';
import { getUser } from '../../utils/tokenManager';

type LeaveRequest = {
  id: number;
  nama: string;
  departemen?: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  keterangan: string;
  jenis_cuti?: string;
  status: 'pending' | 'approved' | 'rejected';
};

const defaultForm = {
  tanggal_mulai: '',
  tanggal_akhir: '',
  jenis_cuti: 'Cuti_Tahunan',
  keterangan: '',
};

export default function CalendarView() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LeaveRequest | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeave, setAllLeave] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(defaultForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');


  const user = getUser();


  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError('');

      const [res, res2] = await Promise.all([
        leaveServices.getReqAllLeaves(),
        leaveServices.getAllLeaves(),
      ]);

      const data = res.data?.cuti ?? [];
      const data2 = res2.data?.cuti ?? [];

      const mapItem = (item: any): LeaveRequest => ({
        id: item.cuti_id,
        nama: item.nama || item.user?.nama || '-',
        departemen: item.departemen || item.user?.departemen || '',
        tanggal_mulai: item.tanggal_mulai,
        tanggal_akhir: item.tanggal_akhir,
        keterangan: item.keterangan,
        jenis_cuti: item.jenis_cuti,
        status: item.status,
      });

      const mapped1 = data.map(mapItem);
      const mapped2 = data2.map(mapItem);

      let filtered1 = mapped1;
      let filtered2 = mapped2;

      if (user?.role !== 'admin') {
        const filterByRole = (items: LeaveRequest[]) => {
          const jabatan = user?.jabatan?.toLowerCase();

          if (jabatan === 'staff') {
            // Staff: hanya lihat data milik sendiri
            return items.filter(item => item.nama === user.nama);
          }

          if (jabatan === 'manager' || jabatan === 'supervisor') {
            // Manager/Supervisor: lihat data 1 departemen yang sama
            return items.filter(item => item.departemen === user.departemen);
          }

          // Fallback: tampilkan semua (misal role lain)
          return items;
        };

        filtered1 = filterByRole(mapped1);
        filtered2 = filterByRole(mapped2);
      }

      setLeaveRequests(filtered1);
      setAllLeave(filtered2);

    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calendar pakai allLeave (getAllLeaves)
  const leaveEvents = allLeave.map(item => ({
    title: `${item.nama} - ${item.jenis_cuti?.replace('_', ' ') ?? 'Cuti'}`,
    start: item.tanggal_mulai,
    end: item.tanggal_akhir,
    color:
      item.status.toLowerCase() === 'approved' ? '#28a745' :
        item.status.toLowerCase() === 'rejected' ? '#dc3545' : '#ff6b9d',
    extendedProps: {
      keterangan: item.keterangan,
      status: item.status,
      jenis_cuti: item.jenis_cuti,
      nama: item.nama,
    },
  }));

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  const handleDetail = (item: LeaveRequest) => {
    setSelectedRow(item);
    setTableModal(true);
  };

  // ✅ FIX: update KEDUA state sekaligus agar tabel bawah juga ikut berubah
  const updateStatus = (id: number, status: 'approved' | 'rejected') => {
    const updater = (prev: LeaveRequest[]) =>
      prev.map(item => item.id === id ? { ...item, status } : item);
    setLeaveRequests(updater);
    setAllLeave(updater);
  };

  const handleApprove = async (id: number) => {
    try {
      await leaveServices.updateLeaveStatus(id.toString(), 'Approved');
      updateStatus(id, 'approved');
    } catch {
      alert('Gagal approve');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await leaveServices.updateLeaveStatus(id.toString(), 'Rejected');
      updateStatus(id, 'rejected');
    } catch {
      alert('Gagal reject');
    }
  };

  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
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
    try {
      await leaveServices.requestLeave({
        tanggal_mulai: addForm.tanggal_mulai,
        tanggal_akhir: addForm.tanggal_akhir,
        jenis_cuti: addForm.jenis_cuti,
        keterangan: addForm.keterangan,
      });
      await fetchLeaves();
      setAddModal(false);
      setAddForm(defaultForm);
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan data');
    } finally {
      setAddLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'pending') return <Badge bg="warning" text="dark">Pending</Badge>;
    return <Badge bg="danger">Rejected</Badge>;
  };

  const renderJenisCuti = (jenis?: string) => {
    if (!jenis) return '-';
    return jenis.replace(/_/g, ' ');
  };

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
            <h3 className="mb-1">Leave Management</h3>
            <small>Monitor and manage employee leave requests</small>
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
            + Add Request
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
            <div style={{ width: 14, height: 14, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 13, color: '#8b5a6b' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ===== CALENDAR — pakai allLeave ===== */}
      <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
          Calendar Overview
        </h5>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={leaveEvents}
          eventClick={handleEventClick}
          height="580px"
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </Card>

      {/* ===== TABEL LEAVE REQUESTS (getReqAllLeaves) — ada approve/reject ===== */}
      <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Leave Requests</h5>
            <small className="text-muted">Pengajuan masuk — perlu persetujuan</small>
          </div>
          <Button
            size="sm"
            onClick={() => { setAddModal(true); setAddError(''); }}
            style={{
              background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            + Add Request
          </Button>
        </div>

        {loading && <p className="text-center text-muted py-3">Memuat data...</p>}
        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && (
          <Table hover responsive className="align-middle" style={{ fontSize: 13 }}>
            <thead style={{ background: '#ffe3ec' }}>
              <tr>
                <th>Nama</th>
                <th>Jenis Cuti</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th style={{ width: 280 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Belum ada pengajuan cuti
                  </td>
                </tr>
              ) : (
                leaveRequests.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.nama}</td>
                    <td>
                      <Badge style={{ background: '#fff0f3', color: '#ffffff', fontWeight: 500 }}>
                        {renderJenisCuti(item.jenis_cuti)}
                      </Badge>
                    </td>
                    <td>
                      <small>
                        {item.tanggal_mulai}<br />
                        <span className="text-muted">s/d</span> {item.tanggal_akhir}
                      </small>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <small className="text-muted">{item.keterangan}</small>
                    </td>
                    <td>{renderStatus(item.status)}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          style={{ background: '#0dcaf0', border: 'none', fontSize: 12 }}
                          onClick={() => handleDetail(item)}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          disabled={item.status.toLowerCase() === 'approved'}
                          onClick={() => handleApprove(item.id)}
                          style={{ background: '#28a745', border: 'none', fontSize: 12 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          disabled={item.status.toLowerCase() === 'rejected'}
                          onClick={() => handleReject(item.id)}
                          style={{ background: '#ffc107', border: 'none', color: '#000', fontSize: 12 }}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ===== TABEL STATUS REQUEST (getAllLeaves) — view only ===== */}
      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Status Request Leave</h5>
            <small className="text-muted">Semua data cuti karyawan</small>
          </div>
        </div>
        {loading && <p className="text-center text-muted py-3">Memuat data...</p>}
        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && (
          <Table hover responsive className="align-middle" style={{ fontSize: 13 }}>
            <thead style={{ background: '#ffe3ec' }}>
              <tr>
                <th>Nama</th>
                <th>Jenis Cuti</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allLeave.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Belum ada data cuti
                  </td>
                </tr>
              ) : (
                allLeave.map(item => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.nama}</td>
                    <td>
                      <Badge style={{ background: '#fff0f3', color: '#ffffff', fontWeight: 500 }}>
                        {renderJenisCuti(item.jenis_cuti)}
                      </Badge>
                    </td>
                    <td>
                      <small>
                        {item.tanggal_mulai}<br />
                        <span className="text-muted">s/d</span> {item.tanggal_akhir}
                      </small>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <small className="text-muted">{item.keterangan}</small>
                    </td>
                    <td>{renderStatus(item.status)}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          style={{ background: '#0dcaf0', border: 'none', fontSize: 12 }}
                          onClick={() => handleDetail(item)}
                        >
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          disabled={item.status.toLowerCase() === 'approved'}
                          onClick={() => handleApprove(item.id)}
                          style={{ background: '#28a745', border: 'none', fontSize: 12 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          disabled={item.status.toLowerCase() === 'rejected'}
                          onClick={() => handleReject(item.id)}
                          style={{ background: '#ffc107', border: 'none', color: '#000', fontSize: 12 }}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ===== MODAL ADD REQUEST ===== */}
      <Modal show={addModal} onHide={() => setAddModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>
            Tambah Pengajuan Cuti
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Jenis Cuti</Form.Label>
            <Form.Select name="jenis_cuti" value={addForm.jenis_cuti} onChange={handleAddChange}>
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
            <Form.Label>Tanggal Mulai</Form.Label>
            <Form.Control type="date" name="tanggal_mulai" value={addForm.tanggal_mulai} onChange={handleAddChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tanggal Akhir</Form.Label>
            <Form.Control type="date" name="tanggal_akhir" value={addForm.tanggal_akhir} onChange={handleAddChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Keterangan</Form.Label>
            <Form.Control
              as="textarea" rows={3} name="keterangan"
              placeholder="Alasan pengajuan cuti..."
              value={addForm.keterangan} onChange={handleAddChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #ffe3ec' }}>
          <Button
            onClick={handleAddSubmit}
            disabled={addLoading}
            style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', border: 'none' }}
          >
            {addLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Batal</Button>
        </Modal.Footer>
      </Modal>

      {/* ===== MODAL CALENDAR DETAIL ===== */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>Detail Cuti</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <div style={{ fontSize: 14 }}>
              <p><b>Nama:</b> {selectedEvent.extendedProps.nama}</p>
              <p><b>Jenis Cuti:</b> {renderJenisCuti(selectedEvent.extendedProps.jenis_cuti)}</p>
              <p><b>Tanggal Mulai:</b> {selectedEvent.startStr}</p>
              <p><b>Keterangan:</b> {selectedEvent.extendedProps.keterangan}</p>
              <p className="mb-0"><b>Status:</b> {renderStatus(selectedEvent.extendedProps.status)}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ===== MODAL TABLE DETAIL ===== */}
      <Modal show={tableModal} onHide={() => setTableModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>Detail Pengajuan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <div style={{ fontSize: 14 }}>
              <p><b>Nama:</b> {selectedRow.nama}</p>
              <p><b>Jenis Cuti:</b> {renderJenisCuti(selectedRow.jenis_cuti)}</p>
              <p><b>Tanggal:</b> {selectedRow.tanggal_mulai} — {selectedRow.tanggal_akhir}</p>
              <p><b>Keterangan:</b> {selectedRow.keterangan}</p>
              <p className="mb-0"><b>Status:</b> {renderStatus(selectedRow.status)}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>



    </div>
  );
}
