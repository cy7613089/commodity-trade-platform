import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { UserNav } from "@/components/user-nav";
import { MainNav } from "@/components/main-nav";
import { Search } from "@/components/search";

export function SiteHeader() {
  const pathname = usePathname();
  
  // 获取购物车信息
  const { items, itemCount, fetchCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  // 在客户端加载购物车数据
  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, [fetchCart]);
  
  // 计算购物车中的商品数量
  const cartItemCount = mounted ? itemCount : 0;
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Search />
          <nav className="flex items-center space-x-2">
            {/* 购物车按钮 */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
} 