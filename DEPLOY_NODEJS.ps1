# PowerShell script to deploy FlowCart Web Customer with Node.js and PM2
# This script builds and deploys the Next.js application with the configured API URL
#
# Usage:
#   powershell.exe -ExecutionPolicy Bypass -File .\DEPLOY_NODEJS.ps1 -AppPath "C:\inetpub\wwwroot\flowcart-customer"
#
# Or with custom API URL:
#   powershell.exe -ExecutionPolicy Bypass -File .\DEPLOY_NODEJS.ps1 -AppPath "C:\inetpub\wwwroot\flowcart-customer" -ApiUrl "http://10.5.0.4/flowcartapi/api"

param(
    [string]$AppPath = "C:\inetpub\wwwroot\flowcart-customer",
    [string]$ApiUrl = "http://10.5.0.4/flowcartapi/api",
    [string]$WsUrl = "ws://10.5.0.4/flowcartapi/hubs",
    [int]$Port = 3001,
    [switch]$SkipBuild = $false
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FlowCart Node.js Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  Application Path: $AppPath" -ForegroundColor Gray
Write-Host "  API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "  WebSocket URL: $WsUrl" -ForegroundColor Gray
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host ""

# Check if Node.js is installed
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed or not in PATH!" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if PM2 is installed
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host ""
    Write-Host "PM2 is not installed. Installing PM2 globally..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install PM2" -ForegroundColor Red
        exit 1
    }
    Write-Host "PM2 installed successfully" -ForegroundColor Green
} else {
    Write-Host "PM2 is installed" -ForegroundColor Green
}

# Check if current directory has package.json (for building)
$sourceDir = $PSScriptRoot
if (-not (Test-Path (Join-Path $sourceDir "package.json"))) {
    Write-Host "WARNING: package.json not found in current directory ($sourceDir)" -ForegroundColor Yellow
    Write-Host "Assuming we're deploying from the built application..." -ForegroundColor Yellow
}

# Create deployment directory if it doesn't exist
Write-Host ""
Write-Host "Step 1: Preparing deployment directory..." -ForegroundColor Cyan
if (-not (Test-Path $AppPath)) {
    New-Item -ItemType Directory -Path $AppPath -Force | Out-Null
    Write-Host "  Created directory: $AppPath" -ForegroundColor Green
} else {
    Write-Host "  Directory exists: $AppPath" -ForegroundColor Yellow
}

# Build the application (if not skipping)
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "Step 2: Building Next.js application..." -ForegroundColor Cyan
    
    # Set environment variables for build
    $env:NEXT_PUBLIC_API_URL = $ApiUrl
    $env:NEXT_PUBLIC_WS_URL = $WsUrl
    $env:NODE_ENV = "production"
    
    Write-Host "  Building with API URL: $ApiUrl" -ForegroundColor Gray
    
    Push-Location $sourceDir
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: npm install failed!" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    
    # Build the application
    Write-Host "  Running npm run build..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Build failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "  Build completed successfully" -ForegroundColor Green
    Pop-Location
} else {
    Write-Host ""
    Write-Host "Step 2: Skipping build (using existing build)" -ForegroundColor Yellow
}

# Copy files to deployment directory
Write-Host ""
Write-Host "Step 3: Copying files to deployment directory..." -ForegroundColor Cyan

$filesToCopy = @(
    ".next",
    "public",
    "server.js",
    "package.json",
    "package-lock.json"
)

