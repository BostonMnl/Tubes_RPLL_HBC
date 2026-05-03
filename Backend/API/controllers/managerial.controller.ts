import e, { Request, Response } from 'express';
import { User } from '../../models/user';
import { ApiResponse } from '../middlewares/response.middleware';
import { JABATAN_VALUES, jabatanIndex } from '../utils/helper.js';

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
	const role = req.auth?.role;

   
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
				if (targetManager.manager_id !== actorUser.manager_id) {
					throw { code: 403, message: 'cross supervisor not allowed' };
				}
			} else if (targetIdx === 1) {
				if (target.manager_id !== actorUser.manager_id) {
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
		target.manager_id = actorUser.manager_id
	}else {
		target.manager_id = '';
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


// export const assignManager = async (
// 	req: AuthenticatedRequest,
// 	_res: Response
// ): Promise<ApiResponse<{ user: { user_id: string; manager_id: string } }>> => {
// 	if (!req.auth?.id) {
// 		throw { code: 401, message: 'Unauthorized' };
// 	}

// 	const id = getParamId(req);
// 	const role = req.auth?.role;
// 	const { manager_id } = req.body as { manager_id?: string };
// 	const target = await User.findByPk(id);

// 	if (!target || target.deletedAt) {
// 		throw { code: 404, message: 'User not found' };
// 	}

// 	if (target.manager_id !== null){
// 		throw { code: 400, message: 'User already has a manager assigned' };
// 	}

// 	if (!manager_id) {
// 		throw { code: 400, message: 'manager_id is required' };
// 	}

// 	const manager = await User.findByPk(manager_id);
// 	if (!manager || manager.deletedAt) {
// 		throw { code: 404, message: 'Manager not found' };
// 	}

// 	const actorJabatan = req.auth?.jabatan ?? '';
// 	const { actorIdx, targetIdx, managerIdx } = getJabatanIndices(
// 		actorJabatan,
// 		target.jabatan,
// 		manager.jabatan
// 	);

// 	if (role !== 'admin') {
// 		if (actorIdx === 1) {
// 			if (!(targetIdx < managerIdx && managerIdx === 1)) {
// 				throw { code: 403, message: 'Forbidden: insufficient wewenang' };
// 			}
// 		} else if (actorIdx === 2) {
// 			const staffToManager = targetIdx < managerIdx && managerIdx === 1;
// 			const managerToSupervisor = targetIdx === 1 && managerIdx === targetIdx;
// 			if (!staffToManager && !managerToSupervisor) {
// 				throw { code: 403, message: 'Forbidden: insufficient wewenang' };
// 			}
// 		} else {
// 			throw { code: 403, message: 'Forbidden: insufficient wewenang' };
// 		}
// 	}

// 	if (target.manager_id === manager_id) {
// 		return {
// 			code: 200,
// 			message: 'No changes applied',
// 			data: { user: { user_id: target.user_id, manager_id: target.manager_id } },
// 		};
// 	}

// 	target.manager_id = manager_id;
// 	await target.save();

// 	return {
// 		code: 200,
// 		message: 'Manager assigned successfully',
// 		data: {
// 			user: {
// 				user_id: target.user_id,
// 				manager_id: target.manager_id,
// 			},
// 		},
// 	};
// };