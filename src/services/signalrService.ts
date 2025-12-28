import * as signalR from '@microsoft/signalr';
import { apiConfig } from './api/config';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private businessId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  /**
   * Connect to SignalR hub
   */
  async connect(businessId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected && this.businessId === businessId) {
      return; // Already connected
    }

    // Disconnect existing connection if business changed
    if (this.businessId && this.businessId !== businessId) {
      await this.disconnect();
    }

    this.businessId = businessId;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiConfig.wsUrl}/orderHub`, {
          accessTokenFactory: () => {
            // Get auth token if available
            if (typeof window !== 'undefined') {
              return localStorage.getItem('auth_token') || '';
            }
            return '';
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return this.reconnectDelay;
            }
            return null; // Stop reconnecting
          },
        })
        .build();

      // Connection event handlers
      this.connection.onclose((error) => {
        console.log('SignalR connection closed', error);
        this.onConnectionChange?.(false);
      });

      this.connection.onreconnecting((error) => {
        console.log('SignalR reconnecting', error);
        this.onConnectionChange?.(false);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected', connectionId);
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
      });

      // Start connection
      await this.connection.start();
      console.log('SignalR connected');

      // Join business group
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('JoinBusinessGroup', businessId);
      }

      this.reconnectAttempts = 0;
      this.onConnectionChange?.(true);
    } catch (error) {
      console.error('SignalR connection error:', error);
      this.onConnectionChange?.(false);
      throw error;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      if (this.businessId && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('LeaveBusinessGroup', this.businessId);
      }
      await this.connection.stop();
      this.connection = null;
      this.businessId = null;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Register handler for order status updates
   */
  onOrderStatusUpdate(callback: (orderId: string, status: string) => void): void {
    if (this.connection) {
      this.connection.on('OrderStatusUpdated', (orderId: string, status: string) => {
        callback(orderId, status);
      });
    }
  }

  /**
   * Register handler for new orders
   */
  onNewOrder(callback: (order: any) => void): void {
    if (this.connection) {
      this.connection.on('NewOrder', (order: any) => {
        callback(order);
      });
    }
  }

  /**
   * Register handler for connection state changes
   */
  onConnectionChange: ((connected: boolean) => void) | null = null;

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
export default signalRService;

