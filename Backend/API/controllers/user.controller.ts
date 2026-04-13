import { Request, Response } from 'express';
import { User } from '../../models/user';
import bcrypt from 'bcrypt';
import {
	createPasswordResetToken,
	consumePasswordResetToken,
} from '../utils/passwordReset';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
	};
};

// export const forgotPassword = async (req: Request, res: Response) => {
// 	try {
// 		const { email } = req.body;

// 		if (!email) {
// 			res.status(400).json({ message: 'Email is required' });
// 			return;
// 		}

// 		const user = await User.findOne({ where: { email } });
// 		let resetToken: string | undefined;

// 		if (user && !user.deletedAt) {
// 			// In production, send this token through email instead of response body.
// 			resetToken = createPasswordResetToken(user.user_id);
// 		}

// 		res.json({
// 			message: 'If the email exists, a reset link has been generated',
// 			resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
// 		});
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ message: 'Server error' });
// 	}
// };

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

export const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
	try {
		if (!req.auth?.id) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}

		const user = await User.findByPk(req.auth.id, {
			attributes: ['user_id', 'nama', 'email', 'alamat', 'nomor_telepon', 'gambar', 'jabatan', 'role', 'departemen'],
		});

		if (!user || user.deletedAt) {
			res.status(404).json({ message: 'User not found' });
			return;
		}

		res.json({ user });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Server error' });
	}
};

export const updateMyProfile = async (req: AuthenticatedRequest, res: Response) => {
	try {
		if (!req.auth?.id) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}

		const { alamat, nomor_telepon, gambar } = req.body;

		if (alamat === undefined && nomor_telepon === undefined && gambar === undefined) {
			res.status(400).json({ message: 'Nothing to update' });
			return;
		}

		const user = await User.findByPk(req.auth.id);
		if (!user || user.deletedAt) {
			res.status(404).json({ message: 'User not found' });
			return;
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

		res.json({
			message: 'Profile updated successfully',
			user: {
				user_id: user.user_id,
				nama: user.nama,
				email: user.email,
				alamat: user.alamat,
				nomor_telepon: user.nomor_telepon,
				gambar: user.gambar,
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Server error' });
	}
};

