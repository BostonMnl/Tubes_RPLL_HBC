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

const QR_TTL = 20; // seconds
const QR_KEY = 'attendance:current_qr';
const cache = new NodeCache({ stdTTL: QR_TTL, checkperiod: Math.max(1, Math.floor(QR_TTL / 2)) });
const HADIR_WINDOW_MINUTES = 10;
const TELAT_WINDOW_MINUTES = 60;

const padTwo = (value: number): string => String(value).padStart(2, '0');
const WIB_TIME_ZONE = 'Asia/Jakarta';

const getWibParts = (): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
} => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WIB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
};

const buildWibDateTime = (date: string, time: string): Date => {
  return new Date(`${date}T${time}+07:00`);
};

const getWibDateTime = (): { date: string; time: string; now: Date } => {
  const parts = getWibParts();
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}:${parts.second}`;
  return { date, time, now: buildWibDateTime(date, time) };
};

const getTodayRange = (): { start: Date; end: Date } => {
  const { date } = getWibDateTime();
  const start = new Date(`${date}T00:00:00+07:00`);
  const end = new Date(`${date}T23:59:59.999+07:00`);
  return { start, end };
};

const getTodayStartRecord = async (): Promise<AbsensiStart | null> => {
  const { start, end } = getTodayRange();

console.log("di getTodayStartRecord", start , end);

  return AbsensiStart.findOne({
    where: {
      absensi_dimulai: {
        [Op.between]: [start, end],
      },
    },
    order: [['absensi_dimulai', 'DESC']],
  });
};

const getAttendanceWindow = async (): Promise<{ record: AbsensiStart; diffMinutes: number } | null> => {
  const record = await getTodayStartRecord();
  if (!record) {
    return null;
  }

  const diffMs = Date.now() - record.absensi_dimulai.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return { record, diffMinutes };
};

const isAttendanceActive = async (): Promise<boolean> => {
  const window = await getAttendanceWindow();
  if (!window) {
    return false;
  }

  return window.diffMinutes <= TELAT_WINDOW_MINUTES;
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

  const { now } = getWibDateTime();

  console.log("di recordStart", now);

  const existing = await getTodayStartRecord();

  if (existing) {
    const diffMs = Date.now() - existing.absensi_dimulai.getTime();
  
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes > TELAT_WINDOW_MINUTES) {
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
    absensi_dimulai: now,
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

    const window = await getAttendanceWindow();
    if (!window || window.diffMinutes > TELAT_WINDOW_MINUTES) {
      throw { code: 400, message: 'Attendance not started or expired' };
    }
    isActive = true;

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

    const { date, time } = getWibDateTime();

    const existingForToday = await Absensi.findOne({
      where: {
        user_id: req.auth.id,
        date,
      },
    });

    if (existingForToday) {
      throw { code: 409, message: 'Attendance already recorded for today' };
    }

    const status = window.diffMinutes <= HADIR_WINDOW_MINUTES ? 'Hadir' : 'Telat';

    console.log(date, time, "second before save")

    const attendance = await Absensi.create({
      date,
      jam_masuk: time,
      jam_keluar: null,
      status,
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

  const { time } = getWibDateTime();
  attendance.jam_keluar = time;
  await attendance.save();

  return {
    code: 200,
    message: 'Checkout recorded',
    data: { attendance },
  };
};