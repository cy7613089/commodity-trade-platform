"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/lib/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, AlertCircle, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { formatPrice, safeMultiply } from "@/lib/utils/format";
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

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
    // 获取订单详情
    fetchOrderById(params.id);
    
    // 组件卸载时清理当前订单
    return () => {
      clearCurrentOrder();
    };
  }, [fetchOrderById, clearCurrentOrder, params.id]);

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
                    <span className="ml-1">{currentOrder.status}</span>
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
                    <p className="font-medium">{currentOrder.status}</p>
                  </div>
                </div>
                
                {/* 物流信息区域 - 使用类型断言处理可能不存在的属性 */}
                {currentOrder.status === ORDER_STATUS.SHIPPED && 
                 ((currentOrder as any).tracking_number || (currentOrder as any).shipping_method) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-700">物流信息</p>
                    {(currentOrder as any).tracking_number && (
                      <p className="text-sm">物流单号：{(currentOrder as any).tracking_number}</p>
                    )}
                    {(currentOrder as any).shipping_method && (
                      <p className="text-sm">物流公司：{(currentOrder as any).shipping_method}</p>
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
                  {currentOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                      <div className="h-24 w-24 overflow-hidden rounded-md border">
                        <Image
                          src={item.product_image || "/placeholder-product.jpg"}
                          alt={item.product_name || "商品"}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.product_name}</div>
                        {/* 使用类型断言处理可能不存在的规格信息 */}
                        {(item as any).specifications && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {Object.entries((item as any).specifications).map(([key, value]) => (
                              <span key={key} className="mr-2">{key}: {String(value)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <div className="font-medium">¥{formatPrice(item.price)}</div>
                        <div className="text-sm text-muted-foreground">x {item.quantity}</div>
                        <div className="font-semibold mt-1">¥{formatPrice(safeMultiply(item.price, item.quantity))}</div>
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
                {currentOrder.addresses ? (
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">收货人：</span>{currentOrder.addresses.recipient_name}</p>
                    <p><span className="text-muted-foreground">联系电话：</span>{currentOrder.addresses.phone}</p>
                    <p><span className="text-muted-foreground">收货地址：</span>{currentOrder.addresses.province} {currentOrder.addresses.city} {currentOrder.addresses.district || ''} {currentOrder.addresses.address}</p>
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
                    <span>¥{formatPrice(currentOrder.total_amount)}</span>
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
                  <Button className="w-full">去支付</Button>
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