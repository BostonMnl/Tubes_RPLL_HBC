import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Penalti } from 'models/penalti';
import { User } from 'models/user';
import { Gaji } from 'models/gaji';
import { Op } from 'sequelize';

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

const validatePenaltiPayload = (body: any, file?: Express.Multer.File, isUpdate = false): any => {
    const { user_id, jenis, nominal, keterangan, tanggal, gambar, jumlah_hari } = body;
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
        const nominalNum = Number(nominal || 0);
        if (isNaN(nominalNum) || nominalNum < 0) {
            throw { code: 400, message: 'Nominal must be a valid non-negative number' };
        }
        payload.nominal = nominalNum;
    }

    if (tanggal !== undefined || !isUpdate) {
        if (!tanggal || isNaN(Date.parse(tanggal))) {
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

    if (jumlah_hari !== undefined) {
        const hariNum = Number(jumlah_hari);
        if (!isNaN(hariNum) && hariNum > 0) {
            payload.jumlah_hari = hariNum;
        }
    }

    if (file) {
        payload.gambar = `/uploads/${file.filename}`;
    } else if (gambar !== undefined) {
        payload.gambar = gambar;
    }

    return payload;
};

export const syncUnpaidLeavePenalties = async (userId: string, month: number, year: number): Promise<void> => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const activeGaji = await Gaji.findOne({
        where: {
            user_id: userId,
            tanggal_berlaku: { [Op.lte]: endDate }
        },
        order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']]
    });

    if (!activeGaji) return;

    const penalties = await Penalti.findAll({
        where: {
            user_id: userId,
            jenis: 'Cuti Tidak Berbayar',
            tanggal: { [Op.between]: [startDate, endDate] },
            payroll_id: null
        }
    });

    const upahPerHari = activeGaji.nominal / 22;

    for (const p of penalties) {
        const hari = (p as any).jumlah_hari || 0;
        if (hari > 0) {
            const totalPotongan = Math.round(upahPerHari * hari);
            await p.update({ nominal: totalPotongan });
        }
    }
};

export const createPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validatePenaltiPayload(req.body, file, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) throw { code: 404, message: 'Target user not found' };

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const penalti = await Penalti.create(payload);
    return { data: { penalti }, code: 201, message: 'Penalti created successfully' };
};

export const getMyPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const actorRole = req.auth.role.toLowerCase();
    const actorJabatan = req.auth.jabatan?.toLowerCase() || '';
    const actorId = req.auth.id;

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let accessCondition: any = { user_id: actorId };

    if (actorRole === 'admin') {
        accessCondition = {};
    } else if (actorJabatan === 'supervisor') {
        accessCondition = {
            [Op.or]: [
                { user_id: actorId },
                { '$user.jabatan$': { [Op.in]: ['manager', 'staff'] } }
            ]
        };
    } else if (actorJabatan === 'manager') {
        accessCondition = {
            [Op.or]: [
                { user_id: actorId },
                { '$user.jabatan$': 'staff' }
            ]
        };
    }

    const penalti = await Penalti.findAll({
        where: {
            [Op.and]: [
                accessCondition,
                { tanggal: { [Op.lte]: endOfMonth } }
            ]
        },
        order: [['tanggal', 'DESC']],
        include: [{
            model: User,
            as: 'user',
            attributes: ['nama', 'jabatan'],
            paranoid: false
        }]
    });

    return { data: { penalti }, code: 200, message: 'Penalti retrieved successfully based on hierarchy' };
};

export const getPenaltiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const userId = getParamId(req, 'userId');
    const targetUser = await User.findByPk(userId);
    if (!targetUser) throw { code: 404, message: 'Target user not found' };

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, userId === req.auth.id);

    const penalti = await Penalti.findAll({
        where: { user_id: userId },
        order: [['tanggal', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'], paranoid: false }]
    });

    return { data: { penalti }, code: 200, message: 'User penalties retrieved' };
};

export const getPenaltiById = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const id = getParamId(req);
    const penalti = await Penalti.findOne({
        where: { penalti_id: id },
        include: [{ model: User, as: 'user', attributes: ['user_id', 'nama', 'jabatan', 'role'], paranoid: false }]
    });
    const targetUser = await User.findByPk(penalti?.user_id);

    if (!penalti || !targetUser) throw { code: 404, message: 'Penalti not found' };

    const isSelf = penalti.user_id === req.auth.id;
    if (!isSelf && req.auth.role.toLowerCase() !== 'admin') {
        checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    }

    return { data: { penalti }, code: 200, message: 'Penalti details retrieved' };
};

export const getAllPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const penalti = await Penalti.findAll({
        order: [['tanggal', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['nama', 'jabatan'], paranoid: false }]
    });

    return { data: { penalti }, code: 200, message: 'All penalties retrieved' };
};

export const updatePenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const id = getParamId(req);
    const penalti = await Penalti.findOne({
        where: { penalti_id: id },
        include: [{ model: User, as: 'user', attributes: ['user_id', 'jabatan'] }]
    });

    const targetUser = await User.findByPk(penalti?.user_id);
    if (!penalti || !targetUser) throw { code: 404, message: 'Penalti not found' };
    if (penalti.payroll_id) throw { code: 400, message: 'Penalti is locked by payroll' };

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validatePenaltiPayload(req.body, file, true);

    await penalti.update(payload);
    return { data: { penalti }, code: 200, message: 'Penalti updated successfully' };
};

export const deletePenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) throw { code: 401, message: 'Unauthorized' };

    const id = getParamId(req);
    const penalti = await Penalti.findOne({
        where: { penalti_id: id },
        include: [{ model: User, as: 'user', attributes: ['user_id', 'jabatan'] }]
    });

    const targetUser = await User.findByPk(penalti?.user_id);

    if (!penalti || !targetUser) throw { code: 404, message: 'Penalti not found' };
    if (penalti.payroll_id) throw { code: 400, message: 'Penalti is locked by payroll' };

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    await penalti.destroy();
    return { data: null, code: 200, message: 'Penalti deleted successfully' };
};