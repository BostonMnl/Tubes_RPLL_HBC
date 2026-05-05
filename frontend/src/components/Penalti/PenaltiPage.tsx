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
  Row,
  Col
} from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { pinaltiServices, userServices } from '../../services/apiServices';

// =========================
// TYPES
// =========================
interface Penalti {
  penalti_id: string;
  user_id: string;
  jenis: string;
  nominal: number;
  keterangan: string;
  tanggal: string;
  jumlah_hari?: number;
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
  jenis: string;
  nominal: string;
  tanggal: string;
  keterangan: string;
  jumlah_hari: string;
};

const defaultAddForm: AddForm = {
  jenis: 'Telat Masuk',
  nominal: '',
  tanggal: new Date().toISOString().split('T')[0],
  keterangan: '',
  jumlah_hari: ''
};

const JENIS_OPTIONS = ['Cuti Tidak Berbayar', 'Mengrusak', 'Telat Masuk'];

export default function PenaltiPage() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser.user_id;
  const role = currentUser?.role?.toLowerCase();
  const jabatan = currentUser?.jabatan?.toLowerCase();

  const isAdmin = role === 'admin';
  const isSupervisor = jabatan === 'supervisor';
  const isManager = jabatan === 'manager';
  
  const canManageOthers = isAdmin || isSupervisor || isManager;
  const canCreateForUser = isAdmin || isSupervisor || isManager;

  const [data, setData] = useState<Penalti[]>([]); 
  const [historyData, setHistoryData] = useState<Penalti[]>([]); 
  const [myData, setMyData] = useState<Penalti[]>([]); 
  
  const [allUsers, setAllUsers] = useState<UserOption[]>([]); 
  const [subordinates, setSubordinates] = useState<UserOption[]>([]);

  const [selected, setSelected] = useState<Penalti | null>(null);
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
      fetchPenaltiData(),
      canManageOthers ? fetchSubordinates() : Promise.resolve(),
    ]);
    setLoading(false);
  };

  const fetchPenaltiData = async () => {
    try {
      if (isAdmin) {
        const res = await pinaltiServices.getAllPinalti();
        const all = res.data?.penalti || res.data || [];
        setHistoryData(all);
        setData(all.filter((x: Penalti) => x.user_id !== currentUserId));
        setMyData(all.filter((x: Penalti) => x.user_id === currentUserId));
      } else {
        const res = await pinaltiServices.getMyPinalti();
        const mixed = res.data?.penalti || res.data || [];
        setMyData(mixed.filter((x: Penalti) => x.user_id === currentUserId));
        setData(mixed.filter((x: Penalti) => x.user_id !== currentUserId));
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data penalti');
    }
  };

  const fetchSubordinates = async () => {
    try {
      const res = await userServices.getAllUsers();
      
      // Ambil data dari backend yang SUDAH difilter berdasarkan departemen & jabatan
      const usersArray: UserOption[] = res.data?.user || res.data?.users || [];
      
      // Simpan semua user untuk fallback mapping nama (opsional)
      setAllUsers(usersArray);

      // Cukup pastikan user yang sedang login tidak muncul di dropdown bawahan
      const filteredSubordinates = usersArray.filter((u) => u.user_id !== currentUserId);
      
      setSubordinates(filteredSubordinates);
      
    } catch (err) {
      console.error('Gagal memuat subordinates:', err);
    }
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    try {
      setAddLoading(true);
      const formData = new FormData();
      formData.append('user_id', forUserMode ? targetUserId : currentUserId);
      formData.append('jenis', addForm.jenis);
      formData.append('nominal', addForm.nominal);
      formData.append('tanggal', addForm.tanggal);
      formData.append('keterangan', addForm.keterangan);
      
      if (addForm.jenis === 'Cuti Tidak Berbayar' && addForm.jumlah_hari) {
        formData.append('jumlah_hari', addForm.jumlah_hari);
      }
      if (addImageFile) formData.append('gambar', addImageFile);

      await pinaltiServices.createPinalti(formData);

      resetModal();
      showAction('success', 'Data penalti berhasil ditambahkan.');
      fetchPenaltiData();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menyimpan data penalti');
    } finally {
      setAddLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      setAddLoading(true);
      const fd = new FormData();
      fd.append('jenis', selected.jenis);
      fd.append('nominal', String(selected.nominal));
      fd.append('keterangan', selected.keterangan);
      fd.append('tanggal', selected.tanggal);
      
      if (selected.jenis === 'Cuti Tidak Berbayar' && selected.jumlah_hari) {
        fd.append('jumlah_hari', String(selected.jumlah_hari));
      }
      if (addImageFile) fd.append('gambar', addImageFile);

      await pinaltiServices.updatePinalti(selected.penalti_id, fd);
      
      showAction('success', 'Perubahan penalti berhasil disimpan.');
      setSelected(null);
      resetModal();
      fetchPenaltiData();
    } catch (err: any) {
      setAddError(err.message || 'Gagal update penalti');
    } finally {
      setAddLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm('Yakin ingin menghapus data penalti ini?')) {
      try {
        await pinaltiServices.deletePinalti(id);
        showAction('success', 'Data berhasil dihapus');
        setSelected(null);
        fetchPenaltiData();
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

  const getUserLabel = (item: Penalti) => {
    if (item.user && item.user.nama) return `${item.user.nama} (${item.user.jabatan})`;
    const foundUser = allUsers.find((u) => u.user_id === item.user_id);
    if (foundUser) return `${foundUser.nama} (${foundUser.jabatan})`;
    return `User Terhapus (${item.user_id.substring(0, 8)}...)`;
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
            <h3 className="mb-0">Penalti</h3>
            <small>List Request Penalti & Potongan</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {/* Tampilkan tombol "Penalti Sendiri" HANYA jika Admin atau Supervisor */}
            {(isAdmin || isSupervisor) && (
              <Button
                variant="light"
                onClick={() => { setForUserMode(false); setShowAddModal(true); }}
              >
                + Penalti Sendiri
              </Button>
            )}
            
            {/* Tombol Untuk User untuk mereka yang punya bawahan */}
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

          <Tab eventKey="mine" title="Penalti Saya">
            <Card className="p-4 border-0 shadow-sm">
              {myData.length === 0 ? (
                <p className="text-muted text-center py-4">Belum ada penalti untuk Anda.</p>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Jenis</th>
                      <th>Nominal</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myData.map((item, idx) => (
                      <tr key={item.penalti_id || Math.random()} style={{ opacity: isLocked(item.payroll_id) ? 0.7 : 1 }}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold">{item.jenis}</td>
                        <td>{formatRupiah(item.nominal)}</td>
                        <td>{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
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

          {canManageOthers && (
            <Tab eventKey="all" title="Penalti Bawahan">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-muted small mb-3">
                  {isAdmin
                    ? 'Admin dapat melihat dan mengelola semua penalti.'
                    : 'Anda hanya dapat melihat dan mengelola penalti dari bawahan Anda.'}
                </p>
                {data.length === 0 ? (
                  <p className="text-muted text-center py-4">Tidak ada data penalti bawahan.</p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>User</th>
                        <th>Jenis</th>
                        <th>Nominal</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => (
                        <tr key={item.penalti_id || Math.random()} style={{ opacity: isLocked(item.payroll_id) ? 0.7 : 1 }}>
                          <td>{idx + 1}</td>
                          <td>{getUserLabel(item)}</td>
                          <td>{item.jenis}</td>
                          <td>{formatRupiah(item.nominal)}</td>
                          <td>{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
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

          {isAdmin && (
            <Tab eventKey="history" title="History Semua">
              <Card className="p-4 border-0 shadow-sm">
                <p className="text-muted small mb-3">
                  Riwayat seluruh penalti (termasuk yang terkunci).
                </p>
                {historyData.length === 0 ? (
                  <p className="text-muted text-center py-4">Belum ada history.</p>
                ) : (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Jenis</th>
                        <th>Nominal</th>
                        <th>Tanggal</th>
                        <th>Keterangan</th>
                        <th>Status</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={item.penalti_id || Math.random()}>
                          <td>{idx + 1}</td>
                          <td>{getUserLabel(item)}</td>
                          <td>{item.jenis}</td>
                          <td>{formatRupiah(item.nominal)}</td>
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

      {/* MODAL CREATE */}
      <Modal show={showAddModal} onHide={resetModal} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>
            {forUserMode ? '+ Penalti Untuk User' : '+ Penalti Sendiri'}
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
                  Tidak ada bawahan yang tersedia. (Pastikan akses API backend terbuka).
                </Form.Text>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Jenis Penalti</Form.Label>
            <Form.Select name="jenis" value={addForm.jenis} onChange={handleAddChange}>
              {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
            </Form.Select>
          </Form.Group>

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

          {addForm.jenis === 'Cuti Tidak Berbayar' && (
            <Form.Group className="mb-3">
              <Form.Label>Jumlah Hari</Form.Label>
              <Form.Control
                type="number"
                name="jumlah_hari"
                min={1}
                value={addForm.jumlah_hari}
                onChange={handleAddChange}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Keterangan</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="keterangan"
              placeholder="Deskripsi..."
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

      {/* MODAL DETAIL / EDIT */}
      <Modal show={!!selected} onHide={() => { setSelected(null); setEditMode(false); }} centered>
        <Modal.Header closeButton style={{ background: '#ff3d7f', color: 'white' }}>
          <Modal.Title>{editMode ? '✏️ Edit Penalti' : 'Detail Penalti'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}
          {selected && !editMode && (() => {
            return (
              <div>
                <table className="table table-borderless table-sm">
                  <tbody>
                    <tr>
                      <th style={{ width: '35%' }}>User</th>
                      <td>{getUserLabel(selected)}</td>
                    </tr>
                    <tr>
                      <th>Jenis</th>
                      <td>{selected.jenis}</td>
                    </tr>
                    <tr>
                      <th>Nominal</th>
                      <td>{formatRupiah(selected.nominal)}</td>
                    </tr>
                    <tr>
                      <th>Tanggal</th>
                      <td>{selected.tanggal ? new Date(selected.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                    </tr>
                    {selected.jenis === 'Cuti Tidak Berbayar' && selected.jumlah_hari && (
                      <tr>
                        <th>Jumlah Hari</th>
                        <td>{selected.jumlah_hari} hari</td>
                      </tr>
                    )}
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
                  <img
                    src={`http://localhost:3000${selected.gambar.startsWith('/') ? '' : '/'}${selected.gambar}`}
                    alt="bukti"
                    style={{ width: '100%', borderRadius: 12, border: '1px solid #ddd' }}
                  />
                )}
                
                {!isLocked(selected.payroll_id) && (
                  <div className="d-flex gap-2 mt-3">
                    <Button 
                      variant="warning" 
                      className="flex-fill"
                      onClick={() => {
                        setAddImagePreview('');
                        setAddImageFile(null);
                        setEditMode(true);
                      }}
                    >
                      ✏️ Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      className="flex-fill"
                      onClick={() => remove(selected.penalti_id)}
                    >
                      🗑 Hapus
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          {selected && editMode && (
             <Form>
               <Form.Group className="mb-3">
                 <Form.Label>Jenis Penalti</Form.Label>
                 <Form.Select name="jenis" value={selected.jenis} onChange={(e) => setSelected({...selected, jenis: e.target.value})}>
                   {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                 </Form.Select>
               </Form.Group>
               <Form.Group className="mb-3">
                 <Form.Label>Tanggal</Form.Label>
                 <Form.Control type="date" name="tanggal" value={selected.tanggal ? selected.tanggal.split('T')[0] : ''} onChange={(e) => setSelected({...selected, tanggal: e.target.value})} />
               </Form.Group>
               <Form.Group className="mb-3">
                 <Form.Label>Nominal (Rp)</Form.Label>
                 <Form.Control type="number" name="nominal" min={0} value={selected.nominal} onChange={(e) => setSelected({...selected, nominal: Number(e.target.value)})} />
               </Form.Group>
               {selected.jenis === 'Cuti Tidak Berbayar' && (
                 <Form.Group className="mb-3">
                   <Form.Label>Jumlah Hari</Form.Label>
                   <Form.Control type="number" name="jumlah_hari" min={1} value={selected.jumlah_hari || ''} onChange={(e) => setSelected({...selected, jumlah_hari: Number(e.target.value)})} />
                 </Form.Group>
               )}
               <Form.Group className="mb-3">
                 <Form.Label>Keterangan</Form.Label>
                 <Form.Control as="textarea" rows={3} name="keterangan" value={selected.keterangan} onChange={(e) => setSelected({...selected, keterangan: e.target.value})} />
               </Form.Group>
               <Form.Group className="mb-3">
                 <Form.Label>Update Gambar (Opsional)</Form.Label>
                 <Form.Control type="file" accept="image/*" onChange={handleAddImage} />
               </Form.Group>
             </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!editMode ? (
            <Button variant="secondary" onClick={() => setSelected(null)}>Tutup</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => { setEditMode(false); setAddError(''); }} disabled={addLoading}>Batal</Button>
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