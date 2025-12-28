# PowerShell script to install all prerequisites for FlowCart IIS deployment
# Run this script as Administrator

param(
    [switch]$SkipNodeJS = $false,
    [switch]$SkipIIS = $false,
    [switch]$SkipURLRewrite = $false,
    [switch]$SkipIISNode = $false
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FlowCart Prerequisites Installation" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Detect OS type
$isWindowsServer = (Get-CimInstance Win32_OperatingSystem).ProductType -eq 3
$osInfo = Get-CimInstance Win32_OperatingSystem
Write-Host "OS: $($osInfo.Caption) $($osInfo.Version)" -ForegroundColor Green
Write-Host "Is Server: $isWindowsServer" -ForegroundColor Green
Write-Host ""

# Function to install IIS
function Install-IIS {
    Write-Host "Installing IIS..." -ForegroundColor Cyan
    try {
        if ($isWindowsServer) {
            Install-WindowsFeature -Name Web-Server -IncludeManagementTools
        } else {
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45 -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools -All -NoRestart
            Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole -All -NoRestart
        }
        Write-Host "IIS installed successfully!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "ERROR: Failed to install IIS: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to install URL Rewrite Module
function Install-URLRewrite {
    Write-Host "Installing URL Rewrite Module..." -ForegroundColor Cyan
    $urlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
    $tempPath = "$env:TEMP\rewrite_amd64_en-US.msi"
    
    try {
        Write-Host "Downloading URL Rewrite Module..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $tempPath -UseBasicParsing
        
        Write-Host "Installing URL Rewrite Module (this may take a moment)..." -ForegroundColor Gray
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$tempPath`" /quiet /norestart" -Wait -PassThru
        
        if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 3010) {
            Write-Host "URL Rewrite Module installed successfully!" -ForegroundColor Green
            Remove-Item $tempPath -ErrorAction SilentlyContinue
            return $true
        } else {
            Write-Host "WARNING: URL Rewrite installation returned exit code: $($process.ExitCode)" -ForegroundColor Yellow
            Write-Host "Please install manually from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
            Remove-Item $tempPath -ErrorAction SilentlyContinue
            return $false
        }
    } catch {
        Write-Host "ERROR: Failed to download/install URL Rewrite: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please install manually from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
        Remove-Item $tempPath -ErrorAction SilentlyContinue
        return $false
    }
}

# Function to install iisnode
function Install-IISNode {
    Write-Host "Installing iisnode..." -ForegroundColor Cyan
    
    # Determine architecture
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $iisnodeUrl = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-$arch.msi"
    $tempPath = "$env:TEMP\iisnode-$arch.msi"
    
    try {
        Write-Host "Downloading iisnode ($arch)..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $iisnodeUrl -OutFile $tempPath -UseBasicParsing
        
        Write-Host "Installing iisnode (this may take a moment)..." -ForegroundColor Gray
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$tempPath`" /quiet /norestart" -Wait -PassThru
        
        if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 3010) {
            Write-Host "iisnode installed successfully!" -ForegroundColor Green
            Remove-Item $tempPath -ErrorAction SilentlyContinue
            return $true
        } else {
            Write-Host "WARNING: iisnode installation returned exit code: $($process.ExitCode)" -ForegroundColor Yellow
            Write-Host "Please install manually from: https://github.com/Azure/iisnode/releases" -ForegroundColor Yellow
            Remove-Item $tempPath -ErrorAction SilentlyContinue
            return $false
        }
    } catch {
        Write-Host "ERROR: Failed to download/install iisnode: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please install manually from: https://github.com/Azure/iisnode/releases" -ForegroundColor Yellow
        Remove-Item $tempPath -ErrorAction SilentlyContinue
        return $false
    }
}

# Function to check/install Node.js
function Install-NodeJS {
    Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
    
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "Node.js is already installed: $nodeVersion" -ForegroundColor Green
        return $true
    }
    
    Write-Host "Node.js is not installed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install Node.js manually:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  2. Install the LTS version (v18 or higher)" -ForegroundColor Yellow
    Write-Host "  3. Make sure to check 'Add to PATH' during installation" -ForegroundColor Yellow
    Write-Host ""
    
    $install = Read-Host "Would you like to open the Node.js download page? (y/n)"
    if ($install -eq "y") {
        Start-Process "https://nodejs.org/"
    }
    
    return $false
}

# Check and install prerequisites
$allInstalled = $true

# 1. Check IIS
if (-not $SkipIIS) {
    $iisInstalled = $false
    if ($isWindowsServer) {
        try {
            $iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
            $iisInstalled = $iisFeature -and $iisFeature.Installed
        } catch {
            $iisInstalled = (Get-Service -Name W3SVC -ErrorAction SilentlyContinue) -ne $null
        }
    } else {
        try {
            $iisFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -ErrorAction SilentlyContinue
            $iisInstalled = $iisFeature -and $iisFeature.State -eq "Enabled"
        } catch {
            $iisInstalled = (Get-Service -Name W3SVC -ErrorAction SilentlyContinue) -ne $null
        }
    }
    
    if (-not $iisInstalled) {
        Write-Host "IIS is not installed." -ForegroundColor Yellow
        $install = Read-Host "Install IIS now? (y/n)"
        if ($install -eq "y") {
            if (-not (Install-IIS)) {
                $allInstalled = $false
            }
        } else {
            $allInstalled = $false
        }
    } else {
        Write-Host "IIS is already installed." -ForegroundColor Green
    }
    Write-Host ""
}

# 2. Check URL Rewrite
if (-not $SkipURLRewrite) {
    $urlRewrite = Get-WebGlobalModule -Name RewriteModule -ErrorAction SilentlyContinue
    if (-not $urlRewrite) {
        Write-Host "URL Rewrite Module is not installed." -ForegroundColor Yellow
        $install = Read-Host "Install URL Rewrite Module now? (y/n)"
        if ($install -eq "y") {
            if (-not (Install-URLRewrite)) {
                $allInstalled = $false
            }
        } else {
            $allInstalled = $false
        }
    } else {
        Write-Host "URL Rewrite Module is already installed." -ForegroundColor Green
    }
    Write-Host ""
}

# 3. Check iisnode
if (-not $SkipIISNode) {
    $iisnodePath = "${env:ProgramFiles}\iisnode"
    if (-not (Test-Path $iisnodePath)) {
        $iisnodePath = "${env:ProgramFiles(x86)}\iisnode"
        if (-not (Test-Path $iisnodePath)) {
            Write-Host "iisnode is not installed." -ForegroundColor Yellow
            $install = Read-Host "Install iisnode now? (y/n)"
            if ($install -eq "y") {
                if (-not (Install-IISNode)) {
                    $allInstalled = $false
                }
            } else {
                $allInstalled = $false
            }
        } else {
            Write-Host "iisnode is already installed (32-bit)." -ForegroundColor Green
        }
    } else {
        Write-Host "iisnode is already installed (64-bit)." -ForegroundColor Green
    }
    Write-Host ""
}

# 4. Check Node.js
if (-not $SkipNodeJS) {
    if (-not (Install-NodeJS)) {
        $allInstalled = $false
    }
    Write-Host ""
}

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
if ($allInstalled) {
    Write-Host "All prerequisites are installed!" -ForegroundColor Green
    Write-Host "You can now run the deployment script:" -ForegroundColor Green
    Write-Host "  .\DEPLOY_TO_IIS.ps1 -SiteName `"FlowCartCustomer`" -PhysicalPath `"C:\inetpub\wwwroot\flowcart-customer`" -Port 80" -ForegroundColor Yellow
} else {
    Write-Host "Some prerequisites are missing." -ForegroundColor Yellow
    Write-Host "Please install the missing components and run this script again." -ForegroundColor Yellow
}
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($allInstalled) {
    $deploy = Read-Host "Run deployment script now? (y/n)"
    if ($deploy -eq "y") {
        Write-Host ""
        Write-Host "Starting deployment..." -ForegroundColor Cyan
        & ".\DEPLOY_TO_IIS.ps1" -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
    }
}

