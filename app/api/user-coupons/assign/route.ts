import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// POST: 为用户分配优惠券
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 解析请求体
    const body = await request.json();
    const { coupon_id, expire_days } = body;
    
    // 验证必须字段
    if (!coupon_id) {
      return NextResponse.json({ error: '缺少必要字段: coupon_id' }, { status: 400 });
    }
    
    // 检查优惠券是否存在且有效
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .eq('is_active', true)
      .single();
    
    if (couponError || !coupon) {
      return NextResponse.json({ error: '优惠券不存在或未激活' }, { status: 404 });
    }
    
    // 计算过期时间，优先使用优惠券自身的结束时间，除非指定了特定的过期天数
    let expiredAt;
    if (expire_days && typeof expire_days === 'number') {
      const now = new Date();
      expiredAt = new Date(now.setDate(now.getDate() + expire_days)).toISOString();
    } else {
      expiredAt = coupon.end_date;
    }
    
    // 检查用户是否已经拥有此优惠券
    const { data: existingUserCoupon } = await supabase
      .from('user_coupons')
      .select('id')
      .eq('user_id', userId)
      .eq('coupon_id', coupon_id)
      .eq('status', 'active')
      .maybeSingle();
    
    if (existingUserCoupon) {
      return NextResponse.json({ error: '用户已拥有此优惠券' }, { status: 400 });
    }
    
    // 创建用户优惠券记录
    const { data, error } = await supabase
      .from('user_coupons')
      .insert({
        user_id: userId,
        coupon_id,
        status: 'active',
        is_used: false,
        expired_at: expiredAt
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error assigning coupon to user:', error);
      return NextResponse.json({ error: '分配优惠券失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '优惠券分配成功',
      user_coupon: data
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 