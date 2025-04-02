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
      
      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find(item => item.id === newItem.id);
          
          if (existingItem) {
            // 如果商品已存在，更新数量
            const newQuantity = existingItem.quantity + newItem.quantity;
            // 确保不超过库存
            const finalQuantity = Math.min(newQuantity, newItem.stock);
            
            return {
              items: state.items.map(item =>
                item.id === newItem.id
                  ? { ...item, quantity: finalQuantity }
                  : item
              )
            };
          }
          
          // 如果商品不存在，添加新商品
          return {
            items: [...state.items, newItem]
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) }
              : item
          )
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
          (total, item) => {
            // 使用 originalPrice（如果存在且不为null），否则使用 price
            const priceToUse = item.originalPrice !== undefined && item.originalPrice !== null 
              ? item.originalPrice 
              : item.price;
            return safeAdd(total, safeMultiply(priceToUse, item.quantity));
          }, 
          0
        );
      },
    }),
    {
      name: 'cart-storage', // localStorage的键名
    }
  )
); 