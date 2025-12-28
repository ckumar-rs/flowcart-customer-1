# Alternative Deployment: Reverse Proxy (No iisnode)

This approach avoids iisnode schema registration issues by running Node.js as a standalone service and using IIS as a reverse proxy.

## Option 1: PM2 + IIS Reverse Proxy (Recommended)

### Prerequisites
1. **Node.js** v18+ installed
2. **PM2** installed globally: `npm install -g pm2`
3. **IIS** with **URL Rewrite Module** installed
4. **ARR (Application Request Routing)** installed (for reverse proxy)

### Step 1: Install ARR (Application Request Routing)

1. Download ARR from: https://www.iis.net/downloads/microsoft/application-request-routing
2. Install the MSI package
3. Restart IIS: `iisreset`

### Step 2: Enable Proxy in ARR

1. Open **IIS Manager**
2. Select your **server** (not a site)
3. Double-click **Application Request Routing Cache**
4. Click **Server Proxy Settings** in the right panel
5. Check **Enable proxy**
6. Click **Apply**

### Step 3: Start Node.js with PM2

**Option 1: Use the wrapper script (Recommended)**
```powershell
.\RUN_NODE_SERVICE.ps1 -AppPath "C:\inetpub\wwwroot\flowcart-customer"
```

**Option 2: Run directly with bypass**
```powershell
powershell.exe -ExecutionPolicy Bypass -File .\START_NODE_SERVICE.ps1 -AppPath "C:\inetpub\wwwroot\flowcart-customer"
```

**Option 3: Use call operator**
```powershell
& ".\START_NODE_SERVICE.ps1" -AppPath "C:\inetpub\wwwroot\flowcart-customer"
```

**Option 4: Manual setup**
```powershell
cd C:\inetpub\wwwroot\flowcart-customer
$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:NEXT_PUBLIC_API_URL = "http://10.5.0.4/flowcartapi/api"
$env:NEXT_PUBLIC_WS_URL = "ws://10.5.0.4/flowcartapi/hubs"
pm2 start server.js --name "flowcart-customer" --update-env
pm2 save
```

### Step 4: Configure IIS

The `web.config` is already configured for reverse proxy. Just ensure:
- IIS site points to your deployment folder
- Application Pool is running
- Node.js is running on port 3001

### Step 5: Test

Access your site through IIS (port 80), and it will proxy to Node.js on port 3001.

## Option 2: Windows Service (node-windows)

### Install node-windows
```powershell
npm install -g node-windows
```

### Create Service
```powershell
cd C:\inetpub\wwwroot\flowcart-customer
node-windows-install
```

This creates a Windows Service that starts Node.js automatically.

## Option 3: Simple Standalone (No IIS)

Just run Node.js directly:
```powershell
cd C:\inetpub\wwwroot\flowcart-customer
$env:NODE_ENV = "production"
$env:PORT = "80"
node server.js
```

Then access directly on port 80 (requires running as Administrator or using a different port).

## Benefits of Reverse Proxy Approach

1. ✅ No iisnode schema registration needed
2. ✅ Better performance (Node.js runs standalone)
3. ✅ Easier debugging (direct access to Node.js logs)
4. ✅ Can use PM2 for process management
5. ✅ Can scale horizontally (multiple Node.js instances)

## Troubleshooting

### Node.js not starting
- Check if port 3001 is available: `netstat -ano | findstr :3001`
- Check PM2 logs: `pm2 logs flowcart-customer`
- Verify Node.js is in PATH

### 502 Bad Gateway
- Ensure Node.js is running: `pm2 list`
- Check ARR proxy is enabled
- Verify web.config rewrite rules

### Static files not loading
- Check file permissions
- Verify static file rule in web.config is working

