import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Op } from 'sequelize';
import {
  createMyCutiRequest,
  createRequestCutiForUser,
  getMyCuti,
  getCutiByUserId,
  getAllCutiRequests,
  getAllCuti,
  approveDeclineCutiRequest,
  getRemainingCutiQuota,
  deleteMyCutiRequest,
} from '../../API/controllers/cuti.controller';
import { Cuti } from '../../models/cuti';
import { User } from '../../models/user';
import { Absensi } from '../../models/absensi';

jest.mock('models/cuti', () => ({
  Cuti: {
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

jest.mock('models/absensi', () => ({
  Absensi: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Cuti Controller', () => {
  const basePayload = {
    user_id: 'user-1',
    tanggal_mulai: '2026-05-01',
    tanggal_akhir: '2026-05-01',
    jenis_cuti: 'Cuti_Tahunan',
    keterangan: 'Urgen',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMyCutiRequest', () => {
    it('throws when unauthorized', async () => {
      await expect(createMyCutiRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('auto-approves for supervisor and creates absensi', async () => {
      (Cuti.create as any).mockResolvedValue({
        status: 'Approved',
        jenis_cuti: 'Cuti_Tahunan',
        tanggal_mulai: basePayload.tanggal_mulai,
        tanggal_akhir: basePayload.tanggal_akhir,
        user_id: 'user-1',
      });
      (Absensi.findOne as any).mockResolvedValue(null);

      const result = await createMyCutiRequest(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'supervisor' }, body: basePayload } as any,
        {} as Response
      );

      expect(Cuti.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'Approved',
          disetujui_oleh: 'user-1',
        })
      );
      expect(Absensi.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 201,
        message: 'Cuti request created successfully',
        data: { cuti: expect.any(Object) },
      });
    });

    it('creates pending request for non-supervisor', async () => {
      (Cuti.create as any).mockResolvedValue({ status: 'Pending' });

      const result = await createMyCutiRequest(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'staff' }, body: basePayload } as any,
        {} as Response
      );

      expect(Cuti.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'Pending',
        })
      );
      expect(Absensi.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        code: 201,
        message: 'Cuti request created successfully',
        data: { cuti: { status: 'Pending' } },
      });
    });
  });

  describe('createRequestCutiForUser', () => {
    it('throws when unauthorized', async () => {
      await expect(createRequestCutiForUser({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        createRequestCutiForUser(
          { auth: { id: 'admin-1', role: 'admin' }, body: basePayload } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-2', jabatan: 'manager' });

      await expect(
        createRequestCutiForUser(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'manager' }, body: basePayload } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Supervisor can manage Manager records',
      });
    });

    it('creates approved request and absensi', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-2', jabatan: 'staff' });
      (Cuti.create as any).mockResolvedValue({
        status: 'Approved',
        jenis_cuti: 'Cuti_Tahunan',
        tanggal_mulai: basePayload.tanggal_mulai,
        tanggal_akhir: basePayload.tanggal_akhir,
        user_id: 'user-2',
      });
      (Absensi.findOne as any).mockResolvedValue(null);

      const result = await createRequestCutiForUser(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, body: basePayload } as any,
        {} as Response
      );

      expect(Cuti.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'Approved',
          disetujui_oleh: 'manager-1',
        })
      );
      expect(Absensi.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 201,
        message: 'Cuti request created successfully',
        data: { cuti: expect.any(Object) },
      });
    });
  });

  describe('getMyCuti', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyCuti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns list', async () => {
      (Cuti.findAll as any).mockResolvedValue([{ cuti_id: 'cuti-1' }]);

      const result = await getMyCuti(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(Cuti.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 'user-1' } })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Cuti fetched successfully',
        data: { cuti: [{ cuti_id: 'cuti-1' }] },
      });
    });
  });

  describe('getCutiByUserId', () => {
    it('throws when unauthorized', async () => {
      await expect(getCutiByUserId({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getCutiByUserId(
          { auth: { id: 'user-1', role: 'staff' }, params: { id: 'user-2' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-2', jabatan: 'manager' });

      await expect(
        getCutiByUserId(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'manager' }, params: { id: 'user-2' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Supervisor can manage Manager records',
      });
    });

    it('returns list for self', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Cuti.findAll as any).mockResolvedValue([{ cuti_id: 'cuti-1' }]);

      const result = await getCutiByUserId(
        { auth: { id: 'user-1', role: 'staff' }, params: { id: 'user-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Cuti fetched successfully',
        data: { cuti: [{ cuti_id: 'cuti-1' }] },
      });
    });
  });

  describe('getAllCutiRequests', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllCutiRequests({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('defaults to pending status', async () => {
      (Cuti.findAll as any).mockResolvedValue([]);

      await getAllCutiRequests(
        { auth: { id: 'admin-1', role: 'admin' }, query: {} } as any,
        {} as Response
      );

      expect(Cuti.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'Pending' } })
      );
    });

    it('accepts provided status', async () => {
      (Cuti.findAll as any).mockResolvedValue([]);

      await getAllCutiRequests(
        { auth: { id: 'admin-1', role: 'admin' }, query: { status: 'Approved' } } as any,
        {} as Response
      );

      expect(Cuti.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'Approved' } })
      );
    });
  });

  describe('getAllCuti', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllCuti({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns list', async () => {
      (Cuti.findAll as any).mockResolvedValue([{ cuti_id: 'cuti-1' }]);

      const result = await getAllCuti(
        { auth: { id: 'admin-1', role: 'admin' } } as any,
        {} as Response
      );

      expect(Cuti.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
      expect(result).toEqual({
        code: 200,
        message: 'All cuti fetched successfully',
        data: { cuti: [{ cuti_id: 'cuti-1' }] },
      });
    });
  });

  describe('approveDeclineCutiRequest', () => {
    it('throws when unauthorized', async () => {
      await expect(approveDeclineCutiRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when status invalid', async () => {
      await expect(
        approveDeclineCutiRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'cuti-1' }, body: { status: 'Other' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Invalid status value',
      });
    });

    it('throws when record not found', async () => {
      (Cuti.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        approveDeclineCutiRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'cuti-1' }, body: { status: 'Approved' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Cuti record or associated user not found',
      });
    });

    it('throws when hierarchy forbidden', async () => {
      (Cuti.findOne as any).mockResolvedValue({ user_id: 'user-2' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-2', jabatan: 'staff' });

      await expect(
        approveDeclineCutiRequest(
          { auth: { id: 'user-1', role: 'staff', jabatan: 'staff' }, params: { id: 'cuti-1' }, body: { status: 'Approved' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: Only Manager or Supervisor can manage Staff records',
      });
    });

    it('approves and creates absensi', async () => {
      const cuti = {
        user_id: 'user-2',
        status: 'Pending',
        jenis_cuti: 'Cuti_Tahunan',
        tanggal_mulai: basePayload.tanggal_mulai,
        tanggal_akhir: basePayload.tanggal_akhir,
        disetujui_oleh: undefined as string | undefined,
        save: jest.fn(async () => undefined),
      };

      (Cuti.findOne as any).mockResolvedValue(cuti);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-2', jabatan: 'manager' });
      (Absensi.findOne as any).mockResolvedValue(null);

      const result = await approveDeclineCutiRequest(
        {
          auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
          params: { id: 'cuti-1' },
          body: { status: 'Approved' },
        } as any,
        {} as Response
      );

      expect(cuti.status).toBe('Approved');
      expect(cuti.disetujui_oleh).toBe('supervisor-1');
      expect(cuti.save).toHaveBeenCalledTimes(1);
      expect(Absensi.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Cuti request approved successfully',
        data: { cuti },
      });
    });
  });

  describe('getRemainingCutiQuota', () => {
    it('throws when unauthorized', async () => {
      await expect(getRemainingCutiQuota({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('calculates remaining quota', async () => {
      (Cuti.findAll as any).mockResolvedValue([
        { tanggal_mulai: '2026-05-01', tanggal_akhir: '2026-05-01' },
        { tanggal_mulai: '2026-05-10', tanggal_akhir: '2026-05-12' },
      ]);

      const result = await getRemainingCutiQuota(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(Cuti.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-1',
            jenis_cuti: 'Cuti_Tahunan',
            status: ['Pending', 'Approved'],
            tanggal_mulai: { [Op.between]: expect.any(Array) },
          }),
        })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Sisa kuota cuti berhasil diambil',
        data: {
          sisa_cuti: 8,
          total_terpakai: 4,
          jatah_tahunan: 12,
        },
      });
    });
  });

  describe('deleteMyCutiRequest', () => {
    it('throws when unauthorized', async () => {
      await expect(deleteMyCutiRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when record not found', async () => {
      (Cuti.findOne as any).mockResolvedValue(null);

      await expect(
        deleteMyCutiRequest(
          { auth: { id: 'user-1', role: 'staff' }, params: { id: 'cuti-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Cuti record not found',
      });
    });

    it('throws when status not pending', async () => {
      (Cuti.findOne as any).mockResolvedValue({ status: 'Approved' });

      await expect(
        deleteMyCutiRequest(
          { auth: { id: 'user-1', role: 'staff' }, params: { id: 'cuti-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Only pending cuti requests can be deleted',
      });
    });

    it('deletes record successfully', async () => {
      const cuti = { status: 'Pending', destroy: jest.fn(async () => undefined) };
      (Cuti.findOne as any).mockResolvedValue(cuti);

      const result = await deleteMyCutiRequest(
        { auth: { id: 'user-1', role: 'staff' }, params: { id: 'cuti-1' } } as any,
        {} as Response
      );

      expect(cuti.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Cuti request deleted successfully',
        data: { cuti },
      });
    });
  });
});
