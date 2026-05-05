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
import { payrollServices, userServices, wageServices } from '../../services/apiServices';

interface Payroll {
  payroll_id: string;
  user_id: string;
  gaji_id: string;
  bulan: number;
  tahun: number;
  gaji_pokok: number;
  total_insentif: number;
  total_penalti: number;
  total_reimburse: number;
  take_home_pay: number;
  status: string;
  user?: {
    nama: string;
    jabatan: string;
  };
}

type UserOption = {
  user_id?: string;
  id?: string;
  nama: string;
  jabatan: string;
  manager_id?: string;
  managerId?: string;
};

type GenerateForm = {
  user_id: string;
  gaji_id: string;
  bulan: number;
  tahun: number;
};

const defaultGenerateForm: GenerateForm = {
  user_id: '',
  gaji_id: '',
  bulan: new Date().getMonth() + 1,
  tahun: new Date().getFullYear()
};

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
  { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
];

const getUId = (u: any) => u.user_id || u.id;
const getMId = (u: any) => u.manager_id || u.managerId;

export default function PayrollPage() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = getUId(currentUser);
  
  const role = currentUser?.role?.toLowerCase();
  const jabatan = currentUser?.jabatan?.toLowerCase();

  const isAdmin = role === 'admin';
  const isManager = jabatan === 'manager';
  const isSupervisor = jabatan === 'supervisor';
  
  const canManageOthers = isAdmin || isManager || isSupervisor;
  const canGeneratePayroll = isAdmin; 

  const [data, setData] = useState<Payroll[]>([]); 
  const [myData, setMyData] = useState<Payroll[]>([]); 
  
  const [allUsers, setAllUsers] = useState<UserOption[]>([]); 
  const [subordinates, setSubordinates] = useState<UserOption[]>([]); 

  const [selected, setSelected] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateForm>(defaultGenerateForm);
  const [targetGajiNominal, setTargetGajiNominal] = useState<number>(0); 
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    initFetch();
  }, []);

  const initFetch = async () => {
    setLoading(true);
    setError('');
    
    try {
      let currentSubordinates: UserOption[] = [];
      
      if (canManageOthers) {
        const res = await userServices.getAllUsers();
        let usersArray: UserOption[] = [];
        if (Array.isArray(res)) usersArray = res;
        else if (Array.isArray(res?.data)) usersArray = res.data;
        else if (Array.isArray(res?.data?.users)) usersArray = res.data.users;
        else if (Array.isArray(res?.data?.user)) usersArray = res.data.user;

        setAllUsers(usersArray);

        if (isAdmin) {
          currentSubordinates = usersArray.filter(u => getUId(u) !== currentUserId);
        } else {
          const result: UserOption[] = [];
          const queue: string[] = [currentUserId];
          const visited = new Set<string>();

          while (queue.length > 0) {
            const parentId = queue.shift()!;
            if (visited.has(parentId)) continue;
            visited.add(parentId);

            const directReports = usersArray.filter(u => getMId(u) === parentId);
            for (const u of directReports) {
              const uid = getUId(u);
              if (uid !== currentUserId && !result.some(x => getUId(x) === uid)) {
                result.push(u);
                queue.push(uid);
              }
            }
          }
          currentSubordinates = result;
        }
        setSubordinates(currentSubordinates);
      }

      if (canManageOthers) {
        const resPayroll = await payrollServices.getAllPayroll();
        const all: Payroll[] = resPayroll.data?.payroll || resPayroll.data || [];
        
        if (isAdmin) {
          setData(all.filter((x) => x.user_id !== currentUserId));
        } else {
          const subordinateIds = currentSubordinates.map(u => getUId(u));
          setData(all.filter((x) => subordinateIds.includes(x.user_id)));
        }
        setMyData(all.filter((x) => x.user_id === currentUserId));

      } else {
        const resPayroll = await payrollServices.getMyPayroll();
        const mixed = resPayroll.data?.payroll || resPayroll.data || [];
        setMyData(Array.isArray(mixed) ? mixed : []);
      }

    } catch (err: any) {
      setError(String(err?.message || 'Gagal memuat data halaman Payroll'));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = async (userId: string) => {
    setGenerateForm(prev => ({ ...prev, user_id: userId, gaji_id: '' }));
    setTargetGajiNominal(0);
    setGenerateError('');

    if (userId) {
      try {
        const res = await wageServices.getGajiByUserId(userId);
        const activeGaji = res.data?.gaji || res.data;
        if (activeGaji) {
          setGenerateForm(prev => ({ ...prev, gaji_id: activeGaji.gaji_id }));
          setTargetGajiNominal(activeGaji.nominal);
        } else {
          setGenerateError('Karyawan ini belum memiliki data gaji tetap. Harap atur gaji terlebih dahulu.');
        }
      } catch (err: any) {
        setGenerateError('Gagal mengambil data gaji karyawan. ' + String(err?.message || ''));
      }
    }
  };

  const handleGenerateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setGenerateForm((prev) => ({ 
      ...prev, 
      [e.target.name]: e.target.name === 'bulan' || e.target.name === 'tahun' 
        ? Number(e.target.value) 
        : e.target.value 
    }));
  };

  const resetModal = () => {
    setShowGenerateModal(false);
    setGenerateForm(defaultGenerateForm);
    setTargetGajiNominal(0);
    setGenerateError('');
  };

  const handleGenerateSubmit = async () => {
    if (!generateForm.user_id || !generateForm.gaji_id) {
      setGenerateError('Pilih user dengan data gaji yang valid');
      return;
    }

    try {
      setGenerateLoading(true);
      await payrollServices.generatePayroll(generateForm);
      resetModal();
      showAction('success', 'Payroll berhasil di-generate.');
      initFetch();
    } catch (err: any) {
      setGenerateError(String(err?.message || 'Gagal generate payroll'));
    } finally {
      setGenerateLoading(false);
    }
  };

  const showAction = (type: 'success' | 'danger', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const formatRupiah = (num: number | undefined) => {
    if (num === undefined || num === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  const getBulanLabel = (bulan: number) => {
    const b = BULAN_OPTIONS.find(x => x.value === Number(bulan));
    return b ? b.label : bulan;
  };

  const renderStatus = (status: string | undefined) => {
    const s = status?.toLowerCase();
    if (s === 'paid') return <Badge bg="success">Paid</Badge>;
    if (s === 'locked') return <Badge bg="secondary">Locked</Badge>;
    return <Badge bg="warning" text="dark">Draft</Badge>;
  };

  const getUserLabel = (item: Payroll) => {
    if (item?.user && item?.user?.nama) return `${item.user.nama} (${item.user.jabatan})`;
    const foundUser = allUsers?.find((u) => getUId(u) === item?.user_id);
    if (foundUser) return `${foundUser.nama} (${foundUser.jabatan})`;
    return `User (${String(item?.user_id || '').substring(0, 8)}...)`;
  };

  const renderMyPayrollTable = () => (
    <Card className="p-4 border-0 shadow-sm">
      {!canManageOthers && <h5 className="mb-4 text-secondary">Slip Gaji Saya</h5>}
      {!myData || myData.length === 0 ? (
        <p className="text-muted text-center py-4">Belum ada data payroll untuk Anda.</p>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Periode</th>
              <th>Gaji Pokok</th>
              <th>Insentif</th>
              <th>Penalti</th>
              <th>Take Home Pay</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {myData.map((item, index) => (
              <tr key={item?.payroll_id || index}>
                <td className="fw-semibold">{getBulanLabel(item?.bulan)} {item?.tahun}</td>
                <td>{formatRupiah(item?.gaji_pokok)}</td>
                <td className="text-success">+{formatRupiah(item?.total_insentif)}</td>
                <td className="text-danger">-{formatRupiah(item?.total_penalti)}</td>
                <td className="fw-bold text-primary">{formatRupiah(item?.take_home_pay)}</td>
                <td>{renderStatus(item?.status)}</td>
                <td>
                  <Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>Lihat Slip</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );

  return (
    <div style={{ background: '#f4f7fe', minHeight: '100vh', padding: '20px' }}>
      <Card className="p-4 mb-4 border-0 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg,#5e72e4,#825ee4)', color: 'white' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div><h3 className="mb-0">Payroll / Penggajian</h3><small>Manajemen Slip Gaji Karyawan</small></div>
          <div className="d-flex gap-2 flex-wrap">
            {canGeneratePayroll && (
              <Button variant="warning" onClick={() => setShowGenerateModal(true)} style={{ fontWeight: 600, color: '#000' }}>
                + Generate Payroll
              </Button>
            )}
          </div>
        </div>
      </Card>

      {actionMsg && <Alert variant={actionMsg.type} dismissible onClose={() => setActionMsg(null)}>{actionMsg.text}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" style={{ color: '#5e72e4' }} /></div>
      ) : !canManageOthers ? (
        renderMyPayrollTable()
      ) : (
        <Tabs defaultActiveKey="mine" className="mb-3">
          <Tab eventKey="mine" title="Slip Gaji Saya">
            {renderMyPayrollTable()}
          </Tab>
          <Tab eventKey="all" title="Semua Payroll">
            <Card className="p-4 border-0 shadow-sm">
              {!data || data.length === 0 ? (
                <p className="text-muted text-center py-4">Belum ada data payroll bawahan.</p>
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr><th>User</th><th>Periode</th><th>Gaji Pokok</th><th>Take Home Pay</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={item?.payroll_id || index}>
                        <td>{getUserLabel(item)}</td>
                        <td>{getBulanLabel(item?.bulan)} {item?.tahun}</td>
                        <td>{formatRupiah(item?.gaji_pokok)}</td>
                        <td className="fw-bold">{formatRupiah(item?.take_home_pay)}</td>
                        <td>{renderStatus(item?.status)}</td>
                        <td><Button size="sm" variant="outline-primary" onClick={() => setSelected(item)}>Detail</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Tab>
        </Tabs>
      )}

      <Modal show={showGenerateModal} onHide={resetModal} centered>
        <Modal.Header closeButton style={{ background: '#5e72e4', color: 'white' }}>
          <Modal.Title>Generate Payroll</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {generateError && <Alert variant="danger">{generateError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Pilih Karyawan Bawahan</Form.Label>
              <Form.Select name="user_id" value={generateForm.user_id} onChange={(e) => handleUserSelection(e.target.value)}>
                <option value="">-- Pilih User --</option>
                {subordinates?.map((u) => (
                  <option key={getUId(u)} value={getUId(u)}>{u.nama} ({u.jabatan})</option>
                ))}
              </Form.Select>
              {(!subordinates || subordinates.length === 0) && (
                  <Form.Text className="text-danger">Tidak ada data bawahan yang bisa di-generate.</Form.Text>
              )}
            </Form.Group>

            {targetGajiNominal > 0 && (
              <Alert variant="info" className="py-2 mb-3">
                Gaji Terdeteksi: <strong className="fs-5">{formatRupiah(targetGajiNominal)}</strong>
              </Alert>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bulan</Form.Label>
                  <Form.Select name="bulan" value={generateForm.bulan} onChange={handleGenerateChange}>
                    {BULAN_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tahun</Form.Label>
                  <Form.Control type="number" name="tahun" value={generateForm.tahun} onChange={handleGenerateChange} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetModal} disabled={generateLoading}>Batal</Button>
          <Button style={{ background: '#5e72e4', border: 'none' }} onClick={handleGenerateSubmit} disabled={generateLoading || targetGajiNominal === 0}>
            {generateLoading ? <Spinner size="sm" animation="border" /> : 'Generate'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton style={{ background: '#5e72e4', color: 'white' }}>
          <Modal.Title>Detail Slip Gaji</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div>
              <Row className="mb-4">
                <Col md={6}><p className="mb-1 text-muted">Karyawan</p><h6 className="fw-bold">{getUserLabel(selected)}</h6></Col>
                <Col md={6} className="text-md-end"><p className="mb-1 text-muted">Periode</p><h6 className="fw-bold">{getBulanLabel(selected.bulan)} {selected.tahun}</h6></Col>
              </Row>
              <hr />
              <Table borderless size="sm">
                <tbody>
                  <tr><td className="fw-semibold">Gaji Pokok</td><td className="text-end">{formatRupiah(selected.gaji_pokok)}</td></tr>
                  <tr><td className="fw-semibold">Total Insentif / Tunjangan</td><td className="text-end text-success">+{formatRupiah(selected.total_insentif)}</td></tr>
                  <tr><td className="fw-semibold">Total Reimburse</td><td className="text-end text-success">+{formatRupiah(selected.total_reimburse || 0)}</td></tr>
                  <tr><td className="fw-semibold">Total Penalti / Potongan</td><td className="text-end text-danger">-{formatRupiah(selected.total_penalti)}</td></tr>
                  <tr style={{ borderTop: '2px solid #eee' }}><td className="fw-bold fs-5 pt-3">Take Home Pay</td><td className="text-end fw-bold fs-5 text-primary pt-3">{formatRupiah(selected.take_home_pay)}</td></tr>
                </tbody>
              </Table>
              <div className="mt-4 pt-3 text-center border-top">
                <p className="mb-1 text-muted">Status Pembayaran</p>
                {renderStatus(selected.status)}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelected(null)}>Tutup</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}