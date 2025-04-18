"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useOrderStore } from "@/lib/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, AlertCircle, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { formatPrice, safeMultiply, safeAdd } from "@/lib/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// 定义订单状态常量
const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_SHIPMENT: 'PENDING_SHIPMENT',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

// 订单状态中文映射
const ORDER_STATUS_CN = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待付款',
  [ORDER_STATUS.PENDING_SHIPMENT]: '待发货',
  [ORDER_STATUS.SHIPPED]: '已发货',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消'
} as const;

// 定义更完整的 OrderItem 类型 (如果 store 中没有)
// interface OrderItem { 
//   id: string;
//   price: number;
//   quantity: number;
//   product_id?: string;
//   product_name?: string;
//   product_image?: string;
//   specifications?: Record<string, string | number>; // 可选的规格
// }

// 定义更完整的 Address 类型 (如果 store 中没有)
// interface Address {
//   recipient_name: string;
//   phone: string;
//   province: string;
//   city: string;
//   district?: string;
//   address: string;
// }

// 定义更完整的 Order 类型 (如果 store 中没有)
// interface Order {
//   id: string;
//   order_number: string;
//   created_at: string;
//   payment_method: string | null;
//   status: string;
//   order_items: OrderItem[];
//   total_amount: number;
//   shipping_fee: number | null;
//   discount_amount: number | null;
//   final_amount: number;
//   addresses: Address | null; // 地址可能不存在
//   tracking_number?: string; // 可选的物流信息
//   shipping_method?: string; // 可选的物流信息
// }

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { 
    currentOrder, 
    fetchOrderById, 
    clearCurrentOrder, 
    cancelOrder, 
    confirmReceived,
    loadingDetail,
    error 
  } = useOrderStore();
  const [mounted, setMounted] = useState(false);

  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    if (orderId) {
      fetchOrderById(orderId);
    }
    
    // 组件卸载时清理当前订单
    return () => {
      clearCurrentOrder();
    };
  }, [fetchOrderById, clearCurrentOrder, orderId]);

  // 在组件渲染之前计算小计
  const calculatedSubtotal = useMemo(() => {
    // 使用可选链确保 order_items 存在
    if (currentOrder?.order_items) {
      return currentOrder.order_items.reduce((res, item) => 
        // 假设 item.price 和 item.quantity 总是存在且为 number
        safeAdd(res, safeMultiply(item.price ?? 0, item.quantity ?? 0)), 
      0);
    } 
    return 0;
  }, [currentOrder]);

  // 根据订单状态获取图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING_PAYMENT:
        return <Clock className="h-4 w-4" />;
      case ORDER_STATUS.PENDING_SHIPMENT:
        return <Package className="h-4 w-4" />;
      case ORDER_STATUS.SHIPPED:
        return <Truck className="h-4 w-4" />;
      case ORDER_STATUS.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case ORDER_STATUS.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // 根据订单状态获取颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING_PAYMENT:
        return "text-yellow-500 bg-yellow-100";
      case ORDER_STATUS.PENDING_SHIPMENT:
        return "text-blue-500 bg-blue-100";
      case ORDER_STATUS.SHIPPED:
        return "text-green-500 bg-green-100";
      case ORDER_STATUS.COMPLETED:
        return "text-green-700 bg-green-100";
      case ORDER_STATUS.CANCELLED:
        return "text-red-500 bg-red-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 骨架屏 - 商品项
  const ItemSkeleton = () => (
    <div className="flex items-start space-x-4 py-4 border-b last:border-0">
      <Skeleton className="h-24 w-24 rounded-md" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="text-right min-w-[100px] space-y-2">
        <Skeleton className="h-5 w-16 ml-auto" />
        <Skeleton className="h-4 w-8 ml-auto" />
        <Skeleton className="h-5 w-20 ml-auto" />
      </div>
    </div>
  );

  if (!mounted) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/orders">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回订单列表
          </Button>
        </Link>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>获取订单失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loadingDetail ? (
        // 骨架屏加载状态
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-32 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <ItemSkeleton key={i} />)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-32 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ) : !currentOrder ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>订单不存在</AlertTitle>
          <AlertDescription>
            未找到该订单，请返回订单列表查看其他订单。
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* 左侧：订单信息和商品列表 */}
          <div className="md:col-span-2 space-y-6">
            {/* 订单基本信息 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">订单详情</h1>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(currentOrder.status)} flex items-center gap-1 px-3 py-1.5`}
                  >
                    {getStatusIcon(currentOrder.status)}
                    <span className="ml-1">{ORDER_STATUS_CN[currentOrder.status as keyof typeof ORDER_STATUS_CN]}</span>
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">订单编号</p>
                    <p className="font-medium">{currentOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">下单时间</p>
                    <p className="font-medium">{formatDate(currentOrder.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">支付方式</p>
                    <p className="font-medium">{currentOrder.payment_method || '待支付'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">订单状态</p>
                    <p className="font-medium">{ORDER_STATUS_CN[currentOrder.status as keyof typeof ORDER_STATUS_CN]}</p>
                  </div>
                </div>
                
                {/* 物流信息区域 - 使用可选链和空值合并 */}
                {currentOrder?.status === ORDER_STATUS.SHIPPED && 
                 (currentOrder?.tracking_number || currentOrder?.shipping_method) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-700">物流信息</p>
                    {currentOrder?.tracking_number && (
                      <p className="text-sm">物流单号：{currentOrder.tracking_number}</p>
                    )}
                    {currentOrder?.shipping_method && (
                      <p className="text-sm">物流公司：{currentOrder.shipping_method}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 商品列表 */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">商品信息</h2>
                <div className="space-y-4">
                  {/* 使用可选链确保 order_items 存在 */}
                  {currentOrder?.order_items?.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                      <div className="h-24 w-24 overflow-hidden rounded-md border">
                        <Image
                          // 提供默认图片和 alt
                          src={item.product_image || "/placeholder-product.jpg"}
                          alt={item.product_name || "商品图片"}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* 提供默认名称 */}
                        <div className="font-medium">{item.product_name ?? '商品名称待定'}</div>
                        {/* 移除 as any，直接使用可选链和类型检查 */}
                        {item?.specifications && typeof item.specifications === 'object' && Object.keys(item.specifications).length > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {/* 移除 as any */}
                            {Object.entries(item.specifications).map(([key, value]) => (
                              <span key={key} className="mr-2">{key}: {String(value ?? '')}</span> // 确保 value 转为 string
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        {/* 提供默认价格和数量 */}
                        <div className="font-medium">¥{formatPrice(item.price ?? 0)}</div>
                        <div className="text-sm text-muted-foreground">x {item.quantity ?? 0}</div>
                        <div className="font-semibold mt-1">¥{formatPrice(safeMultiply(item.price ?? 0, item.quantity ?? 0))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 右侧：收货信息和金额明细 */}
          <div className="space-y-6">
            {/* 收货信息 */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">收货信息</h2>
                {/* 使用可选链访问地址信息 */}
                {currentOrder?.addresses ? (
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">收货人：</span>{currentOrder.addresses.recipient_name ?? '-'}</p>
                    <p><span className="text-muted-foreground">联系电话：</span>{currentOrder.addresses.phone ?? '-'}</p>
                    <p><span className="text-muted-foreground">收货地址：</span>
                      {`${currentOrder.addresses.province ?? ''} ${currentOrder.addresses.city ?? ''} ${currentOrder.addresses.district ?? ''} ${currentOrder.addresses.address ?? '-'}`.trim()}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">暂无收货信息</p>
                )}
              </CardContent>
            </Card>
            
            {/* 金额明细 */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">金额明细</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品金额</span>
                    <span>¥{formatPrice(calculatedSubtotal)}</span>
                  </div>
                  {currentOrder.shipping_fee !== undefined && currentOrder.shipping_fee !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">运费</span>
                      <span>¥{formatPrice(currentOrder.shipping_fee)}</span>
                    </div>
                  )}
                  {currentOrder.discount_amount !== undefined && currentOrder.discount_amount !== null && currentOrder.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">优惠</span>
                      <span className="text-red-500">-¥{formatPrice(currentOrder.discount_amount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>实付款</span>
                    <span>¥{formatPrice(currentOrder.final_amount !== undefined ? currentOrder.final_amount : currentOrder.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 操作按钮 */}
            <div className="flex flex-col gap-2">
              {currentOrder.status === ORDER_STATUS.PENDING_PAYMENT && (
                <>
                  <Button 
                    className="w-full"
                    onClick={async () => {
                      try {
                        // 更新订单状态为"待发货"
                        const response = await fetch(`/api/orders/${currentOrder.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            status: "PENDING_SHIPMENT",
                            payment_method: "alipay",
                            payment_status: "paid"
                          }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || "更新订单状态失败");
                        }

                        // 跳转到支付模拟页面
                        router.push(`/checkout/payment?orderId=${currentOrder.id}&amount=${currentOrder.final_amount}&method=alipay`);
                      } catch (error) {
                        console.error("支付处理失败:", error);
                        alert(error instanceof Error ? error.message : "支付处理失败，请稍后重试");
                      }
                    }}
                  >
                    去支付
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (window.confirm('确定要取消订单吗？')) {
                        cancelOrder(currentOrder.id).then((success) => {
                          if (success) {
                            router.push('/orders');
                          }
                        });
                      }
                    }}
                  >
                    取消订单
                  </Button>
                </>
              )}
              
              {currentOrder.status === ORDER_STATUS.SHIPPED && (
                <Button 
                  className="w-full"
                  onClick={() => {
                    if (window.confirm('确认已收到商品？')) {
                      confirmReceived(currentOrder.id);
                    }
                  }}
                >
                  确认收货
                </Button>
              )}
              
              {currentOrder.status === ORDER_STATUS.COMPLETED && (
                <Button variant="outline" className="w-full">再次购买</Button>
              )}
              
              <Button variant="ghost" className="w-full" onClick={() => router.push('/orders')}>
                返回订单列表
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 