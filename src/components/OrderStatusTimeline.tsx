'use client';

import { CheckCircle, Clock, XCircle, Package, Truck, CheckCircle2 } from 'lucide-react';
import { Order } from '@/types';

interface OrderStatusTimelineProps {
  order: Order;
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Package },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PREPARING', label: 'Preparing', icon: Clock },
  { key: 'READY', label: 'Ready', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

export default function OrderStatusTimeline({ order }: OrderStatusTimelineProps) {
  const currentStatus = order.orderStatus.toUpperCase();
  const currentIndex = statusSteps.findIndex(step => step.key === currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  const getStatusIndex = (status: string): number => {
    return statusSteps.findIndex(step => step.key === status.toUpperCase());
  };

  const isCompleted = (index: number): boolean => {
    if (isCancelled) {
      return index === 0; // Only show "Order Placed" as completed for cancelled orders
    }
    return index <= currentIndex && currentIndex >= 0;
  };

  const isCurrent = (index: number): boolean => {
    if (isCancelled) {
      return false;
    }
    return index === currentIndex;
  };

  // Filter out cancelled from timeline unless it's the current status
  const visibleSteps = isCancelled
    ? [statusSteps[0], statusSteps[statusSteps.length - 1]] // Show first and cancelled
    : statusSteps.filter(step => step.key !== 'CANCELLED');

  return (
    <div className="mb-6 border-t pt-6">
      <h2 className="text-lg font-semibold mb-4">Order Status</h2>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Status steps */}
        <div className="space-y-6">
          {visibleSteps.map((step, index) => {
            const StepIcon = step.icon;
            const completed = isCompleted(getStatusIndex(step.key));
            const current = isCurrent(getStatusIndex(step.key));
            const isLast = index === visibleSteps.length - 1;

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    completed
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : current
                      ? 'bg-primary-100 border-primary-600 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className={`flex-1 pt-2 ${isLast ? '' : 'pb-8'}`}>
                  <div
                    className={`font-medium ${
                      completed || current ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </div>
                  {current && (
                    <div className="text-sm text-primary-600 mt-1">Current status</div>
                  )}
                  {completed && !current && !isLast && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

