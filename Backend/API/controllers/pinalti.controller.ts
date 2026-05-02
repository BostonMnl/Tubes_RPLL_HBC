import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Penalti } from "models/penalti";

type AuthenticatedRequest = Request & {
    auth?: {
        id: string;
        role: string;
    };
};

const getParamId = (req: Request, fieldName: string = 'id'): string => {
    const id = req.params[fieldName];

    if (!id || typeof id !== 'string' || !id.trim()) {
        throw { code: 400, message: `${fieldName} is required and must be a valid string` };
    }

    return id;
};

const checkAuthorization = (role: string, allowedRoles: string[]): void => {
    if (!allowedRoles.includes(role)) {
        throw { code: 403, message: 'Forbidden: Insufficient permissions' };
    }
};

export const createPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    checkAuthorization(req.auth.role, ['Admin', 'Manager']);

    const { user_id, nominal, alasan: keterangan, tanggal } = req.body;

    if (typeof user_id !== 'string' || !user_id.trim()) {
        throw { code: 400, message: 'User id is required' };
    }

    if (typeof nominal !== 'number' || nominal <= 0) {
        throw { code: 400, message: 'Nominal must be a positive number' };
    }

    if (typeof keterangan !== 'string' || !keterangan.trim()) {
        throw { code: 400, message: 'Keterangan is required' };
    }

    if (!tanggal || isNaN(Date.parse(tanggal))) {
        throw { code: 400, message: 'Valid tanggal is required' };
    }

    return {
        data: {
            penalti: await Penalti.create({
                user_id,
                nominal,
                keterangan,
                tanggal,
            }),
        },
        code: 201,
        message: 'Penalti created successfully',
    };
};

export const getPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    if (req.auth.role === 'Staff') {
        const penalti = await Penalti.findOne({
            where: { penalti_id: id, user_id: req.auth.id }
        });

        if (!penalti) {
            throw { code: 404, message: 'Penalti not found' };
        }

        return {
            data: { penalti },
            code: 200,
            message: 'Penalti retrieved successfully',
        };
    }

    checkAuthorization(req.auth.role, ['Admin', 'Manager']);

    const penalti = await Penalti.findOne({
        where: { penalti_id: id }
    });

    if (!penalti) {
        throw { code: 404, message: 'Penalti not found' };
    }

    return {
        data: { penalti },
        code: 200,
        message: 'Penalti retrieved successfully',
    };
};

export const getAllPenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    checkAuthorization(req.auth.role, ['Admin', 'Manager']);

    const penalti = await Penalti.findAll({
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Penalti records fetched successfully',
        data: { penalti },
    };
};

export const updatePenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ penalti: Penalti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    checkAuthorization(req.auth.role, ['Admin', 'Manager']);

    const id = getParamId(req);
    const { nominal, keterangan, tanggal } = req.body;

    if ((nominal == null) && keterangan == null && tanggal == null) {
        throw { code: 400, message: 'At least one field (nominal, keterangan, tanggal) must be provided for update' };
    }

    if (nominal != null) {
        if (typeof nominal !== 'number' || nominal <= 0) {
            throw { code: 400, message: 'Nominal must be a positive number' };
        }
    }

    if (keterangan != null) {
        if (typeof keterangan !== 'string' || !keterangan.trim()) {
            throw { code: 400, message: 'Keterangan is required' };
        }
    }

    if (tanggal != null) {
        if (!tanggal || isNaN(Date.parse(tanggal))) {
            throw { code: 400, message: 'Valid tanggal is required' };
        }
    }

    const penalti = await Penalti.findOne({
        where: { penalti_id: id }
    });

    if (!penalti) {
        throw { code: 404, message: 'Penalti not found' };
    }

    if (penalti.payroll_id) {
        throw { code: 400, message: 'Cannot edit penalti that is already linked to a payroll record' };
    }

    await penalti.update({
        nominal: nominal ?? penalti.nominal,
        keterangan: keterangan ?? penalti.keterangan,
        tanggal: tanggal ?? penalti.tanggal
    });

    return {
        data: { penalti },
        code: 200,
        message: 'Penalti updated successfully',
    };
};

export const deletePenalti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    checkAuthorization(req.auth.role, ['Admin']);

    const id = getParamId(req);

    const penalti = await Penalti.findOne({
        where: { penalti_id: id }
    });

    if (!penalti) {
        throw { code: 404, message: 'Penalti not found' };
    }

    await penalti.destroy();

    return {
        code: 200,
        message: 'Penalti deleted successfully',
        data: null,
    };
};
