'use client';

import { useEffect, useState } from 'react';
import { X, Gift, Sparkles, Award } from 'lucide-react';
import { CustomerLoyaltyStatusDto, LoyaltyRewardDto } from '@/types';
import { loyaltyService } from '@/services/loyaltyService';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface PointsRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onRedeem?: (discountAmount: number) => void;
}

export default function PointsRedemptionModal({
  isOpen,
  onClose,
  businessId,
  onRedeem,
}: PointsRedemptionModalProps) {
  const [loyaltyStatus, setLoyaltyStatus] = useState<CustomerLoyaltyStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && businessId) {
      loadLoyaltyStatus();
    }
  }, [isOpen, businessId]);

  const loadLoyaltyStatus = async () => {
    try {
      setLoading(true);
      const customerPhone = typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || undefined : undefined;
      const customerId = user?.userId;

      const status = await loyaltyService.getCustomerStatus(businessId, customerId, customerPhone);
      setLoyaltyStatus(status);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading loyalty status:', error);
        toast.error('Failed to load loyalty status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: LoyaltyRewardDto) => {
    if (!user?.userId) {
      toast.error('Please login to redeem points');
      return;
    }

    if (loyaltyStatus && loyaltyStatus.currentPoints < reward.pointsCost) {
      toast.error('Insufficient points');
      return;
    }

    setRedeeming(reward.id);
    try {
      await loyaltyService.redeemPoints(user.userId, {
        rewardId: reward.id,
        businessId: businessId,
      });

      // Reload status
      await loadLoyaltyStatus();

      // Call onRedeem callback
      if (onRedeem) {
        onRedeem(reward.discountAmount);
      }

      toast.success(`Redeemed ${reward.pointsCost} points for ₹${reward.discountAmount} off!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to redeem points');
    } finally {
      setRedeeming(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2">
              <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Redeem Points</h2>
              {loyaltyStatus && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loyaltyStatus.currentPoints} points available • {loyaltyStatus.tierName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !loyaltyStatus || loyaltyStatus.availableRewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No rewards available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loyaltyStatus.availableRewards.map((reward) => {
                const canRedeem = loyaltyStatus.currentPoints >= reward.pointsCost;
                return (
                  <div
                    key={reward.id}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      canRedeem
                        ? 'border-primary-200 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <h3 className="font-bold text-gray-900 dark:text-white">{reward.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          ₹{reward.discountAmount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">off</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {reward.pointsCost} points required
                      </span>
                    </div>

                    {reward.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{reward.description}</p>
                    )}

                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem || redeeming === reward.id}
                      className={`w-full py-2 rounded-lg font-semibold transition-all ${
                        canRedeem
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === reward.id ? 'Redeeming...' : canRedeem ? 'Redeem Now' : 'Insufficient Points'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

