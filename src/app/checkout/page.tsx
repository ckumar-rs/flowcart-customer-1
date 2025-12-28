'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/orderService';
import { PaymentMethod } from '@/types';
import GuestCheckoutNotice from '@/components/GuestCheckoutNotice';
import PromoCodeInput from '@/components/PromoCodeInput';
import CheckoutLoyaltyPoints from '@/components/CheckoutLoyaltyPoints';
import { getErrorMessage } from '@/utils/errorMessages';
import { Promotion } from '@/services/promotionService';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, businessId, getTotal, clearCart } = useCartStore();
  const { addOrder, setLoading } = useOrderStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod['type']>('COD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { user } = useAuthStore();

  useEffect(() => {
    if (items.length === 0 || !businessId) {
      router.push('/');
    }
    
    // Pre-fill form if user is logged in (optional enhancement)
    if (user) {
      if (!customerName) setCustomerName(`${user.firstName} ${user.lastName}`);
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
    
    // Load customer phone from localStorage if available (from previous orders)
    if (typeof window !== 'undefined') {
      const phone = localStorage.getItem('customer_phone');
      if (phone && !customerPhone) {
        setCustomerPhone(phone);
      }
    }
  }, [items, businessId, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!businessId) {
        throw new Error('Business ID not found');
      }

      // Create order first
      const orderData = {
        businessId,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        orderItems: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          specialInstructions: item.specialInstructions,
        })),
        paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
        promotionCode: appliedPromotion?.promotionCode || undefined,
        discountAmount: discountAmount,
      };

      const order = await orderService.create(orderData);
      
      // Validate order ID before proceeding
      if (!order || !order.orderId) {
        throw new Error('Order created but order ID is missing. Please check your orders.');
      }
      
      addOrder(order);
      
      // Store customer phone for future use
      if (typeof window !== 'undefined' && customerPhone) {
        localStorage.setItem('customer_phone', customerPhone);
      }

      // Process payment based on method
      if (paymentMethod === 'COD') {
        // COD - no payment processing needed
        clearCart();
        toast.success('Order placed successfully!');
        // Use window.location for reliable redirect
        window.location.href = `/order/${order.orderId}`;
      } else if (paymentMethod === 'RAZORPAY') {
        // Process Razorpay payment
        setSubmitting(false); // Allow user to interact with Razorpay
        const { razorpayService } = await import('@/services/payment/razorpayService');
        await razorpayService.processPayment(
          {
            orderId: order.orderId,
            amount: getTotal() - discountAmount,
            currency: 'INR',
            customerName: customerName || 'Customer',
            customerPhone: customerPhone,
            customerEmail: customerEmail || '',
            businessName: 'FlowCart',
          },
          (paymentId) => {
            // Payment successful
            toast.success('Payment successful!');
            clearCart();
            // Use window.location for reliable redirect
            window.location.href = `/order/${order.orderId}`;
          },
          (error) => {
            toast.error(error || 'Payment failed. Please try again.');
            setError(error);
            setSubmitting(false);
          }
        );
      } else if (paymentMethod === 'STRIPE') {
        // Stripe payment would require card element
        // For now, redirect to order confirmation
        // In production, integrate Stripe Elements
        clearCart();
        toast.success('Order created. Please complete payment.');
        // Use window.location for reliable redirect
        window.location.href = `/order/${order.orderId}`;
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        // Use window.location for reliable redirect
        window.location.href = `/order/${order.orderId}`;
      }
    } catch (err: any) {
      const errorDetails = getErrorMessage(err);
      toast.error(errorDetails.message);
      setError(errorDetails.message);
      setSubmitting(false);
    }
  };

  // Always render to maintain hook consistency
  if (items.length === 0 || !businessId) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty or business not found</p>
          <Link
            href={businessId ? `/catalog/${businessId}` : '/'}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(29,130,142,0.05),transparent_50%)]" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <h1 className="text-2xl lg:text-3xl font-black mb-5 dark:text-white">Checkout</h1>
        
        {/* Guest Checkout Notice */}
        {!user && <GuestCheckoutNotice />}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Information */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                <h2 className="text-base sm:text-lg font-black dark:text-white">Customer Information</h2>
                {!user && (
                  <Link
                    href="/login"
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold text-center sm:text-right"
                  >
                    Login for faster checkout
                  </Link>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Name {user ? '(Optional)' : ''}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={user ? `${user.firstName} ${user.lastName}` : 'Your name'}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    placeholder="10-digit phone number"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Required for order updates and tracking
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={user?.email || 'your@email.com'}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    For order confirmation and updates
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-base sm:text-lg font-black dark:text-white mb-4">Payment Method</h2>
              <div className="space-y-2.5">
                {['COD', 'RAZORPAY', 'STRIPE'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      paymentMethod === method
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod['type'])}
                      className="mr-3 w-4 h-4 text-primary-600"
                    />
                    <span className="font-bold text-sm dark:text-gray-200">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Loyalty Points */}
            {businessId && (
              <CheckoutLoyaltyPoints
                businessId={businessId}
                orderTotal={total}
                onRedeem={(discount) => {
                  // Add points redemption discount (can be combined with promo)
                  setDiscountAmount(prev => prev + discount);
                  toast.success('Points redeemed! Discount applied.');
                }}
              />
            )}

            {/* Promo Code */}
            <PromoCodeInput
              businessId={businessId}
              orderAmount={getTotal()}
              onPromoApplied={(promo, discount) => {
                setAppliedPromotion(promo);
                setDiscountAmount(discount);
              }}
              customerId={user?.userId}
            />

            {/* Special Instructions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-base sm:text-lg font-black dark:text-white mb-4">Special Instructions</h2>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-200/50 dark:border-gray-700/50 sticky top-4">
              <h2 className="text-base sm:text-lg font-black dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm dark:text-gray-300">
                    <span className="font-medium">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {discountAmount > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount:</span>
                    <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4 mt-4">
                <div className="flex justify-between text-lg font-black dark:text-white">
                  <span>Total:</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">₹{(total - discountAmount).toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !customerPhone.trim()}
                className="w-full mt-5 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white py-3 rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

