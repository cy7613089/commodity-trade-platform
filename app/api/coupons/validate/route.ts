import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database, Json } from '@/types/supabase';

/**
 * More specific type for rule values, especially time rules.
 */
interface TimeRuleValue {
  time_type: 'fixed' | 'recurring';
  fixed_dates?: string[];
  recurring?: {
    days_of_week: number[];
    time_ranges?: string[];
  };
  time_ranges?: string[];
  [key: string]: any; // Allow other properties for different rule types
}

/**
 * Checks if the current time satisfies the coupon's time rule.
 * @param ruleValue The parsed JSON value from the coupon_rules table for a 'time' rule.
 * @returns True if the current time is valid according to the rule, false otherwise.
 */
function checkTimeRule(ruleValue: TimeRuleValue | any): boolean {
  if (!ruleValue || typeof ruleValue !== 'object') {
    console.error('Invalid time rule value:', ruleValue);
    return false; // Invalid rule structure
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight

  // Helper function to check time ranges
  const checkTimeRanges = (timeRanges: string[] | undefined): boolean => {
    if (!timeRanges || timeRanges.length === 0) {
      return true; // No specific time range means valid all day
    }
    for (const range of timeRanges) {
      const [startStr, endStr] = range.split('-');
      if (!startStr || !endStr) continue; // Invalid format

      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) continue; // Invalid format

      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM; // Represents the start of the minute *after* the range ends.

      if (startTime <= currentTime && currentTime < endTime) {
        return true; // Current time is within this range
      }
    }
    return false; // Current time is not within any specified range
  };

  const timeType = ruleValue.time_type;

  if (timeType === 'fixed') {
    const fixedDates = ruleValue.fixed_dates;
    const timeRanges = ruleValue.time_ranges;

    if (!Array.isArray(fixedDates) || fixedDates.length === 0) {
      return false; // Fixed type requires dates
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;

    if (fixedDates.includes(currentDateStr)) {
      return checkTimeRanges(timeRanges);
    }
    return false; // Current date not in fixed_dates

  } else if (timeType === 'recurring') {
    const recurring = ruleValue.recurring;
    if (!recurring || typeof recurring !== 'object') return false;

    const daysOfWeek = recurring.days_of_week;
    const timeRanges = recurring.time_ranges;

    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return false; // Recurring type requires days of week
    }

    const currentDayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.

    if (daysOfWeek.includes(currentDayOfWeek)) {
      return checkTimeRanges(timeRanges);
    }
    return false; // Current day not in days_of_week

  } else {
    console.warn('Unknown time rule type:', timeType);
    return false; // Unknown type
  }
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: string;
  value: number;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  start_date: string | null;
  end_date: string | null;
  min_purchase: number | null;
  max_discount: number | null;
  type: string;
  coupon_rules: CouponRule[];
}

interface CouponRule {
  id: string;
  coupon_id: string;
  rule_type: string;
  rule_value: Json;
  is_active: boolean;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 解析请求体
    const body = await request.json();
    const { code, order_amount, order_items } = body;
    
    // 验证必要参数
    if (!code) {
      return NextResponse.json({ error: '优惠券代码不能为空' }, { status: 400 });
    }
    
    if (!order_amount || typeof order_amount !== 'number' || order_amount <= 0) {
      return NextResponse.json({ error: '订单金额必须大于0' }, { status: 400 });
    }
    
    // 获取优惠券信息
    const { data: couponData, error: couponError } = await supabase
      .from('coupons')
      .select(`
        *,
        coupon_rules(*)
      `)
      .eq('code', code)
      .single();
    
    if (couponError || !couponData) {
      return NextResponse.json({ error: '优惠券不存在' }, { status: 404 });
    }
    
    // 类型转换为我们定义的接口类型
    const coupon = couponData as unknown as Coupon;
    
    // 验证优惠券是否有效
    // 1. 检查优惠券是否启用
    if (!coupon.is_active) {
      return NextResponse.json({ 
        valid: false, 
        message: '此优惠券未激活',
        coupon
      });
    }
    
