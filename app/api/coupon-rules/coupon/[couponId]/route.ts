import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// GET: 获取指定优惠券的所有规则
export async function GET(
  request: NextRequest,
  { params }: { params: { couponId: string } }
) {
  try {
    const couponId = params.couponId;
    if (!couponId) {
      return NextResponse.json({ error: '优惠券ID不能为空' }, { status: 400 });
    }

    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 检查优惠券是否存在（可选，根据需要决定是否需要验证）
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', couponId)
      .single();
    
    if (couponError || !coupon) {
      return NextResponse.json({ error: '优惠券不存在' }, { status: 404 });
    }
    
    // 获取该优惠券的所有规则
    const { data, error } = await supabase
      .from('coupon_rules')
      .select('*')
      .eq('coupon_id', couponId)
      .order('priority', { ascending: false }); // 按优先级排序
    
    if (error) {
      console.error('Error fetching coupon rules:', error);
      return NextResponse.json({ error: '获取优惠券规则失败' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 