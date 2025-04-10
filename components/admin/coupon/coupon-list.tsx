'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { MoreHorizontal, PenIcon, Trash2Icon } from 'lucide-react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { CouponType, Coupon } from '@/types'

// 定义优惠券类型与中文描述的映射
const couponTypeMap: Record<CouponType, string> = {
  'product': '商品券',
  'time': '限时券',
  'amount': '满减券'
};

interface CouponListProps {
  onEditCoupon: (coupon: Coupon) => void;
}

export function CouponList({ onEditCoupon }: CouponListProps) {
  // 状态管理
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选和排序
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // 分页
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 删除确认对话框
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  // 加载优惠券数据
  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      // 发起请求
      const response = await fetch(`/api/coupons?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('加载优惠券数据失败');
      }
      
      const data = await response.json();
      setCoupons(data.coupons);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      toast.error('加载优惠券数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除优惠券
  const deleteCoupon = async () => {
    if (!deletingCoupon) return;
    
    try {
      const response = await fetch(`/api/coupons/${deletingCoupon.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除优惠券失败');
      }
      
      toast.success('优惠券已删除');
      fetchCoupons(); // 重新加载数据
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('删除优惠券失败');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingCoupon(null);
    }
  };

  // 处理筛选、排序或分页变化时重新加载数据
  useEffect(() => {
    fetchCoupons();
  }, [page, limit, typeFilter, statusFilter, sortBy, sortOrder]);

  // 处理搜索
  const handleSearch = () => {
    setPage(1); // 重置到第一页
    fetchCoupons();
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  // 渲染优惠券类型
  const renderCouponType = (type: CouponType) => {
    return couponTypeMap[type] || type;
  };

  // 渲染折扣类型
  const renderDiscountType = (type: 'fixed' | 'percentage') => {
    return type === 'fixed' ? '固定金额' : '百分比折扣';
  };

  // 渲染优惠券状态徽章
  const renderStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="outline" className="bg-green-100 text-green-800">激活</Badge>
      : <Badge variant="outline" className="bg-gray-100 text-gray-800">未激活</Badge>;
  };

  // 渲染优惠券值
  const renderCouponValue = (coupon: Coupon) => {
    return coupon.discount_type === 'fixed'
      ? `¥${coupon.value.toFixed(2)}`
      : `${coupon.value}%`;
  };

  // 处理确认删除对话框
  const handleDeleteClick = (coupon: Coupon) => {
    setDeletingCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 筛选和搜索工具栏 */}
      <Card>
        <CardHeader>
          <CardTitle>优惠券过滤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">搜索</label>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索优惠券名称或代码"
                  className="flex-1"
                />
                <Button onClick={handleSearch}>搜索</Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">优惠券类型</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="所有类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有类型</SelectItem>
                  <SelectItem value="product">商品券</SelectItem>
                  <SelectItem value="time">限时券</SelectItem>
                  <SelectItem value="amount">满减券</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="所有状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有状态</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">排序</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">创建时间</SelectItem>
                    <SelectItem value="name">名称</SelectItem>
                    <SelectItem value="start_date">开始日期</SelectItem>
                    <SelectItem value="end_date">结束日期</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">升序</SelectItem>
                    <SelectItem value="desc">降序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 优惠券列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>折扣类型</TableHead>
                <TableHead>优惠值</TableHead>
                <TableHead>结束日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-red-500 py-8">
                    {error}
                  </TableCell>
                </TableRow>
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    没有找到符合条件的优惠券
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.name}</TableCell>
                    <TableCell>{renderCouponType(coupon.type)}</TableCell>
                    <TableCell>{renderDiscountType(coupon.discount_type)}</TableCell>
                    <TableCell>{renderCouponValue(coupon)}</TableCell>
                    <TableCell>{formatDate(coupon.end_date.toString())}</TableCell>
                    <TableCell>{renderStatusBadge(coupon.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">打开菜单</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditCoupon(coupon)}>
                            <PenIcon className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(coupon)}
                          >
                            <Trash2Icon className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页控件 */}
      {!isLoading && !error && totalPages > 0 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除优惠券</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除优惠券 &quot;{deletingCoupon?.name}&quot; 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={deleteCoupon}
            >
              确认删除
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 