import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import UserDetail from './UserDetail';
import { userServices } from '../../services/apiServices';
import type { User } from '../../model/User';
// import { getUser } from '../../context/AuthContext';

type UserListItem = Pick<User, 'user_id' | 'nama' | 'email' | 'jabatan' | 'role' | 'departemen'>;

type UserFormData = Omit<User, 'gambar' > & {
  password: string;
  gambar?: string;

};

const initialFormState: UserFormData = {
  user_id: '',
  nama: '',
  email: '',
  jabatan: 'staff',
  role: 'staff',
  departemen: 'IT',
  alamat: '',
  nomor_telepon: '',
  tanggal_lahir: '',
  password: '',
  gambar: '',
  manager_id: '',
};

export default function UserPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [pageLoading, setPageLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [newUser, setNewUser] = useState<UserFormData>(initialFormState);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const managerList = users.filter(
    u => u.jabatan === 'manager' || u.jabatan === 'supervisor'
  );

  const fetchUsers = useCallback(async () => {
    setPageLoading(true);
    setError('');
    try {
      const response = await userServices.getAllUsers();
      const userList = response.data?.user || response.user || [];
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data user');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setNewUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async () => {
    const errors: Record<string, string> = {};
    if (!newUser.nama) errors.nama = 'Nama wajib diisi';
    if (!newUser.email) errors.email = 'Email wajib diisi';
    if (!newUser.password) errors.password = 'Password wajib diisi';
    if (!newUser.alamat) errors.alamat = 'Alamat wajib diisi';
    if (!newUser.nomor_telepon) errors.nomor_telepon = 'Nomer telepon wajib diisi';
    if (!newUser.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      alert('Harap lengkapi semua field yang wajib diisi!');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('nama', newUser.nama);
      formData.append('email', newUser.email);
      formData.append('password', newUser.password);
      formData.append('alamat', newUser.alamat ?? '');
      formData.append('nomor_telepon', newUser.nomor_telepon ?? '');
      formData.append('tanggal_lahir', newUser.tanggal_lahir ?? '');
      formData.append('jabatan', newUser.jabatan);
      formData.append('role', newUser.role);
      formData.append('departemen', newUser.departemen);
      console.log(newUser.manager_id)
      if (newUser.manager_id != '') formData.append('manager_id', newUser.manager_id);

      if (imageFile) formData.append('gambar', imageFile, imageFile.name);

      await userServices.createUser(formData);
      setShowAddModal(false);
      setNewUser(initialFormState);
      setImageFile(null);
      setPreview('');
      setFieldErrors({});
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambah user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeleteId) return;

    setDeleteLoading(true);
    try {
      await userServices.deleteUser(selectedDeleteId);
      setUsers(prev => prev.filter(u => u.user_id !== selectedDeleteId));
      setShowDeleteModal(false);
      setSelectedDeleteId(null);
    } catch (err: any) {
      alert(`Gagal menghapus user: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  if (selectedId) {
    return <UserDetail userId={selectedId} goBack={() => setSelectedId(null)} />;
  }

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

      {/* HEADER */}
      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white',
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-1">User Management</h3>
            <small>Manage employee accounts</small>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            style={{ background: 'white', color: '#ff3d7f', border: 'none', borderRadius: '10px' }}
          >
            + Add User
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-4 shadow-sm" style={{ borderRadius: '16px', border: 'none' }}>
        <h5 className="mb-3" style={{ color: '#ff3d7f' }}>User List</h5>
        <Table hover className="mt-3 align-middle">
          <thead style={{ background: '#ffe4ec' }}>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Jabatan</th>
              <th>Departemen</th>
              <th></th>
            </tr>
          </thead>
          {pageLoading ? (
            <tbody>
              <tr><td colSpan={5} className="text-center py-4"><Spinner animation="border" variant="danger" /></td></tr>
            </tbody>
          ) : error ? (
            <tbody>
              <tr><td colSpan={5}><Alert variant="danger">{error}</Alert></td></tr>
            </tbody>
          ) : (
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">Tidak ada data user</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 500 }}>{u.nama.toUpperCase()}</td>
                    <td>{u.email.toUpperCase()}</td>
                    <td>{u.jabatan.toUpperCase()}</td>
                    <td>{u.departemen}</td>
                    <td className="text-end">
                      <Button
                        size="sm" className="me-2"
                        style={{ background: '#ffc0cb', border: 'none', borderRadius: '8px' }}
                        onClick={() => setSelectedId(u.user_id)}
                      >
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedDeleteId(u.user_id);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </Table>
      </Card>

      {/* MODAL ADD USER */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: '#fff0f5' }}>
          <Modal.Title style={{ color: '#ff3d7f' }}>Add User</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form>
            {/* ===== ROW 1 ===== */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Nama <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="nama" placeholder="Nama lengkap"
                    onChange={handleChange} isInvalid={!!fieldErrors.nama}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.nama}</Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="email" placeholder="Email" type="email"
                    onChange={handleChange} isInvalid={!!fieldErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            {/* ===== ROW 2 ===== */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Nomor Telepon <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    name="nomor_telepon" placeholder="08xxxxxxxxxx"
                    onChange={handleChange} isInvalid={!!fieldErrors.nomor_telepon}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.nomor_telepon}</Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Tanggal Lahir <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date" name="tanggal_lahir"
                    onChange={handleChange} isInvalid={!!fieldErrors.tanggal_lahir}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.tanggal_lahir}</Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            {/* ===== ALAMAT ===== */}
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: 13 }}>Alamat <span className="text-danger">*</span></Form.Label>
              <Form.Control
                name="alamat" placeholder="Alamat lengkap"
                onChange={handleChange} isInvalid={!!fieldErrors.alamat}
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.alamat}</Form.Control.Feedback>
            </Form.Group>

            {/* ===== ROW 3 ===== */}
            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Jabatan</Form.Label>
                  <Form.Select name="jabatan" onChange={handleChange} value={newUser.jabatan}>
                    <option value="staff">Staff</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Role</Form.Label>
                  <Form.Select name="role" onChange={handleChange} value={newUser.role}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Departemen</Form.Label>
                  <Form.Select name="departemen" onChange={handleChange} value={newUser.departemen}>
                    <option value="IT">IT</option>
                    <option value="SALES">Sales</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PURCHASE">Purchase</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            {/* ✅ MANAGER / SUPERVISOR — dropdown dari list user */}
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: 13 }}>
                Manager / Supervisor
                <span className="text-muted ms-1" style={{ fontSize: 11 }}>
                  (opsional — atasan langsung user ini)
                </span>
              </Form.Label>
              {managerList.length === 0 ? (
                <div
                  className="p-2 rounded"
                  style={{ background: '#fff5f7', border: '1px solid #ffe0e7', fontSize: 13, color: '#ff99aa' }}
                >
                  Belum ada user dengan jabatan Manager atau Supervisor
                </div>
              ) : (
                <Form.Select name="manager_id" onChange={handleChange} value={newUser.manager_id}>
                  <option value="">— Tidak ada / Pilih nanti —</option>
                  {managerList.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.nama} ({m.jabatan} · {m.departemen})
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            {/* ===== PASSWORD & FOTO ===== */}
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Password <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="password" name="password" placeholder="Password"
                    onChange={handleChange} isInvalid={!!fieldErrors.password}
                  />
                  <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label style={{ fontSize: 13 }}>Foto Profile</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleImage} />
                </Form.Group>
              </div>
            </div>

            {/* PREVIEW FOTO */}
            {preview && (
              <div className="text-center mt-2">
                <img
                  src={preview} alt="preview"
                  style={{
                    width: 80, height: 80,
                    borderRadius: '50%', objectFit: 'cover',
                    border: '3px solid #ff3d7f',
                  }}
                />
              </div>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => { setShowAddModal(false); setFieldErrors({}); }}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={formLoading}
            style={{ background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)', border: 'none' }}
          >
            {formLoading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDeleteModal}
        onHide={() => !deleteLoading && setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Hapus User</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            Yakin hapus user{' '}
            <b>
              {users.find(u => u.user_id === selectedDeleteId)?.nama}
            </b>
            ?
          </p>
          <small className="text-muted">
            Data yang dihapus tidak bisa dikembalikan.
          </small>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}