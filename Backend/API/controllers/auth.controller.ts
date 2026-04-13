import { Request, Response } from 'express';
import { User } from '../../models/user';
import jwt from 'jsonwebtoken';
import { extractTokenFromRequest, revokeToken } from '../utils/token-revocation';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user || user.deletedAt) {
      res.status(400).json({ message: 'Invalid credentials' });
      return 
    }

    // Check password
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return 
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.user_id }, jwtSecret, { expiresIn: '4h' });

    res.json({ token, user: { user_id: user.user_id, nama: user.nama, jabatan:user.jabatan, role:user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const logout = async (req: Request, res: Response) => {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === 'string' || !decoded.exp) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    revokeToken(token, decoded.exp);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};