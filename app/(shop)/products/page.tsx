"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilter, ProductFilters } from "@/components/products/product-filter";
import { ProductPagination } from "@/components/products/product-pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Inbox, Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

// 模拟数据 - 实际项目中会从数据库获取
const mockCategories = [
  { id: "1", name: "电子产品", count: 120 },
  { id: "2", name: "家居生活", count: 85 },
  { id: "3", name: "服装鞋帽", count: 207 },
  { id: "4", name: "美妆个护", count: 163 },
  { id: "5", name: "食品饮料", count: 94 },
];

const mockBrands = [
  { id: "1", name: "苹果", count: 42 },
  { id: "2", name: "小米", count: 38 },
  { id: "3", name: "华为", count: 35 },
  { id: "4", name: "三星", count: 31 },
  { id: "5", name: "索尼", count: 27 },
];

const mockPriceRanges = [
  { min: 0, max: 100 },
  { min: 100, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 10000 },
];

const mockRatings = [5, 4, 3, 2, 1];

// 模拟商品数据
const mockProducts = Array.from({ length: 30 }).map((_, index) => ({
  id: `product-${index + 1}`,
  name: `商品 ${index + 1}`,
  description: `这是商品 ${index + 1} 的简要描述，包含了产品的主要特点和卖点。`,
  price: Math.floor(Math.random() * 10000) / 100 + 99,
  originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 15000) / 100 + 199 : undefined,
  image: `/next.svg`,
  rating: Math.floor(Math.random() * 5) + 1,
  category: mockCategories[Math.floor(Math.random() * mockCategories.length)].id,
}));

export default function ProductsPage() {
  const searchParams = useSearchParams();
  
  // 解析查询参数
  const pageParam = searchParams.get("page");
  const page = pageParam ? Number(pageParam) : 1;
  const pageSize = 10; // 每页显示10个商品
  
  // 计算分页
  const totalProducts = mockProducts.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const currentPageProducts = mockProducts.slice((page - 1) * pageSize, page * pageSize);
  
  // 筛选器变化处理函数
  const handleFilterChange = (filters: ProductFilters) => {
    // 在实际应用中，这将触发数据重新获取或过滤
    console.log("应用筛选条件:", filters);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 grid grid-cols-3 items-center">
        <div>
          <h1 className="text-3xl font-bold">全部商品</h1>
          <p className="text-muted-foreground">共 {totalProducts} 件商品</p>
        </div>
        
        <div className="justify-self-center col-span-1 w-full max-w-md px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索商品..."
              className="pl-10 pr-4"
            />
          </div>
        </div>
        
        <div className="justify-self-end">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* 筛选器 - 桌面端显示 */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <ProductFilter
              categories={mockCategories}
              brands={mockBrands}
              priceRanges={mockPriceRanges}
              ratings={mockRatings}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
        
        {/* 筛选器 - 移动端显示 */}
        <div className="mb-6 block lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                筛选商品
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="py-4">
                <ProductFilter
                  categories={mockCategories}
                  brands={mockBrands}
                  priceRanges={mockPriceRanges}
                  ratings={mockRatings}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* 商品列表 */}
        <div className="lg:col-span-3">
          <Suspense fallback={<div>加载中...</div>}>
            {currentPageProducts.length > 0 ? (
              <>
                <ProductGrid products={currentPageProducts} columns={3} />
                <div className="mt-8 flex justify-center">
                  <ProductPagination currentPage={page} totalPages={totalPages} />
                </div>
              </>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">没有找到商品</h3>
                <p className="text-muted-foreground">
                  尝试更改筛选条件或浏览其他分类
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
} 