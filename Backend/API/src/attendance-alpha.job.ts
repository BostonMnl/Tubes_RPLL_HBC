import cron from 'node-cron';
import { Op } from 'sequelize';
import { Absensi } from 'models/absensi';
import { AbsensiStart } from 'models/absensi_start';
import { User } from 'models/user';

const SHIFT_HOURS = 1;
const JAM_MASUK_ALPHA = '00:00:00';
const QR_ALPHA = 'AUTO-ALPHA';

const padTwo = (value: number): string => String(value).padStart(2, '0');

const formatDateOnly = (date: Date): string => {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
};

const getTodayRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

const scheduleAttendanceAlphaJob = (): void => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { start, end } = getTodayRange();
      const record = await AbsensiStart.findOne({
        where: {
          absensi_dimulai: {
            [Op.between]: [start, end],
          },
        },
        order: [['absensi_dimulai', 'DESC']],
      });

      if (!record) {
        return;
      }

      const shiftEnd = new Date(record.absensi_dimulai.getTime() + SHIFT_HOURS * 60 * 60 * 1000);
      if (Date.now() < shiftEnd.getTime()) {
        return;
      }

      const date = formatDateOnly(record.absensi_dimulai);
      const users = await User.findAll({
        where: {
          role: { [Op.ne]: 'admin' },
        },
        attributes: ['user_id'],
      });

      for (const user of users) {
        const existing = await Absensi.findOne({
          where: {
            user_id: user.user_id,
            date,
          },
        });

        if (existing) {
          continue;
        }

        await Absensi.create({
          date,
          jam_masuk: JAM_MASUK_ALPHA,
          jam_keluar: null,
          status: 'Alpha',
          qr_code: QR_ALPHA,
          user_id: user.user_id,
        });
      }
    } catch (error) {
      console.error('[CRON JOB] Attendance alpha job failed:', error);
    }
  });
};

export default scheduleAttendanceAlphaJob;
