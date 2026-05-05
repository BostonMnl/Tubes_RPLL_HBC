import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../../models/user';
import { Absensi } from '../../models/absensi';
import { Reimburse } from '../../models/reimburse';
import { Cuti } from '../../models/cuti';
import { Gaji } from '../../models/gaji';
import {
  forgotPassword,
  getMyProfile,
  resetPasswordWithToken,
  updateMyProfile,
} from '../../API/controllers/user.controller';
import { sendPasswordResetEmail } from '../../API/utils/email';
import { isStrongPassword } from '../../API/utils/helper.js';

jest.mock('../../models/user', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../../models/absensi', () => ({
  Absensi: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../models/reimburse', () => ({
  Reimburse: {
    count: jest.fn(),
  },
}));

jest.mock('../../models/cuti', () => ({
  Cuti: {
    count: jest.fn(),
  },
}));

jest.mock('../../models/gaji', () => ({
  Gaji: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../API/utils/email', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../../API/utils/helper.js', () => ({
  isStrongPassword: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('throws when email is missing', async () => {
      const req = { body: {} } as any;

      await expect(forgotPassword(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Email is required',
      });
    });

    it('sends password reset email for existing user', async () => {
      const req = { body: { email: 'budi@mail.com' } } as any;

      (User.findOne as any).mockResolvedValue({
        nama: 'Budi',
        email: 'budi@mail.com',
        deletedAt: null,
      });
      (jwt.sign as any).mockReturnValue('reset-token');

      const result = await forgotPassword(req, {} as Response);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: 'budi@mail.com' },
        attributes: ['nama', 'email'],
      });
      expect(sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'budi@mail.com',
        nama: 'Budi',
        resetToken: expect.any(String),
      });
      expect(result).toEqual({
        code: 200,
        message: 'Password reset email has been sent',
      });
    });

    it('throws not found when user does not exist', async () => {
      const req = { body: { email: 'notfound@mail.com' } } as any;

      (User.findOne as any).mockResolvedValue(null);

      await expect(forgotPassword(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('throws not found when user is deleted', async () => {
      const req = { body: { email: 'deleted@mail.com' } } as any;

      (User.findOne as any).mockResolvedValue({
        nama: 'Deleted',
        email: 'deleted@mail.com',
        deletedAt: new Date(),
      });

      await expect(forgotPassword(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });
  });

  describe('resetPasswordWithToken', () => {
    it('throws when token or newPassword missing', async () => {
      await expect(resetPasswordWithToken({ body: {} } as any, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'token and newPassword are required',
      });
    });

    it('throws when password is weak', async () => {
      (isStrongPassword as any).mockReturnValue(false);

      await expect(
        resetPasswordWithToken(
          { body: { token: 'token-1', newPassword: 'weak' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 400,
        message:
          'Password must be minimum 12 characters and include at least 1 uppercase, 1 number, and 1 symbol',
      });
    });

    it('throws when token is invalid', async () => {
      (isStrongPassword as any).mockReturnValue(true);
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(
        resetPasswordWithToken(
          { body: { token: 'bad-token', newPassword: 'StrongPass!123' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 401,
        message: 'Invalid or expired reset token',
      });
    });

    it('throws when token payload invalid', async () => {
      (isStrongPassword as any).mockReturnValue(true);
      (jwt.verify as any).mockReturnValue('invalid');

      await expect(
        resetPasswordWithToken(
          { body: { token: 'token-1', newPassword: 'StrongPass!123' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 401,
        message: 'Invalid reset token payload',
      });
    });

    it('throws when user not found', async () => {
      (isStrongPassword as any).mockReturnValue(true);
      (jwt.verify as any).mockReturnValue({ email: 'missing@mail.com', purpose: 'password_reset' });
      (User.findOne as any).mockResolvedValue(null);

      await expect(
        resetPasswordWithToken(
          { body: { token: 'token-1', newPassword: 'StrongPass!123' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('throws when user is deleted', async () => {
      (isStrongPassword as any).mockReturnValue(true);
      (jwt.verify as any).mockReturnValue({ email: 'deleted@mail.com', purpose: 'password_reset' });
      (User.findOne as any).mockResolvedValue({ deletedAt: new Date() });

      await expect(
        resetPasswordWithToken(
          { body: { token: 'token-1', newPassword: 'StrongPass!123' } } as any,
          {} as Response
        )
      ).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('resets password successfully', async () => {
      const user = {
        deletedAt: null,
        password: 'old',
        save: jest.fn(async () => undefined),
      };

      (isStrongPassword as any).mockReturnValue(true);
      (jwt.verify as any).mockReturnValue({ email: 'user@mail.com', purpose: 'password_reset' });
      (User.findOne as any).mockResolvedValue(user);
      (bcrypt.hash as any).mockResolvedValue('hashed');

      const result = await resetPasswordWithToken(
        { body: { token: 'token-1', newPassword: 'StrongPass!123' } } as any,
        {} as Response
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass!123', 10);
      expect(user.password).toBe('hashed');
      expect(user.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Password has been reset successfully',
      });
    });
  });

  describe('getMyProfile', () => {
    it('throws when unauthorized', async () => {
      await expect(getMyProfile({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws not found when user does not exist', async () => {
      const req = { auth: { id: 'user-1', role: 'staff' } } as any;

      (User.findByPk as any).mockResolvedValue(null);

      await expect(getMyProfile(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('throws not found when user is deleted', async () => {
      const req = { auth: { id: 'user-1', role: 'staff' } } as any;

      (User.findByPk as any).mockResolvedValue({ deletedAt: new Date() });

      await expect(getMyProfile(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('returns profile data when user exists', async () => {
      const req = { auth: { id: 'user-1', role: 'staff' } } as any;
      const mockUser = {
        nama: 'Budi',
        email: 'budi@mail.com',
        alamat: 'Jl. Mawar',
        nomor_telepon: '08123456789',
        gambar: null,
        jabatan: 'Staff',
        role: 'staff',
        departemen: 'IT',
        deletedAt: null,
      };

      (User.findByPk as any).mockResolvedValue(mockUser);
      (Absensi.findAll as any).mockResolvedValue([{ date: '2026-05-05', status: 'Hadir' }]);
      (Reimburse.count as any).mockResolvedValue(2);
      (Cuti.count as any).mockResolvedValue(1);
      (Gaji.findOne as any).mockResolvedValue({ nominal: 5000000 });

      const result = await getMyProfile(req, {} as Response);

      expect(User.findByPk as any).toHaveBeenCalledWith(req.auth.id, {
        attributes: [
          'nama',
          'email',
          'alamat',
          'nomor_telepon',
          'gambar',
          'jabatan',
          'role',
          'departemen',
        ],
      });
      expect(result).toEqual({
        code: 200,
        message: 'Profile fetched successfully',
        data: {
          user: mockUser,
          attendance: [{ date: '2026-05-05', status: 'Hadir' }],
          total_reimburse: 2,
          total_cuti: 1,
          gaji: 5000000,
        },
      });
    });
  });

  describe('updateMyProfile', () => {
    it('throws when unauthorized', async () => {
      await expect(updateMyProfile({} as any, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Unauthorized',
      });
    });

    it('throws when no fields are provided to update', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        body: {},
      } as any;

      await expect(updateMyProfile(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Nothing to update',
      });
    });

    it('throws not found when user does not exist', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        body: { alamat: 'New Address' },
      } as any;

      (User.findByPk as any).mockResolvedValue(null);

      await expect(updateMyProfile(req, {} as Response)).rejects.toEqual({
        code: 404,
        message: 'User not found',
      });
    });

    it('updates provided fields and saves user', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        body: {
          alamat: 'Alamat Baru',
          nomor_telepon: '0888888888',
          gambar: 'avatar.png',
        },
      } as any;

      const mockUser = {
        nama: 'Budi',
        email: 'budi@mail.com',
        alamat: 'Alamat Lama',
        nomor_telepon: '0811111111',
        gambar: null,
        save: jest.fn(async () => undefined),
      };

      (User.findByPk as any).mockResolvedValue(mockUser);

      const result = await updateMyProfile(req, {} as Response);

      expect(mockUser.alamat).toBe('Alamat Baru');
      expect(mockUser.nomor_telepon).toBe('0888888888');
      expect(mockUser.gambar).toBe('avatar.png');
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Profile updated successfully',
        data: {
          user: {
            nama: 'Budi',
            email: 'budi@mail.com',
            alamat: 'Alamat Baru',
            nomor_telepon: '0888888888',
            gambar: 'avatar.png',
          },
        },
      });
    });

    it('uses uploaded file path when provided', async () => {
      const req = {
        auth: { id: 'user-1', role: 'staff' },
        body: {},
        file: { filename: 'avatar.png' },
      } as any;

      const mockUser = {
        nama: 'Budi',
        email: 'budi@mail.com',
        alamat: 'Alamat Lama',
        nomor_telepon: '0811111111',
        gambar: null,
        save: jest.fn(async () => undefined),
      };

      (User.findByPk as any).mockResolvedValue(mockUser);

      const result = await updateMyProfile(req, {} as Response);

      expect(mockUser.gambar).toBe('/uploads/avatar.png');
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        code: 200,
        message: 'Profile updated successfully',
        data: {
          user: {
            nama: 'Budi',
            email: 'budi@mail.com',
            alamat: 'Alamat Lama',
            nomor_telepon: '0811111111',
            gambar: '/uploads/avatar.png',
          },
        },
      });
    });
  });
});
