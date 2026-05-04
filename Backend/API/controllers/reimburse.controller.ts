import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { Reimburse } from 'models/reimburse';
import { User } from 'models/user';

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

const validateReimbursePayload = (body: any, file?: Express.Multer.File, isUpdate = false): any => {
    const { user_id, nominal, tanggal, keterangan, gambar } = body;
    const payload: any = {};

    if (user_id !== undefined || !isUpdate) {
        if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
            throw { code: 400, message: 'User id is required' };
        }
        payload.user_id = user_id;
    }

    if (nominal !== undefined || !isUpdate) {
        if (!nominal) {
            throw { code: 400, message: 'Nominal is required'};
        }
        const nominalNum = Number(nominal);
        if (isNaN(nominalNum) || nominalNum <= 0) {
            throw { code: 400, message: 'Nominal must be a valid positive number' };
        }
        payload.nominal = nominalNum;
    }

    if (tanggal !== undefined || !isUpdate) {
        if (!tanggal || typeof tanggal !== 'string' || !tanggal.trim() || isNaN(Date.parse(tanggal))) {
            throw { code: 400, message: 'Valid tanggal is required' };
        }
        payload.tanggal = new Date(tanggal);
    }

    if (keterangan !== undefined) {
        payload.keterangan = keterangan;
    }

    const gambarFromFile = file ? `/uploads/${file.filename}` : undefined;
    if (gambarFromFile) {
        payload.gambar = gambarFromFile;
    } else if (gambar !== undefined) {
        payload.gambar = gambar;
    }

    // if (!isUpdate && !payload.gambar) {
    //     throw { code: 400, message: 'Gambar is required either as a file upload or a string URL' };
    // }

    return payload;
};

const fetchReimburseList = async (whereClause: any): Promise<Reimburse[]> => {
    return await Reimburse.findAll({
        where: whereClause,
        include: [{ model: User, as: 'user', attributes: ['user_id', 'nama', 'jabatan', 'departemen', 'role'] }],
        order: [['createdAt', 'DESC']]
    });
};

const checkApprovalHierarchy = (requesterJabatan: string, approverJabatan: string, approverRole: string, isSelf: boolean): void => {
    const reqJabatan = requesterJabatan.toLowerCase();
    const appJabatan = approverJabatan.toLowerCase();
    const appRole = approverRole.toLowerCase();


    if (appRole === 'admin'){ 
        console.log('admin bypass');
        return;
    }

    if (isSelf && appJabatan === 'supervisor') {
        console.log('Supervisor auto-approval');
        return;
    }
    
    if (isSelf) {
        console.log('Self-approval attempt');
        throw { code: 403, message: 'Forbidden: You cannot approve your own request' };
    }
    
    if (reqJabatan === 'staff') {
        console.log('Processing staff request');
        if (!['manager', 'supervisor'].includes(appJabatan)) {
            console.log('Invalid approver for staff request');
            throw { code: 403, message: 'Forbidden: Only Manager or Supervisor can process Staff requests' };
        }
    } else if (reqJabatan === 'manager') {
        console.log('Processing manager request');
        if (appJabatan !== 'supervisor') {
            console.log('Invalid approver for manager request');
            throw { code: 403, message: 'Forbidden: Only Supervisor can process Manager requests' };
        }
    } else if (reqJabatan === 'supervisor') {
        console.log('Processing supervisor request');
        throw { code: 403, message: 'Forbidden: Supervisor requests require Admin approval' };
    } else {
        console.log('Invalid requester jabatan');
        throw { code: 400, message: 'Invalid requester jabatan' };
    }
    console.log('Hierarchy check passed');
};

const checkUpdateDeleteHierarchy = (targetJabatan: string, actorJabatan: string, actorRole: string, isSelf: boolean): void => {
    const actJabatan = actorJabatan.toLowerCase();
    const actRole = actorRole.toLowerCase();
    const tarJabatan = targetJabatan.toLowerCase();

    if (actRole === 'admin') return;

    if (isSelf) return;

    if (tarJabatan === 'staff') {
        if (!['manager', 'supervisor'].includes(actJabatan)) {
            throw { code: 403, message: 'Forbidden: Only Manager or Supervisor can manage Staff records' };
        }
    } else if (tarJabatan === 'manager') {
        if (actJabatan !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: Only Supervisor can manage Manager records' };
        }
    } else {
        throw { code: 403, message: 'Forbidden: Insufficient hierarchy permissions' };
    }
};

export const createMyReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    
    // Auto-approve logic for Supervisor
    const status = req.auth.jabatan?.toLowerCase() === 'supervisor' ? 'Approved' : 'Pending';

    const payload = validateReimbursePayload({ ...req.body, user_id: req.auth.id }, file, false);
    payload.status = status;

    const reimburse = await Reimburse.create(payload);

    return {
        data: { reimburse },
        code: 201,
        message: 'Reimburse request created successfully',
    };
};

