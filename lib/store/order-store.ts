import { create } from 'zustand';
import { Database } from '@/types/supabase'; // 引入Supabase类型
import { toast } from 'sonner'; // 用于提示

// 订单状态类型 (直接从 Supabase 类型获取或保持一致)
export type OrderStatus = Database['public']['Enums']['order_status'];
// 支付状态类型
export type PaymentStatus = Database['public']['Enums']['payment_status'];

// 订单商品接口 (基于API返回调整)
export type OrderItem = Omit<Database['public']['Tables']['order_items']['Row'], 'created_at'> & {
  // 可能需要从关联的products获取额外信息，如果API select了的话
  // products?: Pick<Database['public']['Tables']['products']['Row'], 'id' | 'name' | 'image'>;
};

// 收货地址接口 (基于API返回调整)
export type ShippingAddress = Database['public']['Tables']['addresses']['Row'];

// 订单接口 (基于API返回调整)
export type Order = Omit<Database['public']['Tables']['orders']['Row'], 'created_at' | 'updated_at' | 'paid_at' | 'shipped_at' | 'delivered_at'> & {
  created_at: string; // 保持字符串类型
  updated_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items: OrderItem[];
  addresses?: ShippingAddress | null; // 地址可能是关联对象
  users?: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name'> | null; // 用户信息可能存在 (管理员视图)
};

// 分页信息接口
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// 状态接口
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean; // 用于列表加载
  loadingDetail: boolean; // 用于详情加载
  loadingAction: boolean; // 用于取消/确认等操作
  error: string | null;
  pagination: PaginationState;
  fetchOrders: (options?: { status?: OrderStatus, page?: number, limit?: number }) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<boolean>; // 返回操作是否成功
  confirmReceived: (id: string) => Promise<boolean>; // 返回操作是否成功
  clearCurrentOrder: () => void; // 添加清理函数
}

// 创建store
export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  loadingDetail: false,
  loadingAction: false,
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  },

  // 获取订单列表
  fetchOrders: async (options = {}) => {
    const { status, page = 1, limit = get().pagination.pageSize } = options;
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      const result = await response.json();
      set({
        orders: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Fetch Orders Error:', error);
      set({ loading: false, error: message });
      toast.error(`获取订单列表失败: ${message}`);
    }
  },

  // 根据ID获取订单详情
  fetchOrderById: async (id: string) => {
    set({ loadingDetail: true, error: null, currentOrder: null }); // 清空旧数据
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
         if (response.status === 404) {
             throw new Error('Order not found');
         }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order details');
      }
      const orderData: Order = await response.json();
      set({ currentOrder: orderData, loadingDetail: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Fetch Order By ID (${id}) Error:`, error);
      set({ loadingDetail: false, error: message });
      toast.error(`获取订单详情失败: ${message}`);
    }
  },

  // 取消订单
  cancelOrder: async (id: string): Promise<boolean> => {
    set({ loadingAction: true, error: null });
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }
      const updatedOrder: Order = await response.json();
      // 更新列表和当前订单状态
      set(state => ({
        orders: state.orders.map(order => order.id === id ? updatedOrder : order),
        currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
        loadingAction: false,
      }));
      toast.success('订单已取消');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Cancel Order (${id}) Error:`, error);
      set({ loadingAction: false, error: message });
      toast.error(`取消订单失败: ${message}`);
      return false;
    }
  },

  // 确认收货
  confirmReceived: async (id: string): Promise<boolean> => {
    set({ loadingAction: true, error: null });
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm order receipt');
      }
      const updatedOrder: Order = await response.json();
      // 更新列表和当前订单状态
      set(state => ({
        orders: state.orders.map(order => order.id === id ? updatedOrder : order),
        currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
        loadingAction: false,
      }));
       toast.success('已确认收货');
      return true;
    } catch (error) {
       const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Confirm Receipt (${id}) Error:`, error);
      set({ loadingAction: false, error: message });
       toast.error(`确认收货失败: ${message}`);
      return false;
    }
  },

  // 清理当前订单详情
  clearCurrentOrder: () => {
      set({ currentOrder: null });
  }

})); 