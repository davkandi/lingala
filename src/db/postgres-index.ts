import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/postgres-schema';

// Create the connection
const connectionString = process.env.DATABASE_URL!;

// Disable prepare for better compatibility with serverless
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export type Database = typeof db;