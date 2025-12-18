# Quick Start Deployment Guide

## 🚀 Step-by-Step Deployment Checklist

### Prerequisites Installation
```powershell
# 1. Install Azure CLI
winget install -e --id Microsoft.AzureCLI

# 2. Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# 3. Verify installations
az --version
docker --version
node --version
```

---

## Phase 1: Local Docker Testing (15 minutes)

### Step 1: Test Docker Build
```powershell
cd student-task-manager

# Build the Docker image
docker build -t student-task-manager:local .

# Run the container
docker run -p 3000:3000 -e NODE_ENV=production student-task-manager:local
```

Visit `http://localhost:3000` to verify it works.

### Step 2: Test with Docker Compose
```powershell
# Stop the previous container (Ctrl+C)

# Run with Docker Compose
docker-compose up --build
```

✅ **Checkpoint**: Application should be running on http://localhost:3000

---

## Phase 2: Azure Setup (30 minutes)

### Step 1: Login to Azure
```powershell
az login
```

### Step 2: Set Variables (Customize these!)
```powershell
$RESOURCE_GROUP = "student-task-manager-rg"
$LOCATION = "eastus"
$ACR_NAME = "studenttaskmanageracr"  # Must be globally unique, lowercase, no hyphens
$APP_SERVICE_PLAN = "student-task-manager-plan"
$WEB_APP_NAME = "student-task-manager"  # Must be globally unique
```

### Step 3: Create Resource Group
```powershell
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION
```

### Step 4: Create Container Registry
```powershell
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true
```

### Step 5: Get ACR Credentials
```powershell
# Get login server
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer --output tsv

# Get username
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username --output tsv

# Get password
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv

# Display credentials (save these!)
Write-Host "ACR Login Server: $ACR_LOGIN_SERVER"
Write-Host "ACR Username: $ACR_USERNAME"
Write-Host "ACR Password: $ACR_PASSWORD"
```

### Step 6: Create App Service Plan
```powershell
az appservice plan create `
  --name $APP_SERVICE_PLAN `
  --resource-group $RESOURCE_GROUP `
  --is-linux `
  --sku B1
```

### Step 7: Create Web App
```powershell
az webapp create `
  --resource-group $RESOURCE_GROUP `
  --plan $APP_SERVICE_PLAN `
  --name $WEB_APP_NAME `
  --deployment-container-image-name "$ACR_LOGIN_SERVER/student-task-manager:latest"
```

### Step 8: Configure Web App
```powershell
# Configure container settings
az webapp config container set `
  --name $WEB_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --docker-custom-image-name "$ACR_LOGIN_SERVER/student-task-manager:latest" `
  --docker-registry-server-url "https://$ACR_LOGIN_SERVER" `
  --docker-registry-server-user $ACR_USERNAME `
  --docker-registry-server-password $ACR_PASSWORD

# Set environment variables
az webapp config appsettings set `
  --name $WEB_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --settings NODE_ENV=production PORT=3000 NEXT_TELEMETRY_DISABLED=1
```

✅ **Checkpoint**: Azure resources are created

---

## Phase 3: Manual Docker Push (20 minutes)

### Step 1: Login to ACR
```powershell
az acr login --name $ACR_NAME
```

### Step 2: Build and Tag Image
```powershell
cd student-task-manager

# Build for production
docker build -t student-task-manager:latest .

# Tag for ACR
docker tag student-task-manager:latest "$ACR_LOGIN_SERVER/student-task-manager:latest"
```

### Step 3: Push to ACR
```powershell
docker push "$ACR_LOGIN_SERVER/student-task-manager:latest"
```

### Step 4: Restart Web App
```powershell
az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

### Step 5: Verify Deployment
```powershell
# Check status
az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --query state

# View logs
az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

Visit: `https://$WEB_APP_NAME.azurewebsites.net`

✅ **Checkpoint**: Application is live on Azure!

---

## Phase 4: GitHub Actions Setup (15 minutes)

