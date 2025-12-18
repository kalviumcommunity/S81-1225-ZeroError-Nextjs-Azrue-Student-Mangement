# Understanding Cloud Deployments: Docker → CI/CD → Azure

## 📚 Learning Journey Overview

This document explains how I containerized the Student Task Manager application, automated its deployment using CI/CD pipelines, and deployed it to Azure cloud infrastructure.

---

## 🐳 Part 1: Docker Containerization

### What is Docker?
Docker is a platform that packages applications and their dependencies into **containers** - lightweight, portable units that run consistently across different environments. Think of it as a "shipping container" for software.

### Why Use Docker?
- **Consistency**: "Works on my machine" → "Works everywhere"
- **Isolation**: Each container runs independently
- **Efficiency**: Lightweight compared to virtual machines
- **Portability**: Deploy anywhere Docker runs

### My Docker Implementation

#### 1. Dockerfile Structure
I created a **multi-stage Dockerfile** with three stages:

```dockerfile
# Stage 1: Dependencies - Install only production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder - Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner - Minimal production image
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

**Why multi-stage?**
- Reduces final image size (only includes what's needed to run)
- Separates build-time dependencies from runtime
- Improves security by minimizing attack surface

#### 2. Docker Compose for Local Testing
Created `docker-compose.yml` to orchestrate the application:

```yaml
services:
  student-task-manager:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "node", "-e", "...health check script..."]
      interval: 30s
```

**Benefits:**
- Easy local testing before deployment
- Simulates production environment
- Health checks ensure container is running properly

#### 3. Configuration Changes
Updated `next.config.ts` to enable standalone output:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // Creates self-contained build
  compress: true,       // Enables gzip compression
};
```

This creates a minimal, self-contained build perfect for Docker.

---

## 🔄 Part 2: CI/CD Pipeline with GitHub Actions

### What is CI/CD?
- **CI (Continuous Integration)**: Automatically build and test code on every commit
- **CD (Continuous Deployment)**: Automatically deploy tested code to production

### Why CI/CD?
- **Automation**: No manual deployment steps
- **Reliability**: Consistent deployment process
- **Speed**: Deploy changes in minutes, not hours
- **Safety**: Automated testing catches bugs early

### My CI/CD Pipeline

I created a GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) with 4 jobs:

#### Job 1: Build and Test
```yaml
- Checkout code from repository
- Setup Node.js environment
- Install dependencies (npm ci)
- Run linter (npm run lint)
- Build application (npm run build)
- Upload build artifacts
```

**Purpose**: Ensure code quality before deployment

#### Job 2: Docker Build and Push
```yaml
- Setup Docker Buildx
- Login to Azure Container Registry
- Build Docker image
- Tag with version (latest, branch name, commit SHA)
- Push to Azure Container Registry
```

**Purpose**: Create and store production-ready container image

#### Job 3: Deploy to Azure
```yaml
- Login to Azure using service principal
- Deploy container to Azure App Service
- Configure environment variables
- Logout from Azure
```

**Purpose**: Deploy the containerized app to cloud

#### Job 4: Health Check
```yaml
- Wait for deployment to stabilize
- Check if application responds with HTTP 200
- Fail pipeline if unhealthy
```

**Purpose**: Verify deployment was successful

### Workflow Triggers
The pipeline runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

---

## ☁️ Part 3: Azure Cloud Deployment

### Why Azure?
- **Student Benefits**: Free $100 credit with Azure for Students
- **Integration**: Excellent GitHub Actions support
- **Services**: App Service, Container Registry, etc.
- **Scalability**: Easy to scale as needed

### Azure Services Used

#### 1. Azure Container Registry (ACR)
- **Purpose**: Private Docker image repository
- **Why**: Secure storage for our container images
- **Configuration**: Basic tier with admin access enabled

#### 2. Azure App Service
- **Purpose**: Managed hosting platform for web apps
- **Why**: No server management, automatic scaling, built-in monitoring
- **Configuration**: Linux-based, B1 tier (Basic)

#### 3. Azure Resource Group
- **Purpose**: Logical container for all resources
- **Why**: Easier management and cost tracking

### Deployment Architecture

