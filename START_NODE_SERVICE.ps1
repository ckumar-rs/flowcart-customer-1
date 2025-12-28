# PowerShell script to start Node.js as a Windows Service using PM2
# Alternative to iisnode - runs Node.js standalone
#
# To run this script:
#   Option 1: Use the wrapper script
#     .\RUN_NODE_SERVICE.ps1 -AppPath "C:\inetpub\wwwroot\flowcart-customer"
#
#   Option 2: Run directly with bypass
#     powershell.exe -ExecutionPolicy Bypass -File .\START_NODE_SERVICE.ps1 -AppPath "C:\inetpub\wwwroot\flowcart-customer"
#
#   Option 3: Use call operator
#     & ".\START_NODE_SERVICE.ps1" -AppPath "C:\inetpub\wwwroot\flowcart-customer"

param(
    [string]$AppPath = "C:\inetpub\wwwroot\flowcart-customer"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting Node.js Service for FlowCart" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

# Check if PM2 is installed
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "PM2 is not installed. Installing PM2 globally..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install PM2" -ForegroundColor Red
        exit 1
    }
    Write-Host "PM2 installed successfully" -ForegroundColor Green
}

# Navigate to app directory
Push-Location $AppPath

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:HOSTNAME = "0.0.0.0"  # Listen on all interfaces for external access
$env:NEXT_PUBLIC_API_URL = "http://10.5.0.4/flowcartapi/api"
$env:NEXT_PUBLIC_WS_URL = "ws://10.5.0.4/flowcartapi/hubs"

# Note: Next.js caches NEXT_PUBLIC_* variables at build time
# If the app was already built, you need to rebuild it:
#   npm run build
# Or use the UPDATE_API_URL.ps1 script

Write-Host "Environment variables:" -ForegroundColor Cyan
Write-Host "  NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray
Write-Host "  PORT: $env:PORT" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_API_URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_WS_URL: $env:NEXT_PUBLIC_WS_URL" -ForegroundColor Gray
Write-Host ""

# Start with PM2 (with environment variables)
Write-Host "Starting Node.js application with PM2..." -ForegroundColor Cyan
pm2 start server.js --name "flowcart-customer" --instances 1 --max-memory-restart 500M --update-env

# Save PM2 configuration
pm2 save

# Setup PM2 to start on Windows boot (Windows doesn't support pm2 startup directly)
Write-Host ""
Write-Host "Setting up Windows startup..." -ForegroundColor Cyan
Write-Host "Note: PM2 startup command doesn't work on Windows. Creating a scheduled task instead..." -ForegroundColor Yellow

# Create a scheduled task to start PM2 on boot
$taskName = "FlowCart-NodeJS-Service"
$scriptPath = Join-Path $AppPath "START_PM2.ps1"

# Create a simple script to start PM2
$pm2StartScript = @"
# Auto-generated script to start PM2
cd '$AppPath'
`$env:NODE_ENV = 'production'
`$env:PORT = '3001'
`$env:HOSTNAME = '0.0.0.0'
`$env:NEXT_PUBLIC_API_URL = 'http://10.5.0.4/flowcartapi/api'
`$env:NEXT_PUBLIC_WS_URL = 'ws://10.5.0.4/flowcartapi/hubs'
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
Write-Host "  PM2 will automatically start on Windows boot" -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Node.js service started successfully!" -ForegroundColor Green
Write-Host "Application running on:" -ForegroundColor Green
Write-Host "  Local: http://localhost:3001" -ForegroundColor Gray
Write-Host "  Network: http://[your-ip]:3001" -ForegroundColor Gray
Write-Host "  Public: http://20.42.90.94:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Ensure Windows Firewall allows port 3001" -ForegroundColor Yellow
Write-Host "  Run: .\OPEN_FIREWALL_PORT.ps1 -Port 3001" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Useful PM2 commands:" -ForegroundColor Cyan
Write-Host "  pm2 list              - List all processes" -ForegroundColor Gray
Write-Host "  pm2 logs flowcart-customer - View logs" -ForegroundColor Gray
Write-Host "  pm2 restart flowcart-customer - Restart app" -ForegroundColor Gray
Write-Host "  pm2 stop flowcart-customer - Stop app" -ForegroundColor Gray
Write-Host "  pm2 delete flowcart-customer - Remove from PM2" -ForegroundColor Gray

Pop-Location

