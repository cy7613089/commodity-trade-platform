"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Menu, ShoppingCart, User, LogOut, LogIn } from 'lucide-react';
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";
import { useCartStore } from "@/lib/store/cart-store";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/components/providers/supabase-provider";
import { User as SupabaseUser } from '@supabase/supabase-js';

export function Navbar() {
  const categories = getAllCategories();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { supabase } = useSupabase();
  
  // 直接从store获取itemCount，避免中间状态
  const itemCount = useCartStore((state) => state.itemCount);
  const clearCart = useCartStore((state) => state.clearCart);
  const updateNavbarCartCount = useCartStore((state) => state.updateNavbarCartCount);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // 获取当前登录用户
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    fetchUser();
    
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) {
      const fetchUserRole = async () => {
        try {
          // 从数据库获取用户角色
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('获取用户角色失败:', error);
            return;
          }
          
          if (data) {
            setUserRole(data.role);
          }
        } catch (error) {
          console.error('获取用户角色时出错:', error);
        }
      };
      fetchUserRole();
    } else {
      setUserRole(null);
    }
  }, [user, supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // 退出登录时清空购物车
      await clearCart();
      
      // 强制更新购物车数量为0（立即生效）
      updateNavbarCartCount(0);
      
      toast({
        title: "退出成功",
        description: "您已成功退出登录",
      });
      router.push("/products");
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "退出失败",
        description: "退出登录时出现错误",
      });
    }
  };

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
        <Link href="/products" className="mr-auto flex items-center space-x-2">
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
              {!loading && user ? (
                <>
                  <DropdownMenuLabel>
                    {user.email ? user.email.split('@')[0] : '我的账户'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">个人中心</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">我的订单</Link>
                  </DropdownMenuItem>
                  {/* 管理员专有菜单 */}
                  {userRole === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/products">商品管理</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/orders">订单管理</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/coupons">优惠券管理</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </div>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">
                      <div className="flex items-center">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>登录</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">注册</Link>
                  </DropdownMenuItem>
                </>
              )}
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
              <Link href="/products" className="flex items-center mb-6 pl-4" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="font-bold">商品交易平台</span>
              </Link>
              <div className="space-y-2">
                <Link href="/products" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setIsMobileMenuOpen(false)}>首页</Link>
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