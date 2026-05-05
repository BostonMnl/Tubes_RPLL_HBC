import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import {
  createGaji,
  getMyGaji,
  getGajiByUserId,
  getAllGaji,
  updateGajiTetap,
} from '../../API/controllers/gaji.controller';
import { Gaji } from 'models/gaji';
import { User } from 'models/user';
import { Payroll } from 'models/payroll';

jest.mock('models/gaji', () => ({
  Gaji: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('models/user', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('models/payroll', () => ({
  Payroll: {
    findOne: jest.fn(),
  },
}));

describe('Gaji Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGaji', () => {
    const baseBody = {
      user_id: 'user-1',
      nominal: 5000000,
      tanggal_berlaku: '2026-05-01',
    };

    it('throws when unauthorized', async () => {
      await expect(createGaji({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        createGaji(
          { auth: { id: 'admin-1', role: 'admin' }, body: baseBody } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        createGaji(
          { auth: { id: 'actor-1', role: 'staff', jabatan: 'staff' }, body: baseBody } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('throws when tanggal_berlaku too far in future', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-05T00:00:00Z'));

      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        createGaji(
          {
            auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
            body: { ...baseBody, tanggal_berlaku: '2026-07-15' },
          } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Cannot create salary for more than 1 month in advance',
      });

      jest.useRealTimers();
    });

    it('throws when salary already exists', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue({ gaji_id: 'gaji-1' });

      await expect(
        createGaji(
          { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, body: baseBody } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Gaji for this month period already exists. Use update endpoint.',
      });
    });

    it('creates gaji successfully', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue(null);
      (Gaji.create as any).mockResolvedValue({ gaji_id: 'gaji-1' });

      const result = await createGaji(
        { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, body: baseBody } as any,
        {} as Response
      );

      expect(Gaji.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          nominal: 5000000,
          tanggal_berlaku: expect.any(Date),
        })
      );
      expect(result).toEqual({
        code: 201,
        message: 'Gaji created successfully',
        data: { gaji: { gaji_id: 'gaji-1' } },
      });
    });
  });

  describe('getMyGaji', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyGaji({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when no active salary found', async () => {
      (Gaji.findOne as any).mockResolvedValue(null);

      await expect(
        getMyGaji(
          { auth: { id: 'user-1', role: 'staff' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'No active salary record found',
      });
    });

    it('returns active salary', async () => {
      (Gaji.findOne as any).mockResolvedValue({ gaji_id: 'gaji-1' });

      const result = await getMyGaji(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(Gaji.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-1',
            tanggal_berlaku: { [Op.lte]: expect.any(Date) },
          }),
        })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Active salary retrieved successfully',
        data: { gaji: { gaji_id: 'gaji-1' } },
      });
    });
  });

  describe('getGajiByUserId', () => {
    it('throws when unauthorized', async () => {
      await expect(getGajiByUserId({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getGajiByUserId(
          { auth: { id: 'admin-1', role: 'admin' }, params: { userId: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        getGajiByUserId(
          {
            auth: { id: 'actor-1', role: 'staff', jabatan: 'staff' },
            params: { userId: 'user-1' },
          } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('throws when no active gaji found', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue(null);

      await expect(
        getGajiByUserId(
          {
            auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
            params: { userId: 'user-1' },
          } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'No active gaji found for this user',
      });
    });

    it('returns active salary for user', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue({ gaji_id: 'gaji-1' });

      const result = await getGajiByUserId(
        {
          auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
          params: { userId: 'user-1' },
        } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'User active salary retrieved successfully',
        data: { gaji: { gaji_id: 'gaji-1' } },
      });
    });
  });

  describe('getAllGaji', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllGaji({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when date query invalid', async () => {
      await expect(
        getAllGaji(
          { auth: { id: 'admin-1', role: 'admin' }, query: { date: 'invalid' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Valid date query parameter is required',
      });
    });

    it('returns latest gaji per user', async () => {
      (Gaji.findAll as any).mockResolvedValue([
        { user_id: 'user-1', gaji_id: 'gaji-2' },
        { user_id: 'user-1', gaji_id: 'gaji-1' },
        { user_id: 'user-2', gaji_id: 'gaji-3' },
      ]);

      const result = await getAllGaji(
        { auth: { id: 'admin-1', role: 'admin' }, query: { date: '2026-05-01' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'All users active salaries retrieved successfully',
        data: {
          gaji: [
            { user_id: 'user-1', gaji_id: 'gaji-2' },
            { user_id: 'user-2', gaji_id: 'gaji-3' },
          ],
        },
      });
    });
  });

  describe('updateGajiTetap', () => {
    it('throws when unauthorized', async () => {
      await expect(updateGajiTetap({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when gaji or user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);
      (Gaji.findOne as any).mockResolvedValue(null);

      await expect(
        updateGajiTetap(
          { auth: { id: 'admin-1', role: 'admin' }, params: { userId: 'user-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Gaji or associated user not found',
      });
    });

    it('throws when payroll already exists', async () => {
      const gaji = { user_id: 'user-1', tanggal_berlaku: new Date('2026-05-01') };

      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue(gaji);
      (Payroll.findOne as any).mockResolvedValue({ payroll_id: 'payroll-1' });

      await expect(
        updateGajiTetap(
          { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, params: { userId: 'user-1' }, body: { nominal: 1 } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Cannot update salary: Payroll for this period has already been generated and locked',
      });
    });

    it('throws when no update fields provided', async () => {
      const gaji = { user_id: 'user-1', tanggal_berlaku: new Date('2026-05-01') };

      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue(gaji);
      (Payroll.findOne as any).mockResolvedValue(null);

      await expect(
        updateGajiTetap(
          { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, params: { userId: 'user-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'At least one field must be provided for update',
      });
    });

    it('updates gaji successfully', async () => {
      const gaji = {
        user_id: 'user-1',
        tanggal_berlaku: new Date('2026-05-01'),
        update: jest.fn() as jest.MockedFunction<(data: any) => Promise<void>>,
      };

      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Gaji.findOne as any).mockResolvedValue(gaji);
      (Payroll.findOne as any).mockResolvedValue(null);

      const result = await updateGajiTetap(
        {
          auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
          params: { userId: 'user-1' },
          body: { nominal: 7000000 },
        } as any,
        {} as Response
      );

      expect(gaji.update).toHaveBeenCalledWith(
        expect.objectContaining({ nominal: 7000000 })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Gaji updated successfully',
        data: { gaji },
      });
    });
  });
});
