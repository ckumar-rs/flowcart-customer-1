import { apiClient } from './api/client';
import { endpoints } from './api/config';
import { Feedback } from '@/types';

export interface ReviewRequest {
  orderId?: string;
  productId?: string;
  customerPhone: string;
  rating: number;
  comment?: string;
}

export const reviewService = {
  /**
   * Submit a review
   */
  async submitReview(review: ReviewRequest): Promise<Feedback> {
    const response = await apiClient.post<Feedback>(endpoints.feedback.submit, review);
    return response.data;
  },

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string): Promise<Feedback[]> {
    const response = await apiClient.get<Feedback[]>(endpoints.feedback.getByProduct(productId));
    return response.data;
  },

  /**
   * Get reviews for an order
   */
  async getOrderReviews(orderId: string): Promise<Feedback[]> {
    const response = await apiClient.get<Feedback[]>(endpoints.feedback.getByOrder(orderId));
    return response.data;
  },
};

