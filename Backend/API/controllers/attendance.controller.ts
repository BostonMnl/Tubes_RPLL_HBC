import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import { Absensi } from 'models/absensi';
import { AbsensiStart } from 'models/absensi_start';
import { Op } from 'sequelize';
import { ApiResponse } from '../middlewares/response.middleware';

type AuthenticatedRequest = Request & {
  auth?: {
    id: string;
    role: string;
    jabatan: string;
  };
};

const QR_TTL = 10; // seconds
const QR_KEY = 'attendance:current_qr';
const cache = new NodeCache({ stdTTL: QR_TTL, checkperiod: Math.max(1, Math.floor(QR_TTL / 2)) });

const padTwo = (value: number): string => String(value).padStart(2, '0');
const isValidTime = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

const getLocalDateTime = (): { date: string; time: string } => {
  const now = new Date();
  const date = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`;
  const time = `${padTwo(now.getHours())}:${padTwo(now.getMinutes())}:${padTwo(now.getSeconds())}`;
  return { date, time };
};

const getTodayRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

const buildDateTimeFromToday = (time: string): Date => {
  const now = new Date();
  const [hour, minute, second = '0'] = time.split(':');
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Number(hour),
    Number(minute),
    Number(second)
  );
};

const getTodayStartRecord = async (): Promise<AbsensiStart | null> => {
  const { start, end } = getTodayRange();
  return AbsensiStart.findOne({
    where: {
      absensi_dimulai: {
        [Op.between]: [start, end],
      },
    },
    order: [['absensi_dimulai', 'DESC']],
  });
};

const isAttendanceActive = async (): Promise<boolean> => {
  const record = await getTodayStartRecord();
  if (!record) {
    return false;
  }

  const diffMs = Date.now() - record.absensi_dimulai.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= 10;
};

export const generateNewQR = async (): Promise<string> => {
  const token = uuidv4();
  cache.set(QR_KEY, token, QR_TTL);
  console.log('NEW QR:', token);
  return token;
};

setInterval(async () => {
  if (await isAttendanceActive()) {
    await generateNewQR();
  }
}, QR_TTL * 1000);

export const getCurrentQr = async (
  _req: Request,
  _res: Response
): Promise<ApiResponse<{ qr_token: string; expires_in: number }>> => {
  if (!(await isAttendanceActive())) {
    throw { code: 400, message: 'Attendance not started or expired' };
  }

  const qr = cache.get<string>(QR_KEY);

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

export const recordStart = async (
  req: AuthenticatedRequest,
  _res: Response
): Promise<ApiResponse<{ qr_token: string; record: AbsensiStart }>> => {
  if (!req.auth?.id) {
    throw { code: 401, message: 'Unauthorized' };
  }

  const { time } = req.body as { time?: string };

  if (!time || typeof time !== 'string' || !time.trim()) {
    throw { code: 400, message: 'Missing time' };
  }

  if (!isValidTime(time)) {
    throw { code: 400, message: 'time must be HH:MM or HH:MM:SS' };
  }

  const existing = await getTodayStartRecord();

  if (existing) {
    const diffMs = Date.now() - existing.absensi_dimulai.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes > 10) {
      throw { code: 400, message: 'Record start expired' };
    }

    return {
      code: 200,
      message: 'Record start accepted',
      data: {
        qr_token: await generateNewQR(),
        record: existing,
      },
    };
  }

  const record = await AbsensiStart.create({
    absensi_dimulai: buildDateTimeFromToday(time),
    user_id: req.auth.id,
  });

  return {
    code: 201,
    message: 'Record start created',
    data: {
      qr_token: await generateNewQR(),
      record,
    },
  };
};

export const scanAttendance = async (
  req: AuthenticatedRequest,
  _res: Response
): Promise<ApiResponse<{ attendance: Absensi }>> => {
  let shouldRotate = false;
  let isActive = false;

  try {
    if (!req.auth?.id) {
      throw { code: 401, message: 'Unauthorized' };
    }

    const { qr_token } = req.body as { qr_token?: string };
    shouldRotate = typeof qr_token === 'string' && qr_token.trim().length > 0;

    if (!qr_token || typeof qr_token !== 'string' || !qr_token.trim()) {
      throw { code: 400, message: 'Missing qr_token' };
    }

    isActive = await isAttendanceActive();
    if (!isActive) {
      throw { code: 400, message: 'Attendance not started or expired' };
    }

    const currentQR = cache.get<string>(QR_KEY);

    if (!currentQR || qr_token !== currentQR) {
      throw { code: 400, message: 'Invalid or expired QR' };
    }

    const usedKey = `attendance:used:${qr_token}`;
    const isUsed = cache.get<string>(usedKey);

    if (isUsed) {
      throw { code: 400, message: 'QR already used' };
    }

    cache.set(usedKey, '1', QR_TTL);

    const { date, time } = getLocalDateTime();
    const existingForToday = await Absensi.findOne({
      where: {
        user_id: req.auth.id,
        date,
      },
    });

    if (existingForToday) {
      throw { code: 409, message: 'Attendance already recorded for today' };
    }

    const attendance = await Absensi.create({
      date,
      jam_masuk: time,
      jam_keluar: null,
      status: 'Hadir',
      qr_code: qr_token,
      user_id: req.auth.id,
    });

    return {
      code: 200,
      message: 'Attendance recorded',
      data: { attendance },
    };
  } finally {
    if (shouldRotate && isActive) {
      await generateNewQR();
    }
  }
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
  await attendance.save();

  return {
    code: 200,
    message: 'Checkout recorded',
    data: { attendance },
  };
};