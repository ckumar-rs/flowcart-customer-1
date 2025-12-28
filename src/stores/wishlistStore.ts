import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';
import { wishlistService } from '@/services/wishlistService';

interface WishlistStore {
  items: Product[];

  // Actions
  loadWishlist: () => Promise<void>;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      loadWishlist: async () => {
        const items = await wishlistService.getWishlist();
        set({ items });
      },

      addItem: async (product: Product) => {
        await wishlistService.addToWishlist(product);
        const items = await wishlistService.getWishlist();
        set({ items });
      },

      removeItem: async (productId: string) => {
        await wishlistService.removeFromWishlist(productId);
        const items = await wishlistService.getWishlist();
        set({ items });
      },

      isInWishlist: (productId: string) => {
        return get().items.some(p => p.productId === productId);
      },

      clearWishlist: () => {
        wishlistService.clearWishlist();
        set({ items: [] });
      },
    }),
    {
      name: 'flowcart-wishlist-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
    }
  )
);

