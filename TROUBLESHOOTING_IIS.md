# Troubleshooting IIS 500 Errors

## Where to Check for Errors

### 1. iisnode Logs (Most Important)
Location: `C:\inetpub\wwwroot\flowcart-customer\iisnode\`

Check these files:
- `iisnode.log` - Main error log
- `stderr-*.txt` - Standard error output
- `stdout-*.txt` - Standard output

**Quick PowerShell command:**
```powershell
Get-Content "C:\inetpub\wwwroot\flowcart-customer\iisnode\iisnode.log" -Tail 50
```

### 2. IIS Logs
Location: `C:\inetpub\logs\LogFiles\W3SVC{site-id}\`

### 3. Windows Event Viewer
- Open Event Viewer
- Navigate to: Windows Logs → Application
- Look for errors from "iisnode" or "Node.js"

### 4. Browser Developer Tools
- Open browser DevTools (F12)
- Check Console and Network tabs
- Look for detailed error messages

## Common Issues and Solutions

### Issue 1: "Cannot find module" or "Module not found"

**Symptoms:**
- Error in iisnode.log about missing modules
- Node.js can't find dependencies

**Solution:**
1. Ensure `.next/standalone/node_modules/` exists
2. Verify all dependencies are in standalone build
3. Check if `package.json` dependencies are installed

**Fix:**
```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone
npm install --production
```

### Issue 2: "Port already in use" or "EADDRINUSE"

**Symptoms:**
- Server can't start
- Port conflict error

**Solution:**
- Check if another process is using the port
- Change IIS binding to a different port
- Or kill the process using the port

### Issue 3: "ENOENT: no such file or directory"

**Symptoms:**
- File not found errors
- Path issues

**Solution:**
1. Verify all files are copied correctly:
   - `.next/standalone/` exists
   - `.next/static/` exists
   - `web.config` exists
2. Check file permissions (IIS_IUSRS needs read/execute)
3. Verify paths in `web.config` are correct

### Issue 4: "Access Denied" or Permission Errors

**Symptoms:**
- Permission denied errors
- Can't read/write files

**Solution:**
1. Right-click deployment folder → Properties → Security
2. Add `IIS_IUSRS` with:
   - Read & Execute
   - List folder contents
   - Read
3. For Application Pool identity, add that user too

**PowerShell fix:**
```powershell
$folder = "C:\inetpub\wwwroot\flowcart-customer"
icacls $folder /grant "IIS_IUSRS:(OI)(CI)(RX)" /T
```

### Issue 5: Node.js Version Mismatch

**Symptoms:**
- Module compatibility errors
- "Unsupported engine" warnings

**Solution:**
1. Check Node.js version: `node --version`
2. Should be Node.js 18+ for Next.js 14
3. Update Node.js if needed

### Issue 6: Environment Variables Missing

**Symptoms:**
- API calls failing
- Configuration errors

**Solution:**
1. Set environment variables in IIS:
   - Application Pool → Advanced Settings → Environment Variables
   - Or in `web.config` (not recommended for secrets)
2. Required variables:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL` (if needed)
   - `NEXT_PUBLIC_WS_URL` (if needed)

### Issue 7: Static Files Not Loading

**Symptoms:**
- CSS/JS files return 404
- Images not loading

**Solution:**
1. Verify `.next/static/` folder is copied
2. Check rewrite rules in `web.config`
3. Ensure static files are accessible

## Quick Diagnostic Commands

### Test if Node.js works:
```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone
node server.js
```

### Check if iisnode is installed:
```powershell
Test-Path "C:\Program Files\iisnode\iisnode.dll"
```

### View recent errors:
```powershell
# iisnode logs
Get-Content "C:\inetpub\wwwroot\flowcart-customer\iisnode\iisnode.log" -Tail 100

# stderr
Get-ChildItem "C:\inetpub\wwwroot\flowcart-customer\iisnode\stderr-*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50
```

### Check Application Pool status:
```powershell
Import-Module WebAdministration
Get-WebAppPoolState -Name "FlowCartCustomerAppPool"
```

### Restart Application Pool:
```powershell
Restart-WebAppPool -Name "FlowCartCustomerAppPool"
```

## Enable More Verbose Logging

Add to `web.config` `<iisnode>` section:
```xml
loggingEnabled="true"
logDirectory="iisnode"
devErrorsEnabled="true"
debuggingEnabled="true"
```

## Test the Standalone Server Directly

To isolate if the issue is with iisnode or the app itself:

```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone
$env:NODE_ENV="production"
node server.js
```

If this works, the issue is with iisnode configuration.
If this fails, the issue is with the Next.js app itself.

## Still Having Issues?

1. **Check iisnode.log** - This is the most important log file
2. **Check stderr files** - Contains Node.js error output
3. **Verify file structure** - Ensure all required files are present
4. **Test standalone server** - Run `node server.js` directly
5. **Check permissions** - Ensure IIS_IUSRS has proper access
6. **Verify Node.js version** - Should be 18+ for Next.js 14

