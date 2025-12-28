'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingCheckoutButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { items, getTotal, getTotalQuantity } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);

  // Don't show on checkout page or product detail page
  const shouldHide = pathname?.includes('/checkout') || pathname?.includes('/product/');

  useEffect(() => {
    // Show button if cart has items and we're not on checkout/product detail page
    if (items.length > 0 && !shouldHide) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [items.length, shouldHide]);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleViewCart = () => {
    // Dispatch event to open cart drawer
    window.dispatchEvent(new CustomEvent('openCart'));
  };

  if (!isVisible || items.length === 0) {
    return null;
  }

  const total = getTotal();
  const itemCount = getTotalQuantity();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-md sm:max-w-sm mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700">
              <div className="flex items-center gap-2 text-white">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold text-sm">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                </span>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleViewCart}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  View Cart
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm relative overflow-hidden group"
                >
                  <span className="relative z-10">Checkout</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

