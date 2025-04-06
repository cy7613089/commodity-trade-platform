import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { formatProductResponse } from '@/lib/utils/format';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "商品ID不能为空" }, { status: 400 });
    }
    
    // 获取商品详情
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    
    if (error) {
      console.error('获取商品详情失败:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "商品不存在" }, { status: 404 });
      }
      
      return NextResponse.json({ error: "获取商品详情失败" }, { status: 500 });
    }
    
    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    
    // 格式化响应
    const formattedProduct = formatProductResponse(product);
    
    // 获取相关商品推荐 - 根据产品名称相似性推荐
    let relatedProducts = [];
    
    // 使用商品名称的部分关键词来查找相似商品
    const productWords = product.name.split(' ').filter(word => word.length > 2);
    
    if (productWords.length > 0) {
      // 随机选择一个关键词
      const keyword = productWords[Math.floor(Math.random() * productWords.length)];
      
      const { data: related } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${keyword}%`)
        .eq('status', 'active')
        .neq('id', id)
        .limit(4);
      
      if (related && related.length > 0) {
        relatedProducts = related.map(item => formatProductResponse(item));
      } else {
        // 如果没有找到相关商品，返回一些随机商品
        const { data: random } = await supabase
          .from('products')
          .select('*')
          .eq('status', 'active')
          .neq('id', id)
          .limit(4);
        
        if (random) {
          relatedProducts = random.map(item => formatProductResponse(item));
        }
      }
    }
    
    return NextResponse.json({ 
      product: formattedProduct,
      relatedProducts
    });
  } catch (error) {
    console.error('获取商品详情异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
} 