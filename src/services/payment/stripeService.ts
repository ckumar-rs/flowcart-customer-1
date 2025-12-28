import { apiClient } from '../api/client';
import { endpoints } from '../api/config';

declare global {
  interface Window {
    Stripe: any;
  }
}

export const stripeService = {
  /**
   * Load Stripe script
   */
  loadScript(publishableKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      document.body.appendChild(script);
    });
  },

  /**
   * Create payment intent on backend
   */
  async createPaymentIntent(orderData: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerPhone?: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string; publishableKey: string }> {
    const response = await apiClient.post(endpoints.payments.stripe.create, orderData);
    return response.data;
  },

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(
    clientSecret: string,
    publishableKey: string,
    paymentMethod: any
  ): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    try {
      await this.loadScript(publishableKey);
      const stripe = window.Stripe(publishableKey);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return {
        success: true,
        paymentIntentId: result.paymentIntent.id,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Payment failed' };
    }
  },

  /**
   * Process Stripe payment
   */
  async processPayment(
    orderData: {
      orderId: string;
      amount: number;
      currency: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
    },
    cardElement: any,
    onSuccess: (paymentId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Create payment intent
      const { clientSecret, paymentIntentId, publishableKey } = await this.createPaymentIntent({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
      });

      // Load Stripe
      await this.loadScript(publishableKey);
      const stripe = window.Stripe(publishableKey);

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: orderData.customerName,
            email: orderData.customerEmail,
            phone: orderData.customerPhone,
          },
        },
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
      } else {
        onSuccess(result.paymentIntent.id);
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      onError(error.message || 'Failed to process payment');
    }
  },
};

