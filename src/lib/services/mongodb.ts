import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  // TODO: MongoDB Authentication Disabled for Internal Network
  // ============================================================
  // Authentication is currently disabled because MongoDB is only accessible
  // from the internal Docker network (watchparty-network) and not exposed
  // to the internet or host machine in production.
  // 
  // SECURITY WARNING: Re-enable authentication if you:
  // 1. Expose MongoDB ports outside the Docker network
  // 2. Allow external connections to MongoDB
  // 3. Run MongoDB on a shared network or publicly accessible server
  // 
  // To re-enable authentication:
  // 1. Uncomment the authentication code below (lines with // AUTH: prefix)
  // 2. Add MONGO_USER and MONGO_PASSWORD to environment variables
  // 3. Update docker-compose.yml with MONGO_INITDB_ROOT_USERNAME/PASSWORD
  // 4. Remove existing mongo-data volume and restart containers
  // ============================================================

  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || '27017';
  const dbName = process.env.MONGODB_DB || 'watchparty';

  // Simple connection without authentication
  const uri = `mongodb://${mongoHost}:${mongoPort}`;

  // AUTH: Uncomment below to enable authentication
  // const mongoUser = process.env.MONGO_USER || 'admin';
  // const mongoPassword = process.env.MONGO_PASSWORD || '';
  // const uri = mongoPassword
  //   ? `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${dbName}?authSource=admin`
  //   : `mongodb://${mongoHost}:${mongoPort}`;

  console.log('Connecting to MongoDB at:', `${mongoHost}:${mongoPort}`);

  // Connection options for better performance
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
  });
  
  await client.connect();
  db = client.db(dbName);

  console.log('Connected to MongoDB (no authentication)');
  return { client, db };
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}
