// types/index.ts

// 商品分类
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string; // 用于支持多级分类
  imageUrl?: string; // 分类图片
  children?: Category[]; // 子分类
}

// 搜索结果类型
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

// 搜索参数
export interface SearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

// 搜索响应
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 