export const createReimburseRequestForUser = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validateReimbursePayload(req.body, file, false);

    const targetUser = await User.findByPk(payload.user_id);
    if (!targetUser) {
        throw { code: 404, message: 'Target user not found' };
    }

    checkUpdateDeleteHierarchy(targetUser.jabatan, req.auth.jabatan || '', req.auth.role, false);

    const reimburse = await Reimburse.create(payload);

    return {
        data: { reimburse },
        code: 201,
        message: 'Reimburse request created successfully',
    };
};

export const updateReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);
    
    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id },
        include: [{ model: User, attributes: ['user_id', 'jabatan'] }]
    });

    const targetUser = await User.findByPk(reimburse?.user_id);

    if (!reimburse || !targetUser) {
        throw { code: 404, message: 'Reimburse record not found' };
    }

    if (reimburse.status !== 'Pending') {
        throw { code: 400, message: 'Only pending reimburse requests can be updated' };
    }

    const isSelf = reimburse.user_id === req.auth.id;
    checkUpdateDeleteHierarchy(targetUser.jabatan, req.auth.jabatan || '', req.auth.role, isSelf);

    const file = (req as Request & { file?: Express.Multer.File }).file;
    const payload = validateReimbursePayload(req.body, file, true);

    if (Object.keys(payload).length === 0) {
        throw { code: 400, message: 'At least one field must be provided for update' };
    }

    await reimburse.update(payload);

    return {
        data: { reimburse },
        code: 200,
        message: 'Reimburse request updated successfully'
    };
};

export const getMyReimburse = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse[] }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const reimburse = await fetchReimburseList({ user_id: req.auth.id });

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
        include: [{ model: User, attributes: ['user_id', 'nama', 'jabatan', 'role'] }]
    });

    if (!reimburse) {
        throw { code: 404, message: 'Reimburse record not found' };
    }

    if (req.auth.role.toLowerCase() === 'staff' && reimburse.user_id !== req.auth.id) {
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

    const { status } = req.query;
    const whereClause: any = {};

    if (status && ['Pending', 'Approved', 'Rejected'].includes(String(status))) {
        whereClause.status = status;
    } else {
        whereClause.status = ['Pending', 'Approved', 'Rejected'];
    }

    const reimburse = await fetchReimburseList(whereClause);

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
    if (!req.auth?.id || !req.auth?.jabatan) {
        throw { code: 401, message: 'Unauthorized or Jabatan info missing' };
    }

    const id = getParamId(req);
    const { status } = req.body;
    const currentDate = new Date();

    if (status !== 'Approved' && status !== 'Rejected') {
        throw { code: 400, message: 'Status must be either Approved or Rejected' };
    }

    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id },
        include: [{ model: User, attributes: ['jabatan'] }]
    });

    const targetUser = await User.findByPk(reimburse?.user_id);

    if (!reimburse || !targetUser) {
        throw { code: 404, message: 'Reimburse record or associated user not found' };
    }

    const isSelf = reimburse.user_id === req.auth.id;
    console.log('3');
    checkApprovalHierarchy(targetUser.jabatan, req.auth.jabatan, req.auth.role, isSelf);
    console.log('4');

    const pengajuanDate = new Date(reimburse.tanggal);
    const monthDiff = (currentDate.getFullYear() - pengajuanDate.getFullYear()) * 12 + (currentDate.getMonth() - pengajuanDate.getMonth());

    if (monthDiff > 1) {
        throw {
            code: 400,
            message: 'Reimburse request has expired. It can only be processed within the current or next payroll cycle.'
        };
    }

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

    const reimburse = await fetchReimburseList({});

    return {
        code: 200,
        message: 'Reimburse history fetched successfully',
        data: { reimburse },
    };
};

export const deleteReimburseRequest = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ reimburse: Reimburse }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

    const id = getParamId(req);

    const reimburse = await Reimburse.findOne({
        where: { reimburse_id: id },
        include: [{ model: User, attributes: ['user_id', 'jabatan'] }]
    });

    const targetUser = await User.findByPk(reimburse?.user_id);

    if (!reimburse || !targetUser) {
        throw { code: 404, message: 'Reimburse record not found' };
    }

    if (reimburse.status !== 'Pending') {
        throw { code: 400, message: 'Only pending reimburse requests can be deleted' };
    }

    const isSelf = reimburse.user_id === req.auth.id;
    checkUpdateDeleteHierarchy(targetUser.jabatan, req.auth.jabatan || '', req.auth.role, isSelf);

    await reimburse.destroy();
    
    return {
        code: 200,
        message: 'Reimburse request deleted successfully',
        data: { reimburse },
    };
};