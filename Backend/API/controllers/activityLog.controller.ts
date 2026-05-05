import { Request, Response } from 'express';
import { ApiResponse } from '../middlewares/response.middleware';
import { getMongoCollection } from '../utils/mongo';

type AuthenticatedRequest = Request & {
	auth?: {
		id: string;
		role: string;
	};
};

type ActivityLog = {
	userId: string | null;
	createdAt: Date;
	code: number;
	message: string;
};

const buildDateRange = (date: Date): { start: Date; end: Date } => {
	const start = new Date(date);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(start.getDate() + 1);
	return { start, end };
};

const getActivityCollection = async () => {
	const collectionName = process.env.MONGO_ACTIVITY_COLLECTION || 'activity_logs';
	return getMongoCollection<ActivityLog>(collectionName);
};

export const getMyActivityLogs = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ logs: ActivityLog[] }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const { start, end } = buildDateRange(new Date());
	const collection = await getActivityCollection();
	const logs = await collection
		.find({ userId: req.auth.id, createdAt: { $gte: start, $lt: end } })
		.sort({ createdAt: -1 })
		.toArray();

	return {
		code: 200,
		message: 'Activity logs fetched successfully',
		data: { logs },
	};
};

export const getUsersActivityLogsByDate = async (
	req: AuthenticatedRequest,
	_res: Response
): Promise<ApiResponse<{ logs: ActivityLog[] }>> => {
	if (!req.auth?.id) {
		throw { code: 401, message: 'Unauthorized' };
	}

	const { date } = req.body as { date?: string };
	if (!date) {
		throw { code: 400, message: 'date is required' };
	}

	const parsedDate = new Date(date);
	if (Number.isNaN(parsedDate.getTime())) {
		throw { code: 400, message: 'date must be a valid date' };
	}

	const { start, end } = buildDateRange(parsedDate);
	const collection = await getActivityCollection();
	const logs = await collection
		.find({ createdAt: { $gte: start, $lt: end } })
		.sort({ createdAt: -1 })
		.toArray();

	return {
		code: 200,
		message: 'Activity logs fetched successfully',
		data: { logs },
	};
};
