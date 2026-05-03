import e, { Request, Response } from 'express';
import { User } from '../../models/user';
import { ApiResponse } from '../middlewares/response.middleware';
import { DEPARTEMEN_VALUES, JABATAN_VALUES, departemenIndex, jabatanIndex } from '../utils/helper.js';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
		jabatan: string;
	};
};

const getJabatanIndices = (actorJabatan: string, targetJabatan: string, managerJabatan?: string) => {
	const actorIdx = jabatanIndex(actorJabatan);
	const targetIdx = jabatanIndex(targetJabatan);
	const managerIdx = managerJabatan ? jabatanIndex(managerJabatan) : -1;

	return { actorIdx, targetIdx, managerIdx };
};

const getParamId = (req: Request): string => {
	const id = req.params.id;

	if (typeof id !== 'string' || !id.trim()) {
		throw { code: 400, message: 'User id is required' };
	}

	return id;
};

export const promoteUser = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ user: { nama: string; jabatan: string, manager_id: string|null} }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const id = getParamId(req);
	const { jabatan } = req.body as { jabatan?: string };
   
        if (!jabatan) {
            throw { code: 400, message: 'jabatan is required' };
        }

        if (!JABATAN_VALUES.includes(jabatan as (typeof JABATAN_VALUES)[number])) {
            throw {
                code: 400,
                message: `jabatan must be one of: ${JABATAN_VALUES.join(', ')}`,
            };
        }

		const target = await User.findByPk(id);
		if (!target || target.deletedAt) {
			throw { code: 404, message: 'User not found' };
		}

		const actorUser = await User.findByPk(req.auth.id);
		if (!actorUser || actorUser.deletedAt) {
			throw { code: 401, message: 'Unauthorized' };
		}

		const actorJabatan = req.auth?.jabatan ?? '';
		const from = target.jabatan;
		const to = jabatan;
		const { actorIdx, targetIdx } = getJabatanIndices(actorJabatan, from);
		const toIdx = jabatanIndex(to);
        
		if (actorIdx === 1) {
			if (target.manager_id !== actorUser.user_id) {
				throw { code: 403, message: 'Forbidden: cross manager not allowed' };
			}
		}

		if (actorIdx === 2) {
			if (targetIdx === 0) {
				if (!target.manager_id) {
					throw { code: 400, message: 'manager_id is required' };
				}
				const targetManager = await User.findByPk(target.manager_id);
				if (!targetManager || targetManager.deletedAt) {
					throw { code: 404, message: 'Manager not found' };
				}
				if (targetManager.manager_id !== actorUser.user_id) {
					throw { code: 403, message: 'cross supervisor not allowed' };
				}
			} else if (targetIdx === 1) {
				if (target.manager_id !== actorUser.user_id) {
					throw { code: 403, message: 'cross supervisor not allowed' };
				}
			}
		}

		if (actorIdx === 1) {
			if (!(targetIdx < toIdx && toIdx === 1)) {
				throw { code: 403, message: 'Forbidden: insufficient wewenang' };
			}
		} else if (actorIdx === 2) {
			const staffToManager = targetIdx < toIdx && toIdx === 1;
			const managerToSupervisor = targetIdx === 1 && toIdx > targetIdx;
			if (!staffToManager && !managerToSupervisor) {
				throw { code: 403, message: 'Forbidden: insufficient wewenang' };
			}
		} else {
			throw { code: 403, message: 'Forbidden: insufficient wewenang' };
		}

	if (from === to) {
		return {
			code: 200,
			message: 'No changes applied',
			data: { user: { nama: target.nama,
							jabatan: target.jabatan, 
							manager_id: target.manager_id } },
		};
	}

	if (to === 'manager') {
		if (actorIdx === 1) {
			target.manager_id = actorUser.manager_id
		}else {
			target.manager_id = actorUser.user_id;
		}
	}else {
		target.manager_id = null;
	};

	target.jabatan = to;
	await target.save();

	return {
		code: 200,
		message: 'Jabatan updated successfully',
		data: {
			user: {
				nama: target.nama,
				jabatan: target.jabatan,
				manager_id: target.manager_id,
			},
		},
	};
};

export const getProfileId = async (
    req: AuthenticatedRequest,
    _res: Response
): Promise<ApiResponse<{ user: User }>> => {
    if (!req.auth?.id) {
        throw { code: 401, message: 'Unauthorized' };
    }

	const actor = req.auth;

    const id = getParamId(req);

    const user = await User.findByPk(id, {
        attributes: ['nama', 'email', 'alamat', 'tanggal_lahir', 'nomor_telepon', 'gambar', 'jabatan', 'role', 'departemen', 'manager_id'],
    });

    if (!user || user.deletedAt) {
        throw { code: 404, message: 'User not found' };
    }

	if (actor.role === 'admin') {
		return {
			code: 200,
			message: 'User profile fetched successfully',
			data: { user },
		};
	}

	const actorUser = await User.findByPk(actor.id, { attributes: ['jabatan', 'departemen'] });

	if (!actorUser || actorUser.deletedAt) {
		throw { code: 401, message: 'Unauthorized' };
	}

	if (actorUser.jabatan === 'manager') {
		const sameDepartemen =
			departemenIndex(user.departemen) === departemenIndex(actorUser.departemen);
		if (!sameDepartemen || user.jabatan !== 'staff') {
			throw { code: 403, message: 'Forbidden : insufficient WEWENANG' };
		}
	} else if (actorUser.jabatan === 'supervisor') {
		const allowedJabatan = user.jabatan === 'staff' || user.jabatan === 'manager';
		const sameDepartemen =
			departemenIndex(user.departemen) === departemenIndex(actorUser.departemen);
		if (!sameDepartemen || !allowedJabatan) {
			throw { code: 403, message: 'Forbidden : insufficient WEWENANG' };
		}
	} else {
		throw { code: 403, message: 'Forbidden : insufficient WEWENANG' };
	}

    return {
        code: 200,
        message: 'User profile fetched successfully',
        data: { user },
    };
};


