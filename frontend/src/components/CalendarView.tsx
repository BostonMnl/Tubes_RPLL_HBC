import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Card } from 'react-bootstrap';

export default function CalendarView() {
  // Dummy data cuti (nanti dari backend)
  const leaveEvents = [
    {
      title: 'Calvin - Cuti',
      date: '2026-04-22',
      color: '#ff6b9d'
    },
    {
      title: 'Sarah - Cuti',
      date: '2026-04-23',
      color: '#ff6b9d'
    },
    {
      title: 'John - Cuti',
      start: '2026-04-25',
      end: '2026-04-27',
      color: '#ff6b9d'
    }
  ];

  return (
    <Card className="p-4 shadow-sm">
      <h4 className="mb-3">Calendar Cuti Karyawan</h4>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={leaveEvents}
        height="600px"
      />
    </Card>
  );
}