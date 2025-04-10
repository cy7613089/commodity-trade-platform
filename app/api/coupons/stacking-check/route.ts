import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 用户端检查优惠券是否可以叠加使用的API
export async function POST(request: NextRequest) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    // 获取会话信息，这个API需要用户登录
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { coupon_ids } = body;

    // 验证输入
    if (!coupon_ids || !Array.isArray(coupon_ids) || coupon_ids.length < 2) {
      return NextResponse.json(
        { error: '请提供至少两个要检查的优惠券ID' }, 
        { status: 400 }
      );
    }

    // 验证这些优惠券是否属于当前用户
    const { data: userCoupons, error: userCouponsError } = await supabase
      .from('user_coupons')
      .select('coupon_id')
      .eq('user_id', session.user.id)
      .eq('is_used', false)
      .in('status', ['active', 'valid'])
      .in('coupon_id', coupon_ids);

    if (userCouponsError) {
      console.error('[API User Stacking Check] Error fetching user coupons:', userCouponsError);
      return NextResponse.json(
        { error: '获取用户优惠券失败' }, 
        { status: 500 }
      );
    }

    // 检查所有提供的优惠券是否都属于当前用户
    const userCouponIds = userCoupons.map(uc => uc.coupon_id);
    const invalidCoupons = coupon_ids.filter(id => !userCouponIds.includes(id));
    
    if (invalidCoupons.length > 0) {
      return NextResponse.json(
        { 
          error: '无效的优惠券选择', 
          message: '部分或全部优惠券不可用或不属于当前用户',
          invalid_coupon_ids: invalidCoupons
        }, 
        { status: 400 }
      );
    }

    // 查询所有活跃的叠加规则
    const { data: allRules, error: rulesError } = await supabase
      .from('coupon_stacking_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      console.error('[API User Stacking Check] Error fetching rules:', rulesError);
      return NextResponse.json(
        { error: '获取叠加规则失败' }, 
        { status: 500 }
      );
    }

    // 首先检查是否有任何DISALLOW规则
    const disallowRules = allRules.filter(rule => rule.rule_type === 'DISALLOW');
    
    for (const rule of disallowRules) {
      // 创建一个集合，用于快速查找规则中的优惠券ID
      const ruleIds = new Set(rule.coupon_ids);
      
      // 检查提供的优惠券中是否有任意两个在同一个禁用规则中
      const matchedCoupons = coupon_ids.filter(id => ruleIds.has(id));
      if (matchedCoupons.length >= 2) {
        // 获取匹配的优惠券名称，用于显示给用户
        const { data: matchedCouponNames, error: couponNamesError } = await supabase
          .from('coupons')
          .select('id, name')
          .in('id', matchedCoupons);
          
        const couponNames = couponNamesError || !matchedCouponNames 
          ? matchedCoupons.map(id => `ID: ${id.substring(0, 6)}...`) 
          : matchedCouponNames.map(c => c.name);

        return NextResponse.json({
          can_stack: false,
          rule_matched: {
            id: rule.id,
            name: rule.name,
            type: 'DISALLOW'
          },
          matched_coupons: matchedCouponNames || [],
          message: `以下优惠券不能同时使用: ${couponNames.join(', ')}`,
          detail: `这些优惠券在不可叠加规则"${rule.name || '未命名'}"中定义为不可同时使用`
        });
      }
    }

    // 如果没有匹配的DISALLOW规则，检查ALLOW规则
    const allowRules = allRules.filter(rule => rule.rule_type === 'ALLOW');
    
    // 如果没有ALLOW规则，默认不可叠加
    if (allowRules.length === 0) {
      return NextResponse.json({
        can_stack: false,
        message: '默认情况下，优惠券不能叠加使用',
        detail: '系统中没有定义任何允许叠加的规则'
      });
    }

    // 检查是否有任何ALLOW规则包含所有提供的优惠券
    for (const rule of allowRules) {
      const ruleIds = new Set(rule.coupon_ids);
      
      // 检查所有提供的优惠券是否都在同一个ALLOW规则中
      const allIncluded = coupon_ids.every(id => ruleIds.has(id));
      
      if (allIncluded) {
        return NextResponse.json({
          can_stack: true,
          rule_matched: {
            id: rule.id,
            name: rule.name,
            type: 'ALLOW'
          },
          message: '所选优惠券可以同时使用',
          detail: `这些优惠券在允许叠加规则"${rule.name || '未命名'}"中定义为可以同时使用`
        });
      }
    }

    // 如果没有找到匹配的规则，默认不允许叠加
    return NextResponse.json({
      can_stack: false,
      message: '所选优惠券不能一起使用',
      detail: '系统中没有允许这些优惠券一起使用的规则'
    });
    
  } catch (error) {
    console.error('[API User Stacking Check] Server error:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 