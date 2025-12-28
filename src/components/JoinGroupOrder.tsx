'use client';

import { useState, useEffect } from 'react';
import { Users, ArrowRight, X } from 'lucide-react';
import { JoinGroupOrderRequest, GroupOrderDto } from '@/types';
import { groupOrderService } from '@/services/groupOrderService';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface JoinGroupOrderProps {
  businessId: string;
  onJoined?: (groupOrder: GroupOrderDto) => void;
  onCancel?: () => void;
}

export default function JoinGroupOrder({ businessId, onJoined, onCancel }: JoinGroupOrderProps) {
  const [groupCode, setGroupCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [joining, setJoining] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.firstName) {
      setMemberName(user.firstName);
    }
    if (typeof window !== 'undefined') {
      const phone = localStorage.getItem('customer_phone');
      if (phone) setMemberPhone(phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) {
      toast.error('Please enter a group code');
      return;
    }

    try {
      setJoining(true);
      const request: JoinGroupOrderRequest = {
        groupCode: groupCode.trim().toUpperCase(),
        customerId: user?.userId,
        memberName: memberName.trim() || user?.firstName,
        memberPhone: memberPhone.trim() || undefined,
        memberEmail: user?.email,
      };

      const groupOrder = await groupOrderService.joinGroupOrder(request);
      toast.success('Successfully joined group order!');
      onJoined?.(groupOrder);
    } catch (error: any) {
      console.error('Error joining group order:', error);
      toast.error(error.response?.data?.message || 'Failed to join group order. Check the code and try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2">
            <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join Group Order</h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Group Code *
          </label>
          <input
            type="text"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-black tracking-widest"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Ask the group order creator for the code
          </p>
        </div>

        {!user && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                placeholder="Enter your phone"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={joining || !groupCode.trim()}
          className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {joining ? (
            'Joining...'
          ) : (
            <>
              Join Group Order
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}

