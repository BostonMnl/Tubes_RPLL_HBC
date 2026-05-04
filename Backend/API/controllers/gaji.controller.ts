import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Gaji } from 'models/gaji';
import { User } from 'models/user';
import { Payroll } from 'models/payroll';
import { Op } from 'sequelize';

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

const normalizeToPeriod = (dateInput: string | Date): Date => {
    const d = new Date(dateInput);
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
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
        const nominalNum = Number(nominal);
        if (isNaN(nominalNum) || nominalNum <= 0) {
            throw { code: 400, message: 'Nominal must be a valid positive number' };
        }
        payload.nominal = nominalNum;
    }

    if (tanggal_berlaku !== undefined || !isUpdate) {
        if (!tanggal_berlaku || isNaN(Date.parse(tanggal_berlaku))) {
            throw { code: 400, message: 'Valid tanggal_berlaku is required' };
        }
        payload.tanggal_berlaku = normalizeToPeriod(tanggal_berlaku);
    }

    return payload;
};

export const createGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const payload = validateGajiPayload(req.body, false);
    const targetUser = await User.findByPk(payload.user_id);
    
    if (!targetUser) throw { code: 404, message: 'Target user not found' };
    
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const now = new Date();
    const maxFutureDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    if (payload.tanggal_berlaku > maxFutureDate) {
        throw { 
            code: 400, 
            message: 'Cannot create salary for more than 1 month in advance' 
        };
    }

    const existingGaji = await Gaji.findOne({
        where: {
            user_id: payload.user_id,
            tanggal_berlaku: payload.tanggal_berlaku
        }
    });

    if (existingGaji) {
        throw { code: 400, message: 'Gaji for this month period already exists. Use update endpoint.' };
    }

    const gaji = await Gaji.create(payload);
    return { data: { gaji }, code: 201, message: 'Gaji created successfully' };
};

export const getMyGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const currentPeriod = normalizeToPeriod(new Date());

    const gaji = await Gaji.findOne({
        where: { 
            user_id: req.auth.id,
            tanggal_berlaku: { [Op.lte]: currentPeriod }
        },
        order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'] }]
    });

    if (!gaji) throw { code: 404, message: 'No active salary record found' };

    return {
        data: { gaji },
        code: 200,
        message: 'Active salary retrieved successfully',
    };
};

export const getGajiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const userId = getParamId(req, 'userId');
    const targetUser = await User.findByPk(userId);
    if (!targetUser) throw { code: 404, message: 'User not found' };

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, userId === req.auth.id);

    const currentPeriod = normalizeToPeriod(new Date());

    const gaji = await Gaji.findOne({
        where: { 
            user_id: userId,
            tanggal_berlaku: { [Op.lte]: currentPeriod }
        },
        order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']]
    });

    if (!gaji) throw { code: 404, message: 'No active gaji found for this user' };
    
    return {
        data: { gaji },
        code: 200,
        message: 'User active salary retrieved successfully',
    };
};

// export const getAllMyGaji = async (
//     req: AuthenticatedRequest,
//     _res: Response
// ): Promise<ApiResponse<{ gaji: Gaji[] }>> => {
//     if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

//     const allGaji = await Gaji.findAll({
//         where: { user_id: req.auth.id },
//         order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']],
//         include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'] }]
//     });

//     const gajiByPeriod = new Map<string, Gaji>();
//     allGaji.forEach(g => {
//         const d = new Date(g.tanggal_berlaku);
//         const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
//         if (!gajiByPeriod.has(key)) gajiByPeriod.set(key, g);
//     });

//     return { 
//         data: { gaji: Array.from(gajiByPeriod.values()) }, 
//         code: 200, 
//         message: 'Salary history retrieved' 
//     };
// };

// export const getAllGajiByUserId = async (
//     req: AuthenticatedRequest,
//     _res: Response
// ): Promise<ApiResponse<{ gaji: Gaji[] }>> => {
//     if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

//     const userId = getParamId(req, 'userId');
//     const targetUser = await User.findByPk(userId);
//     if (!targetUser) throw { code: 404, message: 'User not found' };

//     checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, userId === req.auth.id);

//     const allGaji = await Gaji.findAll({
//         where: { user_id: userId },
//         order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']]
//     });

//     const gajiByPeriod = new Map<string, Gaji>();
//     allGaji.forEach(g => {
//         const d = new Date(g.tanggal_berlaku);
//         const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
//         if (!gajiByPeriod.has(key)) gajiByPeriod.set(key, g);
//     });

//     return { 
//         data: { gaji: Array.from(gajiByPeriod.values()) }, 
//         code: 200, 
//         message: 'User salary history retrieved' 
//     };
// };

export const getAllGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji[] }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const currentPeriod = normalizeToPeriod(new Date());

    const allGaji = await Gaji.findAll({
        where: {
            tanggal_berlaku: { [Op.lte]: currentPeriod }
        },
        order: [
            ['user_id', 'ASC'],
            ['tanggal_berlaku', 'DESC'],
            ['createdAt', 'DESC']
        ],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan', 'role'] }]
    });

    const latestGajiPerUser = new Map<string, Gaji>();
    allGaji.forEach(g => {
        if (!latestGajiPerUser.has(g.user_id)) {
            latestGajiPerUser.set(g.user_id, g);
        }
    });

    return {
        data: { gaji: Array.from(latestGajiPerUser.values()) },
        code: 200,
        message: 'All users active salaries retrieved successfully',
    };
};

export const updateGajiTetap = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const userId = getParamId(req, 'userId');
    const targetUser = await User.findByPk(userId);
    
    const gaji = await Gaji.findOne({
        where: { user_id: userId },
        order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']]
    });

    if (!gaji || !targetUser) {
        throw { code: 404, message: 'Gaji or associated user not found' };
    }

    const isSelf = gaji.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    const date = new Date(gaji.tanggal_berlaku);
    const bulan = date.getMonth() + 1;
    const tahun = date.getFullYear();

    const payrollExists = await Payroll.findOne({
        where: {
            user_id: userId,
            bulan: bulan,
            tahun: tahun
        }
    });

    if (payrollExists) {
        throw { 
            code: 400, 
            message: 'Cannot update salary: Payroll for this period has already been generated and locked' 
        };
    }

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