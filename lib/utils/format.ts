import Decimal from 'decimal.js';

/**
 * 安全地加法计算，避免Javascript浮点数精度问题
 */
export function safeAdd(a: number | null | undefined, b: number | null | undefined): number {
  const numA = new Decimal(a ?? 0); // 如果 a 是 null 或 undefined，则视为 0
  const numB = new Decimal(b ?? 0); // 如果 b 是 null 或 undefined，则视为 0
  return numA.plus(numB).toNumber();
}

/**
 * 安全地减法计算，避免Javascript浮点数精度问题
 */
export function safeSubtract(a: number, b: number): number {
  return new Decimal(a).minus(new Decimal(b)).toNumber();
}

/**
 * 安全地乘法计算，避免Javascript浮点数精度问题
 */
export function safeMultiply(a: number | null | undefined, b: number | null | undefined): number {
  const numA = new Decimal(a ?? 0); // 如果 a 是 null 或 undefined，则视为 0
  const numB = new Decimal(b ?? 0); // 如果 b 是 null 或 undefined，则视为 0
  return numA.times(numB).toNumber();
}

/**
 * 安全地除法计算，避免Javascript浮点数精度问题
 */
export function safeDivide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('除数不能为0');
  }
  return new Decimal(a).dividedBy(new Decimal(b)).toNumber();
}

/**
 * 计算折扣百分比
 */
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) {
    return 0;
  }
  
  const discount = safeSubtract(originalPrice, discountedPrice);
  const percentage = safeDivide(discount, originalPrice) * 100;
  
  return Math.round(percentage);
}

/**
 * 格式化金额为两位小数的字符串
 */
export function formatPrice(price: number | null | undefined): string {
  // 如果价格是 null, undefined 或 NaN，返回 '0.00'
  if (price === null || price === undefined || isNaN(price)) {
    return '0.00';
  }
  return new Decimal(price).toFixed(2);
}

/**
 * 计算小计金额
 */
export function calculateSubtotal(price: number, quantity: number): number {
  return safeMultiply(price, quantity);
}

/**
 * 求和数组中的所有数字
 */
export function sumArray(arr: number[]): number {
  return arr.reduce((sum, value) => safeAdd(sum, value), 0);
}

/**
 * 将数据库返回的商品数据格式化为前端所需格式
 */
interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images?: string[] | null;
  rating?: number;
  reviewCount?: number;
  is_featured?: boolean;
  status?: string;
  specs?: Record<string, any> | null;
  [key: string]: any;
}

export interface FormattedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  specs?: Record<string, any>;
  isFeatured: boolean;
}

export function formatProductResponse(product: DbProduct): FormattedProduct {
  // 提取第一张图片作为主图
  const imagesArray = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : ['/next.svg']; // 默认图片
  
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: product.price,
    originalPrice: product.originalPrice,
    image: imagesArray[0], // 主图
    images: imagesArray,
    stock: typeof product.stock === 'number' ? product.stock : 0,
    rating: typeof product.rating === 'number' ? product.rating : 0,
    reviewCount: typeof product.reviewCount === 'number' ? product.reviewCount : 0,
    specs: product.specs || {},
    isFeatured: product.is_featured || false
  };
} 