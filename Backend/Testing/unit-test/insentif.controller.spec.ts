import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import {
  createInsentif,
  getMyInsentif,
  getInsentifByUserId,
  getInsentifById,
  getAllInsentif,
  updateInsentif,
  deleteInsentif,
} from '../../API/controllers/insentif.controller';
import { Insentif } from '../../models/insentif';
import { User } from '../../models/user';

jest.mock('models/insentif', () => ({
  Insentif: {
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

describe('Insentif Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInsentif', () => {
    const baseBody = {
      user_id: 'user-1',
      nominal: 100000,
      keterangan: 'Bonus',
      tanggal: '2026-05-01',
      gambar: '/uploads/bonus.png',
    };

    it('throws when unauthorized', async () => {
      await expect(createInsentif({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        createInsentif(
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
        createInsentif(
          { auth: { id: 'actor-1', role: 'staff', jabatan: 'staff' }, body: baseBody } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('creates insentif successfully', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Insentif.create as any).mockResolvedValue({ insentif_id: 'insentif-1' });

      const result = await createInsentif(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, body: baseBody } as any,
        {} as Response
      );

      expect(Insentif.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          nominal: 100000,
          keterangan: 'Bonus',
          tanggal: expect.any(Date),
          gambar: '/uploads/bonus.png',
        })
      );
      expect(result).toEqual({
        code: 201,
        message: 'Insentif created successfully',
        data: { insentif: { insentif_id: 'insentif-1' } },
      });
    });
  });

  describe('getMyInsentif', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyInsentif({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns incentives for user', async () => {
      (Insentif.findAll as any).mockResolvedValue([{ insentif_id: 'insentif-1' }]);

      const result = await getMyInsentif(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(Insentif.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user_id: 'user-1',
            tanggal: { [Op.lte]: expect.any(Date) },
          },
        })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Insentif retrieved successfully',
        data: { insentif: [{ insentif_id: 'insentif-1' }] },
      });
    });
  });

  describe('getInsentifByUserId', () => {
    it('throws when unauthorized', async () => {
      await expect(getInsentifByUserId({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getInsentifByUserId(
          { auth: { id: 'admin-1', role: 'admin' }, params: { userId: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'manager' });

      await expect(
        getInsentifByUserId(
          { auth: { id: 'actor-1', role: 'staff', jabatan: 'manager' }, params: { userId: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Supervisor can manage Manager records',
      });
    });

    it('returns user incentives', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Insentif.findAll as any).mockResolvedValue([{ insentif_id: 'insentif-1' }]);

      const result = await getInsentifByUserId(
        { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, params: { userId: 'user-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'User incentives retrieved',
        data: { insentif: [{ insentif_id: 'insentif-1' }] },
      });
    });
  });

  describe('getInsentifById', () => {
    it('throws when unauthorized', async () => {
      await expect(getInsentifById({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when insentif not found', async () => {
      (Insentif.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getInsentifById(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'insentif-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Insentif not found',
      });
    });

    it('returns insentif details for admin', async () => {
      (Insentif.findOne as any).mockResolvedValue({ insentif_id: 'insentif-1', user_id: 'user-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await getInsentifById(
        { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'insentif-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Insentif details retrieved',
        data: { insentif: { insentif_id: 'insentif-1', user_id: 'user-1' } },
      });
    });
  });

  describe('getAllInsentif', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllInsentif({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns list', async () => {
      (Insentif.findAll as any).mockResolvedValue([{ insentif_id: 'insentif-1' }]);

      const result = await getAllInsentif(
        { auth: { id: 'admin-1', role: 'admin' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'All incentives retrieved',
        data: { insentif: [{ insentif_id: 'insentif-1' }] },
      });
    });
  });

  describe('updateInsentif', () => {
    it('throws when unauthorized', async () => {
      await expect(updateInsentif({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when insentif not found', async () => {
      (Insentif.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        updateInsentif(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'insentif-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Insentif not found',
      });
    });

    it('throws when insentif locked by payroll', async () => {
      (Insentif.findOne as any).mockResolvedValue({ user_id: 'user-1', payroll_id: 'payroll-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        updateInsentif(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'insentif-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Insentif is locked by payroll',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (Insentif.findOne as any).mockResolvedValue({ user_id: 'user-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        updateInsentif(
          { auth: { id: 'actor-1', role: 'staff', jabatan: 'staff' }, params: { id: 'insentif-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('updates insentif successfully', async () => {
      const insentif = { user_id: 'user-1', update: jest.fn() as jest.MockedFunction<(data: any) => Promise<void>>};

      (Insentif.findOne as any).mockResolvedValue(insentif);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await updateInsentif(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'insentif-1' }, body: { nominal: 200000 } } as any,
        {} as Response
      );

      expect(insentif.update).toHaveBeenCalledWith(
        expect.objectContaining({ nominal: 200000 })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Insentif updated successfully',
        data: { insentif },
      });
    });
  });

  describe('deleteInsentif', () => {
    it('throws when unauthorized', async () => {
      await expect(deleteInsentif({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when insentif not found', async () => {
      (Insentif.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        deleteInsentif(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'insentif-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Insentif not found',
      });
    });

    it('throws when insentif locked by payroll', async () => {
      (Insentif.findOne as any).mockResolvedValue({ user_id: 'user-1', payroll_id: 'payroll-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        deleteInsentif(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'insentif-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Insentif is locked by payroll',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (Insentif.findOne as any).mockResolvedValue({ user_id: 'user-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        deleteInsentif(
          { auth: { id: 'actor-1', role: 'staff', jabatan: 'staff' }, params: { id: 'insentif-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('deletes insentif successfully', async () => {
      const insentif = { user_id: 'user-1', destroy: jest.fn(async () => undefined) };

      (Insentif.findOne as any).mockResolvedValue(insentif);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await deleteInsentif(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'insentif-1' } } as any,
        {} as Response
      );

      expect(insentif.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Insentif deleted successfully',
        data: null,
      });
    });
  });
});
