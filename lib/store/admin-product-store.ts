import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  originalprice?: number;
  stock: number;
  images?: string[];
  specs?: Record<string, unknown>;
  rating?: number;
  reviewCount?: number;
  review_count?: number;
  is_featured?: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  currentParams: { 
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    order: 'asc' | 'desc';
  };
  // 方法
  fetchProducts: (params?: { 
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) => Promise<void>;
  getProduct: (id: string) => Promise<Product | null>;
  createProduct: (productData: Partial<Product>) => Promise<Product | null>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
}

// 处理后端返回的产品数据，确保字段格式化正确
function formatProduct(product: Record<string, unknown>): Product {
  return {
    ...product as unknown as Product,
    // 处理字段命名差异，优先使用驼峰命名
    originalPrice: (product.originalPrice as number | undefined) || 
                   (product.original_price as number | undefined) || 
                   (product.originalprice as number | undefined),
    reviewCount: (product.reviewCount as number | undefined) || (product.review_count as number | undefined)
  };
}

export const useAdminProductStore = create<ProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  currentParams: {
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    order: 'desc'
  },
  
  // 获取商品列表
  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const { page = 1, limit = 10, search = '', sortBy = 'created_at', order = 'desc' } = params;
      
      // 保存当前参数
      set({
        currentParams: {
          page,
          limit,
          search,
          sortBy,
          order
        }
      });
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (search) {
        queryParams.append('search', search);
      }
      
      queryParams.append('sortBy', sortBy);
      queryParams.append('order', order);
      
      // 发送请求
      const response = await fetch(`/api/admin/products?${queryParams.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取商品列表失败');
      }

      // 处理获取的商品数据，格式化字段
      const formattedProducts = data.products?.map(formatProduct) || [];
      
      set({ 
        products: formattedProducts,
        pagination: data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        loading: false
      });
    } catch (error) {
      console.error('获取商品列表异常:', error);
      set({ 
        error: error instanceof Error ? error.message : '获取商品列表失败',
        loading: false
      });
    }
  },
  
  // 获取单个商品
  getProduct: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取商品详情失败');
      }

      // 格式化处理返回的产品数据
      const formattedProduct = formatProduct(data.product);
      
      set({ selectedProduct: formattedProduct, loading: false });
      return formattedProduct;
    } catch (error) {
      console.error('获取商品详情异常:', error);
      set({ 
        error: error instanceof Error ? error.message : '获取商品详情失败',
        loading: false 
      });
      return null;
    }
  },
  
  // 创建商品
  createProduct: async (productData: Partial<Product>) => {
    set({ loading: true, error: null });
    
    try {
      console.log("创建商品 - 前端传入数据:", productData);
      console.log("创建商品 - 原价值:", productData.originalPrice);
      
      // 转换字段名，确保与数据库字段名匹配
      const formattedData = {
        ...productData,
        // 将驼峰命名转换为数据库使用的全小写字段名
        // 注意：确保0值不被转换为null
        originalprice: productData.originalPrice === 0 ? 0 : (productData.originalPrice || null),
      };
      
      console.log("创建商品 - 处理后数据:", formattedData);
      console.log("创建商品 - 转换后originalprice:", formattedData.originalprice);
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formattedData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '创建商品失败');
      }
      
      // 总是获取第一页，因为新创建的商品会显示在第一页
      await get().fetchProducts({ ...get().currentParams, page: 1 });
      
      set({ loading: false });
      return data.product;
    } catch (error) {
      console.error('创建商品异常:', error);
      set({ 
        error: error instanceof Error ? error.message : '创建商品失败',
        loading: false 
      });
      return null;
    }
  },
  
  // 更新商品
  updateProduct: async (id: string, productData: Partial<Product>) => {
    set({ loading: true, error: null });
    
    try {
      console.log("更新商品 - 前端传入数据:", productData);
      console.log("更新商品 - 原价值:", productData.originalPrice);
      
      // 转换字段名，确保与数据库字段名匹配
      const formattedData = {
        ...productData,
        // 将驼峰命名转换为数据库使用的全小写字段名
        // 注意：确保0值不被转换为null
        originalprice: productData.originalPrice === 0 ? 0 : (productData.originalPrice || null),
      };
      
      console.log("更新商品 - 处理后数据:", formattedData);
      console.log("更新商品 - 转换后originalprice:", formattedData.originalprice);      
      
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formattedData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新商品失败');
      }
      
      // 重新获取商品列表
      await get().fetchProducts(get().currentParams);
      
      set({ loading: false });
      return data.product;
    } catch (error) {
      console.error('更新商品异常:', error);
      set({ 
        error: error instanceof Error ? error.message : '更新商品失败',
        loading: false 
      });
      return null;
    }
  },
  
  // 删除商品
  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('删除商品失败');
      }
      
      // 重新获取商品列表
      await get().fetchProducts(get().currentParams);
      
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('删除商品异常:', error);
      set({ 
        error: error instanceof Error ? error.message : '删除商品失败',
        loading: false 
      });
      return false;
    }
  }
}));