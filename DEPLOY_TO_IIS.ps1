# PowerShell script to deploy FlowCart Web Customer to IIS
# Run this script as Administrator
#
# To run this script:
#   1. Open PowerShell as Administrator
#   2. Navigate to web-customer directory
#   3. Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
#   4. Run: .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
#
# Or run directly with bypass:
#   powershell.exe -ExecutionPolicy Bypass -File .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80

param(
    [string]$SiteName = "FlowCartCustomer",
    [string]$AppPoolName = "FlowCartCustomerAppPool",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\flowcart-customer",
    [int]$Port = 80,
    [string]$HostName = ""
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FlowCart Web Customer IIS Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if IIS is installed
# Different methods for Windows Server vs Windows Client
$isWindowsServer = (Get-CimInstance Win32_OperatingSystem).ProductType -eq 3
$iisInstalled = $false

if ($isWindowsServer) {
    # Windows Server - use Get-WindowsFeature
    try {
        $iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
        if ($iisFeature) {
            $iisInstalled = $iisFeature.Installed
        }
    } catch {
        # If Get-WindowsFeature is not available, try alternative method
        $iisInstalled = (Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -ErrorAction SilentlyContinue).State -eq "Enabled"
    }
} else {
    # Windows Client (10/11) - use Get-WindowsOptionalFeature
    try {
        $iisFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -ErrorAction SilentlyContinue
        if ($iisFeature) {
            $iisInstalled = $iisFeature.State -eq "Enabled"
        }
    } catch {
        # Fallback: Check if IIS service exists
        $iisInstalled = (Get-Service -Name W3SVC -ErrorAction SilentlyContinue) -ne $null
    }
}

if (-not $iisInstalled) {
    Write-Host "ERROR: IIS is not installed!" -ForegroundColor Red
    Write-Host "Please install IIS first:" -ForegroundColor Yellow
    if ($isWindowsServer) {
        Write-Host "  Install-WindowsFeature -Name Web-Server -IncludeManagementTools" -ForegroundColor Yellow
    } else {
        Write-Host "  Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole" -ForegroundColor Yellow
        Write-Host "  Or use: Control Panel > Programs > Turn Windows features on or off > Internet Information Services" -ForegroundColor Yellow
    }
    exit 1
}
Write-Host "IIS is installed" -ForegroundColor Green

# Check if URL Rewrite is installed
$urlRewrite = $null
try {
    $urlRewrite = Get-WebGlobalModule -Name RewriteModule -ErrorAction SilentlyContinue
} catch {
    # Module might not be loaded, try checking registry or file system
    $rewriteDll = "${env:ProgramFiles}\IIS\Rewrite\rewrite.dll"
    if (-not (Test-Path $rewriteDll)) {
        $rewriteDll = "${env:ProgramFiles(x86)}\IIS\Rewrite\rewrite.dll"
    }
    if (Test-Path $rewriteDll) {
        $urlRewrite = @{ Name = "RewriteModule" }
    }
}

if (-not $urlRewrite) {
    Write-Host "WARNING: URL Rewrite Module is not installed!" -ForegroundColor Yellow
    Write-Host "Please install from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "URL Rewrite Module is installed" -ForegroundColor Green
}

# Check if iisnode is installed
$iisnodePath = "${env:ProgramFiles}\iisnode"
if (-not (Test-Path $iisnodePath)) {
    # Also check Program Files (x86) for 32-bit installations
    $iisnodePath = "${env:ProgramFiles(x86)}\iisnode"
    if (-not (Test-Path $iisnodePath)) {
        Write-Host "WARNING: iisnode is not installed!" -ForegroundColor Yellow
        Write-Host "Please install from: https://github.com/Azure/iisnode/releases" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    } else {
        Write-Host "iisnode is installed (32-bit)" -ForegroundColor Green
    }
} else {
    Write-Host "iisnode is installed (64-bit)" -ForegroundColor Green
}

# Register iisnode schema if not already registered
Write-Host "Checking iisnode schema registration..." -ForegroundColor Cyan
$appHostConfig = "$env:SystemRoot\System32\inetsrv\config\applicationhost.config"
$schemaFile = "$env:SystemRoot\System32\inetsrv\config\schema\iisnode_schema.xml"

if (Test-Path $schemaFile) {
    $configContent = Get-Content $appHostConfig -Raw -ErrorAction SilentlyContinue
    if ($configContent -and $configContent -notmatch '<section name="iisnode"') {
        Write-Host "  Schema file exists but not registered in applicationhost.config" -ForegroundColor Yellow
        Write-Host "  Registering iisnode schema..." -ForegroundColor Gray
        
        try {
            # Find the configSections/system.webServer section and add iisnode
            if ($configContent -match '(<sectionGroup name="system\.webServer">)(.*?)(</sectionGroup>)') {
                $sectionGroup = $matches[1]
                $sections = $matches[2]
                $closingTag = $matches[3]
                
                if ($sections -notmatch 'iisnode') {
                    $newSection = "`n        <section name=`"iisnode`" overrideModeDefault=`"Allow`" />"
                    $newSections = $sections + $newSection
                    $newConfigContent = $configContent -replace '(<sectionGroup name="system\.webServer">)(.*?)(</sectionGroup>)', "$sectionGroup$newSections$closingTag"
                    
                    # Backup original config
                    $backupFile = "$appHostConfig.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
                    Copy-Item $appHostConfig $backupFile -Force
                    Write-Host "  Backup created: $backupFile" -ForegroundColor Gray
                    
                    # Write new config
                    Set-Content -Path $appHostConfig -Value $newConfigContent -Force -Encoding UTF8
                    Write-Host "  iisnode schema registered successfully" -ForegroundColor Green
                    Write-Host "  IIS restart required for changes to take effect" -ForegroundColor Yellow
                } else {
                    Write-Host "  iisnode schema already registered" -ForegroundColor Green
                }
            } else {
                Write-Host "  WARNING: Could not find system.webServer section in applicationhost.config" -ForegroundColor Yellow
                Write-Host "  You may need to manually register the schema" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ERROR: Failed to register schema: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  You may need to manually register the schema" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  iisnode schema already registered" -ForegroundColor Green
    }
} else {
    Write-Host "  WARNING: iisnode schema file not found at: $schemaFile" -ForegroundColor Yellow
    Write-Host "  Schema registration skipped. iisnode may not work correctly." -ForegroundColor Yellow
}

# Check if Node.js is installed
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {
    # Try to find Node.js in common locations
    $nodePaths = @(
        "${env:ProgramFiles}\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    
    foreach ($nodePath in $nodePaths) {
        if (Test-Path $nodePath) {
            $env:Path = "$(Split-Path $nodePath);$env:Path"
            $nodeVersion = & $nodePath --version 2>$null
            if ($nodeVersion) {
                Write-Host "Found Node.js at: $nodePath" -ForegroundColor Gray
                break
            }
        }
    }
}

if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run the prerequisites installer:" -ForegroundColor Yellow
    Write-Host "  .\INSTALL_PREREQUISITES.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if current directory has package.json
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found in current directory!" -ForegroundColor Red
    Write-Host "Please run this script from the web-customer directory" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host ""
Write-Host "OS Information:" -ForegroundColor Cyan
$osInfo = Get-CimInstance Win32_OperatingSystem
Write-Host "  OS: $($osInfo.Caption)" -ForegroundColor Gray
Write-Host "  Version: $($osInfo.Version)" -ForegroundColor Gray
Write-Host "  Is Server: $isWindowsServer" -ForegroundColor Gray
Write-Host ""
Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  Site Name: $SiteName"
Write-Host "  App Pool: $AppPoolName"
Write-Host "  Physical Path: $PhysicalPath"
Write-Host "  Port: $Port"
if ($HostName) {
    Write-Host "  Host Name: $HostName"
}
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Creating deployment directory..." -ForegroundColor Cyan
if (-not (Test-Path $PhysicalPath)) {
    New-Item -ItemType Directory -Path $PhysicalPath -Force | Out-Null
    Write-Host "  Created directory: $PhysicalPath" -ForegroundColor Green
} else {
    Write-Host "  Directory exists: $PhysicalPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "  node_modules not found, installing dependencies..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  Dependencies already installed, skipping..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 3: Building application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Build completed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Copying files..." -ForegroundColor Cyan
$filesToCopy = @(
    ".next",
    "node_modules",
    "public",
    "server.js",
    "web.config",
    "package.json",
    "package-lock.json"
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Write-Host "  Copying $item..." -ForegroundColor Gray
        Copy-Item -Path $item -Destination $PhysicalPath -Recurse -Force | Out-Null
    } else {
        Write-Host "  WARNING: $item not found!" -ForegroundColor Yellow
    }
}
Write-Host "  Files copied successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Installing production dependencies..." -ForegroundColor Cyan
Push-Location $PhysicalPath
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Creating Application Pool..." -ForegroundColor Cyan
$appPool = Get-IISAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
if ($appPool) {
    Write-Host "  App Pool already exists, removing..." -ForegroundColor Yellow
    Remove-WebAppPool -Name $AppPoolName
}
New-WebAppPool -Name $AppPoolName
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name startMode -Value "AlwaysRunning"
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
Write-Host "  Application Pool created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 7: Creating Website..." -ForegroundColor Cyan
$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($site) {
    Write-Host "  Website already exists, removing..." -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

if ($HostName) {
    New-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port $Port -HostHeader $HostName -ApplicationPool $AppPoolName
} else {
    New-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port $Port -ApplicationPool $AppPoolName
}
Write-Host "  Website created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 8: Setting permissions..." -ForegroundColor Cyan
$acl = Get-Acl $PhysicalPath
$permission = "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
$permission = "IIS AppPool\$AppPoolName", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $PhysicalPath $acl
Write-Host "  Permissions set" -ForegroundColor Green

Write-Host ""
Write-Host "Step 9: Starting Application Pool..." -ForegroundColor Cyan
Start-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 2
Write-Host "  Application Pool started" -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Website URL:" -ForegroundColor Cyan
if ($HostName) {
    Write-Host "  http://$HostName`:$Port" -ForegroundColor White
} else {
    Write-Host "  http://localhost:$Port" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure environment variables in web.config" -ForegroundColor White
Write-Host "  2. Test the website in a browser" -ForegroundColor White
Write-Host "  3. Check iisnode logs: $PhysicalPath\iisnode\" -ForegroundColor White
Write-Host ""

