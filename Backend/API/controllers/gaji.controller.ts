import { Request, Response } from 'express';
import { Gaji } from '../../models/gaji';
import { ApiResponse } from '../middlewares/response.middleware';

type AuthenticatedRequest = Request & {
    auth?: {
        id: string;
        role: string;
    };
};

export const createGaji = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ gaji: Gaji }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { user_id, nominal, tanggal_berlaku } = req.body;

    if (typeof user_id !== 'string' || !user_id.trim()) {
        throw { code: 400, message: 'Valid user_id is required' };
    }

    if (typeof nominal !== 'number' || nominal <= 0) {
        throw { code: 400, message: 'Nominal must be a positive number' };
    }

    if (!tanggal_berlaku || isNaN(Date.parse(tanggal_berlaku))) {
        throw { code: 400, message: 'Valid tanggal_berlaku is required' };
    }

    const gaji = await Gaji.create({
        user_id,
        nominal,
        tanggal_berlaku,
    });

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

    const gaji = await Gaji.findOne({
        where: { user_id: req.auth.id }
    });

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

    const { userId } = req.params;

    const gaji = await Gaji.findOne({
        where: { user_id: userId }
    });

    if (!gaji) {
        throw { code: 404, message: 'Gaji not found' };
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
    const gaji = await Gaji.findAll();

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
    const { userId } = req.params;
    const { nominal, tanggal_berlaku } = req.body;

    if (typeof nominal !== 'number' || nominal <= 0) {
        throw { code: 400, message: 'Nominal must be a positive number' };
    }

    if (!tanggal_berlaku || isNaN(Date.parse(tanggal_berlaku))) {
        throw { code: 400, message: 'Valid tanggal_berlaku is required' };
    }

    const gaji = await Gaji.findOne({
        where: { user_id: userId }
    });

    if (!gaji) {
        throw { code: 404, message: 'Gaji not found' };
    }

    gaji.nominal = nominal;
    gaji.tanggal_berlaku = tanggal_berlaku;
    await gaji.save();

    return {
        data: { gaji },
        code: 200,
        message: 'Gaji updated successfully',
    };
};

// const deleteGaji = async (
//     req: AuthenticatedRequest,
//     _res: Response
// ): Promise<ApiResponse<null>> => {
//     if (!req.auth?.id) {
//         throw { code: 401, message: 'Unauthorized' };
//     }
//     const { userId } = req.params;

//     const gaji = await Gaji.findOne({
//         where: { user_id: userId }
//     });

//     if (!gaji) {
//         throw { code: 404, message: 'Gaji not found' };
//     }
//     await gaji.destroy();

//     return {
//         data: null,
//         code: 200,
//         message: 'Gaji deleted successfully',
//     };
// };