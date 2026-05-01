import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Reimburse } from 'models/reimburse';

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

export const createMyReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const { nominal, tanggal_pengajuan } = req.body;

    if (typeof nominal !== 'number' || nominal <= 0) {
        throw { code: 400, message: 'Nominal must be a positive number' };
    }

    if (!tanggal_pengajuan || isNaN(Date.parse(tanggal_pengajuan))) {
        throw { code: 400, message: 'Valid tanggal_pengajuan is required' };
    }

    return {
        data: {
            reimburse: await Reimburse.create({
                user_id: req.auth.id,
                nominal,
                tanggal_pengajuan,
            }),
        },
        code: 201,
        message: 'Reimburse request created successfully',
    };
}

export const createReimburseRequestForUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const { user_id, nominal, tanggal_pengajuan } = req.body;

    if (typeof nominal !== 'number' || nominal <= 0) {
        throw { code: 400, message: 'Nominal must be a positive number' };
    }

    if (!tanggal_pengajuan || isNaN(Date.parse(tanggal_pengajuan))) {
        throw { code: 400, message: 'Valid tanggal_pengajuan is required' };
    }

    return {
        data: {
            reimburse: await Reimburse.create({
                user_id,
                nominal,
                tanggal_pengajuan,
            }),
        },
        code: 201,
        message: 'Reimburse request created successfully',
    };
}

export const getMyReimburse = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const reimburse = await Reimburse.findAll({
        where: { user_id: req.auth.id },
        order: [['createdAt', 'DESC']],
    });

    for (const g of reimburse) {
        if (g.deletedAt) {
            throw { code: 404, message: 'Reimburse record not found' };
        }
    }

    return {
        code: 200,
        message: 'Reimburse fetched successfully',
        data: { reimburse },
    };
};

export const getReimburseById = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const id = getParamId(req);

    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id },
    });

    if (!reimburse || reimburse.deletedAt) {
        throw { code: 404, message: 'Reimburse record not found' };
    }

    // User can only view their own, but admin/manager can view any
    if (req.auth.role === 'Staff' && reimburse.user_id !== req.auth.id) {
        throw { code: 403, message: 'Forbidden: You can only view your own reimburse requests' };
    }

    return {
        code: 200,
        message: 'Reimburse fetched successfully',
        data: { reimburse },
    };
};

export const getAllReimburseRequests = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    // Filter by status if provided (default: Pending)
    const { status } = req.query;
    const whereClause: any = {};
    
    if (status && ['Pending', 'Approved', 'Rejected'].includes(String(status))) {
        whereClause.status = status;
    } else {
        whereClause.status = 'Pending';
    }

    const reimburse = await Reimburse.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Reimburse requests fetched successfully',
        data: { reimburse },
    };
};

export const approveDeclineReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    const { status } = req.body;
    const currentDate = new Date();

    if (status !== 'Approved' && status !== 'Rejected') {
        throw { code: 400, message: 'Status must be either Approved or Rejected' };
    }

    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id },
    });

    if (!reimburse || reimburse.deletedAt) {
        throw { code: 404, message: 'Reimburse record not found or deleted' };
    }

    const pengajuanDate = new Date(reimburse.tanggal);

    const monthDiff = (currentDate.getFullYear() - pengajuanDate.getFullYear()) * 12 + (currentDate.getMonth() - pengajuanDate.getMonth());

    // Jika selisih bulan lebih dari 1, berarti sudah melewati batas maksimal 1 siklus payroll berikutnya
    if (monthDiff > 1) {
        throw {
            code: 400,
            message: 'Reimburse request has expired. It can only be processed within the current or next payroll cycle.'
        };
    }

    // Reminder: Buat sistem auto-reject jika data berstatus 'pending' dan (currentDate - pengajuanDate) memiliki monthDiff > 1

    reimburse.status = status;
    await reimburse.save();

    return {
        code: 200,
        message: `Reimburse request ${status.toLowerCase()} successfully`,
        data: { reimburse },
    };
};

export const getAllReimburseHistory = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const reimburse = await Reimburse.findAll({
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Reimburse history fetched successfully',
        data: { reimburse },
    };

}

export const deleteReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id},
    });

    if (!reimburse || reimburse.deletedAt) {
        throw { code: 404, message: 'Reimburse record not found' };
    }

    if (reimburse.status !== 'Pending') {
        throw { code: 400, message: 'Only pending reimburse requests can be deleted' };
    }

    // User can only delete their own, but admin/manager can delete any pending
    if (req.auth.role === 'Staff' && reimburse.user_id !== req.auth.id) {
        throw { code: 403, message: 'Forbidden: You can only delete your own reimburse requests' };
    }

    await reimburse.destroy();
    return {
        code: 200,
        message: 'Reimburse request deleted successfully',
        data: { reimburse },
    };
}

export const deleteMyReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    
    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id},
    });

    if (!reimburse || reimburse.deletedAt) {
        throw { code: 404, message: 'Reimburse record not found' };
    }

    if (reimburse.user_id !== req.auth.id) {
        throw { code: 403, message: 'Forbidden: You can only delete your own reimburse requests' };
    }

    if (reimburse.status !== 'Pending') {
        throw { code: 400, message: 'Only pending reimburse requests can be deleted' };
    }

    await reimburse.destroy();
    return {
        code: 200,
        message: 'Reimburse request deleted successfully',
        data: { reimburse },
    };
}