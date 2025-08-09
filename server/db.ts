import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Get database connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create the database connection
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

// Export schema for migrations and queries
export * from '../shared/schema';