foreach ($item in $filesToCopy) {
    $sourcePath = Join-Path $sourceDir $item
    $destinationPath = Join-Path $AppPath $item
    
    if (Test-Path $sourcePath) {
        Write-Host "  Copying $item..." -ForegroundColor Gray
        if (Test-Path $destinationPath -PathType Container) {
            Remove-Item $destinationPath -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force | Out-Null
    } else {
        Write-Host "  WARNING: $item not found at $sourcePath" -ForegroundColor Yellow
    }
}

Write-Host "  Files copied successfully" -ForegroundColor Green

# Install production dependencies in deployment directory
Write-Host ""
Write-Host "Step 4: Installing production dependencies..." -ForegroundColor Cyan
Push-Location $AppPath
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install --production failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Dependencies installed" -ForegroundColor Green

# Stop existing PM2 process if running
Write-Host ""
Write-Host "Step 5: Managing PM2 process..." -ForegroundColor Cyan
$existingProcess = pm2 list | Select-String "flowcart-customer"
if ($existingProcess) {
    Write-Host "  Stopping existing process..." -ForegroundColor Gray
    pm2 stop flowcart-customer 2>$null
    pm2 delete flowcart-customer 2>$null
    Write-Host "  Existing process stopped" -ForegroundColor Green
}

# Set environment variables for PM2
$env:NODE_ENV = "production"
$env:PORT = $Port.ToString()
$env:HOSTNAME = "0.0.0.0"  # Listen on all interfaces for external access
$env:NEXT_PUBLIC_API_URL = $ApiUrl
$env:NEXT_PUBLIC_WS_URL = $WsUrl

Write-Host ""
Write-Host "Step 6: Starting application with PM2..." -ForegroundColor Cyan
Write-Host "  Environment variables:" -ForegroundColor Gray
Write-Host "    NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray
Write-Host "    PORT: $env:PORT" -ForegroundColor Gray
Write-Host "    HOSTNAME: $env:HOSTNAME (listening on all interfaces)" -ForegroundColor Gray
Write-Host "    NEXT_PUBLIC_API_URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host "    NEXT_PUBLIC_WS_URL: $env:NEXT_PUBLIC_WS_URL" -ForegroundColor Gray
Write-Host ""

Push-Location $AppPath
pm2 start server.js --name "flowcart-customer" --instances 1 --max-memory-restart 500M --update-env

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to start PM2 process!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Save PM2 configuration
pm2 save
Pop-Location

Write-Host "  Application started successfully" -ForegroundColor Green

# Setup Windows startup task
Write-Host ""
Write-Host "Step 7: Setting up Windows startup task..." -ForegroundColor Cyan

$taskName = "FlowCart-NodeJS-Service"
$scriptPath = Join-Path $AppPath "START_PM2.ps1"

# Create startup script
$pm2StartScript = @"
# Auto-generated script to start PM2
cd '$AppPath'
`$env:NODE_ENV = 'production'
`$env:PORT = '$Port'
`$env:HOSTNAME = '0.0.0.0'
`$env:NEXT_PUBLIC_API_URL = '$ApiUrl'
`$env:NEXT_PUBLIC_WS_URL = '$WsUrl'
pm2 resurrect
"@

Set-Content -Path $scriptPath -Value $pm2StartScript -Force

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create new scheduled task
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Starts FlowCart Node.js service on Windows boot" | Out-Null

Write-Host "  Scheduled task created: $taskName" -ForegroundColor Green

# Open Windows Firewall port
Write-Host ""
Write-Host "Step 8: Configuring Windows Firewall..." -ForegroundColor Cyan
$firewallRuleName = "FlowCart-NodeJS-Port-$Port"
$existingRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "  Firewall rule already exists" -ForegroundColor Green
} else {
    try {
        New-NetFirewallRule -DisplayName $firewallRuleName `
            -Direction Inbound `
            -LocalPort $Port `
            -Protocol TCP `
            -Action Allow `
            -Description "Allow inbound traffic for FlowCart Node.js application on port $Port" | Out-Null
        Write-Host "  Firewall port $Port opened successfully" -ForegroundColor Green
    } catch {
        Write-Host "  WARNING: Failed to open firewall port. You may need to open it manually." -ForegroundColor Yellow
        Write-Host "  Run: .\OPEN_FIREWALL_PORT.ps1 -Port $Port" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application Information:" -ForegroundColor Cyan
Write-Host "  Local URL: http://localhost:$Port" -ForegroundColor Gray
Write-Host "  Network URL: http://[your-ip]:$Port" -ForegroundColor Gray
Write-Host "  Public IP: 20.42.90.94" -ForegroundColor Gray
Write-Host "  Public URL: http://20.42.90.94:$Port" -ForegroundColor Yellow
Write-Host "  API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "  WebSocket URL: $WsUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "PM2 Commands:" -ForegroundColor Cyan
Write-Host "  pm2 list                    - List all processes" -ForegroundColor Gray
Write-Host "  pm2 logs flowcart-customer - View logs" -ForegroundColor Gray
Write-Host "  pm2 restart flowcart-customer - Restart app" -ForegroundColor Gray
Write-Host "  pm2 stop flowcart-customer - Stop app" -ForegroundColor Gray
Write-Host "  pm2 delete flowcart-customer - Remove from PM2" -ForegroundColor Gray
Write-Host "  pm2 env flowcart-customer - View environment variables" -ForegroundColor Gray
Write-Host ""
Write-Host "To update API URL, run:" -ForegroundColor Cyan
Write-Host "  powershell.exe -ExecutionPolicy Bypass -File .\UPDATE_API_URL.ps1 -AppPath `"$AppPath`"" -ForegroundColor Gray
Write-Host ""

