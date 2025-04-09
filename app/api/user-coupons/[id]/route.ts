import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET: 获取单个用户优惠券详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userCouponId = params.id;
    if (!userCouponId) {
      return NextResponse.json({ error: '优惠券ID不能为空' }, { status: 400 });
    }

    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 获取用户优惠券信息
    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupons:coupon_id (*)
      `)
      .eq('id', userCouponId)
      .eq('user_id', session.user.id) // 确保只能查看自己的优惠券
      .single();
    
    if (error) {
      console.error('Error fetching user coupon:', error);
      return NextResponse.json({ error: '优惠券不存在或无权访问' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新用户优惠券状态
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userCouponId = params.id;
    if (!userCouponId) {
      return NextResponse.json({ error: '优惠券ID不能为空' }, { status: 400 });
    }

    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 验证用户拥有此优惠券
    const { data: existingUserCoupon, error: existingError } = await supabase
      .from('user_coupons')
      .select('id, status')
      .eq('id', userCouponId)
      .eq('user_id', session.user.id)
      .single();
    
    if (existingError || !existingUserCoupon) {
      return NextResponse.json({ error: '优惠券不存在或无权访问' }, { status: 404 });
    }
    
    // 解析请求体
    const body = await request.json();
    const { status, is_used, used_at, used_order_id } = body;
    
    // 构造更新对象
    const updateData: Partial<Database['public']['Tables']['user_coupons']['Update']> = {};
    
    // 只更新状态相关的字段
    if (status !== undefined) updateData.status = status;
    if (is_used !== undefined) updateData.is_used = is_used;
    if (used_at !== undefined) updateData.used_at = used_at;
    if (used_order_id !== undefined) updateData.used_order_id = used_order_id;
    
    // 更新用户优惠券信息
    const { data, error } = await supabase
      .from('user_coupons')
      .update(updateData)
      .eq('id', userCouponId)
      .eq('user_id', session.user.id) // 再次确保只能更新自己的优惠券
      .select();
    
    if (error) {
      console.error('Error updating user coupon:', error);
      return NextResponse.json({ error: '更新优惠券失败' }, { status: 500 });
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 