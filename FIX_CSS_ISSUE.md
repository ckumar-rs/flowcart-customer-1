# Fix: CSS Not Loading on IIS

## Problem
The application runs but CSS/styles are not loading. This is because static assets (`.next/static/`) are missing or not accessible.

## Solution

### Step 1: Verify Static Folder Exists on IIS

Check if `.next/static/` exists in your IIS deployment:

```powershell
Test-Path "C:\inetpub\wwwroot\flowcart-customer\.next\static"
```

If it returns `False`, the static folder is missing and needs to be copied.

### Step 2: Verify Folder Structure

Your IIS deployment should have this structure:

```
C:\inetpub\wwwroot\flowcart-customer\
├── .next/
│   ├── standalone/
│   │   ├── server.js
│   │   ├── node_modules/
│   │   └── ...
│   └── static/              ← This folder MUST exist!
│       └── _next/
│           └── static/
│               ├── chunks/
│               ├── css/
│               └── ...
├── public/                   ← If you have public files
└── web.config
```

### Step 3: Copy Static Folder to IIS

If the static folder is missing, copy it from your build:

```powershell
# From your development machine
$sourceDir = "D:\Contirvya-Projects\flowcart\web-customer"
$deployDir = "C:\inetpub\wwwroot\flowcart-customer"

# Ensure .next directory exists
New-Item -ItemType Directory -Force -Path "$deployDir\.next" | Out-Null

# Copy static folder
Copy-Item -Path "$sourceDir\.next\static" -Destination "$deployDir\.next\static" -Recurse -Force

Write-Host "Static folder copied successfully!" -ForegroundColor Green
```

### Step 4: Verify Static Folder Permissions

Ensure IIS can read the static folder:

```powershell
$staticPath = "C:\inetpub\wwwroot\flowcart-customer\.next\static"
$appPoolName = "YourAppPoolName"  # Replace with your App Pool name

# Grant read permissions
icacls $staticPath /grant "IIS_IUSRS:(OI)(CI)(RX)" /T
icacls $staticPath /grant "IIS AppPool\$appPoolName:(OI)(CI)(RX)" /T
icacls $staticPath /grant "IUSR:(OI)(CI)(RX)" /T
```

### Step 5: Rebuild and Redeploy (If Needed)

If the static folder structure is wrong, rebuild and redeploy:

```powershell
cd D:\Contirvya-Projects\flowcart\web-customer

# Clean previous build
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Rebuild
npm run build

# Verify static folder was created
if (Test-Path ".next\static") {
    Write-Host "✓ Static folder created" -ForegroundColor Green
} else {
    Write-Host "✗ Static folder missing - build may have failed" -ForegroundColor Red
    exit 1
}

# Copy to IIS
$deployDir = "C:\inetpub\wwwroot\flowcart-customer"
New-Item -ItemType Directory -Force -Path "$deployDir\.next" | Out-Null
Copy-Item -Path ".next\standalone" -Destination "$deployDir\.next\standalone" -Recurse -Force
Copy-Item -Path ".next\static" -Destination "$deployDir\.next\static" -Recurse -Force

# Copy web.config
Copy-Item -Path "web.config" -Destination "$deployDir\web.config" -Force

Write-Host "✓ Deployment completed" -ForegroundColor Green
```

### Step 6: Restart Application Pool

After copying files:

```powershell
Restart-WebAppPool -Name "YourAppPoolName"
```

### Step 7: Test in Browser

1. Open browser developer tools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for CSS file requests (should be `/_next/static/css/...`)
5. Check if they return 200 (success) or 404 (not found)

### Common Issues

#### Issue 1: Static folder not copied
**Symptom**: CSS files return 404
**Fix**: Copy `.next/static/` folder to IIS

#### Issue 2: Wrong folder structure
**Symptom**: CSS files return 404
**Fix**: Ensure `.next/static/` is at the same level as `.next/standalone/`

#### Issue 3: Permissions issue
**Symptom**: CSS files return 403 Forbidden
**Fix**: Run the permissions script or manually set read permissions

#### Issue 4: Port 3000 instead of IIS port
**Symptom**: App running on `http://localhost:3000/` instead of IIS port
**Fix**: This means Next.js dev server is running. Stop it and access via IIS port (usually 80 or configured port)

### Verify Next.js is Running via IIS

If you see `http://localhost:3000/`, you might be running the Next.js dev server instead of IIS:

1. Stop any running Next.js processes:
   ```powershell
   Get-Process node | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force
   ```

2. Access via IIS port (check IIS Manager for the configured port, usually 80 or 443)

3. Or check your IIS site binding in IIS Manager

### Quick Check Script

Run this to verify everything is in place:

```powershell
$deployDir = "C:\inetpub\wwwroot\flowcart-customer"

Write-Host "Checking deployment..." -ForegroundColor Cyan

# Check standalone
if (Test-Path "$deployDir\.next\standalone\server.js") {
    Write-Host "✓ server.js exists" -ForegroundColor Green
} else {
    Write-Host "✗ server.js missing" -ForegroundColor Red
}

# Check static folder
if (Test-Path "$deployDir\.next\static") {
    $staticFiles = Get-ChildItem "$deployDir\.next\static" -Recurse -File | Measure-Object
    Write-Host "✓ Static folder exists ($($staticFiles.Count) files)" -ForegroundColor Green
} else {
    Write-Host "✗ Static folder missing" -ForegroundColor Red
}

# Check web.config
if (Test-Path "$deployDir\web.config") {
    Write-Host "✓ web.config exists" -ForegroundColor Green
} else {
    Write-Host "✗ web.config missing" -ForegroundColor Red
}
```

