# Simple IIS Deployment Guide

This guide will help you deploy to IIS with minimal complications.

## 📋 Prerequisites

1. **Node.js** v18+ installed
2. **IIS** installed
3. **iisnode** installed (download from: https://github.com/Azure/iisnode/releases)
4. **URL Rewrite Module** installed (download from: https://www.iis.net/downloads/microsoft/url-rewrite)

## 🚀 Step-by-Step Deployment

### Step 1: Build the Application

```powershell
cd D:\Contirvya-Projects\flowcart\web-customer
npm run build
```

This creates:
- `.next/standalone/` - Node.js server
- `.next/static/` - CSS, JS, images (IMPORTANT!)

### Step 2: Copy Files to IIS

```powershell
$deployPath = "C:\inetpub\wwwroot\flowcart-customer"

# Create directory
New-Item -ItemType Directory -Force -Path $deployPath | Out-Null

# Copy standalone build
New-Item -ItemType Directory -Force -Path "$deployPath\.next" | Out-Null
Copy-Item -Path ".next\standalone\*" -Destination "$deployPath\.next\standalone\" -Recurse -Force

# Copy static files (REQUIRED for CSS!)
Copy-Item -Path ".next\static" -Destination "$deployPath\.next\static\" -Recurse -Force

# Copy public folder (if exists)
if (Test-Path "public") {
    Copy-Item -Path "public\*" -Destination "$deployPath\public\" -Recurse -Force
}

# Copy web.config
Copy-Item -Path "web.config" -Destination "$deployPath\web.config" -Force
```

### Step 3: Set Permissions (FIXES THE ERROR!)

Run this PowerShell script **as Administrator**:

```powershell
$deployPath = "C:\inetpub\wwwroot\flowcart-customer"
$appPoolName = "DefaultAppPool"  # Change if you use a different App Pool name

# Grant permissions to IIS_IUSRS
icacls $deployPath /grant "IIS_IUSRS:(OI)(CI)(F)" /T

# Grant permissions to Application Pool identity
icacls $deployPath /grant "IIS AppPool\$appPoolName:(OI)(CI)(F)" /T

# Grant permissions to IUSR
icacls $deployPath /grant "IUSR:(OI)(CI)(RX)" /T

# Create and set permissions for iisnode directory
$iisnodeDir = "$deployPath\.next\standalone\iisnode"
New-Item -ItemType Directory -Force -Path $iisnodeDir | Out-Null
icacls $iisnodeDir /grant "IIS AppPool\$appPoolName:(OI)(CI)(F)"
icacls $iisnodeDir /grant "IIS_IUSRS:(OI)(CI)(F)"
```

### Step 4: Create IIS Site

1. **Open IIS Manager** (`inetmgr`)

2. **Create Application Pool:**
   - Right-click **Application Pools** → **Add Application Pool**
   - **Name:** `FlowCartCustomerAppPool`
   - **.NET CLR version:** No Managed Code
   - **Managed pipeline mode:** Integrated
   - Click **OK**

3. **Create Website:**
   - Right-click **Sites** → **Add Website**
   - **Site name:** `FlowCartCustomer`
   - **Application pool:** `FlowCartCustomerAppPool`
   - **Physical path:** `C:\inetpub\wwwroot\flowcart-customer`
   - **Binding:**
     - **Type:** http
     - **Port:** 80 (or your desired port)
   - Click **OK**

4. **Start the Application Pool:**
   - Go to **Application Pools**
   - Right-click `FlowCartCustomerAppPool` → **Start**

5. **Start the Website:**
   - Go to **Sites**
   - Right-click `FlowCartCustomer` → **Start**

### Step 5: Test

Open browser: `http://localhost/` (or your configured port)

## 🔧 Troubleshooting

### Error: "iisnode encountered an error"

**This is a permissions issue. Fix it:**

1. **Find your Application Pool name:**
   - IIS Manager → Application Pools → Note the name

2. **Run permissions script (as Administrator):**
   ```powershell
   cd D:\Contirvya-Projects\flowcart\web-customer
   .\set-iis-permissions.ps1 -DeployPath "C:\inetpub\wwwroot\flowcart-customer" -AppPoolName "FlowCartCustomerAppPool"
   ```

3. **Restart Application Pool:**
   ```powershell
   Restart-WebAppPool -Name "FlowCartCustomerAppPool"
   ```

### Error: CSS not loading

**The `.next/static/` folder is missing!**

Fix:
```powershell
# Copy static folder
Copy-Item -Path "D:\Contirvya-Projects\flowcart\web-customer\.next\static" -Destination "C:\inetpub\wwwroot\flowcart-customer\.next\static" -Recurse -Force

# Restart Application Pool
Restart-WebAppPool -Name "FlowCartCustomerAppPool"
```

### Error: "Cannot find module 'next'"

**The standalone build is incomplete!**

Fix:
```powershell
cd D:\Contirvya-Projects\flowcart\web-customer

# Clean and rebuild
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build

# Verify next module exists
Test-Path ".next\standalone\node_modules\next"

# If False, rebuild again
```

## ✅ Quick Verification

Run this to check everything:

```powershell
$deployPath = "C:\inetpub\wwwroot\flowcart-customer"

Write-Host "Checking deployment..." -ForegroundColor Cyan

# Check files
$checks = @(
    @{Path=".next\standalone\server.js"; Name="server.js"},
    @{Path=".next\static"; Name="static folder"},
    @{Path="web.config"; Name="web.config"}
)

foreach ($check in $checks) {
    $fullPath = Join-Path $deployPath $check.Path
    if (Test-Path $fullPath) {
        Write-Host "✓ $($check.Name) exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $($check.Name) MISSING!" -ForegroundColor Red
    }
}

# Check IIS site
Import-Module WebAdministration -ErrorAction SilentlyContinue
$site = Get-Website | Where-Object { $_.PhysicalPath -like "*flowcart-customer*" }
if ($site) {
    Write-Host "✓ IIS Site: $($site.Name) - Status: $($site.State)" -ForegroundColor Green
} else {
    Write-Host "✗ IIS Site not found!" -ForegroundColor Red
}
```

## 📝 Complete Deployment Script

Save this as `deploy-to-iis-simple.ps1`:

```powershell
param(
    [string]$DeployPath = "C:\inetpub\wwwroot\flowcart-customer",
    [string]$AppPoolName = "FlowCartCustomerAppPool"
)

Write-Host "Building application..." -ForegroundColor Green
cd D:\Contirvya-Projects\flowcart\web-customer
npm run build

Write-Host "Copying files..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $DeployPath | Out-Null
New-Item -ItemType Directory -Force -Path "$DeployPath\.next" | Out-Null
Copy-Item -Path ".next\standalone\*" -Destination "$DeployPath\.next\standalone\" -Recurse -Force
Copy-Item -Path ".next\static" -Destination "$DeployPath\.next\static\" -Recurse -Force
if (Test-Path "public") {
    Copy-Item -Path "public\*" -Destination "$DeployPath\public\" -Recurse -Force
}
Copy-Item -Path "web.config" -Destination "$DeployPath\web.config" -Force

Write-Host "Setting permissions..." -ForegroundColor Green
icacls $DeployPath /grant "IIS_IUSRS:(OI)(CI)(F)" /T
icacls $DeployPath /grant "IIS AppPool\$AppPoolName:(OI)(CI)(F)" /T
icacls $DeployPath /grant "IUSR:(OI)(CI)(RX)" /T

$iisnodeDir = "$DeployPath\.next\standalone\iisnode"
New-Item -ItemType Directory -Force -Path $iisnodeDir | Out-Null
icacls $iisnodeDir /grant "IIS AppPool\$AppPoolName:(OI)(CI)(F)"
icacls $iisnodeDir /grant "IIS_IUSRS:(OI)(CI)(F)"

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Create IIS Site pointing to: $DeployPath" -ForegroundColor Cyan
Write-Host "2. Set Application Pool to: $AppPoolName" -ForegroundColor Cyan
Write-Host "3. Restart Application Pool" -ForegroundColor Cyan
Write-Host "4. Access: http://localhost/" -ForegroundColor Cyan
```

Run it:
```powershell
.\deploy-to-iis-simple.ps1
```

## 🎯 Summary

The key steps:
1. ✅ Build the app
2. ✅ Copy `.next/standalone/` and `.next/static/` to IIS
3. ✅ Set permissions (this fixes the iisnode error!)
4. ✅ Create IIS site
5. ✅ Access via `http://localhost/`

The permissions step is critical - that's what fixes the "iisnode encountered an error" issue!

