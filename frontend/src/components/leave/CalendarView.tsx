import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, Modal, Button, Table, Badge } from 'react-bootstrap';
import { leaveServices } from '../../services/apiServices';

type LeaveRequest = {
  id: number;
  nama: string;
  tanggal_mulai: string;
  tanggal_akhir: string;
  keterangan: string;
  status: 'pending' | 'approved' | 'rejected';
};

export default function CalendarView() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [tableModal, setTableModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LeaveRequest | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);

        const res = await leaveServices.getAllLeaves();

        const data = res.data?.cuti;

        console.log(data)

        const mapped = data.map((item: any) => ({
          id: item.cuti_id,
          nama: item.nama || item.user?.nama,
          tanggal_mulai: item.tanggal_mulai,
          tanggal_akhir: item.tanggal_akhir,
          keterangan: item.keterangan,
          status: item.status,
        }));


        setLeaveRequests(mapped);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  const leaveEvents = [
    {
      title: 'Calvin - Cuti',
      date: '2026-04-22',
      color: '#ff6b9d',
      extendedProps: {
        keterangan: 'Liburan keluarga',
        status: 'approved'
      }
    },
    {
      title: 'Sarah - Cuti',
      date: '2026-04-23',
      color: '#ff6b9d',
      extendedProps: {
        keterangan: 'Sakit',
        status: 'approved'
      }
    },
    {
      title: 'John - Cuti',
      start: '2026-04-25',
      end: '2026-04-27',
      color: '#ff6b9d',
      extendedProps: {
        keterangan: 'Keperluan pribadi',
        status: 'pending'
      }
    }
  ];

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setShowModal(true);
  };

  // 🔍 Detail tabel
  const handleDetail = (item: LeaveRequest) => {
    setSelectedRow(item);
    setTableModal(true);
  };

  // ✅ Approve
const handleApprove = async (id: number) => {
  try {
    await leaveServices.updateLeaveStatus(id.toString(), 'Approved');

    setLeaveRequests(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'approved' } : item
      )
    );
  } catch (err) {
    console.error(err);
    alert('Gagal approve');
  }
};

  // ❌ Reject
const handleReject = async (id: number) => {
  try {
    await leaveServices.updateLeaveStatus(id.toString(), 'Rejected');

    setLeaveRequests(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'rejected' } : item
      )
    );
  } catch (err) {
    console.error(err);
    alert('Gagal reject');
  }
};

  // 🗑 Delete
  const handleDelete = (id: number) => {
    if (confirm('Yakin hapus data?')) {
      setLeaveRequests(prev => prev.filter(item => item.id !== id));
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'Approved') return <Badge bg="success">Approved</Badge>;
    if (status === 'Pending') return <Badge bg="warning">Pending</Badge>;
    return <Badge bg="danger">Rejected</Badge>;
  };

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: 20 }}>

      {/* HEADER */}
      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: 16,
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white'
        }}
      >
        <h3 className="mb-1">Leave Management</h3>
        <small>Monitor and manage employee leave requests</small>
      </Card>

      {/* CALENDAR */}
      <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
          Calendar Overview
        </h5>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={leaveEvents}
          eventClick={handleEventClick}
          height="600px"
        />
      </Card>

      {/* TABLE */}
      <Card className="p-4 shadow-sm border-0" style={{ borderRadius: 16 }}>
        <h5 className="mb-3 fw-semibold" style={{ color: '#ff3d7f' }}>
          Leave Requests
        </h5>

        <Table hover responsive className="align-middle">
          <thead style={{ background: '#ffe3ec' }}>
            <tr>
              <th>Nama</th>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Status</th>
              <th style={{ width: '360px' }}>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {leaveRequests.map(item => (
              <tr key={item.id}>
                <td className="fw-semibold">{item.nama}</td>

                <td>
                  <small>
                    {item.tanggal_mulai} <br /> s/d {item.tanggal_akhir}
                  </small>
                </td>

                <td>{item.keterangan}</td>

                <td>{renderStatus(item.status)}</td>

                <td>
                  <div className="d-flex gap-2 flex-wrap">

                    <Button
                      size="sm"
                      style={{
                        background: '#0dcaf0',
                        border: 'none'
                      }}
                      onClick={() => handleDetail(item)}
                    >
                      Detail
                    </Button>

                    <Button
                      size="sm"
                      disabled={item.status === 'approved'}
                      onClick={() => handleApprove(item.id)}
                      style={{
                        background: '#28a745',
                        border: 'none'
                      }}
                    >
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      disabled={item.status === 'rejected'}
                      onClick={() => handleReject(item.id)}
                      style={{
                        background: '#ffc107',
                        border: 'none',
                        color: '#000'
                      }}
                    >
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: '#dc3545',
                        border: 'none'
                      }}
                    >
                      Delete
                    </Button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* MODAL CALENDAR */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detail Cuti</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <p><b>Nama:</b> {selectedEvent.title}</p>
              <p><b>Tanggal:</b> {selectedEvent.startStr}</p>
              <p><b>Keterangan:</b> {selectedEvent.extendedProps.keterangan}</p>
              <p><b>Status:</b> {selectedEvent.extendedProps.status}</p>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* MODAL TABLE */}
      <Modal show={tableModal} onHide={() => setTableModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Detail Pengajuan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRow && (
            <>
              <p><b>Nama:</b> {selectedRow.nama}</p>
              <p><b>Tanggal:</b> {selectedRow.tanggal_mulai} - {selectedRow.tanggal_akhir}</p>
              <p><b>Keterangan:</b> {selectedRow.keterangan}</p>
              <p><b>Status:</b> {renderStatus(selectedRow.status)}</p>
            </>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
}