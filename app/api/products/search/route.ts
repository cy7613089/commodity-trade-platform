import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { formatProductResponse } from '@/lib/utils/format';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 获取查询参数
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!query) {
      return NextResponse.json({ products: [] });
    }
    
    // 搜索商品
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
      .eq('status', 'active')
      .limit(limit);
    
    if (error) {
      console.error('搜索商品失败:', error);
      return NextResponse.json({ error: "搜索商品失败" }, { status: 500 });
    }
    
    // 格式化响应
    const formattedProducts = products.map(product => formatProductResponse(product));
    
    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('搜索商品异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
} 