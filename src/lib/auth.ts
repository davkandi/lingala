import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as authSchema from '@/db/auth-postgres-schema';

// Create a separate database client for better-auth with auth schema
const authConnectionString = process.env.DATABASE_URL!;
const authDbClient = postgres(authConnectionString, { prepare: false });
const authDb = drizzle(authDbClient, { schema: authSchema });
 
export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	secret: process.env.BETTER_AUTH_SECRET!,
	database: drizzleAdapter(authDb, {
		provider: "pg",
		usePlural: false,
		schema: authSchema,
	}),
	emailAndPassword: {    
		enabled: true
	},
	plugins: [bearer()],
	user: {
		additionalFields: {
			isAdmin: {
				type: "boolean",
				defaultValue: false,
				input: false
			}
		}
	},
	advanced: {
		database: {
			generateId: () => crypto.randomUUID()
		}
	}
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}