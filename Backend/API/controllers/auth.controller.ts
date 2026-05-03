import { Request, Response } from 'express';
import { User } from '../../models/user';
import jwt from 'jsonwebtoken';
import { extractTokenFromRequest, revokeToken } from '../utils/token-revocation';
import { ApiResponse } from '../middlewares/response.middleware';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

export const login = async (
  req: Request,
  _res: Response
): Promise<ApiResponse<{ token: string; user: { nama: string; jabatan: string; role: string; departemen:string } }>> => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || user.deletedAt) {
    throw { code: 400, message: 'Invalid credentials' };
  }

  const isMatch = await user.validatePassword(password);
  if (!isMatch) {
    throw { code: 400, message: 'Invalid credentials' };
  }

  const token = jwt.sign({ id: user.user_id, role: user.role, jabatan: user.jabatan}, jwtSecret, { expiresIn: '4h' });

  return {
    code: 200,
    message: 'Login successful',
    data: {
      token,
      user: {
        nama: user.nama,
        jabatan: user.jabatan,
        role: user.role,
        departemen : user.departemen

      },
    },
  };
};


export const logout = async (
  req: Request,
  _res: Response
): Promise<ApiResponse> => {
  const token = extractTokenFromRequest(req);
  if (!token) {
    throw { code: 401, message: 'No token, authorization denied' };
  }

  const decoded = jwt.verify(token, jwtSecret);
  if (typeof decoded === 'string' || !decoded.exp) {
    throw { code: 401, message: 'Invalid token payload' };
  }

  revokeToken(token, decoded.exp);
  return { code: 200, message: 'Logged out successfully' };
};