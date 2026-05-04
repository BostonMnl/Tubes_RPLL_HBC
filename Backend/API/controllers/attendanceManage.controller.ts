import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Absensi } from '../../models/absensi';
import { User } from '../../models/user';
import { ApiResponse } from '../middlewares/response.middleware';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
		jabatan?: string;
	};
};

const getParamId = (req: Request): string => {
	const id = req.params.id;

	if (typeof id !== 'string' || !id.trim()) {
		throw { code: 400, message: 'Attendance id is required' };
	}

	return id;
};

const isValidTime = (value: string): boolean => {
	return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
};

export const getAllAttendance = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ attendance: Absensi[] }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const { user_id, status, from, to } = req.query as {
		user_id?: string;
		status?: string;
		from?: string;
		to?: string;
	};

	const whereClause: Record<string, unknown> = {};

	if (user_id) {
		whereClause.user_id = user_id;
	}

	if (status) {
		whereClause.status = status;
	}

	if (from || to) {
		const fromDate = from ? new Date(from) : null;
		const toDate = to ? new Date(to) : null;

		if (fromDate && Number.isNaN(fromDate.getTime())) {
			throw { code: 400, message: 'from must be a valid date' };
		}

		if (toDate && Number.isNaN(toDate.getTime())) {
			throw { code: 400, message: 'to must be a valid date' };
		}

		if (fromDate && toDate) {
			whereClause.date = { [Op.between]: [fromDate, toDate] };
		} else if (fromDate) {
			whereClause.date = { [Op.gte]: fromDate };
		} else if (toDate) {
			whereClause.date = { [Op.lte]: toDate };
		}
	}

	if (req.auth.role !== 'admin') {
		const actorUser = await User.findByPk(req.auth.id, { attributes: ['jabatan', 'departemen'] });
		if (!actorUser || actorUser.deletedAt) {
			throw { code: 401, message: 'Unauthorized' };
		}

		let allowedJabatan: string[] = [];
		if (actorUser.jabatan === 'manager') {
			allowedJabatan = ['staff'];
		} else if (actorUser.jabatan === 'supervisor') {
			allowedJabatan = ['staff', 'manager'];
		} else {
			throw { code: 403, message: 'Forbidden : insufficient WEWENANG' };
		}

		const allowedUsers = await User.findAll({
			where: {
				departemen: actorUser.departemen,
				jabatan: { [Op.in]: allowedJabatan },
			},
			attributes: ['user_id'],
		});

		const allowedUserIds = allowedUsers.map((u) => u.user_id);

		if (user_id) {
			if (!allowedUserIds.includes(user_id)) {
				throw { code: 403, message: 'Forbidden : insufficient WEWENANG' };
			}
			whereClause.user_id = user_id;
		} else {
			whereClause.user_id = { [Op.in]: allowedUserIds };
		}
	}

	const attendance = await Absensi.findAll({
		where: whereClause,
		order: [
			['date', 'DESC'],
			['jam_masuk', 'DESC'],
		],
	});

	return {
		code: 200,
		message: 'Attendance fetched successfully',
		data: { attendance },
	};
};

export const patchAttendance = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ attendance: Absensi }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const id = getParamId(req);
	const { date, jam_masuk, jam_keluar, status, qr_code, user_id } = req.body as {
		date?: string | Date;
		jam_masuk?: string;
		jam_keluar?: string | null;
		status?: string;
		qr_code?: string;
		user_id?: string;
	};

	if (
		date === undefined &&
		jam_masuk === undefined &&
		jam_keluar === undefined &&
		status === undefined &&
		qr_code === undefined &&
		user_id === undefined
	) {
		throw { code: 400, message: 'No fields provided to update' };
	}

	const attendance = await Absensi.findByPk(id);
	if (!attendance) {
		throw { code: 404, message: 'Attendance record not found' };
	}

	if (date !== undefined) {
		const parsedDate = new Date(date);
		if (Number.isNaN(parsedDate.getTime())) {
			throw { code: 400, message: 'date must be a valid date' };
		}
		attendance.date = parsedDate;
	}

	if (jam_masuk !== undefined) {
		if (!isValidTime(jam_masuk)) {
			throw { code: 400, message: 'jam_masuk must be HH:MM or HH:MM:SS' };
		}
		attendance.jam_masuk = jam_masuk;
	}

	if (jam_keluar !== undefined) {
		if (jam_keluar !== null && !isValidTime(jam_keluar)) {
			throw { code: 400, message: 'jam_keluar must be HH:MM or HH:MM:SS or null' };
		}
		attendance.jam_keluar = jam_keluar;
	}

	if (status !== undefined) {
		const allowedStatus = ['Hadir', 'Telat', 'Sakit', 'Cuti', 'Alpha'];
		if (!allowedStatus.includes(status)) {
			throw { code: 400, message: 'status must be one of: Hadir, Sakit, Cuti, Alpha' };
		}
		attendance.status = status;
	}

	if (qr_code !== undefined) {
		if (!qr_code || typeof qr_code !== 'string' || !qr_code.trim()) {
			throw { code: 400, message: 'qr_code must be a valid string' };
		}
		attendance.qr_code = qr_code;
	}

	if (user_id !== undefined) {
		if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
			throw { code: 400, message: 'user_id must be a valid string' };
		}
		attendance.user_id = user_id;
	}

	attendance.updatedAt = new Date();
	await attendance.save();

	return {
		code: 200,
		message: 'Attendance updated successfully',
		data: { attendance },
	};
};
