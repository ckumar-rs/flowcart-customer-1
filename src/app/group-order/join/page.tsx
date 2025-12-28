'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import JoinGroupOrder from '@/components/JoinGroupOrder';
import { GroupOrderDto } from '@/types';

function JoinGroupOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessId = searchParams.get('businessId') || '';

  if (!businessId) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Business ID required</p>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const handleJoined = (groupOrder: GroupOrderDto) => {
    router.push(`/group-order/${groupOrder.groupCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(29,130,142,0.1),transparent_50%)]" />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JoinGroupOrder businessId={businessId} onJoined={handleJoined} />
      </main>
    </div>
  );
}

export default function JoinGroupOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <JoinGroupOrderContent />
    </Suspense>
  );
}

