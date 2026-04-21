import { useState } from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import UserDetail from './UserDetail';

type User = {
  user_id: string;
  nama: string;
  alamat: string;
  email: string;
  password: string;
  jabatan: string;
  manager_id: string;
  gambar: string;
  role: string;
  departemen: string;
};

export default function UserPage() {
  const [selected, setSelected] = useState<User | null>(null);

  const users: User[] = [
    {
      user_id: 'U001',
      nama: 'Calvin',
      alamat: 'Bandung',
      email: 'calvin@mail.com',
      password: '123456',
      jabatan: 'Staff',
      manager_id: 'M001',
      gambar: '',
      role: 'Employee',
      departemen: 'IT'
    }
  ];

  if (selected) {
    return <UserDetail user={selected} goBack={() => setSelected(null)} />;
  }

  return (
    <Card className="p-4 shadow-sm">
      <h4>User List</h4>

      <Table striped hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Jabatan</th>
            <th>Role</th>
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
              <td>{u.role}</td>
              <td>
                <Button size="sm" onClick={() => setSelected(u)}>
                  Detail
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}