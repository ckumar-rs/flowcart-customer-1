'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, ShoppingBag, Heart, Settings, LogOut, Package, MapPin, Phone, Mail, Award, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import LoyaltyDashboard from '@/components/LoyaltyDashboard';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: cartItems, businessId } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to access your dashboard');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Always render to maintain hook consistency - show loading if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const stats = [
    {
      label: 'Cart Items',
      value: cartItems.length,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      href: businessId ? `/catalog/${businessId}` : '/',
    },
    {
      label: 'Wishlist',
      value: wishlistItems.length,
      icon: Heart,
      color: 'bg-red-500',
      href: '/wishlist',
    },
    {
      label: 'Orders',
      value: 'View All',
      icon: Package,
      color: 'bg-green-500',
      href: '/orders',
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(29,130,142,0.05),transparent_50%)]" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 mb-5 text-white backdrop-blur-sm border border-primary-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black mb-1 sm:mb-2 truncate">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-primary-100 text-xs sm:text-sm font-medium">
                Manage your account, orders, and preferences
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-full p-3 sm:p-4 border border-white/30 flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold mb-1.5">{stat.label}</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`${stat.color} rounded-xl p-3 text-white shadow-lg`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Account Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3.5 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-600/50">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Email</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-600/50">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Name</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 p-3.5 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-600/50">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Phone</p>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/orders"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Package className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">View Orders</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Heart className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">My Wishlist</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Settings className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">Account Settings</span>
                </Link>
                {businessId && (
                  <Link
                    href={`/catalog/${businessId}`}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Continue Shopping</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Account Settings Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">Account</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions or need assistance, please contact support.
              </p>
              <Link
                href="/orders"
                className="block text-center text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View Order History
              </Link>
            </div>
          </div>
        </div>

        {/* Loyalty Points Section */}
        {businessId && (
          <div className="mt-6">
            <LoyaltyDashboard businessId={businessId} />
          </div>
        )}

        {/* Group Ordering Section */}
        {businessId && (
          <div className="mt-4 sm:mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-1.5 sm:p-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Group Ordering</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">
              Create or join a group order to split the bill with friends
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href={`/group-order/create?businessId=${businessId}`}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 transition-all text-center text-sm sm:text-base"
              >
                Create Group Order
              </Link>
              <Link
                href={`/group-order/join?businessId=${businessId}`}
                className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-xl font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-center text-sm sm:text-base"
              >
                Join Group Order
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

