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

// API返回的用户Profile接口
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  created_at: string;
}

// 用户状态接口
interface UserState {
  user: User | null;
  mockInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initMockUser: () => void;
  updateUserInfo: (updatedInfo: Partial<User>) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, updatedAddress: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  
  // 新增API相关方法
  fetchUserProfile: () => Promise<boolean>;
  syncUserWithAuth: () => Promise<void>;
  convertProfileToUser: (profile: UserProfile) => User;
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
  isLoading: false,
  error: null,
  
  // 将API返回的Profile转换为User格式
  convertProfileToUser: (profile: UserProfile): User => {
    return {
      id: profile.id,
      username: profile.name || profile.email.split('@')[0],
      email: profile.email,
      phone: profile.phone || '',
      avatar: profile.avatar || undefined,
      nickname: profile.name || undefined,
      createdAt: profile.created_at,
      addresses: [], // 地址需要单独获取
    };
  },
  
  // 从API获取用户资料
  fetchUserProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('获取用户资料失败:', errorData);
        
        // 如果是401未认证错误，清空用户信息
        if (response.status === 401) {
          set({ user: null, isLoading: false, error: "用户未登录" });
          return false;
        }
        
        set({ 
          isLoading: false, 
          error: errorData.error || '获取用户资料失败' 
        });
        return false;
      }
      
      const profileData: UserProfile = await response.json();
      const userData = get().convertProfileToUser(profileData);
      
      console.log('获取到用户资料:', profileData);
      console.log('转换后的用户数据:', userData);
      
      set({
        user: userData,
        mockInitialized: true,
        isLoading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      console.error('获取用户资料异常:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      });
      return false;
    }
  },
  
  // 同步用户数据与认证状态
  syncUserWithAuth: async () => {
    try {
      // 尝试从API获取真实用户数据
      const success = await get().fetchUserProfile();
      
      // 如果API获取失败且未初始化过模拟数据，则使用模拟数据
      if (!success && !get().mockInitialized) {
        console.log('API获取失败，使用模拟数据');
        get().initMockUser();
      }
    } catch (error) {
      console.error('同步用户数据失败:', error);
      // 出错时默认使用模拟数据
      if (!get().mockInitialized) {
        get().initMockUser();
      }
    }
  },
  
  // 初始化模拟用户数据
  initMockUser: () => {
    if (!get().mockInitialized) {
      set({ user: generateMockUser(), mockInitialized: true });
    }
  },
  
  // 更新用户信息
  updateUserInfo: (updatedInfo) => {
    console.log('更新用户信息:', updatedInfo);
    
    set((state) => {
      if (!state.user) return state;
      
      const updatedUser = { 
        ...state.user, 
        ...updatedInfo 
      };
      
      console.log('更新后的用户信息:', updatedUser);
      
      return { user: updatedUser };
    });
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  changePassword: async (oldPassword, newPassword: string) => {
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