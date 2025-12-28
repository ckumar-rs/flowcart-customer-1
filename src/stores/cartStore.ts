import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  businessId: string | null;
  
  // Actions
  setBusiness: (businessId: string) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number; // Returns number of unique items
  getTotalQuantity: () => number; // Returns total quantity of all items
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      businessId: null,

      setBusiness: (businessId: string) => {
        // Clear cart if switching businesses
        const currentBusinessId = get().businessId;
        if (currentBusinessId && currentBusinessId !== businessId) {
          set({ items: [], businessId });
        } else {
          set({ businessId });
        }
      },

      addItem: (product: Product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.productId);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.productId,
                product,
                quantity,
                price: product.price,
              },
            ],
          });
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter(item => item.productId !== productId),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        // Return number of unique items in cart (not total quantity)
        return get().items.length;
      },
      
      getTotalQuantity: () => {
        // Return total quantity of all items (for display purposes if needed)
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.productId === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'flowcart-cart-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
      partialize: (state) => ({
        items: state.items,
        businessId: state.businessId,
      }),
    }
  )
);
