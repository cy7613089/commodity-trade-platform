import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// 地址接口
export interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
}

// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
  nickname?: string;
  createdAt: string;
  birthdate?: string;
  gender?: string;
  addresses: Address[];
}

// 用户状态接口
interface UserState {
  user: User | null;
  mockInitialized: boolean;
  initMockUser: () => void;
  updateUserInfo: (updatedInfo: Partial<User>) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, updatedAddress: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

// 生成随机的用户数据
const generateMockUser = (): User => {
  const addresses: Address[] = [];
  
  // 生成3个随机地址
  for (let i = 0; i < 3; i++) {
    addresses.push({
      id: uuidv4(),
      name: i === 0 ? '陈阳' : `用户${i + 1}`,
      phone: `1${Math.floor(Math.random() * 9) + 3}${Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`,
      province: i === 0 ? '广东省' : ['北京市', '上海市', '浙江省', '江苏省'][Math.floor(Math.random() * 4)],
      city: i === 0 ? '深圳市' : ['北京市', '上海市', '杭州市', '南京市'][Math.floor(Math.random() * 4)],
      district: i === 0 ? '南山区' : ['朝阳区', '浦东新区', '西湖区', '鼓楼区'][Math.floor(Math.random() * 4)],
      address: i === 0 ? '科技园路10号' : `某某路${Math.floor(Math.random() * 100) + 1}号某某小区${Math.floor(Math.random() * 20) + 1}栋${Math.floor(Math.random() * 5) + 1}单元${Math.floor(Math.random() * 30) + 101}室`,
      isDefault: i === 0,
    });
  }
  
  // 创建用户
  return {
    id: 'user_123',
    username: 'chenyang',
    email: 'chenyang@example.com',
    phone: '13800138000',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenyang',
    nickname: '陈阳',
    createdAt: new Date(new Date().getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6个月前注册
    birthdate: '1990-01-01',
    gender: '男',
    addresses,
  };
};

// 创建store
export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  mockInitialized: false,
  
  // 初始化模拟用户数据
  initMockUser: () => {
    if (!get().mockInitialized) {
      set({ user: generateMockUser(), mockInitialized: true });
    }
  },
  
  // 更新用户信息
  updateUserInfo: (updatedInfo) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedInfo } : null,
    }));
  },
  
  // 添加地址
  addAddress: (address) => {
    set((state) => {
      if (!state.user) return state;
      
      const newAddress: Address = {
        ...address,
        id: uuidv4(),
        isDefault: address.isDefault,
      };
      
      let addresses = [...state.user.addresses];
      
      // 如果新地址是默认地址，需要将其他地址设为非默认
      if (newAddress.isDefault) {
        addresses = addresses.map((addr) => ({
          ...addr,
          isDefault: false,
        }));
      }
      
      // 如果这是第一个地址，默认设为默认地址
      if (addresses.length === 0) {
        newAddress.isDefault = true;
      }
      
      addresses.push(newAddress);
      
      return {
        user: {
          ...state.user,
          addresses,
        },
      };
    });
  },
  
  // 更新地址
  updateAddress: (id, updatedAddress) => {
    set((state) => {
      if (!state.user) return state;
      
      let addresses = [...state.user.addresses];
      const index = addresses.findIndex((addr) => addr.id === id);
      
      if (index === -1) return state;
      
      // 如果将该地址设为默认地址，需要将其他地址设为非默认
      if (updatedAddress.isDefault) {
        addresses = addresses.map((addr) => ({
          ...addr,
          isDefault: false,
        }));
      }
      
      addresses[index] = {
        ...addresses[index],
        ...updatedAddress,
      };
      
      return {
        user: {
          ...state.user,
          addresses,
        },
      };
    });
  },
  
  // 删除地址
  deleteAddress: (id) => {
    set((state) => {
      if (!state.user) return state;
      
      const addresses = state.user.addresses.filter((addr) => addr.id !== id);
      
      // 如果删除的是默认地址，且还有其他地址，则将第一个地址设为默认地址
      if (state.user.addresses.find((addr) => addr.id === id)?.isDefault && addresses.length > 0) {
        addresses[0].isDefault = true;
      }
      
      return {
        user: {
          ...state.user,
          addresses,
        },
      };
    });
  },
  
  // 设置默认地址
  setDefaultAddress: (id) => {
    set((state) => {
      if (!state.user) return state;
      
      const addresses = state.user.addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }));
      
      return {
        user: {
          ...state.user,
          addresses,
        },
      };
    });
  },
  
  // 修改密码（模拟）
  changePassword: async (oldPassword, _newPassword) => {
    // 模拟密码验证和修改过程
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // 模拟验证旧密码是否正确
    if (oldPassword === '123456') {
      // 模拟密码修改成功
      return true;
    }
    
    // 模拟密码验证失败
    return false;
  },
})); 