import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { extractTokenFromRequest, isTokenRevoked } from '../utils/token-revocation';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
type JwtAuthPayload = { id: string; role: string; jabatan: string };
type RequestWithAuth = Request & { auth?: JwtAuthPayload };

export const authMiddleware = (allowedRoles: string[] = [], allowedJabatan: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractTokenFromRequest(req);

    if (!token) {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtAuthPayload;
      const userRole = decoded.role?.toLowerCase();
      const userJabatan = decoded.jabatan?.toLowerCase();
      const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());
      const normalizedJabatan = allowedJabatan.map((jabatan) => jabatan.toLowerCase());

      // Admin has full access regardless of jabatan
      if (userRole === 'admin') {
        (req as RequestWithAuth).auth = decoded;
        return next();
      }

      if (isTokenRevoked(token)) {
        res.status(401).json({ message: 'Token has been revoked' });
        return;
      }

      if (allowedRoles.length > 0 && !normalizedRoles.includes(userRole)) {
        res.status(403).json({ message: 'Forbidden: insufficient role' });
        return;
      }

      if (allowedJabatan.length > 0 && !normalizedJabatan.includes(userJabatan)) {
        console.log(`Access denied for user with role ${userRole} and jabatan ${userJabatan}. Required roles: ${normalizedRoles.join(', ')}. Required jabatan: ${normalizedJabatan.join(', ')}`);
        res.status(403).json({ message: 'Forbidden: insufficient wewenang' });
        return;
      }

      (req as RequestWithAuth).auth = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};