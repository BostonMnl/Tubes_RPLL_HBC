import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from 'react-bootstrap';

import { useState, useEffect } from 'react';

import type { Reimburse } from '../../model/Reimburse';
import { reimburseServices, userServices } from '../../services/apiServices';

type AddForm = {
  nominal: string;
  tanggal: string;
  keterangan: string;
};

type UserOption = {
  user_id: string;
  nama: string;
  jabatan: string;
  manager_id?: string;
};

const defaultAddForm: AddForm = {
  nominal: '',
  tanggal: '',
  keterangan: '',
};


export default function ReimbursePage() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const role = currentUser?.role?.toLowerCase();
  const jabatan = currentUser?.jabatan?.toLowerCase();

  const isAdmin = role === 'admin';
  const isSupervisor = jabatan === 'supervisor';
  const isManager = jabatan === 'manager';

  const canApprove = isAdmin || isSupervisor || isManager;

  const canCreateForUser = isAdmin || isSupervisor || isManager;


  const [data, setData] = useState<Reimburse[]>([]);
  const [historyData, setHistoryData] = useState<Reimburse[]>([]);
  const [myData, setMyData] = useState<Reimburse[]>([]);
  const [subordinates, setSubordinates] = useState<UserOption[]>([]);

  const [selected, setSelected] = useState<Reimburse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [forUserMode, setForUserMode] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [addForm, setAddForm] = useState<AddForm>(defaultAddForm);
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');


  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    initFetch();
  }, []);

  const initFetch = async () => {
    setLoading(true);
    await Promise.all([
      fetchMyReimburse(),
      canApprove ? fetchAllReimburse() : Promise.resolve(),
      isAdmin ? fetchHistory() : Promise.resolve(),
      canCreateForUser ? fetchSubordinates() : Promise.resolve(),
    ]);
    setLoading(false);
  };


  const fetchMyReimburse = async () => {
    try {
      const res = await reimburseServices.getMyReimburse();
      setMyData(res.data?.reimburse || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data saya');
    }
  };

  const fetchAllReimburse = async () => {
    try {
      const res = await reimburseServices.getAllReimburse();
      setData(res.data?.reimburse || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat semua data');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await reimburseServices.getHistoryAllReimburse();
      setHistoryData(res.data?.reimburse || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubordinates = async () => {
    try {
      const res = await userServices.getAllUsers();
      const allUsers: UserOption[] = res.data?.user || res.data?.users || [];

      if (isAdmin) {
        setSubordinates(allUsers.filter((u) => u.user_id !== currentUser.user_id));
        return;
      }

      const result: UserOption[] = [];
      const queue: string[] = [currentUser.user_id];
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

  const canApproveItem = (item: Reimburse): boolean => {
    if (isAdmin) return true;
    return subordinates.some((s) => s.user_id === item.user_id);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await reimburseServices.updateReimburseStatus(id, status);
      showAction('success', `Request ${status.toLowerCase()} berhasil.`);
      fetchAllReimburse();
      if (isAdmin) fetchHistory();
    } catch (err: any) {
      showAction('danger', err.message || 'Gagal approval');
    }
  };

  const approve = (id: string) => updateStatus(id, 'Approved');
  const reject = (id: string) => updateStatus(id, 'Rejected');


  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAddImageFile(file);
      setAddImagePreview(URL.createObjectURL(file));
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setForUserMode(false);
    setTargetUserId('');
    setAddForm(defaultAddForm);
    setAddImageFile(null);
    setAddImagePreview('');
    setAddError('');
  };

  const handleSubmit = async () => {
    try {
      setAddLoading(true);
      const formData = new FormData();
      formData.append('nominal', addForm.nominal);
      formData.append('tanggal', addForm.tanggal);
      formData.append('keterangan', addForm.keterangan);
      if (addImageFile) formData.append('gambar', addImageFile);

      if (forUserMode) {
        if (!targetUserId) {
          setAddError('Pilih user terlebih dahulu');
          return;
        }
        formData.append('user_id', targetUserId);
        await reimburseServices.requestReimburseForUser(formData);
      } else {
        await reimburseServices.requestReimburse(formData);
      }

      resetModal();
      showAction('success', 'Request reimburse berhasil dibuat.');
      fetchMyReimburse();
      if (canApprove) fetchAllReimburse();
      if (isAdmin) fetchHistory();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menyimpan');
    } finally {
      setAddLoading(false);
    }
  };


  const showAction = (type: 'success' | 'danger', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
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

  const getUserLabel = (item: Reimburse) => {
    const user = item.user;
    if (user) return `${user.nama} (${user.jabatan})`;
    return user;
  };


  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

      <Card
        className="p-4 mb-4 border-0 shadow-sm"
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg,#ff6fa5,#ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="mb-0">Reimbursement</h3>
            <small>List Request reimbursement</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="light"
              onClick={() => { setForUserMode(false); setShowAddModal(true); }}
            >
              + My Request
            </Button>
            {canCreateForUser && (
              <Button
                variant="warning"
                onClick={() => { setForUserMode(true); setShowAddModal(true); }}
              >
                + Untuk User
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

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#ff3d7f' }} />
        </div>
      ) : (
        <Tabs defaultActiveKey="mine" className="mb-3">

          <Tab eventKey="mine" title="My Request">
            <Card className="p-4 border-0 shadow-sm">
              {myData.length === 0 ? (
                <p className="text-muted text-center py-4">Belum ada Request.</p>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nominal</th>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th>Status</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myData.map((item, idx) => (
                      <tr key={item.reimburse_id}>
                        <td>{idx + 1}</td>
                        <td>{formatRupiah(item.nominal)}</td>
                        <td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                        <td>{display(item.keterangan)}</td>
                        <td>{renderStatus(item.status)}</td>
                        <td>
                          <Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>
                            Lihat
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Tab>

          {canApprove && (
            <Tab eventKey="all" title="Semua Request">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-muted small mb-3">
                  {isAdmin
                    ? 'Admin dapat menyetujui semua request.'
                    : 'Anda hanya dapat menyetujui request dari bawahan langsung Anda.'}
                </p>
                {data.length === 0 ? (
                  <p className="text-muted text-center py-4">Tidak ada request pending.</p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>User</th>
                        <th>Nominal</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => {
                        const approvable = canApproveItem(item);
                        return (
                          <tr key={item.reimburse_id}>
                            <td>{idx + 1}</td>
                            <td>{getUserLabel(item)}</td>
                            <td>{formatRupiah(item.nominal)}</td>
                            <td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                            <td>{renderStatus(item.status)}</td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                <Button size="sm" variant="outline-secondary" onClick={() => setSelected(item)}>
                                  Detail
                                </Button>
                                {approvable && item.status === 'Pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => approve(item.reimburse_id)}
                                      title="Approve"
                                    >
                                      ✔
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => reject(item.reimburse_id)}
                                      title="Reject"
                                    >
                                      ✖
                                    </Button>
                                  </>
                                )}
                                {/* {!approvable && (
                                  <span className="text-muted small align-self-center">
                                    Bukan bawahan Anda
                                  </span>
                                )} */}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Tab>
          )}

          {isAdmin && (
            <Tab eventKey="history" title="History Semua">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-muted small mb-3">
                  Riwayat seluruh transaksi reimburse (semua status).
                </p>
                {historyData.length === 0 ? (
                  <p className="text-muted text-center py-4">Belum ada history.</p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Jabatan</th>
                        <th>Nominal</th>
                        <th>Tanggal</th>
                        <th>Keterangan</th>
                        <th>Status</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => {
                        return (
                          <tr key={item.reimburse_id}>
                            <td>{idx + 1}</td>
                            <td>{item?.user?.nama || item.user_id}</td>
                            <td>{item?.user?.jabatan || '-'}</td>
                            <td>{formatRupiah(item.nominal)}</td>
                            <td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                            <td>{display(item.keterangan)}</td>
                            <td>{renderStatus(item.status)}</td>
                            <td>
                              <Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>
                                Lihat
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Tab>
          )}

        </Tabs>
      )}

      <Modal show={showAddModal} onHide={resetModal} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>
            {forUserMode ? '+ Request For User' : '+ My Request'}
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
            <Form.Label>Nominal (IDR)</Form.Label>
            <Form.Control
              name="nominal"
              type="number"
              min={0}
              placeholder="Contoh: 150000"
              value={addForm.nominal}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tanggal</Form.Label>
            <Form.Control
              name="tanggal"
              type="date"
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
            <Form.Control type="file" accept="image/*" onChange={handleAddImage} />
          </Form.Group>

          {addImagePreview && (
            <img
              src={addImagePreview}
              alt="preview"
              className="mt-3"
              style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 200 }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetModal} disabled={addLoading}>
            Batal
          </Button>
          <Button
            style={{ background: '#ff3d7f', border: 'none' }}
            onClick={handleSubmit}
            disabled={addLoading}
          >
            {addLoading ? <Spinner size="sm" animation="border" /> : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>Detail Reimburse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (() => {
            const user = selected.user;
            return (
              <div>
                <table className="table table-borderless table-sm">
                  <tbody>
                    <tr>
                      <th style={{ width: '35%' }}>User</th>
                      <td>{user ? `${user.nama}` : selected.user_id}</td>
                    </tr>
                    {user && (
                      <tr>
                        <th>Jabatan</th>
                        <td>{user.jabatan.toUpperCase()}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Nominal</th>
                      <td>{formatRupiah(selected.nominal)}</td>
                    </tr>
                    <tr>
                      <th>Tanggal</th>
                      <td>{selected.tanggal ? new Date(selected.tanggal).toLocaleDateString('id-ID') : '-'}</td>
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
                {canApprove && canApproveItem(selected) && selected.status === 'Pending' && (
                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="success"
                      className="flex-fill"
                      onClick={() => { approve(selected.reimburse_id); setSelected(null); }}
                    >
                      ✔ Setujui
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-fill"
                      onClick={() => { reject(selected.reimburse_id); setSelected(null); }}
                    >
                      ✖ Tolak
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelected(null)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}