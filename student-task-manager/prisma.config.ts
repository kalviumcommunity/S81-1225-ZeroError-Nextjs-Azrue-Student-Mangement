import fs from 'node:fs';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

const candidateEnvFiles = ['.env.local', '.env.development', '.env'];
const envFile = candidateEnvFiles.find((p) => fs.existsSync(p));
if (envFile) dotenv.config({ path: envFile });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
