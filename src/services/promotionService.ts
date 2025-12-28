import apiClient from './api/client';
import { endpoints } from './api/config';

export interface Promotion {
  promotionId: string;
  businessId: string;
  promotionCode?: string;
  promotionName: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface PromotionValidationRequest {
  orderAmount: number;
  customerId?: string;
}

export interface PromotionValidationResponse {
  isValid: boolean;
  discountAmount: number;
  finalAmount: number;
  errorMessage?: string;
}

export const promotionService = {
  /**
   * Get promotion by code
   */
  async getByCode(businessId: string, code: string): Promise<Promotion | null> {
    try {
      const response = await apiClient.get<Promotion>(
        endpoints.promotions.getByCode(businessId, code)
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Validate promotion and calculate discount
   */
  async validate(
    promotionId: string,
    orderAmount: number,
    customerId?: string
  ): Promise<PromotionValidationResponse> {
    const response = await apiClient.post<PromotionValidationResponse>(
      endpoints.promotions.validate(promotionId),
      {
        orderAmount,
        customerId,
      }
    );
    return response.data;
  },
};

