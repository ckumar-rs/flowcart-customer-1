# PowerShell script to update API URL and restart the application
# This script rebuilds the Next.js app with new environment variables

param(
    [string]$AppPath = "C:\inetpub\wwwroot\flowcart-customer",
    [string]$ApiUrl = "http://10.5.0.4/flowcartapi/api",
    [string]$WsUrl = "ws://10.5.0.4/flowcartapi/hubs"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Updating API URL Configuration" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "New WS URL: $WsUrl" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

# Navigate to app directory
Push-Location $AppPath

# Stop PM2 process
Write-Host "Stopping PM2 process..." -ForegroundColor Cyan
pm2 stop flowcart-customer 2>$null
pm2 delete flowcart-customer 2>$null

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = $ApiUrl
$env:NEXT_PUBLIC_WS_URL = $WsUrl

Write-Host ""
Write-Host "Environment variables set:" -ForegroundColor Cyan
Write-Host "  NEXT_PUBLIC_API_URL: $env:NEXT_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host "  NEXT_PUBLIC_WS_URL: $env:NEXT_PUBLIC_WS_URL" -ForegroundColor Gray
Write-Host ""

# Rebuild Next.js app with new environment variables
Write-Host "Rebuilding Next.js application with new API URL..." -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

# Set environment variables for the build process
$env:NEXT_PUBLIC_API_URL = $ApiUrl
$env:NEXT_PUBLIC_WS_URL = $WsUrl

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Start with PM2
Write-Host "Starting application with PM2..." -ForegroundColor Cyan
pm2 start server.js --name "flowcart-customer" --instances 1 --max-memory-restart 500M --update-env

# Save PM2 configuration
pm2 save

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "API URL updated successfully!" -ForegroundColor Green
Write-Host "Application restarted with new API URL" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verify the API URL is correct:" -ForegroundColor Cyan
Write-Host "  pm2 env flowcart-customer" -ForegroundColor Gray
Write-Host "  pm2 logs flowcart-customer" -ForegroundColor Gray

Pop-Location

