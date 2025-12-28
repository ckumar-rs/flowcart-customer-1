# Wrapper script to run START_NODE_SERVICE.ps1
# This ensures the script executes instead of opening in an editor

param(
    [string]$AppPath = "C:\inetpub\wwwroot\flowcart-customer"
)

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetScript = Join-Path $scriptDir "START_NODE_SERVICE.ps1"

# Execute the script with bypass execution policy
powershell.exe -ExecutionPolicy Bypass -File $targetScript -AppPath $AppPath

