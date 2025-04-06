import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { formatProductResponse } from '@/lib/utils/format';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    
    // 校验参数
    const validPage = isNaN(page) || page < 1 ? 1 : page;
    const validLimit = isNaN(limit) || limit < 1 || limit > 50 ? 10 : limit;
    const offset = (validPage - 1) * validLimit;
    
    // 构建查询
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    // 应用筛选条件
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // 价格范围筛选
    query = query.gte('price', minPrice).lte('price', maxPrice);
    
    // 只返回激活状态的商品
    query = query.eq('status', 'active');
    
    // 获取商品总数
    const { count } = await query;
    
    // 应用排序和分页
    query = query.order(sortBy, { ascending: order === 'asc' })
      .range(offset, offset + validLimit - 1);
    
    // 执行查询
    const { data: products, error } = await query;
    
    if (error) {
      console.error('获取商品列表失败:', error);
      return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 });
    }
    
    // 格式化响应数据
    const formattedProducts = products.map(product => formatProductResponse(product));
    
    // 返回响应，包括商品列表、分页信息和总数
    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / validLimit) : 0
      }
    });
  } catch (error) {
    console.error('获取商品列表异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
} 