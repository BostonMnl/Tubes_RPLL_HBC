import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Gaji } from 'models/gaji';
import { User } from 'models/user';

type AuthenticatedRequest = Request & {
    auth?: {
        id: string;
        role: string;
        jabatan?: string;
    };
};

const getParamId = (req: Request, fieldName: string = 'userId'): string => {
    const id = req.params[fieldName];

    if (!id || typeof id !== 'string' || !id.trim()) {
        throw { code: 400, message: `${fieldName} is required and must be a valid string` };
    }

    return id;
};

const checkHierarchy = (targetJabatan: string, actorJabatan: string | undefined, actorRole: string, isSelf: boolean): void => {
    const actorR = actorRole.toLowerCase();
    const actorJ = actorJabatan?.toLowerCase() || '';
    const targetJ = targetJabatan.toLowerCase();

    // Admin punya kuasa penuh
    if (actorR === 'admin') return;

    if (isSelf) {
        // Hanya Supervisor yang boleh mengatur dirinya sendiri
        if (actorJ !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: Only Supervisor can self-manage records' };
        }
        return;
    }

    // Logika Hierarki: Staff < Manager < Supervisor
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

const validateGajiPayload = (body: any, isUpdate = false): any => {
    const { user_id, nominal, tanggal_berlaku } = body;
    const payload: any = {};

    if (user_id !== undefined || !isUpdate) {
        if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
            throw { code: 400, message: 'Valid user_id is required' };
        }
        payload.user_id = user_id;
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

    if (tanggal_berlaku !== undefined || !isUpdate) {
        if (!tanggal_berlaku || typeof tanggal_berlaku !== 'string' || !tanggal_berlaku.trim() || isNaN(Date.parse(tanggal_berlaku))) {
            throw { code: 400, message: 'Valid tanggal_berlaku is required' };
        }
        payload.tanggal_berlaku = new Date(tanggal_berlaku);
    }

    return payload;
};

const fetchSingleGaji = async (whereClause: any): Promise<Gaji | null> => {
    return await Gaji.findOne({
        where: whereClause,
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });
};

export const createGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const payload = validateGajiPayload(req.body, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    const isSelf = targetUser.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const gaji = await Gaji.create(payload);

    return {
        data: { gaji },
        code: 201,
        message: 'Gaji created successfully',
    };
};

export const getMyGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const gaji = await fetchSingleGaji({ user_id: req.auth.id });

    if (!gaji) {
        throw { code: 404, message: 'Gaji not found' };
    }

    return {
        data: { gaji },
        code: 200,
        message: 'Gaji retrieved successfully',
    };
};

export const getGajiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req, 'userId');
    const gaji = await fetchSingleGaji({ user_id: userId });

    if (!gaji || !gaji.user) {
        throw { code: 404, message: 'Gaji or associated user not found' };
    }

    const isSelf = gaji.user_id === req.auth.id;
    if (!isSelf && req.auth.role.toLowerCase() !== 'admin') {
        checkHierarchy(gaji.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    }

    return {
        data: { gaji },
        code: 200,
        message: 'Gaji retrieved successfully',
    };
};

export const getAllGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const gaji = await Gaji.findAll({
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });

    return {
        data: { gaji },
        code: 200,
        message: 'Gaji retrieved successfully',
    };
};

export const updateGajiTetap = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req, 'userId');
    const gaji = await fetchSingleGaji({ user_id: userId });

    if (!gaji || !gaji.user) {
        throw { code: 404, message: 'Gaji or associated user not found' };
    }

    const isSelf = gaji.user_id === req.auth.id;
    checkHierarchy(gaji.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const payload = validateGajiPayload(req.body, true);

    if (Object.keys(payload).length === 0) {
        throw { code: 400, message: 'At least one field must be provided for update' };
    }

    await gaji.update(payload);

    return {
        data: { gaji },
        code: 200,
        message: 'Gaji updated successfully',
    };
};