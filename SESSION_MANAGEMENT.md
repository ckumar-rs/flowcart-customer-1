# Session Management System

## Overview

A comprehensive, top-level session management system designed to handle thousands of concurrent users. The system manages user sessions, business context, and session data persistence across the entire application.

## Architecture

### Core Components

1. **SessionService** (`src/services/sessionService.ts`)
   - Centralized session management service
   - Handles session creation, validation, expiration, and cleanup
   - Manages business context and caching
   - Automatic session extension on user activity

2. **SessionManager Component** (`src/components/SessionManager.tsx`)
   - Top-level React component integrated into the root layout
   - Automatically initializes and maintains sessions
   - Syncs session state with cart store
   - Handles session validation and cleanup

## Features

### Session Lifecycle

- **Session Creation**: Automatically creates sessions when users scan QR codes or enter business IDs
- **Session Validation**: Validates sessions on app load and navigation
- **Session Extension**: Automatically extends sessions on user activity (mouse, keyboard, scroll, touch)
- **Session Expiration**: Sessions expire after 24 hours of inactivity
- **Session Cleanup**: Automatic cleanup of expired sessions every 5 minutes

### Business Context Management

- **Business ID Persistence**: Stores business ID in multiple layers:
  - `sessionStorage`: Current session data
  - `localStorage`: Persistence across browser sessions
  - `cartStore`: Zustand store for reactive state
- **Business Data Caching**: Caches business data for 5 minutes to reduce API calls
- **Business Switching**: Automatically clears cart when switching businesses

### Scalability Features

- **Session Isolation**: Each user gets a unique session ID
- **Session Tracking**: Tracks up to 10 recent sessions per user
- **Automatic Cleanup**: Removes expired sessions to prevent storage bloat
- **Memory Efficient**: Uses both `sessionStorage` (temporary) and `localStorage` (persistent) appropriately

## Usage

### Creating a Session

```typescript
import { sessionService } from '@/services/sessionService';

// Create a new session
const session = sessionService.createSession(
  businessId,
  userId, // optional
  businessData // optional
);
```

### Getting Current Session

```typescript
// Get current session
const session = sessionService.getSession();

// Get current business ID
const businessId = sessionService.getCurrentBusinessId();
```

### Getting Cached Business Data

```typescript
// Get cached business data (if available and not expired)
const businessData = sessionService.getCachedBusinessData(businessId);
```

### Updating Session

```typescript
// Update session data
sessionService.updateSession({
  userId: 'new-user-id',
  // ... other updates
});
```

### Clearing Sessions

```typescript
// Clear current session
sessionService.clearSession();

// Clear all sessions (on logout)
sessionService.clearAllSessions();
```

## Integration Points

The session management system is integrated into:

1. **QR Code Scanning** (`/scan`, `/qr/[businessId]`)
   - Creates session when QR code is scanned
   - Validates business before creating session

2. **Home Page** (`/`)
   - Creates session when business ID is entered manually
   - Checks for existing session on page load

3. **Catalog Page** (`/catalog/[businessId]`)
   - Updates/extends session when viewing catalog
   - Syncs with cart store

4. **Product Pages** (`/product/[productId]`)
   - Uses session to get business context
   - Ensures business ID is available for cart operations

5. **Order Pages** (`/orders`, `/order/[orderId]`)
   - Retrieves business ID from session
   - Maintains business context for order operations

6. **Product Service** (`src/services/productService.ts`)
   - Uses session service to get business ID when not provided

## Session Data Structure

```typescript
interface SessionData {
  sessionId: string;        // Unique session identifier
  userId?: string;          // Optional user ID
  businessId: string;       // Current business ID
  businessData?: any;       // Cached business data
  timestamp: number;        // Last access time
  expiresAt: number;        // Expiration timestamp
}
```

## Configuration

### Session Expiry

- **Default Session Expiry**: 24 hours
- **Business Cache Expiry**: 5 minutes
- **Cleanup Interval**: 5 minutes

### Limits

- **Max Sessions Tracked**: 10 per user
- **Session ID Format**: `{timestamp}_{random}`

## Benefits

1. **Scalability**: Designed to handle thousands of concurrent users
2. **Performance**: Reduces API calls through intelligent caching
3. **User Experience**: Seamless session management without user intervention
4. **Data Integrity**: Ensures business context is maintained across navigation
5. **Memory Efficiency**: Automatic cleanup prevents storage bloat
6. **Security**: Session isolation prevents data leakage between users

## Best Practices

1. **Always use sessionService** instead of directly accessing `localStorage` or `sessionStorage` for business-related data
2. **Check session validity** before performing operations that require a business context
3. **Extend sessions** on user activity to maintain active sessions
4. **Clear sessions** on logout or when switching users
5. **Handle session expiration** gracefully by redirecting to business selection

## Future Enhancements

- Server-side session validation
- Session analytics and monitoring
- Multi-device session synchronization
- Session encryption for sensitive data
- Session sharing for group orders

