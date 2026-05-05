import { Response } from 'express';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user';
import { login, logout } from '../../API/controllers/auth.controller';
import { extractTokenFromRequest, revokeToken } from '../../API/utils/token-revocation';

jest.mock('../../models/user', () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../API/utils/token-revocation', () => ({
  extractTokenFromRequest: jest.fn(),
  revokeToken: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
    verify: jest.fn(),
  },
}));

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('throws invalid credentials when user is not found', async () => {
      const req = {
        body: { email: 'missing@mail.com', password: 'password123' },
      } as any;

      (User.findOne as any).mockResolvedValue(null);

      await expect(login(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Invalid credentials',
      });

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'missing@mail.com' } });
    });

    it('throws invalid credentials when password does not match', async () => {
      const req = {
        body: { email: 'budi@mail.com', password: 'wrong-password' },
      } as any;

      (User.findOne as any).mockResolvedValue({
        user_id: 'user-1',
        jabatan: 'Staff',
        role: 'staff',
        departemen: 'IT',
        deletedAt: null,
        validatePassword: jest.fn(async () => false),
      });

      await expect(login(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Invalid credentials',
      });
    });

    it('returns token and user data when login succeeds', async () => {
      const req = {
        body: { email: 'budi@mail.com', password: 'password123' },
      } as any;

      const mockUser = {
        user_id: 'user-1',
        nama: 'Budi',
        jabatan: 'Staff',
        role: 'staff',
        departemen: 'IT',
        deletedAt: null,
        validatePassword: jest.fn(async () => true),
      };

      (User.findOne as any).mockResolvedValue(mockUser);
      (jwt.sign as any).mockReturnValue('mock-jwt-token');

      const result = await login(req, {} as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-1', role: 'staff', jabatan: 'Staff' },
        expect.any(String),
        { expiresIn: '4h' }
      );
      expect(result).toEqual({
        code: 200,
        message: 'Login successful',
        data: {
          token: 'mock-jwt-token',
          user: {
            nama: 'Budi',
            jabatan: 'Staff',
            role: 'staff',
            departemen: 'IT',
          },
        },
      });
    });

    it('throws invalid credentials when user is deleted', async () => {
      const req = {
        body: { email: 'deleted@mail.com', password: 'password123' },
      } as any;

      (User.findOne as any).mockResolvedValue({
        user_id: 'user-2',
        deletedAt: new Date(),
      });

      await expect(login(req, {} as Response)).rejects.toEqual({
        code: 400,
        message: 'Invalid credentials',
      });
    });
  });

  describe('logout', () => {
    it('throws when token is missing', async () => {
      const req = {} as any;

      (extractTokenFromRequest as any).mockReturnValue(null);

      await expect(logout(req, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'No token, authorization denied',
      });
    });

    it('throws when decoded token payload is invalid string', async () => {
      const req = {} as any;

      (extractTokenFromRequest as any).mockReturnValue('token-123');
      (jwt.verify as any).mockReturnValue('invalid-payload');

      await expect(logout(req, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Invalid token payload',
      });
    });

    it('throws when decoded token has no exp', async () => {
      const req = {} as any;

      (extractTokenFromRequest as any).mockReturnValue('token-123');
      (jwt.verify as any).mockReturnValue({ id: 'user-1' });

      await expect(logout(req, {} as Response)).rejects.toEqual({
        code: 401,
        message: 'Invalid token payload',
      });
    });

    it('revokes token and returns success when payload is valid', async () => {
      const req = {} as any;

      (extractTokenFromRequest as any).mockReturnValue('token-123');
      (jwt.verify as any).mockReturnValue({ id: 'user-1', exp: 2000000000 });

      const result = await logout(req, {} as Response);

      expect(revokeToken).toHaveBeenCalledWith('token-123', 2000000000);
      expect(result).toEqual({
        code: 200,
        message: 'Logged out successfully',
      });
    });
  });
});
