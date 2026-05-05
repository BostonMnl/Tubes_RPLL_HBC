import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { promoteUser, getProfileId } from '../../API/controllers/managerial.controller';
import { User } from '../../models/user';
import { Absensi } from '../../models/absensi';
import { JABATAN_VALUES, jabatanIndex } from '../../API/utils/helper.js';

jest.mock('../../models/user', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../models/absensi', () => ({
  Absensi: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../API/utils/helper.js', () => ({
  JABATAN_VALUES: ['staff', 'manager', 'supervisor'],
  jabatanIndex: jest.fn(),
}));

describe('Managerial Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('promoteUser', () => {
    it('throws when unauthorized', async () => {
      await expect(promoteUser({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when jabatan missing', async () => {
      const req = { auth: { id: 'actor-1', role: 'staff', jabatan: 'manager' }, params: { id: 'user-1' }, body: {} } as any;

      await expect(promoteUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'jabatan is required',
      });
    });

    it('throws when jabatan invalid', async () => {
      const req = {
        auth: { id: 'actor-1', role: 'staff', jabatan: 'manager' },
        params: { id: 'user-1' },
        body: { jabatan: 'intern' },
      } as any;

      await expect(promoteUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: `jabatan must be one of: ${JABATAN_VALUES.join(', ')}`,
      });
    });

    it('throws when target user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      const req = {
        auth: { id: 'actor-1', role: 'staff', jabatan: 'manager' },
        params: { id: 'user-1' },
        body: { jabatan: 'manager' },
      } as any;

      await expect(promoteUser(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('throws when actor user not found', async () => {
      (User.findByPk as any).mockResolvedValueOnce({ user_id: 'user-1', jabatan: 'staff', deletedAt: null });
      (User.findByPk as any).mockResolvedValueOnce(null);

      const req = {
        auth: { id: 'actor-1', role: 'staff', jabatan: 'manager' },
        params: { id: 'user-1' },
        body: { jabatan: 'manager' },
      } as any;

      await expect(promoteUser(req, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws on cross manager not allowed', async () => {
      (jabatanIndex as any).mockImplementation((jabatan: string) => ({ staff: 0, manager: 1, supervisor: 2 }[jabatan]));
      (User.findByPk as any)
        .mockResolvedValueOnce({ user_id: 'user-1', jabatan: 'staff', manager_id: 'manager-2', nama: 'Budi', deletedAt: null })
        .mockResolvedValueOnce({ user_id: 'manager-1', jabatan: 'manager', manager_id: null, deletedAt: null });

      const req = {
        auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' },
        params: { id: 'user-1' },
        body: { jabatan: 'manager' },
      } as any;

      await expect(promoteUser(req, {} as Response)).rejects.toEqual({
        code: 403,
        message: 'Forbidden: cross manager not allowed',
      });
    });

    it('throws when insufficient wewenang for manager', async () => {
      (jabatanIndex as any).mockImplementation((jabatan: string) => ({ staff: 0, manager: 1, supervisor: 2 }[jabatan]));
      (User.findByPk as any)
        .mockResolvedValueOnce({ user_id: 'user-1', jabatan: 'manager', manager_id: 'manager-1', nama: 'Budi', deletedAt: null })
        .mockResolvedValueOnce({ user_id: 'manager-1', jabatan: 'manager', manager_id: null, deletedAt: null });

      const req = {
        auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' },
        params: { id: 'user-1' },
        body: { jabatan: 'staff' },
      } as any;

      await expect(promoteUser(req, {} as Response)).rejects.toEqual({
        code: 403,
        message: 'Forbidden: insufficient wewenang',
      });
    });

    it('returns no changes when same jabatan', async () => {
      (jabatanIndex as any).mockImplementation((jabatan: string) => ({ staff: 0, manager: 1, supervisor: 2 }[jabatan]));
      (User.findByPk as any)
        .mockResolvedValueOnce({ user_id: 'user-1', jabatan: 'manager', manager_id: 'manager-1', nama: 'Budi', deletedAt: null })
        .mockResolvedValueOnce({ user_id: 'manager-1', jabatan: 'manager', manager_id: null, deletedAt: null });

      const req = {
        auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' },
        params: { id: 'user-1' },
        body: { jabatan: 'manager' },
      } as any;

      const result = await promoteUser(req, {} as Response);

      expect(result).toEqual({
        code: 200,
        message: 'No changes applied',
        data: { user: { nama: 'Budi', jabatan: 'manager', manager_id: 'manager-1' } },
      });
    });

    it('updates jabatan and manager for supervisor', async () => {
      const target = {
        user_id: 'user-1',
        nama: 'Budi',
        jabatan: 'manager',
        manager_id: 'supervisor-1',
        deletedAt: null,
        save: jest.fn(async () => undefined),
      };

      (jabatanIndex as any).mockImplementation((jabatan: string) => ({ staff: 0, manager: 1, supervisor: 2 }[jabatan]));
      (User.findByPk as any)
        .mockResolvedValueOnce(target)
        .mockResolvedValueOnce({ user_id: 'supervisor-1', jabatan: 'supervisor', manager_id: null, deletedAt: null });

      const req = {
        auth: { id: 'supervisor-1', role: 'staff', jabatan: 'supervisor' },
        params: { id: 'user-1' },
        body: { jabatan: 'supervisor' },
      } as any;

      const result = await promoteUser(req, {} as Response);

      expect(target.jabatan).toBe('supervisor');
      expect(target.manager_id).toBeNull();
      expect(target.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Jabatan updated successfully',
        data: { user: { nama: 'Budi', jabatan: 'supervisor', manager_id: null } },
      });
    });
  });

  describe('getProfileId', () => {
    it('throws when unauthorized', async () => {
      await expect(getProfileId({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when user not found', async () => {
      (User.findByPk as any).mockResolvedValue(null);

      await expect(
        getProfileId(
          { auth: { id: 'admin-1', role: 'admin', jabatan: 'supervisor' }, params: { id: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('returns profile for admin', async () => {
      const mockUser = {
        user_id: 'user-1',
        nama: 'Budi',
        email: 'budi@mail.com',
        jabatan: 'staff',
        departemen: 'IT',
        deletedAt: null,
      };

      (User.findByPk as any).mockResolvedValueOnce(mockUser);
      (Absensi.findAll as any).mockResolvedValue([{ date: '2026-05-05', status: 'Hadir' }]);

      const result = await getProfileId(
        { auth: { id: 'admin-1', role: 'admin', jabatan: 'supervisor' }, params: { id: 'user-1' } } as any,
        {} as Response
      );

      expect(result).toEqual({
        code: 200,
        message: 'User profile fetched successfully',
        data: { user: mockUser, attendance: [{ date: '2026-05-05', status: 'Hadir' }] },
      });
    });

    it('throws when manager accessing other department', async () => {
      const targetUser = {
        user_id: 'user-1',
        nama: 'Budi',
        jabatan: 'staff',
        departemen: 'HR',
        deletedAt: null,
      };

      (User.findByPk as any).mockResolvedValueOnce(targetUser);
      (Absensi.findAll as any).mockResolvedValue([]);
      (User.findByPk as any).mockResolvedValueOnce({ jabatan: 'manager', departemen: 'IT', deletedAt: null });

      await expect(
        getProfileId(
          { auth: { id: 'manager-1', role: 'staff', jabatan: 'manager' }, params: { id: 'user-1' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 403,
        message: 'Forbidden : insufficient WEWENANG',
      });
    });
  });
});
