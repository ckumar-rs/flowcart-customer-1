'use client';

import { useEffect, useState } from 'react';
import { Award, Star, Gift, TrendingUp, History, Sparkles } from 'lucide-react';
import { CustomerLoyaltyStatusDto, LoyaltyPointsTransactionDto } from '@/types';
import { loyaltyService } from '@/services/loyaltyService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface LoyaltyDashboardProps {
  businessId: string;
}

export default function LoyaltyDashboard({ businessId }: LoyaltyDashboardProps) {
  const [loyaltyStatus, setLoyaltyStatus] = useState<CustomerLoyaltyStatusDto | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyPointsTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadLoyaltyData();
  }, [businessId]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const customerPhone = typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || undefined : undefined;
      const customerId = user?.userId;

      const [status, history] = await Promise.all([
        loyaltyService.getCustomerStatus(businessId, customerId, customerPhone),
        loyaltyService.getTransactionHistory(businessId, customerId, customerPhone, 1, 10)
      ]);

      setLoyaltyStatus(status);
      setTransactions(history);
    } catch (error: any) {
      console.error('Error loading loyalty data:', error);
      // Don't show error if customer not found (guest user)
      if (error.response?.status !== 404) {
        toast.error('Failed to load loyalty information');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!loyaltyStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
        <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">No loyalty account found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Start ordering to earn points!</p>
      </div>
    );
  }

  const getTierColor = (badge: string) => {
    switch (badge) {
      case 'GOLD':
        return 'from-yellow-400 to-yellow-600';
      case 'SILVER':
        return 'from-gray-300 to-gray-500';
      case 'BRONZE':
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const progressPercentage = loyaltyStatus.pointsToNextTier > 0
    ? ((loyaltyStatus.currentPoints / (loyaltyStatus.currentPoints + loyaltyStatus.pointsToNextTier)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Points Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-primary-100 mb-1">Loyalty Points</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{loyaltyStatus.currentPoints.toLocaleString()}</span>
                <span className="text-primary-200 text-sm">points</span>
              </div>
            </div>
            <div className={`bg-gradient-to-br ${getTierColor(loyaltyStatus.tierBadge)} rounded-full p-4 shadow-lg`}>
              <Award className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Tier Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-100">Current Tier</span>
              <span className="text-lg font-bold">{loyaltyStatus.tierName}</span>
            </div>
            {loyaltyStatus.tierDiscountPercentage > 0 && (
              <p className="text-xs text-primary-200">
                {loyaltyStatus.tierDiscountPercentage}% discount on all orders
              </p>
            )}
          </div>

          {/* Progress to Next Tier */}
          {loyaltyStatus.pointsToNextTier > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-primary-200">Progress to {loyaltyStatus.tierName === 'No Tier' ? 'Bronze' : 'Next Tier'}</span>
                <span className="font-semibold">{loyaltyStatus.pointsToNextTier} points needed</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="bg-white rounded-full h-2.5 transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Earned</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {loyaltyStatus.totalPointsEarned.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
              <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Redeemed</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {loyaltyStatus.totalPointsRedeemed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rewards */}
      {loyaltyStatus.availableRewards.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Available Rewards</h3>
          </div>
          <div className="space-y-3">
            {loyaltyStatus.availableRewards.slice(0, 3).map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl border border-primary-200/50 dark:border-primary-700/50"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{reward.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {reward.pointsCost} pts
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    ₹{reward.discountAmount} off
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/dashboard/loyalty?businessId=${businessId}`}
            className="mt-4 block text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            View all rewards →
          </Link>
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.transactionId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.transactionType === 'EARNED'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {transaction.transactionType === 'EARNED' ? (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Gift className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {transaction.description || transaction.transactionType}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      transaction.transactionType === 'EARNED'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.transactionType === 'EARNED' ? '+' : '-'}
                    {Math.abs(transaction.points)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transaction.pointsAfter} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

