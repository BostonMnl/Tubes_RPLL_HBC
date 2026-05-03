import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import UserDetail from './UserDetail';
import { userServices } from '../../services/apiServices';
import { getUser } from '../../utils/tokenManager';

type UserListItem = {
  user_id: string;
  nama: string;
  email: string;
  jabatan: string;
  role: string;
  departemen: string;
};

const renderJabatan = (jabatan: string) => {
  if (jabatan === 'manager') return <Badge bg="danger">Manager</Badge>;
  if (jabatan === 'supervisor') return <Badge bg="warning" text="dark">Supervisor</Badge>;
  return <Badge bg="secondary">Staff</Badge>;
};

export default function UserPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setPageLoading(true);
    setError('');

    try {
      const currentUser = getUser(); 
      if (!currentUser) throw new Error('User tidak ditemukan');
      
      const response = await userServices.getAllUsers();
      const userList = response.data?.user;
      
      const filteredUsers = userList.filter(
        (u: UserListItem) => u.departemen === currentUser.departemen
      );
      
      console.log(filteredUsers)
      setUsers(filteredUsers);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data user');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        <h3>User Management</h3>
        <small>Hanya menampilkan user dalam departemen Anda</small>
      </Card>

      {/* TABLE */}
      <Card className="p-4 shadow-sm" style={{ borderRadius: '16px', border: 'none' }}>
        <Table hover className="align-middle">
          <thead>
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
              <tr>
                <td colSpan={5} className="text-center">
                  <Spinner />
                </td>
              </tr>
            </tbody>
          ) : error ? (
            <tbody>
              <tr>
                <td colSpan={5}>
                  <Alert variant="danger">{error}</Alert>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {users.map(u => (
                <tr key={u.user_id}>
                  <td>{u.nama}</td>
                  <td>{u.email}</td>
                  <td>{renderJabatan(u.jabatan)}</td>
                  <td>{u.departemen}</td>
                  <td className="text-end">
                    <Button size="sm" onClick={() => setSelectedId(u.user_id)}>
                      Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </Table>
      </Card>
    </div>
  );
}