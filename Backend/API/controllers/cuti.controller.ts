import { Request, Response } from "express";
import { Cuti } from "models/cuti";
import { ApiResponse } from '../middlewares/response.middleware';
import { Op } from "sequelize/lib/operators";

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

export const createMyCutiRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { tanggal_mulai, tanggal_akhir, jenis_cuti, keterangan } = req.body;
    const startDate = new Date(tanggal_mulai);
    const endDate = new Date(tanggal_akhir);

    if (!tanggal_mulai || isNaN(startDate.getTime())) {
        throw { code: 400, message: 'tanggal_mulai is required' };
    }

    if (!tanggal_akhir || isNaN(endDate.getTime())) {
        throw { code: 400, message: 'tanggal_akhir is required' };
    }

    if (endDate < startDate) {
        throw { code: 400, message: 'tanggal_akhir must be after or equal to tanggal_mulai' };
    }

    if (typeof keterangan !== 'string' || !keterangan.trim()) {
        throw { code: 400, message: 'keterangan is required' };
    }

    if (typeof jenis_cuti !== 'string' || !jenis_cuti.trim()) {
        throw { code: 400, message: 'jenis_cuti is required' };
    }

    if (!['Cuti_Tahunan', 'Cuti_Sakit', 'Cuti_Melahirkan', 'Cuti_Lainnya'].includes(jenis_cuti)) {
        throw { code: 400, message: 'Invalid jenis_cuti value' };
    }

    const is_paid = jenis_cuti != 'Cuti_Lainnya' ? true : false;

    return {
        data: {
            cuti: await Cuti.create({
                user_id: req.auth.id,
                tanggal_mulai,
                tanggal_akhir,
                jenis_cuti,
                is_paid,
                keterangan
            }),
        },
        code: 201,
        message: 'Cuti request created successfully',
    };
}

export const createRequestCutiForUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const { user_id, tanggal_mulai, tanggal_akhir, jenis_cuti, keterangan } = req.body;
    const startDate = new Date(tanggal_mulai);
    const endDate = new Date(tanggal_akhir);

    if (!tanggal_mulai || isNaN(startDate.getTime())) {
        throw { code: 400, message: 'tanggal_mulai is required' };
    }

    if (!tanggal_akhir || isNaN(endDate.getTime())) {
        throw { code: 400, message: 'tanggal_akhir is required' };
    }

    if (endDate < startDate) {
        throw { code: 400, message: 'tanggal_akhir must be after or equal to tanggal_mulai' };
    }

    if (typeof keterangan !== 'string' || !keterangan.trim()) {
        throw { code: 400, message: 'keterangan is required' };
    }

    if (typeof jenis_cuti !== 'string' || !jenis_cuti.trim()) {
        throw { code: 400, message: 'jenis_cuti is required' };
    }

    if (!['Cuti_Tahunan', 'Cuti_Sakit', 'Cuti_Melahirkan', 'Cuti_Lainnya'].includes(jenis_cuti)) {
        throw { code: 400, message: 'Invalid jenis_cuti value' };
    }

    const is_paid = jenis_cuti != 'Cuti_Lainnya' ? true : false;

    return {
        data: {
            cuti: await Cuti.create({
                user_id,
                tanggal_mulai,
                tanggal_akhir,
                jenis_cuti,
                is_paid,
                keterangan
            }),
        },
        code: 201,
        message: 'Cuti request created successfully',
    };
};

export const getMyCuti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const cuti = await Cuti.findAll({
        where: { user_id: req.auth.id },
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Cuti fetched successfully',
        data: { cuti },
    };
}

export const getCutiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req);

    const cuti = await Cuti.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Cuti fetched successfully',
        data: { cuti },
    };
}

export const getAllCutiRequests = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti[] }>> => {
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

    const cuti = await Cuti.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
    });

    return {
        code: 200,
        message: 'Cuti requests fetched successfully',
        data: { cuti },
    };
}

// approve and decline cuti request with this rule:     Payday date: Tanggal 1 setiap bulan  
// Cut-Off date: Tanggal 25 setiap bulan (setiap request reimburse dll. yang melebihi tanggal itu akan di proses ke payroll berikutnya)
// Automatic Payroll Calculation date : Tanggal 26 jam 02:00 WIB setiap bulan
export const approveDeclineCutiRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    const id = getParamId(req);
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
        throw { code: 400, message: 'Invalid status value' };
    }

    const cuti = await Cuti.findOne({
        where: { cuti_id: id },
    });

    if (!cuti || cuti.deletedAt) {
        throw { code: 404, message: 'Cuti record not found or deleted' };
    }

    cuti.status = status;
    await cuti.save();
    return {
        code: 200,
        message: `Cuti request ${status.toLowerCase()} successfully`,
        data: { cuti },

    };
}

export const getRemainingCutiQuota = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ sisa_cuti: number; total_terpakai: number; jatah_tahunan: number }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const JATAH_TAHUNAN = 12;
    const currentYear = new Date().getFullYear();

    const cutiTerpakai = await Cuti.findAll({
        where: {
            user_id: req.auth.id,
            jenis_cuti: 'Cuti_Tahunan',
            status: ['Pending', 'Approved'],
            tanggal_mulai: {
                [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
            }
        }
    });

    let totalHariTerpakai = 0;

    for (const cuti of cutiTerpakai) {
        const start = new Date(cuti.tanggal_mulai);
        const end = new Date(cuti.tanggal_akhir);

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const hariCuti = diffDays + 1; 

        totalHariTerpakai += hariCuti;
    }

    const sisaCuti = JATAH_TAHUNAN - totalHariTerpakai;

    return {
        code: 200,
        message: 'Sisa kuota cuti berhasil diambil',
        data: {
            sisa_cuti: sisaCuti,
            total_terpakai: totalHariTerpakai,
            jatah_tahunan: JATAH_TAHUNAN
        },
    };
};

export const deleteMyCutiRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const cuti = await Cuti.findOne({
        where: { cuti_id: id, user_id: req.auth.id },
    });

    if (!cuti || cuti.deletedAt) {
        throw { code: 404, message: 'Cuti record not found' };
    }

    if (cuti.status !== 'Pending') {
        throw { code: 400, message: 'Only pending cuti requests can be deleted' };
    }

    await cuti.destroy();
    return {
        code: 200,
        message: 'Cuti request deleted successfully',
        data: { cuti },
    };
}