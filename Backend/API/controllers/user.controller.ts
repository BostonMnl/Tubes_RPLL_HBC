import { Request, Response } from 'express';
import { User } from '../../models/user';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../middlewares/response.middleware';
import { sendPasswordResetEmail } from '../utils/email';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
	};
};

export const forgotPassword = async (
	req: Request,
	_res: Response
): Promise<ApiResponse> => {
	const { email } = req.body as { email?: string };

	if (!email) {
		throw { code: 400, message: 'Email is required' };
	}

	const user = await User.findOne({
		where: { email },
		attributes: ['nama', 'email'],
	});

	if (!user || user.deletedAt) {
		throw { code: 404, message: 'User not found' };
	}

	const resetSecret = process.env.PASSWORD_RESET_SECRET || process.env.JWT_SECRET || 'your-secret-key';
	const resetToken = jwt.sign(
		{ email: user.email, purpose: 'password_reset' },
		resetSecret,
		{ expiresIn: '15m' }
	);

	await sendPasswordResetEmail({
		to: user.email,
		nama: user.nama,
		resetToken,
	});

	return {
		code: 200,
		message: 'Password reset email has been sent',
	};
};

export const getMyProfile = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ user: User }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const user = await User.findByPk(req.auth.id, {
		attributes: ['nama', 'email', 'alamat', 'nomor_telepon', 'gambar', 'jabatan', 'role', 'departemen'],
	});

	if (!user || user.deletedAt) {
		throw { code: 404, message: 'User not found' };
	}

	return {
		code: 200,
		message: 'Profile fetched successfully',
		data: { user },
	};
};

export const updateMyProfile = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<
	ApiResponse<{
		user: {
			nama: string;
			email: string;
			alamat: string | null;
			nomor_telepon: string | null;
			gambar: string | null;
		};
	}>
> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const { alamat, nomor_telepon, gambar } = req.body;

	if (alamat === undefined && nomor_telepon === undefined && gambar === undefined) {
		throw { code: 400, message: 'Nothing to update' };
	}

	const user = await User.findByPk(req.auth.id);
	if (!user || user.deletedAt) {
		throw { code: 404, message: 'User not found' };
	}

	if (alamat !== undefined) {
		user.alamat = alamat;
	}

	if (nomor_telepon !== undefined) {
		user.nomor_telepon = nomor_telepon;
	}

	if (gambar !== undefined) {
		user.gambar = gambar;
	}

	await user.save();

	return {
		code: 200,
		message: 'Profile updated successfully',
		data: {
			user: {
				nama: user.nama,
				email: user.email,
				alamat: user.alamat,
				nomor_telepon: user.nomor_telepon,
				gambar: user.gambar,
			},
		},
	};
};

