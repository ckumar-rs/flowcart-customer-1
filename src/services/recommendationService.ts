import apiClient from './api/client';
import { endpoints } from './api/config';
import { Product } from '@/types';

/**
 * Parse AdditionalImages JSON string to array
 */
function parseAdditionalImages(additionalImages: string | string[] | undefined | null): string[] {
  if (!additionalImages) return [];
  
  // If already an array, return it
  if (Array.isArray(additionalImages)) {
    return additionalImages.filter(img => img && typeof img === 'string');
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof additionalImages === 'string') {
    try {
      const parsed = JSON.parse(additionalImages);
      if (Array.isArray(parsed)) {
        return parsed.filter(img => img && typeof img === 'string');
      }
    } catch (e) {
      // If parsing fails, treat it as a single image URL
      return [additionalImages];
    }
  }
  
  return [];
}

interface RecommendationRequest {
  customerId?: string;
  recentProductIds?: string[];
  limit?: number;
}

export const recommendationService = {
  /**
   * Get product recommendations
   */
  async getRecommendations(
    businessId: string,
    customerId?: string,
    recentProductIds?: string[],
    limit: number = 10
  ): Promise<Product[]> {
    try {
      const response = await apiClient.post<{ products: Product[] }>(
        endpoints.recommendations.get(businessId),
        {
          customerId: customerId || null,
          recentProductIds: recentProductIds || null,
          limit,
        }
      );
      const products = response.data?.products || [];
      // Ensure all products have required fields with defaults
      return products.map(product => ({
        ...product,
        price: product.price ?? 0,
        isAvailable: product.isAvailable ?? true,
        additionalImages: parseAdditionalImages((product as any).additionalImages || (product as any).AdditionalImages),
      }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  },

  /**
   * Get similar products based on current product
   */
  async getSimilarProducts(
    businessId: string,
    productId: string,
    limit: number = 5
  ): Promise<Product[]> {
    try {
      return await this.getRecommendations(businessId, undefined, [productId], limit);
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  },
};

