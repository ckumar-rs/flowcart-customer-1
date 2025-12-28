'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Award, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';
import { LoyaltyPointsTransactionDto } from '@/types';
import { loyaltyService } from '@/services/loyaltyService';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

function LoyaltyHistoryContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get('businessId') || '';
  const { user } = useAuthStore();

  const [transactions, setTransactions] = useState<LoyaltyPointsTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (businessId) {
      loadHistory();
    }
  }, [businessId, page]);

  const loadHistory = async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      const customerPhone = typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || undefined : undefined;
      const customerId = user?.userId;

      const history = await loyaltyService.getTransactionHistory(
        businessId,
        customerId,
        customerPhone,
        page,
        20
      );

      if (page === 1) {
        setTransactions(history);
      } else {
        setTransactions((prev) => [...prev, ...history]);
      }

      setHasMore(history.length === 20);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading loyalty history:', error);
        toast.error('Failed to load loyalty history');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'EARNED':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'REDEEMED':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Award className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'EARNED':
        return 'text-green-600 dark:text-green-400';
      case 'REDEEMED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Business ID is required</p>
          <Link href="/dashboard" className="text-primary-600 hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-primary-600 dark:text-primary-400 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Loyalty Points History</h1>
          <p className="text-gray-600 dark:text-gray-400">View your points transactions and rewards</p>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transactionId}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.transactionType)}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {transaction.transactionType === 'EARNED' ? 'Points Earned' : 'Points Redeemed'}
                        </p>
                        {transaction.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction.transactionType)}`}>
                        {transaction.transactionType === 'EARNED' ? '+' : '-'}
                        {Math.abs(transaction.points)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Balance: {transaction.pointsAfter}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={loading}
                className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoyaltyHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoyaltyHistoryContent />
    </Suspense>
  );
}

