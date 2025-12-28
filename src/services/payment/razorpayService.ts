import { apiClient } from '../api/client';
import { endpoints } from '../api/config';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    contact: string;
    email: string;
    name: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const razorpayService = {
  /**
   * Load Razorpay script
   */
  loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  },

  /**
   * Create Razorpay order on backend
   */
  async createOrder(orderData: {
    orderId: string;
    amount: number;
    currency: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  }): Promise<{ orderId: string; keyId: string }> {
    const response = await apiClient.post(endpoints.payments.razorpay.create, orderData);
    return response.data;
  },

  /**
   * Verify payment on backend
   */
  async verifyPayment(paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    orderId: string;
  }): Promise<boolean> {
    try {
      const response = await apiClient.post(endpoints.payments.razorpay.verify, paymentData);
      return response.data.success === true;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  },

  /**
   * Process Razorpay payment
   */
  async processPayment(
    orderData: {
      orderId: string;
      amount: number;
      currency: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      businessName: string;
    },
    onSuccess: (paymentId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Load Razorpay script
      await this.loadScript();

      // Create order on backend
      const { orderId: razorpayOrderId, keyId } = await this.createOrder({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
      });

      // Initialize Razorpay
      const options: RazorpayOptions = {
        key: keyId,
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: orderData.currency,
        name: orderData.businessName,
        description: `Order #${orderData.orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          contact: orderData.customerPhone,
          email: orderData.customerEmail,
          name: orderData.customerName,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          // Verify payment
          const verified = await this.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderData.orderId,
          });

          if (verified) {
            onSuccess(response.razorpay_payment_id);
          } else {
            onError('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            onError('Payment cancelled by user');
          },
        },
        theme: {
          color: '#1D828E',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      onError(error.message || 'Failed to process payment');
    }
  },
};

