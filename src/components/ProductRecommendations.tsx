'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { recommendationService } from '@/services/recommendationService';
import { useAuthStore } from '@/stores/authStore';
import ProductCard from './ProductCard';
import { CatalogSkeleton } from './LoadingSkeleton';

interface ProductRecommendationsProps {
  businessId: string;
  currentProductId?: string;
  title?: string;
  limit?: number;
}

export default function ProductRecommendations({
  businessId,
  currentProductId,
  title = 'Recommended for You',
  limit = 5,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const customerId = user?.userId;
        const recentProductIds = currentProductId ? [currentProductId] : undefined;
        
        const recommendations = await recommendationService.getRecommendations(
          businessId,
          customerId,
          recentProductIds,
          limit
        );
        
        setProducts(recommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      loadRecommendations();
    }
  }, [businessId, currentProductId, user?.userId, limit]);

  // Always render to maintain hook consistency
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Always render to maintain hook consistency - return empty fragment instead of null
  if (products.length === 0) {
    return <></>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
}

