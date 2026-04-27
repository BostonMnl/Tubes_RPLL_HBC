import { Request, Response } from 'express';
import { User } from '../../models/user';
import bcrypt from 'bcrypt';
import { ApiResponse } from '../middlewares/response.middleware';
import { UUIDV4 } from 'sequelize';
import { DEPARTEMEN_VALUES, isStrongPassword, JABATAN_VALUES, ROLE_VALUES } from '../utils/helper.js';

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

export const createUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<
    ApiResponse<{
        user: {
            user_id: string;
            nama: string;
            email: string;
            alamat: string;
            tanggal_lahir: Date;
            nomor_telepon: string | null;
            gambar: string | null;
            jabatan: string;
            role: string;
            departemen: string;
        };
    }>
> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const {
        nama,
        alamat,
        email,
        tanggal_lahir,
        nomor_telepon,
        jabatan,
        role,
        departemen,
        gambar,
        password,
    } = req.body as {
        nama?: string;
        alamat?: string;
        email?: string;
        tanggal_lahir?: string | Date;
        nomor_telepon?: string;
        jabatan?: string;
        role?: string;
        departemen?: string;
        gambar?: string;
        password?: string;
    };

    console.log('1')

    if (!nama || !alamat || !email || !tanggal_lahir || !jabatan || !role || !departemen || !password) {
        throw {
            code: 400,
            message: 'Please input the mandatory fields',
        };
    }

    console.log('2')

    const parsedTanggalLahir = new Date(tanggal_lahir);
    if (Number.isNaN(parsedTanggalLahir.getTime())) {
        throw { code: 400, message: 'tanggal_lahir must be a valid date' };
    }

    console.log('9')

    if (!isStrongPassword(password)) {
        throw {
            code: 400,
            message:
                'Password must be minimum 12 characters and include at least 1 uppercase, 1 number, and 1 symbol',
        };
    }

    console.log('8')

    if (!JABATAN_VALUES.includes(jabatan as (typeof JABATAN_VALUES)[number])) {
        throw {
            code: 400,
            message: `jabatan must be one of: ${JABATAN_VALUES.join(', ')}`,
        };
    }

    console.log('7')

    if (!ROLE_VALUES.includes(role as (typeof ROLE_VALUES)[number])) {
        throw {
            code: 400,
            message: `role must be one of: ${ROLE_VALUES.join(', ')}`,
        };
    }

    console.log('6')

    if (!DEPARTEMEN_VALUES.includes(departemen as (typeof DEPARTEMEN_VALUES)[number])) {
        throw {
            code: 400,
            message: `departemen must be one of: ${DEPARTEMEN_VALUES.join(', ')}`,
        };
    }

    console.log('5')

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw { code: 409, message: 'Email already registered' };
    }

    console.log('3')

    const createdUser = await User.create({
        nama : nama,
        alamat : alamat,
        email : email,
        tanggal_lahir: parsedTanggalLahir,
        nomor_telepon: nomor_telepon ?? null,
        jabatan : jabatan,
        role : role,
        departemen : departemen,
        gambar: gambar ?? null,
        password : password,
    });

    console.log('4')

    console.log('Created user:', createdUser.nama, createdUser.email);

    return {
        code: 201,
        message: 'User created successfully',
        data: {
            user: {
                user_id: createdUser.user_id,
                nama: createdUser.nama,
                email: createdUser.email,
                alamat: createdUser.alamat,
                tanggal_lahir: createdUser.tanggal_lahir,
                nomor_telepon: createdUser.nomor_telepon,
                gambar: createdUser.gambar,
                jabatan: createdUser.jabatan,
                role: createdUser.role,
                departemen: createdUser.departemen,
            },
        },
    };
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

    if (typeof newPassword !== 'string' || newPassword.length < 12) {
        throw { code: 400, message: 'Password must be at least 12 characters' };
    }

    const user = await User.findByPk(id);
    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

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
        attributes: ['nama', 'email', 'alamat', 'tanggal_lahir', 'nomor_telepon', 'gambar', 'jabatan', 'role', 'departemen', 'manager_id'],
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
            tanggal_lahir: Date | string;
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
        tanggal_lahir,
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
        tanggal_lahir?: Date | string;
        nomor_telepon?: string;
        gambar?: string;
        jabatan?: string;
        role?: string;
        departemen?: string;
        manager_id?: string;
    };

    const user = await User.findByPk(id);
    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    if (nama === undefined || email === undefined || alamat === undefined || 
        tanggal_lahir === undefined || jabatan === undefined || role === undefined || 
        departemen === undefined || manager_id === undefined) {
        throw { code: 401, message: 'Mandatory fields are missing' };
    }

    const parsedTanggalLahir = new Date(tanggal_lahir);
    if (Number.isNaN(parsedTanggalLahir.getTime())) {
        throw { code: 400, message: 'tanggal_lahir must be a valid date' };
    }

    if (role !== 'admin' && role !== 'staff') {
        throw { code: 400, message: 'role must be admin or staff' };
    }

    if (email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.user_id !== user.user_id) {
            throw { code: 409, message: 'Email already registered' };
        }
    }

    user.nama = nama;
    user.email = email;
    user.alamat = alamat;
    user.tanggal_lahir = parsedTanggalLahir;
    if (nomor_telepon !== undefined) user.nomor_telepon = nomor_telepon;
    if (gambar !== undefined ) user.gambar = gambar;
    user.jabatan = jabatan;
    user.role = role;
    user.departemen = departemen;
    user.manager_id = manager_id;

    await user.save();

    return {
        code: 200,
        message: 'Profile updated successfully',
        data: {
            user: {
                nama: user.nama,
                email: user.email,
                alamat: user.alamat,
                tanggal_lahir: user.tanggal_lahir,
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

