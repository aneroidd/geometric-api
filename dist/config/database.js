import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../db/schema.js';
import { env } from './env.js';
const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
});
export const db = drizzle(pool, { schema, logger: env.NODE_ENV === 'development' });
export { pool };
