'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();
  
  // Zustand persist automatically loads from localStorage, no need to call loadWishlist

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(29,130,142,0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="flex items-center justify-between mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black flex items-center gap-2 dark:text-white">
              <Heart className="w-7 h-7 text-red-500 dark:text-red-400 fill-current" />
              My Wishlist
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1.5 text-sm font-medium">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="relative inline-block mb-4">
              <Heart className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto" />
              <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold text-lg">Your wishlist is empty</p>
            <Link
              href="/"
              className="text-primary-600 dark:text-primary-400 hover:underline font-bold"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

