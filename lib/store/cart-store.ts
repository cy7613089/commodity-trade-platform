import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeMultiply, safeAdd } from '@/lib/utils/format';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  stock: number;
  selected: boolean;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalAmount: number;
  selectedTotalAmount: number;
  itemCount: number;
}

interface CartStore extends CartState {
  // 获取购物车数据
  fetchCart: () => Promise<void>;
  
  // 添加商品到购物车
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    quantity: number;
    stock: number;
  }) => Promise<void>;
  
  // 更新商品数量
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  
  // 更新商品选中状态
  updateSelected: (itemId: string, selected: boolean) => Promise<void>;
  
  // 批量更新选中状态
  updateBatchSelected: (itemIds: string[], selected: boolean) => Promise<void>;
  
  // 从购物车中移除商品
  removeItem: (itemId: string) => Promise<void>;
  
  // 清空购物车
  clearCart: () => Promise<void>;
  
  // 获取本地统计信息
  getItemCount: () => number;
  getTotalPrice: () => number;
  getSelectedTotalPrice: () => number;
  
  // 同步购物车数据（用于用户登录后）
  syncCartAfterLogin: () => Promise<void>;
  
  // 立即更新购物车计数（用于UI乐观更新）
  updateNavbarCartCount: (count: number) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,
      totalAmount: 0,
      selectedTotalAmount: 0,
      itemCount: 0,
      
      fetchCart: async () => {
        try {
          set({ loading: true, error: null });
          
          const response = await fetch('/api/cart');
          
          if (!response.ok) {
            // 如果是401（未认证）错误，不显示错误提示
            if (response.status !== 401) {
              const errorData = await response.json();
              throw new Error(errorData.error || '获取购物车失败');
            }
            // 未登录时使用空购物车
            set({ 
              items: [], 
              loading: false, 
              totalAmount: 0, 
              selectedTotalAmount: 0,
              itemCount: 0 
            });
            return;
          }
          
          const cartData = await response.json();
          
          // 计算商品总数量而非商品种类数量
          const totalItemCount = (cartData.items || []).reduce(
            (count: number, item: CartItem) => count + item.quantity, 
            0
          );
          
          set({ 
            items: cartData.items || [], 
            loading: false,
            totalAmount: cartData.totalAmount || 0,
            selectedTotalAmount: cartData.selectedTotalAmount || 0,
            itemCount: totalItemCount
          });
        } catch (error) {
          console.error('获取购物车失败:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : '获取购物车失败' 
          });
        }
      },
      
      addItem: async (product) => {
        try {
          set({ loading: true, error: null });
          
          const response = await fetch('/api/cart/items', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              quantity: product.quantity,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '添加到购物车失败');
          }
          
          const result = await response.json();
          
          // 添加成功后，重新获取购物车数据，但不显示Toast（组件中已经显示）
          await get().fetchCart();
          
          return result;
        } catch (error) {
          console.error('添加到购物车失败:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : '添加到购物车失败' 
          });
          
          // 将错误向上抛出，让组件处理
          throw error;
        }
      },
      
      updateQuantity: async (itemId, quantity) => {
        // 保存当前状态用于可能的回滚
        const currentItems = [...get().items];
        const currentTotalAmount = get().totalAmount;
        const currentSelectedTotalAmount = get().selectedTotalAmount;
        const currentItemCount = get().itemCount;
        
        try {
          // 确保数量有效
          if (quantity < 1) {
            throw new Error('商品数量必须大于0');
          }
          
          // 乐观更新：立即更新前端状态，使UI立即响应
          set((state) => {
            const updatedItems = state.items.map(item => 
              item.id === itemId ? { ...item, quantity, subtotal: safeMultiply(item.price, quantity) } : item
            );
            
            const totalAmount = updatedItems.reduce(
              (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
              0
            );
            
            const selectedTotalAmount = updatedItems
              .filter(item => item.selected)
              .reduce(
                (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
                0
              );
            
            // 计算商品总数量，而不是商品种类数量
            const totalItemCount = updatedItems.reduce(
              (count, item) => count + item.quantity, 
              0
            );
            
            return {
              items: updatedItems,
              totalAmount,
              selectedTotalAmount,
              itemCount: totalItemCount
            };
          });
          
          // 发送API请求
          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quantity,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新商品数量失败');
          }
          
          // API请求成功，不需要额外操作
          await response.json();
          
        } catch (error) {
          console.error('更新商品数量失败:', error);
          
          // API请求失败，回滚到之前的状态
          set((state) => ({
            ...state,
            items: currentItems,
            totalAmount: currentTotalAmount,
            selectedTotalAmount: currentSelectedTotalAmount,
            itemCount: currentItemCount,
            error: error instanceof Error ? error.message : '更新商品数量失败'
          }));
          
          // 显示错误提示
          toast.error(error instanceof Error ? error.message : '更新商品数量失败');
        }
      },
      
      updateSelected: async (itemId, selected) => {
        // 保存当前状态用于可能的回滚
        const currentItems = [...get().items];
        const currentSelectedTotalAmount = get().selectedTotalAmount;
        
        try {
          // 乐观更新：立即更新前端状态
          set((state) => {
            const updatedItems = state.items.map(item => 
              item.id === itemId ? { ...item, selected } : item
            );
            
            const selectedTotalAmount = updatedItems
              .filter(item => item.selected)
              .reduce(
                (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
                0
              );
            
            return {
              items: updatedItems,
              selectedTotalAmount
            };
          });
          
          // 发送API请求
          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              selected,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新商品选中状态失败');
          }
          
          // API请求成功，不需要额外操作
          await response.json();
          
        } catch (error) {
          console.error('更新商品选中状态失败:', error);
          
          // API请求失败，回滚到之前的状态
          set((state) => ({
            ...state,
            items: currentItems,
            selectedTotalAmount: currentSelectedTotalAmount,
            error: error instanceof Error ? error.message : '更新商品选中状态失败'
          }));
          
          // 显示错误提示
          toast.error(error instanceof Error ? error.message : '更新商品选中状态失败');
        }
      },
      
      updateBatchSelected: async (itemIds, selected) => {
        // 保存当前状态用于可能的回滚
        const currentItems = [...get().items];
        const currentSelectedTotalAmount = get().selectedTotalAmount;
        
        try {
          // 乐观更新：立即更新前端状态
          set((state) => {
            const updatedItems = state.items.map(item => 
              itemIds.includes(item.id) ? { ...item, selected } : item
            );
            
            const selectedTotalAmount = updatedItems
              .filter(item => item.selected)
              .reduce(
                (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
                0
              );
            
            return {
              items: updatedItems,
              selectedTotalAmount
            };
          });
          
          // 发送API请求
          const response = await fetch('/api/cart/items/select', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              itemIds,
              selected,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '批量更新商品选中状态失败');
          }
          
          // API请求成功，不需要额外操作
          await response.json();
          
        } catch (error) {
          console.error('批量更新商品选中状态失败:', error);
          
          // API请求失败，回滚到之前的状态
          set((state) => ({
            ...state,
            items: currentItems,
            selectedTotalAmount: currentSelectedTotalAmount,
            error: error instanceof Error ? error.message : '批量更新商品选中状态失败'
          }));
          
          // 显示错误提示
          toast.error(error instanceof Error ? error.message : '批量更新商品选中状态失败');
        }
      },
      
      removeItem: async (itemId) => {
        // 保存当前状态用于可能的回滚
        const currentItems = [...get().items];
        const currentTotalAmount = get().totalAmount;
        const currentSelectedTotalAmount = get().selectedTotalAmount;
        const currentItemCount = get().itemCount;
        
        try {
          // 乐观更新：立即更新前端状态
          set((state) => {
            const updatedItems = state.items.filter(item => item.id !== itemId);
            
            const totalAmount = updatedItems.reduce(
              (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
              0
            );
            
            const selectedTotalAmount = updatedItems
              .filter(item => item.selected)
              .reduce(
                (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
                0
              );
            
            // 计算商品总数量，而不是商品种类数量
            const totalItemCount = updatedItems.reduce(
              (count, item) => count + item.quantity, 
              0
            );
            
            return {
              items: updatedItems,
              totalAmount,
              selectedTotalAmount,
              itemCount: totalItemCount
            };
          });
          
          // 显示成功提示（乐观更新）
          toast.success('商品已从购物车中删除');
          
          // 发送API请求
          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '删除商品失败');
          }
          
          // API请求成功，不需要额外操作
          await response.json();
          
        } catch (error) {
          console.error('删除商品失败:', error);
          
          // API请求失败，回滚到之前的状态
          set((state) => ({
            ...state,
            items: currentItems,
            totalAmount: currentTotalAmount,
            selectedTotalAmount: currentSelectedTotalAmount,
            itemCount: currentItemCount,
            error: error instanceof Error ? error.message : '删除商品失败'
          }));
          
          // 显示错误提示和取消之前的成功提示
          toast.error(error instanceof Error ? error.message : '删除商品失败');
        }
      },
      
      clearCart: async () => {
        // 保存当前状态用于可能的回滚
        const currentItems = [...get().items];
        const currentTotalAmount = get().totalAmount;
        const currentSelectedTotalAmount = get().selectedTotalAmount;
        const currentItemCount = get().itemCount;
        
        try {
          // 乐观更新：立即更新前端状态
          set({ 
            items: [], 
            totalAmount: 0,
            selectedTotalAmount: 0,
            itemCount: 0
          });
          
          // 显示成功提示（乐观更新）
          toast.success('购物车已清空');
          
          // 发送API请求
          const response = await fetch('/api/cart', {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '清空购物车失败');
          }
          
          // API请求成功，不需要额外操作
          await response.json();
          
        } catch (error) {
          console.error('清空购物车失败:', error);
          
          // API请求失败，回滚到之前的状态
          set((state) => ({
            ...state,
            items: currentItems,
            totalAmount: currentTotalAmount,
            selectedTotalAmount: currentSelectedTotalAmount,
            itemCount: currentItemCount,
            error: error instanceof Error ? error.message : '清空购物车失败'
          }));
          
          // 显示错误提示
          toast.error(error instanceof Error ? error.message : '清空购物车失败');
        }
      },
      
      // 本地计算函数（用于备份，通常使用从服务器获取的数据）
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
          0
        );
      },
      
      getSelectedTotalPrice: () => {
        return get().items
          .filter(item => item.selected)
          .reduce(
            (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
            0
          );
      },
      
      // 同步购物车数据（用于用户登录后）
      syncCartAfterLogin: async () => {
        try {
          // 设置loading状态但不显示错误
          set({ loading: true, error: null });
          
          // 获取服务器端的购物车数据
          const response = await fetch('/api/cart');
          
          // 如果发生401错误（未授权），说明用户未登录
          if (response.status === 401) {
            set({ 
              loading: false,
              error: null 
            });
            return;
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '同步购物车失败');
          }
          
          const cartData = await response.json();
          
          // 计算商品总数量而非商品种类数量
          const totalItemCount = (cartData.items || []).reduce(
            (count: number, item: CartItem) => count + item.quantity, 
            0
          );
          
          // 更新本地购物车状态
          set({ 
            items: cartData.items || [], 
            loading: false,
            totalAmount: cartData.totalAmount || 0,
            selectedTotalAmount: cartData.selectedTotalAmount || 0,
            itemCount: totalItemCount
          });
          
          console.log('用户登录后成功同步购物车数据');
        } catch (error) {
          console.error('同步购物车失败:', error);
          set({ 
            loading: false,
            error: error instanceof Error ? error.message : '同步购物车失败' 
          });
        }
      },
      
      // 立即更新购物车计数，用于乐观更新UI
      updateNavbarCartCount: (count: number) => {
        set({ itemCount: count });
      },
    }),
    {
      name: 'cart-storage', // localStorage的键名
      partialize: (state) => ({
        items: state.items,
        totalAmount: state.totalAmount,
        selectedTotalAmount: state.selectedTotalAmount,
        itemCount: state.itemCount,
      }),
    }
  )
); 