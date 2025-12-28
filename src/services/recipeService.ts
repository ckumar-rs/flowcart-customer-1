import { productService, ProductListResult } from './productService';
import { Product } from '@/types';

/**
 * Recipe Service
 * Recipes are products that have a videoUrl (preparation/cooking videos)
 */
export const recipeService = {
  /**
   * Get recipes (products with videos) by business ID with pagination
   * Filters products to only return those with videoUrl
   */
  async getByBusiness(
    businessId: string,
    pageNumber: number = 1,
    pageSize: number = 20,
    categoryId?: string,
    searchTerm?: string
  ): Promise<ProductListResult> {
    // Fetch all products (we'll filter for videos client-side)
    // Note: In a production app, you might want a dedicated backend endpoint
    // that filters products with videos server-side for better performance
    const result = await productService.getByBusiness(
      businessId,
      pageNumber,
      pageSize * 3, // Fetch more to account for filtering
      categoryId,
      searchTerm
    );

    // Filter products that have videoUrl OR recipeUrl (webpage link)
    const recipes = result.products.filter(
      (product) => 
        (product.videoUrl && product.videoUrl.trim() !== '') ||
        (product.recipeUrl && product.recipeUrl.trim() !== '')
    );

    // Calculate pagination for filtered results
    const totalRecipes = recipes.length;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecipes = recipes.slice(startIndex, endIndex);

    return {
      products: paginatedRecipes,
      totalCount: totalRecipes,
      pageNumber,
      pageSize,
      totalPages: Math.ceil(totalRecipes / pageSize),
    };
  },

  /**
   * Search recipes (products with videos)
   */
  async search(
    businessId: string,
    query: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<ProductListResult> {
    const result = await productService.search(businessId, query, pageNumber, pageSize * 3);

    // Filter products that have videoUrl OR recipeUrl (webpage link)
    const recipes = result.products.filter(
      (product) => 
        (product.videoUrl && product.videoUrl.trim() !== '') ||
        (product.recipeUrl && product.recipeUrl.trim() !== '')
    );

    const totalRecipes = recipes.length;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecipes = recipes.slice(startIndex, endIndex);

    return {
      products: paginatedRecipes,
      totalCount: totalRecipes,
      pageNumber,
      pageSize,
      totalPages: Math.ceil(totalRecipes / pageSize),
    };
  },

  /**
   * Get all recipes for a business (no pagination, for initial load)
   */
  async getAllByBusiness(businessId: string): Promise<Product[]> {
    let allRecipes: Product[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const result = await productService.getByBusiness(businessId, page, pageSize);
      const recipes = result.products.filter(
        (product) => product.videoUrl && product.videoUrl.trim() !== ''
      );
      allRecipes = [...allRecipes, ...recipes];
      
      hasMore = result.products.length === pageSize && recipes.length > 0;
      page++;
      
      // Safety limit
      if (page > 50) break;
    }

    return allRecipes;
  },
};

