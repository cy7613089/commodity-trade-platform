import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 * @param dateString ISO格式的日期字符串或Date对象
 * @returns 格式化后的日期字符串，格式为：YYYY年MM月DD日
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '未知日期';
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期';
  }
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
