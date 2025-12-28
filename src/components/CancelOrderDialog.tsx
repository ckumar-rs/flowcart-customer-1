'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '@/services/orderService';

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelOrderDialog({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess,
}: CancelOrderDialogProps) {
  // IMPORTANT: All hooks must be called unconditionally
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);
    try {
      await orderService.cancel(orderId, reason.trim());
      toast.success('Order cancelled successfully');
      onSuccess();
      onClose();
      setReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Always render to maintain hook consistency - return empty fragment instead of null
  if (!isOpen) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold">Cancel Order</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Are you sure you want to cancel order <span className="font-semibold">{orderNumber}</span>?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            This action cannot be undone. Please provide a reason for cancellation.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Cancellation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Please tell us why you're cancelling this order..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling || !reason.trim()}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

