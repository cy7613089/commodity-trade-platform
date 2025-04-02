"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowDownAZ, ArrowUpAZ, ArrowDownUp, Undo2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// 定义筛选器参数类型
export interface ProductFilters {
  priceRange?: [number, number];
  brands?: string[];
  categories?: string[];
  sort?: string;
  rating?: number | null;
}

// 旧版本接口
interface LegacyFilterCategory {
  id: string;
  name: string;
  count: number;
}

interface LegacyPriceRange {
  min: number;
  max: number;
}

interface LegacyFilterOption {
  id: string;
  name: string;
  count: number;
}

// 新版本接口
interface ProductFilterProps {
  onChange?: (filters: ProductFilters) => void;
  onFilterChange?: (filters: ProductFilters) => void; // 旧版兼容
  availableBrands?: { id: string; name: string }[];
  availableCategories?: { id: string; name: string }[];
  // 旧版兼容
  categories?: LegacyFilterCategory[];
  brands?: LegacyFilterOption[];
  priceRanges?: LegacyPriceRange[];
  ratings?: number[];
  defaultValues?: Partial<ProductFilters>;
}

export function ProductFilter({
  onChange,
  onFilterChange,
  availableBrands,
  availableCategories,
  // 旧版兼容
  categories,
  brands,
  priceRanges,
  ratings,
  defaultValues,
}: ProductFilterProps) {
  // 处理兼容问题
  const handleFilterChange = onChange || onFilterChange || (() => {});
  
  const mappedBrands = availableBrands || 
    (brands?.map(b => ({ id: b.id, name: b.name })) || []);
  
  const mappedCategories = availableCategories || 
    (categories?.map(c => ({ id: c.id, name: c.name })) || []);
  
  // 设置初始状态
  const [filters, setFilters] = useState<ProductFilters>({
    priceRange: defaultValues?.priceRange || [0, 10000] as [number, number],
    brands: defaultValues?.brands || [],
    categories: defaultValues?.categories || [],
    sort: defaultValues?.sort || "default",
    rating: defaultValues?.rating || null,
  });

  // 处理价格区间变化
  const handlePriceChange = (value: number[]) => {
    const newFilters = {
      ...filters,
      priceRange: [value[0], value[1]] as [number, number],
    };
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // 处理品牌选择变化
  const handleBrandChange = (brandId: string, checked: boolean) => {
    const currentBrands = filters.brands || [];
    const newBrands = checked
      ? [...currentBrands, brandId]
      : currentBrands.filter((id) => id !== brandId);
    
    const newFilters = {
      ...filters,
      brands: newBrands,
    };
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // 处理分类选择变化
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = filters.categories || [];
    const newCategories = checked
      ? [...currentCategories, categoryId]
      : currentCategories.filter((id) => id !== categoryId);
    
    const newFilters = {
      ...filters,
      categories: newCategories,
    };
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // 处理评级变化
  const handleRatingChange = (value: string) => {
    const rating = value ? Number(value) : null;
    const newFilters = {
      ...filters,
      rating,
    };
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // 处理排序变化
  const handleSortChange = (value: string) => {
    const newFilters = {
      ...filters,
      sort: value,
    };
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // 重置所有筛选器
  const handleReset = () => {
    const resetFilters: ProductFilters = {
      priceRange: [0, 10000] as [number, number],
      brands: [],
      categories: [],
      sort: "default",
      rating: null,
    };
    setFilters(resetFilters);
    handleFilterChange(resetFilters);
  };

  // 判断是否使用新版或旧版UI
  const useNewUI = availableBrands !== undefined || availableCategories !== undefined;

  if (useNewUI) {
    // 新版UI
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">筛选</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="flex items-center gap-1 text-muted-foreground"
          >
            <Undo2 className="h-3 w-3" />
            重置
          </Button>
        </div>
        
        {/* 价格区间筛选 */}
        <div className="space-y-4">
          <h4 className="font-medium">价格区间</h4>
          <Slider
            defaultValue={filters.priceRange}
            min={0}
            max={10000}
            step={100}
            onValueChange={handlePriceChange}
            className="py-4"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={filters.priceRange?.[0] || 0}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                handlePriceChange([value, filters.priceRange?.[1] || 10000]);
              }}
              className="h-8"
            />
            <span>-</span>
            <Input
              type="number"
              value={filters.priceRange?.[1] || 10000}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                handlePriceChange([filters.priceRange?.[0] || 0, value]);
              }}
              className="h-8"
            />
          </div>
        </div>
        
        {/* 品牌筛选 */}
        <div className="space-y-4">
          <h4 className="font-medium">品牌</h4>
          <div className="space-y-2">
            {mappedBrands.map((brand) => (
              <div key={brand.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={(filters.brands || []).includes(brand.id)}
                  onCheckedChange={(checked) =>
                    handleBrandChange(brand.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`brand-${brand.id}`}
                  className="text-sm font-normal"
                >
                  {brand.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* 分类筛选 */}
        <div className="space-y-4">
          <h4 className="font-medium">分类</h4>
          <div className="space-y-2">
            {mappedCategories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={(filters.categories || []).includes(category.id)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`category-${category.id}`}
                  className="text-sm font-normal"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* 排序选项 */}
        <div className="space-y-4">
          <h4 className="font-medium">排序方式</h4>
          <RadioGroup
            value={filters.sort || "default"}
            onValueChange={handleSortChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="sort-default" />
              <Label htmlFor="sort-default" className="text-sm font-normal">默认排序</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price-asc" id="sort-price-asc" />
              <Label htmlFor="sort-price-asc" className="flex items-center gap-1 text-sm font-normal">
                <ArrowUpAZ className="h-3 w-3" />
                价格从低到高
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price-desc" id="sort-price-desc" />
              <Label htmlFor="sort-price-desc" className="flex items-center gap-1 text-sm font-normal">
                <ArrowDownAZ className="h-3 w-3" />
                价格从高到低
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="newest" id="sort-newest" />
              <Label htmlFor="sort-newest" className="flex items-center gap-1 text-sm font-normal">
                <ArrowDownUp className="h-3 w-3" />
                最新上架
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rating" id="sort-rating" />
              <Label htmlFor="sort-rating" className="text-sm font-normal">好评优先</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    );
  }
  
  // 旧版UI
  return (
    <div className="w-full space-y-6 rounded-lg border p-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">分类</h3>
        <div className="space-y-2">
          {categories?.map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={`category-${category.id}`}
                checked={(filters.categories || []).includes(category.id)}
                onCheckedChange={(checked) => 
                  handleCategoryChange(category.id, checked === true)
                }
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="ml-2 flex-1 cursor-pointer text-sm"
              >
                {category.name}
              </Label>
              <span className="text-xs text-muted-foreground">({category.count})</span>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">价格区间</h3>
        <RadioGroup 
          value={
            filters.priceRange ? 
              `${filters.priceRange[0]}-${filters.priceRange[1]}` : 
              ""
          }
          onValueChange={(value) => {
            const [min, max] = value.split("-").map(Number);
            handlePriceChange([min, max]);
          }}
        >
          {priceRanges?.map((range, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={`${range.min}-${range.max}`} 
                id={`price-${index}`}
              />
              <Label htmlFor={`price-${index}`} className="cursor-pointer text-sm">
                ¥{range.min.toFixed(0)} - ¥{range.max.toFixed(0)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">品牌</h3>
        <div className="space-y-2">
          {brands?.map((brand) => (
            <div key={brand.id} className="flex items-center">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={(filters.brands || []).includes(brand.id)}
                onCheckedChange={(checked) =>
                  handleBrandChange(brand.id, checked === true)
                }
              />
              <Label
                htmlFor={`brand-${brand.id}`}
                className="ml-2 flex-1 cursor-pointer text-sm"
              >
                {brand.name}
              </Label>
              <span className="text-xs text-muted-foreground">({brand.count})</span>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">评分</h3>
        <RadioGroup 
          value={filters.rating?.toString() || ""} 
          onValueChange={handleRatingChange}
        >
          {ratings?.map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
              <Label htmlFor={`rating-${rating}`} className="cursor-pointer text-sm flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-xs">及以上</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="flex space-x-2 pt-4">
        <Button onClick={handleFilterChange.bind(null, filters)} className="flex-1">应用筛选</Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">重置</Button>
      </div>
    </div>
  );
} 