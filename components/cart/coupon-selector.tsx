"use client";

import { useState } from "react";
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
import { BadgePercent, Calendar, Package, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

// 模拟优惠券数据，实际应用中应该从API或状态管理中获取
const mockCoupons = [
  {
    id: "1",
    type: "discount",
    name: "九折优惠券",
    description: "全场商品九折",
    discount: 0.1,
    minPurchase: 100,
    validUntil: "2023-12-31",
    icon: <BadgePercent className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "2",
    type: "fixed",
    name: "满100减20",
    description: "订单满100元减20元",
    discount: 20,
    minPurchase: 100,
    validUntil: "2023-12-31",
    icon: <Tag className="h-5 w-5" />,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "3",
    type: "product",
    name: "电子产品优惠",
    description: "指定电子产品8.5折",
    discount: 0.15,
    validUntil: "2023-12-15",
    icon: <Package className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "4",
    type: "time",
    name: "周末特惠",
    description: "周末下单额外9.5折",
    discount: 0.05,
    validUntil: "2023-12-31",
    icon: <Calendar className="h-5 w-5" />,
    color: "bg-orange-100 text-orange-600",
  },
];

interface CouponSelectorProps {
  total: number;
  onCouponSelect: (couponIds: string[]) => void;
}

export default function CouponSelector({ total, onCouponSelect }: CouponSelectorProps) {
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleCouponToggle = (couponId: string) => {
    setSelectedCoupons((prev) => {
      // 如果已选中，则取消选择
      if (prev.includes(couponId)) {
        return prev.filter((id) => id !== couponId);
      }
      // 如果未选中，则添加到选中列表
      return [...prev, couponId];
    });
  };

  const handleConfirm = () => {
    onCouponSelect(selectedCoupons);
    setIsOpen(false);
  };

  // 获取选中的优惠券信息
  const getSelectedCouponInfo = () => {
    if (selectedCoupons.length === 0) {
      return null;
    }
    
    return selectedCoupons.map(id => 
      mockCoupons.find(coupon => coupon.id === id)
    );
  };

  // 计算估算的优惠金额 (简单示例)
  const calculateDiscount = () => {
    let totalDiscount = 0;
    
    selectedCoupons.forEach(id => {
      const coupon = mockCoupons.find(c => c.id === id);
      if (coupon) {
        if (coupon.type === 'discount') {
          totalDiscount += total * coupon.discount;
        } else if (coupon.type === 'fixed' && total >= (coupon.minPurchase || 0)) {
          totalDiscount += coupon.discount;
        }
        // 其他类型优惠券的计算逻辑可根据需求添加
      }
    });
    
    return totalDiscount;
  };

  const selectedCouponInfo = getSelectedCouponInfo();
  const estimatedDiscount = calculateDiscount();

  return (
    <Card>
      <CardHeader>
        <CardTitle>优惠券</CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsOpen(true)}
            >
              <span>
                {selectedCoupons.length > 0
                  ? `已选择 ${selectedCoupons.length} 张优惠券`
                  : "选择优惠券"}
              </span>
              {estimatedDiscount > 0 && (
                <Badge variant="secondary">
                  可省 ¥{formatPrice(estimatedDiscount)}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>选择优惠券</DialogTitle>
            </DialogHeader>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto py-2">
              {mockCoupons.map((coupon) => {
                const isSelected = selectedCoupons.includes(coupon.id);
                const isDisabled = coupon.minPurchase !== undefined && total < coupon.minPurchase;
                
                return (
                  <div
                    key={coupon.id}
                    className={`relative rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : isDisabled
                        ? "border-muted bg-muted/10 opacity-60"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`rounded-full p-2 ${coupon.color}`}>
                          {coupon.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{coupon.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {coupon.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {coupon.validUntil} 前有效
                            </Badge>
                            {coupon.minPurchase && (
                              <Badge variant="outline" className="text-xs">
                                满 ¥{formatPrice(coupon.minPurchase)} 可用
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCouponToggle(coupon.id)}
                        disabled={isDisabled}
                      >
                        {isSelected ? "已选择" : "选择"}
                      </Button>
                    </div>
                    {isDisabled && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        订单金额不满足使用条件
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
              <Button onClick={handleConfirm}>确认</Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedCouponInfo && selectedCouponInfo.length > 0 ? (
          <div className="mt-3 space-y-2">
            <h3 className="text-sm font-medium">已选择的优惠券：</h3>
            <div className="space-y-2">
              {selectedCouponInfo.map((coupon) => 
                coupon && (
                  <div key={coupon.id} className="flex items-center justify-between rounded-md bg-accent p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1 ${coupon.color}`}>
                        {coupon.icon}
                      </div>
                      <span>{coupon.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCouponToggle(coupon.id)}
                    >
                      &times;
                    </Button>
                  </div>
                )
              )}
            </div>
            {estimatedDiscount > 0 && (
              <div className="text-right text-sm font-medium text-green-600">
                预计节省: ¥{formatPrice(estimatedDiscount)}
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