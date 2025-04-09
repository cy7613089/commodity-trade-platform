import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

interface OrderItem {
  product_id: string;
  price: number;
  quantity: number;
}

// POST: 计算应用特定优惠券组合的优惠金额
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
    const { user_coupon_ids, order_amount, order_items } = body;
    
    // 验证必要参数
    if (!Array.isArray(user_coupon_ids) || user_coupon_ids.length === 0) {
      return NextResponse.json({ error: '未指定要计算的优惠券' }, { status: 400 });
    }
    
    if (!order_amount || typeof order_amount !== 'number' || order_amount <= 0) {
      return NextResponse.json({ error: '订单金额必须大于0' }, { status: 400 });
    }
    
    // 获取用户指定的优惠券信息
    const { data: userCoupons, error: userCouponsError } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupon:coupon_id (*)
      `)
      .in('id', user_coupon_ids)
      .eq('user_id', userId) // 确保只能使用自己的优惠券
      .eq('status', 'active')
      .eq('is_used', false);
    
    if (userCouponsError) {
      console.error('Error fetching user coupons:', userCouponsError);
      return NextResponse.json({ error: '获取优惠券信息失败' }, { status: 500 });
    }
    
    // 如果找不到有效的优惠券或者数量不匹配，返回错误
    if (!userCoupons || userCoupons.length === 0) {
      return NextResponse.json({
        error: '未找到有效的优惠券',
        invalid_coupon_ids: user_coupon_ids
      }, { status: 400 });
    }
    
    if (userCoupons.length !== user_coupon_ids.length) {
      // 找出哪些优惠券ID无效
      const validIds = userCoupons.map(uc => uc.id);
      const invalidIds = user_coupon_ids.filter(id => !validIds.includes(id));
      
      return NextResponse.json({
        error: '部分优惠券无效',
        invalid_coupon_ids: invalidIds
      }, { status: 400 });
    }
    
    // 获取优惠券叠加规则
    const { data: stackingRules, error: stackingError } = await supabase
      .from('coupon_stacking_rules')
      .select('*')
      .eq('is_active', true);
    
    // 获取全局优惠设置
    const { data: globalSettings, error: settingsError } = await supabase
      .from('global_coupon_settings')
      .select('*')
      .single();
    
    // 获取优惠券应用顺序
    const { data: applicationOrder, error: orderError } = await supabase
      .from('coupon_application_order')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();
    
    // 检查是否允许叠加使用这些优惠券
    let canStack = true;
    if (stackingRules && userCoupons.length > 1) {
      // 在有效的叠加规则中检查是否存在一个规则包含了所有选中的优惠券
      const couponIds = userCoupons.map(uc => uc.coupon_id);
      canStack = stackingRules.some(rule => {
        const ruleIds = rule.coupon_ids || [];
        return couponIds.every(id => ruleIds.includes(id));
      });
      
      if (!canStack) {
        return NextResponse.json({
          error: '所选优惠券不能叠加使用',
          allowed_combinations: stackingRules.map(r => r.coupon_ids)
        }, { status: 400 });
      }
    }
    
    // 确定优惠券应用顺序
    let orderedCoupons = [...userCoupons];
    if (applicationOrder && applicationOrder.coupon_ids) {
      // 根据预定义的顺序排序优惠券
      orderedCoupons.sort((a, b) => {
        const aIndex = applicationOrder.coupon_ids.indexOf(a.coupon_id);
        const bIndex = applicationOrder.coupon_ids.indexOf(b.coupon_id);
        
        // 如果一个在列表中而另一个不在，有索引的优先
        if (aIndex === -1 && bIndex !== -1) return 1;
        if (aIndex !== -1 && bIndex === -1) return -1;
        
        // 如果都在列表中，按索引排序
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        
        // 如果都不在列表中，保持原顺序
        return 0;
      });
    }
    
    // 计算优惠金额
    let remainingAmount = order_amount;
    let totalDiscount = 0;
    const discountDetails = [];
    
    for (const userCoupon of orderedCoupons) {
      const coupon = userCoupon.coupon;
      let discountAmount = 0;
      
      // 检查最低消费
      if (coupon.min_purchase && remainingAmount < coupon.min_purchase) {
        discountDetails.push({
          coupon_id: coupon.id,
          user_coupon_id: userCoupon.id,
          amount: 0,
          applied: false,
          reason: `未达到最低消费: ¥${coupon.min_purchase}`
        });
        continue;
      }
      
      // 根据折扣类型计算优惠金额
      if (coupon.discount_type === 'percentage') {
        // 百分比折扣
        discountAmount = (remainingAmount * coupon.value) / 100;
      } else if (coupon.discount_type === 'fixed') {
        // 固定金额折扣
        discountAmount = coupon.value;
      }
      
      // 确保优惠不超过剩余金额
      discountAmount = Math.min(discountAmount, remainingAmount);
      
      // 检查最大折扣限制
      if (coupon.max_discount !== null) {
        discountAmount = Math.min(discountAmount, coupon.max_discount);
      }
      
      // 应用优惠并更新剩余金额
      totalDiscount += discountAmount;
      remainingAmount -= discountAmount;
      
      discountDetails.push({
        coupon_id: coupon.id,
        user_coupon_id: userCoupon.id,
        amount: discountAmount,
        applied: true
      });
    }
    
    // 检查全局优惠上限
    if (globalSettings) {
      // 检查最大优惠比例限制
      if (globalSettings.max_percentage_enabled && order_amount > 0) {
        const percentageDiscount = (totalDiscount / order_amount) * 100;
        if (percentageDiscount > globalSettings.max_percentage) {
          totalDiscount = (order_amount * globalSettings.max_percentage) / 100;
        }
      }
      
      // 检查最大优惠金额限制
      if (globalSettings.max_amount_enabled) {
        totalDiscount = Math.min(totalDiscount, globalSettings.max_amount);
      }
    }
    
    // 四舍五入到两位小数
    totalDiscount = Math.round(totalDiscount * 100) / 100;
    
    // 计算最终金额
    const finalAmount = Math.max(0, order_amount - totalDiscount);
    
    return NextResponse.json({
      original_amount: order_amount,
      discount_amount: totalDiscount,
      final_amount: finalAmount,
      discount_details: discountDetails
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 