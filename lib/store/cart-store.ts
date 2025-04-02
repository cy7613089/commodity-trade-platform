import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeMultiply, safeAdd } from '@/lib/utils/format';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  getTotalOriginalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          
          if (existingItem) {
            // 如果商品已存在，更新数量（不超过库存）
            return {
              items: state.items.map((i) => 
                i.id === item.id 
                  ? { 
                      ...i, 
                      quantity: Math.min(i.quantity + item.quantity, i.stock)
                    } 
                  : i
              ),
            };
          }
          
          // 如果商品不存在，添加到购物车
          return {
            items: [...state.items, { ...item, quantity: Math.min(item.quantity, item.stock) }],
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) => 
            item.id === id 
              ? { 
                  ...item, 
                  quantity: Math.min(Math.max(1, quantity), item.stock) 
                } 
              : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => safeAdd(total, safeMultiply(item.price, item.quantity)), 
          0
        );
      },
      
      getTotalOriginalPrice: () => {
        return get().items.reduce(
          (total, item) => safeAdd(total, safeMultiply((item.originalPrice || item.price), item.quantity)), 
          0
        );
      },
    }),
    {
      name: 'cart-storage', // localStorage的键名
    }
  )
); 