"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BadgePercent, Calendar, Package, Tag, AlertCircle, Info } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { calculateDiscount } from "@/lib/actions/coupon-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Coupon } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

// 优惠券图标映射
const couponIcons = {
  product: <Package className="h-5 w-5" />,
  time: <Calendar className="h-5 w-5" />,
  amount: <Tag className="h-5 w-5" />,
  default: <BadgePercent className="h-5 w-5" />
};

// 优惠券颜色映射
const couponColors = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  default: "bg-gray-100 text-gray-600"
};

// 购物车项类型定义，与服务端接口一致
interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

// 1. 在文件顶部添加满减券层级类型接口定义
interface TierRule {
  min_amount: number;
  discount: number;
}

// 定义叠加规则接口
interface StackingRule {
  id: string;
  name?: string | null;
  rule_type: 'ALLOW' | 'DISALLOW';
  coupon_ids: string[];
}

interface CouponSelectorProps {
  cartItems: CartItem[];
  total: number;
  onCouponSelect: (couponIds: string[], discount: number) => void;
}

export default function CouponSelector({ cartItems, total, onCouponSelect }: CouponSelectorProps) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calculatedDiscount, setCalculatedDiscount] = useState(0);
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [stackingErrors, setStackingErrors] = useState<{[key: string]: string}>({});
  const [isCalculatingDiscount, setIsCalculatingDiscount] = useState(false);
  const [allowRules, setAllowRules] = useState<StackingRule[]>([]);
  const [disallowRules, setDisallowRules] = useState<StackingRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // Ref for debounce timer
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // updateDiscount function - no longer manages isCalculatingDiscount directly
  const updateDiscount = async (): Promise<number> => {
    let newCalculatedDiscount = 0;
    try {
      if (selectedCoupons.length === 0) {
        setCalculatedDiscount(0);
        setAppliedCoupons([]);
        setStackingErrors({});
        return 0; 
      }
      setStackingErrors({});
      const result = await calculateDiscount(cartItems, selectedCoupons);
      newCalculatedDiscount = result.totalDiscount;
      setCalculatedDiscount(newCalculatedDiscount);
      setAppliedCoupons(result.appliedCoupons);
    } catch (error) {
      console.error("折扣计算失败:", error);
      newCalculatedDiscount = 0; 
    }
    return newCalculatedDiscount;
  };

  // 获取可用优惠券和叠加规则
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setIsLoadingRules(true);
      try {
        const [couponsResponse, rulesResponse] = await Promise.all([
          fetch('/api/coupons?status=active'),
          fetch('/api/coupons/stacking-rules') // API 现在返回所有规则
        ]);

        if (!couponsResponse.ok) {
          throw new Error('获取优惠券失败');
        }
        const couponsData = await couponsResponse.json();
        setAvailableCoupons(couponsData.coupons || []);

        if (!rulesResponse.ok) {
          console.error('获取叠加规则失败:', rulesResponse.statusText);
          setAllowRules([]); // 重置规则
          setDisallowRules([]); 
        } else {
            const rulesData = await rulesResponse.json() as StackingRule[];
            // 区分 ALLOW 和 DISALLOW 规则
            setAllowRules(rulesData.filter(rule => rule.rule_type === 'ALLOW') || []);
            setDisallowRules(rulesData.filter(rule => rule.rule_type === 'DISALLOW') || []);
        }

      } catch (error) {
        console.error("加载初始数据失败:", error);
        setAvailableCoupons([]);
        setAllowRules([]); // 重置规则
        setDisallowRules([]);
      } finally {
        setIsLoading(false);
        setIsLoadingRules(false);
      }
    }

    loadInitialData();
  }, []);

  // Debounced effect for handling discount calculation and notifying parent
  useEffect(() => {
    let isMounted = true;

    // Clear previous debounce timer if it exists
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set loading state immediately for responsiveness
    setIsCalculatingDiscount(true);

    // Set a new debounce timer
    debounceTimeoutRef.current = setTimeout(async () => {
      if (!isMounted) return; // Don't run if component unmounted

      let finalDiscount = 0;
      try {
        if (cartItems.length > 0) {
          finalDiscount = await updateDiscount(); // Perform the calculation
        } else {
          // Reset state if cart is empty
          setCalculatedDiscount(0);
          setAppliedCoupons([]);
          setStackingErrors({});
          finalDiscount = 0;
        }
        // Notify parent after calculation
        if (isMounted) { 
            onCouponSelect(selectedCoupons, finalDiscount);
        }
      } catch (error) {
          console.error("Error during debounced discount calculation:", error);
          if (isMounted) { 
              // Notify parent even on error, likely with 0 discount
              onCouponSelect(selectedCoupons, 0); 
          }
      } finally {
        // Turn off loading state *after* debounced calculation finishes
        if (isMounted) {
          setIsCalculatingDiscount(false);
        }
      }
    }, 500); // 500ms debounce delay

    // Cleanup function
    return () => {
      isMounted = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoupons, JSON.stringify(cartItems)]); // Keep dependencies

  // 处理优惠券选择
  const handleCouponToggle = (couponId: string, event?: React.MouseEvent) => {
    // 阻止事件默认行为和冒泡，避免触发表单提交或页面导航
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setSelectedCoupons((prev) => {
      if (prev.includes(couponId)) {
        return prev.filter((id) => id !== couponId);
      }
      return [...prev, couponId];
    });
  };

  // 处理确认按钮点击
  const handleConfirm = async () => {
    try {
      await updateDiscount();
    } finally {
      setIsOpen(false);
      onCouponSelect(selectedCoupons, calculatedDiscount);
    }
  };

  const getCouponIcon = (type: string) => {
    return couponIcons[type as keyof typeof couponIcons] || couponIcons.default;
  };
  
  const getCouponColor = (color: string) => {
    return couponColors[color as keyof typeof couponColors] || couponColors.default;
  };

  // 检查优惠券是否可用（基于各种条件）
  const isCouponApplicable = (coupon: Coupon) => {
    // 1. 基本条件: 检查最低消费金额
    if (coupon.min_purchase && total < coupon.min_purchase) {
      return false;
    }

    // 2. 检查优惠券类型特定规则
    const couponRule = coupon.coupon_rule 
      ? (typeof coupon.coupon_rule === 'string' ? JSON.parse(coupon.coupon_rule) : coupon.coupon_rule)
      : null;

    // 如果没有规则，只检查基本条件
    if (!couponRule) {
      return true;
    }

    // 2.1 商品券规则检查
    if (coupon.type === 'product') {
      // 检查是否有指定商品且达到数量要求
      if (couponRule.product_ids && couponRule.product_ids.length > 0) {
        const minQuantity = couponRule.min_quantity || 1;
        
        // 计算购物车中所有适用商品的总数量
        const totalApplicableQuantity = cartItems
          .filter(item => couponRule.product_ids.includes(item.product_id))
          .reduce((sum, item) => sum + item.quantity, 0);

        // 检查总数量是否满足最低要求
        if (totalApplicableQuantity < minQuantity) {
          return false;
        }
      }
    }
    
    // 2.2 时间券规则检查
    if (coupon.type === 'time') {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const dayOfWeek = now.getDay(); // 0是周日, 1-6是周一到周六
      const today = now.toISOString().split('T')[0]; // 格式: YYYY-MM-DD
      
      // 固定日期检查
      if (couponRule.time_type === 'fixed' && couponRule.fixed_dates) {
        if (!couponRule.fixed_dates.includes(today)) {
          return false;
        }
      }
      
      // 周期性日期检查
      if (couponRule.time_type === 'recurring' && couponRule.recurring) {
        if (!couponRule.recurring.days_of_week.includes(dayOfWeek)) {
          return false;
        }
      }
      
      // 时间段检查
      if (couponRule.time_ranges && couponRule.time_ranges.length > 0) {
        const inTimeRange = couponRule.time_ranges.some((range: string) => {
          const [start, end] = range.split('-').map((time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          });
          return currentTime >= start && currentTime <= end;
        });
        
        if (!inTimeRange) {
          return false;
        }
      }
    }
    
    // 2.3 满减券规则检查
    if (coupon.type === 'amount') {
      if (couponRule.tiers && couponRule.tiers.length > 0) {
        // 找出订单金额满足条件的最低层级
        const applicableTier = couponRule.tiers
          .sort((a: TierRule, b: TierRule) => a.min_amount - b.min_amount)
          .find((tier: TierRule) => total >= tier.min_amount);
        
        if (!applicableTier) {
          return false;
        }
      }
    }
    
    // 通过所有检查
    return true;
  };

  // 检查优惠券是否被应用（通过叠加规则）
  const isCouponApplied = (couponId: string) => {
    return appliedCoupons.some(c => c.id === couponId);
  };

  // 优惠券不可用的原因提示
  const getCouponIneligibleReason = (coupon: Coupon) => {
    if (coupon.min_purchase && total < coupon.min_purchase) {
      return `订单金额不满${formatPrice(coupon.min_purchase)}元`;
    }

    const couponRule = coupon.coupon_rule 
      ? (typeof coupon.coupon_rule === 'string' ? JSON.parse(coupon.coupon_rule) : coupon.coupon_rule)
      : null;

    if (!couponRule) {
      return "不满足使用条件";
    }

    if (coupon.type === 'product' && couponRule.product_ids) {
      // 检查购物车中是否有适用的商品
      const hasApplicableProducts = cartItems.some(item => couponRule.product_ids.includes(item.product_id));
      if (!hasApplicableProducts) {
        return "购物车中没有该优惠券指定的商品";
      }
      
      // 如果有适用商品但数量不足
      const minQuantity = couponRule.min_quantity || 1;
      return `指定商品需累计购买至少 ${minQuantity} 件`;
    }

    if (coupon.type === 'time') {
      return "当前时间不在优惠券可用时间范围内";
    }

    if (coupon.type === 'amount' && couponRule.tiers) {
      const minTier = couponRule.tiers.reduce(
        (min: TierRule, tier: TierRule) => 
          tier.min_amount < min.min_amount ? tier : min,
        couponRule.tiers[0]
      );
      return `订单金额不满${formatPrice(minTier.min_amount)}元`;
    }

    return "不满足使用条件";
  };

  // 调整：检查优惠券是否【能被加入选择】（考虑叠加规则）
  const canCouponBeSelected = (couponToCheck: Coupon): { selectable: boolean; reason: string | null } => {
    // 1. 基础适用性检查 (如果券本身不可用，则不能选)
    const applicable = isCouponApplicable(couponToCheck);
    if (!applicable) {
      return { selectable: false, reason: getCouponIneligibleReason(couponToCheck) };
    }

    const couponToCheckId = couponToCheck.id!;
    const selectedSet = new Set(selectedCoupons);

    // 2. DISALLOW 检查 (如果要选的券和【任何】已选券冲突，则不能选)
    for (const rule of disallowRules) {
      const ruleIds = new Set(rule.coupon_ids);
      if (ruleIds.has(couponToCheckId)) {
        for (const selectedId of selectedSet) {
          if (ruleIds.has(selectedId)) {
            const conflictingCouponName = availableCoupons.find(c => c.id === selectedId)?.name || '已选优惠券';
            return { 
              selectable: false, 
              reason: `不可与 '${conflictingCouponName}' 叠加 (规则: ${rule.name || '不兼容'})` 
            };
          }
        }
      }
    }

    // 3. ALLOW 检查 (如果要选的券加入后，【新的组合】是否符合 ALLOW 规则)
    if (allowRules.length > 0) {
      // 模拟将要检查的券加入后的新选择集合
      const potentialSelectedSet = new Set(selectedSet);
      potentialSelectedSet.add(couponToCheckId);

      // 如果新组合的券数大于1，才需要检查 ALLOW 规则
      if (potentialSelectedSet.size > 1) {
        // 检查是否存在一个 ALLOW 规则包含了【新的组合】中的所有券
        const isAllowedByAnyRule = allowRules.some(rule => {
          const ruleIds = new Set(rule.coupon_ids);
          return [...potentialSelectedSet].every(id => ruleIds.has(id));
        });

        // 如果没有任何 ALLOW 规则能包含这个新组合，则不能选择这张券
        if (!isAllowedByAnyRule) {
          return { 
            selectable: false, 
            reason: `选择此券后不符合叠加规则` 
          };
        }
      }
    }

    // 4. 通过所有检查，可以被选择
    return { selectable: true, reason: null };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>优惠券</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog 
          open={isOpen} 
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open && selectedCoupons.length > 0) {
              onCouponSelect(selectedCoupons, calculatedDiscount);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(true);
              }}
              type="button"
              disabled={isCalculatingDiscount}
            >
              <span>
                {selectedCoupons.length > 0
                  ? `已选择 ${selectedCoupons.length} 张优惠券`
                  : "选择优惠券"}
              </span>
              {isCalculatingDiscount ? (
                <span className="text-xs text-muted-foreground italic">更新中...</span>
              ) : calculatedDiscount > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  省 ¥{formatPrice(calculatedDiscount)}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>选择优惠券</DialogTitle>
            </DialogHeader>
            
            {isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : availableCoupons.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium">暂无可用优惠券</h3>
                <p className="text-sm text-muted-foreground">
                  您当前没有可用的优惠券，请关注活动获取优惠券
                </p>
              </div>
            ) : (
              <div className="max-h-[50vh] space-y-3 overflow-y-auto py-2">
                {availableCoupons.map((coupon) => {
                  const isSelected = selectedCoupons.includes(coupon.id!);
                  
                  // 获取是否可以加入选择的信息
                  const { selectable: canBeAdded, reason: cannotAddReason } = canCouponBeSelected(coupon);
                  // 获取券本身是否可用
                  const isApplicable = isCouponApplicable(coupon);
                  const basicIneligibleReason = !isApplicable ? getCouponIneligibleReason(coupon) : null;

                  // 决定按钮是否禁用：
                  // 1. 如果券本身不可用，则始终禁用
                  // 2. 如果券本身可用，但【尝试选择它】(从未选变已选) 时会违反规则，则禁用
                  // 3. 如果券已被选中，则【不】禁用，允许取消
                  const isDisabled = !isApplicable || (!isSelected && !canBeAdded);
                  
                  // 决定显示的原因：优先显示叠加规则原因，其次显示基础不可用原因
                  const displayReason = isDisabled ? (cannotAddReason || basicIneligibleReason) : null;

                  const isNotApplied = isSelected && !isCouponApplied(coupon.id!); 
                  const stackingError = stackingErrors[coupon.id!];

                  return (
                    <div
                      key={coupon.id}
                      className={`relative rounded-lg border p-4 transition-all ${
                        isSelected
                          ? isNotApplied 
                            ? "border-yellow-400 bg-yellow-50"
                            : "border-primary bg-primary/5"
                          : isDisabled
                          ? "border-muted bg-muted/10 opacity-60 cursor-not-allowed"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`rounded-full p-2 ${getCouponColor(coupon.color)}`}>
                            {getCouponIcon(coupon.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">{coupon.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {coupon.description || ''}
                            </p>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {new Date(coupon.end_date).toLocaleDateString()} 前有效
                              </Badge>
                              {coupon.min_purchase > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  满 ¥{formatPrice(coupon.min_purchase)} 可用
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {coupon.type === 'product' ? '指定商品' : 
                                 coupon.type === 'time' ? '限时优惠' : 
                                 coupon.type === 'amount' ? '满额减' : '折扣'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => handleCouponToggle(coupon.id!, e)}
                          disabled={isDisabled}
                          type="button"
                        >
                          {isSelected ? "已选择" : "选择"}
                        </Button>
                      </div>
                      
                      {isDisabled && displayReason && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {displayReason}
                        </p>
                      )}
                      
                      {stackingError && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>{stackingError}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              {selectedCoupons.length > 0 && (
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span>预计优惠金额:</span>
                  {isCalculatingDiscount ? (
                    <span className="text-muted-foreground">计算中...</span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      ¥{formatPrice(calculatedDiscount)}
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                  type="button"
                  disabled={isCalculatingDiscount}
                >
                  取消
                </Button>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirm();
                  }} 
                  disabled={isCalculatingDiscount || isLoading || isLoadingRules || selectedCoupons.length === 0 || cartItems.length === 0}
                  type="button"
                  className={selectedCoupons.length > 0 && !isCalculatingDiscount ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {isCalculatingDiscount ? (
                    <span>计算中...</span>
                  ) : selectedCoupons.length > 0 ? (
                    `确认优惠 (¥${formatPrice(calculatedDiscount)})`
                  ) : (
                    "确认"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {selectedCoupons.length > 0 ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">已应用的优惠券：</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" type="button">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>优惠券按照平台设定的顺序自动应用</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-2">
              {selectedCoupons.map((couponId) => {
                const coupon = availableCoupons.find(c => c.id === couponId);
                if (!coupon) return null;
                
                return (
                  <div key={coupon.id} className="flex items-center justify-between rounded-md bg-accent p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1 ${getCouponColor(coupon.color)}`}>
                        {getCouponIcon(coupon.type)}
                      </div>
                      <span>{coupon.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleCouponToggle(coupon.id!, e)}
                      type="button"
                      disabled={isCalculatingDiscount}
                    >
                      &times;
                    </Button>
                  </div>
                );
              })}
            </div>
            {calculatedDiscount > 0 && (
              <div className="text-right text-sm font-medium text-green-600">
                节省: ¥{formatPrice(calculatedDiscount)}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            暂未选择优惠券
          </p>
        )}
      </CardContent>
    </Card>
  );
} 