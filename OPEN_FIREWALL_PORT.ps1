# PowerShell script to open Windows Firewall port for Node.js application
# This allows external access to the Node.js server

param(
    [int]$Port = 3001,
    [string]$RuleName = "FlowCart-NodeJS-Port-$Port"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Opening Windows Firewall Port" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Port: $Port" -ForegroundColor Cyan
Write-Host "Rule Name: $RuleName" -ForegroundColor Cyan
Write-Host ""

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "Firewall rule already exists. Removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
}

# Create new firewall rule
Write-Host "Creating firewall rule..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName $RuleName `
    -Direction Inbound `
    -LocalPort $Port `
    -Protocol TCP `
    -Action Allow `
    -Description "Allow inbound traffic for FlowCart Node.js application on port $Port" | Out-Null

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "Firewall rule created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Port $Port is now open for external access" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify, check:" -ForegroundColor Cyan
    Write-Host "  Get-NetFirewallRule -DisplayName '$RuleName'" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to create firewall rule!" -ForegroundColor Red
    Write-Host "You may need to manually open the port in Windows Firewall" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Firewall configuration completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""





