import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Penalti } from 'models/penalti';
import { User } from 'models/user';

type AuthenticatedRequest = Request & {
    auth?: {
        id: string;
        role: string;
        jabatan?: string;
    };
};

const getParamId = (req: Request, fieldName: string = 'id'): string => {
    const id = req.params[fieldName];

    if (!id || typeof id !== 'string' || !id.trim()) {
        throw { code: 400, message: `${fieldName} is required and must be a valid string` };
    }

    return id;
};

const validatePenaltiPayload = (body: any, file?: Express.Multer.File, isUpdate = false): any => {
    const { user_id, jenis, nominal, keterangan, tanggal, gambar } = body;
    const payload: any = {};

    if (user_id !== undefined || !isUpdate) {
        if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
            throw { code: 400, message: 'User id is required' };
        }
        payload.user_id = user_id;
    }

    if (jenis !== undefined || !isUpdate) {
        const validJenis = ['Cuti Tidak Berbayar', 'Mengrusak', 'Telat Masuk'];
        if (!jenis || typeof jenis !== 'string' || !validJenis.includes(jenis)) {
            throw { code: 400, message: 'Valid jenis is required' };
        }
        payload.jenis = jenis;
    }

    if (nominal !== undefined || !isUpdate) {
        if (!nominal) {
            throw { code: 400, message: 'Nominal is required' };
        }
        const nominalNum = Number(nominal);
        if (isNaN(nominalNum) || nominalNum <= 0) {
            throw { code: 400, message: 'Nominal must be a valid positive number' };
        }
        payload.nominal = nominalNum;
    }

    if (tanggal !== undefined || !isUpdate) {
        if (!tanggal || typeof tanggal !== 'string' || !tanggal.trim() || isNaN(Date.parse(tanggal))) {
            throw { code: 400, message: 'Valid tanggal is required' };
        }
        payload.tanggal = new Date(tanggal);
    }

    if (keterangan !== undefined || !isUpdate) {
        if (!keterangan || typeof keterangan !== 'string' || !keterangan.trim()) {
            throw { code: 400, message: 'Keterangan is required' };
        }
        payload.keterangan = keterangan;
    }

    const gambarFromFile = file ? `/uploads/${file.filename}` : undefined;
    if (gambarFromFile) {
        payload.gambar = gambarFromFile;
    } else if (gambar !== undefined) {
        payload.gambar = gambar;
    }

    return payload;
};

const fetchPenaltiList = async (whereClause: any): Promise<Penalti[]> => {
    return await Penalti.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });
};

const checkHierarchy = (targetJabatan: string, actorJabatan: string | undefined, actorRole: string, isSelf: boolean): void => {
    const actorR = actorRole.toLowerCase();
    const actorJ = actorJabatan?.toLowerCase() || '';
    const targetJ = targetJabatan.toLowerCase();

    if (actorR === 'admin') return;

    if (isSelf) {
        if (actorJ !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: Only Supervisor can self-manage penalties' };
        }
        return;
    }

    if (targetJ === 'staff') {
        if (!['manager', 'supervisor'].includes(actorJ)) {
            throw { code: 403, message: 'Forbidden: Only Manager or Supervisor can manage Staff records' };
        }
    } else if (targetJ === 'manager') {
        if (actorJ !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: Only Supervisor can manage Manager records' };
        }
    } else {
        throw { code: 403, message: 'Forbidden: Insufficient hierarchy permissions' };
    }
};

export const createPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validatePenaltiPayload(req.body, file, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    const isSelf = targetUser.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const penalti = await Penalti.create(payload);

    return {
        data: { penalti },
        code: 201,
        message: 'Penalti created successfully',
    };
};

export const updatePenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const penalti = await Penalti.findOne({ 
        where: { penalti_id: id },
        include: [{ model: User, attributes: ['user_id', 'jabatan'] }]
    });

    if (!penalti || !penalti.user) {
        throw { code: 404, message: 'Penalti or associated user not found' };
    }

    if (penalti.payroll_id) {
        throw { code: 400, message: 'Cannot edit penalti that is already linked to a payroll record' };
    }

    const isSelf = penalti.user_id === req.auth.id;
    checkHierarchy(penalti.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validatePenaltiPayload(req.body, file, true);

    if (Object.keys(payload).length === 0) {
        throw { code: 400, message: 'At least one field must be provided for update' };
    }

    await penalti.update(payload);

    return {
        data: { penalti },
        code: 200,
        message: 'Penalti updated successfully',
    };
};

export const getMyPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const penalti = await fetchPenaltiList({ user_id: req.auth.id });

    return {
        code: 200,
        message: 'Penalti retrieved successfully',
        data: { penalti },
    };
};

export const getPenaltiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req, 'userId');
    const targetUser = await User.findByPk(userId);

    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    const isSelf = targetUser.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const penalti = await fetchPenaltiList({ user_id: userId });

    return {
        code: 200,
        message: 'Penalti retrieved successfully',
        data: { penalti },
    };
};

export const getAllPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    // Hanya Admin yang biasanya boleh melihat SELURUH penalti perusahaan tanpa filter
    if (req.auth.role.toLowerCase() !== 'admin') {
         throw { code: 403, message: 'Forbidden: Only Admin can fetch all penalties without filters' };
    }

    const penalti = await fetchPenaltiList({});

    return {
        code: 200,
        message: 'All penalti records fetched successfully',
        data: { penalti },
    };
};

export const getPenaltiById = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const penalti = await Penalti.findOne({ 
        where: { penalti_id: id },
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });

    if (!penalti || !penalti.user) {
        throw { code: 404, message: 'Penalti not found' };
    }

    const isSelf = penalti.user_id === req.auth.id;
    
    // Jika bukan miliknya, cek apakah dia punya wewenang melihat data bawahan ini
    if (!isSelf && req.auth.role.toLowerCase() !== 'admin') {
        checkHierarchy(penalti.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    }

    return {
        data: { penalti },
        code: 200,
        message: 'Penalti retrieved successfully',
    };
};

export const deletePenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const penalti = await Penalti.findOne({ 
        where: { penalti_id: id },
        include: [{ model: User, attributes: ['user_id', 'jabatan'] }] 
    });

    if (!penalti || !penalti.user) {
        throw { code: 404, message: 'Penalti not found' };
    }

    if (penalti.payroll_id) {
        throw { code: 400, message: 'Cannot delete penalti that is already linked to a payroll record' };
    }

    const isSelf = penalti.user_id === req.auth.id;
    checkHierarchy(penalti.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    await penalti.destroy();

    return {
        code: 200,
        message: 'Penalti deleted successfully',
        data: null,
    };
};