'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Clock, XCircle, Wifi, WifiOff, X, Download, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from '@/types';
import { orderService } from '@/services/orderService';
import signalRService from '@/services/signalrService';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import { sessionService } from '@/services/sessionService';
import ReviewForm from '@/components/ReviewForm';
import CancelOrderDialog from '@/components/CancelOrderDialog';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';
import ReorderButton from '@/components/ReorderButton';
import { generateOrderReceiptPDF, generateOrderInvoicePDF, printOrderReceipt } from '@/utils/pdfGenerator';
import { businessService } from '@/services/businessService';
import { Business } from '@/types';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const { updateOrder } = useOrderStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Get businessId from session service
    if (typeof window !== 'undefined') {
      const storedBusinessId = sessionService.getCurrentBusinessId();
      if (storedBusinessId) {
        setBusinessId(storedBusinessId);
        console.log('Loaded businessId from session:', storedBusinessId);
      }
      // Get phone from localStorage
      const phone = localStorage.getItem('customer_phone') || '';
      setCustomerPhone(phone);
      console.log('Loaded customer phone from localStorage:', phone);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      // Always try to load, even without businessId initially
      // The backend might work without it, or we can get it from the order response
      loadOrder();
    }
  }, [orderId]); // Only depend on orderId, businessId will be loaded from localStorage or order response

  useEffect(() => {
    if (order) {
      setupRealtimeUpdates();
      if (order.customerPhone) {
        setCustomerPhone(order.customerPhone);
      }
      if (order.businessId && !businessId) {
        setBusinessId(order.businessId);
      }
    }

    return () => {
      signalRService.disconnect();
    };
  }, [order]);

  const loadBusinessDetails = async (id: string) => {
    try {
      const businessData = await businessService.getById(id);
      setBusiness(businessData);
    } catch (error) {
      console.error('Error loading business details:', error);
      // Don't show error to user, just log it
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      console.log('Loading order:', orderId, 'with businessId:', businessId);
      
      // Get businessId from session service if not available
      let actualBusinessId = businessId;
      if (!actualBusinessId && typeof window !== 'undefined') {
        actualBusinessId = sessionService.getCurrentBusinessId();
      }
      
      // Pass businessId if available (backend requires it)
      const orderData = await orderService.getById(orderId, actualBusinessId || undefined);
      
      console.log('Order data received:', orderData);
      
      if (!orderData) {
        throw new Error('Order data is null or undefined');
      }
      
      setOrder(orderData);
      updateOrder(orderId, orderData);
      
      if (orderData.customerPhone) {
        setCustomerPhone(orderData.customerPhone);
      }
      if (orderData.businessId) {
        setBusinessId(orderData.businessId);
        // Store in localStorage for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('flowcart_business_id', orderData.businessId);
        }
        // Fetch business details for invoice generation
        loadBusinessDetails(orderData.businessId);
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        stack: error.stack,
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load order';
      toast.error(errorMessage);
      
      // Set order to null so error state is shown
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = async () => {
    if (!order?.businessId) return;

    try {
      await signalRService.connect(order.businessId);

      signalRService.onConnectionChange = (connected) => {
        setIsConnected(connected);
      };

      signalRService.onOrderStatusUpdate((updatedOrderId, status) => {
        if (updatedOrderId === orderId) {
          setOrder((prev) => prev ? { ...prev, orderStatus: status } : null);
          updateOrder(orderId, { orderStatus: status });
          toast.success(`Order status updated to ${status}`);
        }
      });

      signalRService.onNewOrder((newOrder) => {
        // Handle new order if needed
      });
    } catch (error) {
      console.error('Failed to setup real-time connection:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't find the order with ID: {orderId}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => loadOrder()}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href={businessId ? `/catalog/${businessId}` : '/'}
                className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Continue Shopping
              </Link>
              {customerPhone && (
                <Link
                  href={`/orders?phone=${customerPhone}`}
                  className="block w-full text-primary-600 dark:text-primary-400 py-2 px-4 rounded-lg font-medium hover:underline text-center"
                >
                  View All Orders
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <div className="flex items-center justify-end gap-2 text-sm mb-4">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Live updates enabled</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-400 dark:text-gray-500">Offline</span>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            {getStatusIcon(order.orderStatus)}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 dark:text-white">Order Confirmed!</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Your order has been placed successfully
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-left">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                <span className="font-semibold dark:text-white">{order.orderNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-semibold capitalize dark:text-white">{order.orderStatus?.toLowerCase() || 'pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                <span className="font-semibold capitalize dark:text-white">{order.paymentStatus?.toLowerCase() || 'pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
              <h2 className="text-base sm:text-lg font-semibold dark:text-white">Order Items</h2>
              <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                <button
                  onClick={() => business && generateOrderReceiptPDF(order, { business })}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm dark:bg-primary-700 dark:hover:bg-primary-600"
                  aria-label="Download receipt"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Receipt</span>
                  <span className="sm:hidden">PDF</span>
                </button>
                {business && (business.gstNumber || business.panNumber) && (
                  <button
                    onClick={() => generateOrderInvoicePDF(order, business)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm dark:bg-green-700 dark:hover:bg-green-600"
                    aria-label="Download invoice"
                  >
                    <Download className="w-4 h-4" />
                    Invoice
                  </button>
                )}
                <button
                  onClick={() => business && printOrderReceipt(order, business, false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm dark:bg-gray-700 dark:hover:bg-gray-600"
                  aria-label="Print receipt"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {order.orderItems && order.orderItems.length > 0 ? (
                order.orderItems.map((item) => (
                  <div key={item.orderItemId || item.productId} className="flex justify-between text-sm dark:text-gray-300">
                    <span>
                      {item.productName || 'Product'} x {item.quantity || 1}
                    </span>
                    <span>₹{(item.totalPrice || item.unitPrice * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No items found</p>
              )}
            </div>
          </div>

          {/* Order Status Timeline */}
          <OrderStatusTimeline order={order} />

          {/* Cancel Order Button - Only for pending orders */}
          {order.orderStatus !== 'COMPLETED' && order.orderStatus !== 'CANCELLED' && (
            <div className="mb-6 border-t pt-6">
              <button
                onClick={() => setShowCancelDialog(true)}
                className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            </div>
          )}

          {/* Review Section */}
          {order.orderStatus === 'COMPLETED' && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Review Your Order</h2>
              {customerPhone ? (
                showReviewForm ? (
                  <ReviewForm
                    orderId={order.orderId}
                    onSuccess={() => {
                      setShowReviewForm(false);
                    }}
                    onCancel={() => setShowReviewForm(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Write Review
                  </button>
                )
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    To submit a review, please use the phone number from your order confirmation.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            {order.businessId ? (
              <Link
                href={`/catalog/${order.businessId}`}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            ) : (
              <Link
                href="/"
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            )}
            {order.orderStatus === 'COMPLETED' && (
              <ReorderButton order={order} />
            )}
            {order.customerPhone ? (
              <Link
                href={`/orders?phone=${order.customerPhone}`}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
              >
                View Orders
              </Link>
            ) : (
              <Link
                href="/orders"
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
              >
                View Orders
              </Link>
            )}
          </div>
        </div>

        {/* Cancel Order Dialog */}
        <CancelOrderDialog
          orderId={order.orderId}
          orderNumber={order.orderNumber}
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onSuccess={() => {
            loadOrder();
          }}
        />
      </div>
    </div>
  );
}
