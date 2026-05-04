import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, Modal, Button, Table, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { leaveServices, userServices } from '../../services/apiServices';
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

type UserOption = {
  user_id: string;
  nama: string;
  jabatan: string;
  manager_id?: string | null;
};

const defaultForm = {
  tanggal_mulai: '',
  tanggal_akhir: '',
  jenis_cuti: 'Cuti_Tahunan',
  keterangan: '',
};

const JENIS_CUTI_OPTIONS = [
  { value: 'Cuti_Tahunan', label: 'Cuti Tahunan' },
  { value: 'Cuti_Sakit', label: 'Cuti Sakit' },
  { value: 'Cuti_Melahirkan', label: 'Cuti Melahirkan' },
  { value: 'Cuti_Lainnya', label: 'Cuti Lainnya' },
];

export default function CalendarView() {
  const user = getUser();
  const role = user?.role?.toLowerCase();
  const jabatan = user?.jabatan?.toLowerCase();

  const isAdmin = role === 'admin';
  const isSupervisor = jabatan === 'supervisor';
  const isManager = jabatan === 'manager';

  const canApprove = isAdmin || isSupervisor || isManager;
  const canCreateForUser = isAdmin || isSupervisor || isManager;

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LeaveRequest | null>(null);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [allLeave, setAllLeave] = useState<LeaveRequest[]>([]);
  const [subordinates, setSubordinates] = useState<UserOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addModal, setAddModal] = useState(false);
  const [forUserMode, setForUserMode] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [addForm, setAddForm] = useState(defaultForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);


  useEffect(() => {
    initFetch();
  }, []);

  const initFetch = async () => {
    setLoading(true);
    await Promise.all([
      fetchLeaves(),
      canCreateForUser ? fetchSubordinates() : Promise.resolve(),
    ]);
    setLoading(false);
  };


  const fetchLeaves = async () => {
    try {
      setError('');
      const [res, res2] = await Promise.all([
        leaveServices.getReqAllLeaves(),
        leaveServices.getAllLeaves(),
      ]);

      const mapItem = (item: any): LeaveRequest => ({
        id: item.cuti_id,
        nama: item.nama || item.user?.nama || '-',
        departemen: item.departemen || item.user?.departemen || '',
        tanggal_mulai: item.tanggal_mulai,
        tanggal_akhir: item.tanggal_akhir,
        keterangan: item.keterangan,
        jenis_cuti: item.jenis_cuti,
        status: item.status?.toLowerCase() as LeaveRequest['status'],
      });

      const filterByRole = (items: LeaveRequest[]) => {
        if (isAdmin || isSupervisor || isManager) return items;
        return items.filter((item) => item.nama === user?.nama);
      };

      setLeaveRequests(filterByRole((res.data?.cuti ?? []).map(mapItem)));
      setAllLeave(filterByRole((res2.data?.cuti ?? []).map(mapItem)));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    }
  };

  const fetchSubordinates = async () => {
    try {
      const res = await userServices.getAllUsers();
      const allUsers: UserOption[] = res.data?.user || res.data?.users || [];

      if (isAdmin) {
        setSubordinates(allUsers.filter((u) => u.user_id !== user?.user_id));
        return;
      }

      const result: UserOption[] = [];
      const queue: string[] = [user?.user_id];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const parentId = queue.shift()!;
        if (visited.has(parentId)) continue;
        visited.add(parentId);

        const directReports = allUsers.filter((u) => u.manager_id === parentId);
        for (const u of directReports) {
          result.push(u);
          queue.push(u.user_id);
        }
      }

      setSubordinates(result);
    } catch (err) {
      console.error('Gagal memuat subordinates', err);
    }
  };


  const updateStatusLocal = (id: number, status: 'approved' | 'rejected') => {
    const updater = (prev: LeaveRequest[]) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item));
    setLeaveRequests(updater);
    setAllLeave(updater);
  };

  const handleApprove = async (id: number) => {
    try {
      await leaveServices.updateLeaveStatus(id.toString(), 'Approved');
      updateStatusLocal(id, 'approved');
      showAction('success', 'Request berhasil disetujui.');
    } catch {
      showAction('danger', 'Gagal approve.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await leaveServices.updateLeaveStatus(id.toString(), 'Rejected');
      updateStatusLocal(id, 'rejected');
      showAction('success', 'Request berhasil ditolak.');
    } catch {
      showAction('danger', 'Gagal reject.');
    }
  };


  const resetAddModal = () => {
    setAddModal(false);
    setForUserMode(false);
    setTargetUserId('');
    setAddForm(defaultForm);
    setAddError('');
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
    if (forUserMode && !targetUserId) {
      setAddError('Pilih user terlebih dahulu');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      const basePayload = {
        tanggal_mulai: addForm.tanggal_mulai,
        tanggal_akhir: addForm.tanggal_akhir,
        jenis_cuti: addForm.jenis_cuti,
        keterangan: addForm.keterangan,
      };

      if (forUserMode) {
        await leaveServices.requestLeaveForUser({ ...basePayload, user_id: targetUserId });
      } else {
        await leaveServices.requestLeave(basePayload);
      }

      resetAddModal();
      showAction('success', 'Request cuti berhasil dibuat.');
      await fetchLeaves();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menambahkan data');
    } finally {
      setAddLoading(false);
    }
  };


  const showAction = (type: 'success' | 'danger', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'pending') return <Badge bg="warning" text="dark">Pending</Badge>;
    return <Badge bg="danger">Rejected</Badge>;
  };

  const renderJenisCuti = (jenis?: string) => (jenis ? jenis.replace(/_/g, ' ') : '-');

  const leaveEvents = allLeave.map((item) => ({
    title: `${item.nama} - ${item.jenis_cuti?.replace('_', ' ') ?? 'Cuti'}`,
    start: item.tanggal_mulai,
    end: item.tanggal_akhir,
    color:
      item.status === 'approved' ? '#28a745' :
      item.status === 'rejected' ? '#dc3545' : '#ff6b9d',
    extendedProps: {
      keterangan: item.keterangan,
      status: item.status,
      jenis_cuti: item.jenis_cuti,
      nama: item.nama,
    },
  }));



  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>


      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="mb-1">Leave Management</h3>
            <small>Monitor and manage employee leave requests</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              onClick={() => { setForUserMode(false); setAddModal(true); setAddError(''); }}
              style={{ background: 'white', color: '#ff3d7f', border: 'none', borderRadius: 10, fontWeight: 600 }}
            >
              + My Request
            </Button>
            {canCreateForUser && (
              <Button
                variant="warning"
                onClick={() => { setForUserMode(true); setAddModal(true); setAddError(''); }}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                + Request For User
              </Button>
            )}
          </div>
        </div>
      </Card>


      {actionMsg && (
        <Alert variant={actionMsg.type} dismissible onClose={() => setActionMsg(null)}>
          {actionMsg.text}
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

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

      {/* ── CALENDAR ── */}
      <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>Calendar Overview</h5>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#ff3d7f' }} />
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={leaveEvents}
            eventClick={(info) => { setSelectedEvent(info.event); setShowModal(true); }}
            height="580px"
            eventDisplay="block"
            dayMaxEvents={3}
          />
        )}
      </Card>

      <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Leave Requests</h5>
            <small className="text-muted">Request masuk — perlu persetujuan</small>
          </div>
        </div>

        {!loading && (
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
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Belum ada Request cuti</td>
                </tr>
              ) : (
                leaveRequests.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.nama.toUpperCase()}</td>
                    <td>
                      <Badge style={{ background: '#ff6b9d', color: 'white', fontWeight: 500 }}>
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
                          onClick={() => { setSelectedRow(item); setTableModal(true); }}
                        >
                          Detail
                        </Button>
                        {canApprove && (
                          <>
                            <Button
                              size="sm"
                              disabled={item.status === 'approved'}
                              onClick={() => handleApprove(item.id)}
                              style={{ background: '#28a745', border: 'none', fontSize: 12 }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              disabled={item.status === 'rejected'}
                              onClick={() => handleReject(item.id)}
                              style={{ background: '#ffc107', border: 'none', color: '#000', fontSize: 12 }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <div className="mb-3">
          <h5 className="mb-0 fw-semibold" style={{ color: '#ff3d7f' }}>Status Request Leave</h5>
          <small className="text-muted">Semua data cuti karyawan</small>
        </div>

        {!loading && (
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
                  <td colSpan={6} className="text-center text-muted py-4">Belum ada data cuti</td>
                </tr>
              ) : (
                allLeave.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.nama.toUpperCase()}</td>
                    <td>
                      <Badge style={{ background: '#ff6b9d', color: 'white', fontWeight: 500 }}>
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
                          onClick={() => { setSelectedRow(item); setTableModal(true); }}
                        >
                          Detail
                        </Button>
                        {canApprove && (
                          <>
                            <Button
                              size="sm"
                              disabled={item.status === 'approved'}
                              onClick={() => handleApprove(item.id)}
                              style={{ background: '#28a745', border: 'none', fontSize: 12 }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              disabled={item.status === 'rejected'}
                              onClick={() => handleReject(item.id)}
                              style={{ background: '#ffc107', border: 'none', color: '#000', fontSize: 12 }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal show={addModal} onHide={resetAddModal} centered>
        <Modal.Header
          closeButton
          style={{
            background: '#ff3d7f',
            color: 'white',
            borderBottom: '1px solid #ffe3ec',
          }}
        >
          <Modal.Title style={{ fontSize: 17 }}>
            {forUserMode ? '+ Request Cuti Untuk User' : '+ Request Cuti Saya'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}


          {forUserMode && (
            <Form.Group className="mb-3">
              <Form.Label>Pilih User</Form.Label>
              <Form.Select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">-- Pilih user --</option>
                {subordinates.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.nama} ({u.jabatan})
                  </option>
                ))}
              </Form.Select>
              {subordinates.length === 0 && (
                <Form.Text className="text-danger">
                  Tidak ada bawahan yang tersedia.
                </Form.Text>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Jenis Cuti</Form.Label>
            <Form.Select name="jenis_cuti" value={addForm.jenis_cuti} onChange={handleAddChange}>
              {JENIS_CUTI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Cuti Tahunan, Sakit, dan Melahirkan termasuk cuti berbayar.
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
              placeholder="Alasan Request cuti..."
              value={addForm.keterangan}
              onChange={handleAddChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #ffe3ec' }}>
          <Button variant="secondary" onClick={resetAddModal} disabled={addLoading}>
            Batal
          </Button>
          <Button
            onClick={handleAddSubmit}
            disabled={addLoading}
            style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', border: 'none' }}
          >
            {addLoading ? <Spinner size="sm" animation="border" /> : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Modal>

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

      <Modal show={tableModal} onHide={() => setTableModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #ffe3ec' }}>
          <Modal.Title style={{ color: '#ff3d7f', fontSize: 17 }}>Detail Request</Modal.Title>
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setTableModal(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}