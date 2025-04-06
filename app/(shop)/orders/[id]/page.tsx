"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrderStore, OrderStatus, Order } from "@/lib/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, AlertCircle, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { formatPrice, safeMultiply } from "@/lib/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { initMockOrders, getOrderById, mockInitialized, cancelOrder, confirmReceived } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    if (!mockInitialized) {
      initMockOrders();
    }
    
    const foundOrder = getOrderById(params.id);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [initMockOrders, getOrderById, mockInitialized, params.id]);

  // 根据订单状态获取图标
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.PENDING_SHIPMENT:
        return <Package className="h-4 w-4" />;
      case OrderStatus.SHIPPED:
        return <Truck className="h-4 w-4" />;
      case OrderStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // 根据订单状态获取颜色
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return "text-yellow-500 bg-yellow-100";
      case OrderStatus.PENDING_SHIPMENT:
        return "text-blue-500 bg-blue-100";
      case OrderStatus.SHIPPED:
        return "text-green-500 bg-green-100";
      case OrderStatus.COMPLETED:
        return "text-green-700 bg-green-100";
      case OrderStatus.CANCELLED:
        return "text-red-500 bg-red-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (!mounted) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }

  if (!order) {
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
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>订单不存在</AlertTitle>
          <AlertDescription>
            未找到该订单，请返回订单列表查看其他订单。
          </AlertDescription>
        </Alert>
      </div>
    );
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
                  className={`${getStatusColor(order.status)} flex items-center gap-1 px-3 py-1.5`}
                >
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">订单编号</p>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">下单时间</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">支付方式</p>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">订单状态</p>
                  <p className="font-medium">{order.status}</p>
                </div>
              </div>
              
              {order.status === OrderStatus.SHIPPED && order.trackingNumber && order.shippingMethod && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-700">物流信息</p>
                  <p className="text-sm">物流单号：{order.trackingNumber}</p>
                  <p className="text-sm">物流公司：{order.shippingMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 商品列表 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">商品信息</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                    <div className="h-24 w-24 overflow-hidden rounded-md border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.name}</div>
                      {item.specifications && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {Object.entries(item.specifications).map(([key, value]) => (
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
              <div className="space-y-2">
                <p><span className="text-muted-foreground">收货人：</span>{order.shippingAddress.name}</p>
                <p><span className="text-muted-foreground">联系电话：</span>{order.shippingAddress.phone}</p>
                <p><span className="text-muted-foreground">收货地址：</span>{order.shippingAddress.province} {order.shippingAddress.city} {order.shippingAddress.district} {order.shippingAddress.address}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* 金额明细 */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">金额明细</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品金额</span>
                  <span>¥{formatPrice(order.totalAmount)}</span>
                </div>
                {order.shippingFee !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运费</span>
                    <span>¥{formatPrice(order.shippingFee)}</span>
                  </div>
                )}
                {order.discount !== undefined && order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">优惠</span>
                    <span className="text-red-500">-¥{formatPrice(order.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>实付款</span>
                  <span>¥{formatPrice(order.finalAmount !== undefined ? order.finalAmount : order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 操作按钮 */}
          <div className="flex flex-col gap-2">
            {order.status === OrderStatus.PENDING_PAYMENT && (
              <>
                <Button className="w-full">去支付</Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (window.confirm('确定要取消订单吗？')) {
                      cancelOrder(order.id);
                      router.push('/orders');
                    }
                  }}
                >
                  取消订单
                </Button>
              </>
            )}
            
            {order.status === OrderStatus.SHIPPED && (
              <Button 
                className="w-full"
                onClick={() => {
                  if (window.confirm('确认已收到商品？')) {
                    confirmReceived(order.id);
                  }
                }}
              >
                确认收货
              </Button>
            )}
            
            {order.status === OrderStatus.COMPLETED && (
              <Button variant="outline" className="w-full">再次购买</Button>
            )}
            
            <Button variant="ghost" className="w-full" onClick={() => router.push('/orders')}>
              返回订单列表
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 