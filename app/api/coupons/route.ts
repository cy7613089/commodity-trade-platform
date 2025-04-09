import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // 计算分页偏移量
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('coupons')
      .select('*, coupon_rules(*)', { count: 'exact' });
    
    // 应用筛选条件
    if (type) {
      query = query.eq('type', type);
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    // 应用排序和分页
    const { data, error, count } = await query
      .order(sortBy as any, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching coupons:', error);
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 验证用户身份和权限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 验证用户是否为管理员
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: '没有权限创建优惠券' }, { status: 403 });
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证必要字段
    const requiredFields = ['code', 'name', 'type', 'value', 'discount_type', 'start_date', 'end_date'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `缺少必要字段: ${field}` }, { status: 400 });
      }
    }
    
    // 验证优惠券代码唯一性
    const { data: existingCoupon, error: existingError } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();
    
    if (existingCoupon) {
      return NextResponse.json({ error: '优惠券代码已存在' }, { status: 400 });
    }
    
    // 创建优惠券
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: body.code,
        name: body.name,
        description: body.description || null,
        type: body.type,
        value: body.value,
        discount_type: body.discount_type,
        min_purchase: body.min_purchase || 0,
        max_discount: body.max_discount || null,
        usage_limit: body.usage_limit || null,
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active !== undefined ? body.is_active : true,
        color: body.color || 'blue',
        icon: body.icon || null,
        coupon_rule: body.coupon_rule || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json({ error: '创建优惠券失败' }, { status: 500 });
    }
    
    // 如果有规则数据，创建优惠券规则
    if (body.rules && Array.isArray(body.rules) && body.rules.length > 0) {
      const rulesData = body.rules.map(rule => ({
        coupon_id: data.id,
        rule_type: rule.rule_type,
        rule_value: rule.rule_value,
        priority: rule.priority || 0,
        is_active: rule.is_active !== undefined ? rule.is_active : true
      }));
      
      const { error: ruleError } = await supabase
        .from('coupon_rules')
        .insert(rulesData);
      
      if (ruleError) {
        console.error('Error creating coupon rules:', ruleError);
        // 不返回错误，因为优惠券已创建成功
      }
    }
    
    return NextResponse.json({ coupon: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 