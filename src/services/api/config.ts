/**
 * API Configuration
 * Reuses the same API endpoints as the mobile app
 */

// Backend API URLs
// Default to HTTP port 53899, can be overridden via environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://20.42.90.94/flowcartapi/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://20.42.90.94/flowcartapi/hubs';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  wsUrl: WS_URL,
  timeout: 30000,
};

// API Endpoints - matching mobile app structure
export const endpoints = {
  // Business
  business: {
    getById: (id: string) => `${API_BASE_URL}/business/${id}`,
    getAll: `${API_BASE_URL}/business`,
  },
  
  // Products (using singular "product" to match backend and mobile app)
  products: {
    getByBusiness: (businessId: string, pageNumber?: number, pageSize?: number, categoryId?: string, searchTerm?: string) => {
      const params = new URLSearchParams();
      if (pageNumber) params.append('pageNumber', pageNumber.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      if (categoryId) params.append('categoryId', categoryId);
      if (searchTerm) params.append('searchTerm', searchTerm);
      const queryString = params.toString();
      return `${API_BASE_URL}/product/business/${businessId}${queryString ? `?${queryString}` : ''}`;
    },
    getById: (id: string) => `${API_BASE_URL}/product/${id}`,
    search: (businessId: string, query: string, pageNumber?: number, pageSize?: number) => {
      const params = new URLSearchParams();
      params.append('query', query);
      if (pageNumber) params.append('pageNumber', pageNumber.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      return `${API_BASE_URL}/product/business/${businessId}/search?${params.toString()}`;
    },
  },
  
  // Categories
  categories: {
    getByBusiness: (businessId: string) => `${API_BASE_URL}/categories/business/${businessId}`,
  },
  
  // Orders
  orders: {
    create: `${API_BASE_URL}/Order/mobile`, // Use mobile endpoint for anonymous orders (backend uses "Order" controller, singular)
    getById: (id: string) => `${API_BASE_URL}/Order/${id}`,
    getByCustomer: (phone: string, businessId: string, pageNumber?: number, pageSize?: number) => {
      const params = new URLSearchParams();
      params.append('customerPhone', phone);
      if (pageNumber) params.append('pageNumber', pageNumber.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      return `${API_BASE_URL}/Order/customer/${businessId}?${params.toString()}`;
    },
    getPending: (businessId: string, phone: string) => 
      `${API_BASE_URL}/Order/customer/${businessId}?customerPhone=${encodeURIComponent(phone)}`, // Use customer endpoint and filter client-side, or use GetCustomerOrders which returns all orders
    updateStatus: (id: string) => `${API_BASE_URL}/Order/${id}/status`,
    cancel: (id: string) => `${API_BASE_URL}/Order/${id}/cancel`,
  },
  
  // Payments
  payments: {
    create: `${API_BASE_URL}/payments`,
    verify: (id: string) => `${API_BASE_URL}/payments/${id}/verify`,
    razorpay: {
      create: `${API_BASE_URL}/payments/razorpay/create`,
      verify: `${API_BASE_URL}/payments/razorpay/verify`,
    },
    stripe: {
      create: `${API_BASE_URL}/payments/stripe/create`,
      confirm: `${API_BASE_URL}/payments/stripe/confirm`,
    },
  },
  
  // Auth
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
    updateProfile: `${API_BASE_URL}/auth/profile`,
  },
  
  // Promotions
  promotions: {
    getByBusiness: (businessId: string) => `${API_BASE_URL}/promotion/business/${businessId}`,
    getByCode: (businessId: string, code: string) => `${API_BASE_URL}/promotion/business/${businessId}/code/${encodeURIComponent(code)}`,
    validate: (promotionId: string) => `${API_BASE_URL}/promotion/${promotionId}/validate`,
  },
  
  // Feedback
  feedback: {
    submit: `${API_BASE_URL}/feedback`,
    getByProduct: (productId: string) => `${API_BASE_URL}/feedback/product/${productId}`,
    getByOrder: (orderId: string) => `${API_BASE_URL}/feedback/order/${orderId}`,
  },

  // Recommendations
  recommendations: {
    get: (businessId: string) => `${API_BASE_URL}/recommendation/business/${businessId}/recommend`,
  },

  // AI Services
  ai: {
    chat: `${API_BASE_URL}/ai/chat`,
    semanticSearch: (businessId: string) => `${API_BASE_URL}/ai/search/${businessId}`,
    imageSearch: (businessId: string) => `${API_BASE_URL}/ai/image-search/${businessId}`,
    voiceSearch: (businessId: string) => `${API_BASE_URL}/ai/voice-search/${businessId}`,
    sentimentAnalysis: `${API_BASE_URL}/ai/sentiment`,
    generateDescription: `${API_BASE_URL}/ai/generate-description`,
  },

  // Loyalty Points
  loyalty: {
    getCustomerStatus: (businessId: string) => `${API_BASE_URL}/loyalty/customer/${businessId}/status`,
    redeemPoints: (customerId: string) => `${API_BASE_URL}/loyalty/customer/${customerId}/redeem`,
    getTransactionHistory: (businessId: string) => `${API_BASE_URL}/loyalty/customer/${businessId}/history`,
    getAvailableRewards: (businessId: string) => `${API_BASE_URL}/loyalty/business/${businessId}/rewards`,
  },

  // Group Orders
  groupOrder: {
    create: `${API_BASE_URL}/group-order/create`,
    join: `${API_BASE_URL}/group-order/join`,
    getByCode: (groupCode: string) => `${API_BASE_URL}/group-order/code/${groupCode}`,
    addItem: (groupOrderId: string) => `${API_BASE_URL}/group-order/${groupOrderId}/items`,
    removeItem: (groupOrderId: string, itemId: string) => `${API_BASE_URL}/group-order/${groupOrderId}/items/${itemId}`,
    lock: (groupOrderId: string) => `${API_BASE_URL}/group-order/${groupOrderId}/lock`,
    calculateSplit: (groupOrderId: string) => `${API_BASE_URL}/group-order/${groupOrderId}/split`,
    checkout: (groupOrderId: string) => `${API_BASE_URL}/group-order/${groupOrderId}/checkout`,
  },
};

export default apiConfig;

