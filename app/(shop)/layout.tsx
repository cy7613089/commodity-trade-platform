"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";
import { useCartStore } from "@/lib/store/cart-store";

interface ShopLayoutProps {
  children: ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const { getItemCount } = useCartStore();
  const [cartItemCount, setCartItemCount] = useState(0);
  
  // 解决水合问题
  useEffect(() => {
    setCartItemCount(getItemCount());
    
    // 监听购物车变化
    const unsubscribeStore = useCartStore.subscribe((state) => {
      setCartItemCount(state.getItemCount());
    });
    
    return () => {
      unsubscribeStore();
    };
  }, [getItemCount]);
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          {/* 网站Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">商品交易平台</span>
          </Link>
          
          {/* 导航链接 */}
          <nav className="hidden items-center space-x-2 md:flex">
            <Link href="/products">
              <Button variant="ghost">全部商品</Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="ghost">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </nav>
          
          {/* 移动端菜单按钮 */}
          <Button variant="outline" size="icon" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
        
        {/* 分类导航 */}
        <div className="container hidden border-t py-2 md:block">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-6">
              <Link href="/products/categories/electronics" className="text-sm font-medium transition-colors hover:text-primary">
                电子产品
              </Link>
              <Link href="/products/categories/home" className="text-sm font-medium transition-colors hover:text-primary">
                家居生活
              </Link>
              <Link href="/products/categories/clothing" className="text-sm font-medium transition-colors hover:text-primary">
                服装鞋帽
              </Link>
              <Link href="/products/categories/beauty" className="text-sm font-medium transition-colors hover:text-primary">
                美妆个护
              </Link>
              <Link href="/products/categories/food" className="text-sm font-medium transition-colors hover:text-primary">
                食品饮料
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/orders" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                我的订单
              </Link>
              <Link href="/service" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                客户服务
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main className="flex-1">{children}</main>
      
      {/* Toast通知组件 */}
      <Toaster position="top-right" richColors />
      
      {/* 页脚 */}
      <footer className="border-t bg-muted/40">
        <div className="container py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-3 text-lg font-semibold">关于我们</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    公司简介
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    联系方式
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    招贤纳士
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    法律声明
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold">客户服务</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    常见问题
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    售后政策
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    退换货说明
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    投诉建议
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold">商家服务</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    入驻须知
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    商家中心
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    商家活动
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                    营销服务
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold">关注我们</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                关注我们的社交媒体，获取最新优惠和活动信息
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground">
              &copy; 2023 商品交易平台. 保留所有权利.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                隐私政策
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                服务条款
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                网站地图
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 