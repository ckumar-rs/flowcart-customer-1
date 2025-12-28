# Deploy Next.js to IIS WITHOUT iisnode (Recommended)

This approach is **much simpler** and avoids all iisnode permission issues. We run Node.js as a standalone service and use IIS as a reverse proxy.

## ✅ Benefits

- ✅ **No iisnode needed** - Avoids all permission and configuration issues
- ✅ **Simpler setup** - Just run Node.js and configure IIS reverse proxy
- ✅ **Better performance** - Node.js runs standalone, not embedded in IIS
- ✅ **Easier debugging** - Direct access to Node.js logs
- ✅ **Process management** - Use PM2 for auto-restart and monitoring

## 📋 Prerequisites

1. **Node.js** v18+ installed
2. **IIS** with **URL Rewrite Module** installed
3. **ARR (Application Request Routing)** installed (for reverse proxy)
4. **PM2** (optional, for process management)

## 🚀 Step 1: Install ARR (Application Request Routing)

1. Download from: https://www.iis.net/downloads/microsoft/application-request-routing
2. Install the MSI package
3. Restart IIS: `iisreset`

## 🔧 Step 2: Enable Proxy in ARR

1. Open **IIS Manager**
2. Select your **server** (top level, not a site)
3. Double-click **Application Request Routing Cache**
4. Click **Server Proxy Settings** in the right panel
5. Check **Enable proxy**
6. Click **Apply**

## 📦 Step 3: Build and Deploy Files

```powershell
cd D:\Contirvya-Projects\flowcart\web-customer

# Build the application
npm run build

# Create deployment directory
$deployPath = "C:\inetpub\wwwroot\flowcart-customer"
New-Item -ItemType Directory -Force -Path $deployPath | Out-Null

# Copy standalone build
Copy-Item -Path ".next\standalone\*" -Destination "$deployPath\.next\standalone\" -Recurse -Force

# Copy static files (IMPORTANT for CSS!)
Copy-Item -Path ".next\static" -Destination "$deployPath\.next\static\" -Recurse -Force

# Copy public folder (if exists)
if (Test-Path "public") {
    Copy-Item -Path "public\*" -Destination "$deployPath\public\" -Recurse -Force
}
```

## ⚙️ Step 4: Create web.config for Reverse Proxy

Create/update `web.config` in the deployment folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Reverse proxy to Node.js on port 3001 -->
        <rule name="ReverseProxyInboundRule" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3001/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="http" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## 🚀 Step 5: Start Node.js Service

### Option A: Using PM2 (Recommended)

**Install PM2:**
```powershell
npm install -g pm2
```

**Start the application:**
```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000/api"  # Update with your API URL
$env:NEXT_PUBLIC_WS_URL = "ws://localhost:5000/hubs"    # Update with your WS URL

# Start with PM2
pm2 start server.js --name "flowcart-customer" --update-env

# Save PM2 configuration
pm2 save

# Setup PM2 to start on Windows boot
pm2 startup
```

### Option B: Using Windows Service (NSSM)

**Install NSSM:**
1. Download from: https://nssm.cc/download
2. Extract to a folder (e.g., `C:\nssm`)

**Create service:**
```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone

# Create service
C:\nssm\win64\nssm.exe install FlowCartCustomer "C:\Program Files\nodejs\node.exe" "server.js"

# Set working directory
C:\nssm\win64\nssm.exe set FlowCartCustomer AppDirectory "C:\inetpub\wwwroot\flowcart-customer\.next\standalone"

# Set environment variables
C:\nssm\win64\nssm.exe set FlowCartCustomer AppEnvironmentExtra "NODE_ENV=production" "PORT=3001" "NEXT_PUBLIC_API_URL=http://localhost:5000/api" "NEXT_PUBLIC_WS_URL=ws://localhost:5000/hubs"

# Start service
C:\nssm\win64\nssm.exe start FlowCartCustomer
```

### Option C: Simple PowerShell Script (For Testing)

Create `start-app.ps1`:
```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone

$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000/api"
$env:NEXT_PUBLIC_WS_URL = "ws://localhost:5000/hubs"

Start-Process node -ArgumentList "server.js" -WorkingDirectory (Get-Location).Path -NoNewWindow
```

