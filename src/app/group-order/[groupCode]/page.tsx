'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Lock, Users, Share2, ArrowLeft } from 'lucide-react';
import { GroupOrderDto, Product } from '@/types';
import { groupOrderService } from '@/services/groupOrderService';
import { productService } from '@/services/productService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import GroupOrderCart from '@/components/GroupOrderCart';
import BillSplit from '@/components/BillSplit';
import GroupOrderShare from '@/components/GroupOrderShare';
import ProductCard from '@/components/ProductCard';
import groupOrderSignalRService from '@/services/groupOrderSignalRService';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function GroupOrderPage() {
  const params = useParams();
  const router = useRouter();
  const groupCode = params.groupCode as string;
  
  const [groupOrder, setGroupOrder] = useState<GroupOrderDto | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  const [showProducts, setShowProducts] = useState(true);

  const { businessId } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (groupCode) {
      loadGroupOrder();
    }

    // Cleanup SignalR on unmount
    return () => {
      groupOrderSignalRService.disconnect();
      groupOrderSignalRService.removeAllHandlers();
    };
  }, [groupCode]);

  useEffect(() => {
    if (groupOrder?.groupOrderId) {
      // Connect to SignalR
      groupOrderSignalRService.connect(groupOrder.groupOrderId);

      // Set up real-time handlers
      groupOrderSignalRService.onItemAdded(() => {
        loadGroupOrder();
        toast.success('New item added!', { icon: '🛒' });
      });

      groupOrderSignalRService.onItemRemoved(() => {
        loadGroupOrder();
      });

      groupOrderSignalRService.onMemberJoined(() => {
        loadGroupOrder();
        toast.success('New member joined!', { icon: '👋' });
      });

      groupOrderSignalRService.onMemberLeft(() => {
        loadGroupOrder();
      });

      groupOrderSignalRService.onOrderLocked(() => {
        loadGroupOrder();
        toast('Order locked for checkout', { icon: '🔒' });
      });

      groupOrderSignalRService.onOrderCompleted(() => {
        toast.success('Order completed!', { icon: '✅' });
        router.push('/orders');
      });
    }
  }, [groupOrder?.groupOrderId]);

  const loadGroupOrder = async () => {
    try {
      setLoading(true);
      const order = await groupOrderService.getGroupOrderByCode(groupCode);
      setGroupOrder(order);
      
      // Find current member
      const phone = typeof window !== 'undefined' ? localStorage.getItem('customer_phone') : null;
      const member = order.members.find(
        m => m.customerId === user?.userId || m.memberPhone === phone
      );
      if (member) {
        setCurrentMemberId(member.groupOrderMemberId);
      }

      // Load products if businessId available
      if (order.businessId) {
        const productsResult = await productService.getByBusiness(order.businessId, 1, 50);
        setProducts(productsResult.products);
      }
    } catch (error: any) {
      console.error('Error loading group order:', error);
      toast.error('Group order not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (product: Product, quantity: number = 1) => {
    if (!groupOrder || !currentMemberId) {
      toast.error('Please join the group order first');
      return;
    }

    try {
      await groupOrderService.addItem(groupOrder.groupOrderId, currentMemberId, {
        productId: product.productId,
        quantity,
      });
      toast.success('Item added to group order!');
      loadGroupOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!groupOrder) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Group order not found</p>
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const isLocked = groupOrder.status === 'LOCKED';
  const isCreator = groupOrder.members.find(m => m.groupOrderMemberId === currentMemberId)?.role === 'CREATOR';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(29,130,142,0.1),transparent_50%)]" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={groupOrder.businessId ? `/catalog/${groupOrder.businessId}` : '/'}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Catalog</span>
          </Link>
          <div className="flex items-center gap-2">
            {isCreator && (
              <button
                onClick={() => setShowShare(!showShare)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {showShare && (
          <div className="mb-6">
            <GroupOrderShare groupOrder={groupOrder} onClose={() => setShowShare(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Add Items</h2>
              {isLocked && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Locked for Checkout</span>
                  <span className="sm:hidden">Locked</span>
                </span>
              )}
            </div>
            
            {!isLocked && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.productId} className="relative">
                    <ProductCard product={product} />
                    <button
                      onClick={() => handleAddItem(product, 1)}
                      className="absolute bottom-2 right-2 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-10"
                      title="Add to group order"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart & Split Section */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <GroupOrderCart
              groupOrder={groupOrder}
              memberId={currentMemberId}
              onUpdate={loadGroupOrder}
              onLock={loadGroupOrder}
            />
            
            {isLocked && (
              <BillSplit groupOrderId={groupOrder.groupOrderId} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

