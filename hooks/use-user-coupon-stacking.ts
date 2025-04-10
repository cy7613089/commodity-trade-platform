import { useState } from 'react';
import { toast } from 'sonner';

interface MatchedCoupon {
  id: string;
  name: string;
}

interface RuleMatch {
  id: string;
  name: string | null;
  type: 'ALLOW' | 'DISALLOW';
}

interface StackingCheckResult {
  can_stack: boolean;
  message: string;
  detail?: string;
  rule_matched?: RuleMatch;
  matched_coupons?: MatchedCoupon[];
  invalid_coupon_ids?: string[];
}

interface UseUserCouponStackingReturn {
  checkUserCouponsStacking: (couponIds: string[]) => Promise<StackingCheckResult | null>;
  isChecking: boolean;
  error: string | null;
  result: StackingCheckResult | null;
  clearResult: () => void;
}

/**
 * 用户端优惠券叠加检查Hook
 * 用于检查用户选择的多个优惠券是否可以一起使用
 */
export function useUserCouponStacking(): UseUserCouponStackingReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StackingCheckResult | null>(null);

  // 清除之前的结果
  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  // 检查用户的优惠券是否可以叠加使用
  const checkUserCouponsStacking = async (couponIds: string[]): Promise<StackingCheckResult | null> => {
    if (couponIds.length < 2) {
      const errorMessage = '请选择至少两张优惠券进行检查';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }

    try {
      setIsChecking(true);
      setError(null);
      
      const response = await fetch('/api/coupons/stacking-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coupon_ids: couponIds }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '检查优惠券叠加失败');
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查优惠券叠加时出错';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkUserCouponsStacking,
    isChecking,
    error,
    result,
    clearResult,
  };
} 