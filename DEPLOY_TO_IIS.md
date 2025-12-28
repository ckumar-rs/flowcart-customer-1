# Quick Guide: Deploy web-customer to IIS

## Step 1: Build the Application

```powershell
cd web-customer
npm run build
```

This creates:
- `.next/standalone/` - Minimal Node.js server
- `.next/static/` - Static assets (CSS, JS, images)

## Step 2: Copy These Folders/Files to IIS

Copy the following to your IIS deployment folder (e.g., `C:\inetpub\wwwroot\flowcart-customer\`):

### Required Files/Folders:

1. **`.next/standalone/`** → Copy entire folder
   - Contains `server.js` and minimal `node_modules/`
   - This is the Node.js server that runs your app

2. **`.next/static/`** → Copy entire folder
   - Contains all static assets (CSS, JS bundles, images)
   - Required for the app to load properly

3. **`public/`** → Copy entire folder (if it exists)
   - Contains public static files (favicon, manifest.json, etc.)

4. **`web.config`** → Copy this file
   - IIS configuration file (already created in project root)

### Final IIS Directory Structure:

```
C:\inetpub\wwwroot\flowcart-customer\
├── .next/
│   ├── standalone/
│   │   ├── server.js          ← Main entry point
│   │   ├── node_modules/      ← Minimal dependencies
│   │   └── ...
│   └── static/                ← Static assets
│       ├── _next/
│       └── ...
├── public/                     ← Public files (if exists)
│   └── ...
└── web.config                  ← IIS configuration
```

## Step 3: PowerShell Deployment Script

Create `deploy.ps1` in `web-customer` folder:

```powershell
# Build the application
Write-Host "Building application..." -ForegroundColor Green
npm run build

# Set deployment path
$deployPath = "C:\inetpub\wwwroot\flowcart-customer"

# Create deployment directory
Write-Host "Creating deployment directory..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $deployPath | Out-Null

# Copy standalone build
Write-Host "Copying standalone build..." -ForegroundColor Green
Copy-Item -Path ".next\standalone\*" -Destination "$deployPath\.next\standalone\" -Recurse -Force

# Copy static files
Write-Host "Copying static files..." -ForegroundColor Green
Copy-Item -Path ".next\static" -Destination "$deployPath\.next\static\" -Recurse -Force

# Copy public folder (if exists)
if (Test-Path "public") {
    Write-Host "Copying public folder..." -ForegroundColor Green
    Copy-Item -Path "public\*" -Destination "$deployPath\public\" -Recurse -Force
}

# Copy web.config
Write-Host "Copying web.config..." -ForegroundColor Green
Copy-Item -Path "web.config" -Destination "$deployPath\web.config" -Force

Write-Host "`n✅ Deployment completed to $deployPath" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Ensure Node.js is installed on IIS server" -ForegroundColor Yellow
Write-Host "2. Install iisnode module in IIS" -ForegroundColor Yellow
Write-Host "3. Configure IIS Application Pool" -ForegroundColor Yellow
Write-Host "4. Set environment variables if needed" -ForegroundColor Yellow
```

## Step 4: Run Deployment

```powershell
.\deploy.ps1
```

## Important Notes:

1. **Node.js Required**: Node.js must be installed on the IIS server
2. **iisnode Module**: Install iisnode for IIS (download from GitHub)
3. **Permissions**: Ensure IIS_IUSRS has read/execute permissions on the deployment folder
4. **Environment Variables**: Set `NODE_ENV=production` and any other required env vars
5. **Port**: The app will run on the port configured in IIS (default: 80/443)

## What NOT to Copy:

- ❌ `node_modules/` (root) - Not needed, standalone has its own
- ❌ `src/` - Source code not needed in production
- ❌ `.next/` (root) - Only copy `standalone/` and `static/` subfolders
- ❌ `package.json`, `tsconfig.json`, etc. - Not needed for runtime

## Verification:

After deployment, test by accessing:
- `http://your-server/` - Should load the app
- Check IIS logs if there are issues: `C:\inetpub\logs\LogFiles\`
- Check iisnode logs: `C:\inetpub\wwwroot\flowcart-customer\iisnode\`

