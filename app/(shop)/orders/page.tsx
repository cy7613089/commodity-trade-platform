"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrderStore, Order, OrderItem } from "@/lib/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Package, ShoppingBag, Truck, XCircle } from "lucide-react";
import { formatPrice, safeMultiply } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";
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

export default function OrdersPage() {
  const router = useRouter();
  const { 
    orders, 
    loading, 
    error, 
    pagination,
    fetchOrders, 
    cancelOrder, 
    confirmReceived 
  } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    // 获取订单数据
    fetchOrders();
  }, [fetchOrders]);

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 如果不是"all"，则按状态筛选
    if (value !== "all") {
      fetchOrders({ status: value, page: 1 });
    } else {
      fetchOrders({ page: 1 });
    }
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    fetchOrders({
      status: activeTab !== "all" ? activeTab : undefined,
      page: newPage
    });
  };
  
  // 获取所有订单状态的订单数量
  const orderCounts = {
    all: pagination.totalItems,
    // 注意：这里只能统计当前可见的订单，除非API提供了各状态的计数
    // 实际应用中可能需要另一个API端点提供状态计数
    [ORDER_STATUS.PENDING_PAYMENT]: orders.filter(order => order.status === ORDER_STATUS.PENDING_PAYMENT).length,
    [ORDER_STATUS.PENDING_SHIPMENT]: orders.filter(order => order.status === ORDER_STATUS.PENDING_SHIPMENT).length,
    [ORDER_STATUS.SHIPPED]: orders.filter(order => order.status === ORDER_STATUS.SHIPPED).length,
    [ORDER_STATUS.COMPLETED]: orders.filter(order => order.status === ORDER_STATUS.COMPLETED).length,
    [ORDER_STATUS.CANCELLED]: orders.filter(order => order.status === ORDER_STATUS.CANCELLED).length,
  };
  
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
        return <ShoppingBag className="h-4 w-4" />;
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // 订单卡片组件
  const OrderCard = ({ order, showActions = true }: { order: Order, showActions?: boolean }) => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-base">订单号: {order.order_number}</CardTitle>
              <CardDescription>下单时间: {formatDate(order.created_at)}</CardDescription>
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
            {order.order_items.slice(0, 2).map((item: OrderItem) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-md border">
                    <Image
                      src={item.product_image || "/placeholder-product.jpg"}
                      alt={item.product_name || "商品"}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{item.product_name || "商品名称"}</div>
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
            {order.order_items.length > 2 && (
              <div className="text-center text-sm text-muted-foreground">
                还有 {order.order_items.length - 2} 件商品...
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {order.order_items.length} 件商品
              </div>
              <div className="text-lg font-semibold">
                总计: ¥{formatPrice(order.final_amount)}
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
              {order.status === ORDER_STATUS.PENDING_PAYMENT && (
                <>
                  <Button 
                    variant="default"
                    onClick={async () => {
                      try {
                        // 更新订单状态为"待发货"
                        const response = await fetch(`/api/orders/${order.id}`, {
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
                        router.push(`/checkout/payment?orderId=${order.id}&amount=${order.final_amount}&method=alipay`);
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
              
              {order.status === ORDER_STATUS.SHIPPED && (
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
              
              {order.status === ORDER_STATUS.COMPLETED && (
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

  // 加载骨架屏
  const OrderCardSkeleton = () => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Skeleton className="h-9 w-24" />
        <div className="space-x-2">
          <Skeleton className="h-9 w-20 inline-block" />
          <Skeleton className="h-9 w-20 inline-block" />
        </div>
      </CardFooter>
    </Card>
  );
  
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>获取订单失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="all" className="relative">
            全部订单
            {orderCounts.all > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts.all}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={ORDER_STATUS.PENDING_PAYMENT} className="relative">
            待付款
            {orderCounts[ORDER_STATUS.PENDING_PAYMENT] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[ORDER_STATUS.PENDING_PAYMENT]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={ORDER_STATUS.PENDING_SHIPMENT} className="relative">
            待发货
            {orderCounts[ORDER_STATUS.PENDING_SHIPMENT] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[ORDER_STATUS.PENDING_SHIPMENT]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={ORDER_STATUS.SHIPPED} className="relative">
            已发货
            {orderCounts[ORDER_STATUS.SHIPPED] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[ORDER_STATUS.SHIPPED]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={ORDER_STATUS.COMPLETED} className="relative">
            已完成
            {orderCounts[ORDER_STATUS.COMPLETED] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[ORDER_STATUS.COMPLETED]}</Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={ORDER_STATUS.CANCELLED} className="relative">
            已取消
            {orderCounts[ORDER_STATUS.CANCELLED] > 0 && (
              <Badge variant="secondary" className="ml-1">{orderCounts[ORDER_STATUS.CANCELLED]}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : orders.length === 0 ? (
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
        
        {Object.values(ORDER_STATUS).map((status) => (
          <TabsContent key={status} value={status}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <OrderCardSkeleton key={i} />
                ))}
              </div>
            ) : orders.filter((order) => order.status === status).length === 0 ? (
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
      
      {!loading && orders.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            disabled={pagination.currentPage <= 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            上一页
          </Button>
          <div className="text-sm text-muted-foreground">
            第{pagination.currentPage}页，共{pagination.totalPages}页
          </div>
          <Button 
            variant="outline" 
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            下一页
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 