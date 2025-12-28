import { create } from 'zustand';
import { Order } from '@/types';

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;

  // Actions
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  setCurrentOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
  })),
  
  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map(order =>
      order.orderId === orderId ? { ...order, ...updates } : order
    ),
    currentOrder: state.currentOrder?.orderId === orderId
      ? { ...state.currentOrder, ...updates }
      : state.currentOrder,
  })),
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearCurrentOrder: () => set({ currentOrder: null }),
}));

