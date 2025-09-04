import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT
    ? parseInt(process.env.DATABASE_PORT)
    : undefined,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

export const db = drizzle(pool, { schema });

export async function connectDatabase(): Promise<void> {
  try {
    // simple query to verify the connection
    await pool.query('SELECT 1');
    console.log('Postgres connected successfully');
  } catch (error) {
    console.error('Postgres connection failed:', error);
    throw error;
  }
}
