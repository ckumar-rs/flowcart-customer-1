'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, X } from 'lucide-react';
import { Product } from '@/types';
import { getRecentlyViewed, clearRecentlyViewed } from '@/utils/recentlyViewed';
import ProductCard from './ProductCard';

interface RecentlyViewedProps {
  businessId?: string;
  maxItems?: number;
}

export default function RecentlyViewed({ businessId, maxItems = 5 }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    const recent = getRecentlyViewed();
    // Filter by business if businessId provided
    const filtered = businessId
      ? recent.filter(p => p.businessId === businessId)
      : recent;
    setProducts(filtered.slice(0, maxItems));
    setShowClear(filtered.length > 0);
  }, [businessId, maxItems]);

  const handleClear = () => {
    clearRecentlyViewed();
    setProducts([]);
    setShowClear(false);
  };

  // Always render to maintain hook consistency - return empty fragment instead of null
  if (products.length === 0) {
    return <></>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recently Viewed</h2>
        </div>
        {showClear && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
}

