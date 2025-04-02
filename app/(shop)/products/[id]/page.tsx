import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductDetails } from "@/components/products/product-details";

// 模拟商品数据 - 实际项目中会从数据库获取
const mockProducts = Array.from({ length: 30 }).map((_, index) => ({
  id: `product-${index + 1}`,
  name: `商品 ${index + 1}`,
  description: `这是商品 ${index + 1} 的详细描述。这款产品具有许多优秀的特性，包括高品质的材料、精湛的工艺和实用的功能。无论是日常使用还是特殊场合，都能满足您的需求。`,
  price: Math.floor(Math.random() * 10000) / 100 + 99,
  originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 15000) / 100 + 199 : undefined,
  image: `/next.svg`,
  images: Array.from({ length: 4 }).map(() => `/next.svg`),
  rating: Math.floor(Math.random() * 5) + 1,
  reviewCount: Math.floor(Math.random() * 500) + 10,
  category: "电子产品",
  brand: "科技品牌",
  stock: Math.floor(Math.random() * 100) + 1,
  specifications: [
    { name: "规格", value: "标准" },
    { name: "材质", value: "高品质材料" },
    { name: "尺寸", value: "中型" },
    { name: "重量", value: "500g" },
    { name: "产地", value: "中国" },
  ],
}));

// 动态生成元数据
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // 在实际应用中，您需要从数据库获取商品
  const product = mockProducts.find((p) => p.id === params.id);
  
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
}

// 使用服务器组件获取商品数据
export default function ProductPage({ params }: { params: { id: string } }) {
  // 在实际应用中，您需要从数据库获取商品
  const product = mockProducts.find((p) => p.id === params.id);
  
  if (!product) {
    notFound();
  }
  
  return <ProductDetails product={product} />;
} 