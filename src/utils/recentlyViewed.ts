/**
 * Recently Viewed Products Utility
 * Stores and retrieves recently viewed products from localStorage
 */

import { Product } from '@/types';

const STORAGE_KEY = 'flowcart_recently_viewed';
const MAX_ITEMS = 10;

export function addToRecentlyViewed(product: Product): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let products: Product[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists (to move to top)
    products = products.filter(p => p.productId !== product.productId);

    // Add to beginning
    products.unshift(product);

    // Keep only max items
    products = products.slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving recently viewed product:', error);
  }
}

export function getRecentlyViewed(): Product[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading recently viewed products:', error);
    return [];
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

