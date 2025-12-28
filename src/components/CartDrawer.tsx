'use client';

import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  // IMPORTANT: All hooks must be called unconditionally
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  // Always render to maintain hook consistency - return empty fragment instead of null
  if (!isOpen) {
    return <></>;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col border-l border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50/50 to-transparent dark:from-primary-900/20">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-4">
                <ShoppingCart className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto" />
                <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">Your cart is empty</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 bg-white/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 hover:bg-white dark:hover:bg-gray-700/70 transition-all duration-200 border border-gray-100 dark:border-gray-600/50 shadow-sm">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-xl flex-shrink-0 overflow-hidden shadow-md">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1.5 truncate text-gray-900 dark:text-white">{item.product.name}</h3>
                    <p className="text-primary-600 dark:text-primary-400 font-black text-sm mb-2.5">
                      ₹{item.price.toFixed(2)} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 border-2 border-primary-200 dark:border-primary-700 rounded-xl bg-primary-50/50 dark:bg-primary-900/20">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.productId, item.quantity - 1);
                            } else {
                              removeItem(item.productId);
                              toast.success('Item removed from cart');
                            }
                          }}
                          className="p-1.5 hover:bg-primary-200/50 dark:hover:bg-primary-700/30 rounded-l-xl transition-all duration-200 active:scale-90"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 text-primary-700 dark:text-primary-300" />
                        </button>
                        <span className="w-8 text-center font-black text-sm text-primary-700 dark:text-primary-300">{item.quantity}</span>
                        <button
                          onClick={() => {
                            updateQuantity(item.productId, item.quantity + 1);
                          }}
                          className="p-1.5 hover:bg-primary-200/50 dark:hover:bg-primary-700/30 rounded-r-xl transition-all duration-200 active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 text-primary-700 dark:text-primary-300" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.productId);
                          toast.success('Item removed from cart');
                        }}
                        className="ml-auto p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 active:scale-90"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-5 space-y-4 shadow-2xl">
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                <span className="font-semibold">₹{getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-gray-200 dark:border-gray-700 pt-2.5">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300">₹{getTotal().toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white py-3 rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <span className="relative z-10">Proceed to Checkout</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

