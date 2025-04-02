"use client";

import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getAllCategories } from "@/lib/data/categories";
import { Category } from "@/types";
import { Menu, ShoppingCart, User, Package } from 'lucide-react';
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";
import { useCartStore } from "@/lib/store/cart-store";

export function Navbar() {
  const categories = getAllCategories();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderCategoryMenuItem = (category: Category, isMobile: boolean = true) => {
    const linkHref = `/products/categories/${category.slug}`;

    if (!category.children || category.children.length === 0) {
      if (isMobile) {
        return (
          <Link href={linkHref} key={category.id} className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>
            {category.name}
          </Link>
        );
      }
      return null;
    }

    if (isMobile) {
      return (
        <div key={category.id}>
          <Link href={linkHref} className="block px-4 py-2 text-sm font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
            {category.name}
          </Link>
          <div className="pl-4">
            {category.children.map((child) => renderCategoryMenuItem(child, true))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-auto flex items-center space-x-2">
          <span className="font-bold sm:inline-block">商品交易平台</span>
        </Link>

        <div className="flex items-center justify-start space-x-2">
          <ThemeModeToggle />
          
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
              <span className="sr-only">购物车</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">用户菜单</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">个人中心</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/orders">
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    <span>我的订单</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>设置</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center mb-6 pl-4" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="font-bold">商品交易平台</span>
              </Link>
              <div className="space-y-2">
                <Link href="/" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>首页</Link>
                {categories.map((category) => renderCategoryMenuItem(category, true))}
                <Link href="/products" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>所有商品</Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

// 注释掉旧代码
// import { cn } from "@/lib/utils"
// import React from "react"
// import Link from "next/link"
// import {
//   NavigationMenu,
//   NavigationMenuContent,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   NavigationMenuTrigger,
//   navigationMenuTriggerStyle,
// } from "@/components/ui/navigation-menu"

// const components: { title: string; href: string; description: string }[] = [
//   { title: "Alert Dialog", href: "/docs/primitives/alert-dialog", description: "A modal dialog that interrupts the user with important content and expects a response." },
//   // ... other components
// ]

// export function Navbar() {
//   return (
//     <NavigationMenu>
//       <NavigationMenuList>
//         <NavigationMenuItem>
//           <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
//           <NavigationMenuContent>
//             {/* ... content ... */}
//           </NavigationMenuContent>
//         </NavigationMenuItem>
//         {/* ... other menu items ... */}
//       </NavigationMenuList>
//     </NavigationMenu>
//   )
// }

// const ListItem = React.forwardRef<
//   React.ElementRef<"a">,
//   React.ComponentPropsWithoutRef<"a">
// >(({ className, title, children, ...props }, ref) => {
//   return (
//     <li>
//       <NavigationMenuLink asChild>
//         <a
//           ref={ref}
//           className={cn(/* ... styles ... */)}
//           {...props}
//         >
//           <div className="text-sm font-medium leading-none">{title}</div>
//           <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
//             {children}
//           </p>
//         </a>
//       </NavigationMenuLink>
//     </li>
//   )
// })
// ListItem.displayName = "ListItem" 