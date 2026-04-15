import { Request, Response } from 'express';
import { User } from '../../models/user';
import { ResetPasswordRequest } from '../../models/resetPasswordRequest';
import { ApiResponse } from '../middlewares/response.middleware';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
	};
};

export const forgotPassword = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const existingRequest = await ResetPasswordRequest.findOne({
		where: { user_id: req.auth.id, deleted_at: null },
	});

	if (existingRequest) {
		throw { code: 400, message: 'Request already made' };
	}

	await ResetPasswordRequest.create({
		user_id: req.auth.id,
	});

	return {
		code: 200,
		message: 'Reset request has been created',
	};
};

// export const resetPassword = async (req: Request, res: Response) => {
// 	try {
// 		const { token, newPassword } = req.body;

// 		if (!token || !newPassword) {
// 			res.status(400).json({ message: 'Token and newPassword are required' });
// 			return;
// 		}

// 		if (typeof newPassword !== 'string' || newPassword.length < 8) {
// 			res.status(400).json({ message: 'Password must be at least 8 characters' });
// 			return;
// 		}

// 		const userId = consumePasswordResetToken(token);
// 		if (!userId) {
// 			res.status(400).json({ message: 'Invalid or expired reset token' });
// 			return;
// 		}

// 		const user = await User.findByPk(userId);
// 		if (!user || user.deletedAt) {
// 			res.status(404).json({ message: 'User not found' });
// 			return;
// 		}

// 		user.password = await bcrypt.hash(newPassword, 10);
// 		await user.save();

// 		res.json({ message: 'Password has been reset successfully' });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ message: 'Server error' });
// 	}
// };

export const getMyProfile = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ user: User }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const user = await User.findByPk(req.auth.id, {
		attributes: ['user_id', 'nama', 'email', 'alamat', 'nomor_telepon', 'gambar', 'jabatan', 'role', 'departemen'],
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
			user_id: string;
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
				user_id: user.user_id,
				nama: user.nama,
				email: user.email,
				alamat: user.alamat,
				nomor_telepon: user.nomor_telepon,
				gambar: user.gambar,
			},
		},
	};
};

