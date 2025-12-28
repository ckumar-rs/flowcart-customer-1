import apiClient from './api/client';
import {
  GroupOrderDto,
  CreateGroupOrderRequest,
  JoinGroupOrderRequest,
  AddItemToGroupOrderRequest,
  GroupOrderItemDto,
  GroupOrderSplitDto,
  CheckoutGroupOrderRequest,
  Order,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const groupOrderService = {
  /**
   * Create a new group order
   */
  async createGroupOrder(request: CreateGroupOrderRequest): Promise<GroupOrderDto> {
    const response = await apiClient.post<GroupOrderDto>(
      `${API_BASE_URL}/api/group-order/create`,
      request
    );
    return response.data;
  },

  /**
   * Join a group order using group code
   */
  async joinGroupOrder(request: JoinGroupOrderRequest): Promise<GroupOrderDto> {
    const response = await apiClient.post<GroupOrderDto>(
      `${API_BASE_URL}/api/group-order/join`,
      request
    );
    return response.data;
  },

  /**
   * Get group order by code
   */
  async getGroupOrderByCode(groupCode: string): Promise<GroupOrderDto> {
    const response = await apiClient.get<GroupOrderDto>(
      `${API_BASE_URL}/api/group-order/code/${groupCode}`
    );
    return response.data;
  },

  /**
   * Add item to group order
   */
  async addItem(groupOrderId: string, memberId: string, request: AddItemToGroupOrderRequest): Promise<GroupOrderItemDto> {
    const response = await apiClient.post<GroupOrderItemDto>(
      `${API_BASE_URL}/api/group-order/${groupOrderId}/items?memberId=${memberId}`,
      request
    );
    return response.data;
  },

  /**
   * Remove item from group order
   */
  async removeItem(groupOrderId: string, itemId: string, memberId: string): Promise<void> {
    await apiClient.delete(
      `${API_BASE_URL}/api/group-order/${groupOrderId}/items/${itemId}?memberId=${memberId}`
    );
  },

  /**
   * Lock group order for checkout
   */
  async lockGroupOrder(groupOrderId: string, memberId: string): Promise<GroupOrderDto> {
    const response = await apiClient.post<GroupOrderDto>(
      `${API_BASE_URL}/api/group-order/${groupOrderId}/lock?memberId=${memberId}`
    );
    return response.data;
  },

  /**
   * Calculate bill split
   */
  async calculateSplit(groupOrderId: string): Promise<GroupOrderSplitDto> {
    const response = await apiClient.get<GroupOrderSplitDto>(
      `${API_BASE_URL}/api/group-order/${groupOrderId}/split`
    );
    return response.data;
  },

  /**
   * Checkout group order - creates actual order
   */
  async checkout(groupOrderId: string, request: CheckoutGroupOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>(
      `${API_BASE_URL}/api/group-order/${groupOrderId}/checkout`,
      request
    );
    return response.data;
  },
};

