'use client';

import { RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';

interface ReorderButtonProps {
  order: Order;
}

export default function ReorderButton({ order }: ReorderButtonProps) {
  const router = useRouter();
  const { addItem, setBusiness: setCartBusiness } = useCartStore();

  const handleReorder = () => {
    try {
      // Set business ID
      setCartBusiness(order.businessId);

      // Add all items from order to cart
      order.orderItems.forEach((item) => {
        // Create product object from order item
        const product = {
          productId: item.productId,
          name: item.productName,
          price: item.unitPrice,
          description: '',
          imageUrl: '',
          isAvailable: true,
          businessId: order.businessId,
        };

        addItem(product, item.quantity);
      });

      toast.success('Items added to cart!');
      
      // Navigate to catalog
      router.push(`/catalog/${order.businessId}`);
    } catch (error) {
      toast.error('Failed to reorder. Please try again.');
    }
  };

  return (
    <button
      onClick={handleReorder}
      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      aria-label="Reorder items"
    >
      <RotateCcw className="w-4 h-4" />
      Reorder
    </button>
  );
}

