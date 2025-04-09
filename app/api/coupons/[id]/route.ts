import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 获取单个优惠券详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id;
    if (!couponId) {
      return NextResponse.json({ error: '优惠券ID不能为空' }, { status: 400 });
    }

    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 获取当前用户信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
    }
    
    // 检查用户是否为管理员或者是否是自己创建的优惠券
    let query = supabase
      .from('coupons')
      .select(`
        *,
        coupon_rules(*)
      `)
      .eq('id', couponId);
    
    // 非管理员用户只能查看自己创建的优惠券或公开的优惠券
    if (userData.role !== 'admin') {
      query = query.or(`created_by.eq.${session.user.id},is_public.eq.true`);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return NextResponse.json({ error: '优惠券不存在或无权访问' }, { status: 404 });
    }
    
    // 如果不是管理员，不再需要过滤不存在的字段
    // if (userData.role !== 'admin') {
    //   delete data.internal_note; // This field does not exist in the type definition
    //   delete data.created_by;   // This field does not exist in the type definition
    //   delete data.admin_only;   // This field does not exist in the type definition
    // }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新优惠券
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id;
    if (!couponId) {
      return NextResponse.json({ error: '优惠券ID不能为空' }, { status: 400 });
    }

    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 检查用户是否为管理员
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
    }
    
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: '只有管理员可以更新优惠券' }, { status: 403 });
    }
    
    // 检查优惠券是否存在
    const { data: existingCoupon, error: existingError } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', couponId)
      .single();
    
    if (existingError || !existingCoupon) {
      return NextResponse.json({ error: '优惠券不存在' }, { status: 404 });
    }
    
    // 解析请求体
    const body = await request.json();
    const {
      name,
      code,
      description,
      discount_type,
      value,
      start_date,
      end_date,
      is_active,
      usage_limit,
      min_purchase,
      max_discount,
      type,
      color,
      icon,
      coupon_rules
    } = body;
    
    // 构造更新对象，使用 Partial<TablesUpdate<'coupons'>> 类型
    const updateData: Partial<Database['public']['Tables']['coupons']['Update']> = {};
    
    // 只更新提供的字段
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (discount_type !== undefined) updateData.discount_type = discount_type;
    if (value !== undefined) updateData.value = value;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit;
    if (min_purchase !== undefined) updateData.min_purchase = min_purchase;
    if (max_discount !== undefined) updateData.max_discount = max_discount;
    if (type !== undefined) updateData.type = type;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    
    // 更新优惠券信息 (移除未使用的 updatedCoupon 变量)
    const { error: updateError } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', couponId)
      .select(); // Keep select() to check for errors, even if result isn't used directly here
    
    if (updateError) {
      return NextResponse.json({ error: '更新优惠券失败', details: updateError.message }, { status: 500 });
    }
    
    // 如果提供了优惠券规则，更新规则
    if (coupon_rules && Array.isArray(coupon_rules)) {
      // 先删除现有规则
      await supabase
        .from('coupon_rules')
        .delete()
        .eq('coupon_id', couponId);
      
      // 添加新规则
      for (const rule of coupon_rules) {
        await supabase
          .from('coupon_rules')
          .insert({
            coupon_id: couponId,
            rule_type: rule.rule_type,
            rule_value: rule.rule_value,
            priority: rule.priority || 0
          });
      }
    }
    
    // 获取更新后的完整优惠券信息（包括规则）
    const { data: result, error: resultError } = await supabase
      .from('coupons')
      .select(`
        *,
        coupon_rules(*)
      `)
      .eq('id', couponId)
      .single();
    
    if (resultError) {
      return NextResponse.json({ error: '获取更新后的优惠券信息失败' }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除优惠券
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id;
    if (!couponId) {
      return NextResponse.json({ error: '优惠券ID不能为空' }, { status: 400 });
    }

    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 检查用户是否为管理员
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
    }
    
    if (userData.role !== 'admin') {
      return NextResponse.json({ error: '只有管理员可以删除优惠券' }, { status: 403 });
    }
    
    // 检查优惠券是否存在
    const { data: existingCoupon, error: existingError } = await supabase
      .from('coupons')
      .select('id')
      .eq('id', couponId)
      .single();
    
    if (existingError || !existingCoupon) {
      return NextResponse.json({ error: '优惠券不存在' }, { status: 404 });
    }
    
    // 先删除关联的优惠券规则
    await supabase
      .from('coupon_rules')
      .delete()
      .eq('coupon_id', couponId);
    
    // 删除优惠券
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);
    
    if (deleteError) {
      return NextResponse.json({ error: '删除优惠券失败', details: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '优惠券已成功删除' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 