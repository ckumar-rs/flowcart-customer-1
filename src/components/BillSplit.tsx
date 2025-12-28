'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Percent, Receipt, Share2, Copy, Check } from 'lucide-react';
import { GroupOrderSplitDto } from '@/types';
import { groupOrderService } from '@/services/groupOrderService';
import toast from 'react-hot-toast';

interface BillSplitProps {
  groupOrderId: string;
}

export default function BillSplit({ groupOrderId }: BillSplitProps) {
  const [split, setSplit] = useState<GroupOrderSplitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSplit();
  }, [groupOrderId]);

  const loadSplit = async () => {
    try {
      setLoading(true);
      const splitData = await groupOrderService.calculateSplit(groupOrderId);
      setSplit(splitData);
    } catch (error: any) {
      console.error('Error loading split:', error);
      toast.error('Failed to calculate split');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!split) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2">
          <Receipt className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bill Split</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {split.splitType.replace('_', ' ')} split
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl p-4 mb-6 border border-primary-200/50 dark:border-primary-700/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Amount</span>
          <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
            ₹{split.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Member Splits */}
      <div className="space-y-4">
        {split.memberSplits.map((memberSplit) => (
          <div
            key={memberSplit.memberId}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">{memberSplit.memberName}</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ₹{memberSplit.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {memberSplit.percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Payment Link */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Payment Link:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const paymentLink = generatePaymentLink(memberSplit.memberId, memberSplit.amount);
                      navigator.clipboard.writeText(paymentLink);
                      setCopiedLinks((prev) => new Set(prev).add(memberSplit.memberId));
                      toast.success('Payment link copied!');
                      setTimeout(() => {
                        setCopiedLinks((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(memberSplit.memberId);
                          return newSet;
                        });
                      }, 2000);
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Copy payment link"
                  >
                    {copiedLinks.has(memberSplit.memberId) ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const paymentLink = generatePaymentLink(memberSplit.memberId, memberSplit.amount);
                      const message = `Hi ${memberSplit.memberName}, please pay your share of ₹${memberSplit.amount.toFixed(2)} for the group order. Payment link: ${paymentLink}`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    title="Share via WhatsApp"
                  >
                    <Share2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">
                  {generatePaymentLink(memberSplit.memberId, memberSplit.amount)}
                </p>
              </div>
            </div>

            {/* Items for this member (if ITEM_BASED) */}
            {split.splitType === 'ITEM_BASED' && memberSplit.items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Items:</p>
                <div className="space-y-1">
                  {memberSplit.items.map((item) => (
                    <div key={item.groupOrderItemId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        ₹{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Members</span>
          <span className="font-semibold text-gray-900 dark:text-white">{split.memberSplits.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600 dark:text-gray-400">Average per Person</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ₹{(split.totalAmount / split.memberSplits.length).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  const generatePaymentLink = (memberId: string, amount: number): string => {
    // Generate a payment link - in production, this would integrate with a payment gateway
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const paymentId = `${groupOrderId}_${memberId}_${Date.now()}`;
    return `${baseUrl}/payment/${paymentId}?amount=${amount.toFixed(2)}`;
  };
}

