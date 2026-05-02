import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Insentif } from "models/insentif";
import { Reimburse } from 'models/reimburse';

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

export const createInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const { nominal, keterangan, tanggal } = req.body;

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
            insentif: await Insentif.create({
                user_id: req.auth.id,
                nominal,
                keterangan,
                tanggal,
            }),
        },
        code: 201,
        message: 'Insentif created successfully',
    };
}

export const getMyInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const insentif = await Insentif.findAll({
        where: { user_id: req.auth.id },
        order: [['createdAt', 'DESC']],
    });

    if (!insentif) {
        throw { code: 404, message: 'No insentif found for this user' };
    }    

    return {
        data: { insentif },
        code: 200,
        message: 'Insentif retrieved successfully',
    };
}

export const getInsentifById = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const insentif = await Insentif.findOne({
        where: { insentif_id: id}
    });

    if (!insentif) {
        throw { code: 404, message: 'Insentif not found' };
    }

    return {
        data: { insentif },
        code: 200,
        message: 'Insentif retrieved successfully',
    };
}

export const getAllInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ insentif: Insentif[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const insentif = await Insentif.findAll({
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Reimburse requests fetched successfully',
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

    const insentif = await Insentif.findOne({
        where: { insentif_id: id }
    });

    if (!insentif) {
        throw { code: 404, message: 'Insentif not found' };
    }

    if (insentif.payroll_id) {
        throw { code: 400, message: 'Cannot edit insentif that is already linked to a payroll record' };
    }

    await insentif.update({
        nominal: nominal ?? insentif.nominal,
        keterangan: keterangan ?? insentif.keterangan,
        tanggal: tanggal ?? insentif.tanggal
    });

    return {
        data: { insentif },
        code: 200,
        message: 'Insentif updated successfully',
    };
}

export const deleteInsentif = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<null>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const id = getParamId(req);

    const insentif = await Insentif.findOne({
        where: { insentif_id: id, user_id: req.auth.id }
    });

    if (!insentif) {
        throw { code: 404, message: 'Insentif not found' };
    }

    if (!insentif.payroll_id) {
        throw { code: 400, message: 'Cannot delete insentif that is not linked to a payroll record' };
    }

    await insentif.destroy();

    return {
        code: 200,
        message: 'Insentif deleted successfully',
        data: null,
    };
}