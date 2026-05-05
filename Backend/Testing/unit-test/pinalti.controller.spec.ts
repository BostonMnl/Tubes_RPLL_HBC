import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import {
  syncUnpaidLeavePenalties,
  createPenalti,
  getMyPenalti,
  getPenaltiByUserId,
  getPenaltiById,
  getAllPenalti,
  updatePenalti,
  deletePenalti,
} from '../../API/controllers/pinalti.controller';
import { Penalti } from '../../models/penalti';
import { User } from '../../models/user';
import { Gaji } from '../../models/gaji';

jest.mock('models/penalti', () => ({
  Penalti: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('models/user', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('models/gaji', () => ({
  Gaji: {
    findOne: jest.fn(),
  },
}));

describe('Pinalti Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncUnpaidLeavePenalties', () => {
    it('returns when no active gaji', async () => {
      (Gaji.findOne as any).mockResolvedValue(null);

      await syncUnpaidLeavePenalties('user-1', 5, 2026);

      expect(Penalti.findAll).not.toHaveBeenCalled();
    });

    it('updates penalties based on jumlah_hari', async () => {
      const penalty = { jumlah_hari: 2, update: jest.fn() as jest.MockedFunction<(data: any) => Promise<void>> };

      (Gaji.findOne as any).mockResolvedValue({ nominal: 2200000 });
      (Penalti.findAll as any).mockResolvedValue([penalty]);

      await syncUnpaidLeavePenalties('user-1', 5, 2026);

      expect(penalty.update).toHaveBeenCalledWith({ nominal: 200000 });
    });
  });

  describe('createPenalti', () => {
    const baseBody = {
      user_id: 'user-1',
      jenis: 'Telat Masuk',
      nominal: 1000,
      keterangan: 'Late',
      tanggal: '2026-05-01',
      gambar: '/uploads/penalti.png',
    };

    it('throws when unauthorized', async () => {
      await expect(createPenalti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        createPenalti(
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
        createPenalti(
          { auth: { id: 'actor-1', role: 'staff', jabatan: 'staff' }, body: baseBody } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('creates penalti successfully', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Penalti.create as any).mockResolvedValue({ penalti_id: 'pen-1' });

      const result = await createPenalti(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, body: baseBody } as any,
        {} as Response
      );

      expect(Penalti.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          jenis: 'Telat Masuk',
          nominal: 1000,
          keterangan: 'Late',
          tanggal: expect.any(Date),
          gambar: '/uploads/penalti.png',
        })
      );
      expect(result).toEqual({
        code: 201,
        message: 'Penalti created successfully',
        data: { penalti: { penalti_id: 'pen-1' } },
      });
    });
  });

  describe('getMyPenalti', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyPenalti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns penalti list', async () => {
      (Penalti.findAll as any).mockResolvedValue([{ penalti_id: 'pen-1' }]);

      const result = await getMyPenalti(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'staff' } } as any,
        {} as Response
      );

      expect(Penalti.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            [Op.and]: [
              expect.any(Object),
              { tanggal: { [Op.lte]: expect.any(Date) } },
            ],
          },
        })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Penalti retrieved successfully based on hierarchy',
        data: { penalti: [{ penalti_id: 'pen-1' }] },
      });
    });
  });

  describe('getPenaltiByUserId', () => {
    it('throws when unauthorized', async () => {
      await expect(getPenaltiByUserId({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getPenaltiByUserId(
          { auth: { id: 'admin-1', role: 'admin' }, params: { userId: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('returns user penalties', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Penalti.findAll as any).mockResolvedValue([{ penalti_id: 'pen-1' }]);

      const result = await getPenaltiByUserId(
        { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, params: { userId: 'user-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'User penalties retrieved',
        data: { penalti: [{ penalti_id: 'pen-1' }] },
      });
    });
  });

  describe('getPenaltiById', () => {
    it('throws when unauthorized', async () => {
      await expect(getPenaltiById({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when penalti not found', async () => {
      (Penalti.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getPenaltiById(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pen-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Penalti not found',
      });
    });

    it('returns penalti details', async () => {
      (Penalti.findOne as any).mockResolvedValue({ penalti_id: 'pen-1', user_id: 'user-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await getPenaltiById(
        { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pen-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Penalti details retrieved',
        data: { penalti: { penalti_id: 'pen-1', user_id: 'user-1' } },
      });
    });
  });

  describe('getAllPenalti', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllPenalti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns all penalties', async () => {
      (Penalti.findAll as any).mockResolvedValue([{ penalti_id: 'pen-1' }]);

      const result = await getAllPenalti(
        { auth: { id: 'admin-1', role: 'admin' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'All penalties retrieved',
        data: { penalti: [{ penalti_id: 'pen-1' }] },
      });
    });
  });

  describe('updatePenalti', () => {
    it('throws when unauthorized', async () => {
      await expect(updatePenalti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when penalti not found', async () => {
      (Penalti.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        updatePenalti(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pen-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Penalti not found',
      });
    });

    it('throws when penalti locked by payroll', async () => {
      (Penalti.findOne as any).mockResolvedValue({ user_id: 'user-1', payroll_id: 'pay-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        updatePenalti(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pen-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Penalti is locked by payroll',
      });
    });

    it('updates penalti successfully', async () => {
      const penalti = { user_id: 'user-1', update: jest.fn() as jest.MockedFunction<(data: any) => Promise<void>> };

      (Penalti.findOne as any).mockResolvedValue(penalti);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await updatePenalti(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'pen-1' }, body: { nominal: 2000 } } as any,
        {} as Response
      );

      expect(penalti.update).toHaveBeenCalledWith(
        expect.objectContaining({ nominal: 2000 })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Penalti updated successfully',
        data: { penalti },
      });
    });
  });

  describe('deletePenalti', () => {
    it('throws when unauthorized', async () => {
      await expect(deletePenalti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when penalti not found', async () => {
      (Penalti.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        deletePenalti(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pen-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Penalti not found',
      });
    });

    it('throws when penalti locked by payroll', async () => {
      (Penalti.findOne as any).mockResolvedValue({ user_id: 'user-1', payroll_id: 'pay-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        deletePenalti(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pen-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Penalti is locked by payroll',
      });
    });

    it('deletes penalti successfully', async () => {
      const penalti = { user_id: 'user-1', destroy: jest.fn(async () => undefined) };

      (Penalti.findOne as any).mockResolvedValue(penalti);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await deletePenalti(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'pen-1' } } as any,
        {} as Response
      );

      expect(penalti.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Penalti deleted successfully',
        data: null,
      });
    });
  });
});
