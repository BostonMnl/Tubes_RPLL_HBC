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

  const currentUser = getUser();

  const fetchUsers = useCallback(async () => {
    setPageLoading(true);
    setError('');

    try {
      if (!currentUser) throw new Error('User tidak ditemukan');

      const response = await userServices.getAllUsers();
      const userList: UserListItem[] = response.data?.user || response.user || [];

      const filteredUsers = userList.filter(
        (u) => u.departemen === currentUser.departemen
      );

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


 
  const canViewDetail = (u: UserListItem) => {
    if (u.role === 'admin') return false;
    if (u.jabatan === currentUser?.jabatan) return false;
    if (u.jabatan === 'supervisor') return false;
    return true;
  };

  if (selectedId) {
    return <UserDetail userId={selectedId} goBack={() => setSelectedId(null)} />;
  }

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

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
                  <Spinner animation="border" variant="danger" />
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Tidak ada data user di departemen Anda
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 500 }}>{u.nama}</td>
                    <td>{u.email}</td>
                    <td>{renderJabatan(u.jabatan)}</td>
                    <td>{u.departemen}</td>
                    <td className="text-end">
                      {canViewDetail(u) && (
                        <Button
                          size="sm"
                          style={{ background: '#ffc0cb', color : '#e93790', border: 'none', borderRadius: '8px' }}
                          onClick={() => setSelectedId(u.user_id)}
                        >
                          Detail
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </Table>
      </Card>
    </div>
  );
}