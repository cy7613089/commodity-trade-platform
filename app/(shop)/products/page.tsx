"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilter, ProductFilters } from "@/components/products/product-filter";
import { ProductPagination } from "@/components/products/product-pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Inbox, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { FormattedProduct } from "@/lib/utils/format";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 状态
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 解析查询参数
  const pageParam = searchParams.get("page");
  const page = pageParam ? Number(pageParam) : 1;
  const searchQuery = searchParams.get("search") || '';
  const minPrice = searchParams.get("minPrice") || '';
  const maxPrice = searchParams.get("maxPrice") || '';
  const sortBy = searchParams.get("sortBy") || 'created_at';
  const order = searchParams.get("order") || 'desc';
  const pageSize = 10; // 每页显示10个商品
  
  // 初始加载和参数变化时加载数据
  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, minPrice, maxPrice, sortBy, order]);
  
  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建查询参数
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchQuery) queryParams.append('search', searchQuery);
      if (minPrice) queryParams.append('minPrice', minPrice);
      if (maxPrice) queryParams.append('maxPrice', maxPrice);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (order) queryParams.append('order', order);
      
      // 发送请求
      const response = await fetch(`/api/products?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`获取商品列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 更新状态
      setProducts(data.products || []);
      setTotalProducts(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('获取商品列表错误:', err);
      setError(err instanceof Error ? err.message : '获取商品列表失败');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 筛选器变化处理函数
  const handleFilterChange = (filters: ProductFilters) => {
    // 构建新的URL参数
    const newParams = new URLSearchParams();
    
    if (filters.minPrice) newParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) newParams.append('maxPrice', filters.maxPrice.toString());
    if (filters.rating) newParams.append('rating', filters.rating.toString());
    if (searchTerm) newParams.append('search', searchTerm);
    
    // 重置页码
    newParams.append('page', '1');
    
    // 导航到新URL
    router.push(`/products?${newParams.toString()}`);
  };
  
  // 搜索处理函数
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (searchTerm) {
      newParams.set('search', searchTerm);
    } else {
      newParams.delete('search');
    }
    
    // 重置页码
    newParams.set('page', '1');
    
    // 导航到新URL
    router.push(`/products?${newParams.toString()}`);
  };
  
  // 价格范围
  const mockPriceRanges = [
    { min: 0, max: 100 },
    { min: 100, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: 5000 },
    { min: 5000, max: 10000 },
  ];
  
  const mockRatings = [5, 4, 3, 2, 1];
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 grid grid-cols-3 items-center">
        <div>
          <h1 className="text-3xl font-bold">全部商品</h1>
          <p className="text-muted-foreground">共 {totalProducts} 件商品</p>
        </div>
        
        <div className="justify-self-center col-span-1 w-full max-w-md px-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索商品..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
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
            {loading ? (
              <div className="flex h-[400px] flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">加载商品中...</p>
              </div>
            ) : error ? (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={fetchProducts} className="mt-4">重试</Button>
              </div>
            ) : products.length > 0 ? (
              <>
                <ProductGrid products={products} columns={3} />
                <div className="mt-8 flex justify-center">
                  <ProductPagination currentPage={page} totalPages={totalPages} />
                </div>
              </>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">没有找到商品</h3>
                <p className="text-muted-foreground">
                  尝试更改筛选条件或浏览其他产品
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
} 