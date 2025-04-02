"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrderStore, OrderStatus, Order, OrderItem } from "@/lib/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Package, ShoppingBag, Truck, XCircle } from "lucide-react";
import { formatPrice, safeMultiply } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OrdersPage() {
  const router = useRouter();
  const { initMockOrders, orders, mockInitialized, cancelOrder, confirmReceived } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    if (!mockInitialized) {
      initMockOrders();
    }
  }, [initMockOrders, mockInitialized]);
  
  // 获取所有订单状态的订单数量
  const orderCounts = {
    [OrderStatus.PENDING_PAYMENT]: orders.filter(order => order.status === OrderStatus.PENDING_PAYMENT).length,
    [OrderStatus.PENDING_SHIPMENT]: orders.filter(order => order.status === OrderStatus.PENDING_SHIPMENT).length,
    [OrderStatus.SHIPPED]: orders.filter(order => order.status === OrderStatus.SHIPPED).length,
    [OrderStatus.COMPLETED]: orders.filter(order => order.status === OrderStatus.COMPLETED).length,
    [OrderStatus.CANCELLED]: orders.filter(order => order.status === OrderStatus.CANCELLED).length,
    all: orders.length,
  };
  
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
        return <ShoppingBag className="h-4 w-4" />;
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // 订单卡片组件
  const OrderCard = ({ order, showActions = true }: { order: Order, showActions?: boolean }) => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-base">订单号: {order.orderNumber}</CardTitle>
              <CardDescription>下单时间: {formatDate(order.createdAt)}</CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(order.status)} flex items-center gap-1 px-2 py-1`}
            >
              {getStatusIcon(order.status)}
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="space-y-4">
            {/* 显示订单中的前两个商品 */}
            {order.items.slice(0, 2).map((item: OrderItem) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-md border">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ¥{formatPrice(item.price)} × {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">¥{formatPrice(safeMultiply(item.price, item.quantity))}</div>
                </div>
              </div>
            ))}
            
            {/* 如果商品超过2个，显示更多提示 */}
            {order.items.length > 2 && (
              <div className="text-center text-sm text-muted-foreground">
                还有 {order.items.length - 2} 件商品...
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {order.items.length} 件商品
              </div>
              <div className="text-lg font-semibold">
                总计: ¥{formatPrice(order.totalAmount)}
              </div>
            </div>
          </div>
        </CardContent>
        
        {showActions && (
          <CardFooter className="flex justify-between pt-0">
            <Button variant="outline" onClick={() => router.push(`/orders/${order.id}`)}>
              查看详情
            </Button>
            
            <div className="space-x-2">
              {order.status === OrderStatus.PENDING_PAYMENT && (
                <>
                  <Button variant="default">
                    去支付
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (window.confirm('确定要取消订单吗？')) {
                        cancelOrder(order.id);
                      }
                    }}
                  >
                    取消订单
                  </Button>
                </>
              )}
              
              {order.status === OrderStatus.SHIPPED && (
                <Button 
                  variant="default"
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
                <Button variant="outline">
                  再次购买
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    );
  };
  
  if (!mounted) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/products">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Button>
        </Link>
      </div>
      
      <h1 className="mb-6 text-3xl font-bold">我的订单</h1>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="all" className="relative">
            全部订单
            {orderCounts.all > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts.all}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={OrderStatus.PENDING_PAYMENT} className="relative">
            待付款
            {orderCounts[OrderStatus.PENDING_PAYMENT] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[OrderStatus.PENDING_PAYMENT]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={OrderStatus.PENDING_SHIPMENT} className="relative">
            待发货
            {orderCounts[OrderStatus.PENDING_SHIPMENT] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[OrderStatus.PENDING_SHIPMENT]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={OrderStatus.SHIPPED} className="relative">
            已发货
            {orderCounts[OrderStatus.SHIPPED] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[OrderStatus.SHIPPED]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={OrderStatus.COMPLETED} className="relative">
            已完成
            {orderCounts[OrderStatus.COMPLETED] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[OrderStatus.COMPLETED]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={OrderStatus.CANCELLED} className="relative">
            已取消
            {orderCounts[OrderStatus.CANCELLED] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[OrderStatus.CANCELLED]}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {orders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>暂无订单</AlertTitle>
              <AlertDescription>
                您还没有任何订单，去浏览商品并下单吧！
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {Object.values(OrderStatus).map((status) => (
          <TabsContent key={status} value={status}>
            {orders.filter((order) => order.status === status).length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>暂无{status}订单</AlertTitle>
                <AlertDescription>
                  您还没有{status}的订单。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((order) => order.status === status)
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {orders.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled>
            <ChevronLeft className="mr-2 h-4 w-4" />
            上一页
          </Button>
          <div className="text-sm text-muted-foreground">
            第1页，共{Math.ceil(orders.length / 10)}页
          </div>
          <Button variant="outline" disabled={orders.length <= 10}>
            下一页
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 