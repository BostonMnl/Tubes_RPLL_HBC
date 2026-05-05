import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import { Absensi } from '../../models/absensi';
import { User } from '../../models/user';
import { getAllAttendance, patchAttendance } from '../../API/controllers/attendanceManage.controller';

jest.mock('../../models/absensi', () => ({
  Absensi: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

jest.mock('../../models/user', () => ({
  User: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
}));

describe('Attendance Manage Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAttendance', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllAttendance({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when from date is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        query: { from: 'invalid-date' },
      } as any;

      await expect(getAllAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'from must be a valid date',
      });
    });

    it('throws when to date is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        query: { to: 'invalid-date' },
      } as any;

      await expect(getAllAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'to must be a valid date',
      });
    });

    it('returns attendance for admin with filters', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        query: {
          user_id: 'user-2',
          status: 'Hadir',
          from: '2026-05-01',
          to: '2026-05-05',
        },
      } as any;

      (Absensi.findAll as any).mockResolvedValue([{ id: 'attendance-1' }]);

      const result = await getAllAttendance(req, {} as Response);

      expect(Absensi.findAll).toHaveBeenCalledWith({
        where: {
          user_id: 'user-2',
          status: 'Hadir',
          date: { [Op.between]: [new Date('2026-05-01'), new Date('2026-05-05')] },
        },
        order: [
          ['date', 'DESC'],
          ['jam_masuk', 'DESC'],
        ],
      });
      expect(result).toEqual({
        code: 200,
        message: 'Attendance fetched successfully',
        data: { attendance: [{ id: 'attendance-1' }] },
      });
    });

    it('throws when non-admin user is not found', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        query: {},
      } as any;

      (User.findByPk as any).mockResolvedValue(null);

      await expect(getAllAttendance(req, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when non-admin has insufficient role', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        query: {},
      } as any;

      (User.findByPk as any).mockResolvedValue({
        jabatan: 'staff',
        departemen: 'IT',
        deletedAt: null,
      });

      await expect(getAllAttendance(req, {} as Response)).rejects.toEqual({
        code: 403,
        message: 'Forbidden : insufficient WEWENANG',
      });
    });

    it('throws when requested user is not allowed', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        query: { user_id: 'user-99' },
      } as any;

      (User.findByPk as any).mockResolvedValue({
        jabatan: 'manager',
        departemen: 'IT',
        deletedAt: null,
      });
      (User.findAll as any).mockResolvedValue([{ user_id: 'user-2' }]);

      await expect(getAllAttendance(req, {} as Response)).rejects.toEqual({
        code: 403,
        message: 'Forbidden : insufficient WEWENANG',
      });
    });

    it('returns attendance for allowed non-admin scope', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        query: {},
      } as any;

      (User.findByPk as any).mockResolvedValue({
        jabatan: 'supervisor',
        departemen: 'IT',
        deletedAt: null,
      });
      (User.findAll as any).mockResolvedValue([{ user_id: 'user-2' }, { user_id: 'user-3' }]);
      (Absensi.findAll as any).mockResolvedValue([{ id: 'attendance-1' }]);

      const result = await getAllAttendance(req, {} as Response);

      expect(Absensi.findAll).toHaveBeenCalledWith({
        where: { user_id: { [Op.in]: ['user-2', 'user-3'] } },
        order: [
          ['date', 'DESC'],
          ['jam_masuk', 'DESC'],
        ],
      });
      expect(result).toEqual({
        code: 200,
        message: 'Attendance fetched successfully',
        data: { attendance: [{ id: 'attendance-1' }] },
      });
    });
  });

  describe('patchAttendance', () => {
    it('throws when unauthorized', async () => {
      await expect(patchAttendance({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when attendance id is missing', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: {},
        body: { status: 'Hadir' },
      } as any;

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Attendance id is required',
      });
    });

    it('throws when no fields provided', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: {},
      } as any;

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'No fields provided to update',
      });
    });

    it('throws when record not found', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { status: 'Hadir' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue(null);

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'Attendance record not found',
      });
    });

    it('throws when date is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { date: 'invalid-date' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue({});

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'date must be a valid date',
      });
    });

    it('throws when jam_masuk is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { jam_masuk: '99:99' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue({});

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'jam_masuk must be HH:MM or HH:MM:SS',
      });
    });

    it('throws when jam_keluar is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { jam_keluar: '99:99' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue({});

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'jam_keluar must be HH:MM or HH:MM:SS or null',
      });
    });

    it('throws when status is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { status: 'Other' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue({});

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'status must be one of: Hadir, Sakit, Cuti, Alpha',
      });
    });

    it('throws when qr_code is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { qr_code: ' ' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue({});

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'qr_code must be a valid string',
      });
    });

    it('throws when user_id is invalid', async () => {
      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: { user_id: '' },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue({});

      await expect(patchAttendance(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'user_id must be a valid string',
      });
    });

    it('updates attendance when valid', async () => {
      const attendance = {
        date: new Date('2026-05-01'),
        jam_masuk: '08:00',
        jam_keluar: null as string | null,
        status: 'Hadir',
        qr_code: 'qr-1',
        user_id: 'user-1',
        updatedAt: undefined as Date | undefined,
        save: jest.fn(async () => undefined),
      };

      const req = {
        auth: { id: 'user-1', role: 'admin' },
        params: { id: 'attendance-1' },
        body: {
          date: '2026-05-02',
          jam_masuk: '09:30',
          jam_keluar: '18:00',
          status: 'Cuti',
          qr_code: 'qr-2',
          user_id: 'user-2',
        },
      } as any;

      (Absensi.findByPk as any).mockResolvedValue(attendance);

      const result = await patchAttendance(req, {} as Response);

      expect(attendance.date).toEqual(new Date('2026-05-02'));
      expect(attendance.jam_masuk).toBe('09:30');
      expect(attendance.jam_keluar).toBe('18:00');
      expect(attendance.status).toBe('Cuti');
      expect(attendance.qr_code).toBe('qr-2');
      expect(attendance.user_id).toBe('user-2');
      expect(attendance.updatedAt).toEqual(expect.any(Date));
      expect(attendance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Attendance updated successfully',
        data: { attendance },
      });
    });
  });
});
