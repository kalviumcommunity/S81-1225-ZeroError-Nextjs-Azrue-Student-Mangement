This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

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
	- `.env.development`, `.env.staging` – real values (git-ignored)
	- `.env.production` – tracked in this repo with non-sensitive placeholders for reproducible builds (override with real secrets in your deployment environment)

### Build Scripts

- `npm run dev` – loads `.env.development`, validates variables, starts dev server
- `npm run build:staging` – loads `.env.staging`, validates, builds
- `npm run build:production` – loads `.env.production`, validates, builds

During builds, we log only safe metadata: `APP_ENV`, `NODE_ENV`, and `NEXT_PUBLIC_API_URL`. Secrets never print.

### Using Secrets Safely

- Server-only access: import from [lib/env.ts](lib/env.ts). This module imports `server-only` and throws if required variables are missing.
- Client-safe access: import public values from [lib/publicEnv.ts](lib/publicEnv.ts) or use `process.env.NEXT_PUBLIC_*` directly in client components.
- API routes and server components must read secrets only on the server. Do not reference server-only vars in client components.

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

## Docker & Docker Compose (App + Postgres + Redis)

This project includes a [Dockerfile](Dockerfile) and [docker-compose.yml](docker-compose.yml) to run the Next.js app alongside PostgreSQL and Redis in a shared local Docker network.

### Dockerfile

The Dockerfile builds and runs the Next.js application inside a container:

- Uses `node:20-alpine`
- Sets `WORKDIR /app`
- Copies `package*.json` and installs dependencies
- Copies the rest of the source and runs `npm run build`
- Exposes port `3000`
- Starts the app with `npm run start`

### docker-compose.yml

The compose file defines three containers:

- **app** (`nextjs_app`)
	- Builds from the local Dockerfile
	- Publishes `3000:3000`
	- Loads `.env.production` (required by the project’s build/validation scripts)
	- Provides service URLs:
		- `DATABASE_URL=postgres://postgres:password@db:5432/mydb`
		- `REDIS_URL=redis://redis:6379`

- **db** (`postgres_db`)
	- Uses `postgres:15-alpine`
	- Publishes `5432:5432`
	- Persists data in the named volume `db_data`

- **redis** (`redis_cache`)
	- Uses `redis:7-alpine`
	- Publishes `6379:6379`

### Network, Environment Variables, and Volumes

- **Network**: all services share `localnet` (bridge). Containers can reach each other by service name (`db`, `redis`).
- **Environment variables**:
	- `DATABASE_URL` points to Postgres via `db:5432`
	- `REDIS_URL` points to Redis via `redis:6379`
	- `.env.production` provides additional variables required by this repo (for example `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, `JWT_SECRET`).
- **Volume**: `db_data` keeps PostgreSQL data across restarts.

### Run and Verify

From the `student-task-manager/` directory:

```bash
docker-compose up --build
```

Verify:

- App is accessible at http://localhost:3000
- PostgreSQL is running on port `5432`
- Redis is running on port `6379`

Confirm containers are up:

```bash
docker ps
```

### Screenshots / Terminal Logs

Terminal output captured from a successful run:

**`docker ps`**

```bash
CONTAINER ID   IMAGE                      COMMAND                  CREATED          STATUS                   PORTS                                              NAMES
15e66b0ada1d   student-task-manager-app   "docker-entrypoint.s…"   9 seconds ago    Up 8 seconds             0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp       nextjs_app
84dc6f6d0f7f   postgres:15-alpine         "docker-entrypoint.s…"   10 seconds ago   Up 8 seconds             0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp       postgres_db
5c1315d2671f   redis:7-alpine             "docker-entrypoint.s…"   10 seconds ago   Up 8 seconds             0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp       redis_cache
```

**Health check** (`GET http://localhost:3000/api/health`)

```bash
HTTP/1.1 200 OK
content-type: application/json

{"status":"healthy","timestamp":"2025-12-23T07:49:11.004Z","service":"student-task-manager","environment":"production"}
```

### Reflection (Issues Faced & Fixes)

Examples to note:

- Port conflicts (e.g., `3000`, `5432`, `6379` already in use)
- Permission/WSL/Docker Desktop issues
- Slow builds and how you improved them
