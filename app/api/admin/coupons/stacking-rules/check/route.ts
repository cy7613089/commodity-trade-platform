import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 检查优惠券是否可以叠加使用的API
export async function POST(request: NextRequest) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    // 获取会话信息，这个API需要用户登录但不需要管理员权限
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

    // 查询所有相关的叠加规则
    const { data: allRules, error: rulesError } = await supabase
      .from('coupon_stacking_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      console.error('[API Check Stacking] Error fetching rules:', rulesError);
      return NextResponse.json(
        { error: '获取叠加规则失败' }, 
        { status: 500 }
      );
    }

    // 找出所有不可叠加规则（DISALLOW），检查提供的优惠券是否匹配任何一条
    const disallowRules = allRules.filter(rule => rule.rule_type === 'DISALLOW');
    
    // 检查是否有任何DISALLOW规则包含所有提供的优惠券
    for (const rule of disallowRules) {
      // 创建一个集合，用于快速查找规则中的优惠券ID
      const ruleIds = new Set(rule.coupon_ids);
      
      // 检查所有提供的优惠券是否都在这个规则中
      // 对于DISALLOW规则，我们只需要检查任意两个优惠券在同一个禁用规则中即可
      if (coupon_ids.filter(id => ruleIds.has(id)).length >= 2) {
        return NextResponse.json({
          can_stack: false,
          rule_matched: {
            id: rule.id,
            name: rule.name,
            type: 'DISALLOW'
          },
          message: `优惠券不能同时使用，因为它们在禁用叠加规则"${rule.name || '未命名'}"中`
        });
      }
    }

    // 如果没有匹配任何DISALLOW规则，再检查ALLOW规则
    // 找出所有可叠加规则
    const allowRules = allRules.filter(rule => rule.rule_type === 'ALLOW');
    
    // 如果没有ALLOW规则，默认为不可叠加
    if (allowRules.length === 0) {
      return NextResponse.json({
        can_stack: false,
        message: '默认情况下，优惠券不能叠加使用，除非有显式允许规则'
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
          message: `优惠券可以同时使用，因为它们在允许叠加规则"${rule.name || '未命名'}"中`
        });
      }
    }

    // 如果没有找到匹配的规则，默认不允许叠加
    return NextResponse.json({
      can_stack: false,
      message: '优惠券无法叠加使用，因为没有找到匹配的允许叠加规则'
    });
    
  } catch (error) {
    console.error('[API Check Stacking] Server error:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 