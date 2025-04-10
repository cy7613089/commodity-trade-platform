import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 管理员获取优惠券列表的API
export async function GET(request: NextRequest) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    // 获取会话信息，验证用户是否登录
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 验证用户是否具有管理员权限
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    // 解析查询参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;
    const sortBy = url.searchParams.get('sort') || 'created_at';
    const orderBy = url.searchParams.get('order') || 'desc';
    const filterType = url.searchParams.get('type');
    const searchQuery = url.searchParams.get('q');
    const isActive = url.searchParams.get('is_active');

    // 构建查询
    let query = supabase
      .from('coupons')
      .select('id, name, code, type, value, discount_type, end_date, is_active, min_purchase, max_discount, color, icon', { count: 'exact' });

    // 应用筛选
    if (filterType) {
      query = query.eq('type', filterType);
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    } else if (isActive === 'false') {
      query = query.eq('is_active', false);
    }

    // 应用排序和分页
    query = query.order(sortBy as keyof Database['public']['Tables']['coupons']['Row'], { ascending: orderBy === 'asc' })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data, error, count } = await query;

    if (error) {
      console.error('[API GET Admin Coupons] Database error:', error);
      return NextResponse.json({ error: '获取优惠券列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      coupons: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('[API GET Admin Coupons] Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 