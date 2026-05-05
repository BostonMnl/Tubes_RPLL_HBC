import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import {
  createUser,
  resetPassword,
  getAllUsers,
  updateProfileById,
  deleteUser,
} from '../../API/controllers/admin.userManage.controller';
import { User } from '../../models/user';
import {
  DEPARTEMEN_VALUES,
  isStrongPassword,
  JABATAN_VALUES,
  ROLE_VALUES,
} from '../../API/utils/helper.js';

jest.mock('../../models/user', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../API/utils/helper.js', () => ({
  DEPARTEMEN_VALUES: ['IT', 'HR'],
  JABATAN_VALUES: ['staff', 'manager', 'supervisor'],
  ROLE_VALUES: ['admin', 'staff'],
  isStrongPassword: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

describe('Admin User Manage Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const baseBody = {
      nama: 'Budi',
      alamat: 'Jl. Mawar',
      email: 'budi@mail.com',
      tanggal_lahir: '2000-01-01',
      nomor_telepon: '0812',
      jabatan: JABATAN_VALUES[0],
      role: ROLE_VALUES[1],
      departemen: DEPARTEMEN_VALUES[0],
      password: 'StrongPass!123',
    };

    it('throws when unauthorized', async () => {
      await expect(createUser({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when mandatory fields missing', async () => {
      const req = { auth: { id: 'admin-1', role: 'admin' }, body: { nama: 'Budi' } } as any;

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Please input the mandatory fields',
      });
    });

    it('throws when tanggal_lahir invalid', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody, tanggal_lahir: 'invalid' },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'tanggal_lahir must be a valid date',
      });
    });

    it('throws when password is weak', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody },
      } as any;

      (isStrongPassword as any).mockReturnValue(false);

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message:
          'Password must be minimum 12 characters and include at least 1 uppercase, 1 number, and 1 symbol',
      });
    });

    it('throws when jabatan is invalid', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody, jabatan: 'intern' },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: `jabatan must be one of: ${JABATAN_VALUES.join(', ')}`,
      });
    });

    it('throws when role is invalid', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody, role: 'manager' },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: `role must be one of: ${ROLE_VALUES.join(', ')}`,
      });
    });

    it('throws when departemen is invalid', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody, departemen: 'Finance' },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: `departemen must be one of: ${DEPARTEMEN_VALUES.join(', ')}`,
      });
    });

    it('throws when email already exists', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);
      (User.findOne as any).mockResolvedValue({ user_id: 'user-1' });

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 409,
        message: 'Email already registered',
      });
    });

    it('throws when manager does not exist', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody, manager_id: 'manager-1' },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);
      (User.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue(null);

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Manager with the provided ID does not exist',
      });
    });

    it('throws when manager department mismatches', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody, manager_id: 'manager-1' },
      } as any;

      (isStrongPassword as any).mockReturnValue(true);
      (User.findOne as any).mockResolvedValue(null);
      (User.findByPk as any).mockResolvedValue({ departemen: 'HR', deletedAt: null });

      await expect(createUser(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Manager must be in the same department as the user',
      });
    });

    it('creates user successfully', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        body: { ...baseBody },
        protocol: 'http',
        get: jest.fn(() => 'localhost:3000'),
      } as any;

      (isStrongPassword as any).mockReturnValue(true);
      (User.findOne as any).mockResolvedValue(null);
      (User.create as any).mockResolvedValue({
        user_id: 'user-1',
        nama: baseBody.nama,
        email: baseBody.email,
        alamat: baseBody.alamat,
        tanggal_lahir: new Date(baseBody.tanggal_lahir),
        nomor_telepon: baseBody.nomor_telepon,
        gambar: '/uploads/avatar.png',
        jabatan: baseBody.jabatan,
        role: baseBody.role,
        departemen: baseBody.departemen,
        manager_id: null,
      });

      const result = await createUser(
        { ...req, body: { ...baseBody, gambar: '/uploads/avatar.png' } } as any,
        {} as Response
      );

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nama: baseBody.nama,
          email: baseBody.email,
          departemen: baseBody.departemen,
        })
      );
      expect(result).toEqual({
        code: 201,
        message: 'User created successfully',
        data: {
          user: {
            user_id: 'user-1',
            nama: baseBody.nama,
            email: baseBody.email,
            alamat: baseBody.alamat,
            tanggal_lahir: new Date(baseBody.tanggal_lahir),
            nomor_telepon: baseBody.nomor_telepon,
            gambar: 'http://localhost:3000/uploads/avatar.png',
            jabatan: baseBody.jabatan,
            role: baseBody.role,
            departemen: baseBody.departemen,
            manager_id: null,
          },
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('throws when unauthorized', async () => {
      await expect(resetPassword({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when newPassword missing', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: {},
      } as any;

      await expect(resetPassword(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'newPassword is required',
      });
    });

    it('throws when newPassword too short', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: { newPassword: 'short' },
      } as any;

      await expect(resetPassword(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Password must be at least 12 characters',
      });
    });

    it('throws when user not found', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: { newPassword: 'StrongPass!123' },
      } as any;

      (User.findByPk as any).mockResolvedValue(null);

      await expect(resetPassword(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('hashes and saves new password', async () => {
      const user = { password: 'old', save: jest.fn(async () => undefined), deletedAt: null };
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: { newPassword: 'StrongPass!123' },
      } as any;

      (User.findByPk as any).mockResolvedValue(user);
      (bcrypt.hash as any).mockResolvedValue('hashed');

      const result = await resetPassword(req, {} as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass!123', 10);
      expect(user.password).toBe('hashed');
      expect(user.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Password has been reset successfully',
      });
    });
  });

  describe('getAllUsers', () => {
    it('throws when unauthorized', async () => {
      await expect(getAllUsers({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('returns users list', async () => {
      (User.findAll as any).mockResolvedValue([{ user_id: 'user-1' }]);

      const result = await getAllUsers(
        { auth: { id: 'admin-1', role: 'admin' } } as any,
        {} as Response
      );

      expect(User.findAll).toHaveBeenCalledWith({
        attributes: ['user_id', 'nama', 'email', 'jabatan', 'role', 'departemen', 'manager_id'],
      });
      expect(result).toEqual({
        code: 200,
        message: 'All users profile fetched successfully',
        data: { user: [{ user_id: 'user-1' }] },
      });
    });
  });

  describe('updateProfileById', () => {
    it('throws when unauthorized', async () => {
      await expect(updateProfileById({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when user not found', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: {
          nama: 'Budi',
          email: 'budi@mail.com',
          alamat: 'Jl. Mawar',
          tanggal_lahir: '2000-01-01',
          jabatan: 'staff',
          role: 'staff',
          departemen: 'IT',
        },
      } as any;

      (User.findByPk as any).mockResolvedValue(null);

      await expect(updateProfileById(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('throws when mandatory fields missing', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: { nama: 'Budi' },
      } as any;

      (User.findByPk as any).mockResolvedValue({ deletedAt: null });

      await expect(updateProfileById(req, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Mandatory fields are missing',
      });
    });

    it('throws when tanggal_lahir invalid', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: {
          nama: 'Budi',
          email: 'budi@mail.com',
          alamat: 'Jl. Mawar',
          tanggal_lahir: 'invalid',
          jabatan: 'staff',
          role: 'staff',
          departemen: 'IT',
        },
      } as any;

      (User.findByPk as any).mockResolvedValue({ deletedAt: null, email: 'old@mail.com' });

      await expect(updateProfileById(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'tanggal_lahir must be a valid date',
      });
    });

    it('throws when role invalid', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: {
          nama: 'Budi',
          email: 'budi@mail.com',
          alamat: 'Jl. Mawar',
          tanggal_lahir: '2000-01-01',
          jabatan: 'staff',
          role: 'manager',
          departemen: 'IT',
        },
      } as any;

      (User.findByPk as any).mockResolvedValue({ deletedAt: null, email: 'old@mail.com' });

      await expect(updateProfileById(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'role must be admin or staff',
      });
    });

    it('throws when email already registered', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: {
          nama: 'Budi',
          email: 'new@mail.com',
          alamat: 'Jl. Mawar',
          tanggal_lahir: '2000-01-01',
          jabatan: 'staff',
          role: 'staff',
          departemen: 'IT',
        },
      } as any;

      (User.findByPk as any).mockResolvedValue({
        deletedAt: null,
        email: 'old@mail.com',
        user_id: 'user-1',
      });
      (User.findOne as any).mockResolvedValue({ user_id: 'user-2' });

      await expect(updateProfileById(req, {} as Response)).rejects.toEqual({
        code: 409,
        message: 'Email already registered',
      });
    });

    it('updates user successfully', async () => {
      const user = {
        deletedAt: null,
        email: 'old@mail.com',
        user_id: 'user-1',
        nama: 'Old',
        alamat: 'Old',
        tanggal_lahir: new Date('1990-01-01'),
        nomor_telepon: null as string | null,
        gambar: null as string | null,
        jabatan: 'staff',
        role: 'staff',
        departemen: 'IT',
        manager_id: null as string | null,
        save: jest.fn(async () => undefined),
      };

      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
        body: {
          nama: 'Budi',
          email: 'budi@mail.com',
          alamat: 'Jl. Mawar',
          tanggal_lahir: '2000-01-01',
          nomor_telepon: '0812',
          gambar: '/uploads/avatar.png',
          jabatan: 'staff',
          role: 'staff',
          departemen: 'IT',
          manager_id: 'manager-1',
        },
      } as any;

      (User.findByPk as any).mockResolvedValue(user);
      (User.findOne as any).mockResolvedValue(null);

      const result = await updateProfileById(req, {} as Response);

      expect(user.nama).toBe('Budi');
      expect(user.email).toBe('budi@mail.com');
      expect(user.alamat).toBe('Jl. Mawar');
      expect(user.jabatan).toBe('staff');
      expect(user.role).toBe('staff');
      expect(user.departemen).toBe('IT');
      expect(user.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Profile updated successfully',
        data: {
          user: {
            nama: 'Budi',
            email: 'budi@mail.com',
            alamat: 'Jl. Mawar',
            tanggal_lahir: new Date('2000-01-01'),
            nomor_telepon: '0812',
            gambar: '/uploads/avatar.png',
            jabatan: 'staff',
            role: 'staff',
            departemen: 'IT',
            manager_id: 'manager-1',
          },
        },
      });
    });
  });

  describe('deleteUser', () => {
    it('throws when unauthorized', async () => {
      await expect(deleteUser({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when user not found', async () => {
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
      } as any;

      (User.findByPk as any).mockResolvedValue(null);

      await expect(deleteUser(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('deletes user successfully', async () => {
      const user = { deletedAt: null, destroy: jest.fn(async () => undefined) };
      const req = {
        auth: { id: 'admin-1', role: 'admin' },
        params: { id: 'user-1' },
      } as any;

      (User.findByPk as any).mockResolvedValue(user);

      const result = await deleteUser(req, {} as Response);

      expect(user.destroy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'User deleted successfully',
      });
    });
  });
});
