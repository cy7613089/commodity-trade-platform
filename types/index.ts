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

// 优惠券类型
export type CouponType = 'product' | 'time' | 'amount';

// 优惠券折扣类型
export type DiscountType = 'fixed' | 'percentage';

// 优惠券数据接口
export interface Coupon {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  value: number;
  discount_type: DiscountType;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  end_date: string | Date;
  is_active: boolean;
  color: string;
  icon: string | null;
  coupon_rule: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  coupon_rules?: Array<{
    rule_type: string;
    rule_value: Record<string, unknown>;
    priority?: number;
    is_active?: boolean;
  }>;
}

// 商品数据接口
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  images: string[];
  specs: Record<string, unknown> | null;
  rating: number;
  reviewCount: number;
  is_featured: boolean;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
} 