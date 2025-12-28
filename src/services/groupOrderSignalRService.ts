import * as signalR from '@microsoft/signalr';
import { apiConfig } from './api/config';
import { GroupOrderItemDto, GroupOrderMemberDto } from '@/types';

class GroupOrderSignalRService {
  private connection: signalR.HubConnection | null = null;
  private groupOrderId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  /**
   * Connect to Group Order SignalR hub
   */
  async connect(groupOrderId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected && this.groupOrderId === groupOrderId) {
      return; // Already connected
    }

    // Disconnect existing connection if group order changed
    if (this.groupOrderId && this.groupOrderId !== groupOrderId) {
      await this.disconnect();
    }

    this.groupOrderId = groupOrderId;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiConfig.wsUrl}/grouporders`, {
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
        console.log('Group Order SignalR connection closed', error);
        this.onConnectionChange?.(false);
      });

      this.connection.onreconnecting((error) => {
        console.log('Group Order SignalR reconnecting', error);
        this.onConnectionChange?.(false);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('Group Order SignalR reconnected', connectionId);
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
        // Rejoin group order
        if (this.groupOrderId) {
          this.connection?.invoke('JoinGroupOrder', this.groupOrderId);
        }
      });

      // Start connection
      await this.connection.start();
      console.log('Group Order SignalR connected');

      // Join group order
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('JoinGroupOrder', groupOrderId);
      }

      this.reconnectAttempts = 0;
      this.onConnectionChange?.(true);
    } catch (error) {
      console.error('Group Order SignalR connection error:', error);
      this.onConnectionChange?.(false);
      throw error;
    }
  }

  /**
   * Disconnect from Group Order SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      if (this.groupOrderId && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('LeaveGroupOrder', this.groupOrderId);
      }
      await this.connection.stop();
      this.connection = null;
      this.groupOrderId = null;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Register handler for item added
   */
  onItemAdded(callback: (item: GroupOrderItemDto) => void): void {
    if (this.connection) {
      this.connection.on('ItemAdded', callback);
    }
  }

  /**
   * Register handler for item removed
   */
  onItemRemoved(callback: (itemId: string) => void): void {
    if (this.connection) {
      this.connection.on('ItemRemoved', callback);
    }
  }

  /**
   * Register handler for member joined
   */
  onMemberJoined(callback: (member: GroupOrderMemberDto) => void): void {
    if (this.connection) {
      this.connection.on('MemberJoined', callback);
    }
  }

  /**
   * Register handler for member left
   */
  onMemberLeft(callback: (memberId: string) => void): void {
    if (this.connection) {
      this.connection.on('MemberLeft', callback);
    }
  }

  /**
   * Register handler for order locked
   */
  onOrderLocked(callback: (groupOrderId: string) => void): void {
    if (this.connection) {
      this.connection.on('OrderLocked', callback);
    }
  }

  /**
   * Register handler for order completed
   */
  onOrderCompleted(callback: (orderInfo: any) => void): void {
    if (this.connection) {
      this.connection.on('OrderCompleted', callback);
    }
  }

  /**
   * Remove all handlers
   */
  removeAllHandlers(): void {
    if (this.connection) {
      this.connection.off('ItemAdded');
      this.connection.off('ItemRemoved');
      this.connection.off('MemberJoined');
      this.connection.off('MemberLeft');
      this.connection.off('OrderLocked');
      this.connection.off('OrderCompleted');
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

export const groupOrderSignalRService = new GroupOrderSignalRService();
export default groupOrderSignalRService;

