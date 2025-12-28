# Quick IIS Setup Guide

## Prerequisites Checklist

- [ ] Windows Server with IIS installed
- [ ] Node.js v18+ installed
- [ ] iisnode installed (https://github.com/Azure/iisnode/releases)
- [ ] URL Rewrite Module for IIS installed (https://www.iis.net/downloads/microsoft/url-rewrite)

## Quick Deployment Steps

### Option 1: Automated PowerShell Script (Recommended)

1. Open PowerShell as **Administrator**
2. Navigate to the `web-customer` directory
3. Run:
   ```powershell
   .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
   ```

### Option 2: Manual Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Copy files to IIS server:**
   - Copy entire `web-customer` folder to `C:\inetpub\wwwroot\flowcart-customer`
   - Include: `.next`, `node_modules`, `public`, `server.js`, `web.config`, `package.json`

3. **Install dependencies on server:**
   ```bash
   cd C:\inetpub\wwwroot\flowcart-customer
   npm install --production
   ```

4. **Create Application Pool in IIS:**
   - Name: `FlowCartCustomerAppPool`
   - .NET CLR version: **No Managed Code**
   - Managed pipeline mode: **Integrated**

5. **Create Website in IIS:**
   - Physical path: `C:\inetpub\wwwroot\flowcart-customer`
   - Application pool: `FlowCartCustomerAppPool`
   - Port: 80 (or your desired port)

6. **Set permissions:**
   - Give `IIS_IUSRS` and `IIS AppPool\FlowCartCustomerAppPool` **Read & Execute** permissions on the folder

7. **Configure environment variables in `web.config`:**
   ```xml
   <environmentVariables>
     <add name="NODE_ENV" value="production" />
     <add name="NEXT_PUBLIC_API_URL" value="https://your-api-domain.com/api" />
     <add name="NEXT_PUBLIC_WS_URL" value="wss://your-api-domain.com/hubs" />
   </environmentVariables>
   ```

8. **Start the Application Pool and Website**

## Verify Deployment

1. Open browser: `http://your-server-ip` or `http://your-domain`
2. Check iisnode logs: `C:\inetpub\wwwroot\flowcart-customer\iisnode\`
3. Check Windows Event Viewer for errors

## Common Issues

### 502 Bad Gateway
- Check if Node.js is in system PATH
- Verify iisnode is installed correctly
- Check iisnode logs for errors

### Static files not loading
- Verify `public` folder permissions
- Check URL Rewrite rules in `web.config`

### Environment variables not working
- Ensure variables are in `<iisnode><environmentVariables>` section
- Restart IIS after changes: `iisreset`

## Files Created

- `server.js` - Custom Node.js server for iisnode
- `web.config` - IIS configuration with iisnode settings
- `DEPLOY_TO_IIS.ps1` - Automated deployment script
- `IIS_DEPLOYMENT.md` - Detailed deployment guide

For detailed instructions, see `IIS_DEPLOYMENT.md`

