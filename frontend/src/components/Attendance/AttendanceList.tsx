import { useState } from 'react';
import { Card, Button, ButtonGroup } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type Attendance = {
  name: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
};

export default function AttendanceList() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' = all

  // 🔹 DATA
  const data: Attendance[] = [
    { name: 'Calvin', date: '2026-04-07', checkIn: '09:00', checkOut: '17:00' },
    { name: 'Sarah', date: '2026-04-08', checkIn: '09:10', checkOut: '17:00' },
    { name: 'John', date: '2026-04-09', checkIn: '08:50', checkOut: '17:30' },
  ];

  // 🔹 HITUNG TOTAL JAM
  const getTotalTime = (checkIn: string, checkOut: string) => {
    const start = new Date(`1970-01-01T${checkIn}:00`);
    const end = new Date(`1970-01-01T${checkOut}:00`);

    const diff = (end.getTime() - start.getTime()) / 1000 / 60;

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return `${hours}h ${minutes}m`;
  };

  // 🔹 AMBIL ANGKA TANGGAL
  const getDayNumber = (date: string) => {
    return new Date(date).getDate();
  };

  // 🔹 STATUS OTOMATIS
  const getStatus = (checkIn: string) => {
    return checkIn > '09:00' ? 'Telat' : 'Hadir';
  };

  // 🔹 FILTER
  const filtered = data.filter((d) => {
    const matchDate = selectedDate
      ? new Date(d.date).toDateString() === selectedDate.toDateString()
      : true;

    const status = getStatus(d.checkIn);

    const matchStatus = statusFilter
      ? status === statusFilter
      : true;

    return matchDate && matchStatus;
  });

  return (
    <Card className="p-4 shadow-sm mt-4">
      <h5 className="text-primary mb-3">Attendance History</h5>

      {/* DATE PICKER */}
      <div className="mb-3">
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => setSelectedDate(date)}
          placeholderText="Pilih tanggal..."
          className="form-control"
        />
      </div>

      {/* STATUS FILTER */}
      <div className="mb-3">
        <ButtonGroup>
          <Button
            variant={statusFilter === '' ? 'primary' : 'outline-primary'}
            onClick={() => setStatusFilter('')}
          >
            All
          </Button>

          <Button
            variant={statusFilter === 'Hadir' ? 'success' : 'outline-success'}
            onClick={() => setStatusFilter('Hadir')}
          >
            Hadir
          </Button>

          <Button
            variant={statusFilter === 'Telat' ? 'warning' : 'outline-warning'}
            onClick={() => setStatusFilter('Telat')}
          >
            Telat
          </Button>
        </ButtonGroup>
      </div>

      <div className="mb-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedDate(null);
            setStatusFilter('');
          }}
        >
          Reset Filter
        </Button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.map((item, i) => {
          const total = getTotalTime(item.checkIn, item.checkOut);
          const day = getDayNumber(item.date);
          const status = getStatus(item.checkIn);

          return (
            <Card
              key={i}
              className="p-3 mb-3 d-flex flex-row align-items-center"
              style={{ borderRadius: '16px' }}
            >
              {/* BULATAN TANGGAL */}
              <div
                className="me-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: '#ffe3ec',
                  color: '#ff6b9d',
                  fontWeight: 'bold'
                }}
              >
                {day}
              </div>

              {/* INFO */}
              <div>
                <h6 className="mb-1">{item.name}</h6>

                <small className="text-muted">
                  Masuk: {item.checkIn} &nbsp;
                  Keluar: {item.checkOut} &nbsp;
                  Total: {total}
                </small>

                <br />

                <span
                  className={
                    status === 'Hadir'
                      ? 'text-success'
                      : 'text-warning'
                  }
                >
                  {status}
                </span>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-muted text-center">No data</p>
        )}
      </div>
    </Card>
  );
}