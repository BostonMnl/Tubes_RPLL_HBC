import { Request, Response } from 'express';
import { Gaji } from '../../models/gaji';
import { ApiResponse } from '../middlewares/response.middleware';
import { IsUUID } from 'sequelize-typescript';

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

export const getMyGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const gaji = await Gaji.findAll({
        where: { user_id: req.auth.id },
        order: [['createdAt', 'DESC']],
    });

    for (const g of gaji) {
        if (g.deletedAt) {
            throw { code: 404, message: 'Gaji record not found' };
        }
    }

    return {
        code: 200,
        message: 'Gaji fetched successfully',
        data: { gaji },
    }; 
};

export const getGajiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = req.params.userId;

    if (typeof userId !== 'string' || !userId.trim()) {
        throw { code: 400, message: 'User id is required' };
    }

    const gaji = await Gaji.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Gaji fetched successfully',
        data: { gaji },
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
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'All gaji fetched successfully',
        data: { gaji },
    };
};

export const updateGajiTetap = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = req.params.userId;
    const { nominal, tanggal_berlaku } = req.body;

    if (typeof userId !== 'string' || !userId.trim()) {
        throw { code: 400, message: 'User id is required' };
    }

    if (typeof nominal !== 'number' || nominal <= 0) {
        throw { code: 400, message: 'Nominal must be a positive number' };
    }

    if (!tanggal_berlaku || isNaN(Date.parse(tanggal_berlaku))) {
        throw { code: 400, message: 'Valid tanggal_berlaku is required' };
    }

    const gaji = await Gaji.create({
        user_id: userId,
        nominal,
        tanggal_berlaku,
    });

    return {
        code: 201,
        message: 'Gaji tetap updated successfully',
        data: { gaji },
    };
};

export const calculateMonthlyPayroll = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ message: string }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { month, year } = req.body;

    if (typeof month !== 'number' || month < 1 || month > 12) {
        throw { code: 400, message: 'Valid month (1-12) is required' };
    }

    if (typeof year !== 'number' || year < 2020) {
        throw { code: 400, message: 'Valid year is required' };
    }

    // TODO: Implement payroll calculation logic
    // This should:
    // 1. Get all users with gaji_tetap for the period
    // 2. Sum up insentif approved for the month
    // 3. Sum up penalti for the month
    // 4. Calculate: gaji_tetap + insentif - penalti
    // 5. Store in payslip or gaji record

    return {
        code: 200,
        message: `Monthly payroll for ${month}/${year} calculated successfully`,
        data: { message: 'Payroll calculation initiated' },
    };
};

export const getPayslip = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { month, year } = req.query;

    if (!month || !year) {
        throw { code: 400, message: 'Month and year parameters are required' };
    }

    // TODO: Implement payslip retrieval logic
    // This should fetch the calculated payslip for the user for that month

    const gaji = await Gaji.findOne({
        where: { user_id: req.auth.id },
        order: [['createdAt', 'DESC']],
    });

    if (!gaji) {
        throw { code: 404, message: 'Payslip not found' };
    }

    return {
        code: 200,
        message: 'Payslip fetched successfully',
        data: { gaji },
    };
};

export const getPayslipByUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji | null }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = req.params.userId;
    const { month, year } = req.query;

    if (typeof userId !== 'string' || !userId.trim()) {
        throw { code: 400, message: 'User id is required' };
    }

    if (!month || !year) {
        throw { code: 400, message: 'Month and year parameters are required' };
    }

    // TODO: Implement payslip retrieval for admin/manager
    // This should fetch the calculated payslip for the specified user for that month

    const gaji = await Gaji.findOne({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Payslip fetched successfully',
        data: { gaji: gaji || null },
    };
};

export const getPayrollSummary = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ summary: any }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { month, year } = req.query;

    if (!month || !year) {
        throw { code: 400, message: 'Month and year parameters are required' };
    }

    // TODO: Implement payroll summary logic
    // This should show:
    // - Total employees processed
    // - Total gaji_tetap
    // - Total insentif
    // - Total penalti
    // - Total payroll

    return {
        code: 200,
        message: `Payroll summary for ${month}/${year} retrieved successfully`,
        data: { summary: {} },
    };
};


