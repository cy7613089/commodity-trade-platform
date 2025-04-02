import Decimal from 'decimal.js';

/**
 * 安全地加法计算，避免Javascript浮点数精度问题
 */
export function safeAdd(a: number, b: number): number {
  return new Decimal(a).plus(new Decimal(b)).toNumber();
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
export function safeMultiply(a: number, b: number): number {
  return new Decimal(a).times(new Decimal(b)).toNumber();
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
export function formatPrice(price: number): string {
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