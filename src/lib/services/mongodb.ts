import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  // Use authenticated connection string with environment variables
  const mongoUser = process.env.MONGO_USER || 'admin';
  const mongoPassword = process.env.MONGO_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'devpassword123');
  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || '27017';
  
  // Construct URI with authentication
  const uri = process.env.MONGODB_URI || 
    (mongoPassword 
      ? `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/watchparty?authSource=admin`
      : `mongodb://${mongoHost}:${mongoPort}`);
  
  const dbName = process.env.MONGODB_DB || 'watchparty';

  // Connection options for better security and performance
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
  });
  
  await client.connect();
  db = client.db(dbName);

  console.log('Connected to MongoDB with authentication');
  return { client, db };
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}
