import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const dbConfig: Config = defineConfig({
  schema: [
    './src/db/postgres-schema.ts',
    './src/db/auth-postgres-schema.ts'
  ],
  out: './drizzle/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

export default dbConfig;