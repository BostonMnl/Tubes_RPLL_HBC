import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Insentif } from 'models/insentif';
import { User } from 'models/user';
import { Op } from 'sequelize';

type AuthenticatedRequest = Request & {
    auth?: { id: string; role: string; jabatan?: string; };
};

const getParamId = (req: Request, fieldName: string = 'id'): string => {
    const id = req.params[fieldName];
    if (!id || typeof id !== 'string' || !id.trim()) {
        throw { code: 400, message: `${fieldName} is required` };
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
            throw { code: 403, message: 'Forbidden: Only Supervisor can self-manage records' };
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

const validateInsentifPayload = (body: any, file?: Express.Multer.File, isUpdate = false): any => {
    const { user_id, nominal, keterangan, tanggal, gambar } = body;
    const payload: any = {};

    if (user_id !== undefined || !isUpdate) {
        if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
            throw { code: 400, message: 'User id is required' };
        }
        payload.user_id = user_id;
    }

    if (nominal !== undefined || !isUpdate) {
        const nominalNum = Number(nominal);
        if (isNaN(nominalNum) || nominalNum <= 0) {
            throw { code: 400, message: 'Nominal must be a positive number' };
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
        if (!tanggal || isNaN(Date.parse(tanggal))) {
            throw { code: 400, message: 'Valid tanggal is required' };
        }
        payload.tanggal = new Date(tanggal);
    }

    if (file) {
        payload.gambar = `/uploads/${file.filename}`;
    } else if (gambar !== undefined) {
        payload.gambar = gambar;
    }

    return payload;
};

export const createInsentif = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validateInsentifPayload(req.body, file, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const insentif = await Insentif.create(payload);
    
    return { 
        data: { insentif }, 
        code: 201, 
        message: 'Insentif created successfully' 
    };
};

export const getMyInsentif = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const insentif = await Insentif.findAll({
        where: { 
            user_id: req.auth.id, 
            tanggal: { [Op.lte]: endOfMonth } 
        },
        order: [['tanggal', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'] }]
    });

    return { 
        data: { insentif }, 
        code: 200, 
        message: 'Insentif retrieved successfully' 
    };
};

export const getInsentifByUserId = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req, 'userId');
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, userId === req.auth.id);

    const insentif = await Insentif.findAll({
        where: { user_id: userId },
        order: [['tanggal', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'] }]
    });

    return { 
        data: { insentif }, 
        code: 200, 
        message: 'User incentives retrieved' 
    };
};

export const getInsentifById = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const insentif = await Insentif.findOne({ where: { insentif_id: id } });
    const targetUser = await User.findByPk(insentif?.user_id);

    if (!insentif || !targetUser) {
        throw { code: 404, message: 'Insentif not found' };
    }

    const isSelf = insentif.user_id === req.auth.id;
    if (!isSelf && req.auth.role.toLowerCase() !== 'admin') {
        checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    }

    return { 
        data: { insentif }, 
        code: 200, 
        message: 'Insentif details retrieved' 
    };
};

export const getAllInsentif = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const insentif = await Insentif.findAll({
        order: [['tanggal', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'] }]
    });

    return { 
        data: { insentif }, 
        code: 200, 
        message: 'All incentives retrieved' 
    };
};

export const updateInsentif = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const insentif = await Insentif.findOne({ where: { insentif_id: id } });
    const targetUser = await User.findByPk(insentif?.user_id);

    if (!insentif || !targetUser) {
        throw { code: 404, message: 'Insentif not found' };
    }

    if (insentif.payroll_id) {
        throw { code: 400, message: 'Insentif is locked by payroll' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validateInsentifPayload(req.body, file, true);

    await insentif.update(payload);

    return { 
        data: { insentif }, 
        code: 200, 
        message: 'Insentif updated successfully' 
    };
};

export const deleteInsentif = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const insentif = await Insentif.findOne({ where: { insentif_id: id } });
    const targetUser = await User.findByPk(insentif?.user_id);

    if (!insentif || !targetUser) {
        throw { code: 404, message: 'Insentif not found' };
    }

    if (insentif.payroll_id) {
        throw { code: 400, message: 'Insentif is locked by payroll' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    await insentif.destroy();

    return { 
        data: null, 
        code: 200, 
        message: 'Insentif deleted successfully' 
    };
};