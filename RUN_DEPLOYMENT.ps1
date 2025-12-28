# Wrapper script to run DEPLOY_TO_IIS.ps1 with proper execution policy
# This script bypasses execution policy for the deployment script

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FlowCart IIS Deployment Wrapper" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$deployScript = Join-Path $scriptPath "DEPLOY_TO_IIS.ps1"

if (-not (Test-Path $deployScript)) {
    Write-Host "ERROR: DEPLOY_TO_IIS.ps1 not found!" -ForegroundColor Red
    Write-Host "Expected location: $deployScript" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Running deployment script with execution policy bypass..." -ForegroundColor Green
Write-Host ""

# Run the deployment script with bypass execution policy
& powershell.exe -ExecutionPolicy Bypass -File $deployScript -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

