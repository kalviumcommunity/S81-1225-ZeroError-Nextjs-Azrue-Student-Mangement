# Secure Secret Management (AWS Secrets Manager / Azure Key Vault)

This guide explains storing and retrieving sensitive environment values securely using cloud secret managers.

## 1. Why Secret Managers
- Encrypt secrets at rest/in transit
- IAM/RBAC access control
- Automatic rotation
- Runtime injection without committing/printing secrets

## 2. Create Secrets

### AWS Secrets Manager
1. Console → Secrets Manager → Store a new secret → Other type of secret
2. Add key-value JSON:

```
{
  "DATABASE_URL": "postgresql://admin:password@db.amazonaws.com:5432/nextjsdb",
  "JWT_SECRET": "supersecuretokenkey"
}
```

3. Name: `nextjs/app-secrets` (example); keep default encryption key
4. Save ARN → use in `SECRET_ARN`

### Azure Key Vault
1. Portal → Create Key Vault (`kv-nextjs-app`)
2. Secrets → + Generate/Import → Add secret(s) manually or via CLI:

```bash
az keyvault secret set --vault-name kv-nextjs-app --name DATABASE_URL --value "postgresql://admin:password@azure.com:5432/nextjsdb"
```

## 3. Least-Privilege Access

### AWS IAM Policy (read-only)

```
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "secretsmanager:GetSecretValue",
    "Resource": "arn:aws:secretsmanager:region:account-id:secret:nextjs/app-secrets-*"
  }]
}
```

### Azure Access Policy / Managed Identity

```bash
az keyvault set-policy --name kv-nextjs-app --spn <app-client-id> --secret-permissions get list
```

## 4. Runtime Retrieval (Implemented)

Server helper: [lib/secrets.ts](lib/secrets.ts)

- Provider selection: `SECRET_PROVIDER=aws` or `azure`
- AWS: reads `SECRET_ARN` (or `SECRET_ID`) from `AWS_REGION`
- Azure: uses `KEYVAULT_NAME` and optionally `SECRET_KEYS` (comma-separated) to fetch specific names; otherwise lists all
- Caches results for 5 minutes to avoid rate limits

Safe validation route: [app/api/secrets/route.ts](app/api/secrets/route.ts)
- Returns only secret keys (not values)
- Logs keys server-side: `console.log` for verification

## 5. Environment Variables

Common:
- `SECRET_PROVIDER=aws` or `azure`

AWS:
- `AWS_REGION=ap-south-1`
- `SECRET_ARN=arn:aws:secretsmanager:...:secret:nextjs/app-secrets-XXXX`

Azure:
- `KEYVAULT_NAME=kv-nextjs-app`
- `SECRET_KEYS=DATABASE_URL,JWT_SECRET` (optional; names to fetch)

## 6. Validate Runtime Injection

Run locally (requires cloud credentials via SDK default auth):

```bash
cd student-task-manager
npm run dev
# then GET http://localhost:3000/api/secrets
```

Expected:
- 200 response `{ success: true, keys: ["DATABASE_URL", "JWT_SECRET"] }`
- Server logs show the same keys; values are never printed

## 7. Rotation & Access Practices

- Rotate credentials periodically (e.g., monthly database password updates)
- Use managed identities (Azure) or instance roles (AWS) for production
- Keep policies scoped to exact secret resource(s)
- Avoid `.env` for production; rely on vault at runtime
- Ensure logs and error messages never include secret values

## 8. Future Improvements

- Integrate rotation hooks to notify/reload application cache
- Wire CI/CD to provision secrets and policies automatically
- Add monitoring/alerts for vault access errors
