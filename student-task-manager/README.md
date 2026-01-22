This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

## Testing: Jest + React Testing Library

This app includes a fully configured unit-testing setup using Jest and React Testing Library (RTL) with coverage thresholds enforced and CI integration.

### Install (already added to devDependencies)

```bash
npm ci
```

If you need to (re)install manually:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

### Configuration

- Jest config: [jest.config.js](jest.config.js)
- Jest setup: [jest.setup.ts](jest.setup.ts)
- Sample source under [src/](src)
- Sample tests under [__tests__/](__tests__)

Coverage thresholds (global): 80% for branches, functions, lines, and statements. The build fails if unmet.

### Run Tests

```bash
npm test
```

With coverage report:

```bash
npm run test:coverage
```

Expected summary (example):

```
PASS  __tests__/Greeting.test.tsx
PASS  __tests__/math.test.ts
--------------------------------
File           | % Stmts | % Branch | % Funcs | % Lines |
---------------------------------------------------------
All files      |   85.00 |    80.00 |   90.00 |   85.00 |
```

### CI Integration (GitHub Actions)

The workflow runs tests with coverage in the `build-and-test` job. See [.github/workflows/azure-deploy.yml](../.github/workflows/azure-deploy.yml).

```yaml
- name: Run Unit Tests
	run: npm test -- --coverage
	working-directory: ${{ env.APP_PATH }}
```

### Notes & Reflection

- Testing pyramid: prioritize fast unit tests (functions, small components), then integration (API routes, data access), and E2E (user flows).
- Current coverage focuses on utilities and simple components; expand to cover hooks, server utilities in `lib/`, and critical UI flows in `app/`.
- Gaps to address: complex server-only logic, error states, and edge-cases in forms and API interactions.

## Production-Ready Environment & Secrets

This application is configured for development, staging, and production with strict separation of public vs server-only variables and CI/CD-compatible builds.

### Environments

- Development: local iteration with `.env.development`
- Staging: pre-production testing with `.env.staging`
- Production: end-user deployments with `.env.production`

### Variable Loading

- Public variables must start with `NEXT_PUBLIC_` (included in client bundles)
- Server-only secrets (e.g., `DATABASE_URL`, `AUTH_SECRET`, `JWT_SECRET`) are accessible on the server only via `process.env` and `lib/env.ts`
- Files:
	- `.env.example` – template with placeholders (tracked)
	- `.env.local` – local developer overrides and secrets (git-ignored)
	- `.env.development`, `.env.staging`, `.env.production` – optional per-environment files (git-ignored)

### Local Setup (.env.local)

1) Copy the template: `cp .env.example .env.local` and adjust values for your machine.
2) Start the app: `npm run dev`. Only `NEXT_PUBLIC_*` vars are exposed to the browser.

Recommended local values:

```dotenv
# Client-safe
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_ENV=development

# Server-only
APP_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/studentdb_dev
AUTH_SECRET=dev-secret-change-me
JWT_SECRET=dev-jwt-secret-change-me
```

### Build Scripts

- `npm run dev` – loads `.env.development`, validates variables, starts dev server
- `npm run build:staging` – loads `.env.staging`, validates, builds
- `npm run build:production` – loads `.env.production`, validates, builds

During builds, we log only safe metadata: `APP_ENV`, `NODE_ENV`, and `NEXT_PUBLIC_API_URL`. Secrets never print.

### Using Secrets Safely

- Server-only access: import from [lib/env.ts](lib/env.ts). This module imports `server-only` and throws if required variables are missing.
- Client-safe access: import public values from [lib/publicEnv.ts](lib/publicEnv.ts) or use `process.env.NEXT_PUBLIC_*` directly in client components.
- API routes and server components must read secrets only on the server. Do not reference server-only vars in client components.

#### Safe Usage Examples

Server-only (API route, Server Component, or any code that runs on the server):

```ts
// server.ts or inside an API route
import { env } from '@/lib/env';

async function connectDb() {
	const url = env.DATABASE_URL; // server-only
	// connect using url
}
```

