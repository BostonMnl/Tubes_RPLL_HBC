import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  createMyReimburseRequest,
  createReimburseRequestForUser,
  updateReimburseRequest,
  getMyReimburse,
  getReimburseById,
  getAllReimburseRequests,
  approveDeclineReimburseRequest,
  getAllReimburseHistory,
  deleteReimburseRequest,
} from '../../API/controllers/reimburse.controller';
import { Reimburse } from '../../models/reimburse';
import { User } from '../../models/user';

jest.mock('models/reimburse', () => ({
  Reimburse: {
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

describe('Reimburse Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMyReimburseRequest', () => {
    const baseBody = {
      nominal: 10000,
      tanggal: '2026-05-01',
      keterangan: 'Transport',
      gambar: '/uploads/reimburse.png',
    };

    it('throws when unauthorized', async () => {
      await expect(createMyReimburseRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('auto-approves for supervisor', async () => {
      (Reimburse.create as any).mockResolvedValue({ status: 'Approved' });

      const result = await createMyReimburseRequest(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'supervisor' }, body: baseBody } as any,
        {} as Response
      );

      expect(Reimburse.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', status: 'Approved' })
      );
      expect(result).toEqual({
        code: 201,
        message: 'Reimburse request created successfully',
        data: { reimburse: { status: 'Approved' } },
      });
    });

    it('creates pending request for non-supervisor', async () => {
      (Reimburse.create as any).mockResolvedValue({ status: 'Pending' });

      const result = await createMyReimburseRequest(
        { auth: { id: 'user-1', role: 'staff', jabatan: 'staff' }, body: baseBody } as any,
        {} as Response
      );

      expect(Reimburse.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', status: 'Pending' })
      );
      expect(result).toEqual({
        code: 201,
        message: 'Reimburse request created successfully',
        data: { reimburse: { status: 'Pending' } },
      });
    });
  });

  describe('createReimburseRequestForUser', () => {
    const baseBody = {
      user_id: 'user-1',
      nominal: 10000,
      tanggal: '2026-05-01',
      keterangan: 'Transport',
      gambar: '/uploads/reimburse.png',
    };

    it('throws when unauthorized', async () => {
      await expect(createReimburseRequestForUser({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        createReimburseRequestForUser(
          { auth: { id: 'admin-1', role: 'admin' }, body: baseBody } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Target user not found',
      });
    });

    it('creates reimburse for user', async () => {
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });
      (Reimburse.create as any).mockResolvedValue({ reimburse_id: 'reb-1' });

      const result = await createReimburseRequestForUser(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, body: baseBody } as any,
        {} as Response
      );

      expect(Reimburse.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', nominal: 10000 })
      );
      expect(result).toEqual({
        code: 201,
        message: 'Reimburse request created successfully',
        data: { reimburse: { reimburse_id: 'reb-1' } },
      });
    });
  });

  describe('updateReimburseRequest', () => {
    it('throws when unauthorized', async () => {
      await expect(updateReimburseRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when reimburse not found', async () => {
      (Reimburse.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        updateReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'reb-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Reimburse record not found',
      });
    });

    it('throws when status not pending', async () => {
      (Reimburse.findOne as any).mockResolvedValue({ user_id: 'user-1', status: 'Approved' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        updateReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'reb-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Only pending reimburse requests can be updated',
      });
    });

    it('throws when no update fields provided', async () => {
      (Reimburse.findOne as any).mockResolvedValue({ user_id: 'user-1', status: 'Pending', update: jest.fn(async () => undefined) });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        updateReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'reb-1' }, body: {} } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'At least one field must be provided for update',
      });
    });

    it('updates reimburse successfully', async () => {
      const reimburse = { user_id: 'user-1', status: 'Pending', update: jest.fn() as jest.MockedFunction<(data: any) => Promise<void>> };
      (Reimburse.findOne as any).mockResolvedValue(reimburse);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await updateReimburseRequest(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'reb-1' }, body: { nominal: 20000 } } as any,
        {} as Response
      );

      expect(reimburse.update).toHaveBeenCalledWith(
        expect.objectContaining({ nominal: 20000 })
      );
      expect(result).toEqual({
        code: 200,
        message: 'Reimburse request updated successfully',
        data: { reimburse },
      });
    });
  });

  describe('getMyReimburse', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyReimburse({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns reimburse list', async () => {
      (Reimburse.findAll as any).mockResolvedValue([{ reimburse_id: 'reb-1' }]);

      const result = await getMyReimburse(
        { auth: { id: 'user-1', role: 'staff' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Reimburse fetched successfully',
        data: { reimburse: [{ reimburse_id: 'reb-1' }] },
      });
    });
  });

  describe('getReimburseById', () => {
    it('throws when unauthorized', async () => {
      await expect(getReimburseById({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when reimburse not found', async () => {
      (Reimburse.findOne as any).mockResolvedValue(null);

      await expect(
        getReimburseById(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'reb-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Reimburse record not found',
      });
    });

    it('throws when staff viewing others', async () => {
      (Reimburse.findOne as any).mockResolvedValue({ reimburse_id: 'reb-1', user_id: 'user-2' });

      await expect(
        getReimburseById(
          { auth: { id: 'user-1', role: 'staff' }, params: { id: 'reb-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden: You can only view your own reimburse requests',
      });
    });

    it('returns reimburse details', async () => {
      (Reimburse.findOne as any).mockResolvedValue({ reimburse_id: 'reb-1', user_id: 'user-1' });

      const result = await getReimburseById(
        { auth: { id: 'user-1', role: 'staff' }, params: { id: 'reb-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Reimburse fetched successfully',
        data: { reimburse: { reimburse_id: 'reb-1', user_id: 'user-1' } },
      });
    });
  });

  describe('getAllReimburseRequests', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllReimburseRequests({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns list with status filter', async () => {
      (Reimburse.findAll as any).mockResolvedValue([{ reimburse_id: 'reb-1' }]);

      const result = await getAllReimburseRequests(
        { auth: { id: 'admin-1', role: 'admin' }, query: { status: 'Approved' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Reimburse requests fetched successfully',
        data: { reimburse: [{ reimburse_id: 'reb-1' }] },
      });
    });
  });

  describe('approveDeclineReimburseRequest', () => {
    it('throws when unauthorized or missing jabatan', async () => {
      await expect(approveDeclineReimburseRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized or Jabatan info missing',
      });
    });

    it('throws when status invalid', async () => {
      await expect(
        approveDeclineReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin', jabatan: 'supervisor' }, params: { id: 'reb-1' }, body: { status: 'Other' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Status must be either Approved or Rejected',
      });
    });

    it('throws when record not found', async () => {
      (Reimburse.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        approveDeclineReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin', jabatan: 'supervisor' }, params: { id: 'reb-1' }, body: { status: 'Approved' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Reimburse record or associated user not found',
      });
    });

    it('throws when request expired', async () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2);

      (Reimburse.findOne as any).mockResolvedValue({ reimburse_id: 'reb-1', user_id: 'user-1', tanggal: oldDate });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        approveDeclineReimburseRequest(
          { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'reb-1' }, body: { status: 'Approved' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Reimburse request has expired. It can only be processed within the current or next payroll cycle.',
      });
    });

    it('approves request successfully', async () => {
      const recentDate = new Date();

      const reimburse = {
        reimburse_id: 'reb-1',
        user_id: 'user-1',
        tanggal: recentDate,
        status: 'Pending',
        save: jest.fn(async () => undefined),
      };

      (Reimburse.findOne as any).mockResolvedValue(reimburse);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await approveDeclineReimburseRequest(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'reb-1' }, body: { status: 'Approved' } } as any,
        {} as Response
      );

      expect(reimburse.status).toBe('Approved');
      expect(reimburse.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Reimburse request approved successfully',
        data: { reimburse },
      });
    });
  });

  describe('getAllReimburseHistory', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllReimburseHistory({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns reimburse history', async () => {
      (Reimburse.findAll as any).mockResolvedValue([{ reimburse_id: 'reb-1' }]);

      const result = await getAllReimburseHistory(
        { auth: { id: 'admin-1', role: 'admin' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'Reimburse history fetched successfully',
        data: { reimburse: [{ reimburse_id: 'reb-1' }] },
      });
    });
  });

  describe('deleteReimburseRequest', () => {
    it('throws when unauthorized', async () => {
      await expect(deleteReimburseRequest({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when record not found', async () => {
      (Reimburse.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        deleteReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'reb-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'Reimburse record not found',
      });
    });

    it('throws when status not pending', async () => {
      (Reimburse.findOne as any).mockResolvedValue({ status: 'Approved' });
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      await expect(
        deleteReimburseRequest(
          { auth: { id: 'admin-1', role: 'admin' }, params: { id: 'reb-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message: 'Only pending reimburse requests can be deleted',
      });
    });

    it('deletes reimburse request', async () => {
      const reimburse = { status: 'Pending', user_id: 'user-1', destroy: jest.fn(async () => undefined) };
      (Reimburse.findOne as any).mockResolvedValue(reimburse);
      (User.findByPk as any).mockResolvedValue({ user_id: 'user-1', jabatan: 'staff' });

      const result = await deleteReimburseRequest(
        { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'reb-1' } } as any,
        {} as Response
      );

      expect(reimburse.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Reimburse request deleted successfully',
        data: { reimburse },
      });
    });
  });
});
