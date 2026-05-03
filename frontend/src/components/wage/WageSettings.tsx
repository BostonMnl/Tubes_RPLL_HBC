import { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert } from 'react-bootstrap';
import WageDetail from './WageDetail';
import { userServices } from '../../services/apiServices';
import { getUser } from '../../utils/tokenManager';

type Employee = {
  id: string;
  name: string;
  role: string;
  jabatan: string;
  departemen: string;
};

export default function WageSettings() {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await userServices.getAllUsers();

      const loggedUser = getUser(); // 🔥 ambil user dari localStorage

      const mapped = res.data.user.map((user: any) => ({
        id: user.user_id,
        name: user.nama,
        role: user.role,
        jabatan: user.jabatan,
        departemen: user.departemen,
      }));

      // 🔥 FILTER LOGIC
      let filtered = mapped;

      if (loggedUser?.role !== 'admin') {
        // kalau bukan admin → filter berdasarkan departemen
        filtered = mapped.filter(
          (u: any) => u.departemen === loggedUser?.departemen
        );
      }

      setEmployees(filtered);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, []);

  if (selected) {
    return (
      <WageDetail
        employee={selected}
        goBack={() => setSelected(null)}
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
          color: 'white'
        }}
      >
        <h3 className="mb-1">Employee Wage</h3>
        <small>Manage and view employee salary details</small>
      </Card>

      {/* MAIN TABLE */}
      <Card
        className="p-4 shadow-sm"
        style={{
          borderRadius: '16px',
          border: 'none'
        }}
      >
        <h5 className="mb-3" style={{ color: '#ff3d7f' }}>
          Employee List
        </h5>

        {loading && (
          <div className="text-center my-4">
            <Spinner animation="border" variant="danger" />
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && (
          <div style={{ overflowX: 'auto' }}>
            <Table hover className="align-middle">
              <thead style={{ background: '#ffe4ec' }}>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Jabatan</th>
                  <th>Departemen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid #f5d0dc'
                    }}
                  >
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{emp.name.toUpperCase()}</td>
                    <td>{emp.role.toUpperCase()}</td>
                    <td>{emp.jabatan.toUpperCase()}</td>
                    <td>{emp.departemen.toUpperCase()}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        onClick={() => setSelected(emp)}
                        style={{
                          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
                          border: 'none',
                          borderRadius: '10px'
                        }}
                        className="px-3"
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}