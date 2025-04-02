"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import { PlusCircle, MinusCircle, ShoppingCart } from "lucide-react";
import { formatPrice, safeSubtract, safeDivide, safeMultiply } from "@/lib/utils/format";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  category?: string;
  stock: number;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const productWithStock = {
    ...product,
    stock: typeof product.stock === 'number' && !isNaN(product.stock) && product.stock >= 0 
      ? product.stock 
      : 10
  };

  const [quantity, setQuantity] = useState(1);
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (typeof product.stock !== 'number' || isNaN(product.stock)) {
      console.warn(`ProductCard (ID: ${product.id}, Name: ${product.name}): Invalid stock value received:`, product.stock);
    }
  }, [product.stock, product.id, product.name]);

  const handleAddToCart = () => {
    const currentStock = productWithStock.stock;
    
    if (quantity > currentStock) {
      toast.error("库存不足");
      return;
    }
    
    if (currentStock <= 0) {
      toast.error("商品已售罄");
      return;
    }

    addItemToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      quantity: quantity,
      stock: currentStock,
    });
    toast.success(`${product.name} (${quantity}件) 已添加到购物车`);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    const currentStock = productWithStock.stock;
    
    setQuantity((prev) => {
      const currentQuantity = typeof prev === 'number' && !isNaN(prev) ? prev : 1;
      if (currentStock <= 0 || currentQuantity >= currentStock) {
        return currentQuantity;
      }
      return currentQuantity + 1;
    });
  };

  const decrementQuantity = () => {
    setQuantity((prev) => {
      const currentQuantity = typeof prev === 'number' && !isNaN(prev) ? prev : 1;
      return Math.max(1, currentQuantity - 1);
    });
  };

  const discountPercentage = 
    product.originalPrice && product.originalPrice > 0
      ? Math.round(
          safeMultiply(
            safeDivide(
              safeSubtract(product.originalPrice, product.price),
              product.originalPrice
            ),
            100
          )
        )
      : 0;

  const currentStock = productWithStock.stock;

  return (
    <Card className={cn("group h-full overflow-hidden rounded-lg transition-all hover:shadow-md", className)}>
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative">
          <AspectRatio ratio={1 / 1} className="bg-muted">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          </AspectRatio>
          {discountPercentage > 0 && (
            <div className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="text-lg font-semibold line-clamp-1 hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
        <div className="mt-2 flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${
                i < (product.rating || 0) ? "text-yellow-400" : "text-gray-300"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-1 text-xs text-muted-foreground">
            ({product.rating || 0})
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 pt-0">
        <div className="mb-2">
          {product.originalPrice && (
            <span className="mr-2 text-sm text-muted-foreground line-through">
              ¥{formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="text-lg font-bold text-primary">¥{formatPrice(product.price)}</span>
        </div>
        <div className="flex items-center justify-between w-full mb-1 text-xs text-muted-foreground">
          <span>库存: {currentStock}</span>
        </div>
        <div className="flex items-center justify-between w-full mb-3">
          <span className="text-sm text-muted-foreground">数量:</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={decrementQuantity}
              disabled={quantity <= 1}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {typeof quantity === 'number' && !isNaN(quantity) ? quantity : 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={incrementQuantity}
              disabled={currentStock <= 0 || quantity >= currentStock}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={currentStock <= 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {currentStock <= 0 ? "已售罄" : "加入购物车"}
        </Button>
      </CardFooter>
    </Card>
  );
} 