```
GitHub Repository
    ↓ (push to main)
GitHub Actions CI/CD
    ↓ (build & test)
Docker Image
    ↓ (push)
Azure Container Registry
    ↓ (deploy)
Azure App Service
    ↓ (serve)
Users (HTTPS)
```

### Environment Variables & Secrets Management

#### Secrets Stored in GitHub
- `AZURE_CREDENTIALS`: Service principal for Azure authentication
- `AZURE_REGISTRY_USERNAME`: ACR username
- `AZURE_REGISTRY_PASSWORD`: ACR password
- `AZURE_RESOURCE_GROUP`: Resource group name

#### Environment Variables in Azure
- `NODE_ENV=production`: Sets production mode
- `PORT=3000`: Application port
- `NEXT_TELEMETRY_DISABLED=1`: Disables Next.js telemetry

**Security Best Practices:**
- ✅ Never commit secrets to Git
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use Azure Key Vault for production secrets
- ✅ Rotate credentials regularly

---

## 🎯 Deployment Environments

### Development
- **Branch**: `develop`
- **Trigger**: Push to develop branch
- **Purpose**: Test features before production

### Production
- **Branch**: `main`
- **Trigger**: Push to main branch
- **URL**: `https://student-task-manager.azurewebsites.net`
- **Purpose**: Live application for users

---

## 🛠️ Infrastructure as Code (Stretch Goal)

While I used Azure CLI commands for this project, I explored **Terraform** for infrastructure provisioning:

### What is IaC?
Infrastructure as Code treats infrastructure setup as code - version controlled, repeatable, and automated.

### Example Terraform Configuration
```hcl
resource "azurerm_app_service" "main" {
  name                = "student-task-manager"
  location            = "East US"
  resource_group_name = azurerm_resource_group.main.name
  app_service_plan_id = azurerm_app_service_plan.main.id
}
```

**Benefits:**
- Reproducible infrastructure
- Version controlled
- Easy to replicate across environments

---

## 📊 Monitoring & Observability

### Application Insights
- Track performance metrics
- Monitor errors and exceptions
- Analyze user behavior

### Azure App Service Metrics
- CPU usage
- Memory usage
- Response time
- HTTP status codes

---

## 🎓 Reflection: What I Learned

### What Worked Well ✅
1. **Multi-stage Docker builds**: Significantly reduced image size (from ~1GB to ~200MB)
2. **GitHub Actions**: Automated deployment saved hours of manual work
3. **Azure App Service**: Easy to configure and deploy
4. **Health checks**: Caught deployment issues before they affected users

### Challenges I Faced 🤔
1. **Docker Image Size**: Initial image was too large
   - **Solution**: Used multi-stage builds and alpine base image
   
2. **Environment Variables**: Confusion between build-time and runtime variables
   - **Solution**: Documented which variables go where (GitHub Secrets vs Azure App Settings)
   
3. **Azure Service Principal**: Complex authentication setup
   - **Solution**: Followed Azure CLI commands step-by-step, saved credentials securely
   
4. **Next.js Standalone Output**: Didn't know this was required for Docker
   - **Solution**: Research and documentation reading

### What I Would Improve Next Time 🚀
1. **Add Terraform**: Implement full IaC for reproducible infrastructure
2. **Staging Environment**: Add a staging environment between dev and production
3. **Automated Tests**: Add unit and integration tests to CI pipeline
4. **Database Integration**: Currently no database; would add Azure Database for PostgreSQL
5. **CDN**: Use Azure CDN for static assets
6. **Cost Optimization**: Implement auto-scaling based on traffic
7. **Security Scanning**: Add container vulnerability scanning to CI/CD

---

## 🔗 Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Azure for Students](https://azure.microsoft.com/en-us/free/students/)

---

## 📝 Key Takeaways

1. **Containerization is essential** for modern cloud deployments
2. **Automation saves time** and reduces human error
3. **Security must be built-in**, not added later
4. **Monitoring is crucial** for production applications
5. **Documentation is important** for team collaboration and future maintenance

---

*This deployment journey taught me that cloud deployments are not just about pushing code - they're about building reliable, secure, and maintainable systems that can scale with user needs.*
