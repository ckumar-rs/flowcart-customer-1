'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Lock, Users, Share2 } from 'lucide-react';
import { GroupOrderDto, GroupOrderItemDto } from '@/types';
import { groupOrderService } from '@/services/groupOrderService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import GroupOrderShare from './GroupOrderShare';

interface GroupOrderCartProps {
  groupOrder: GroupOrderDto;
  memberId: string;
  onUpdate?: () => void;
  onLock?: () => void;
}

export default function GroupOrderCart({ groupOrder, memberId, onUpdate, onLock }: GroupOrderCartProps) {
  const [showShare, setShowShare] = useState(false);
  const { businessId } = useCartStore();
  const { user } = useAuthStore();

  const isCreator = groupOrder.members.find(m => m.groupOrderMemberId === memberId)?.role === 'CREATOR';
  const isLocked = groupOrder.status === 'LOCKED';

  const handleRemoveItem = async (itemId: string) => {
    try {
      await groupOrderService.removeItem(groupOrder.groupOrderId, itemId, memberId);
      toast.success('Item removed');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-2">
            <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{groupOrder.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {groupOrder.memberCount} {groupOrder.memberCount === 1 ? 'member' : 'members'} • {groupOrder.itemCount} items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCreator && groupOrder.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => setShowShare(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={async () => {
                  try {
                    await groupOrderService.lockGroupOrder(groupOrder.groupOrderId, memberId);
                    toast.success('Group order locked for checkout');
                    onLock?.();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Failed to lock order');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Lock for Checkout
              </button>
            </>
          )}
        </div>
      </div>

      {showShare && (
        <div className="mb-6">
          <GroupOrderShare groupOrder={groupOrder} onClose={() => setShowShare(false)} />
        </div>
      )}

      {/* Items List */}
      {groupOrder.items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No items yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Start adding items to the group order!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {groupOrder.items.map((item) => {
            const canRemove = !isLocked && (
              item.addedByMemberId === memberId || isCreator
            );

            return (
              <div
                key={item.groupOrderItemId}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
              >
                {item.productImageUrl && (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{item.productName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                  </p>
                  {item.addedByName && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Added by {item.addedByName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">₹{item.subtotal.toFixed(2)}</p>
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveItem(item.groupOrderItemId)}
                      className="mt-2 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total */}
      {groupOrder.items.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total</span>
            <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
              ₹{groupOrder.totalAmount.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Split type: {groupOrder.splitType.replace('_', ' ')}
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Members</h3>
        </div>
        <div className="space-y-2">
          {groupOrder.members.map((member) => (
            <div
              key={member.groupOrderMemberId}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {member.memberName || 'Guest'}
                  {member.role === 'CREATOR' && (
                    <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                      Creator
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

