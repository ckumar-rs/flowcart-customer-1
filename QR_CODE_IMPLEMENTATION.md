# QR Code Implementation Guide

## Overview
FlowCart now supports **two ways** for customers to access restaurant/hotel menus:
1. **QR Code Scanning** - Scan a QR code containing the business ID
2. **Manual Business ID Entry** - Enter the business ID directly

Both methods properly store the business ID in session/cache and redirect to the catalog page.

## Implementation Details

### 1. QR Code Route Handler (`/qr/[businessId]`)
**File:** `web-customer/src/app/qr/[businessId]/page.tsx`

This page handles direct QR code links (e.g., when a QR code contains a URL like `https://yourapp.com/qr/{businessId}`).

**Features:**
- Validates business exists
- Stores business ID in localStorage and sessionStorage
- Sets business in cart store
- Redirects to catalog page
- Shows loading/success/error states

**Usage:**
- QR codes can contain just the business ID (GUID)
- QR codes can contain a URL: `/qr/{businessId}` or `https://yourapp.com/qr/{businessId}`
- The handler extracts the business ID from either format

### 2. QR Code Scanner Page (`/scan`)
**File:** `web-customer/src/app/scan/page.tsx`

This page provides a camera-based QR code scanner with manual input fallback.

**Features:**
- Uses `html5-qrcode` library for QR code detection
- Camera permission handling
- Real-time QR code scanning
- Manual business ID input as fallback
- Validates business ID format (GUID)
- Stores business ID in session/cache
- Redirects to catalog on success

**QR Code Formats Supported:**
- Plain business ID: `123e4567-e89b-12d3-a456-426614174000`
- URL format: `/qr/123e4567-e89b-12d3-a456-426614174000`
- Full URL: `https://yourapp.com/qr/123e4567-e89b-12d3-a456-426614174000`

### 3. Home Page (`/`)
**File:** `web-customer/src/app/page.tsx`

The home page now prominently displays both options:
- **QR Code Scanner** - Large button to scan QR codes
- **Manual Entry** - Form to enter business ID directly

**Features:**
- Auto-redirects if business ID is already stored
- Both methods store business ID in session/cache
- Validates business exists before redirecting

### 4. Catalog Page Updates
**File:** `web-customer/src/app/catalog/[businessId]/page.tsx`

The catalog page now:
- Stores business ID in localStorage when accessed
- Sets business in cart store (clears cart if switching businesses)
- Maintains session persistence

### 5. App Header
**File:** `web-customer/src/components/AppHeader.tsx`

Added QR scanner button in the header for quick access from any page.

## Business ID Storage

Business ID is stored in **three places** for maximum compatibility:

1. **localStorage** (`flowcart_business_id`)
   - Persists across browser sessions
   - Used by all pages to remember the current business

2. **sessionStorage** (`business_{businessId}`)
   - Stores full business data for quick access
   - Cleared when browser session ends
   - Includes timestamp for cache invalidation

3. **Cart Store** (Zustand with persistence)
   - Manages cart state per business
   - Automatically clears cart when switching businesses
   - Persists to localStorage

## QR Code Generation

To generate QR codes for restaurants/hotels, use any QR code generator with:

**Format 1 (Recommended):**
```
https://yourapp.com/qr/{businessId}
```

**Format 2 (Alternative):**
```
{businessId}
```
(Just the GUID - scanner will detect and validate it)

**Example:**
```
https://flowcart.com/qr/123e4567-e89b-12d3-a456-426614174000
```

## User Flow

### Via QR Code:
1. User scans QR code at restaurant
2. QR code contains business ID (or URL with business ID)
3. App validates business exists
4. Business ID stored in session/cache
5. User redirected to catalog page
6. User can browse menu and place orders

### Via Manual Entry:
1. User visits home page
2. User enters business ID (or scans QR code)
3. App validates business exists
4. Business ID stored in session/cache
5. User redirected to catalog page
6. User can browse menu and place orders

## Session Management

- Business ID persists across page navigation
- Cart is cleared when switching to a different business
- Business data is cached for 5 minutes (in AppHeader)
- Session data persists until browser is closed (sessionStorage)
- Business ID persists until manually cleared (localStorage)

## Testing

1. **Test QR Code Scanning:**
   - Generate a QR code with a valid business ID
   - Scan using the `/scan` page
   - Verify redirect to catalog

2. **Test Manual Entry:**
   - Enter a valid business ID on home page
   - Verify redirect to catalog

3. **Test Session Persistence:**
   - Access a business via QR code or manual entry
   - Navigate to different pages
   - Verify business ID is maintained
   - Refresh page - should still remember business

4. **Test Business Switching:**
   - Add items to cart for Business A
   - Scan QR code for Business B
   - Verify cart is cleared (business switch detected)

## Dependencies

- `html5-qrcode` - QR code scanning library
- Already installed via: `npm install html5-qrcode`

## Notes

- QR codes should be placed at restaurant tables, counters, or entrance
- Business ID format: GUID (e.g., `123e4567-e89b-12d3-a456-426614174000`)
- Both methods work seamlessly - user can switch between them
- All existing logic is preserved - QR code is just another entry point

