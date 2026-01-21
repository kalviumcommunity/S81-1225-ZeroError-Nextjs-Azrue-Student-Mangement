# Managed PostgreSQL (AWS RDS / Azure)

This guide walks through provisioning a managed PostgreSQL instance, securing access, connecting this Next.js app, and validating connectivity.

## 1) Why Managed Databases

- Automated backups and patching
- Easy scaling and monitoring
- Network-level security (VPC/Firewall/IP rules)
- Lets you focus on features, not ops

| Provider | Service | Advantage |
| --- | --- | --- |
| AWS | Amazon RDS (PostgreSQL) | Autoscaling, CloudWatch metrics |
| Azure | Azure Database for PostgreSQL | First-class Azure networking/IAM |

## 2) Provision a PostgreSQL Instance

### AWS RDS
1. Console → RDS → Databases → Create
2. Engine: PostgreSQL; Free tier/Dev-Test
3. Set:
   - DB identifier: `nextjs-db`
   - Username: `admin`
   - Password: strong password
4. Connectivity: Default VPC is fine for testing; enable Public access (testing only)
5. Create and wait for provisioning

### Azure
1. Portal → Create → Databases → Azure Database for PostgreSQL (Single Server)
2. Server name: `nextjs-db-server`, Admin login: `adminuser`
3. Location: nearest region; Compute: Basic/Free
4. Networking: Allow public access from Azure services (testing only)

> Production: use private endpoints or strict IP allowlisting.

## 3) Configure Network Access

### AWS
- RDS → DB → Connectivity & security → VPC Security Groups → Inbound rules:
  - Type: PostgreSQL, Port: 5432, Source: My IP

### Azure
- PostgreSQL → Networking → Firewall rules → Add your client IP

## 4) Connect the App

Set `DATABASE_URL` in `.env.local` (PostgreSQL DSN):

```
DATABASE_URL=postgresql://admin:YourStrongPassword@your-db-endpoint:5432/nextjsdb
```

This project uses Prisma; the connectivity check endpoint is implemented at [app/api/db/route.ts](app/api/db/route.ts).

## 5) Validate Connectivity

Run locally:

```bash
cd student-task-manager
npm install
npm run dev
# Then visit http://localhost:3000/api/db
```

Expected: `{ success: true, serverTime: "..." }`. If it fails, recheck `DATABASE_URL` and firewall rules.

Optional admin client:

```bash
psql -h your-db-endpoint -U admin -d nextjsdb
```

## 6) Backups & Maintenance

- AWS RDS: enable automated backups (retain ≥7 days)
- Azure: enable daily backups via portal
- Consider read replicas for read scaling and high availability

## 7) Document & Reflect

Include in team docs/README:
- Provider, region, instance name, tier
- Connection setup and network configuration
- Screenshots of successful connection tests

Reflection:
- Public vs private access trade-offs
- Backup/restore strategies and approximate costs
- Future scaling (replicas, failover)
