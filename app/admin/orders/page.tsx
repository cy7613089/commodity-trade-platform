"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAdminOrderStore } from "@/lib/store/admin-order-store";
import { OrderStatus } from "@/lib/store/order-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Package, Truck, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
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

export default function AdminOrdersPage() {
  const { orders, loading, error, pagination, fetchAllOrders, updateOrderStatus } = useAdminOrderStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    // 获取订单数据
    fetchAllOrders();
  }, [fetchAllOrders]);

  // 处理标签切换
  const handleTabChange = (value: string | undefined) => {
    setActiveTab(value);
    fetchAllOrders({ status: value, page: 1 });
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    fetchAllOrders({
      status: activeTab,
      page: newPage
    });
  };
  
  // 处理订单状态更新
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
    
    try {
      await updateOrderStatus(orderId, newStatus as OrderStatus);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
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

  // 加载骨架屏
  const TableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>订单号</TableHead>
          <TableHead>用户</TableHead>
          <TableHead>下单时间</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>商品数量</TableHead>
          <TableHead>商品金额</TableHead>
          <TableHead>运费</TableHead>
          <TableHead>折扣</TableHead>
          <TableHead>总金额</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array(5).fill(0).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (!mounted) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/products">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <h1 className="ml-4 text-3xl font-bold">订单管理</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={activeTab || "all"} onValueChange={(value) => handleTabChange(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选订单状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有订单</SelectItem>
              <SelectItem value={ORDER_STATUS.PENDING_PAYMENT}>{ORDER_STATUS_CN[ORDER_STATUS.PENDING_PAYMENT]}</SelectItem>
              <SelectItem value={ORDER_STATUS.PENDING_SHIPMENT}>{ORDER_STATUS_CN[ORDER_STATUS.PENDING_SHIPMENT]}</SelectItem>
              <SelectItem value={ORDER_STATUS.SHIPPED}>{ORDER_STATUS_CN[ORDER_STATUS.SHIPPED]}</SelectItem>
              <SelectItem value={ORDER_STATUS.COMPLETED}>{ORDER_STATUS_CN[ORDER_STATUS.COMPLETED]}</SelectItem>
              <SelectItem value={ORDER_STATUS.CANCELLED}>{ORDER_STATUS_CN[ORDER_STATUS.CANCELLED]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>获取订单失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : orders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>暂无订单</AlertTitle>
              <AlertDescription>
                当前没有符合条件的订单。
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>下单时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>商品数量</TableHead>
                  <TableHead>商品金额</TableHead>
                  <TableHead>运费</TableHead>
                  <TableHead>折扣</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.users?.email || '未知用户'}</TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(order.status)} flex items-center gap-1 px-2 py-1`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{ORDER_STATUS_CN[order.status as keyof typeof ORDER_STATUS_CN]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{order.order_items.reduce((sum, item) => sum + item.quantity, 0)}件</TableCell>
                    <TableCell>¥{formatPrice(order.total_amount)}</TableCell>
                    <TableCell>¥{formatPrice(order.shipping_fee || 0)}</TableCell>
                    <TableCell>¥{formatPrice(order.discount_amount)}</TableCell>
                    <TableCell className="font-semibold">¥{formatPrice(order.final_amount)}</TableCell>
                    <TableCell>
                      <Select 
                        disabled={statusUpdating[order.id]}
                        value={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ORDER_STATUS.PENDING_PAYMENT}>{ORDER_STATUS_CN[ORDER_STATUS.PENDING_PAYMENT]}</SelectItem>
                          <SelectItem value={ORDER_STATUS.PENDING_SHIPMENT}>{ORDER_STATUS_CN[ORDER_STATUS.PENDING_SHIPMENT]}</SelectItem>
                          <SelectItem value={ORDER_STATUS.SHIPPED}>{ORDER_STATUS_CN[ORDER_STATUS.SHIPPED]}</SelectItem>
                          <SelectItem value={ORDER_STATUS.COMPLETED}>{ORDER_STATUS_CN[ORDER_STATUS.COMPLETED]}</SelectItem>
                          <SelectItem value={ORDER_STATUS.CANCELLED}>{ORDER_STATUS_CN[ORDER_STATUS.CANCELLED]}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
} 