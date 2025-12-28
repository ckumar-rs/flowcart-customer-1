# IIS Deployment Guide for FlowCart Web Customer

This guide explains how to deploy the Next.js web-customer application to IIS (Internet Information Services) on Windows Server.

## Prerequisites

1. **Windows Server** with IIS installed
2. **Node.js** (v18 or higher) installed on the server
3. **iisnode** module installed
4. **URL Rewrite Module** for IIS installed

## Step 1: Install Prerequisites

### Install Node.js
1. Download Node.js from https://nodejs.org/
2. Install Node.js (v18 or higher)
3. Verify installation: `node --version`

### Install iisnode
1. Download iisnode from: https://github.com/Azure/iisnode/releases
2. Install the appropriate version (x64 for 64-bit, x86 for 32-bit)
3. Verify installation by checking if `%ProgramFiles%\iisnode\` exists

### Install URL Rewrite Module
1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the module
3. Restart IIS: `iisreset`

## Step 2: Build the Application

On your development machine or build server:

```bash
cd web-customer
npm install
npm run build
```

This creates the `.next` folder with the production build.

## Step 3: Prepare Files for Deployment

Copy the following files and folders to your IIS server:

```
web-customer/
├── .next/              (entire folder - production build)
├── node_modules/       (entire folder - dependencies)
├── public/             (entire folder - static assets)
├── server.js           (custom Node.js server)
├── web.config          (IIS configuration)
├── package.json        (dependencies)
└── package-lock.json   (lock file)
```

**Note:** You can exclude:
- `src/` folder (not needed in production)
- `.git/` folder
- Development files

## Step 4: Configure IIS

### Create Application Pool

1. Open **IIS Manager**
2. Right-click **Application Pools** → **Add Application Pool**
3. Set:
   - **Name:** `FlowCartCustomerAppPool`
   - **.NET CLR version:** No Managed Code
   - **Managed pipeline mode:** Integrated
4. Click **OK**

### Configure Application Pool

1. Select `FlowCartCustomerAppPool`
2. Click **Advanced Settings**
3. Set:
   - **Start Mode:** AlwaysRunning
   - **Idle Timeout:** 0 (or a high value like 1440 minutes)
   - **Regular Time Interval:** 0 (disable recycling)
4. Click **OK**

### Create Website/Application

1. Right-click **Sites** → **Add Website**
2. Set:
   - **Site name:** `FlowCartCustomer`
   - **Application pool:** `FlowCartCustomerAppPool`
   - **Physical path:** `C:\inetpub\wwwroot\flowcart-customer` (or your deployment path)
   - **Binding:**
     - **Type:** http or https
     - **IP address:** All Unassigned
     - **Port:** 80 (or your desired port)
     - **Host name:** (your domain, e.g., `customer.flowcart.com`)
3. Click **OK**

### Set Permissions

1. Right-click your website → **Edit Permissions**
2. Go to **Security** tab
3. Add **IIS_IUSRS** with **Read & Execute** permissions
4. Add **IIS AppPool\FlowCartCustomerAppPool** with **Read & Execute** permissions
5. Click **OK**

## Step 5: Configure Environment Variables

### Option 1: Using web.config (Recommended)

Edit `web.config` and add environment variables in the `<iisnode>` section:

```xml
<iisnode
  nodeProcessCommandLine="node"
  node_env="production"
  ...
>
  <environmentVariables>
    <add name="NODE_ENV" value="production" />
    <add name="PORT" value="3001" />
    <add name="NEXT_PUBLIC_API_URL" value="https://your-api-domain.com/api" />
    <add name="NEXT_PUBLIC_WS_URL" value="wss://your-api-domain.com/hubs" />
  </environmentVariables>
</iisnode>
```

### Option 2: Using Application Pool Environment Variables

1. Select **Application Pool** → **Advanced Settings**
2. Add environment variables in the **Environment Variables** section

## Step 6: Install Dependencies on Server

On the IIS server, navigate to your deployment folder and run:

```powershell
cd C:\inetpub\wwwroot\flowcart-customer
npm install --production
```

This installs only production dependencies.

## Step 7: Test the Application

1. Open a browser and navigate to your website URL
2. Check IIS logs: `C:\inetpub\logs\LogFiles\W3SVC1\`
3. Check iisnode logs: `C:\inetpub\wwwroot\flowcart-customer\iisnode\`

## Troubleshooting

### Application Not Starting

1. **Check iisnode logs:**
   - Location: `C:\inetpub\wwwroot\flowcart-customer\iisnode\`
   - Look for error messages

2. **Check Windows Event Viewer:**
   - Windows Logs → Application
   - Look for iisnode errors

3. **Verify Node.js path:**
   - Ensure Node.js is in the system PATH
   - Or specify full path in `web.config`: `nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"`

4. **Check file permissions:**
   - Ensure IIS_IUSRS has read/execute permissions
   - Ensure Application Pool identity has read/execute permissions

### 502 Bad Gateway

1. **Check if Node.js process is running:**
   - Open Task Manager → Details
   - Look for `node.exe` processes

2. **Check port conflicts:**
   - Ensure port 3001 (or your configured port) is not in use
   - Change port in `web.config` if needed

3. **Check iisnode configuration:**
   - Verify `web.config` is correct
   - Restart IIS: `iisreset`

### Static Files Not Loading

1. **Check public folder permissions:**
   - Ensure `public/` folder is accessible
   - Check `.next/static/` folder permissions

2. **Verify URL Rewrite rules:**
   - Ensure static files are served correctly
   - Check `web.config` rewrite rules

### Environment Variables Not Working

1. **Check web.config:**
   - Verify environment variables are in `<iisnode><environmentVariables>` section
   - Restart IIS after changes

2. **Use Application Pool variables:**
   - Set in Application Pool → Advanced Settings

## Performance Optimization

### Enable Compression

Add to `web.config`:

```xml
<system.webServer>
  <urlCompression doStaticCompression="true" doDynamicCompression="true" />
  <httpCompression>
    <dynamicTypes>
      <add mimeType="application/json" enabled="true" />
      <add mimeType="application/javascript" enabled="true" />
    </dynamicTypes>
  </httpCompression>
</system.webServer>
```

### Enable Caching

Add to `web.config`:

```xml
<system.webServer>
  <staticContent>
    <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
  </staticContent>
</system.webServer>
```

## SSL/HTTPS Configuration

1. Install SSL certificate in IIS
2. Add HTTPS binding to your website
3. Configure redirect from HTTP to HTTPS in `web.config`:

```xml
<rule name="HTTP to HTTPS redirect" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="off" ignoreCase="true" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

## Monitoring

### Enable Logging

iisnode logs are automatically created in:
- `C:\inetpub\wwwroot\flowcart-customer\iisnode\`

### Application Insights (Optional)

Consider integrating Application Insights for monitoring:
1. Create Application Insights resource in Azure
2. Install `applicationinsights` package
3. Configure in `server.js`

## Backup and Recovery

1. **Backup regularly:**
   - Application files
   - `.next` build folder
   - `node_modules` (or use `npm install` to restore)
   - `web.config`

2. **Document configuration:**
   - Application Pool settings
   - Environment variables
   - IIS bindings

## Support

For issues:
1. Check iisnode documentation: https://github.com/Azure/iisnode
2. Check Next.js deployment docs: https://nextjs.org/docs/deployment
3. Review IIS logs and Windows Event Viewer

