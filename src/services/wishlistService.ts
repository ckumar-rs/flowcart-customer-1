import { apiClient } from './api/client';
import { Product } from '@/types';
import { endpoints } from './api/config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const wishlistService = {
  /**
   * Get wishlist items from API
   */
  async getWishlist(businessId?: string): Promise<Product[]> {
    try {
      const params = businessId ? `?businessId=${businessId}` : '';
      const response = await apiClient.get(`${API_BASE_URL}/api/wishlist${params}`);
      return response.data.map((item: any) => item.product);
    } catch (error: any) {
      // Fallback to localStorage if API fails
      if (error.response?.status === 401) {
        return this.getWishlistLocal();
      }
      console.error('Error fetching wishlist:', error);
      return this.getWishlistLocal();
    }
  },

  /**
   * Add product to wishlist (API)
   */
  async addToWishlist(product: Product): Promise<void> {
    try {
      await apiClient.post(`${API_BASE_URL}/api/wishlist`, {
        businessId: product.businessId,
        productId: product.productId,
      });
      // Also update localStorage as backup
      this.addToWishlistLocal(product);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Fallback to localStorage if not authenticated
        this.addToWishlistLocal(product);
      } else {
        throw error;
      }
    }
  },

  /**
   * Remove product from wishlist (API)
   */
  async removeFromWishlist(productId: string, businessId?: string): Promise<void> {
    try {
      await apiClient.delete(`${API_BASE_URL}/api/wishlist/${productId}?businessId=${businessId}`);
      // Also update localStorage
      this.removeFromWishlistLocal(productId);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Fallback to localStorage if not authenticated
        this.removeFromWishlistLocal(productId);
      } else {
        throw error;
      }
    }
  },

  /**
   * Check if product is in wishlist (API)
   */
  async isInWishlist(productId: string, businessId: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/wishlist/check/${productId}?businessId=${businessId}`);
      return response.data;
    } catch (error: any) {
      // Fallback to localStorage check
      if (error.response?.status === 401) {
        return this.isInWishlistLocal(productId);
      }
      return false;
    }
  },

  // LocalStorage fallback methods
  getWishlistLocal(): Product[] {
    if (typeof window !== 'undefined') {
      const wishlistStr = localStorage.getItem('wishlist');
      if (wishlistStr) {
        try {
          return JSON.parse(wishlistStr);
        } catch {
          return [];
        }
      }
    }
    return [];
  },

  addToWishlistLocal(product: Product): void {
    const wishlist = this.getWishlistLocal();
    if (!wishlist.find(p => p.productId === product.productId)) {
      wishlist.push(product);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      }
    }
  },

  removeFromWishlistLocal(productId: string): void {
    const wishlist = this.getWishlistLocal().filter(p => p.productId !== productId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  },

  isInWishlistLocal(productId: string): boolean {
    return this.getWishlistLocal().some(p => p.productId === productId);
  },

  /**
   * Clear wishlist
   */
  clearWishlist(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wishlist');
    }
  },
};

