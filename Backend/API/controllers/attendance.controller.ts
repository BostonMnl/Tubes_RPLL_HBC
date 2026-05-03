import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { Absensi } from 'models/absensi';
import { ApiResponse } from '../middlewares/response.middleware';

type AuthenticatedRequest = Request & {
  auth?: {
    id: string;
    role: string;
    jabatan: string;
  };
};

const redis = new Redis();

const QR_TTL = 60; // seconds
const QR_KEY = 'attendance:current_qr';

const padTwo = (value: number): string => String(value).padStart(2, '0');

const getLocalDateTime = (): { date: string; time: string } => {
  const now = new Date();
  const date = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`;
  const time = `${padTwo(now.getHours())}:${padTwo(now.getMinutes())}:${padTwo(now.getSeconds())}`;
  return { date, time };
};

export const generateNewQR = async (): Promise<string> => {
  const token = uuidv4();
  await redis.set(QR_KEY, token, 'EX', QR_TTL);
  console.log('NEW QR:', token);
  return token;
};

setInterval(() => {
  generateNewQR();
}, QR_TTL * 1000);

export const getCurrentQr = async (
  _req: Request,
  _res: Response
): Promise<ApiResponse<{ qr_token: string; expires_in: number }>> => {
  const qr = await redis.get(QR_KEY);

  if (!qr) {
    const newQr = await generateNewQR();
    return {
      code: 200,
      message: 'QR generated',
      data: { qr_token: newQr, expires_in: QR_TTL },
    };
  }

  return {
    code: 200,
    message: 'QR fetched',
    data: { qr_token: qr, expires_in: QR_TTL },
  };
};

export const scanAttendance = async (
  req: AuthenticatedRequest,
  _res: Response
): Promise<ApiResponse<{ attendance: Absensi }>> => {
  if (!req.auth?.id) {
    throw { code: 401, message: 'Unauthorized' };
  }

  const { qr_token } = req.body as { qr_token?: string };

  if (!qr_token || typeof qr_token !== 'string' || !qr_token.trim()) {
    throw { code: 400, message: 'Missing qr_token' };
  }


  const currentQR = await redis.get(QR_KEY);

  if (!currentQR || qr_token !== currentQR) {
    throw { code: 400, message: 'Invalid or expired QR' };
  }

  const usedKey = `attendance:used:${qr_token}`;
  const isUsed = await redis.get(usedKey);

  if (isUsed) {
    throw { code: 400, message: 'QR already used' };
  }

  await redis.set(usedKey, '1', 'EX', QR_TTL);

  const { date, time } = getLocalDateTime();
  const attendance = await Absensi.create({
    date,
    jam_masuk: time,
    jam_keluar: null,
    status: 'Hadir',
    qr_code: qr_token,
    user_id: req.auth.id,
  });

  await generateNewQR();

  return {
    code: 200,
    message: 'Attendance recorded',
    data: { attendance },
  };
};

const getOpenAttendance = async (userId: string): Promise<Absensi | null> => {
  return Absensi.findOne({
    where: { user_id: userId, jam_keluar: null },
    order: [
      ['date', 'DESC'],
      ['jam_masuk', 'DESC'],
    ],
  });
};

export const getCheckoutQr = async (
  req: AuthenticatedRequest,
  _res: Response
): Promise<ApiResponse<{ qr_code: string }>> => {
  if (!req.auth?.id) {
    throw { code: 401, message: 'Unauthorized' };
  }

  const attendance = await getOpenAttendance(req.auth.id);

  if (!attendance) {
    throw { code: 404, message: 'No active attendance found' };
  }

  return {
    code: 200,
    message: 'Checkout QR fetched',
    data: { qr_code: attendance.qr_code },
  };
};

export const checkoutAttendance = async (
  req: AuthenticatedRequest,
  _res: Response
): Promise<ApiResponse<{ attendance: Absensi }>> => {
  if (!req.auth?.id) {
    throw { code: 401, message: 'Unauthorized' };
  }

  const { qr_code } = req.body as { qr_code?: string };

  if (!qr_code || typeof qr_code !== 'string' || !qr_code.trim()) {
    throw { code: 400, message: 'Missing qr_code' };
  }


  const attendance = await getOpenAttendance(req.auth.id);

  if (!attendance || attendance.qr_code !== qr_code) {
    throw { code: 400, message: 'Invalid checkout QR' };
  }

  const { time } = getLocalDateTime();
  attendance.jam_keluar = time;
  attendance.updatedAt = new Date();
  await attendance.save();

  return {
    code: 200,
    message: 'Checkout recorded',
    data: { attendance },
  };
};