import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductDetails } from "@/components/products/product-details";

// 动态生成元数据
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // 从API获取商品详情
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/products/${params.id}`, { next: { revalidate: 60 } });
    
    if (!response.ok) {
      return {
        title: "商品不存在 | 交易平台",
        description: "找不到该商品",
      };
    }
    
    const { product } = await response.json();
    
    if (!product) {
      return {
        title: "商品不存在 | 交易平台",
        description: "找不到该商品",
      };
    }
    
    return {
      title: `${product.name} | 交易平台`,
      description: product.description,
    };
  } catch (error) {
    console.error('获取商品元数据错误:', error);
    return {
      title: "商品 | 交易平台",
      description: "查看商品详情",
    };
  }
}

// 使用服务器组件获取商品数据
export default async function ProductPage({ params }: { params: { id: string } }) {
  try {
    // 从API获取商品详情
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/products/${params.id}`, { next: { revalidate: 60 } });
    
    if (!response.ok) {
      notFound();
    }
    
    const { product, relatedProducts } = await response.json();
    
    if (!product) {
      notFound();
    }
    
    return <ProductDetails product={product} relatedProducts={relatedProducts} />;
  } catch (error) {
    console.error('获取商品详情错误:', error);
    notFound();
  }
} 