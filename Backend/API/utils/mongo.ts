import { Collection, Document, MongoClient } from 'mongodb';

const mongoUri = process.env.MONGO_URI;
const mongoDb = process.env.MONGO_DB || 'app';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

const getClient = async (): Promise<MongoClient> => {
	if (client) {
		return client;
	}

	if (!mongoUri) {
		throw new Error('MONGO_URI is not configured');
	}

	if (!clientPromise) {
		client = new MongoClient(mongoUri);
		clientPromise = client.connect().then((connected) => {
			client = connected;
			return connected;
		});
	}

	return clientPromise;
};

export const getMongoCollection = async <T extends Document>(
	collectionName: string
): Promise<Collection<T>> => {
	const connected = await getClient();
	return connected.db(mongoDb).collection<T>(collectionName);
};
