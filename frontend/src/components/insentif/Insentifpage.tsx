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
import { insentifServices, userServices } from '../../services/apiServices';


interface Insentif {
  insentif_id: string;
  user_id: string;
  nominal: number;
  keterangan: string;
  tanggal: string;
  gambar?: string | null;
  payroll_id?: string | null;
  user?: {
    nama: string;
    jabatan: string;
  };
}

type UserOption = {
  user_id: string;
  nama: string;
  jabatan: string;
  manager_id?: string;
};

type AddForm = {
  nominal: string;
  tanggal: string;
  keterangan: string;
};

const defaultAddForm: AddForm = {
  nominal: '',
  tanggal: new Date().toISOString().split('T')[0],
  keterangan: '',
};

// =========================
// MAIN COMPONENT
// =========================
export default function InsentifPage() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser.user_id;
  const role = currentUser?.role?.toLowerCase();
  const jabatan = currentUser?.jabatan?.toLowerCase();

  const isAdmin = role === 'admin';
  const isSupervisor = jabatan === 'supervisor';
  const isManager = jabatan === 'manager';

  const canManageOthers = isAdmin || isSupervisor || isManager;
  const canCreateForUser = isAdmin || isSupervisor || isManager;

  const [data, setData] = useState<Insentif[]>([]);
  const [historyData, setHistoryData] = useState<Insentif[]>([]);
  const [myData, setMyData] = useState<Insentif[]>([]);

  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [subordinates, setSubordinates] = useState<UserOption[]>([]);

  const [selected, setSelected] = useState<Insentif | null>(null);
  const [editMode, setEditMode] = useState(false);
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
      fetchInsentifData(),
      canManageOthers ? fetchSubordinates() : Promise.resolve(),
    ]);
    setLoading(false);
  };

  const fetchInsentifData = async () => {
    try {
      if (isAdmin) {
        const res = await insentifServices.getAllInsentif();
        const all: Insentif[] = res.data?.insentif || res.data || [];
        setHistoryData(all);
        setData(all.filter((x) => x.user_id !== currentUserId));
        setMyData(all.filter((x) => x.user_id === currentUserId));
      } else {
        const res = await insentifServices.getMyInsentif();
        const mixed: Insentif[] = res.data?.insentif || res.data || [];
        setMyData(mixed.filter((x) => x.user_id === currentUserId));
        setData(mixed.filter((x) => x.user_id !== currentUserId));
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data insentif');
    }
  };

  const fetchSubordinates = async () => {
    try {
      const res = await userServices.getAllUsers();
      const usersArray: UserOption[] = res.data?.user || res.data?.users || [];
      setAllUsers(usersArray);

      let filtered: UserOption[] = [];

      if (isAdmin) {
        filtered = usersArray.filter((u) => u.user_id !== currentUserId);

      } else if (isManager) {
        filtered = usersArray.filter(
          (u) => u.manager_id === currentUserId && u.user_id !== currentUserId
        );

      } else if (isSupervisor) {

        const directReports = usersArray.filter(
          (u) => u.manager_id === currentUserId && u.user_id !== currentUserId
        );
        const managerIds = directReports
          .filter((u) => u.jabatan?.toLowerCase() === 'manager')
          .map((u) => u.user_id);
        const indirectReports = usersArray.filter(
          (u) =>
            managerIds.includes(u.manager_id || '') &&
            u.user_id !== currentUserId
        );
        // Gabung & deduplicate
        const combined = [...directReports, ...indirectReports];
        filtered = combined.filter(
          (u, idx, self) => self.findIndex((x) => x.user_id === u.user_id) === idx
        );
      }

      setSubordinates(filtered);
    } catch (err) {
      console.error('Gagal memuat subordinates:', err);
    }
  };

  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (forUserMode && !targetUserId) {
      setAddError('Pilih user terlebih dahulu');
      return;
    }
    if (!addForm.nominal || Number(addForm.nominal) <= 0) {
      setAddError('Nominal harus diisi dan lebih dari 0');
      return;
    }

    try {
      setAddLoading(true);
      const formData = new FormData();
      formData.append('user_id', forUserMode ? targetUserId : currentUserId);
      formData.append('nominal', addForm.nominal);
      formData.append('tanggal', addForm.tanggal);
      formData.append('keterangan', addForm.keterangan);
      if (addImageFile) formData.append('gambar', addImageFile);

      await insentifServices.createInsentif(formData);

      resetModal();
      showAction('success', 'Data insentif berhasil ditambahkan.');
      fetchInsentifData();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menyimpan data insentif');
    } finally {
      setAddLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      setAddLoading(true);
      const fd = new FormData();
      fd.append('nominal', String(selected.nominal));
      fd.append('keterangan', selected.keterangan);
      fd.append('tanggal', selected.tanggal);
      if (addImageFile) fd.append('gambar', addImageFile);

      await insentifServices.updateInsentif(selected.insentif_id, fd);

      showAction('success', 'Perubahan insentif berhasil disimpan.');
      setSelected(null);
      resetModal();
      fetchInsentifData();
    } catch (err: any) {
      setAddError(err.message || 'Gagal update insentif');
    } finally {
      setAddLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm('Yakin ingin menghapus data insentif ini?')) {
      try {
        await insentifServices.deleteInsentif(id);
        showAction('success', 'Data berhasil dihapus');
        setSelected(null);
        fetchInsentifData();
      } catch (err: any) {
        showAction('danger', err.message || 'Gagal menghapus data');
      }
    }
  };

  const showAction = (type: 'success' | 'danger', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num || 0);

  const display = (value: any) => value || '-';

  const isLocked = (payroll_id?: string | null) => !!payroll_id;

  const renderStatus = (payroll_id?: string | null) => {
    if (payroll_id) return <Badge bg="secondary">🔒 Locked</Badge>;
    return <Badge bg="warning" text="dark">Active</Badge>;
  };

  const getUserLabel = (item: Insentif) => {
    if (item.user?.nama) return `${item.user.nama} (${item.user.jabatan})`;
    const foundUser = allUsers.find((u) => u.user_id === item.user_id);
    if (foundUser) return `${foundUser.nama} (${foundUser.jabatan})`;
    return `User Terhapus (${item.user_id.substring(0, 8)}...)`;
  };

  // Cek apakah item yang sedang dilihat bisa diedit/dihapus oleh user saat ini
  const canEditOrDelete = (item: Insentif): boolean => {
    if (isAdmin) return true;
    return subordinates.some((u) => u.user_id === item.user_id);
  };

  // ========================
  // RENDER
  // ========================
  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

      {/* HEADER CARD */}
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
            <h3 className="mb-0">💰 Insentif</h3>
            <small>List Insentif & Bonus Karyawan</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {(isAdmin || isSupervisor) && (
              <Button
                variant="light"
                onClick={() => { setForUserMode(false); setShowAddModal(true); }}
              >
                + Insentif Sendiri
              </Button>
            )}
            {canCreateForUser && (
              <Button
                style={{ background: '#fff3cd', border: 'none', color: '#856404', fontWeight: 600 }}
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

          {/* TAB: INSENTIF SAYA */}
          <Tab eventKey="mine" title="Insentif Saya">
            <Card className="p-4 border-0 shadow-sm">
              {myData.length === 0 ? (
                <p className="text-muted text-center py-4">Belum ada insentif untuk Anda.</p>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nominal</th>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myData.map((item, idx) => (
                      <tr key={item.insentif_id} style={{ opacity: isLocked(item.payroll_id) ? 0.7 : 1 }}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold">{formatRupiah(item.nominal)}</td>
                        <td>{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
                        <td>{display(item.keterangan)}</td>
                        <td>{renderStatus(item.payroll_id)}</td>
                        <td>
                          <Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Tab>

          {/* TAB: INSENTIF BAWAHAN */}
          {canManageOthers && (
            <Tab eventKey="all" title="Insentif Bawahan">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-muted small mb-3">
                  {isAdmin
                    ? 'Admin dapat melihat dan mengelola semua insentif.'
                    : isManager
                    ? 'Anda hanya dapat melihat dan mengelola insentif bawahan langsung Anda.'
                    : 'Anda dapat melihat dan mengelola insentif seluruh bawahan Anda.'}
                </p>
                {data.length === 0 ? (
                  <p className="text-muted text-center py-4">Tidak ada data insentif bawahan.</p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>User</th>
                        <th>Nominal</th>
                        <th>Tanggal</th>
                        <th>Keterangan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => (
                        <tr key={item.insentif_id} style={{ opacity: isLocked(item.payroll_id) ? 0.7 : 1 }}>
                          <td>{idx + 1}</td>
                          <td>{getUserLabel(item)}</td>
                          <td className="fw-semibold">{formatRupiah(item.nominal)}</td>
                          <td>{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
                          <td>{display(item.keterangan)}</td>
                          <td>{renderStatus(item.payroll_id)}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Tab>
          )}

          {/* TAB: HISTORY SEMUA (Admin only) */}
          {isAdmin && (
            <Tab eventKey="history" title="History Semua">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-muted small mb-3">Riwayat seluruh insentif (termasuk yang terkunci).</p>
                {historyData.length === 0 ? (
                  <p className="text-muted text-center py-4">Belum ada history.</p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Nominal</th>
                        <th>Tanggal</th>
                        <th>Keterangan</th>
                        <th>Status</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={item.insentif_id}>
                          <td>{idx + 1}</td>
                          <td>{getUserLabel(item)}</td>
                          <td className="fw-semibold">{formatRupiah(item.nominal)}</td>
                          <td>{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
                          <td>{display(item.keterangan)}</td>
                          <td>{renderStatus(item.payroll_id)}</td>
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
          )}

        </Tabs>
      )}

      {/* ===========================
          MODAL CREATE INSENTIF
      =========================== */}
      <Modal show={showAddModal} onHide={resetModal} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>
            {forUserMode ? '+ Insentif Untuk User' : '+ Insentif Sendiri'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}

          {forUserMode && (
            <Form.Group className="mb-3">
              <Form.Label>Pilih User</Form.Label>
              <Form.Select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
                <option value="">-- Pilih user --</option>
                {subordinates.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.nama} ({u.jabatan})
                  </option>
                ))}
              </Form.Select>
              {subordinates.length === 0 && (
                <Form.Text className="text-danger">Tidak ada bawahan yang tersedia.</Form.Text>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nominal (IDR)</Form.Label>
            <Form.Control
              name="nominal"
              type="number"
              min={0}
              placeholder="Contoh: 500000"
              value={addForm.nominal}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tanggal</Form.Label>
            <Form.Control name="tanggal" type="date" value={addForm.tanggal} onChange={handleAddChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Keterangan</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="keterangan"
              placeholder="Contoh: Performance bonus for May..."
              value={addForm.keterangan}
              onChange={handleAddChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bukti / Dokumen (foto)</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleAddImage} />
            <Form.Text className="text-muted">Format: JPG, PNG, WEBP. Maks 5MB.</Form.Text>
          </Form.Group>

          {addImagePreview && (
            <div className="mt-2 position-relative">
              <img
                src={addImagePreview}
                alt="preview"
                style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 200, border: '2px solid #ff6fa5' }}
              />
              <Button
                size="sm" variant="danger"
                style={{ position: 'absolute', top: 8, right: 8, borderRadius: '50%', padding: '0 6px' }}
                onClick={() => { setAddImageFile(null); setAddImagePreview(''); }}
              >✕</Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetModal} disabled={addLoading}>Batal</Button>
          <Button style={{ background: '#ff3d7f', border: 'none' }} onClick={handleSubmit} disabled={addLoading}>
            {addLoading ? <Spinner size="sm" animation="border" /> : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===========================
          MODAL DETAIL / EDIT
      =========================== */}
      <Modal show={!!selected} onHide={() => { setSelected(null); setEditMode(false); setAddError(''); }} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>{editMode ? '✏️ Edit Insentif' : '💰 Detail Insentif'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}

          {/* VIEW MODE */}
          {selected && !editMode && (
            <div>
              <table className="table table-borderless table-sm">
                <tbody>
                  <tr>
                    <th style={{ width: '35%' }}>User</th>
                    <td>{getUserLabel(selected)}</td>
                  </tr>
                  <tr>
                    <th>Nominal</th>
                    <td className="fw-bold" style={{ color: '#ff3d7f' }}>{formatRupiah(selected.nominal)}</td>
                  </tr>
                  <tr>
                    <th>Tanggal</th>
                    <td>
                      {selected.tanggal
                        ? new Date(selected.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                    </td>
                  </tr>
                  <tr>
                    <th>Keterangan</th>
                    <td>{display(selected.keterangan)}</td>
                  </tr>
                  <tr>
                    <th>Status Payroll</th>
                    <td>{renderStatus(selected.payroll_id)}</td>
                  </tr>
                </tbody>
              </table>

              {selected.gambar && (
                <div className="mt-2">
                  <p className="text-muted small mb-1">Bukti:</p>
                  <img
                    src={`http://localhost:3000${selected.gambar.startsWith('/') ? '' : '/'}${selected.gambar}`}
                    alt="bukti"
                    style={{ width: '100%', borderRadius: 12, border: '2px solid #ff6fa5', objectFit: 'cover', maxHeight: 260 }}
                  />
                </div>
              )}

              {/* Edit & Delete: tampil hanya jika tidak locked DAN user ini ada di daftar bawahan */}
              {!isLocked(selected.payroll_id) && canEditOrDelete(selected) && (
                <div className="d-flex gap-2 mt-3">
                  <Button
                    variant="warning" className="flex-fill"
                    onClick={() => { setAddImagePreview(''); setAddImageFile(null); setEditMode(true); }}
                  >
                    ✏️ Edit
                  </Button>
                  <Button variant="danger" className="flex-fill" onClick={() => remove(selected.insentif_id)}>
                    🗑 Hapus
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* EDIT MODE */}
          {selected && editMode && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nominal (Rp)</Form.Label>
                <Form.Control
                  type="number" min={0} value={selected.nominal}
                  onChange={(e) => setSelected({ ...selected, nominal: Number(e.target.value) })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Tanggal</Form.Label>
                <Form.Control
                  type="date"
                  value={selected.tanggal ? selected.tanggal.split('T')[0] : ''}
                  onChange={(e) => setSelected({ ...selected, tanggal: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Keterangan</Form.Label>
                <Form.Control
                  as="textarea" rows={3} value={selected.keterangan}
                  onChange={(e) => setSelected({ ...selected, keterangan: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Update Gambar (Opsional)</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleAddImage} />
              </Form.Group>

              {addImagePreview && (
                <div className="mt-2 position-relative">
                  <img
                    src={addImagePreview} alt="preview baru"
                    style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 200, border: '2px solid #ff6fa5' }}
                  />
                  <Button
                    size="sm" variant="danger"
                    style={{ position: 'absolute', top: 8, right: 8, borderRadius: '50%', padding: '0 6px' }}
                    onClick={() => { setAddImageFile(null); setAddImagePreview(''); }}
                  >✕</Button>
                </div>
              )}

              {!addImagePreview && selected.gambar && (
                <div className="mt-2">
                  <p className="text-muted small mb-1">Gambar saat ini:</p>
                  <img
                    src={`http://localhost:3000${selected.gambar.startsWith('/') ? '' : '/'}${selected.gambar}`}
                    alt="gambar lama"
                    style={{ width: '100%', borderRadius: 12, border: '1px solid #ddd', objectFit: 'cover', maxHeight: 200 }}
                  />
                </div>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!editMode ? (
            <Button variant="secondary" onClick={() => { setSelected(null); setAddError(''); }}>Tutup</Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => { setEditMode(false); setAddError(''); setAddImagePreview(''); setAddImageFile(null); }}
                disabled={addLoading}
              >
                Batal
              </Button>
              <Button style={{ background: '#ff3d7f', border: 'none' }} onClick={saveEdit} disabled={addLoading}>
                {addLoading ? <Spinner size="sm" animation="border" /> : 'Simpan Perubahan'}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

    </div>
  );
}