## 🌐 Step 6: Configure IIS Site

1. **Open IIS Manager**
2. **Create or select your site:**
   - Right-click **Sites** → **Add Website**
   - **Site name:** `FlowCartCustomer`
   - **Physical path:** `C:\inetpub\wwwroot\flowcart-customer`
   - **Port:** 80 (or your desired port)
   - Click **OK**

3. **Verify web.config is in place:**
   - The `web.config` file should be in `C:\inetpub\wwwroot\flowcart-customer\`

## ✅ Step 7: Test

1. **Verify Node.js is running:**
   ```powershell
   # Check if port 3001 is listening
   netstat -ano | findstr :3001
   
   # Or check PM2
   pm2 list
   ```

2. **Access via IIS:**
   - Open browser: `http://localhost/` (or your configured port)
   - The request will be proxied to Node.js on port 3001

3. **Check logs:**
   ```powershell
   # PM2 logs
   pm2 logs flowcart-customer
   
   # Or if running directly, check console output
   ```

## 🔍 Troubleshooting

### Node.js not starting

**Check if port is in use:**
```powershell
netstat -ano | findstr :3001
```

**Check PM2 status:**
```powershell
pm2 list
pm2 logs flowcart-customer
```

**Verify Node.js path:**
```powershell
node --version
where.exe node
```

### 502 Bad Gateway

**Causes:**
- Node.js is not running on port 3001
- ARR proxy is not enabled
- Firewall blocking port 3001

**Fix:**
1. Ensure Node.js is running: `pm2 list` or check process
2. Verify ARR is enabled (Step 2)
3. Check Windows Firewall allows port 3001

### CSS/Static files not loading

**Cause:** `.next/static/` folder not copied

**Fix:**
```powershell
# Copy static folder
Copy-Item -Path "D:\Contirvya-Projects\flowcart\web-customer\.next\static" -Destination "C:\inetpub\wwwroot\flowcart-customer\.next\static" -Recurse -Force
```

### Port conflict

If port 3001 is in use, change it:

1. **Update PM2:**
   ```powershell
   pm2 delete flowcart-customer
   $env:PORT = "3002"  # Use different port
   pm2 start server.js --name "flowcart-customer" --update-env
   ```

2. **Update web.config:**
   ```xml
   <action type="Rewrite" url="http://localhost:3002/{R:1}" />
   ```

## 📝 Quick Deployment Script

Create `deploy-reverse-proxy.ps1`:

```powershell
param(
    [string]$DeployPath = "C:\inetpub\wwwroot\flowcart-customer",
    [int]$NodePort = 3001
)

Write-Host "Building application..." -ForegroundColor Green
cd D:\Contirvya-Projects\flowcart\web-customer
npm run build

Write-Host "Creating deployment directory..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $DeployPath | Out-Null

Write-Host "Copying files..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path "$DeployPath\.next" | Out-Null
Copy-Item -Path ".next\standalone\*" -Destination "$DeployPath\.next\standalone\" -Recurse -Force
Copy-Item -Path ".next\static" -Destination "$DeployPath\.next\static\" -Recurse -Force

if (Test-Path "public") {
    Copy-Item -Path "public\*" -Destination "$DeployPath\public\" -Recurse -Force
}

Write-Host "Creating web.config..." -ForegroundColor Green
$webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyInboundRule" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:$NodePort/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="http" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
$webConfig | Out-File -FilePath "$DeployPath\web.config" -Encoding UTF8

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Start Node.js: cd $DeployPath\.next\standalone && pm2 start server.js --name flowcart-customer" -ForegroundColor Cyan
Write-Host "2. Access via IIS: http://localhost/" -ForegroundColor Cyan
```

## 🎯 Summary

This approach:
- ✅ **No iisnode** - Avoids all permission issues
- ✅ **Simple setup** - Just Node.js + IIS reverse proxy
- ✅ **Reliable** - Node.js runs as a proper service
- ✅ **Easy to manage** - Use PM2 or Windows Service

**The key difference:** Instead of embedding Node.js in IIS (iisnode), we run Node.js separately and let IIS forward requests to it.

