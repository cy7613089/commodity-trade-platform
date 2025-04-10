import { useState } from 'react';
import { toast } from 'sonner';

interface CheckResult {
  can_stack: boolean;
  rule_matched?: {
    id: string;
    name: string | null;
    type: 'ALLOW' | 'DISALLOW';
  };
  message: string;
}

interface UseCouponStackingReturn {
  checkStacking: (couponIds: string[]) => Promise<CheckResult | null>;
  isLoading: boolean;
  error: string | null;
  result: CheckResult | null;
}

export function useCouponStacking(): UseCouponStackingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  // 检查优惠券是否可以叠加使用
  const checkStacking = async (couponIds: string[]): Promise<CheckResult | null> => {
    if (couponIds.length < 2) {
      const errorMessage = '请提供至少两个优惠券ID进行检查';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/coupons/stacking-rules/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coupon_ids: couponIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '检查优惠券叠加失败');
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查优惠券叠加时出错';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkStacking,
    isLoading,
    error,
    result,
  };
} 