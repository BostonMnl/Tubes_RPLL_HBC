import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import UserDetail from './UserDetail';
import { userServices } from '../../services/apiServices';
import type { User } from '../../model/User';

// Type untuk list view
type UserListItem = Pick<User, 'user_id' | 'nama' | 'email' | 'jabatan' | 'role' | 'departemen'>;

type UserFormData = Omit<User, 'manager_id' | 'gambar'> & {
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
    setNewUser(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAdd = async () => {
    const errors: Record<string, string> = {};

    if (!newUser.nama) errors.nama = 'Nama wajib diisi';
    if (!newUser.email) errors.email = 'Email wajib diisi';
    if (!newUser.password) errors.password = 'Password wajib diisi';
    if (!newUser.alamat) errors.alamat = 'Alamat wajib diisi';
    if (!newUser.nomor_telepon) errors.nomer_telepon = 'Nomer telepon  wajib diisi';
    if (!newUser.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      alert('Harap lengkapi semua field yang wajib diisi!');
      return;
    }


    setFormLoading(true);
    setFormError('');

    try {
      await userServices.createUser(newUser);
      setShowAddModal(false);
      setNewUser(initialFormState);
      setPreview('');
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambah user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await userServices.deleteUser(id);
        setUsers(prev => prev.filter(u => u.user_id !== id));
      } catch (err: any) {
        alert(`Gagal menghapus user: ${err.message}`);
      }
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);

      setPreview(url);
      setNewUser(prev => ({
        ...prev,
        gambar: url
      }));
    }
  };

  if (selectedId) {
    return <UserDetail userId={selectedId} goBack={() => setSelectedId(null)} />;
  }

  return (
    <Card className="p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center">
        <h4>User List</h4>

        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Add User
        </Button>
      </div>

      <Table striped hover className="mt-3">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Jabatan</th>
            <th>Departemen</th>
            <th>Action</th>
          </tr>
        </thead>

        {pageLoading ? (
          <tbody>
            <tr>
              <td colSpan={6} className="text-center py-4">
                <Spinner animation="border" size="sm" /> Loading users...
              </td>
            </tr>
          </tbody>
        ) : error ? (
          <tbody>
            <tr>
              <td colSpan={6} className="text-center py-4">
                <Alert variant="danger">{error}</Alert>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.nama}</td>
                <td>{u.email}</td>
                <td>{u.jabatan}</td>
                <td>{u.departemen}</td>
                <td className="d-flex gap-2">
                  <Button size="sm" onClick={() => setSelectedId(u.user_id)}>
                    Detail
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(u.user_id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </Table>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add User</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form>
            <Form.Control className="mb-2" name="nama" placeholder="Nama" onChange={handleChange}  isInvalid={!!fieldErrors.nama} />
            <Form.Control className="mb-2" name="alamat" placeholder="Alamat" onChange={handleChange}   isInvalid={!!fieldErrors.alamat}/>
            <Form.Control className="mb-2" name="email" placeholder="Email" onChange={handleChange}   isInvalid={!!fieldErrors.email}/>
            <Form.Control className="mb-2" name="nomor_telepon" placeholder="Nomor Telepon" onChange={handleChange}   isInvalid={!!fieldErrors.nomor_telepon}/>

            <Form.Label>Jabatan :</Form.Label>
            <Form.Select className="mb-2" name="jabatan" onChange={handleChange}>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="supervisor">Supervisor</option>
            </Form.Select>

            <Form.Label>Role :</Form.Label>
            <Form.Select className="mb-2" name="role" onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </Form.Select>

            <Form.Label>Departemen :</Form.Label>
            <Form.Select className="mb-2" name="departemen" onChange={handleChange}>
              <option value="SALES">Sales</option>
              <option value="IT">IT</option>
              <option value="FINANCE">Finance</option>
              <option value="PURCHASE">Purchase</option>
            </Form.Select>

            <Form.Group className="mb-2">
              <Form.Label>Foto Profile</Form.Label>
              <Form.Control type="file" onChange={handleImage} />
            </Form.Group>

            <Form.Control className="mb-2" type="date" name="tanggal_lahir" onChange={handleChange} />
            <Form.Control className="mb-2" type="password" name="password" placeholder="Password" onChange={handleChange} />

            {preview && (
              <div className="text-center mt-2">
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAdd} disabled={formLoading}>
            {formLoading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}