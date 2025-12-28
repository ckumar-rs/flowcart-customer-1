# Fix: Missing 'next' Module in Standalone Build

## Problem
The standalone build is missing the `next` module, causing the error:
```
Error: Cannot find module 'next'
```

## Solution

### Option 1: Rebuild the Application (Recommended)

The standalone build should include all dependencies automatically. If it doesn't, rebuild:

```powershell
cd web-customer

# Clean previous build
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall dependencies (ensures everything is up to date)
npm install

# Rebuild with standalone output
npm run build
```

After rebuilding, verify that `.next/standalone/node_modules/next` exists:

```powershell
Test-Path ".next\standalone\node_modules\next"
```

### Option 2: Install Dependencies in Standalone Folder

If rebuilding doesn't work, manually install production dependencies:

```powershell
cd C:\inetpub\wwwroot\flowcart-customer\.next\standalone

# Install production dependencies
npm install --production --no-save

# Or install specific missing packages
npm install next@14.2.33 react@18.2.0 react-dom@18.2.0 --production --no-save
```

### Option 3: Copy node_modules from Development

**Not recommended for production**, but can work as a temporary fix:

```powershell
# From your development machine
Copy-Item -Path "D:\Contirvya-Projects\flowcart\web-customer\node_modules" -Destination "C:\inetpub\wwwroot\flowcart-customer\.next\standalone\node_modules" -Recurse -Force
```

## Verify Standalone Build Structure

After rebuilding, check that these exist:

```
.next/standalone/
├── server.js                    ← Must exist
├── node_modules/                ← Must exist
│   ├── next/                    ← Must exist (this is missing!)
│   ├── react/
│   ├── react-dom/
│   └── ... (other dependencies)
└── package.json                 ← Should exist
```

## Check Next.js Configuration

Ensure `next.config.mjs` has:

```javascript
output: 'standalone',
```

## Common Causes

1. **Build interrupted** - The build process was stopped before completion
2. **Corrupted build** - Previous build files are corrupted
3. **Node.js version mismatch** - Different Node.js versions between build and runtime
4. **npm cache issues** - Corrupted npm cache

## Fix npm Cache (if needed)

```powershell
npm cache clean --force
npm install
npm run build
```

## Verify Node.js Version

Ensure the same Node.js version is used for build and runtime:

```powershell
# Check version
node --version

# Should be Node.js 18+ for Next.js 14
```

## After Fixing

1. Copy the rebuilt `.next/standalone/` folder to IIS
2. Restart the Application Pool
3. Test the application

