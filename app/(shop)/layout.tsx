"use client";

import React from "react";
import Link from "next/link";
// import { 
//   ShoppingCart, 
//   User, 
//   Search, 
//   Heart, 
//   Package
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { 
//   DropdownMenu, 
//   DropdownMenuContent, 
//   DropdownMenuItem, 
//   DropdownMenuLabel, 
//   DropdownMenuSeparator, 
//   DropdownMenuTrigger 
// } from "@/components/ui/dropdown-menu";
// import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";
// import { Input } from "@/components/ui/input";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container py-6">
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