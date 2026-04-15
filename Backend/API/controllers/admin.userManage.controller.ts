import { Request, Response } from 'express';
import { User } from '../../models/user';
import { ResetPasswordRequest } from '../../models/resetPasswordRequest';
import bcrypt from 'bcrypt';
import { ApiResponse } from '../middlewares/response.middleware';

type AuthenticatedRequest = Request & {
    auth?: {
        id: string;
        role: string;
    };
};

const getParamId = (req: Request): string => {
    const id = req.params.id;

    if (typeof id !== 'string' || !id.trim()) {
        throw { code: 400, message: 'User id is required' };
    }

    return id;
};

export const resetPassword = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const { newPassword } = req.body as { newPassword?: string };

    if (!newPassword) {
        throw { code: 400, message: 'newPassword is required' };
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        throw { code: 400, message: 'Password must be at least 8 characters' };
    }

    const resetRequest = await ResetPasswordRequest.findOne({
        where: { user_id: id, deleted_at: null },
    });

    if (!resetRequest) {
        throw { code: 400, message: "Request doesn't exist" };
    }

    const user = await User.findByPk(id);
    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    resetRequest.deleted_at = new Date();
    await resetRequest.save();

    return {
        code: 200,
        message: 'Password has been reset successfully',
    };
};

export const getProfileId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ user: User }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const user = await User.findByPk(id, {
        attributes: ['nama', 'email', 'alamat', 'nomor_telepon', 'gambar', 'jabatan', 'role', 'departemen', 'manager_id'],
    });

    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    return {
        code: 200,
        message: 'User profile fetched successfully',
        data: { user },
    };
};

export const updateProfileById = async (
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
            jabatan: string;
            role: string;
            departemen: string;
            manager_id: string;
        };
    }>
> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const {
        nama,
        email,
        alamat,
        nomor_telepon,
        gambar,
        jabatan,
        role,
        departemen,
        manager_id,
    } = req.body as {
        nama?: string;
        email?: string;
        alamat?: string;
        nomor_telepon?: string;
        gambar?: string;
        jabatan?: string;
        role?: string;
        departemen?: string;
        manager_id?: string;
    };

    if (
        nama === undefined &&
        email === undefined &&
        alamat === undefined &&
        nomor_telepon === undefined &&
        gambar === undefined &&
        jabatan === undefined &&
        role === undefined &&
        departemen === undefined &&
        manager_id === undefined
    ) {
        throw { code: 400, message: 'Data have already been saved' };
    }

    const user = await User.findByPk(id);
    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    if (role !== undefined && role !== 'admin' && role !== 'staff') {
        throw { code: 400, message: 'role must be admin or staff' };
    }

    if (nama !== undefined) user.nama = nama;
    if (email !== undefined) user.email = email;
    if (alamat !== undefined) user.alamat = alamat;
    if (nomor_telepon !== undefined) user.nomor_telepon = nomor_telepon;
    if (gambar !== undefined) user.gambar = gambar;
    if (jabatan !== undefined) user.jabatan = jabatan;
    if (role !== undefined) user.role = role;
    if (departemen !== undefined) user.departemen = departemen;
    if (manager_id !== undefined) user.manager_id = manager_id;

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
                jabatan: user.jabatan,
                role: user.role,
                departemen: user.departemen,
                manager_id: user.manager_id,
            },
        },
    };
};

