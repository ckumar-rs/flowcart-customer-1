# How to Run IIS Deployment Script

## Problem
If running `.\DEPLOY_TO_IIS.ps1` opens the file in an editor instead of executing it, this is due to PowerShell's execution policy.

## Solutions

### Option 1: Use the Wrapper Script (Easiest)

1. Open PowerShell as **Administrator**
2. Navigate to `web-customer` directory
3. Run:
   ```powershell
   .\RUN_DEPLOYMENT.ps1
   ```

This wrapper script automatically bypasses execution policy.

### Option 2: Bypass Execution Policy for Current Session

1. Open PowerShell as **Administrator**
2. Navigate to `web-customer` directory
3. Run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
   .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
   ```

### Option 3: Run with Bypass Flag

1. Open PowerShell as **Administrator**
2. Navigate to `web-customer` directory
3. Run:
   ```powershell
   powershell.exe -ExecutionPolicy Bypass -File .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
   ```

### Option 4: Change Execution Policy (Permanent)

**⚠️ Warning:** This changes the execution policy for the entire system. Only do this if you understand the security implications.

1. Open PowerShell as **Administrator**
2. Run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
   ```
3. Then run the deployment script normally:
   ```powershell
   .\DEPLOY_TO_IIS.ps1 -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
   ```

## Recommended Approach

**Use Option 1 (Wrapper Script)** - It's the safest and easiest method.

## Verify Script is Executing

When the script runs correctly, you should see:
```
=========================================
FlowCart Web Customer IIS Deployment
=========================================
```

If you see the script content instead, it means PowerShell is opening it as a text file, not executing it.

## Troubleshooting

### Script Still Opens in Editor

1. **Check file association:**
   - Right-click `DEPLOY_TO_IIS.ps1`
   - Select "Open with" → Choose "Windows PowerShell"
   - Or check "Always use this app to open .ps1 files"

2. **Run from PowerShell directly:**
   ```powershell
   & ".\DEPLOY_TO_IIS.ps1" -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
   ```

3. **Use full path:**
   ```powershell
   & "C:\path\to\web-customer\DEPLOY_TO_IIS.ps1" -SiteName "FlowCartCustomer" -PhysicalPath "C:\inetpub\wwwroot\flowcart-customer" -Port 80
   ```

### Check Current Execution Policy

```powershell
Get-ExecutionPolicy -List
```

### Common Execution Policies

- **Restricted** - No scripts can run (default on some systems)
- **RemoteSigned** - Local scripts can run, downloaded scripts need signature
- **Unrestricted** - All scripts can run (not recommended)
- **Bypass** - No restrictions (temporary, per-session)

