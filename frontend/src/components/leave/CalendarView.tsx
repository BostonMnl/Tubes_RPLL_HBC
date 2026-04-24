import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card, Modal, Button, Table, Badge } from 'react-bootstrap';

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

  // 🔥 Data kalender
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

  // 🔥 Data tabel (pakai state biar bisa update)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 1,
      nama: 'John',
      tanggal_mulai: '2026-04-25',
      tanggal_akhir: '2026-04-27',
      keterangan: 'Keperluan pribadi',
      status: 'pending'
    },
    {
      id: 2,
      nama: 'Sarah',
      tanggal_mulai: '2026-04-23',
      tanggal_akhir: '2026-04-23',
      keterangan: 'Sakit',
      status: 'approved'
    }
  ]);

  // 🔍 Klik kalender
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
  const handleApprove = (id: number) => {
    setLeaveRequests(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'approved' } : item
      )
    );
  };

  // ❌ Reject
  const handleReject = (id: number) => {
    setLeaveRequests(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'rejected' } : item
      )
    );
  };

  // 🗑 Delete
  const handleDelete = (id: number) => {
    if (confirm('Yakin hapus data?')) {
      setLeaveRequests(prev => prev.filter(item => item.id !== id));
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'approved') return <Badge bg="success">Approved</Badge>;
    if (status === 'pending') return <Badge bg="warning">Pending</Badge>;
    return <Badge bg="danger">Rejected</Badge>;
  };

  return (
    <>
      {/* ✅ CALENDAR */}
      <Card className="p-4 shadow-sm mb-4">
        <h4 className="mb-3">Calendar Cuti Karyawan</h4>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={leaveEvents}
          eventClick={handleEventClick}
          height="600px"
        />
      </Card>

      {/* ✅ MODAL CALENDAR */}
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

      {/* ✅ TABEL */}
      <Card className="p-4 shadow-sm">
        <h4 className="mb-3">Pengajuan Cuti</h4>

        <Table striped hover responsive className="align-middle">
          <thead className="bg-pink-100 text-pink-900 border-b-2 border-pink-200">
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
                <td>{item.nama}</td>
                <td>
                  {item.tanggal_mulai} <br /> s/d {item.tanggal_akhir}
                </td>
                <td>{item.keterangan}</td>
                <td>{renderStatus(item.status)}</td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button size="sm" variant="info" onClick={() => handleDetail(item)}>
                      Detail
                    </Button>

                    <Button
                      size="sm"
                      variant="success"
                      disabled={item.status === 'approved'}
                      onClick={() => handleApprove(item.id)}
                    >
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="warning"
                      disabled={item.status === 'rejected'}
                      onClick={() => handleReject(item.id)}
                    >
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
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
    </>
  );
}