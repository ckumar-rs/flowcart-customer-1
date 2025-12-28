# Verify Application is Running from IIS

## ✅ Correct Setup: Application Runs from IIS

Your application **MUST** run from IIS, not from the Next.js dev server.

## 🔍 How to Verify

### Step 1: Check if Next.js Dev Server is Running

If you see `http://localhost:3000/` or `http://localhost:3001/`, you're accessing the dev server, not IIS.

**Stop the dev server:**

```powershell
# Find and stop any running Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Or if you have a terminal running `npm run dev`, press Ctrl+C to stop it
```

### Step 2: Verify IIS Site is Configured

1. **Open IIS Manager:**
   - Press `Win + R`, type `inetmgr`, press Enter

2. **Check if your site exists:**
   - Expand **Sites** in the left panel
   - Look for your site (e.g., `FlowCartCustomer` or `Default Web Site`)

3. **Check the site binding (port):**
   - Select your site
   - Click **Bindings** in the right panel
   - Note the **Port** (usually 80 for HTTP, 443 for HTTPS)

### Step 3: Access via IIS Port

**IIS typically runs on:**
- Port **80** for HTTP: `http://localhost/` or `http://localhost:80/`
- Port **443** for HTTPS: `https://localhost/` or `https://localhost:443/`
- **Custom port** (if configured): `http://localhost:YOUR_PORT/`

**NOT port 3000 or 3001** - those are dev server ports!

### Step 4: Verify Application Pool is Running

1. In IIS Manager, click **Application Pools**
2. Find your Application Pool (e.g., `FlowCartCustomerAppPool`)
3. Check the **Status** column - it should show **Started**
4. If it shows **Stopped**, right-click → **Start**

### Step 5: Check Site Status

1. In IIS Manager, select your **Site**
2. In the right panel, click **Start** if it's stopped
3. The **Status** should be **Started**

## 🚨 Common Issues

### Issue 1: Accessing via Port 3000 (Dev Server)

**Symptom:** `http://localhost:3000/` works but no CSS

**Problem:** You're running the Next.js dev server, not IIS

**Fix:**
1. Stop the dev server (Ctrl+C in terminal or kill Node.js processes)
2. Access via IIS port: `http://localhost/` (port 80) or your configured port

### Issue 2: IIS Site Not Created

**Symptom:** Can't find your site in IIS Manager

**Fix:** Create the site in IIS:
1. Right-click **Sites** → **Add Website**
2. Set:
   - **Site name:** `FlowCartCustomer`
   - **Application pool:** Create new or select existing
   - **Physical path:** `C:\inetpub\wwwroot\flowcart-customer`
   - **Binding:** Port 80 (or your desired port)
3. Click **OK**

### Issue 3: Application Pool Not Started

**Symptom:** Site shows error or won't start

**Fix:**
1. Go to **Application Pools**
2. Right-click your pool → **Start**
3. If it keeps stopping, check the **Event Viewer** for errors

### Issue 4: Wrong Physical Path

**Symptom:** Site exists but shows 404 or error

**Fix:**
1. Select your site in IIS Manager
2. Click **Basic Settings** in the right panel
3. Verify **Physical path** is: `C:\inetpub\wwwroot\flowcart-customer`
4. Click **Test Settings** to verify permissions

## ✅ Quick Verification Script

Run this PowerShell script to check everything:

```powershell
# Check if dev server is running
$devServer = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" }
if ($devServer) {
    Write-Host "⚠️  WARNING: Node.js processes are running (dev server might be active)" -ForegroundColor Yellow
    Write-Host "   Stop them with: Get-Process node | Stop-Process -Force" -ForegroundColor Yellow
} else {
    Write-Host "✓ No dev server running" -ForegroundColor Green
}

# Check IIS site
Import-Module WebAdministration -ErrorAction SilentlyContinue
$site = Get-Website | Where-Object { $_.PhysicalPath -like "*flowcart-customer*" }
if ($site) {
    Write-Host "✓ IIS Site found: $($site.Name)" -ForegroundColor Green
    Write-Host "   Status: $($site.State)" -ForegroundColor $(if ($site.State -eq 'Started') { 'Green' } else { 'Yellow' })
    Write-Host "   Physical Path: $($site.PhysicalPath)" -ForegroundColor Gray
    
    # Get bindings
    $bindings = Get-WebBinding -Name $site.Name
    Write-Host "   Bindings:" -ForegroundColor Gray
    foreach ($binding in $bindings) {
        Write-Host "     - $($binding.protocol)://$($binding.bindingInformation)" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ IIS Site not found!" -ForegroundColor Red
    Write-Host "   Create it in IIS Manager: Sites → Add Website" -ForegroundColor Yellow
}

# Check Application Pool
if ($site) {
    $appPool = Get-IISAppPool -Name $site.applicationPool
    if ($appPool) {
        Write-Host "✓ Application Pool: $($appPool.Name)" -ForegroundColor Green
        Write-Host "   Status: $($appPool.State)" -ForegroundColor $(if ($appPool.State -eq 'Started') { 'Green' } else { 'Yellow' })
    }
}

# Check deployment folder
$deployPath = "C:\inetpub\wwwroot\flowcart-customer"
if (Test-Path $deployPath) {
    Write-Host "✓ Deployment folder exists: $deployPath" -ForegroundColor Green
    
    # Check required files
    $requiredFiles = @(
        ".next\standalone\server.js",
        ".next\static",
        "web.config"
    )
    
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $deployPath $file
        if (Test-Path $fullPath) {
            Write-Host "   ✓ $file exists" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $file MISSING!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ Deployment folder not found: $deployPath" -ForegroundColor Red
}
```

## 📋 Correct Access URLs

After verifying, access your application via:

- **HTTP:** `http://localhost/` (if port 80)
- **HTTP (custom port):** `http://localhost:YOUR_PORT/`
- **HTTPS:** `https://localhost/` (if port 443 and SSL configured)
- **By IP:** `http://YOUR_SERVER_IP/`
- **By domain:** `http://your-domain.com/` (if DNS configured)

**NOT:** `http://localhost:3000/` or `http://localhost:3001/` ❌

## 🎯 Summary

1. ✅ **Application MUST run from IIS** (not dev server)
2. ✅ **Access via IIS port** (usually 80, not 3000)
3. ✅ **Stop dev server** if it's running
4. ✅ **Verify IIS site and Application Pool are started**
5. ✅ **Check physical path and permissions**

