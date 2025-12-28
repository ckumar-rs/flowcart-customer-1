'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Optional - defaults to false for guest access
}

/**
 * ProtectedRoute component
 * By default, allows guest access (requireAuth=false)
 * Set requireAuth=true to enforce authentication
 */
export default function ProtectedRoute({ children, requireAuth = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, checkAuth, loading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
    setIsChecking(false);
    
    // Only redirect if authentication is required and user is not authenticated
    if (requireAuth && !loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router, checkAuth, requireAuth]);

  // Always render to maintain hook consistency
  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If auth is required and user is not authenticated, show nothing but still render
  if (requireAuth && !isAuthenticated) {
    return <></>;
  }

  // Allow guest access or authenticated users
  return <>{children}</>;
}

