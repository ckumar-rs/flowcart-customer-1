/**
 * API Configuration
 * Reuses the same API endpoints as the mobile app
 * 
 * When deployed to Vercel (HTTPS), we use the Next.js API proxy to avoid Mixed Content errors
 * The proxy route at /api/proxy/[...path] forwards requests to the HTTP backend server-side
 */

// Check if we're in the browser and on HTTPS (Vercel)
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const useProxy = isHttps && process.env.NEXT_PUBLIC_USE_API_PROXY !== 'false';

// Backend API URLs
// Use proxy when on HTTPS (Vercel), otherwise use direct HTTP
const API_BASE_URL = useProxy 
  ? '/api/proxy'  // Use Next.js API proxy (server-side, no Mixed Content)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://20.42.90.94/flowcartapi/api');

// WebSocket still needs direct connection (can't proxy WebSocket easily)
// For WebSocket, we'll need to handle it differently or use a different approach
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://20.42.90.94/flowcartapi/hubs';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  wsUrl: WS_URL,
  timeout: 30000,
};

// Helper function to build endpoint URLs
// When using proxy: baseURL = '/api/proxy', so endpoint should just be the path
// When not using proxy: baseURL = 'http://...', so endpoint should just be the path
// Axios will combine baseURL + endpoint automatically
const buildUrl = (path: string): string => {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Always return just the path - axios will combine it with baseURL
  // Proxy mode: baseURL (/api/proxy) + path (business/123) = /api/proxy/business/123 ✅
  // Direct mode: baseURL (http://...) + path (business/123) = http://.../business/123 ✅
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

