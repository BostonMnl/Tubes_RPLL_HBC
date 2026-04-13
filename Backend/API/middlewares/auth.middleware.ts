import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { extractTokenFromRequest, isTokenRevoked } from '../utils/token-revocation';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractTokenFromRequest(req);
  
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    if (isTokenRevoked(token)) {
      res.status(401).json({ message: 'Token has been revoked' });
      return;
    }

    // @ts-ignore
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};