'use client';

import Link from 'next/link';
import { Home, Search, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <Search className="w-6 h-6 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Find Business</span>
            </Link>
            <Link
              href="/orders"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <ShoppingBag className="w-6 h-6 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">My Orders</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact support or try searching for what you need.</p>
        </div>
      </div>
    </div>
  );
}

