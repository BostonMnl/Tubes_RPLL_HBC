import { Card, Button, Row, Col, Table, Badge } from 'react-bootstrap';

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

type Props = {
  user: User;
  goBack: () => void;
};

export default function UserDetail({ user, goBack }: Props) {

  const attendance = [
    { date: '2026-04-20', status: 'Hadir' },
    { date: '2026-04-21', status: 'Telat' },
    { date: '2026-04-22', status: 'Cuti' },
  ];

  return (
    <div>
      <Button className="mb-3" onClick={goBack}>
        ← Back
      </Button>

      {/* USER INFO */}
      <Card className="p-4 shadow-sm mb-4">
        <h4>{user.nama}</h4>
        <Badge bg="primary">{user.role}</Badge>

        <Row className="mt-3">
          <Col md={6}>
            <p><b>User ID:</b> {user.user_id}</p>
            <p><b>Email:</b> {user.email}</p>
            <p><b>Alamat:</b> {user.alamat}</p>
          </Col>
          <Col md={6}>
            <p><b>Jabatan:</b> {user.jabatan}</p>
            <p><b>Departemen:</b> {user.departemen}</p>
            <p><b>Manager ID:</b> {user.manager_id}</p>
          </Col>
        </Row>
      </Card>

      {/* ABSENSI */}
      <Card className="p-4 shadow-sm">
        <h5>Log Absensi</h5>

        <Table striped className="mt-3">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attendance.map((a, i) => (
              <tr key={i}>
                <td>{a.date}</td>
                <td>
                  <span className={
                    a.status === 'Hadir'
                      ? 'text-success'
                      : a.status === 'Telat'
                      ? 'text-warning'
                      : 'text-danger'
                  }>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}