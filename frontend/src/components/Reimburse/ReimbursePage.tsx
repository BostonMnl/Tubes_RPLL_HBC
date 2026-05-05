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
  user_id?: string;
  id?: string;
  nama: string;
  jabatan: string;
  manager_id?: string;
  managerId?: string;
};

const defaultAddForm: AddForm = { nominal: '', tanggal: '', keterangan: '' };
const getUId = (u: any) => u?.user_id || u?.id;
const getMId = (u: any) => u?.manager_id || u?.managerId;

export default function ReimbursePage() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = getUId(currentUser);
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
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);

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
    try {
      const subs = await fetchSubordinates();
      await fetchMyReimburse();
      if (canApprove) await fetchAllReimburse(subs);
      if (isAdmin) await fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReimburse = async () => {
    try {
      const res = await reimburseServices.getMyReimburse();
      setMyData(res.data?.reimburse || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchAllReimburse = async (subs: UserOption[]) => {
    try {
      const res = await reimburseServices.getAllReimburse();
      const raw = res.data?.reimburse || [];
      if (isAdmin) {
        setData(raw);
      } else {
        const subIds = subs.map(s => getUId(s));
        setData(raw.filter((item: any) => subIds.includes(item.user_id)));
      }
    } catch (err: any) {
      setError(err.message);
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

  const fetchSubordinates = async (): Promise<UserOption[]> => {
    try {
      const res = await userServices.getAllUsers();
      const usersArray: UserOption[] = res.data?.user || res.data?.users || res.data || [];
      setAllUsers(usersArray);

      if (isAdmin) {
        const list = usersArray.filter((u) => getUId(u) !== currentUserId);
        setSubordinates(list);
        return list;
      }

      let filtered: UserOption[] = [];
      if (isManager) {
        filtered = usersArray.filter(u => getMId(u) === currentUserId && u.jabatan?.toLowerCase() === 'staff');
      } else if (isSupervisor) {
        const result: UserOption[] = [];
        const queue: string[] = [currentUserId];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const parentId = queue.shift()!;
          if (visited.has(parentId)) continue;
          visited.add(parentId);

          const children = usersArray.filter(u => getMId(u) === parentId);
          for (const u of children) {
            const uid = getUId(u);
            if (uid !== currentUserId && !result.some(x => getUId(x) === uid)) {
              if (['manager', 'staff'].includes(u.jabatan?.toLowerCase())) {
                result.push(u);
                queue.push(uid);
              }
            }
          }
        }
        filtered = result;
      }
      setSubordinates(filtered);
      return filtered;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const canApproveItem = (item: Reimburse): boolean => {
    if (isAdmin) return true;
    return subordinates.some((s) => getUId(s) === item.user_id);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await reimburseServices.updateReimburseStatus(id, status);
      showAction('success', `Request ${status.toLowerCase()} berhasil.`);
      initFetch();
    } catch (err: any) {
      showAction('danger', err.message);
    }
  };

  const approve = (id: string) => updateStatus(id, 'Approved');
  const reject = (id: string) => updateStatus(id, 'Rejected');
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        if (!targetUserId) { setAddError('Pilih user'); return; }
        formData.append('user_id', targetUserId);
        await reimburseServices.requestReimburseForUser(formData);
      } else {
        await reimburseServices.requestReimburse(formData);
      }
      resetModal();
      showAction('success', 'Berhasil dibuat.');
      initFetch();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const showAction = (type: 'success' | 'danger', text: string) => { setActionMsg({ type, text }); setTimeout(() => setActionMsg(null), 3500); };
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  const display = (value: any) => value || '-';
  const renderStatus = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return <Badge bg="success">Approved</Badge>;
    if (s === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="warning" text="dark">Pending</Badge>;
  };

  const getUserLabel = (item: Reimburse) => {
    if (item.user?.nama) return `${item.user.nama} (${item.user.jabatan})`;
    const foundUser = allUsers.find((u) => getUId(u) === item.user_id);
    if (foundUser) return `${foundUser.nama} (${foundUser.jabatan})`;
    return `User (${String(item.user_id).substring(0, 8)}...)`;
  };

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>
      <Card className="p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg,#ff6fa5,#ff3d7f)', color: 'white' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div><h3 className="mb-0">Reimbursement</h3><small>List Request reimbursement</small></div>
          <div className="d-flex gap-2 flex-wrap">
            <Button variant="light" onClick={() => { setForUserMode(false); setShowAddModal(true); }}>+ My Request</Button>
            {canCreateForUser && <Button variant="warning" onClick={() => { setForUserMode(true); setShowAddModal(true); }}>+ Untuk User</Button>}
          </div>
        </div>
      </Card>

      {actionMsg && <Alert variant={actionMsg.type} dismissible onClose={() => setActionMsg(null)}>{actionMsg.text}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? <div className="text-center py-5"><Spinner animation="border" style={{ color: '#ff3d7f' }} /></div> : (
        <Tabs defaultActiveKey="mine" className="mb-3">
          <Tab eventKey="mine" title="My Request">
            <Card className="p-4 border-0 shadow-sm">
              {myData.length === 0 ? <p className="text-muted text-center py-4">Belum ada Request.</p> : (
                <Table hover responsive>
                  <thead><tr><th>#</th><th>Nominal</th><th>Tanggal</th><th>Keterangan</th><th>Status</th><th>Detail</th></tr></thead>
                  <tbody>{myData.map((item, idx) => (
                    <tr key={item.reimburse_id}>
                      <td>{idx + 1}</td><td>{formatRupiah(item.nominal)}</td><td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td><td>{display(item.keterangan)}</td><td>{renderStatus(item.status)}</td>
                      <td><Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>Lihat</Button></td>
                    </tr>))}
                  </tbody>
                </Table>)}
            </Card>
          </Tab>
          {canApprove && (
            <Tab eventKey="all" title="Semua Request">
              <Card className="p-4 border-0 shadow-sm">
                {data.length === 0 ? <p className="text-muted text-center py-4">Tidak ada request pending.</p> : (
                  <Table hover responsive>
                    <thead><tr><th>No.</th><th>User</th><th>Nominal</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>{data.map((item, idx) => {
                      const approvable = canApproveItem(item);
                      return (
                        <tr key={item.reimburse_id}>
                          <td>{idx + 1}</td><td>{getUserLabel(item)}</td><td>{formatRupiah(item.nominal)}</td><td>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}</td><td>{renderStatus(item.status)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button size="sm" variant="outline-secondary" onClick={() => setSelected(item)}>Detail</Button>
                              {approvable && item.status === 'Pending' && (
                                <><Button size="sm" variant="success" onClick={() => approve(item.reimburse_id)}>✔</Button><Button size="sm" variant="danger" onClick={() => reject(item.reimburse_id)}>✖</Button></>)}
                            </div>
                          </td>
                        </tr>);})}
                    </tbody>
                  </Table>)}
              </Card>
            </Tab>)}
        </Tabs>)}

      <Modal show={showAddModal} onHide={resetModal} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}><Modal.Title>{forUserMode ? '+ Request For User' : '+ My Request'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}
          {forUserMode && (
            <Form.Group className="mb-3"><Form.Label>Pilih User</Form.Label>
              <Form.Select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
                <option value="">-- Pilih user --</option>
                {subordinates.map((u) => <option key={getUId(u)} value={getUId(u)}>{u.nama} ({u.jabatan})</option>)}
              </Form.Select>
            </Form.Group>)}
          <Form.Group className="mb-3"><Form.Label>Nominal</Form.Label><Form.Control name="nominal" type="number" value={addForm.nominal} onChange={handleAddChange} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Tanggal</Form.Label><Form.Control name="tanggal" type="date" value={addForm.tanggal} onChange={handleAddChange} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Keterangan</Form.Label><Form.Control as="textarea" name="keterangan" value={addForm.keterangan} onChange={handleAddChange} /></Form.Group>
          <Form.Group><Form.Label>Bukti</Form.Label><Form.Control type="file" accept="image/*" onChange={handleAddImage} /></Form.Group>
          {addImagePreview && <img src={addImagePreview} alt="preview" className="mt-3" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 200 }} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetModal}>Batal</Button>
          <Button style={{ background: '#ff3d7f', border: 'none' }} onClick={handleSubmit} disabled={addLoading}>{addLoading ? <Spinner size="sm" /> : 'Simpan'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}><Modal.Title>Detail Reimburse</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <table className="table table-borderless table-sm">
                <tbody>
                  <tr><th style={{ width: '35%' }}>User</th><td>{selected.user?.nama || selected.user_id}</td></tr>
                  <tr><th>Nominal</th><td>{formatRupiah(selected.nominal)}</td></tr>
                  <tr><th>Tanggal</th><td>{selected.tanggal ? new Date(selected.tanggal).toLocaleDateString('id-ID') : '-'}</td></tr>
                  <tr><th>Status</th><td>{renderStatus(selected.status)}</td></tr>
                  <tr><th>Keterangan</th><td>{display(selected.keterangan)}</td></tr>
                </tbody>
              </table>
              {selected.gambar && <img src={`http://localhost:3000${selected.gambar}`} alt="bukti" style={{ width: '100%', borderRadius: 12 }} />}
              {canApprove && canApproveItem(selected) && selected.status === 'Pending' && (
                <div className="d-flex gap-2 mt-3">
                  <Button variant="success" className="flex-fill" onClick={() => { approve(selected.reimburse_id); setSelected(null); }}>✔ Setujui</Button>
                  <Button variant="danger" className="flex-fill" onClick={() => { reject(selected.reimburse_id); setSelected(null); }}>✖ Tolak</Button>
                </div>)}
            </div>)}
        </Modal.Body>
      </Modal>
    </div>
  );
}