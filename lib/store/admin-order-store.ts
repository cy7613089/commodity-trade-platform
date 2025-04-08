import { create } from 'zustand';
import { toast } from 'sonner';
import { Order, OrderStatus } from './order-store';

// 分页信息接口
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// 管理员订单状态接口
interface AdminOrderState {
  orders: Order[];
  loading: boolean;
  loadingAction: boolean;
  error: string | null;
  pagination: PaginationState;
  fetchAllOrders: (options?: { status?: OrderStatus, page?: number, limit?: number }) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
}

// 创建管理员订单store
export const useAdminOrderStore = create<AdminOrderState>((set, get) => ({
  orders: [],
  loading: false,
  loadingAction: false,
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  },

  // 获取所有订单列表（管理员权限）
  fetchAllOrders: async (options = {}) => {
    const { status, page = 1, limit = get().pagination.pageSize } = options;
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        admin: 'true', // 标记为管理员请求
      });
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取订单列表失败');
      }
      const result = await response.json();
      set({
        orders: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '发生未知错误';
      console.error('管理员获取订单列表错误:', error);
      set({ loading: false, error: message });
      toast.error(`获取订单列表失败: ${message}`);
    }
  },

  // 更新订单状态
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<boolean> => {
    set({ loadingAction: true, error: null });
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新订单状态失败');
      }
      
      const updatedOrder: Order = await response.json();
      
      // 更新列表中的订单状态
      set(state => ({
        orders: state.orders.map(order => order.id === id ? updatedOrder : order),
        loadingAction: false,
      }));
      
      toast.success(`订单状态已更新为: ${status}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '发生未知错误';
      console.error(`更新订单状态错误 (${id}):`, error);
      set({ loadingAction: false, error: message });
      toast.error(`更新订单状态失败: ${message}`);
      return false;
    }
  }
})); 