    // 2. 检查使用次数是否超限
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ 
        valid: false, 
        message: '此优惠券已达到使用上限',
        coupon
      });
    }
    
    // 3. 检查有效期
    const now = new Date();
    const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
    const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
    
    if (startDate && now < startDate) {
      return NextResponse.json({ 
        valid: false, 
        message: `此优惠券尚未生效，生效时间: ${startDate.toLocaleDateString()}`,
        coupon
      });
    }
    
    if (endDate && now > endDate) {
      return NextResponse.json({ 
        valid: false, 
        message: '此优惠券已过期',
        coupon
      });
    }
    
    // 4. 检查最低消费限制
    if (coupon.min_purchase && order_amount < coupon.min_purchase) {
      return NextResponse.json({ 
        valid: false, 
        message: `订单金额未达到最低消费限制: ¥${coupon.min_purchase.toFixed(2)}`,
        coupon
      });
    }
    
    // 5. 检查用户是否已经使用过此优惠券（如果是一次性优惠券）
    if (coupon.type === 'one_time') {
      const { data: userCouponUsage, error: usageError } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('coupon_id', coupon.id)
        .eq('status', 'used');
      
      if (!usageError && userCouponUsage && userCouponUsage.length > 0) {
        return NextResponse.json({ 
          valid: false, 
          message: '您已使用过此优惠券',
          coupon
        });
      }
    }
    
    // 6. 检查优惠券规则
    let isValidForRules = true;
    let ruleFailMessage = '';
    
    if (coupon.coupon_rules && coupon.coupon_rules.length > 0) {
      let userData: { role: string | null } | null = null;
      let userFetchError: any = null;
      if (coupon.coupon_rules.some(r => r.rule_type === 'user_group')) {
        const { data: uData, error: uError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single< { role: string | null } >();
        userData = uData;
        userFetchError = uError;
      }

      for (const rule of coupon.coupon_rules) {
        // 处理产品适用规则
        if (rule.rule_type === 'product_applicable' && order_items && Array.isArray(order_items)) {
          try {
            const ruleValueParsed = typeof rule.rule_value === 'string' ? JSON.parse(rule.rule_value) : rule.rule_value;
            const applicableProductIds = ruleValueParsed?.product_ids || [];
            const minQuantity = ruleValueParsed?.min_quantity;

            if (applicableProductIds.length > 0) {
              const orderProductIds = (order_items as OrderItem[]).map(item => item.product_id);
              const hasApplicableProduct = orderProductIds.some(id => applicableProductIds.includes(id));
              
              if (!hasApplicableProduct) {
                isValidForRules = false;
                ruleFailMessage = '此优惠券不适用于当前购买的商品';
                break;
              }
              if (minQuantity > 0) {
                const applicableItemsQuantity = order_items
                  .filter(item => applicableProductIds.includes(item.product_id))
                  .reduce((sum, item) => sum + item.quantity, 0);
                if (applicableItemsQuantity < minQuantity) {
                  isValidForRules = false;
                  ruleFailMessage = `指定商品需购买至少 ${minQuantity} 件`;
                  break;
                }
              }
            }
          } catch (e) {
            console.error('Parse product rule error:', e);
            isValidForRules = false;
            ruleFailMessage = '产品规则解析错误';
            break;
          }
        }
        
        // 处理用户组规则
        if (rule.rule_type === 'user_group') {
          try {
            if (userFetchError) {
              console.error('User fetch error:', userFetchError);
              isValidForRules = false;
              ruleFailMessage = '无法验证用户组规则';
              break;
            }
            if (userData) {
              const ruleValueParsed = typeof rule.rule_value === 'string' ? JSON.parse(rule.rule_value) : rule.rule_value;
              const applicableGroups = ruleValueParsed?.groups || [];
              const userGroup = userData.role;
              
              if (applicableGroups.length > 0 && userGroup && !applicableGroups.includes(userGroup)) {
                isValidForRules = false;
                ruleFailMessage = '此优惠券不适用于您的用户组';
                break;
              }
            } else {
              isValidForRules = false;
              ruleFailMessage = '无法获取用户信息';
              break;
            }
          } catch (e) {
            console.error('Parse user group rule error:', e);
            isValidForRules = false;
            ruleFailMessage = '用户组规则解析错误';
            break;
          }
        }
        
        // 检查时间规则
        if (rule.rule_type === 'time') {
          try {
            const ruleValueParsed = typeof rule.rule_value === 'string' ? JSON.parse(rule.rule_value) : rule.rule_value;
            const isTimeValid = checkTimeRule(ruleValueParsed);
            if (!isTimeValid) {
              isValidForRules = false;
              ruleFailMessage = '当前时间不符合优惠券使用时段';
              break;
            }
          } catch (e) {
            console.error('Parse time rule error:', e);
            isValidForRules = false;
            ruleFailMessage = '时间规则解析错误';
            break;
          }
        }
      }
    }
    
    if (!isValidForRules) {
      return NextResponse.json({ 
        valid: false, 
        message: ruleFailMessage,
        coupon
      });
    }
    
    // 计算折扣金额
    let discountAmount = 0;
    
    if (coupon.discount_type === 'percentage') {
      // 百分比折扣
      discountAmount = (order_amount * coupon.value) / 100;
    } else if (coupon.discount_type === 'fixed') {
      // 固定金额折扣
      discountAmount = coupon.value;
    }
    
    // 确保折扣不超过订单金额
    discountAmount = Math.min(discountAmount, order_amount);
    
    // 检查最大折扣限制
    if (coupon.max_discount !== null) {
      discountAmount = Math.min(discountAmount, coupon.max_discount);
    }
    
    // 四舍五入到两位小数
    discountAmount = Math.round(discountAmount * 100) / 100;
    
    // 计算最终金额
    const finalAmount = Math.max(0, order_amount - discountAmount);
    
    return NextResponse.json({
      valid: true,
      message: '优惠券有效',
      coupon,
      discount_amount: discountAmount,
      final_amount: finalAmount
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 