### Step 1: Create Service Principal
```powershell
# Get subscription ID
$SUBSCRIPTION_ID = az account show --query id --output tsv

# Create service principal
$SP_OUTPUT = az ad sp create-for-rbac `
  --name "student-task-manager-sp" `
  --role contributor `
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" `
  --sdk-auth

# Display output (copy this entire JSON)
Write-Host $SP_OUTPUT
```

### Step 2: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | Entire JSON output from service principal |
| `AZURE_REGISTRY_LOGIN_SERVER` | Value of `$ACR_LOGIN_SERVER` |
| `AZURE_REGISTRY_USERNAME` | Value of `$ACR_USERNAME` |
| `AZURE_REGISTRY_PASSWORD` | Value of `$ACR_PASSWORD` |
| `AZURE_RESOURCE_GROUP` | Value of `$RESOURCE_GROUP` |

### Step 3: Commit and Push
```powershell
cd ..  # Go to repository root

git add .
git commit -m "Add Docker and CI/CD configuration"
git push origin main
```

### Step 4: Monitor Deployment

1. Go to GitHub repository
2. Click **Actions** tab
3. Watch the workflow run
4. Verify all jobs complete successfully

✅ **Checkpoint**: CI/CD is working!

---

## Phase 5: Testing & Verification (10 minutes)

### Test the Deployment Pipeline

1. Make a small change to your code
2. Commit and push to main branch
3. Watch GitHub Actions automatically deploy
4. Verify changes appear on live site

### Monitor Application

```powershell
# View real-time logs
az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# Check metrics
az monitor metrics list `
  --resource "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME" `
  --metric "CpuPercentage,MemoryPercentage,Http2xx,Http4xx,Http5xx"
```

---

## 🎯 Final Checklist

- [ ] Docker image builds successfully locally
- [ ] Application runs in Docker container locally
- [ ] Azure resources created (Resource Group, ACR, App Service)
- [ ] Docker image pushed to Azure Container Registry
- [ ] Application deployed to Azure App Service
- [ ] Application accessible via Azure URL
- [ ] GitHub Secrets configured
- [ ] CI/CD pipeline runs successfully
- [ ] Automatic deployment works on git push
- [ ] Documentation completed
- [ ] Video recorded and uploaded

---

## 🆘 Troubleshooting

### Docker Build Fails
```powershell
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t student-task-manager:local .
```

### Azure Web App Not Starting
```powershell
# Check logs
az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# Restart app
az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# Check configuration
az webapp config show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

### GitHub Actions Fails
1. Check secrets are correctly set
2. Verify service principal has correct permissions
3. Check workflow file syntax
4. Review action logs for specific errors

### Application Shows 503 Error
```powershell
# Check if container is running
az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --query state

# Pull latest image
az webapp config container set `
  --name $WEB_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --docker-custom-image-name "$ACR_LOGIN_SERVER/student-task-manager:latest"
```

---

## 💰 Cost Management

### Monitor Costs
```powershell
# View cost analysis
az consumption usage list --start-date 2025-12-01 --end-date 2025-12-31
```

### Stop Resources (When Not Using)
```powershell
# Stop web app (still incurs App Service Plan costs)
az webapp stop --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP

# Delete everything (to stop all costs)
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

### Recreate Resources
If you deleted resources and need to recreate:
```powershell
# Run Phase 2 commands again
# Then run Phase 3 to redeploy
```

---

## 📚 Next Steps

1. **Add Database**: Integrate Azure Database for PostgreSQL
2. **Add Monitoring**: Set up Application Insights
3. **Add CDN**: Use Azure CDN for static assets
4. **Add Custom Domain**: Configure custom domain name
5. **Add SSL**: Set up custom SSL certificate
6. **Add Staging**: Create staging environment
7. **Add Tests**: Implement automated testing in CI/CD

---

## 🎓 Learning Resources

- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Azure for Students](https://azure.microsoft.com/en-us/free/students/)

---

**Good luck with your deployment! 🚀**
