import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Client } from 'pg';
import * as schema from '../shared/schema';

// Get database connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Check if we're in Docker/production environment with local PostgreSQL
const isDockerEnvironment = connectionString.includes('@database:') || connectionString.includes('@localhost:');

let db: any;

if (isDockerEnvironment) {
  // Use node-postgres for local PostgreSQL in Docker
  const client = new Client({
    connectionString: connectionString,
  });
  
  client.connect().catch(console.error);
  db = drizzleNode(client, { schema });
} else {
  // Use Neon for cloud PostgreSQL
  const sql = neon(connectionString);
  db = drizzle(sql, { schema });
}

export { db };

// Export schema for migrations and queries
export * from '../shared/schema';