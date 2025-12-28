'use client';

import { useState } from 'react';
import { Users, Copy, Check, X } from 'lucide-react';
import { CreateGroupOrderRequest, GroupOrderDto } from '@/types';
import { groupOrderService } from '@/services/groupOrderService';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface CreateGroupOrderProps {
  businessId: string;
  onCreated?: (groupOrder: GroupOrderDto) => void;
  onCancel?: () => void;
}

export default function CreateGroupOrder({ businessId, onCreated, onCancel }: CreateGroupOrderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [splitType, setSplitType] = useState<'EQUAL' | 'ITEM_BASED' | 'CUSTOM'>('EQUAL');
  const [creating, setCreating] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group order name');
      return;
    }

    try {
      setCreating(true);
      const request: CreateGroupOrderRequest = {
        businessId,
        name: name.trim(),
        description: description.trim() || undefined,
        splitType,
        customerId: user?.userId,
        customerName: user?.firstName,
        customerPhone: typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || undefined : undefined,
      };

      const groupOrder = await groupOrderService.createGroupOrder(request);
      toast.success('Group order created! Share the code with your friends.');
      onCreated?.(groupOrder);
    } catch (error: any) {
      console.error('Error creating group order:', error);
      toast.error(error.response?.data?.message || 'Failed to create group order');
    } finally {
      setCreating(false);
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Group Order</h2>
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
            Group Order Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Office Lunch, Party Order"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this group order..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Split Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['EQUAL', 'ITEM_BASED', 'CUSTOM'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  splitType === type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <p className="font-semibold text-sm">{type.replace('_', ' ')}</p>
                <p className="text-xs mt-1 opacity-70">
                  {type === 'EQUAL' && 'Split equally'}
                  {type === 'ITEM_BASED' && 'Pay for your items'}
                  {type === 'CUSTOM' && 'Custom amounts'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {creating ? 'Creating...' : 'Create Group Order'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

