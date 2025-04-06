"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Heart, MinusCircle, PlusCircle, Share2, ShoppingCart, Star, Truck } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";
import { formatPrice, calculateDiscountPercentage } from "@/lib/utils/format";
import { FormattedProduct } from "@/lib/utils/format";
import { ProductCard } from "./product-card";

// 产品类型定义 - 使用FormattedProduct类型
export type ProductType = FormattedProduct;

export function ProductDetails({ 
  product, 
  relatedProducts = [] 
}: { 
  product: ProductType; 
  relatedProducts?: ProductType[] 
}) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { addItem } = useCartStore();
  
  // 将规格数据转换为界面需要的格式
  const specifications = product.specs ? 
    Object.entries(product.specs).map(([name, value]) => ({ name, value: String(value) })) : 
    [];

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity: quantity,
      image: product.image,
      stock: product.stock,
    });
    
    // 显示添加成功提示
    toast.success("已添加到购物车", {
      description: `${product.name} x ${quantity}`,
      action: {
        label: "查看购物车",
        onClick: () => router.push("/cart"),
      },
    });
  };

  // 计算折扣百分比
  const discountPercentage = product.originalPrice 
    ? calculateDiscountPercentage(product.originalPrice, product.price)
    : 0;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/products">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回商品列表
          </Button>
        </Link>
      </div>
      
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* 商品图片区域 */}
        <div>
          <div className="mb-4 overflow-hidden rounded-lg">
            <AspectRatio ratio={1 / 1} className="bg-muted">
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </AspectRatio>
          </div>
          
          {/* 缩略图列表 */}
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-md">
                <AspectRatio ratio={1 / 1} className="bg-muted">
                  <Image 
                    src={image} 
                    alt={`${product.name} ${index + 1}`} 
                    fill 
                    className="cursor-pointer object-cover hover:opacity-90"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                </AspectRatio>
              </div>
            ))}
          </div>
        </div>
        
        {/* 商品信息区域 */}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          {/* 价格信息 */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">¥{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">¥{formatPrice(product.originalPrice)}</span>
            )}
            {product.originalPrice && (
              <span className="ml-2 rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                {discountPercentage}% 折扣
              </span>
            )}
          </div>
          
          {/* 评分 */}
          <div className="mt-4 flex items-center">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} 评价)
            </span>
          </div>
          
          {/* 库存信息 */}
          <div className="mt-4">
            <span className={`text-sm ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {product.stock > 0 ? `库存: ${product.stock}` : '缺货'}
            </span>
          </div>
          
          {/* 简短描述 */}
          <p className="mt-4 text-muted-foreground">{product.description}</p>
          
          {/* 数量选择 */}
          <div className="mt-6">
            <p className="mb-2 font-medium">数量</p>
            <div className="flex items-center">
              <Button variant="outline" size="icon" className="rounded-full" onClick={decreaseQuantity}>
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="mx-4 w-12 text-center">{quantity}</span>
              <Button variant="outline" size="icon" className="rounded-full" onClick={increaseQuantity}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="mt-8 flex gap-4">
            <Button 
              size="lg" 
              className="flex-1 gap-2" 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="h-5 w-5" />
              {product.stock <= 0 ? "已售罄" : "加入购物车"}
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="flex-1 gap-2" 
              onClick={() => {
                if (product.stock > 0) {
                  handleAddToCart();
                  router.push("/cart");
                }
              }}
              disabled={product.stock <= 0}
            >
              {product.stock <= 0 ? "已售罄" : "立即购买"}
            </Button>
            <Button size="icon" variant="outline">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="outline">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          {/* 配送信息 */}
          <div className="mt-8 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">快速配送</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              订单确认后48小时内发货
            </p>
          </div>
        </div>
      </div>
      
      {/* 详细信息标签页 */}
      <div className="mt-12">
        <Tabs defaultValue="details">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="details">商品详情</TabsTrigger>
            <TabsTrigger value="specifications">规格参数</TabsTrigger>
            <TabsTrigger value="reviews">用户评价</TabsTrigger>
          </TabsList>
          <Separator className="my-4" />
          
          <TabsContent value="details">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">商品介绍</h3>
              <p>{product.description}</p>
              <p>{product.description}</p>
              <div className="my-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                {product.images.map((image, index) => (
                  <div key={index} className="overflow-hidden rounded-lg">
                    <AspectRatio ratio={4 / 3} className="bg-muted">
                      <Image 
                        src={image} 
                        alt={`${product.name} 详情 ${index + 1}`} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </AspectRatio>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">规格参数</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between rounded-lg border p-3">
                    <span className="font-medium">{spec.name}</span>
                    <span className="text-muted-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">用户评价</h3>
              <p className="text-muted-foreground">暂无评价数据</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 相关商品推荐 */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">相关推荐</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 