import { useState } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import UserDetail from './UserDetail';

type UserListItem = {
  user_id: string;
  nama: string;
  email: string;
  jabatan: string;
  role: string;
  departemen: string;
};

// ✅ Data dummy
const dummyUsers: UserListItem[] = [
  {
    user_id: '1',
    nama: 'Budi Santoso',
    email: 'budi@company.com',
    jabatan: 'staff',
    role: 'staff',
    departemen: 'IT',
  },
  {
    user_id: '2',
    nama: 'Siti Rahayu',
    email: 'siti@company.com',
    jabatan: 'staff',
    role: 'staff',
    departemen: 'IT',
  },
  {
    user_id: '3',
    nama: 'Andi Wijaya',
    email: 'andi@company.com',
    jabatan: 'supervisor',
    role: 'staff',
    departemen: 'IT',
  },
  {
    user_id: '4',
    nama: 'Dewi Lestari',
    email: 'dewi@company.com',
    jabatan: 'staff',
    role: 'staff',
    departemen: 'IT',
  },
  {
    user_id: '5',
    nama: 'Rizky Pratama',
    email: 'rizky@company.com',
    jabatan: 'staff',
    role: 'staff',
    departemen: 'IT',
  },
];

const renderJabatan = (jabatan: string) => {
  if (jabatan === 'manager') return <Badge bg="danger">Manager</Badge>;
  if (jabatan === 'supervisor') return <Badge bg="warning" text="dark">Supervisor</Badge>;
  return <Badge bg="secondary">Staff</Badge>;
};

export default function UserPageManager() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>(dummyUsers);

  // ✅ Callback dari UserDetail kalau ada promote berhasil
  // Update data dummy lokal supaya badge jabatan ikut berubah
  const handlePromoteSuccess = (userId: string) => {
    setUsers(prev =>
      prev.map(u =>
        u.user_id === userId ? { ...u, jabatan: 'manager' } : u
      )
    );
  };

  if (selectedId) {
    return (
      <UserDetail
        userId={selectedId}
        goBack={() => setSelectedId(null)}
        onPromoteSuccess={() => handlePromoteSuccess(selectedId)}
      />
    );
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
        <div>
          <h3 className="mb-1">User Management</h3>
          <small>Lihat data karyawan di departemen Anda</small>
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
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td style={{ fontWeight: 500 }}>{u.nama}</td>
                <td>{u.email}</td>
                <td>{renderJabatan(u.jabatan)}</td>
                <td>{u.departemen}</td>
                <td className="text-end">
                  <Button
                    size="sm"
                    style={{
                      background: '#ffc0cb',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    onClick={() => setSelectedId(u.user_id)}
                  >
                    Detail
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

    </div>
  );
}