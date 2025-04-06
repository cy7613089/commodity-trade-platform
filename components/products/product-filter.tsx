"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductFilters {
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
}

interface ProductFilterProps {
  priceRanges: PriceRange[];
  ratings: number[];
  onFilterChange: (filters: ProductFilters) => void;
}

export function ProductFilter({ 
  priceRanges, 
  ratings, 
  onFilterChange 
}: ProductFilterProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [dirty, setDirty] = useState(false);
  
  // 当筛选条件变化时，设置dirty标记
  useEffect(() => {
    if (priceRange[0] > 0 || 
        priceRange[1] < 10000 || 
        selectedRating !== undefined) {
      setDirty(true);
    } else {
      setDirty(false);
    }
  }, [priceRange, selectedRating]);
  
  // 应用筛选
  const applyFilters = () => {
    onFilterChange({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
      rating: selectedRating,
    });
  };
  
  // 重置筛选
  const resetFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedRating(undefined);
    onFilterChange({});
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">筛选商品</h3>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={applyFilters}
            disabled={!dirty}
          >
            应用筛选
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={resetFilters}
            disabled={!dirty}
          >
            重置
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="mb-4 text-sm font-medium">价格区间</h4>
        <div className="space-y-4">
          <Slider
            defaultValue={[0, 10000]}
            value={priceRange}
            max={10000}
            step={100}
            onValueChange={(value) => setPriceRange(value as [number, number])}
          />
          <div className="flex items-center justify-between">
            <span>¥{priceRange[0]}</span>
            <span>¥{priceRange[1]}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {priceRanges.map((range, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setPriceRange([range.min, range.max])}
              >
                ¥{range.min} - ¥{range.max}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="mb-4 text-sm font-medium">评分</h4>
        <RadioGroup 
          value={selectedRating?.toString() || ''} 
          onValueChange={value => setSelectedRating(value ? parseInt(value) : undefined)}
        >
          <div className="space-y-3">
            {ratings.map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                <Label htmlFor={`rating-${rating}`} className="flex-1 cursor-pointer">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-muted-foreground">及以上</span>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
} 