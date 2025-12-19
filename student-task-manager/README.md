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
	- `.env.development`, `.env.staging`, `.env.production` – real values (git-ignored)

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
