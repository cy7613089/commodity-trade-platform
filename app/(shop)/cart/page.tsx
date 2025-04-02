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
  AlertCircle
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
import { formatPrice, safeMultiply, safeSubtract } from "@/lib/utils/format";
// Import CartItem type if not already implicitly available via store
import type { CartItem } from "@/lib/store/cart-store"; 

export default function CartPage() {
  // From Zustand store
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalOriginalPrice 
  } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get calculated totals directly from the store *after* component mounts
  const finalPrice = mounted ? getTotalPrice() : 0;
  const originalPrice = mounted ? getTotalOriginalPrice() : 0;
  
  // Calculate discount based on store totals
  // Use safeSubtract to handle potential precision issues, though less likely here
  const discountAmount = mounted ? safeSubtract(originalPrice, finalPrice) : 0; 
  const hasDiscount = discountAmount > 0;
  
  // Empty cart display
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
  
  // Main cart display
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
        {/* Item List */}
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
                  {/* Only render items when component is mounted */}
                  {mounted && items.map((item: CartItem) => ( 
                    <TableRow key={item.id}>
                      {/* Product Info */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 overflow-hidden rounded-md border">
                            <Image
                              src={item.image || '/placeholder.svg'} // Add placeholder
                              alt={item.name || '商品图片'} // Add placeholder text
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
                              {item.name || '未知商品'} 
                            </Link>
                            {/* Optionally display SKU or other identifiers here */}
                          </div>
                        </div>
                      </TableCell>
                      {/* Unit Price */}
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          {/* Use robust formatPrice */}
                          <div className="font-medium">¥{formatPrice(item.price)}</div> 
                          {/* Check originalPrice exists and is greater before displaying */}
                          {item.originalPrice && item.originalPrice > item.price && ( 
                            <div className="text-sm text-muted-foreground line-through">
                              ¥{formatPrice(item.originalPrice)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {/* Quantity */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            // Ensure quantity doesn't go below 0 via UI interaction if desired
                            onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                            disabled={item.quantity <= 0} // Disable minus if 0
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span className="mx-2 w-10 text-center">
                            {/* Display quantity directly, even if 0 */}
                            {item.quantity} 
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            // Disable plus if quantity reaches stock
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
                      {/* Subtotal */}
                      <TableCell className="text-right">
                        {/* Use robust safeMultiply and formatPrice */}
                        ¥{formatPrice(safeMultiply(item.price, item.quantity))} 
                      </TableCell>
                      {/* Remove Button */}
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
        
        {/* Order Summary */}
        {mounted && ( // Only render summary when mounted and totals are reliable
          <div>
            <Card>
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original Price */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品总额</span>
                  {/* Use store total + robust formatPrice */}
                  <span>¥{formatPrice(originalPrice)}</span> 
                </div>
                
                {/* Discount */}
                {hasDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <BadgePercent className="h-4 w-4" />
                      商品折扣
                    </span>
                    {/* Use calculated discount + robust formatPrice */}
                    <span>-¥{formatPrice(discountAmount)}</span> 
                  </div>
                )}
                
                <Separator />
                
                {/* Final Price */}
                <div className="flex justify-between font-medium">
                  <span>应付金额</span>
                   {/* Use store total + robust formatPrice */}
                  <span className="text-xl text-primary">¥{formatPrice(finalPrice)}</span>
                </div>
                
                {/* Coupon Area (Placeholder) */}
                <div className="mt-4 rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">使用优惠券</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1" disabled>选择优惠券</Button> 
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    alert("结算功能尚未实现");
                  }}
                  // Disable checkout if cart is empty or has issues?
                  disabled={items.length === 0} 
                >
                  去结算
                </Button>
              </CardFooter>
            </Card>
            
            {/* Shipping Alert */}
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>配送提示</AlertTitle>
              <AlertDescription>
                订单满99元可享受免费配送，当前订单金额：¥{formatPrice(finalPrice)}
                {finalPrice < 99 && (
                  <span className="block mt-1">
                    {/* Use robust safeSubtract and formatPrice */}
                    还差¥{formatPrice(safeSubtract(99, finalPrice))}可享受免费配送 
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
} 