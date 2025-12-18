# Azure Deployment Guide

## Prerequisites
- Azure Account (Free tier available for students)
- Azure CLI installed
- Docker Desktop installed
- GitHub account

## Step 1: Create Azure Resources

### 1.1 Install Azure CLI
```bash
# Windows (PowerShell)
winget install -e --id Microsoft.AzureCLI

# Verify installation
az --version
```

### 1.2 Login to Azure
```bash
az login
```

### 1.3 Create Resource Group
```bash
az group create \
  --name student-task-manager-rg \
  --location eastus
```

### 1.4 Create Azure Container Registry (ACR)
```bash
az acr create \
  --resource-group student-task-manager-rg \
  --name studenttaskmanageracr \
  --sku Basic \
  --admin-enabled true
```

### 1.5 Get ACR Credentials
```bash
# Get login server
az acr show --name studenttaskmanageracr --query loginServer --output table

# Get credentials
az acr credential show --name studenttaskmanageracr
```

### 1.6 Create Azure App Service Plan
```bash
az appservice plan create \
  --name student-task-manager-plan \
  --resource-group student-task-manager-rg \
  --is-linux \
  --sku B1
```

### 1.7 Create Web App
```bash
az webapp create \
  --resource-group student-task-manager-rg \
  --plan student-task-manager-plan \
  --name student-task-manager \
  --deployment-container-image-name studenttaskmanageracr.azurecr.io/student-task-manager:latest
```

### 1.8 Configure Web App
```bash
# Enable ACR authentication
az webapp config container set \
  --name student-task-manager \
  --resource-group student-task-manager-rg \
  --docker-custom-image-name studenttaskmanageracr.azurecr.io/student-task-manager:latest \
  --docker-registry-server-url https://studenttaskmanageracr.azurecr.io \
  --docker-registry-server-user <ACR_USERNAME> \
  --docker-registry-server-password <ACR_PASSWORD>

# Set environment variables
az webapp config appsettings set \
  --name student-task-manager \
  --resource-group student-task-manager-rg \
  --settings \
    NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
```

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

1. **AZURE_CREDENTIALS**
```bash
# Create service principal
az ad sp create-for-rbac \
  --name "student-task-manager-sp" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/student-task-manager-rg \
  --sdk-auth
```
Copy the entire JSON output as the secret value.

2. **AZURE_REGISTRY_LOGIN_SERVER**
```
studenttaskmanageracr.azurecr.io
```

3. **AZURE_REGISTRY_USERNAME**
```
<ACR_USERNAME from step 1.5>
```

4. **AZURE_REGISTRY_PASSWORD**
```
<ACR_PASSWORD from step 1.5>
```

5. **AZURE_RESOURCE_GROUP**
```
student-task-manager-rg
```

## Step 3: Local Docker Testing

### 3.1 Build Docker Image
```bash
cd student-task-manager
docker build -t student-task-manager:local .
```

### 3.2 Run Container Locally
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  student-task-manager:local
```

### 3.3 Test with Docker Compose
```bash
docker-compose up --build
```

Visit `http://localhost:3000` to verify the application works.

## Step 4: Manual Docker Push (Optional)

```bash
# Login to ACR
az acr login --name studenttaskmanageracr

# Tag image
docker tag student-task-manager:local studenttaskmanageracr.azurecr.io/student-task-manager:latest

# Push to ACR
docker push studenttaskmanageracr.azurecr.io/student-task-manager:latest
```

## Step 5: Deploy via CI/CD

1. Push your code to the `main` branch
2. GitHub Actions will automatically:
   - Build and test the application
   - Create a Docker image
   - Push to Azure Container Registry
   - Deploy to Azure App Service
   - Run health checks

## Step 6: Verify Deployment

```bash
# Check deployment status
az webapp show \
  --name student-task-manager \
  --resource-group student-task-manager-rg \
  --query state

# View logs
az webapp log tail \
  --name student-task-manager \
  --resource-group student-task-manager-rg
```

Visit: `https://student-task-manager.azurewebsites.net`

## Troubleshooting

### Check Container Logs
```bash
az webapp log tail --name student-task-manager --resource-group student-task-manager-rg
```

### Restart Web App
```bash
az webapp restart --name student-task-manager --resource-group student-task-manager-rg
```

### Check Environment Variables
```bash
az webapp config appsettings list \
  --name student-task-manager \
  --resource-group student-task-manager-rg
```

## Cost Management

- **Free Tier**: Use Azure for Students ($100 credit)
- **Monitor Usage**: Set up cost alerts in Azure Portal
- **Clean Up Resources**:
```bash
az group delete --name student-task-manager-rg --yes --no-wait
```

## Security Best Practices

1. ✅ Use managed identities instead of passwords when possible
2. ✅ Store secrets in Azure Key Vault
3. ✅ Enable HTTPS only
4. ✅ Use non-root user in Docker container
5. ✅ Regularly update dependencies
6. ✅ Enable Azure Security Center recommendations

## Monitoring

### Enable Application Insights
```bash
az monitor app-insights component create \
  --app student-task-manager-insights \
  --location eastus \
  --resource-group student-task-manager-rg
```

### View Metrics
- Go to Azure Portal → App Service → Monitoring → Metrics
- Monitor: CPU, Memory, Response Time, HTTP Status Codes
