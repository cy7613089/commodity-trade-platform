"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  PlusCircle,
  MinusCircle,
  ChevronLeft,
  BadgePercent,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Check,
  ArrowRight
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CartItem } from "@/lib/store/cart-store";

export default function CartPage() {
  const router = useRouter();

  // 从Zustand store获取状态和方法
  const {
    items,
    loading,
    error,
    totalAmount,
    selectedTotalAmount,
    itemCount,
    fetchCart,
    removeItem,
    updateQuantity,
    updateSelected,
    updateBatchSelected,
    clearCart
  } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  
  // 用于全选/全不选的状态
  const [allSelected, setAllSelected] = useState(false);
  
  // 添加结算处理状态
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // 初始加载时获取购物车数据
  useEffect(() => {
    fetchCart();
    setMounted(true);
  }, [fetchCart]);
  
  // 更新全选状态
  useEffect(() => {
    if (items.length > 0) {
      setAllSelected(items.every(item => item.selected));
    } else {
      setAllSelected(false);
    }
  }, [items]);
  
  // 处理全选/全不选
  const handleSelectAll = async () => {
    if (!items.length) return;
    
    const newSelectStatus = !allSelected;
    setAllSelected(newSelectStatus);
    
    const itemIds = items.map(item => item.id);
    await updateBatchSelected(itemIds, newSelectStatus);
  };
  
  // 处理清空购物车
  const handleClearCart = async () => {
    if (window.confirm("确定要清空购物车吗？")) {
      await clearCart();
    }
  };
  
  // 处理删除商品
  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
  };
  
  // 处理更新数量
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(itemId, newQuantity);
  };
  
  // 处理更新选中状态
  const handleUpdateSelected = async (itemId: string, selected: boolean) => {
    await updateSelected(itemId, selected);
  };
  
  // 处理结算
  const handleCheckout = async () => {
    const hasSelectedItems = items.some(item => item.selected);
    
    if (!hasSelectedItems) {
      toast.error("请至少选择一个商品");
      return;
    }
    
    try {
      // 显示加载状态
      setIsCheckingOut(true);
      
      // 调用创建订单API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "创建订单失败");
      }
      
      const orderData = await response.json();
      
      // 跳转到结算页面，并带上订单ID
      router.push(`/checkout?orderId=${orderData.orderId}`);
    } catch (error) {
      console.error("创建订单失败:", error);
      toast.error(error instanceof Error ? error.message : "创建订单失败，请稍后重试");
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  // 空购物车显示
  if (mounted && !loading && items.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              继续购物
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20">
          <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">购物车为空</h2>
          <p className="mb-6 text-center text-muted-foreground">
            您的购物车中还没有商品，快去选购喜欢的商品吧！
          </p>
          <Link href="/products">
            <Button>浏览商品</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // 加载状态显示
  if (!mounted || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-16 w-16 animate-spin text-primary" />
          <h2 className="mb-2 text-2xl font-semibold">加载购物车...</h2>
        </div>
      </div>
    );
  }
  
  // 错误状态显示
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="mb-6">
          <Link href="/products">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              继续购物
            </Button>
          </Link>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>获取购物车失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => fetchCart()}>重试</Button>
        </div>
      </div>
    );
  }
  
  // 主购物车显示
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/products">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            继续购物
          </Button>
        </Link>
      </div>
      
      <h1 className="mb-6 text-3xl font-bold">购物车</h1>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 商品列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={items.length === 0}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    全选
                  </label>
                  <CardTitle className="ml-4">商品清单</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearCart}
                  className="text-destructive hover:text-destructive"
                  disabled={items.length === 0}
                >
                  清空购物车
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[350px]">商品</TableHead>
                    <TableHead className="text-center">单价</TableHead>
                    <TableHead className="text-center">数量</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: CartItem) => ( 
                    <TableRow key={item.id}>
                      {/* 选择框 */}
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked) => handleUpdateSelected(item.id, !!checked)}
                        />
                      </TableCell>
                      {/* 商品信息 */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-md border">
                            <Image
                              src={item.image || '/placeholder.svg'}
                              alt={item.name || '商品图片'}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <Link 
                              href={`/products/${item.productId}`}
                              className="font-medium hover:underline"
                            >
                              {item.name || '未知商品'} 
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                      {/* 单价 */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-medium">¥{formatPrice(item.price)}</div> 
                          {item.originalPrice && item.originalPrice > item.price && ( 
                            <div className="text-sm text-muted-foreground line-through">
                              ¥{formatPrice(item.originalPrice)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {/* 数量 */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span className="mx-2 w-10 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        {item.quantity >= item.stock && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            已达库存上限
                          </div>
                        )}
                      </TableCell>
                      {/* 小计 */}
                      <TableCell className="text-right">
                        ¥{formatPrice(item.subtotal)}
                      </TableCell>
                      {/* 删除按钮 */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        {/* 订单摘要 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 商品总额 */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品总额</span>
                <span>¥{formatPrice(totalAmount)}</span>
              </div>
              
              {/* 已选商品总额 */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">已选商品总额</span>
                <span>¥{formatPrice(selectedTotalAmount)}</span>
              </div>
              
              {/* 已选商品数量 */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">已选商品数量</span>
                <span>{items.filter(item => item.selected).reduce((sum, item) => sum + item.quantity, 0)} 件</span>
              </div>
              
              <Separator />
              
              {/* 合计 */}
              <div className="flex justify-between text-lg font-bold">
                <span>合计</span>
                <span className="text-primary">¥{formatPrice(selectedTotalAmount)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={!items.some(item => item.selected)}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                结算 ({items.filter(item => item.selected).length} 种商品)
              </Button>
            </CardFooter>
          </Card>
          
          {/* 优惠信息 */}
          <div className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">优惠信息</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center gap-2 text-sm">
                  <BadgePercent className="h-4 w-4 text-primary" />
                  <span>满99元包邮</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>新用户首单享9折</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 猜你喜欢 */}
          <div className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">猜你喜欢</CardTitle>
                  <Link href="/products" className="text-sm text-primary hover:underline flex items-center">
                    查看更多 <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm text-muted-foreground">根据您的购物喜好推荐更多优质商品</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 