import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET: 获取当前用户的所有优惠券
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // active, used, expired
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // 计算分页偏移量
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('user_coupons')
      .select(`
        *,
        coupons:coupon_id (*)
      `, { count: 'exact' })
      .eq('user_id', userId);
    
    // 应用筛选条件
    if (status) {
      query = query.eq('status', status);
    }
    
    // 应用排序和分页
    const { data, error, count } = await query
      .order(sortBy as keyof Database['public']['Tables']['user_coupons']['Row'], { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching user coupons:', error);
      return NextResponse.json({ error: '获取优惠券列表失败' }, { status: 500 });
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