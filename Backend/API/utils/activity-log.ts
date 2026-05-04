import { getMongoCollection } from './mongo';

type ActivityLog = {
	userId: string | null;
	createdAt: Date;
	code: number;
	message: string;
};

export const logActivity = async (
	entry: Omit<ActivityLog, 'createdAt'> & { createdAt?: Date }
): Promise<void> => {
	const collectionName = process.env.MONGO_ACTIVITY_COLLECTION || 'activity_logs';
	const collection = await getMongoCollection<ActivityLog>(collectionName);
	await collection.insertOne({
		...entry,
		createdAt: entry.createdAt ?? new Date(),
	});
};
