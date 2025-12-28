# FlowCart Web Customer - IIS Deployment Guide

## Quick Start

### Option 1: Complete Automated Deployment (Recommended)

This script installs all prerequisites and deploys the application:

```powershell
# Run as Administrator
powershell.exe -ExecutionPolicy Bypass -File .\FULL_DEPLOYMENT.ps1
```

### Option 2: Step-by-Step Deployment

#### Step 1: Install Prerequisites

```powershell
# Run as Administrator
powershell.exe -ExecutionPolicy Bypass -File .\INSTALL_PREREQUISITES.ps1
```

This will:
- Install IIS (if not installed)
- Install URL Rewrite Module
- Install iisnode
- Check for Node.js (you'll need to install manually if missing)

#### Step 2: Deploy Application

```powershell
# Run as Administrator
powershell.exe -ExecutionPolicy Bypass -File .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
```

## Prerequisites

Before deployment, ensure you have:

1. **Windows Server** or **Windows 10/11** with IIS
2. **Node.js** v18 or higher
3. **iisnode** module
4. **URL Rewrite Module** for IIS

## Scripts Overview

### `FULL_DEPLOYMENT.ps1`
Complete end-to-end deployment script that:
- Installs all prerequisites
- Verifies Node.js
- Runs the deployment

### `INSTALL_PREREQUISITES.ps1`
Installs missing prerequisites:
- IIS (Windows Server or Client)
- URL Rewrite Module
- iisnode
- Checks Node.js (manual installation required)

### `DEPLOY_TO_IIS.ps1`
Deploys the application to IIS:
- Creates Application Pool
- Creates Website
- Sets permissions
- Copies files
- Installs dependencies

### `RUN_DEPLOYMENT.ps1`
Wrapper script that bypasses execution policy (for convenience)

## Manual Prerequisites Installation

### Install IIS

**Windows Server:**
```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

**Windows 10/11:**
```powershell
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
```
Or use: Control Panel > Programs > Turn Windows features on or off > Internet Information Services

### Install URL Rewrite Module

1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the MSI package
3. Restart IIS: `iisreset`

### Install iisnode

1. Download from: https://github.com/Azure/iisnode/releases
2. Choose the correct architecture (x64 or x86)
3. Install the MSI package
4. Restart IIS: `iisreset`

### Install Node.js

1. Download from: https://nodejs.org/
2. Install the LTS version (v18 or higher)
3. **Important:** Check "Add to PATH" during installation
4. Restart PowerShell after installation

## Troubleshooting

### "node is not recognized"

Node.js is not in PATH. Solutions:
1. Reinstall Node.js and check "Add to PATH"
2. Add Node.js to PATH manually:
   ```powershell
   $env:Path += ";C:\Program Files\nodejs"
   ```
3. Restart PowerShell

### "Get-WindowsFeature is not recognized"

You're on Windows Client (10/11), not Server. The script should auto-detect this. If not, use:
```powershell
Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
```

### Script Opens in Editor Instead of Running

Use one of these methods:
```powershell
# Method 1: Use bypass flag
powershell.exe -ExecutionPolicy Bypass -File .\SCRIPT_NAME.ps1

# Method 2: Use call operator
& ".\SCRIPT_NAME.ps1"

# Method 3: Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\SCRIPT_NAME.ps1
```

### 502 Bad Gateway After Deployment

1. Check iisnode logs: `C:\inetpub\wwwroot\flowcart-customer\iisnode\`
2. Verify Node.js is in PATH
3. Check Application Pool is running
4. Verify `server.js` exists in deployment folder
5. Check file permissions

## Post-Deployment

### Configure Environment Variables

Edit `web.config` and update:
```xml
<environmentVariables>
  <add name="NEXT_PUBLIC_API_URL" value="https://your-api-domain.com/api" />
  <add name="NEXT_PUBLIC_WS_URL" value="wss://your-api-domain.com/hubs" />
</environmentVariables>
```

### Test the Application

1. Open browser: `http://your-server-ip` or `http://your-domain`
2. Check for errors in:
   - Browser console (F12)
   - iisnode logs
   - Windows Event Viewer

## Support

For issues:
1. Check iisnode logs
2. Check Windows Event Viewer
3. Review IIS logs
4. Verify all prerequisites are installed

