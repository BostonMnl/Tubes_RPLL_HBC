import { useState, useEffect, useCallback } from 'react';
import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { attendanceServices } from '../../services/apiServices';

// ─── Types ───────────────────────────────────────────────────────────────────

type AttendanceRecord = {
  absensi_id: string;
  user_id: string;
  date: string;
  jam_masuk: string;
  jam_keluar: string | null;
  status: string;
  User?: {
    nama: string;
    jabatan: string;
    departemen: string;
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toTimeStr = (raw: string | null): string => {
  if (!raw) return '—';
  if (raw.includes('T')) return raw.slice(11, 16);
  return raw.slice(0, 5);
};

const getTotalTime = (masuk: string | null, keluar: string | null): string => {
  if (!masuk || !keluar) return '—';
  const inStr  = masuk.includes('T')  ? masuk.slice(11, 16)  : masuk.slice(0, 5);
  const outStr = keluar.includes('T') ? keluar.slice(11, 16) : keluar.slice(0, 5);
  const start  = new Date(`1970-01-01T${inStr}:00`);
  const end    = new Date(`1970-01-01T${outStr}:00`);
  const diff   = (end.getTime() - start.getTime()) / 60000;
  if (diff <= 0) return '—';
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const getDayNumber = (dateStr: string): number => new Date(dateStr).getDate();

const toISO = (d: Date): string => d.toISOString().split('T')[0];

const statusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'hadir': return { color: '#16a34a', bg: '#dcfce7' };
    case 'telat': return { color: '#d97706', bg: '#fef3c7' };
    case 'alpha':  return { color: '#dc2626', bg: '#fee2e2' };
    default:      return { color: '#6b7280', bg: '#f3f4f6' };
  }
};

const STATUS_OPTIONS = [
  { value: '',      label: 'Semua', color: '#ff3d7f' },
  { value: 'Hadir', label: 'Hadir', color: '#16a34a' },
  { value: 'Telat', label: 'Telat', color: '#d97706' },
  { value: 'Alpha',  label: 'Alfa',  color: '#dc2626' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AttendanceList() {
  const [records, setRecords]           = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Filter state — UI only, passed to service on fetch
  const [fromDate, setFromDate]         = useState<Date | null>(null);
  const [toDate, setToDate]             = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // ── Fetch via service ───────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await attendanceServices.getAttendanceManage({
        from:   fromDate ? toISO(fromDate) : undefined,
        to:     toDate   ? toISO(toDate)   : undefined,
        status: statusFilter || undefined,
      });
      setRecords(data.data?.attendance ?? []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
    setStatusFilter('');
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Filter Bar ── */}
      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">

        {/* From date */}
        <div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Dari</div>
          <DatePicker
            selected={fromDate}
            onChange={(d: Date | null) => setFromDate(d)}
            selectsStart
            startDate={fromDate ?? undefined}
            endDate={toDate ?? undefined}
            placeholderText="Dari tanggal"
            className="form-control form-control-sm"
            dateFormat="dd/MM/yyyy"
            isClearable
          />
        </div>

        {/* To date */}
        <div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Sampai</div>
          <DatePicker
            selected={toDate}
            onChange={(d: Date |null) => setToDate(d)}
            selectsEnd
            startDate={fromDate ?? undefined}
            endDate={toDate ?? undefined}
            minDate={fromDate ?? undefined}
            placeholderText="Sampai tanggal"
            className="form-control form-control-sm"
            dateFormat="dd/MM/yyyy"
            isClearable
          />
        </div>

        {/* Status buttons */}
        <div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Status</div>
          <ButtonGroup size="sm">
            {STATUS_OPTIONS.map(({ value, label, color }) => {
              const active = statusFilter === value;
              return (
                <Button
                  key={value}
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                  style={{
                    background:  active ? color : 'transparent',
                    borderColor: color,
                    color:       active ? 'white' : color,
                    fontWeight:  active ? 700 : 400,
                    fontSize:    12,
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </ButtonGroup>
        </div>

        {/* Reset */}
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={handleReset}
          style={{ alignSelf: 'flex-end', fontSize: 12 }}
        >
          ↺ Reset
        </Button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" style={{ color: '#ff3d7f' }} />
        </div>

      ) : error ? (
        <div className="text-center py-3" style={{ color: '#dc2626', fontSize: 13 }}>
          ⚠️ {error}
        </div>

      ) : records.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <div style={{ fontSize: 28 }}>📭</div>
          <div style={{ fontSize: 13 }}>Tidak ada data kehadiran</div>
        </div>

      ) : (
        <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
          {records.map((item) => {
            const masuk  = toTimeStr(item.jam_masuk);
            const keluar = toTimeStr(item.jam_keluar);
            const total  = getTotalTime(item.jam_masuk, item.jam_keluar);
            const day    = getDayNumber(item.date);
            const sc     = statusColor(item.status);

            return (
              <div
                key={item.absensi_id}
                className="mb-2 p-3 d-flex align-items-center gap-3"
                style={{
                  borderRadius: 14,
                  background: '#fff8fb',
                  border: '1px solid #ffe4ee',
                }}
              >
                {/* Day circle */}
                <div
                  style={{
                    minWidth: 52, height: 52, borderRadius: '50%',
                    background: '#ffe3ec', color: '#ff6b9d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18, flexShrink: 0,
                  }}
                >
                  {day}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {item.User?.nama ?? `${item.user_id.substring(0, 8)}…`}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {item.User?.jabatan && `${item.User.jabatan} · `}
                    {item.User?.departemen}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Masuk: <b>{masuk}</b>&nbsp;·&nbsp;
                    Keluar: <b>{keluar}</b>&nbsp;·&nbsp;
                    Total: <b>{total}</b>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: 11, fontWeight: 700,
                    background: sc.bg, color: sc.color,
                    borderRadius: 8, padding: '4px 10px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Record count */}
      {!loading && !error && records.length > 0 && (
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 8 }}>
          {records.length} data ditemukan
        </div>
      )}
    </div>
  );
}