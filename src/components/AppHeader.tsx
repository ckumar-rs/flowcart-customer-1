'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Heart, ShoppingCart, User, LogOut, Video } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import DarkModeToggle from '@/components/DarkModeToggle';
import { businessService } from '@/services/businessService';
import { Business } from '@/types';

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  subtitle?: string;
  onCartClick?: () => void;
  business?: Business; // Optional business prop
}

// Cache business data to prevent unnecessary refetches
const businessCache = new Map<string, { data: Business; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function AppHeader({ 
  showBackButton = true, 
  backHref,
  title,
  subtitle,
  onCartClick,
  business: businessProp
}: AppHeaderProps) {
  // CRITICAL: All hooks MUST be called unconditionally and in the SAME ORDER every render
  // This is a React requirement - violating it causes "Rendered more hooks" errors
  const router = useRouter();
  const pathname = usePathname();
  
  // All state hooks - called unconditionally
  const [shouldShowHeader, setShouldShowHeader] = useState(true);
  const [business, setBusiness] = useState<Business | null>(businessProp || null);
  const fetchingRef = useRef<string | null>(null);
  
  // Use selectors to subscribe only to specific store values - prevents unnecessary re-renders
  const cartItems = useCartStore((state) => state.items);
  const businessId = useCartStore((state) => state.businessId);
  const wishlistItems = useWishlistStore((state) => state.items);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  // Calculate counts directly from items - memoized
  const cartItemCount = useMemo(() => cartItems?.length || 0, [cartItems?.length]);
  const wishlistCount = useMemo(() => wishlistItems?.length || 0, [wishlistItems?.length]);
  
  useEffect(() => {
    // If business is provided as prop, use it directly
    if (businessProp) {
      setBusiness(businessProp);
      return;
    }

    // If no businessId, clear business
    if (!businessId) {
      setBusiness(null);
      return;
    }

    // Check cache first
    const cached = businessCache.get(businessId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setBusiness(cached.data);
      return;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current === businessId) {
      return;
    }

    // Fetch business data
    fetchingRef.current = businessId;
    businessService.getById(businessId)
      .then((businessData) => {
        // Cache the result
        businessCache.set(businessId, { data: businessData, timestamp: Date.now() });
        setBusiness(businessData);
        fetchingRef.current = null;
      })
      .catch((error) => {
        console.error('Failed to load business in AppHeader:', error);
        fetchingRef.current = null;
      });
  }, [businessId, businessProp]);

  // Determine if back button should be shown based on page context - memoized
  const showBack = useMemo(() => {
    if (!showBackButton) return false;
    
    // Always show on these pages
    if (pathname?.startsWith('/product/')) return true;
    if (pathname === '/checkout') return true;
    if (pathname?.startsWith('/order/')) return true;
    if (pathname === '/wishlist') return true;
    if (pathname === '/dashboard') return true;
    if (pathname?.startsWith('/dashboard/')) return true;
    
    // Don't show on catalog page (it's the main page)
    if (pathname?.startsWith('/catalog/')) return false;
    if (pathname === '/orders') return false;
    
    return true; // Default: show back button
  }, [pathname, showBackButton]);

  // Determine back button behavior based on context - memoized
  const handleBack = useCallback(() => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    
    // Context-aware back navigation
    if (pathname?.startsWith('/product/')) {
      businessId ? router.push(`/catalog/${businessId}`) : router.back();
      return;
    }
    if (pathname?.startsWith('/catalog/')) {
      router.push('/');
      return;
    }
    if (pathname === '/checkout') {
      businessId ? router.push(`/catalog/${businessId}`) : router.back();
      return;
    }
    if (pathname === '/orders' || pathname?.startsWith('/order/')) {
      router.push('/');
      return;
    }
    if (pathname === '/wishlist') {
      businessId ? router.push(`/catalog/${businessId}`) : router.push('/');
      return;
    }
    if (pathname === '/dashboard') {
      router.push('/');
      return;
    }
    if (pathname?.startsWith('/dashboard/')) {
      router.push('/dashboard');
      return;
    }
    
    router.back();
  }, [pathname, backHref, businessId, router]);

  // Memoize cart click handler
  const handleCartClick = useCallback(() => {
    if (onCartClick) {
      onCartClick();
    } else {
      // Fallback: dispatch event for pages that listen to it
      const event = new CustomEvent('openCart');
      window.dispatchEvent(event);
    }
  }, [onCartClick]);

  // Update visibility based on pathname after mount to avoid hydration issues
  useEffect(() => {
    const shouldShow = pathname !== '/' && pathname !== '/login' && pathname !== '/register';
    setShouldShowHeader(shouldShow);
  }, [pathname]);

  return (
    <header 
      className={`bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 shadow-xl sticky top-0 z-50 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 border-b border-primary-500/20 dark:border-primary-600/20 ${
        !shouldShowHeader ? 'hidden' : ''
      }`}
      aria-hidden={!shouldShowHeader}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Back Button and Business Name/Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Back Button - Show based on page context */}
            {showBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 text-white flex-shrink-0 backdrop-blur-sm border border-white/10"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-semibold hidden sm:inline">Back</span>
              </button>
            )}
            
            {/* Business Name (always show as text) or Title */}
            {business?.name ? (
              <Link
                href={businessId ? `/catalog/${businessId}` : '/'}
                className="text-white font-bold text-base hover:opacity-90 transition-opacity truncate"
              >
                {business.name}
              </Link>
            ) : (title || subtitle) ? (
              <div className="min-w-0">
                {title && (
                  <h1 className="text-base font-bold text-white truncate">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-xs text-white/90 truncate">{subtitle}</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Right side - Icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <DarkModeToggle />
            {businessId && (
              <Link
                href={`/recipes/${businessId}`}
                className="p-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Recipe Videos"
              >
                <Video className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/wishlist"
              className="relative p-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              onClick={handleCartClick}
              className="relative p-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 dark:bg-yellow-500 text-primary-900 dark:text-gray-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </button>
            {isAuthenticated && logout ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className="p-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  title="My Account"
                >
                  <User className="w-4 h-4" />
                </Link>
                <span className="text-xs text-white/90 hidden sm:inline font-medium">{user?.firstName}</span>
                <button
                  onClick={() => logout()}
                  className="p-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="p-2 text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Login (Optional)"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Export without memo to avoid hook count issues
export default AppHeader;

