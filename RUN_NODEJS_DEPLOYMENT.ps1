# Wrapper script to run DEPLOY_NODEJS.ps1
# This ensures the script executes instead of opening in an editor

param(
    [string]$AppPath = "C:\inetpub\wwwroot\flowcart-customer",
    [string]$ApiUrl = "http://10.5.0.4/flowcartapi/api",
    [string]$WsUrl = "ws://10.5.0.4/flowcartapi/hubs",
    [int]$Port = 3001,
    [switch]$SkipBuild = $false
)

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetScript = Join-Path $scriptDir "DEPLOY_NODEJS.ps1"

# Build parameters
$params = @{
    AppPath = $AppPath
    ApiUrl = $ApiUrl
    WsUrl = $WsUrl
    Port = $Port
}

if ($SkipBuild) {
    $params['SkipBuild'] = $true
}

# Execute the script with bypass execution policy
& powershell.exe -ExecutionPolicy Bypass -File $targetScript @params

