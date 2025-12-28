import { apiClient } from './api/client';
import { endpoints } from './api/config';
import { Business } from '@/types';

export const businessService = {
  /**
   * Get business by ID
   */
  async getById(businessId: string): Promise<Business> {
    const response = await apiClient.get<Business>(endpoints.business.getById(businessId));
    return response.data;
  },

  /**
   * Get all businesses
   */
  async getAll(): Promise<Business[]> {
    const response = await apiClient.get<Business[]>(endpoints.business.getAll);
    return response.data;
  },
};