Client-safe (Client Component or hook):

```tsx
"use client";
import { publicEnv } from '@/lib/publicEnv';

export function ApiBase() {
	const apiUrl = publicEnv.NEXT_PUBLIC_API_URL; // safe for client
	return <div>API Base: {apiUrl}</div>;
}
```

You can also read public values directly: `process.env.NEXT_PUBLIC_API_URL` inside Client Components.

### Common Pitfalls

- Forgetting the `NEXT_PUBLIC_` prefix for variables needed in the browser → they will be undefined on the client.
- Using server-only secrets inside Client Components/hooks → never read `DATABASE_URL`, `AUTH_SECRET`, `JWT_SECRET` in the browser.
- Confusing runtime vs. build-time: Next.js inlines `NEXT_PUBLIC_*` at build, so rebuild if you change them.
- Accidentally committing secrets: `.env.*` is ignored; only `.env.example` is tracked (see [.gitignore](.gitignore)).

### CI/CD (GitHub Actions)

Workflow: [.github/workflows/ci-build.yml](../.github/workflows/ci-build.yml)

- Branch `staging` → staging build; branch `main` → production build
- Secrets injected via GitHub Secrets:
	- `STAGING_NEXT_PUBLIC_API_URL`, `STAGING_DATABASE_URL`, `STAGING_AUTH_SECRET`, `STAGING_JWT_SECRET`
	- `PROD_NEXT_PUBLIC_API_URL`, `PROD_DATABASE_URL`, `PROD_AUTH_SECRET`, `PROD_JWT_SECRET`
- The workflow writes an env file, runs validation, builds, and uploads the artifact

### Verification

Run locally:

```bash
npm ci
npm run dev
```

Staging build:

```bash
npm run build:staging
```

Production build:

```bash
npm run build:production
```

Checks:

- Correct endpoint: open the console during build; ensure `[next.config] Environment summary` shows expected `NEXT_PUBLIC_API_URL`
- No secrets in client: search the browser bundle for `DATABASE_URL`, `AUTH_SECRET`, `JWT_SECRET` – they must not appear
- Git hygiene: only `.env.example` is tracked; `.env.*` are ignored (see [.gitignore](.gitignore))

### Why Multi-Environment

- CI/CD reliability: explicit env selection and validation reduces drift
- Deployment safety: staging catches issues before prod
- Rollbacks: artifacts are isolated by environment
- Team collaboration: predictable dev/staging/prod behavior prevents surprise

---

## 🐳 Docker & Docker Compose Setup

This project includes a **production-ready Docker setup** for local development that containerizes the entire application stack, eliminating the "it works on my machine" problem.

### 📦 Containerized Services

| Service | Image | Container | Port | Purpose |
|---------|-------|-----------|------|---------|
| **App** | Custom (multi-stage) | `nextjs_app` | 3000 | Next.js application |
| **Database** | postgres:15-alpine | `postgres_db` | 5432 | PostgreSQL database |
| **Cache** | redis:7-alpine | `redis_cache` | 6379 | Redis cache server |

### 🏗️ Architecture Highlights

- **Multi-stage Dockerfile**: Optimized build reduces image size from ~1GB to ~150MB
- **Health Checks**: All services include health monitoring for reliable startup
- **Persistent Volumes**: Data survives container restarts (`db_data`, `redis_data`)
- **Bridge Network**: Isolated `localnet` network for secure inter-container communication
- **Auto-initialization**: PostgreSQL runs `init-db.sql` on first startup with sample data
- **Non-root User**: App runs as `nextjs` user (UID 1001) for enhanced security

### 🚀 Quick Start with Docker

```bash
# Start all services (app, database, Redis)
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

### 🌐 Access Points

Once running, access:
- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **PostgreSQL**: localhost:5432 (user: `postgres`, password: `password`, db: `mydb`)
- **Redis**: localhost:6379

### ✅ Verify Setup

```bash
# Check all containers are running and healthy
docker ps

