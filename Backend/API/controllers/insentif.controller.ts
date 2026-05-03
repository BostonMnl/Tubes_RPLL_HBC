import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Insentif } from 'models/insentif';
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

const checkHierarchy = (targetJabatan: string, actorJabatan: string | undefined, actorRole: string, isSelf: boolean): void => {
    const actorR = actorRole.toLowerCase();
    const actorJ = actorJabatan?.toLowerCase() || '';
    const targetJ = targetJabatan.toLowerCase();

    if (actorR === 'admin') return;

    if (isSelf) {
        if (actorJ !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: You do not have permission to self-manage this record' };
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

const validateInsentifPayload = (body: any, isUpdate = false): any => {
    const { user_id, nominal, keterangan, tanggal } = body;
    const payload: any = {};

    if (user_id !== undefined || !isUpdate) {
        if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
            throw { code: 400, message: 'User id is required' };
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

    if (keterangan !== undefined || !isUpdate) {
        if (!keterangan || typeof keterangan !== 'string' || !keterangan.trim()) {
            throw { code: 400, message: 'Keterangan is required' };
        }
        payload.keterangan = keterangan;
    }

    if (tanggal !== undefined || !isUpdate) {
        if (!tanggal || typeof tanggal !== 'string' || !tanggal.trim() || isNaN(Date.parse(tanggal))) {
            throw { code: 400, message: 'Valid tanggal is required' };
        }
        payload.tanggal = new Date(tanggal);
    }

    return payload;
};

const fetchInsentifList = async (whereClause: any): Promise<Insentif[]> => {
    return await Insentif.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });
};

export const createInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const payload = validateInsentifPayload(req.body, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    const isSelf = targetUser.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const insentif = await Insentif.create(payload);

    return {
        data: { insentif },
        code: 201,
        message: 'Insentif created successfully',
    };
};

export const getMyInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const insentif = await fetchInsentifList({ user_id: req.auth.id });

    return {
        data: { insentif },
        code: 200,
        message: 'Insentif retrieved successfully',
    };
};

export const getInsentifById = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const insentif = await Insentif.findOne({
        where: { insentif_id: id },
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });

    if (!insentif) {
        throw { code: 404, message: 'Insentif not found' };
    }

    if (req.auth.role.toLowerCase() === 'staff' && insentif.user_id !== req.auth.id) {
        throw { code: 403, message: 'Forbidden: You can only view your own insentif' };
    }

    return {
        data: { insentif },
        code: 200,
        message: 'Insentif retrieved successfully',
    };
};

export const getAllInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const insentif = await fetchInsentifList({});

    return {
        code: 200,
        message: 'Insentif records fetched successfully',
        data: { insentif },
    };
};

export const editInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const insentif = await Insentif.findOne({
        where: { insentif_id: id },
        include: [{ model: User, attributes: ['user_id', 'jabatan'] }]
    });

    if (!insentif || !insentif.user) {
        throw { code: 404, message: 'Insentif or associated user not found' };
    }

    if (insentif.payroll_id) {
        throw { code: 400, message: 'Cannot edit insentif that is already linked to a payroll record' };
    }

    const isSelf = insentif.user_id === req.auth.id;
    checkHierarchy(insentif.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const payload = validateInsentifPayload(req.body, true);

    if (Object.keys(payload).length === 0) {
        throw { code: 400, message: 'At least one field must be provided for update' };
    }

    await insentif.update(payload);

    return {
        data: { insentif },
        code: 200,
        message: 'Insentif updated successfully',
    };
};

export const deleteInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const insentif = await Insentif.findOne({
        where: { insentif_id: id },
        include: [{ model: User, attributes: ['user_id', 'jabatan'] }]
    });

    if (!insentif || !insentif.user) {
        throw { code: 404, message: 'Insentif not found' };
    }

    if (insentif.payroll_id) {
        throw { code: 400, message: 'Cannot delete insentif that is already linked to a payroll record' };
    }

    const isSelf = insentif.user_id === req.auth.id;
    checkHierarchy(insentif.user.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    await insentif.destroy();

    return {
        code: 200,
        message: 'Insentif deleted successfully',
        data: null,
    };
};