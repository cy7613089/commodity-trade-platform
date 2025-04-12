"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  BadgePercent,
  TruckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, safeMultiply, safeSubtract, safeAdd } from "@/lib/utils/format";
import AddressSelector from "@/components/checkout/address-selector";
import PaymentMethod from "@/components/checkout/payment-method";
import CouponSelector from "@/components/cart/coupon-selector";
import { toast } from "sonner";

// 定义订单详情和订单项类型
interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  id: string;
  order_items: OrderItem[];
  final_amount: number;
}

// 修改CartItem类型定义
interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

// 订单项API响应接口
interface OrderItemResponse {
  id: string;
  product_id?: string;
  product_name?: string;
  product_image?: string;
  price: number;
  quantity: number;
  products?: {
    id: string;
    name: string;
    images: string[] | string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const { items } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 更新cartItems的创建方式，确保使用productId而不是id
  const cartItems = useMemo<CartItem[]>(() => {
    // 如果有订单数据，使用订单中的商品
    if (orderDetails && orderDetails.order_items.length > 0) {
      return orderDetails.order_items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));
    }
    // 否则使用购物车中的商品
    return items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price
    }));
  }, [items, orderDetails]);

  // 获取订单数据
  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "获取订单数据失败");
        }
        
        const data = await response.json();
        
        // 处理嵌套的订单项数据结构
        if (data.order_items && Array.isArray(data.order_items)) {
          // 转换订单项结构，确保包含product_id
          const formattedOrderItems = data.order_items.map((item: OrderItemResponse) => ({
            id: item.id,
            product_id: item.product_id || (item.products?.id || ''), // 从嵌套的products获取id
            name: item.product_name || (item.products?.name || ''),
            image: item.product_image || (item.products?.images ? 
              (Array.isArray(item.products.images) ? item.products.images[0] : item.products.images) : 
              '/products/placeholder.png'),
            price: item.price,
            quantity: item.quantity
          }));
          
          setOrderDetails({
            ...data,
            order_items: formattedOrderItems
          });
        } else {
          setOrderDetails(data);
        }
      } catch (error) {
        console.error("获取订单数据失败:", error);
        toast.error("获取订单数据失败，请重试");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // 计算小计
  const subtotal = useMemo(() => {
    if (orderDetails) {
      // 如果有订单数据，计算订单商品总额
      return orderDetails.order_items.reduce((acc, item) => {
        return safeAdd(acc, safeMultiply(item.price, item.quantity));
      }, 0);
    }
    // 否则计算购物车商品总额
    return items.reduce((acc, item) => {
      return safeAdd(acc, safeMultiply(item.price, item.quantity));
    }, 0);
  }, [items, orderDetails]);

  // 计算最终金额
  const finalAmount = useMemo(() => {
    return safeSubtract(subtotal, discountAmount);
  }, [subtotal, discountAmount]);

  // 显示商品项
  const displayItems = orderDetails?.order_items || items;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // 处理优惠券选择
  const handleCouponSelect = (couponIds: string[], discount: number) => {
    setSelectedCoupons(couponIds);
    setDiscountAmount(discount);
  };

  // 处理提交订单 (现在改为处理更新订单金额)
  const handleSubmitOrder = async () => {
    // 1. 检查 orderId 是否存在
    if (!orderId) {
      toast.error("订单ID丢失，无法更新订单");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 2. 准备更新数据 (只包含金额)
      const updateData = {
        discount_amount: discountAmount,
        final_amount: finalAmount, // 使用计算好的 finalAmount
        // 可选：如果需要传递支付方式到下一页，可以在这里准备
        // payment_method: selectedPaymentMethod
      };
      
      // 移除创建订单用的 orderData 准备
      /* const orderData = {
        address_id: selectedAddress, // 修复硬编码 null
        // ...其他字段...
      };*/

      // 3. 调用 PUT /api/orders/[id] 更新订单金额
      const response = await fetch(`/api/orders/${orderId}`, { // 使用 orderId
        method: 'PUT', // <--- 改为 PUT
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData), // 发送更新数据
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "更新订单金额失败");
      }

      // 暂时注释掉未使用的 updatedOrder
      // const updatedOrder = await response.json();
      // 可选：可以根据 updatedOrder 更新本地状态，如果需要的话
      // setOrderDetails(updatedOrder);
      
      // 4. 移除清空购物车的逻辑
      // clearCart();
      
      // 5. 跳转到订单详情页面
      router.push(`/orders/${orderId}`); // <--- 修正跳转地址
      toast.success("订单金额已更新，正在跳转到订单详情...");

    } catch (error) {
      console.error("更新订单失败:", error);
      toast.error(error instanceof Error ? error.message : "更新订单失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 新增：表单提交处理函数
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 阻止默认提交
    handleSubmitOrder();   // 调用实际的订单处理逻辑
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

      {/* 使用 form 包裹主要内容 */}
      <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* 左侧：收货地址、支付方式和优惠券 */}
          <div className="lg:col-span-2 space-y-6">
            <AddressSelector onAddressSelect={() => {}} />
            <PaymentMethod onMethodSelect={() => {}} />
            {isLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>优惠券</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-4">
                    <p className="text-muted-foreground">正在加载订单数据...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <CouponSelector 
                cartItems={cartItems} 
                total={subtotal} 
                onCouponSelect={handleCouponSelect} 
              />
            )}
          </div>

          {/* 右侧：订单摘要 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">正在加载订单数据...</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[300px] overflow-y-auto space-y-3">
                      {displayItems.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <div className="relative h-16 w-16 overflow-hidden rounded-md">
                            <Image
                              src={item.image || "/products/placeholder.png"}
                              alt={item.name}
                              className="object-cover"
                              fill
                              sizes="64px"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              数量: {item.quantity} × ¥{formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ¥{formatPrice(safeMultiply(item.price, item.quantity))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">小计</span>
                        <span>¥{formatPrice(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-green-600">
                          <span className="text-sm flex items-center gap-1 font-medium">
                            <BadgePercent className="h-4 w-4" />
                            优惠金额
                          </span>
                          <span className="font-medium">-¥{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-1">
                          <TruckIcon className="h-3.5 w-3.5" />
                          运费
                        </span>
                        <span>¥0.00</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between font-semibold">
                      <span>总计</span>
                      <span>¥{formatPrice(finalAmount)}</span>
                    </div>

                    {selectedCoupons.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground text-right">
                        已应用 {selectedCoupons.length} 张优惠券
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || displayItems.length === 0 || isLoading}
                >
                  {isSubmitting ? "处理中..." : "提交订单"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
} 