import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Spinner, Alert, Modal, Form
} from 'react-bootstrap';
import WageDetail from './WageDetail';
import { userServices, wageServices } from '../../services/apiServices';
import { getUser } from '../../utils/tokenManager';

type Employee = {
  user_id: string;
  name: string;
  role: string;
  jabatan: string;
  departemen: string;
};

type Gaji = {
  gaji_id: string;
  nominal: number;
  tanggal_berlaku: string;
};

export default function WageSettings() {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [gajiList, setGajiList] = useState<Gaji[]>([]);
  const [gajiLoading, setGajiLoading] = useState(false);
  const [editForm, setEditForm] = useState({ nominal: '', tanggal_berlaku: '' });
  const [editTarget, setEditTarget] = useState<Gaji | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loggedUser = getUser();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userServices.getAllUsers();
        const mapped: Employee[] = res.data.user.map((user: any) => ({
          user_id: user.user_id,
          name: user.nama,
          role: user.role,
          jabatan: user.jabatan,
          departemen: user.departemen,
        }));

        let filtered = mapped;
        if (loggedUser?.role !== 'admin') {
          filtered = mapped.filter(
            (u) => u.departemen === loggedUser?.departemen
          );
        }
        setEmployees(filtered);
      } catch (err: any) {
        setError(err.message || 'Gagal mengambil data user');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ================= PERMISSION =================
  const canViewDetail = (target: Employee): boolean => {
    if (!loggedUser) return false;
    if (loggedUser.role === 'admin') return true;

    if (loggedUser.jabatan === 'manager') return target.jabatan === 'staff';

    if (loggedUser.jabatan === 'supervisor') {
      return (
        target.user_id === loggedUser.user_id ||
        target.jabatan === 'staff' ||
        target.jabatan === 'manager'
      );
    }

    return false;
  };

  const canEdit = (target: Employee): boolean => {
    if (!loggedUser) return false;
    if (loggedUser.role === 'admin') return true;

    if (loggedUser.jabatan === 'manager') return target.jabatan === 'staff';

    if (loggedUser.jabatan === 'supervisor') {
      return (
        target.user_id === loggedUser.user_id ||
        target.jabatan === 'staff' ||
        target.jabatan === 'manager'
      );
    }

    return false;
  };

  const isDateInvalid = () => {
    if (!editForm.tanggal_berlaku) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const inputDate = new Date(editForm.tanggal_berlaku);
    inputDate.setHours(0, 0, 0, 0);

    return inputDate < today;
  };

  // ================= OPEN EDIT MODAL =================
  const openEditModal = async (emp: Employee) => {
    setEditEmployee(emp);
    setEditTarget(null);
    setEditForm({ nominal: '', tanggal_berlaku: '' });
    setShowEditModal(true);
    setGajiLoading(true);

    try {
      const res = await wageServices.getGajiByUserId(emp.user_id);
      const gaji = res?.data?.gaji;
      let data: Gaji[] = [];

      if (gaji) {
        data = Array.isArray(gaji) ? gaji : [gaji];
      }

      data.sort(
        (a, b) =>
          new Date(a.tanggal_berlaku).getTime() -
          new Date(b.tanggal_berlaku).getTime()
      );

      setGajiList(data);
    } catch {
      setGajiList([]);
    } finally {
      setGajiLoading(false);
    }
  };

  const selectGajiForEdit = (gaji: Gaji) => {
    setEditTarget(gaji);
    setEditForm({
      nominal: String(gaji.nominal),
      tanggal_berlaku: gaji.tanggal_berlaku.split('T')[0],
    });
  };

  // ================= SUBMIT EDIT =================
  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!editForm.nominal || !editForm.tanggal_berlaku) {
      alert('Semua field wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      await wageServices.updateGaji(editTarget.gaji_id, {
        nominal: Number(editForm.nominal),
        tanggal_berlaku: editForm.tanggal_berlaku,
      });
      alert('Gaji berhasil diupdate');
      setShowEditModal(false);
      setEditTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER DETAIL =================
  if (selected) {
    return (
      <WageDetail
        employee={selected}
        currentUser={loggedUser}
        goBack={() => setSelected(null)}
      />
    );
  }

  // ================= RENDER MAIN =================
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
        <h3>Employee Wage</h3>
        <small>Manage and view employee salary</small>
      </Card>

      <Card className="p-4 shadow-sm" style={{ borderRadius: '16px' }}>
        <h5 style={{ color: '#ff3d7f' }}>Employee List</h5>

        {loading && <Spinner />}
        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && (
          <Table hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role</th>
                <th>Jabatan</th>
                <th>Departemen</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.user_id}>
                  <td>{i + 1}</td>
                  <td>{emp.name.toUpperCase()}</td>
                  <td>{emp.role}</td>
                  <td>{emp.jabatan}</td>
                  <td>{emp.departemen}</td>
                  <td className="d-flex gap-2">
                    {canViewDetail(emp) && (
                      <Button
                        size="sm"
                        onClick={() => setSelected(emp)}
                        style={{ background: '#ff3d7f', border: 'none' }}
                      >
                        Detail
                      </Button>
                    )}
                    {canEdit(emp) && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => openEditModal(emp)}
                        style={{ borderColor: '#ff3d7f', color: '#ff3d7f' }}
                      >
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ================= EDIT MODAL ================= */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Edit Gaji — {editEmployee?.name.toUpperCase()}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {gajiLoading && (
            <div className="text-center py-3">
              <Spinner />
            </div>
          )}

          {!gajiLoading && gajiList.length === 0 && (
            <Alert variant="warning">Belum ada data gaji untuk karyawan ini.</Alert>
          )}

          {!gajiLoading && gajiList.length > 0 && (
            <>
              {/* Pilih riwayat gaji yang mau diedit */}
              <p className="text-muted mb-2" style={{ fontSize: '14px' }}>
                Pilih riwayat gaji yang ingin diedit:
              </p>
              <Table hover size="sm" className="mb-4">
                <thead>
                  <tr>
                    <th>Tanggal Berlaku</th>
                    <th>Nominal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {gajiList.map((g) => (
                    <tr
                      key={g.gaji_id}
                      style={{
                        background:
                          editTarget?.gaji_id === g.gaji_id
                            ? '#fff0f5'
                            : 'transparent',
                      }}
                    >
                      <td>
                        {new Date(g.tanggal_berlaku).toLocaleDateString('id-ID')}
                      </td>
                      <td>Rp {g.nominal.toLocaleString('id-ID')}</td>
                      <td>
                        <Button
                          size="sm"
                          variant={
                            editTarget?.gaji_id === g.gaji_id
                              ? 'danger'
                              : 'outline-danger'
                          }
                          onClick={() => selectGajiForEdit(g)}
                          style={{ fontSize: '12px' }}
                        >
                          {editTarget?.gaji_id === g.gaji_id ? 'Dipilih' : 'Pilih'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Form edit */}
              {editTarget && (
                <>
                  <hr />
                  <p className="mb-3" style={{ color: '#ff3d7f', fontWeight: 600 }}>
                    Edit Data Gaji
                  </p>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Nominal</Form.Label>
                      <Form.Control
                        type="number"
                        value={editForm.nominal}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nominal: e.target.value })
                        }
                      />
                    </Form.Group>

                    <Form.Group>
                      <Form.Label>Tanggal Berlaku</Form.Label>
                      <Form.Control
                        type="date"
                        value={editForm.tanggal_berlaku}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            tanggal_berlaku: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Form>
                </>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          {editTarget && (
            <Button
              style={{ background: '#ff3d7f', border: 'none' }}
              onClick={handleUpdate}
              disabled={submitting || isDateInvalid()}
              title={isDateInvalid() ? "Tanggal berlaku tidak boleh di masa lalu" : ""}
            >
              {submitting ? <Spinner size="sm" /> : 'Simpan'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}