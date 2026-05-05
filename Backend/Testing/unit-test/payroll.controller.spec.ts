import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import * as payrollController from '../../API/controllers/payroll.controller';
import { Payroll } from 'models/payroll';
import { User } from 'models/user';
import { Gaji } from 'models/gaji';
import { Insentif } from 'models/insentif';
import { Reimburse } from 'models/reimburse';
import { Penalti } from 'models/penalti';
import { syncUnpaidLeavePenalties } from '../../API/controllers/pinalti.controller';

jest.mock('models/payroll', () => ({
  Payroll: {
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

jest.mock('models/gaji', () => ({
  Gaji: {
    findOne: jest.fn(),
  },
}));

jest.mock('models/insentif', () => ({
  Insentif: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('models/reimburse', () => ({
  Reimburse: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('models/penalti', () => ({
  Penalti: {
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../API/controllers/pinalti.controller', () => ({
  syncUnpaidLeavePenalties: jest.fn(),
}));

describe('Payroll Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processUserPayroll', () => {
    it('returns null when payroll already exists', async () => {
      (Payroll.findOne as any).mockResolvedValue({ payroll_id: 'pay-1' });

      const result = await payrollController.processUserPayroll('user-1', 5, 2026);

      expect(result).toBeNull();
      expect(syncUnpaidLeavePenalties).not.toHaveBeenCalled();
    });

    it('creates payroll and links records', async () => {
      (Payroll.findOne as any).mockResolvedValue(null);
      (Gaji.findOne as any).mockResolvedValue({ nominal: 1000 });
      (Insentif.findAll as any).mockResolvedValue([{ nominal: 100 }, { nominal: 50 }]);
      (Penalti.findAll as any).mockResolvedValue([{ nominal: 30 }]);
      (Reimburse.findAll as any).mockResolvedValue([{ nominal: 20 }]);
      (Payroll.create as any).mockResolvedValue({ payroll_id: 'pay-1' });

      const result = await payrollController.processUserPayroll('user-1', 5, 2026);

      expect(syncUnpaidLeavePenalties).toHaveBeenCalledWith('user-1', 5, 2026);
      expect(Payroll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          bulan: 5,
          tahun: 2026,
          gaji_pokok: 1000,
          total_insentif: 150,
          total_reimburse: 20,
          total_penalti: 30,
          take_home_pay: 1140,
        })
      );
      expect(Insentif.update).toHaveBeenCalledWith(
        { payroll_id: 'pay-1' },
        { where: expect.objectContaining({ user_id: 'user-1', payroll_id: null, tanggal: { [Op.between]: expect.any(Array) } }) }
      );
      expect(Penalti.update).toHaveBeenCalledWith(
        { payroll_id: 'pay-1' },
        { where: expect.objectContaining({ user_id: 'user-1', payroll_id: null, tanggal: { [Op.between]: expect.any(Array) } }) }
      );
      expect(Reimburse.update).toHaveBeenCalledWith(
        { payroll_id: 'pay-1' },
        { where: expect.objectContaining({ user_id: 'user-1', payroll_id: null, tanggal: { [Op.between]: expect.any(Array) } }) }
      );
      expect(result).toEqual({ payroll_id: 'pay-1' });
    });
  });

  describe('createPayroll', () => {
    it('throws when unauthorized', async () => {
      await expect(payrollController.createPayroll({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        payrollController.createPayroll(
          { auth: { id: 'admin-1', role: 'admin' }, body: { user_id: 'user-1', bulan: 5, tahun: 2026 } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('throws when payroll already exists', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      const spy = jest.spyOn(payrollController, 'processUserPayroll').mockResolvedValue(null);

      await expect(
        payrollController.createPayroll(
          {
            auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
            body: { user_id: 'user-1', bulan: 5, tahun: 2026 },
          } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Payroll for this period already exists',
      });

      spy.mockRestore();
    });
  });

  describe('getMyPayroll', () => {
    it('throws when unauthorized', async () => {
      await expect(payrollController.getMyPayroll({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns payroll list', async () => {
      (Payroll.findAll as any).mockResolvedValue([{ payroll_id: 'pay-1' }]);

      const result = await payrollController.getMyPayroll(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Payroll retrieved successfully',
        data: { payroll: [{ payroll_id: 'pay-1' }] },
      });
    });
  });

  describe('getPayrollByUserId', () => {
    it('throws when unauthorized', async () => {
      await expect(payrollController.getPayrollByUserId({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        payrollController.getPayrollByUserId(
          { auth: { id: 'admin-1', role: 'admin' }, params: { userId: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });
  });

  describe('getPayrollById', () => {
    it('throws when unauthorized', async () => {
      await expect(payrollController.getPayrollById({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when payroll not found', async () => {
      (Payroll.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        payrollController.getPayrollById(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pay-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Payroll record not found',
      });
    });

    it('returns payroll for admin', async () => {
      (Payroll.findOne as any).mockResolvedValue({ payroll_id: 'pay-1', user_id: 'user-1' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await payrollController.getPayrollById(
        { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pay-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Payroll record retrieved successfully',
        data: { payroll: { payroll_id: 'pay-1', user_id: 'user-1' } },
      });
    });
  });

  describe('getAllPayroll', () => {
    it('throws when unauthorized', async () => {
      await expect(payrollController.getAllPayroll({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns all payroll records', async () => {
      (Payroll.findAll as any).mockResolvedValue([{ payroll_id: 'pay-1' }]);

      const result = await payrollController.getAllPayroll(
        { auth: { id: 'admin-1', role: 'admin' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'All payroll records retrieved successfully',
        data: { payroll: [{ payroll_id: 'pay-1' }] },
      });
    });
  });

  describe('deletePayroll', () => {
    it('throws when unauthorized', async () => {
      await expect(payrollController.deletePayroll({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when payroll not found', async () => {
      (Payroll.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        payrollController.deletePayroll(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'pay-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Payroll record not found',
      });
    });

    it('deletes payroll and unlinks records', async () => {
      const payroll = { payroll_id: 'pay-1', user_id: 'user-1', destroy: jest.fn(async () => undefined) };

      (Payroll.findOne as any).mockResolvedValue(payroll);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await payrollController.deletePayroll(
        { auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' }, params: { id: 'pay-1' } } as any,
        {} as Response
      );

      expect(Insentif.update).toHaveBeenCalledWith({ payroll_id: null }, { where: { payroll_id: 'pay-1' } });
      expect(Penalti.update).toHaveBeenCalledWith({ payroll_id: null }, { where: { payroll_id: 'pay-1' } });
      expect(Reimburse.update).toHaveBeenCalledWith({ payroll_id: null }, { where: { payroll_id: 'pay-1' } });
      expect(payroll.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Payroll record deleted successfully. Linked records unlinked.',
        data: null,
      });
    });
  });
});
