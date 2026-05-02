import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, Modal, Button, Table, Badge, Form, Alert } from 'react-bootstrap';
import { leaveServices } from '../../services/apiServices';

type LeaveRequest = {
  id: number;
  nama: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  keterangan: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ State untuk Add modal
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(defaultForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveServices.getAllLeaves();
      const data = res.data?.cuti;
      const mapped = data.map((item: any) => ({
        id: item.cuti_id,
        nama: item.nama || item.user?.nama,
        tanggal_mulai: item.tanggal_mulai,
        tanggal_akhir: item.tanggal_akhir,
        keterangan: item.keterangan,
        status: item.status,
      }));
      setLeaveRequests(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const leaveEvents = leaveRequests.map(item => ({
    title: `${item.nama} - Cuti`,
    start: item.tanggal_mulai,
    end: item.tanggal_akhir,
    color: item.status.toLowerCase() === 'approved' ? '#28a745' :
      item.status.toLowerCase() === 'rejected' ? '#dc3545' : '#ff6b9d',
    extendedProps: { keterangan: item.keterangan, status: item.status },
  }));

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  const handleDetail = (item: LeaveRequest) => {
    setSelectedRow(item);
    setTableModal(true);
  };

  // ✅ Fix bug: pakai toLowerCase()
  const handleApprove = async (id: number) => {
    try {
      await leaveServices.updateLeaveStatus(id.toString(), 'Approved');
      setLeaveRequests(prev =>
        prev.map(item => item.id === id ? { ...item, status: 'approved' } : item)
      );
    } catch {
      alert('Gagal approve');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await leaveServices.updateLeaveStatus(id.toString(), 'Rejected');
      setLeaveRequests(prev =>
        prev.map(item => item.id === id ? { ...item, status: 'rejected' } : item)
      );
    } catch {
      alert('Gagal reject');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Yakin hapus data?')) {
      setLeaveRequests(prev => prev.filter(item => item.id !== id));
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

  // ✅ Fix bug renderStatus: pakai toLowerCase()
  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'pending') return <Badge bg="warning" text="dark">Pending</Badge>;
    return <Badge bg="danger">Rejected</Badge>;
  };

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>

      {/* HEADER */}
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
          {/* ✅ Tombol Add di header */}
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

      {/* CALENDAR */}
      <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
          Calendar Overview
        </h5>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={leaveEvents}
          eventClick={handleEventClick}
          height="600px"
        />
      </Card>

      {/* TABLE */}
      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>
            Leave Requests
          </h5>
          {/* ✅ Tombol Add alternatif di atas tabel */}
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

        {loading && <p className="text-center text-muted">Loading...</p>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Table hover responsive className="align-middle">
          <thead style={{ background: '#ffe3ec' }}>
            <tr>
              <th>Nama</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Status</th>
              <th style={{ width: '300px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map(item => (
              <tr key={item.id}>
                <td className="fw-semibold">{item.nama}</td>
                <td>
                  <small>
                    {item.tanggal_mulai}<br />s/d {item.tanggal_akhir}
                  </small>
                </td>
                <td>{item.keterangan}</td>
                <td>{renderStatus(item.status)}</td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button size="sm" style={{ background: '#0dcaf0', border: 'none' }} onClick={() => handleDetail(item)}>
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      disabled={item.status.toLowerCase() === 'approved'}
                      onClick={() => handleApprove(item.id)}
                      style={{ background: '#28a745', border: 'none' }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      disabled={item.status.toLowerCase() === 'rejected'}
                      onClick={() => handleReject(item.id)}
                      style={{ background: '#ffc107', border: 'none', color: '#000' }}
                    >
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleDelete(item.id)} style={{ background: '#dc3545', border: 'none' }}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && leaveRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  Belum ada data pengajuan cuti
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
      

      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>
            Status Request Leave
          </h5>
          {/* ✅ Tombol Add alternatif di atas tabel */}
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

        {loading && <p className="text-center text-muted">Loading...</p>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Table hover responsive className="align-middle">
          <thead style={{ background: '#ffe3ec' }}>
            <tr>
              <th>Nama</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Status</th>
              <th style={{ width: '300px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map(item => (
              <tr key={item.id}>
                <td className="fw-semibold">{item.nama}</td>
                <td>
                  <small>
                    {item.tanggal_mulai}<br />s/d {item.tanggal_akhir}
                  </small>
                </td>
                <td>{item.keterangan}</td>
                <td>{renderStatus(item.status)}</td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button size="sm" style={{ background: '#0dcaf0', border: 'none' }} onClick={() => handleDetail(item)}>
                      Detail
                    </Button>
                    <Button
                      size="sm"
                      disabled={item.status.toLowerCase() === 'approved'}
                      onClick={() => handleApprove(item.id)}
                      style={{ background: '#28a745', border: 'none' }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      disabled={item.status.toLowerCase() === 'rejected'}
                      onClick={() => handleReject(item.id)}
                      style={{ background: '#ffc107', border: 'none', color: '#000' }}
                    >
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleDelete(item.id)} style={{ background: '#dc3545', border: 'none' }}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && leaveRequests.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  Belum ada data pengajuan cuti
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* ✅ MODAL ADD REQUEST */}
      <Modal show={addModal} onHide={() => setAddModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 18 }}>
            Tambah Pengajuan Cuti
          </Modal.Title>
        </Modal.Header>
        {/* ✅ Form Modal — hapus field Nama, tambah Jenis Cuti */}
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
              Cuti Tahunan, Sakit, dan Melahirkan termasuk cuti berbayar (paid).
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tanggal Mulai</Form.Label>
            <Form.Control
              type="date"
              name="tanggal_mulai"
              value={addForm.tanggal_mulai}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tanggal Akhir</Form.Label>
            <Form.Control
              type="date"
              name="tanggal_akhir"
              value={addForm.tanggal_akhir}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Keterangan</Form.Label>
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
            {addLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button variant="secondary" onClick={() => setAddModal(false)}>
            Batal
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL CALENDAR */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detail Cuti</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <p><b>Nama:</b> {selectedEvent.title}</p>
              <p><b>Tanggal:</b> {selectedEvent.startStr}</p>
              <p><b>Keterangan:</b> {selectedEvent.extendedProps.keterangan}</p>
              <p><b>Status:</b> {renderStatus(selectedEvent.extendedProps.status)}</p>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* MODAL TABLE DETAIL */}
      <Modal show={tableModal} onHide={() => setTableModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detail Pengajuan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <>
              <p><b>Nama:</b> {selectedRow.nama}</p>
              <p><b>Tanggal:</b> {selectedRow.tanggal_mulai} - {selectedRow.tanggal_akhir}</p>
              <p><b>Keterangan:</b> {selectedRow.keterangan}</p>
              <p><b>Status:</b> {renderStatus(selectedRow.status)}</p>
            </>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
}