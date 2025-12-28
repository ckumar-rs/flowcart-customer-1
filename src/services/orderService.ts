import { apiClient } from './api/client';
import { endpoints } from './api/config';
import { Order, CartItem } from '@/types';

interface CreateOrderRequest {
  businessId: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  orderItems: {
    productId: string;
    quantity: number;
    unitPrice: number;
    specialInstructions?: string;
  }[];
  paymentMethod: string;
  specialInstructions?: string;
  promotionCode?: string;
  totalAmount?: number;
  discountAmount?: number;
}

// Mobile order request format (matches backend MobileOrderRequest - Newtonsoft.Json uses camelCase by default)
interface MobileOrderRequest {
  businessId: string;
  customerName: string; // Required in backend
  customerPhone: string;
  customerEmail?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }[];
  paymentMethod: string;
  totalAmount: number;
  discountAmount: number;
  promotionCode?: string;
}

export const orderService = {
  /**
   * Create a new order (uses mobile endpoint for anonymous access)
   */
  async create(orderData: CreateOrderRequest): Promise<Order> {
    // Calculate total amount
    const totalAmount = orderData.orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const discountAmount = orderData.discountAmount || 0;

    // Convert to mobile order request format (Newtonsoft.Json uses camelCase by default)
    const mobileRequest: MobileOrderRequest = {
      businessId: orderData.businessId,
      customerName: orderData.customerName || 'Guest Customer', // Required field, provide default
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail || undefined,
      items: orderData.orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
        specialInstructions: item.specialInstructions || undefined,
      })),
      paymentMethod: orderData.paymentMethod,
      totalAmount: totalAmount - discountAmount,
      discountAmount: discountAmount,
      promotionCode: orderData.promotionCode || undefined,
    };

    try {
      console.log('Creating order at:', endpoints.orders.create);
      console.log('Order request:', JSON.stringify(mobileRequest, null, 2));
      
      const response = await apiClient.post<{ orderId: string; orderNumber: string; status: string; message: string }>(
        endpoints.orders.create,
        mobileRequest
      );
      
      console.log('Order creation response:', response.data);
      
      // Get orderId from response
      const orderId = response.data.orderId;
      if (!orderId) {
        throw new Error('Order ID not returned from server');
      }
      
      // Try to fetch the full order details, but if it fails, return minimal order object
      try {
        const order = await this.getById(orderId, orderData.businessId);
        return order;
      } catch (fetchError: any) {
        console.warn('Failed to fetch full order details immediately after creation:', fetchError);
        // Return a minimal order object so redirect can still work
        // The order confirmation page will fetch the full details
        return {
          orderId: orderId,
          orderNumber: response.data.orderNumber || '',
          businessId: orderData.businessId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          orderItems: [],
          totalAmount: orderData.totalAmount || 0,
          discountAmount: orderData.discountAmount || 0,
          orderStatus: response.data.status || 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: orderData.paymentMethod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Order;
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);
      
      // Provide more helpful error message
      if (error.response?.status === 404) {
        throw new Error(`Order endpoint not found. Please verify the API is running at ${endpoints.orders.create}`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication required. Please try again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Get order by ID
   * Note: Backend requires businessId query parameter
   */
  async getById(orderId: string, businessId?: string): Promise<Order> {
    let url = endpoints.orders.getById(orderId);
    if (businessId) {
      url += `?businessId=${encodeURIComponent(businessId)}`;
    }
    
    console.log('Fetching order from:', url);
    
    const response = await apiClient.get<any>(url); // Use any to handle both camelCase and PascalCase
    const data = response.data;
    
    console.log('Raw order data:', data);
    
    // Normalize response to camelCase (backend returns PascalCase)
    const normalized: Order = {
      orderId: data.orderId || data.OrderId || orderId,
      orderNumber: data.orderNumber || data.OrderNumber || '',
      businessId: data.businessId || data.BusinessId || businessId || '',
      customerName: data.customerName || data.CustomerName,
      customerPhone: data.customerPhone || data.CustomerPhone || '',
      customerEmail: data.customerEmail || data.CustomerEmail,
      orderItems: (data.orderItems || data.OrderItems || []).map((item: any) => ({
        orderItemId: item.orderItemId || item.OrderItemId || '',
        productId: item.productId || item.ProductId || '',
        productName: item.productName || item.ProductName || 'Unknown Product',
        quantity: item.quantity || item.Quantity || 0,
        unitPrice: item.unitPrice ?? item.UnitPrice ?? 0,
        totalPrice: item.totalPrice ?? item.TotalPrice ?? 0,
        specialInstructions: item.specialInstructions || item.SpecialInstructions,
      })),
      totalAmount: data.totalAmount ?? data.TotalAmount ?? 0,
      discountAmount: data.discountAmount ?? data.DiscountAmount,
      taxAmount: data.taxAmount ?? data.TaxAmount,
      deliveryFee: data.deliveryFee ?? data.DeliveryFee,
      orderStatus: data.orderStatus || data.OrderStatus || 'PENDING',
      paymentStatus: data.paymentStatus || data.PaymentStatus || 'PENDING',
      paymentMethod: data.paymentMethod || data.PaymentMethod,
      specialInstructions: data.specialInstructions || data.SpecialInstructions,
      createdAt: data.createdAt || data.CreatedAt || new Date().toISOString(),
      updatedAt: data.updatedAt || data.UpdatedAt || new Date().toISOString(),
    };
    
    console.log('Normalized order:', normalized);
    
    return normalized;
  },

  /**
   * Get orders by customer phone with pagination
   */
  async getByCustomer(
    phone: string, 
    businessId: string, 
    pageNumber: number = 1, 
    pageSize: number = 20
  ): Promise<{ orders: Order[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }> {
    const response = await apiClient.get<{
      orders?: Order[];
      Orders?: Order[]; // PascalCase from C#
      totalCount?: number;
      TotalCount?: number;
      pageNumber?: number;
      PageNumber?: number;
      pageSize?: number;
      PageSize?: number;
      totalPages?: number;
      TotalPages?: number;
    }>(
      endpoints.orders.getByCustomer(phone, businessId, pageNumber, pageSize)
    );
    
    const data = response.data;
    const orders = data.orders || data.Orders || [];
    
    return {
      orders: Array.isArray(orders) ? orders : [],
      totalCount: data.totalCount || data.TotalCount || 0,
      pageNumber: data.pageNumber || data.PageNumber || pageNumber,
      pageSize: data.pageSize || data.PageSize || pageSize,
      totalPages: data.totalPages || data.TotalPages || 0,
    };
  },

  /**
   * Get pending orders
   */
  async getPending(businessId: string, phone: string): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(
      endpoints.orders.getPending(businessId, phone)
    );
    return response.data;
  },

  /**
   * Cancel order
   */
  async cancel(orderId: string, reason?: string): Promise<void> {
    await apiClient.post(endpoints.orders.cancel(orderId), { reason });
  },
};

