import { Response } from 'express';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Absensi } from '../../models/absensi';
import { AbsensiStart } from '../../models/absensi_start';
import { v4 as uuidv4 } from 'uuid';

const cacheStore = new Map<string, string>();
const cacheGet = jest.fn((key: string) => cacheStore.get(key));
const cacheSet = jest.fn((key: string, value: string, _ttl?: number) => {
  cacheStore.set(key, value);
  return true;
});

jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: cacheGet,
    set: cacheSet,
    del: jest.fn((key: string) => cacheStore.delete(key)),
  }));
});

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('../../models/absensi', () => ({
  Absensi: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../models/absensi_start', () => ({
  AbsensiStart: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

let controller: typeof import('../../API/controllers/attendance.controller');
let setIntervalSpy: ReturnType<typeof jest.spyOn>;
let consoleSpy: ReturnType<typeof jest.spyOn>;

const mockNowMs = new Date('2026-05-05T01:02:03.000Z').getTime();

const createActiveStartRecord = (minutesAgo: number) => ({
  absensi_dimulai: new Date(mockNowMs - minutesAgo * 60 * 1000),
});

beforeAll(async () => {
  setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => 0 as any);
  controller = await import('../../API/controllers/attendance.controller');
});

afterAll(() => {
  setIntervalSpy.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  cacheStore.clear();
  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleSpy.mockRestore();
});

describe('Attendance Controller', () => {
  describe('getCurrentQr', () => {
    it('throws when attendance is not active', async () => {
      (AbsensiStart.findOne as any).mockResolvedValue(null);

      await expect(controller.getCurrentQr({} as any, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Attendance not started or expired',
      });
    });

    it('returns existing QR when cache has it', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(5));
      cacheStore.set('attendance:current_qr', 'qr-existing');

      const result = await controller.getCurrentQr({} as any, {} as Response);

      expect(result).toEqual({
        code: 200,
        message: 'QR fetched',
        data: { qr_token: 'qr-existing', expires_in: 20 },
      });
      expect(uuidv4).not.toHaveBeenCalled();
      nowSpy.mockRestore();
    });

    it('generates new QR when cache is empty', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(5));
      (uuidv4 as any).mockReturnValue('qr-new');

      const result = await controller.getCurrentQr({} as any, {} as Response);

      expect(result).toEqual({
        code: 200,
        message: 'QR generated',
        data: { qr_token: 'qr-new', expires_in: 20 },
      });
      expect(cacheSet).toHaveBeenCalledWith('attendance:current_qr', 'qr-new', 20);
      nowSpy.mockRestore();
    });
  });

  describe('recordStart', () => {
    it('throws when user is unauthorized', async () => {
      await expect(controller.recordStart({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns existing record within active window', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      const existingRecord = createActiveStartRecord(10);
      (AbsensiStart.findOne as any).mockResolvedValue(existingRecord);
      (uuidv4 as any).mockReturnValue('qr-new');

      const result = await controller.recordStart(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Record start accepted',
        data: {
          qr_token: 'qr-new',
          record: existingRecord,
        },
      });
      expect(AbsensiStart.create).not.toHaveBeenCalled();
      nowSpy.mockRestore();
    });

    it('throws when existing record is expired', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(70));

      await expect(
        controller.recordStart(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Record start expired',
      });

      nowSpy.mockRestore();
    });

    it('creates new record when none exists', async () => {
      (AbsensiStart.findOne as any).mockResolvedValue(null);
      (AbsensiStart.create as any).mockResolvedValue({ id: 'record-1' });
      (uuidv4 as any).mockReturnValue('qr-new');

      const result = await controller.recordStart(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' } } as any,
        {} as Response
      );

      expect(AbsensiStart.create).toHaveBeenCalledWith({
        absensi_dimulai: expect.any(Date),
        user_id: 'user-1',
      });
      expect(result).toEqual({
        code: 201,
        message: 'Record start created',
        data: {
          qr_token: 'qr-new',
          record: { id: 'record-1' },
        },
      });
    });
  });

  describe('scanAttendance', () => {
    it('throws when user is unauthorized', async () => {
      await expect(controller.scanAttendance({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when qr_token is missing', async () => {
      await expect(
        controller.scanAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Missing qr_token',
      });
    });

    it('throws when attendance is not active', async () => {
      (AbsensiStart.findOne as any).mockResolvedValue(null);

      await expect(
        controller.scanAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_token: 'qr' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Attendance not started or expired',
      });
    });

    it('throws when QR is invalid', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(5));
      cacheStore.set('attendance:current_qr', 'qr-valid');

      await expect(
        controller.scanAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_token: 'qr-wrong' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Invalid or expired QR',
      });

      nowSpy.mockRestore();
    });

    it('throws when QR already used', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(5));
      cacheStore.set('attendance:current_qr', 'qr-valid');
      cacheStore.set('attendance:used:qr-valid', '1');

      await expect(
        controller.scanAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_token: 'qr-valid' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'QR already used',
      });

      nowSpy.mockRestore();
    });

    it('throws when attendance already recorded', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(5));
      cacheStore.set('attendance:current_qr', 'qr-valid');
      (Absensi.findOne as any).mockResolvedValue({ id: 'attendance-1' });

      await expect(
        controller.scanAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_token: 'qr-valid' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 409,
        message: 'Attendance already recorded for today',
      });

      nowSpy.mockRestore();
    });

    it('records attendance with Hadir status', async () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockNowMs);
      (AbsensiStart.findOne as any).mockResolvedValue(createActiveStartRecord(5));
      cacheStore.set('attendance:current_qr', 'qr-valid');
      (Absensi.findOne as any).mockResolvedValue(null);
      (Absensi.create as any).mockResolvedValue({ id: 'attendance-1' });

      const result = await controller.scanAttendance(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_token: 'qr-valid' } } as any,
        {} as Response
      );

      expect(Absensi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(String),
          jam_masuk: expect.any(String),
          jam_keluar: null,
          status: 'Hadir',
          qr_code: 'qr-valid',
          user_id: 'user-1',
        })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Attendance recorded',
        data: { attendance: { id: 'attendance-1' } },
      });

      nowSpy.mockRestore();
    });
  });

  describe('getCheckoutQr', () => {
    it('throws when user is unauthorized', async () => {
      await expect(controller.getCheckoutQr({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when no open attendance exists', async () => {
      (Absensi.findOne as any).mockResolvedValue(null);

      await expect(
        controller.getCheckoutQr(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'No active attendance found',
      });
    });

    it('returns QR code when open attendance exists', async () => {
      (Absensi.findOne as any).mockResolvedValue({ qr_code: 'qr-checkout' });

      const result = await controller.getCheckoutQr(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Checkout QR fetched',
        data: { qr_code: 'qr-checkout' },
      });
    });
  });

  describe('checkoutAttendance', () => {
    it('throws when user is unauthorized', async () => {
      await expect(controller.checkoutAttendance({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when qr_code is missing', async () => {
      await expect(
        controller.checkoutAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Missing qr_code',
      });
    });

    it('throws when checkout QR is invalid', async () => {
      (Absensi.findOne as any).mockResolvedValue({ qr_code: 'qr-other' });

      await expect(
        controller.checkoutAttendance(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_code: 'qr-wrong' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Invalid checkout QR',
      });
    });

    it('records checkout time when QR matches', async () => {
      const attendance = {
        qr_code: 'qr-valid',
        jam_keluar: null as string | null,
        save: jest.fn(async () => undefined),
      };
      (Absensi.findOne as any).mockResolvedValue(attendance);

      const result = await controller.checkoutAttendance(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'Staff' }, body: { qr_code: 'qr-valid' } } as any,
        {} as Response
      );

      expect(attendance.jam_keluar).toEqual(expect.any(String));
      expect(attendance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Checkout recorded',
        data: { attendance },
      });
    });
  });
});
