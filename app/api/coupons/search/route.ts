import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET: 根据代码、名称或描述搜索优惠券
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    
    const queryTerm = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // e.g., 'active'

    if (!queryTerm) {
      return NextResponse.json({ error: '缺少搜索参数: q' }, { status: 400 });
    }
    
    // 计算分页偏移量
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .or(`code.ilike.%${queryTerm}%,name.ilike.%${queryTerm}%,description.ilike.%${queryTerm}%`);
      
    // 添加状态筛选
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    // 应用排序和分页
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error searching coupons:', error);
      return NextResponse.json({ error: '搜索优惠券失败' }, { status: 500 });
    }
    
    // 计算总页数
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      coupons: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 