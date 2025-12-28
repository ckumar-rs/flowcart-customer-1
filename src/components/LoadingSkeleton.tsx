'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton height={192} />
      <div className="p-4">
        <Skeleton height={20} width="80%" className="mb-2" />
        <Skeleton height={16} width="60%" className="mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton height={24} width={80} />
          <Skeleton height={36} width={100} />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton circle width={20} height={20} />
            <Skeleton height={24} width={150} />
          </div>
          <Skeleton height={16} width={200} className="mb-2" />
          <Skeleton height={16} width={120} />
        </div>
        <div className="text-right">
          <Skeleton height={24} width={100} className="mb-2" />
          <Skeleton height={16} width={80} />
        </div>
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton height={40} width={200} />
        <div className="flex-1">
          <Skeleton height={40} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Skeleton height={400} />
      <div className="space-y-4">
        <Skeleton height={32} width="80%" />
        <Skeleton height={24} width={100} />
        <Skeleton height={100} count={3} />
        <Skeleton height={48} width={200} />
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <Skeleton circle width={48} height={48} className="mx-auto mb-4" />
        <Skeleton height={32} width={200} className="mx-auto mb-2" />
        <Skeleton height={20} width={300} className="mx-auto" />
      </div>
      <div className="space-y-4">
        <Skeleton height={20} width="100%" />
        <Skeleton height={20} width="100%" />
        <Skeleton height={20} width="100%" />
        <Skeleton height={20} width="100%" />
      </div>
    </div>
  );
}

