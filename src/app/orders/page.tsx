'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { Order } from '@/types';
import { orderService } from '@/services/orderService';
import { sessionService } from '@/services/sessionService';
import { OrderCardSkeleton } from '@/components/LoadingSkeleton';
import { getErrorMessage } from '@/utils/errorMessages';
import Pagination from '@/components/Pagination';
import Link from 'next/link';

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic';

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Store all orders for filtering
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [businessId, setBusinessId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Orders per page
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const storedBusinessId = sessionService.getCurrentBusinessId();
    if (storedBusinessId) {
      setBusinessId(storedBusinessId);
    }
  }, []);

  useEffect(() => {
    if (phone && businessId) {
      setCurrentPage(1); // Reset to first page when phone or business changes
      loadOrders(1);
    }
  }, [phone, businessId]);

  useEffect(() => {
    if (phone && businessId) {
      loadOrders(currentPage);
    }
  }, [currentPage]);

  const loadOrders = async (page: number = currentPage) => {
    if (!phone || !businessId) return;

    try {
      setLoading(true);
      const result = await orderService.getByCustomer(phone, businessId, page, pageSize);
      setOrders(result.orders);
      setAllOrders(result.orders); // Store for filtering
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      
      if (result.orders.length === 0) {
        toast('No orders found for this phone number', { icon: 'ℹ️' });
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      const errorDetails = getErrorMessage(error);
      toast.error(errorDetails.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput && businessId) {
      setCurrentPage(1); // Reset to first page on new search
      router.push(`/orders?phone=${encodeURIComponent(phoneInput)}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  // Filter orders client-side (since we're paginating server-side, we filter the current page)
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.orderStatus.toUpperCase() === statusFilter.toUpperCase());
  
  // Calculate counts for filter buttons (from all loaded orders, or estimate from current page)
  const pendingCount = orders.filter(o => 
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(o.orderStatus.toUpperCase())
  ).length;
  const completedCount = orders.filter(o => o.orderStatus.toUpperCase() === 'COMPLETED').length;
  const cancelledCount = orders.filter(o => o.orderStatus.toUpperCase() === 'CANCELLED').length;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(29,130,142,0.05),transparent_50%)]" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <h1 className="text-2xl lg:text-3xl font-black mb-6 dark:text-white">My Orders</h1>

        {/* Search Form */}
        <div className="mb-4 sm:mb-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mb-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter your phone number"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm sm:text-base"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Search
            </button>
          </form>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Enter the phone number used during checkout to view your orders
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No orders found</p>
            {!phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your phone number to view orders</p>
            )}
          </div>
        ) : (
          <>
            {/* Status Filter */}
            {orders.length > 0 && (
              <div className="mb-4 sm:mb-5 flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                    statusFilter === 'pending'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                    statusFilter === 'completed'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Completed ({completedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                    statusFilter === 'cancelled'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg'
                      : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Cancelled ({cancelledCount})
                </button>
              </div>
            )}

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No {statusFilter !== 'all' ? statusFilter : ''} orders found</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
              <Link
                key={order.orderId}
                href={`/order/${order.orderId}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      {getStatusIcon(order.orderStatus)}
                      <h3 className="font-semibold text-base sm:text-lg dark:text-white truncate">{order.orderNumber}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {order.orderItems?.length || 0} item(s)
                    </p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="font-bold text-primary-600 dark:text-primary-400 text-base sm:text-lg">
                      ₹{order.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {order.orderStatus?.toLowerCase() || 'pending'}
                    </p>
                  </div>
                </div>
              </Link>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                totalCount={totalCount}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OrderCardSkeleton />
        </div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}

