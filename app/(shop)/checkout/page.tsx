"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ShoppingCart,
  BadgePercent,
  TruckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, safeMultiply, safeSubtract } from "@/lib/utils/format";
import AddressSelector from "@/components/checkout/address-selector";
import PaymentMethod from "@/components/checkout/payment-method";
import CouponSelector from "@/components/checkout/coupon-selector";

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("alipay");
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  
  const router = useRouter();
  
  // 从购物车状态获取数据
  const {
    items,
    getTotalPrice,
    getTotalOriginalPrice,
    clearCart
  } = useCartStore();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // 防止hydration不匹配
  if (!mounted) {
    return <div className="container mx-auto py-10">正在加载...</div>;
  }

  // 如果购物车为空，重定向到购物车页面
  if (items.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href="/cart">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              返回购物车
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20">
          <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">购物车为空</h2>
          <p className="mb-6 text-center text-muted-foreground">
            您的购物车中还没有商品，无法进行结算
          </p>
          <Link href="/products">
            <Button>浏览商品</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 计算金额
  const subtotal = getTotalPrice();
  const originalPrice = getTotalOriginalPrice();
  const productDiscount = safeSubtract(originalPrice, subtotal);
  
  // 配送费 (示例: 订单金额满99元免运费，否则10元运费)
  const shippingFee = subtotal >= 99 ? 0 : 10;
  
  // 最终价格 = 商品总价 - 优惠券折扣 + 配送费
  const finalPrice = safeSubtract(subtotal, couponDiscount) + shippingFee;

  // 处理订单提交
  const handleSubmitOrder = async () => {
    // 基本验证
    if (!selectedAddress) {
      alert("请选择收货地址");
      return;
    }

    if (!selectedPaymentMethod) {
      alert("请选择支付方式");
      return;
    }

    try {
      setIsSubmitting(true);

      // 这里模拟API请求创建订单
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 清空购物车
      clearCart();

      // 跳转到支付模拟页面
      router.push(`/checkout/payment?orderId=${Date.now()}&amount=${finalPrice}&method=${selectedPaymentMethod}`);
    } catch {
      alert("提交订单失败，请稍后重试");
      setIsSubmitting(false);
    }
  };

  // 处理优惠券选择
  const handleCouponSelect = (couponIds: string[]) => {
    setSelectedCoupons(couponIds);
    
    // 简单优惠券计算逻辑示例
    if (couponIds.length > 0) {
      // 这里简化处理，假设选择了优惠券后有20元优惠
      // 实际应用中应该根据选择的具体优惠券计算折扣
      setCouponDiscount(20);
    } else {
      setCouponDiscount(0);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/cart">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回购物车
          </Button>
        </Link>
      </div>

      <h1 className="mb-6 text-3xl font-bold">结算</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 左侧：收货地址、支付方式和优惠券 */}
        <div className="lg:col-span-2 space-y-6">
          <AddressSelector onAddressSelect={setSelectedAddress} />
          <PaymentMethod onMethodSelect={setSelectedPaymentMethod} />
          <CouponSelector total={subtotal} onCouponSelect={handleCouponSelect} />
        </div>

        {/* 右侧：订单摘要 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* 商品列表 */}
              <div>
                <h3 className="mb-2 font-medium">订单商品 ({items.length})</h3>
                <div className="max-h-[250px] overflow-y-auto rounded-md border">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border-b p-3 last:border-0">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={item.image || '/placeholder.svg'}
                          alt={item.name || '商品图片'}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>¥{formatPrice(item.price)} x {item.quantity}</span>
                          <span>¥{formatPrice(safeMultiply(item.price, item.quantity))}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 价格计算 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品总额</span>
                  <span>¥{formatPrice(originalPrice)}</span>
                </div>
                
                {productDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="h-4 w-4" />
                      商品折扣
                    </span>
                    <span>-¥{formatPrice(productDiscount)}</span>
                  </div>
                )}
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="h-4 w-4" />
                      优惠券折扣
                    </span>
                    <span>-¥{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <TruckIcon className="h-4 w-4" />
                    配送费
                  </span>
                  {shippingFee > 0 ? (
                    <span>¥{formatPrice(shippingFee)}</span>
                  ) : (
                    <span className="text-green-600">免运费</span>
                  )}
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>应付金额</span>
                <span className="text-xl text-primary">¥{formatPrice(finalPrice)}</span>
              </div>
              
              {/* 订单备注 (可选) */}
              <div className="rounded-md bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground">
                  下单即表示您同意<Link href="/terms" className="text-primary underline">《用户协议》</Link>和<Link href="/privacy" className="text-primary underline">《隐私政策》</Link>
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
              >
                {isSubmitting ? "提交中..." : "提交订单"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 