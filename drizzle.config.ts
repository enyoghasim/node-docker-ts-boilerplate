import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/db/schema',
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    port: process.env.DATABASE_PORT
      ? Number(process.env.DATABASE_PORT)
      : undefined,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME!,
  },
});
