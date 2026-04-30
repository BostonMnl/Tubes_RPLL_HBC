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

      if (isTokenRevoked(token)) {
        res.status(401).json({ message: 'Token has been revoked' });
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        res.status(403).json({ message: 'Forbidden: insufficient role' });
        return;
      }

      if (allowedJabatan.length > 0 && !allowedJabatan.includes(decoded.jabatan)) {
        if (allowedRoles.length > 0 && allowedRoles.includes("admin")) {
          return next();
        }
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