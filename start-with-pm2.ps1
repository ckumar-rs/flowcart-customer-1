# Simple PM2 Deployment Script for FlowCart Customer
# This is the SIMPLEST way to deploy - no IIS, no iisnode, no reverse proxy!

param(
    [int]$Port = 3001,
    [string]$ApiUrl = "http://localhost:5000/api",
    [string]$WsUrl = "ws://localhost:5000/hubs"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FlowCart Customer - Simple PM2 Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PM2 is installed
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    Write-Host "PM2 is not installed. Installing..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install PM2!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ PM2 installed successfully" -ForegroundColor Green
}

# Navigate to project directory
$projectRoot = Split-Path -Parent $PSScriptRoot
$standalonePath = Join-Path $projectRoot ".next\standalone"

if (-not (Test-Path $standalonePath)) {
    Write-Host "ERROR: Standalone build not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Building application..." -ForegroundColor Cyan
Push-Location $projectRoot
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✓ Build completed" -ForegroundColor Green
Write-Host ""

# Check if app is already running
$existingApp = pm2 list | Select-String "flowcart-customer"
if ($existingApp) {
    Write-Host "Stopping existing flowcart-customer app..." -ForegroundColor Yellow
    pm2 delete flowcart-customer 2>&1 | Out-Null
}

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = $Port.ToString()
$env:NEXT_PUBLIC_API_URL = $ApiUrl
$env:NEXT_PUBLIC_WS_URL = $WsUrl

Write-Host "Starting application with PM2..." -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "  WS URL: $WsUrl" -ForegroundColor Gray
Write-Host ""

Push-Location $standalonePath
pm2 start server.js --name "flowcart-customer" --update-env
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start with PM2!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Save PM2 configuration
pm2 save

Write-Host ""
Write-Host "✓ Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  http://localhost:$Port/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful PM2 commands:" -ForegroundColor Yellow
Write-Host "  pm2 list              - View running apps" -ForegroundColor Gray
Write-Host "  pm2 logs flowcart-customer - View logs" -ForegroundColor Gray
Write-Host "  pm2 restart flowcart-customer - Restart app" -ForegroundColor Gray
Write-Host "  pm2 stop flowcart-customer - Stop app" -ForegroundColor Gray
Write-Host ""
Write-Host "To start on Windows boot, run:" -ForegroundColor Yellow
Write-Host "  pm2 startup" -ForegroundColor Cyan
Write-Host ""

