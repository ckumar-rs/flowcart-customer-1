# Simple Deployment - No IIS, No iisnode, No Reverse Proxy

The **simplest approach** is to just run Node.js directly. No IIS needed!

## ✅ Option 1: PM2 (Recommended - Easiest)

### Step 1: Install PM2

```powershell
npm install -g pm2
```

### Step 2: Build the Application

```powershell
cd D:\Contirvya-Projects\flowcart\web-customer
npm run build
```

### Step 3: Start with PM2

```powershell
cd .next\standalone

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000/api"  # Update with your API URL
$env:NEXT_PUBLIC_WS_URL = "ws://localhost:5000/hubs"    # Update with your WS URL

# Start the app
pm2 start server.js --name "flowcart-customer" --update-env

# Save PM2 configuration
pm2 save

# Setup PM2 to start on Windows boot
pm2 startup
```

### Step 4: Access Your App

- Open browser: `http://localhost:3001/`
- Or from network: `http://YOUR_SERVER_IP:3001/`

**That's it!** No IIS, no iisnode, no reverse proxy. Just Node.js running.

### PM2 Commands

```powershell
# View running apps
pm2 list

# View logs
pm2 logs flowcart-customer

# Restart app
pm2 restart flowcart-customer

# Stop app
pm2 stop flowcart-customer

# Delete app
pm2 delete flowcart-customer
```

---

## ✅ Option 2: Windows Service (NSSM) - Auto-start on Boot

If you want it to run as a Windows Service (starts automatically on boot):

### Step 1: Download NSSM

1. Download from: https://nssm.cc/download
2. Extract to a folder (e.g., `C:\nssm`)

### Step 2: Create Service

```powershell
cd D:\Contirvya-Projects\flowcart\web-customer\.next\standalone

# Create service
C:\nssm\win64\nssm.exe install FlowCartCustomer "C:\Program Files\nodejs\node.exe" "server.js"

# Set working directory
C:\nssm\win64\nssm.exe set FlowCartCustomer AppDirectory "D:\Contirvya-Projects\flowcart\web-customer\.next\standalone"

# Set environment variables
C:\nssm\win64\nssm.exe set FlowCartCustomer AppEnvironmentExtra "NODE_ENV=production" "PORT=3001" "NEXT_PUBLIC_API_URL=http://localhost:5000/api" "NEXT_PUBLIC_WS_URL=ws://localhost:5000/hubs"

# Start service
C:\nssm\win64\nssm.exe start FlowCartCustomer
```

### Step 3: Access Your App

- Open browser: `http://localhost:3001/`

### Service Commands

```powershell
# Start service
C:\nssm\win64\nssm.exe start FlowCartCustomer

# Stop service
C:\nssm\win64\nssm.exe stop FlowCartCustomer

# Restart service
C:\nssm\win64\nssm.exe restart FlowCartCustomer

# Delete service
C:\nssm\win64\nssm.exe remove FlowCartCustomer confirm
```

---

## ✅ Option 3: Simple PowerShell Script - Just Run It

Create `start-app.ps1`:

```powershell
cd D:\Contirvya-Projects\flowcart\web-customer\.next\standalone

$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000/api"
$env:NEXT_PUBLIC_WS_URL = "ws://localhost:5000/hubs"

Write-Host "Starting FlowCart Customer on http://localhost:3001" -ForegroundColor Green
node server.js
```

Run it:
```powershell
.\start-app.ps1
```

**Note:** This runs in the foreground. Press Ctrl+C to stop. For production, use PM2 or NSSM instead.

---

## ✅ Option 4: Run on Port 80 (Requires Admin)

If you want to run on port 80 (standard HTTP port), you need to run as Administrator:

```powershell
# Run PowerShell as Administrator, then:
cd D:\Contirvya-Projects\flowcart\web-customer\.next\standalone

$env:NODE_ENV = "production"
$env:PORT = "80"
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000/api"
$env:NEXT_PUBLIC_WS_URL = "ws://localhost:5000/hubs"

pm2 start server.js --name "flowcart-customer" --update-env
pm2 save
```

Then access: `http://localhost/` (no port number needed)

---

## 🔥 Recommended: PM2 (Option 1)

**Why PM2?**
- ✅ **Super simple** - Just `pm2 start server.js`
- ✅ **Auto-restart** - Restarts if app crashes
- ✅ **Logs** - Easy log viewing with `pm2 logs`
- ✅ **Start on boot** - `pm2 startup` makes it start automatically
- ✅ **No IIS needed** - Just Node.js
- ✅ **No configuration** - Works out of the box

## 📋 Quick Start (PM2)

```powershell
# 1. Install PM2
npm install -g pm2

# 2. Build app
cd D:\Contirvya-Projects\flowcart\web-customer
npm run build

# 3. Start app
cd .next\standalone
$env:NODE_ENV = "production"
$env:PORT = "3001"
pm2 start server.js --name "flowcart-customer" --update-env
pm2 save
pm2 startup

# 4. Access: http://localhost:3001/
```

**That's it!** No IIS, no iisnode, no reverse proxy, no complications.

---

## 🔧 If You Still Want IIS (But Simpler)

If you **must** use IIS (e.g., for SSL certificates, domain binding), the reverse proxy is actually the simplest IIS approach. But honestly, **just use PM2** - it's way simpler!

---

## ❓ Which Should You Choose?

- **PM2** → Simplest, recommended for most cases
- **NSSM** → If you need Windows Service integration
- **PowerShell Script** → For testing/development only
- **Port 80 with PM2** → If you want standard HTTP port

**My recommendation: Use PM2 (Option 1)** - It's the simplest and most reliable.

