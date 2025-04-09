import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createAdminClient } from '@/lib/db';

// Helper function to check admin role
async function isAdminUser() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) return false;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return !userError && userData?.role === 'admin';
}

// GET: 获取优惠券规则列表（管理员）
export async function GET(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const couponId = searchParams.get('coupon_id');
    const ruleType = searchParams.get('rule_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 计算分页偏移量
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('coupon_rules')
      .select('*', { count: 'exact' });
    
    // 应用筛选条件
    if (couponId) {
      query = query.eq('coupon_id', couponId);
    }
    
    if (ruleType) {
      query = query.eq('rule_type', ruleType);
    }
    
    // 应用排序和分页
    const { data, error, count } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching coupon rules:', error);
      return NextResponse.json({ error: '获取优惠券规则失败' }, { status: 500 });
    }
    
    // 计算总页数
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      rules: data,
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

// POST: 创建新的优惠券规则（管理员）
export async function POST(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    
    // 解析请求体
    const body = await request.json();
    const { coupon_id, rule_type, rule_value, priority = 0, is_active = true } = body;
    
    // 验证必须字段
    if (!coupon_id || !rule_type || rule_value === undefined) {
      return NextResponse.json({ error: '缺少必要字段: coupon_id, rule_type, rule_value' }, { status: 400 });
    }
    
    // 检查优惠券是否存在
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', coupon_id)
      .single();
    
    if (couponError || !coupon) {
      return NextResponse.json({ error: '关联的优惠券不存在' }, { status: 404 });
    }
    
    // 创建规则
    const { data, error } = await supabase
      .from('coupon_rules')
      .insert({ coupon_id, rule_type, rule_value, priority, is_active })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating coupon rule:', error);
      return NextResponse.json({ error: '创建优惠券规则失败' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 