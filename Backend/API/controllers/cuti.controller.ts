import { Request, Response } from "express";
import { ApiResponse } from '../middlewares/response.middleware';
import { Op } from "sequelize";
import { Cuti } from "models/cuti";
import { User } from "models/user";
import { Absensi } from "models/absensi";

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
            throw { code: 403, message: 'Forbidden: You do not have permission to self-approve or self-manage this record' };
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

const validateCutiPayload = (body: any, isUpdate = false): any => {
    const { user_id, tanggal_mulai, tanggal_akhir, jenis_cuti, keterangan } = body;
    const payload: any = {};

    if (user_id !== undefined || !isUpdate) {
        if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
            throw { code: 400, message: 'Valid user_id is required' };
        }
        payload.user_id = user_id;
    }

    if (tanggal_mulai !== undefined || tanggal_akhir !== undefined || !isUpdate) {
        const startStr = tanggal_mulai ?? body.tanggal_mulai;
        const endStr = tanggal_akhir ?? body.tanggal_akhir;

        if (!startStr || isNaN(Date.parse(startStr))) {
            throw { code: 400, message: 'Valid tanggal_mulai is required' };
        }
        if (!endStr || isNaN(Date.parse(endStr))) {
            throw { code: 400, message: 'Valid tanggal_akhir is required' };
        }

        const startDate = new Date(startStr);
        const endDate = new Date(endStr);

        if (endDate < startDate) {
            throw { code: 400, message: 'tanggal_akhir must be after or equal to tanggal_mulai' };
        }

        payload.tanggal_mulai = startDate;
        payload.tanggal_akhir = endDate;
    }

    if (keterangan !== undefined || !isUpdate) {
        if (!keterangan || typeof keterangan !== 'string' || !keterangan.trim()) {
            throw { code: 400, message: 'Keterangan is required' };
        }
        payload.keterangan = keterangan;
    }

    if (jenis_cuti !== undefined || !isUpdate) {
        const validJenis = ['Cuti_Tahunan', 'Cuti_Sakit', 'Cuti_Melahirkan', 'Cuti_Lainnya'];
        if (!jenis_cuti || typeof jenis_cuti !== 'string' || !validJenis.includes(jenis_cuti)) {
            throw { code: 400, message: 'Invalid jenis_cuti value' };
        }
        payload.jenis_cuti = jenis_cuti;
        payload.is_paid = jenis_cuti !== 'Cuti_Lainnya';
    }

    return payload;
};

const fetchCutiList = async (whereClause: any): Promise<Cuti[]> => {
    return await Cuti.findAll({
        where: whereClause,
        include: [{ model: User, as: 'user', attributes: ['user_id', 'nama', 'jabatan', 'departemen', 'role'] }],
        order: [['createdAt', 'DESC']],
    });
};

const padTwo = (value: number): string => String(value).padStart(2, '0');

const formatDateOnly = (date: Date): string => {
    return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
};

const createAbsensiForCuti = async (cuti: Cuti): Promise<void> => {
    const status = cuti.jenis_cuti === 'Cuti_Sakit' ? 'Sakit' : 'Cuti';
    const start = new Date(cuti.tanggal_mulai);
    const end = new Date(cuti.tanggal_akhir);

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const date = formatDateOnly(cursor);
        const existing = await Absensi.findOne({
            where: {
                user_id: cuti.user_id,
                date,
            },
        });

        if (existing) {
            continue;
        }

        await Absensi.create({
            date,
            jam_masuk: '00:00:00',
            jam_keluar: null,
            status,
            qr_code: 'CUTI',
            user_id: cuti.user_id,
        });
    }
};

export const createMyCutiRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const payload = validateCutiPayload({ ...req.body, user_id: req.auth.id }, false);
    
    // Auto-approve logic for Supervisor
    if (req.auth.jabatan?.toLowerCase() === 'supervisor') {
        payload.status = 'Approved';
        payload.disetujui_oleh = req.auth.id;
    } else {
        payload.status = 'Pending';
    }

    const cuti = await Cuti.create(payload);

    if (cuti.status === 'Approved') {
        await createAbsensiForCuti(cuti);
    }

    return {
        data: { cuti },
        code: 201,
        message: 'Cuti request created successfully',
    };
};

export const createRequestCutiForUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const payload = validateCutiPayload(req.body, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    const isSelf = targetUser.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    // If a higher up creates a request for a lower up, it is automatically approved
    payload.status = 'Approved';
    payload.disetujui_oleh = req.auth.id;

    const cuti = await Cuti.create(payload);

    if (cuti.status === 'Approved') {
        await createAbsensiForCuti(cuti);
    }

    return {
        data: { cuti },
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

    const cuti = await fetchCutiList({ user_id: req.auth.id });

    return {
        code: 200,
        message: 'Cuti fetched successfully',
        data: { cuti },
    };
};

export const getCutiByUserId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const userId = getParamId(req, 'id');
    const targetUser = await User.findByPk(userId);

    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    const isSelf = targetUser.user_id === req.auth.id;
    if (!isSelf && req.auth.role.toLowerCase() !== 'admin') {
         checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    }

    const cuti = await fetchCutiList({ user_id: userId });

    return {
        code: 200,
        message: 'Cuti fetched successfully',
        data: { cuti },
    };
};

export const getAllCutiRequests = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const { status } = req.query;
    const whereClause: any = {};
    
    if (status && ['Pending', 'Approved', 'Rejected'].includes(String(status))) {
        whereClause.status = status;
    } else {
        whereClause.status = 'Pending';
    }

    const cuti = await fetchCutiList(whereClause);

    return {
        code: 200,
        message: 'Cuti requests fetched successfully',
        data: { cuti },
    };
};

export const getAllCuti = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ cuti: Cuti[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }
    
    const cuti = await fetchCutiList({});

    return {
        code: 200,
        message: 'All cuti fetched successfully',
        data: { cuti },
    };
};

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
        include: [{ model: User, as: 'user', attributes: ['jabatan'] }]
    });

    const targetUser = await User.findByPk(cuti?.user_id);

    if (!cuti || !targetUser) {
        throw { code: 404, message: 'Cuti record or associated user not found' };
    }

    const isSelf = cuti.user_id === req.auth.id;
    checkHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);

    cuti.status = status;
    cuti.disetujui_oleh = req.auth.id;
    await cuti.save();

    if (status === 'Approved') {
        await createAbsensiForCuti(cuti);
    }

    return {
        code: 200,
        message: `Cuti request ${status.toLowerCase()} successfully`,
        data: { cuti },
    };
};

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

    if (!cuti) {
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
};