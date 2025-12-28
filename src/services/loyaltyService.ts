import apiClient from './api/client';
import { CustomerLoyaltyStatusDto, LoyaltyPointsTransactionDto, RedeemPointsRequest, RedeemPointsResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const loyaltyService = {
  /**
   * Get customer loyalty status (points, tier, rewards)
   */
  async getCustomerStatus(businessId: string, customerId?: string, customerPhone?: string): Promise<CustomerLoyaltyStatusDto> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (customerPhone) params.append('customerPhone', customerPhone);

    const response = await apiClient.get<CustomerLoyaltyStatusDto>(
      `${API_BASE_URL}/api/loyalty/customer/${businessId}/status?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Redeem loyalty points for a reward
   */
  async redeemPoints(customerId: string, request: RedeemPointsRequest): Promise<RedeemPointsResponse> {
    const response = await apiClient.post<RedeemPointsResponse>(
      `${API_BASE_URL}/api/loyalty/customer/${customerId}/redeem`,
      request
    );
    return response.data;
  },

  /**
   * Get loyalty points transaction history
   */
  async getTransactionHistory(
    businessId: string,
    customerId?: string,
    customerPhone?: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<LoyaltyPointsTransactionDto[]> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (customerPhone) params.append('customerPhone', customerPhone);
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());

    const response = await apiClient.get<LoyaltyPointsTransactionDto[]>(
      `${API_BASE_URL}/api/loyalty/customer/${businessId}/history?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get available rewards for a business
   */
  async getAvailableRewards(businessId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      `${API_BASE_URL}/api/loyalty/business/${businessId}/rewards`
    );
    return response.data;
  },
};

