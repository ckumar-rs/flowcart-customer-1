'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sessionService } from '@/services/sessionService';
import { useCartStore } from '@/stores/cartStore';

/**
 * Session Manager Component
 * Top-level component that manages user sessions across the entire app
 * Handles session initialization, validation, and cleanup
 */
export default function SessionManager() {
  const pathname = usePathname();
  const { businessId, setBusiness } = useCartStore();

  useEffect(() => {
    // Initialize session service
    sessionService.initialize();

    // Clean up expired sessions periodically
    const cleanupInterval = setInterval(() => {
      sessionService.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Validate and sync session with cart store
    const syncSession = () => {
      const session = sessionService.getSession();
      const currentBusinessId = sessionService.getCurrentBusinessId();

      // If we have a business ID in session but not in cart store, sync it
      if (currentBusinessId && currentBusinessId !== businessId) {
        setBusiness(currentBusinessId);
      }

      // If session is invalid but we have a business ID, try to restore session
      if (!session && currentBusinessId) {
        // Session expired but business ID exists - create new session
        sessionService.createSession(currentBusinessId);
      }
    };

    syncSession();

    // Sync on pathname change (user navigation)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(cleanupInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, businessId, setBusiness]);

  // This component doesn't render anything
  return null;
}

