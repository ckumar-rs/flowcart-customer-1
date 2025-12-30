/**
 * API Configuration
 * Reuses the same API endpoints as the mobile app
 */

// Backend API URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flowcartapi.azurewebsites.net/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://flowcartapi.azurewebsites.net/hubs';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  wsUrl: WS_URL,
  timeout: 30000,
};

// Helper function to build endpoint URLs
// Returns just the path - axios will combine it with baseURL
const buildUrl = (path: string): string => {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanPath;
};

// API Endpoints - matching mobile app structure
export const endpoints = {
  // Business
  business: {
    getById: (id: string) => buildUrl(`business/${id}`),
    getAll: buildUrl('business'),
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
      return buildUrl(`product/business/${businessId}${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id: string) => buildUrl(`product/${id}`),
    search: (businessId: string, query: string, pageNumber?: number, pageSize?: number) => {
      const params = new URLSearchParams();
      params.append('query', query);
      if (pageNumber) params.append('pageNumber', pageNumber.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      return buildUrl(`product/business/${businessId}/search?${params.toString()}`);
    },
  },
  
  // Categories
  categories: {
    getByBusiness: (businessId: string) => buildUrl(`categories/business/${businessId}`),
  },
  
  // Orders
  orders: {
    create: buildUrl('Order/mobile'), // Use mobile endpoint for anonymous orders (backend uses "Order" controller, singular)
    getById: (id: string) => buildUrl(`Order/${id}`),
    getByCustomer: (phone: string, businessId: string, pageNumber?: number, pageSize?: number) => {
      const params = new URLSearchParams();
      params.append('customerPhone', phone);
      if (pageNumber) params.append('pageNumber', pageNumber.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      return buildUrl(`Order/customer/${businessId}?${params.toString()}`);
    },
    getPending: (businessId: string, phone: string) => 
      buildUrl(`Order/customer/${businessId}?customerPhone=${encodeURIComponent(phone)}`), // Use customer endpoint and filter client-side, or use GetCustomerOrders which returns all orders
    updateStatus: (id: string) => buildUrl(`Order/${id}/status`),
    cancel: (id: string) => buildUrl(`Order/${id}/cancel`),
  },
  
  // Payments
  payments: {
    create: buildUrl('payments'),
    verify: (id: string) => buildUrl(`payments/${id}/verify`),
    razorpay: {
      create: buildUrl('payments/razorpay/create'),
      verify: buildUrl('payments/razorpay/verify'),
    },
    stripe: {
      create: buildUrl('payments/stripe/create'),
      confirm: buildUrl('payments/stripe/confirm'),
    },
  },
  
  // Auth
  auth: {
    login: buildUrl('auth/login'),
    register: buildUrl('auth/register'),
    logout: buildUrl('auth/logout'),
    refresh: buildUrl('auth/refresh'),
    changePassword: buildUrl('auth/change-password'),
    forgotPassword: buildUrl('auth/forgot-password'),
    resetPassword: buildUrl('auth/reset-password'),
    updateProfile: buildUrl('auth/profile'),
  },
  
  // Promotions
  promotions: {
    getByBusiness: (businessId: string) => buildUrl(`promotion/business/${businessId}`),
    getByCode: (businessId: string, code: string) => buildUrl(`promotion/business/${businessId}/code/${encodeURIComponent(code)}`),
    validate: (promotionId: string) => buildUrl(`promotion/${promotionId}/validate`),
  },
  
  // Feedback
  feedback: {
    submit: buildUrl('feedback'),
    getByProduct: (productId: string) => buildUrl(`feedback/product/${productId}`),
    getByOrder: (orderId: string) => buildUrl(`feedback/order/${orderId}`),
  },

  // Recommendations
  recommendations: {
    get: (businessId: string) => buildUrl(`recommendation/business/${businessId}/recommend`),
  },

  // AI Services
  ai: {
    chat: buildUrl('ai/chat'),
    semanticSearch: (businessId: string) => buildUrl(`ai/search/${businessId}`),
    imageSearch: (businessId: string) => buildUrl(`ai/image-search/${businessId}`),
    voiceSearch: (businessId: string) => buildUrl(`ai/voice-search/${businessId}`),
    sentimentAnalysis: buildUrl('ai/sentiment'),
    generateDescription: buildUrl('ai/generate-description'),
  },

  // Loyalty Points
  loyalty: {
    getCustomerStatus: (businessId: string) => buildUrl(`loyalty/customer/${businessId}/status`),
    redeemPoints: (customerId: string) => buildUrl(`loyalty/customer/${customerId}/redeem`),
    getTransactionHistory: (businessId: string) => buildUrl(`loyalty/customer/${businessId}/history`),
    getAvailableRewards: (businessId: string) => buildUrl(`loyalty/business/${businessId}/rewards`),
  },

  // Group Orders
  groupOrder: {
    create: buildUrl('group-order/create'),
    join: buildUrl('group-order/join'),
    getByCode: (groupCode: string) => buildUrl(`group-order/code/${groupCode}`),
    addItem: (groupOrderId: string) => buildUrl(`group-order/${groupOrderId}/items`),
    removeItem: (groupOrderId: string, itemId: string) => buildUrl(`group-order/${groupOrderId}/items/${itemId}`),
    lock: (groupOrderId: string) => buildUrl(`group-order/${groupOrderId}/lock`),
    calculateSplit: (groupOrderId: string) => buildUrl(`group-order/${groupOrderId}/split`),
    checkout: (groupOrderId: string) => buildUrl(`group-order/${groupOrderId}/checkout`),
  },
};

export default apiConfig;

