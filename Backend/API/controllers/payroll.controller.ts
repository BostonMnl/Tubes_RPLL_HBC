import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Payroll } from 'models/payroll';
import { User } from 'models/user';
import { Gaji } from 'models/gaji';
import { Insentif } from 'models/insentif';
import { Reimburse } from 'models/reimburse';
import { Penalti } from 'models/penalti';
import { Op } from 'sequelize';
import { syncUnpaidLeavePenalties } from './pinalti.controller';

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

    if (actorR === 'admin') {
        return;
    }

    if (isSelf) {
        if (actorJ !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: Only Supervisor can manage their own payroll records' };
        }
        return;
    }

    if (targetJ === 'staff') {
        if (!['manager', 'supervisor'].includes(actorJ)) {
            throw { code: 403, message: 'Forbidden: Only Manager or Supervisor can manage Staff payroll' };
        }
    } else if (targetJ === 'manager') {
        if (actorJ !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: Only Supervisor can manage Manager payroll' };
        }
    } else {
        throw { code: 403, message: 'Forbidden: Insufficient hierarchy permissions' };
    }
};

const fetchPayrollList = async (whereClause: any): Promise<Payroll[]> => {
    return await Payroll.findAll({
        where: whereClause,
        order: [['tahun', 'DESC'], ['bulan', 'DESC']],
        include: [{ model: User, as: 'user', attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });
};

export const processUserPayroll = async (userId: string, bulan: number, tahun: number): Promise<Payroll | null> => {
    const existingPayroll = await Payroll.findOne({
        where: { user_id: userId, bulan, tahun }
    });

    if (existingPayroll) {
        return null;
    }

    await syncUnpaidLeavePenalties(userId, bulan, tahun);

    // LOGIKA CUTOFF 25:
    // Tanggal 26 Bulan Lalu
    const startDate = new Date(tahun, bulan - 2, 26, 0, 0, 0);
    // Tanggal 25 Bulan Ini
    const endDate = new Date(tahun, bulan - 1, 25, 23, 59, 59);

    const gaji = await Gaji.findOne({
        where: {
            user_id: userId,
            tanggal_berlaku: { [Op.lte]: endDate }
        },
        order: [['tanggal_berlaku', 'DESC'], ['createdAt', 'DESC']]
    });

    const gajiPokok = gaji ? gaji.nominal : 0;

    const insentifs = await Insentif.findAll({
        where: {
            user_id: userId,
            payroll_id: null,
            tanggal: { [Op.between]: [startDate, endDate] }
        }
    });
    const totalInsentif = insentifs.reduce((sum, item) => sum + Number(item.nominal), 0);

    const penaltis = await Penalti.findAll({
        where: {
            user_id: userId,
            payroll_id: null,
            tanggal: { [Op.between]: [startDate, endDate] }
        }
    });
    const totalPenalti = penaltis.reduce((sum, item) => sum + Number(item.nominal), 0);

    const reimburses = await Reimburse.findAll({
        where: {
            user_id: userId,
            status: 'Approved',
            payroll_id: null,
            tanggal: { [Op.between]: [startDate, endDate] }
        }
    });
    const totalReimburse = reimburses.reduce((sum, item) => sum + Number(item.nominal), 0);

    const takeHomePay = (gajiPokok + totalInsentif + totalReimburse) - totalPenalti;

    const payroll = await Payroll.create({
        user_id: userId,
        bulan,
        tahun,
        gaji_pokok: gajiPokok,
        total_insentif: totalInsentif,
        total_reimburse: totalReimburse,
        total_penalti: totalPenalti,
        take_home_pay: takeHomePay
    });

    const payrollId = (payroll as any).payroll_id;

    await Insentif.update(
        { payroll_id: payrollId },
        { where: { user_id: userId, payroll_id: null, tanggal: { [Op.between]: [startDate, endDate] } } }
    );

    await Penalti.update(
        { payroll_id: payrollId },
        { where: { user_id: userId, payroll_id: null, tanggal: { [Op.between]: [startDate, endDate] } } }
    );

    await Reimburse.update(
        { payroll_id: payrollId },
        { where: { user_id: userId, status: 'Approved', payroll_id: null, tanggal: { [Op.between]: [startDate, endDate] } } }
    );

    return payroll;
};

export const createPayroll = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ payroll: Payroll }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { user_id, bulan, tahun } = req.body;
    const targetUser = await User.findByPk(user_id);

    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const payroll = await processUserPayroll(user_id, Number(bulan), Number(tahun));

    if (!payroll) {
        throw { code: 400, message: 'Payroll for this period already exists' };
    }

    return {
        data: { payroll },
        code: 201,
        message: 'Payroll generated successfully'
    };
};

export const getMyPayroll = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ payroll: Payroll[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const payroll = await fetchPayrollList({ user_id: req.auth.id });

    return {
        data: { payroll },
        code: 200,
        message: 'Payroll retrieved successfully'
    };
};

export const getPayrollByUserId = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ payroll: Payroll[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req, 'userId');
    const targetUser = await User.findByPk(userId);

    if (!targetUser) {
        throw { code: 404, message: 'User not found' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const payroll = await fetchPayrollList({ user_id: userId });

    return {
        data: { payroll },
        code: 200,
        message: 'Payroll retrieved successfully'
    };
};

export const getPayrollById = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ payroll: Payroll }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const payroll = await Payroll.findOne({
        where: { payroll_id: id },
        include: [{ model: User, as: 'user', attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });
    const targetUser = await User.findByPk(payroll?.user_id);

    if (!payroll || !targetUser) {
        throw { code: 404, message: 'Payroll record not found' };
    }

    const isSelf = payroll.user_id === req.auth.id;
    if (!isSelf && req.auth.role.toLowerCase() !== 'admin') {
        checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    }

    return {
        data: { payroll },
        code: 200,
        message: 'Payroll record retrieved successfully'
    };
};

export const getAllPayroll = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<{ payroll: Payroll[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const payroll = await fetchPayrollList({});

    return {
        data: { payroll },
        code: 200,
        message: 'All payroll records retrieved successfully'
    };
};

export const deletePayroll = async (req: AuthenticatedRequest, _res: Response): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const payroll = await Payroll.findOne({
        where: { payroll_id: id },
        include: [{ model: User, as: 'user', attributes: ['user_id', 'jabatan'] }]
    });

    const targetUser = await User.findByPk(payroll?.user_id);

    if (!payroll || !targetUser) {
        throw { code: 404, message: 'Payroll record not found' };
    }

    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, targetUser.user_id === req.auth.id);

    const payrollId = (payroll as any).payroll_id;

    await Insentif.update({ payroll_id: null }, { where: { payroll_id: payrollId } });
    await Penalti.update({ payroll_id: null }, { where: { payroll_id: payrollId } });
    await Reimburse.update({ payroll_id: null }, { where: { payroll_id: payrollId } });

    await payroll.destroy();

    return {
        data: null,
        code: 200,
        message: 'Payroll record deleted successfully. Linked records unlinked.'
    };
};