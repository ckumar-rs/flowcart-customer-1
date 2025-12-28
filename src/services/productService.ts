import { apiClient } from './api/client';
import { endpoints } from './api/config';
import { Product } from '@/types';

interface ProductListResponse {
  products?: Product[];
  Products?: Product[]; // PascalCase from C#
  totalCount?: number;
  TotalCount?: number;
  pageNumber?: number;
  PageNumber?: number;
  pageSize?: number;
  PageSize?: number;
  totalPages?: number;
  TotalPages?: number;
}

export interface ProductListResult {
  products: Product[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const productService = {
  /**
   * Get products by business ID with pagination
   * Backend returns ProductListDto with Products array and pagination info
   */
  async getByBusiness(
    businessId: string,
    pageNumber: number = 1,
    pageSize: number = 20,
    categoryId?: string,
    searchTerm?: string
  ): Promise<ProductListResult> {
    const response = await apiClient.get<ProductListResponse>(
      endpoints.products.getByBusiness(businessId, pageNumber, pageSize, categoryId, searchTerm)
    );
    // Backend returns { products: [] } or { Products: [] } depending on JSON serialization
    // Handle both camelCase and PascalCase
    const data = response.data;
    const products = data.products || data.Products || [];
    const totalCount = data.totalCount || data.TotalCount || 0;
    const currentPage = data.pageNumber || data.PageNumber || pageNumber;
    const currentPageSize = data.pageSize || data.PageSize || pageSize;
    const totalPages = data.totalPages || data.TotalPages || Math.ceil(totalCount / currentPageSize);
    
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      return {
        products: [],
        totalCount: 0,
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalPages: 0,
      };
    }
    
    // Parse AdditionalImages JSON string to array
    const parsedProducts = products.map(product => ({
      ...product,
      additionalImages: parseAdditionalImages((product as any).additionalImages || (product as any).AdditionalImages),
    }));
    
    return {
      products: parsedProducts,
      totalCount,
      pageNumber: currentPage,
      pageSize: currentPageSize,
      totalPages,
    };
  },

  /**
   * Get product by ID
   * Note: Backend GetProduct endpoint requires authorization.
   * For customer-facing apps, we fetch from business products list (which is anonymous)
   */
  async getById(productId: string, businessId?: string): Promise<Product> {
    // Get businessId from parameter or localStorage
    let actualBusinessId = businessId;
    if (!actualBusinessId && typeof window !== 'undefined') {
      // Use session service to get business ID
      const { sessionService } = require('./sessionService');
      actualBusinessId = sessionService.getCurrentBusinessId() || undefined;
    }
    
    if (!actualBusinessId) {
      throw new Error('Business ID is required to fetch product');
    }
    
    // Since GetProduct endpoint requires authorization, we fetch from business products list
    // and find the product by ID (this endpoint is anonymous)
    // Note: We fetch first page only for product lookup - in production, you might want to search more pages
    try {
      const result = await this.getByBusiness(actualBusinessId, 1, 100); // Fetch first 100 products
      const product = result.products.find(p => p.productId === productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Parse AdditionalImages
      return {
        ...product,
        additionalImages: parseAdditionalImages((product as any).additionalImages || (product as any).AdditionalImages),
      };
    } catch (error: any) {
      // If that fails, try the direct endpoint (might work if user is authenticated)
      try {
        const url = `${endpoints.products.getById(productId)}?businessId=${actualBusinessId}`;
        const response = await apiClient.get<Product>(url);
        return {
          ...response.data,
          additionalImages: parseAdditionalImages((response.data as any).additionalImages || (response.data as any).AdditionalImages),
        };
      } catch (directError) {
        // Re-throw the original error
        throw error;
      }
    }
  },

  /**
   * Search products with pagination
   * Backend returns ProductListDto with Products array and pagination info
   */
  async search(
    businessId: string,
    query: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    const response = await apiClient.get<ProductListResponse>(
      endpoints.products.search(businessId, query, pageNumber, pageSize)
    );
    // Backend returns { products: [] } or { Products: [] } depending on JSON serialization
    // Handle both camelCase and PascalCase
    const data = response.data;
    const products = data.products || data.Products || [];
    const totalCount = data.totalCount || data.TotalCount || 0;
    const currentPage = data.pageNumber || data.PageNumber || pageNumber;
    const currentPageSize = data.pageSize || data.PageSize || pageSize;
    const totalPages = data.totalPages || data.TotalPages || Math.ceil(totalCount / currentPageSize);
    
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      return {
        products: [],
        totalCount: 0,
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalPages: 0,
      };
    }
    
    // Parse AdditionalImages JSON string to array
    const parsedProducts = products.map(product => ({
      ...product,
      additionalImages: parseAdditionalImages((product as any).additionalImages || (product as any).AdditionalImages),
    }));
    
    return {
      products: parsedProducts,
      totalCount,
      pageNumber: currentPage,
      pageSize: currentPageSize,
      totalPages,
    };
  },
};

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

