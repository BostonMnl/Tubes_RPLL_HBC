import { Request, Response } from 'express';
import { User } from '../../models/user';
import { ApiResponse } from '../middlewares/response.middleware';
import { JABATAN_VALUES } from '../utils/helper.js';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
		jabatan: string;
	};
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
): Promise<ApiResponse<{ user: { user_id: string; jabatan: string } }>> => {
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

        const actor = req.auth?.jabatan;
        const from = target.jabatan;
        const to = jabatan;
        
    if (role !== 'admin' ) {
        if (actor === 'manager') {
            if (!(from === 'staff' && to === 'manager')) {
                throw { code: 403, message: 'Forbidden: insufficient wewenang' };
            }
        }

        if (actor === 'supervisor') {
            const ok =
                (from === 'staff' && to === 'manager' || to === 'supervisor') ||
                (from === 'manager' && to === 'supervisor');

            if (!ok) {
                throw { code: 403, message: 'Forbidden: insufficient wewenang' };
            }
        }

        if (actor !== 'manager' && actor !== 'supervisor') {
            throw { code: 403, message: 'Forbidden: insufficient wewenang' };
        }
    }

	if (from === to) {
		return {
			code: 200,
			message: 'No changes applied',
			data: { user: { user_id: target.user_id, jabatan: target.jabatan } },
		};
	}

	target.jabatan = to;
	await target.save();

	return {
		code: 200,
		message: 'Jabatan updated successfully',
		data: {
			user: {
				user_id: target.user_id,
				jabatan: target.jabatan,
			},
		},
	};
};
