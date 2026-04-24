import { useState } from 'react';
import { Card, Table, Button, Modal, Form } from 'react-bootstrap';
import UserDetail from './UserDetail';
import type { User } from '../../model/User';



export default function UserPage() {
  const [selected, setSelected] = useState<User | null>(null);
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState<string>('');

  const [users, setUsers] = useState<User[]>([
    {
      user_id: 'U001',
      nama: 'Calvin',
      alamat: 'Bandung',
      email: 'calvin@mail.com',
      nomor_telepon: '08123456789',
      password: '123456',
      jabatan: 'STAFF',
      manager_id: 'M001',
      gambar: 'https://i.ytimg.com/vi/6PAAMgaBCFQ/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBy38ijVftoy0v_37zbq02xEosXdg',
      role: 'KARYAWAN',
      departemen: 'IT'
    }
  ]);

  const [newUser, setNewUser] = useState<User>({
    user_id: '',
    nama: '',
    alamat: '',
    email: '',
    nomor_telepon: '',
    password: '',
    jabatan: 'STAFF',
    manager_id: '',
    gambar: '',
    role: 'KARYAWAN',
    departemen: 'SALES'
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setNewUser(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAdd = () => {
    setUsers([...users, newUser]);
    setShow(false);

    setNewUser({
      user_id: '',
      nama: '',
      alamat: '',
      email: '',
      nomor_telepon: '',
      password: '',
      jabatan: 'STAFF',
      manager_id: '',
      gambar: '',
      role: 'KARYAWAN',
      departemen: 'SALES'
    });
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(u => u.user_id !== id));
  };

  if (selected) {
    return <UserDetail user={selected} goBack={() => setSelected(null)} />;
  }


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

  return (
    <Card className="p-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center">
        <h4>User List</h4>

        <Button variant="primary" onClick={() => setShow(true)}>
          + Add User
        </Button>
      </div>

      <Table striped hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Jabatan</th>
            <th>Departemen</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.user_id}</td>
              <td>{u.nama}</td>
              <td>{u.email}</td>
              <td>{u.jabatan}</td>
              <td>{u.departemen}</td>
              <td className="d-flex gap-2">
                <Button size="sm" onClick={() => setSelected(u)}>
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
      </Table>


      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add User</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>

            <Form.Control
              className="mb-2"
              name="nama"
              placeholder="Nama"
              onChange={handleChange}
            />

            <Form.Control
              className="mb-2"
              name="alamat"
              placeholder="alamat"
              onChange={handleChange}
            />
            <Form.Control
              className="mb-2"
              name="email"
              placeholder="Email"
              onChange={handleChange}
            />

            <Form.Control
              className="mb-2"
              name="nomor_telepon"
              placeholder="Nomor Telepon"
              onChange={handleChange}
            />

            <Form.Label>Jabatan  :</Form.Label>
            <Form.Select
              className="mb-2"
              name="jabatan"
              onChange={handleChange}
            >
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="SUPERVISIOR">Supervisior</option>
            </Form.Select>

            <Form.Label>Role : </Form.Label>
            <Form.Select
              className="mb-2"
              name="role"
              onChange={handleChange}
            >
              <option value="ADMIN">Admin</option>
              <option value="KARYAWAN">Karyawan</option>
            </Form.Select>

            <Form.Label>Departemen : </Form.Label>
            <Form.Select
              className="mb-2"
              name="departemen"
              onChange={handleChange}
            >
              <option value="SALES">Sales</option>
              <option value="IT">IT</option>
              <option value="FINANCE">Finance</option>
              <option value="PURCHASE">Purchase</option>
            </Form.Select>

            <Form.Group className="mb-2">
              <Form.Label>Foto Profile</Form.Label>
              <Form.Control type="file" onChange={handleImage} />
            </Form.Group>

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
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAdd}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}