# Expected output:
# CONTAINER ID   IMAGE                    STATUS
# abc123         student-task-manager_app Up (healthy)
# def456         postgres:15-alpine       Up (healthy)
# ghi789         redis:7-alpine           Up (healthy)

# Test database connection and view sample data
docker exec -it postgres_db psql -U postgres -d mydb -c "SELECT * FROM students;"

# Test Redis connection
docker exec -it redis_cache redis-cli ping
# Expected: PONG

# Check service health status
docker inspect --format='{{.State.Health.Status}}' nextjs_app
docker inspect --format='{{.State.Health.Status}}' postgres_db
docker inspect --format='{{.State.Health.Status}}' redis_cache
```

### �️ Database Schema

The PostgreSQL database is automatically initialized with:
- **students** table: Student information (id, name, email, student_id)
- **tasks** table: Task assignments (id, student_id, title, description, status, priority, due_date)
- **sessions** table: Authentication sessions
- **Sample data**: 3 students and 5 tasks pre-populated for testing
- **Indexes**: Optimized for common queries
- **Triggers**: Auto-update `updated_at` timestamps

### 🔧 Environment Variables

The `docker-compose.yml` includes all necessary environment variables:

```yaml
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_API_URL=http://localhost:3000/api
AUTH_SECRET=docker-auth-secret-change-in-production
JWT_SECRET=docker-jwt-secret-change-in-production
```

⚠️ **Security Note**: Change `AUTH_SECRET` and `JWT_SECRET` before deploying to production!

### 📁 Docker Files

- **Dockerfile**: Multi-stage build for Next.js app (deps → builder → runner)
- **docker-compose.yml**: Orchestrates all 3 services with networking and volumes
- **.dockerignore**: Excludes unnecessary files from build context
- **.env.docker.example**: Template for environment variables
- **scripts/init-db.sql**: PostgreSQL initialization script

### 📖 Detailed Documentation

For comprehensive information, see **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** which includes:
- ✅ Complete architecture diagrams
- ✅ Line-by-line Dockerfile explanation
- ✅ docker-compose.yml breakdown
- ✅ Network and volume configuration
- ✅ Troubleshooting common issues
- ✅ Security best practices
- ✅ Performance optimization tips
- ✅ Screenshots and verification logs
- ✅ Reflection on challenges faced and solutions

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Code Quality: TypeScript, ESLint & Prettier

### Strict TypeScript

We enable strict typing in [tsconfig.json](tsconfig.json) to prevent runtime bugs:

- strict: enables all strict checks
- noImplicitAny: disallows implicit `any`
- noUnusedLocals / noUnusedParameters: surfaces dead code
- forceConsistentCasingInFileNames: avoids case-sensitivity issues across OSes
- skipLibCheck: skips type-checking of dependencies for faster builds

### ESLint + Prettier

- Config: flat ESLint in [eslint.config.mjs](eslint.config.mjs) extends `next/core-web-vitals` and integrates Prettier (via `eslint-config-prettier` and `eslint-plugin-prettier/recommended`).
- Rules: `no-console`=warn, `semi`=always, `quotes`=double.
- Prettier: see [/.prettierrc](.prettierrc) for formatting preferences.

Useful commands:

```bash
npm run lint         # ESLint (flat config)
npm run format       # Prettier write
```

### Pre-commit Hooks

Husky + lint-staged enforce standards on staged files:

- Hook: `.husky/pre-commit` runs `npx lint-staged`
- Pattern: `*.{ts,tsx,js,jsx}` → `eslint --fix` then `prettier --write`

To test locally, try staging a file that violates a rule (e.g., missing semicolon). The hook auto-fixes where possible; non-fixable issues will block the commit until resolved.

### Why This Matters

- Fewer runtime bugs: strict typing catches issues at compile time.
- Consistent code style: Prettier fixes formatting automatically.
- Predictable reviews: ESLint rules reduce nitpicks and drift.

---

## Database Schema (PostgreSQL + Prisma)

- Schema: [prisma/schema.prisma](prisma/schema.prisma)
- Seed: [prisma/seed.ts](prisma/seed.ts)
- Seed config: `package.json` → `prisma.seed` (runs via `npx prisma db seed`)

### Core Entities

- **User**: id, `email` (unique), `passwordHash`, `role`; relations to `Membership`, `Team` (owner), `Project` (owner), `Task` (assignee), `Comment`, `ActivityLog`.
- **Team**: id, name, description; owner; relations to `Membership`, `Project`, `Label`, `ActivityLog`; unique `(ownerId, name)`.
- **Membership**: join `User`↔`Team` with `role`; unique `(userId, teamId)`.
- **Project**: id, name, description, `dueDate`; belongs to `Team` and owner `User`; relations to `Task`, `ActivityLog`; unique `(teamId, name)`.
- **Task**: id, title, description, `status`, `priority`, `dueDate`, `position`; belongs to `Project`; optional `assignee` `User`; relations to `Comment`, `Label` (via `TaskLabel`), `ActivityLog`.
- **Label**: team-scoped tag for tasks; unique `(teamId, name)`; join via `TaskLabel`.
- **TaskLabel**: M:N join for `Task`↔`Label` with composite id `(taskId, labelId)`.
- **Comment**: content by `author` on a `task`.
- **ActivityLog**: audit trail for actions (e.g., `TASK_CREATED`), linked to `actor` and optional `task`, `project`, `team`.

---

## Prisma Migrations Workflow

A migration captures the changes made to your Prisma schema and keeps the database in sync.

### 1) First Migration (init)

1. Ensure a valid `DATABASE_URL` is set (recommended: copy `.env.example` → `.env.local`).
2. Start PostgreSQL (Docker or local service).
3. Run:

```bash
npx prisma migrate dev --name init_schema
```

Prisma will:

- Create `prisma/migrations/<timestamp>_init_schema/`
- Apply SQL to your Postgres database
- Update Prisma Client metadata (run `npx prisma generate` if you changed schema)

### 2) Modify Schema → New Migration

After adding/updating a model:

```bash
npx prisma migrate dev --name add_project_table
```

Review the generated SQL in `prisma/migrations/.../migration.sql` to understand exactly what will run.

### Reset / Rollback (Safe Dev Workflow)

In development, the “rollback” pattern is usually a full reset:

```bash
npx prisma migrate reset
```

This drops the schema, re-applies all migrations from scratch, and then runs seeding (if configured).

### Production Safety (How to Protect Data)

- Prefer forward-only migrations (add a follow-up migration instead of “rolling back”).
- Always test migrations on staging with a production-like snapshot.
- Take a backup before deploying migrations (and verify restore works).
- Use `npx prisma migrate deploy` in production CI/CD (avoid `migrate dev` and never run `migrate reset` in prod).

---

## Seed Script

### File

- Seed script: [prisma/seed.ts](prisma/seed.ts)

### Run

```bash
npx prisma db seed
```

### Idempotency (No Duplicate Records)

The seed script is designed to be idempotent:

- Uses `upsert` for entities with unique constraints (e.g., `User.email`, `Team(ownerId,name)`, `Project(teamId,name)`, `Label(teamId,name)`).
- Uses `findFirst + create` for entities without unique constraints (e.g., `Task`), keyed by a stable “natural key” (`projectId + title`).

Expected seed log output looks like:

```text
Seed data inserted successfully
{ users: [ 'alice@example.com', 'bob@example.com' ], team: 'Study Group A', project: 'Semester Project', labels: [ 'Homework', 'Exam Prep' ], tasks: [ 'Design ER Diagram', 'Write Seed Script' ] }
```

### Verify Data (Prisma Studio)

```bash
npx prisma studio
```

---

## Proof / Terminal Logs

In this workspace, Prisma schema validation and TypeScript checks ran successfully:

```text
Prisma schema loaded from prisma\schema.prisma
The schema at prisma\schema.prisma is valid 🚀
```

To run real migrations + seeding locally, PostgreSQL must be reachable at your `DATABASE_URL`. If you’re using Docker, make sure Docker Desktop is running before starting the `db` service with `docker-compose up -d db`.
