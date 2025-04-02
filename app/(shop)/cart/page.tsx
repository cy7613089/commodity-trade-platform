"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  Trash2, 
  MinusCircle, 
  PlusCircle, 
  ChevronLeft,
  ShoppingCart,
  AlertCircle,
  BadgePercent
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice, safeSubtract, safeMultiply } from "@/lib/utils/format";

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalOriginalPrice 
  } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  
  // 处理客户端水合问题
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 计算折扣金额
  const originalPrice = mounted ? getTotalOriginalPrice() : 0;
  const finalPrice = mounted ? getTotalPrice() : 0;
  const discountAmount = safeSubtract(originalPrice, finalPrice);
  const hasDiscount = discountAmount > 0;
  
  // 如果购物车为空
  if (mounted && items.length === 0) {
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
      
      {/* 购物车内容区域 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 商品列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle>商品清单</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm("确定要清空购物车吗？")) {
                      clearCart();
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  清空购物车
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[350px]">商品</TableHead>
                    <TableHead className="text-center">单价</TableHead>
                    <TableHead className="text-center">数量</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mounted && items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-md border">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <Link 
                              href={`/products/${item.id}`}
                              className="font-medium hover:underline"
                            >
                              {item.name}
                            </Link>
                          </div>
                        </div>
                      </TableCell>
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
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
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                      <TableCell className="text-right">
                        ¥{formatPrice(safeMultiply(item.price, item.quantity))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品总额</span>
                <span>¥{formatPrice(originalPrice)}</span>
              </div>
              
              {hasDiscount && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <BadgePercent className="h-4 w-4" />
                    商品折扣
                  </span>
                  <span>-¥{formatPrice(discountAmount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>应付金额</span>
                <span className="text-xl text-primary">¥{formatPrice(finalPrice)}</span>
              </div>
              
              {/* 优惠券区域（未实现完整功能，只展示UI） */}
              <div className="mt-4 rounded-lg border p-4">
                <h3 className="mb-2 font-medium">使用优惠券</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1">选择优惠券</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                size="lg"
                onClick={() => {
                  // 实际项目中，跳转到结算页面
                  // 当前先弹出提示
                  alert("结算功能尚未实现，将在后续开发中完成");
                }}
              >
                去结算
              </Button>
            </CardFooter>
          </Card>
          
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>配送提示</AlertTitle>
            <AlertDescription>
              订单满99元可享受免费配送，当前订单金额：¥{formatPrice(finalPrice)}
              {finalPrice < 99 && (
                <span className="block mt-1">
                  还差¥{formatPrice(safeSubtract(99, finalPrice))}可享受免费配送
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
} 