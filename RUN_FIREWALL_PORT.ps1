# Wrapper script to run OPEN_FIREWALL_PORT.ps1 with bypass execution policy
# Use this to avoid issues with PowerShell opening the script in an editor.

param(
    [int]$Port = 3001
)

Write-Host "Opening Windows Firewall port $Port..." -ForegroundColor Cyan
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "OPEN_FIREWALL_PORT.ps1") -Port $Port





