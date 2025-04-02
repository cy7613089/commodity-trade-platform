"use client";

import React from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  Heart, 
  Package
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "sonner";

const categories = [
  { name: "手机数码", href: "/categories/electronics" },
  { name: "家用电器", href: "/categories/appliances" },
  { name: "电脑办公", href: "/categories/computers" },
  { name: "服饰鞋包", href: "/categories/fashion" },
  { name: "美妆个护", href: "/categories/beauty" },
  { name: "家居厨具", href: "/categories/home" },
  { name: "食品生鲜", href: "/categories/food" },
  { name: "图书文娱", href: "/categories/books" }
];

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl">商品交易平台</Link>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="flex flex-col gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="text-sm font-medium transition-colors hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            <nav className="hidden md:flex items-center gap-6">
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium h-auto p-0">
                    更多分类
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.slice(5).map((category) => (
                    <DropdownMenuItem key={category.name} asChild>
                      <Link href={category.href}>{category.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center w-full max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索商品" className="pl-8" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeModeToggle />
            
            <Link href="/favorites">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">个人中心</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <div className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>我的订单</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>设置</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>

      <Toaster />
      
      <footer className="border-t py-6 md:py-10">
        <div className="container flex flex-col gap-4 md:flex-row md:justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">商品交易平台</h3>
            <p className="text-sm text-muted-foreground">
              © 2023 商品交易平台. 保留所有权利.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">客户服务</h3>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              联系我们
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              常见问题
            </Link>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">关于我们</h3>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              公司简介
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              加入我们
            </Link>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">支付方式</h3>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              支付宝
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              微信支付
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 