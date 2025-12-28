'use client';

import { useEffect, useState } from 'react';
import { Award, Sparkles, Gift } from 'lucide-react';
import { CustomerLoyaltyStatusDto } from '@/types';
import { loyaltyService } from '@/services/loyaltyService';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface CheckoutLoyaltyPointsProps {
  businessId: string;
  orderTotal: number;
  onRedeem?: (discountAmount: number) => void;
}

export default function CheckoutLoyaltyPoints({ businessId, orderTotal, onRedeem }: CheckoutLoyaltyPointsProps) {
  const [loyaltyStatus, setLoyaltyStatus] = useState<CustomerLoyaltyStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadLoyaltyStatus();
  }, [businessId]);

  const loadLoyaltyStatus = async () => {
    try {
      setLoading(true);
      const customerPhone = typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || undefined : undefined;
      const customerId = user?.userId;

      const status = await loyaltyService.getCustomerStatus(businessId, customerId, customerPhone);
      setLoyaltyStatus(status);
    } catch (error: any) {
      // Don't show error if customer not found (guest user)
      if (error.response?.status !== 404) {
        console.error('Error loading loyalty status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !loyaltyStatus) {
    return null; // Don't show anything if loading or no loyalty account
  }

  // Calculate points that will be earned (1 point per ₹10, with tier multiplier)
  const pointsPerRupee = 0.1; // 1 point per ₹10
  let pointsEarned = Math.floor(orderTotal * pointsPerRupee);
  
  // Apply tier multiplier
  if (loyaltyStatus.tierBadge === 'SILVER') {
    pointsEarned = Math.floor(pointsEarned * 1.2);
  } else if (loyaltyStatus.tierBadge === 'GOLD') {
    pointsEarned = Math.floor(pointsEarned * 1.5);
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl p-4 border border-primary-200/50 dark:border-primary-700/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2">
          <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Loyalty Points</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {loyaltyStatus.currentPoints} points • {loyaltyStatus.tierName}
          </p>
        </div>
      </div>

      {/* Points to Earn */}
      {pointsEarned > 0 && (
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 mb-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">You'll earn</span>
            </div>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
              +{pointsEarned} points
            </span>
          </div>
        </div>
      )}

      {/* Available Rewards */}
      {loyaltyStatus.availableRewards.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Redeem Points:</p>
          {loyaltyStatus.availableRewards.slice(0, 2).map((reward) => (
            <button
              key={reward.id}
              onClick={async () => {
                try {
                  if (!user?.userId) {
                    toast.error('Please login to redeem points');
                    return;
                  }

                  const customerPhone = typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || undefined : undefined;
                  
                  // Call redeem API
                  await loyaltyService.redeemPoints(user.userId, {
                    rewardId: reward.id,
                    businessId: businessId,
                  });

                  // Update loyalty status
                  await loadLoyaltyStatus();

                  // Apply discount
                  if (onRedeem) {
                    onRedeem(reward.discountAmount);
                  }

                  toast.success(`Redeemed ${reward.pointsCost} points for ₹${reward.discountAmount} off!`);
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Failed to redeem points');
                }
              }}
              disabled={loyaltyStatus.currentPoints < reward.pointsCost}
              className="w-full flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors backdrop-blur-sm border border-primary-200/50 dark:border-primary-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{reward.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reward.pointsCost} pts • ₹{reward.discountAmount} off
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

