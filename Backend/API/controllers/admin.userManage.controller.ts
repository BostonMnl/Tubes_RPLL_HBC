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

const buildGambarUrl = (req: Request, gambar: string | null): string | null => {
    if (!gambar) {
        return null;
    }

    const host = req.get('host');
    if (!host) {
        return gambar;
    }

    return `${req.protocol}://${host}${gambar}`;
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
            manager_id: string;
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
        manager_id,
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
        manager_id?: string;
    };
    
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const gambarFromFile = file ? `/uploads/${file.filename}` : undefined;

    if (!nama || !alamat || !email || !tanggal_lahir || !jabatan || !role || !departemen || !password) {
        throw {
            code: 400,
            message: 'Please input the mandatory fields',
        };
    }

    const parsedTanggalLahir = new Date(tanggal_lahir);
    if (Number.isNaN(parsedTanggalLahir.getTime())) {
        throw { code: 400, message: 'tanggal_lahir must be a valid date' };
    }


    if (!isStrongPassword(password)) {
        throw {
            code: 400,
            message:
                'Password must be minimum 12 characters and include at least 1 uppercase, 1 number, and 1 symbol',
        };
    }


    if (!JABATAN_VALUES.includes(jabatan as (typeof JABATAN_VALUES)[number])) {
        throw {
            code: 400,
            message: `jabatan must be one of: ${JABATAN_VALUES.join(', ')}`,
        };
    }


    if (!ROLE_VALUES.includes(role as (typeof ROLE_VALUES)[number])) {
        throw {
            code: 400,
            message: `role must be one of: ${ROLE_VALUES.join(', ')}`,
        };
    }


    if (!DEPARTEMEN_VALUES.includes(departemen as (typeof DEPARTEMEN_VALUES)[number])) {
        throw {
            code: 400,
            message: `departemen must be one of: ${DEPARTEMEN_VALUES.join(', ')}`,
        };
    }


    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw { code: 409, message: 'Email already registered' };
    }

    if (req.body.manager_id) {
        const existingManager = await User.findByPk(req.body.manager_id);
        if (!existingManager || existingManager.deletedAt) {
            throw { code: 400, message: 'Manager with the provided ID does not exist' };
        }else if (existingManager.departemen !== departemen) {
            throw { code: 400, message: 'Manager must be in the same department as the user' };
        }
    }


    const createdUser = await User.create({
        nama: nama,
        alamat: alamat,
        email: email,
        tanggal_lahir: parsedTanggalLahir,
        nomor_telepon: nomor_telepon ?? null,
        jabatan: jabatan,
        role: role,
        departemen: departemen,
        gambar: gambarFromFile ?? gambar ?? null,
        password : password,
        manager_id: manager_id ?? null,
    });

    const gambarUrl = buildGambarUrl(req, createdUser.gambar);

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
                gambar: gambarUrl,
                jabatan: createdUser.jabatan,
                role: createdUser.role,
                departemen: createdUser.departemen,
                manager_id: createdUser.manager_id,
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

    const gambarUrl = buildGambarUrl(req, user.gambar);

    return {
        code: 200,
        message: 'Password has been reset successfully',
    };
};

export const getAllUsers = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ user: User[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const user = await User.findAll({
        attributes: ['user_id', 'nama', 'email', 'jabatan', 'role', 'departemen', 'manager_id'],
    });


    return {
        code: 200,
        message: 'All users profile fetched successfully',
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

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const gambarFromFile = file ? `/uploads/${file.filename}` : undefined;

    const user = await User.findByPk(id);
    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    if (
        nama == null ||
        email == null ||
        alamat == null ||
        tanggal_lahir == null ||
        jabatan == null ||
        role == null ||
        departemen == null
    ) {
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

    if (gambarFromFile !== undefined) {
        user.gambar = gambarFromFile;
    } else if (gambar !== undefined) {
        user.gambar = gambar;
    }else if (manager_id != null) {
        user.manager_id = manager_id;
    }

    user.jabatan = jabatan;
    user.role = role;
    user.departemen = departemen;

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

export const deleteUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const user = await User.findByPk(id);
    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

    await user.destroy();

    return {
        code: 200,
        message: 'User deleted successfully',
    };
};

