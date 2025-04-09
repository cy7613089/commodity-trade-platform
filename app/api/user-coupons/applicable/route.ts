import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

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
function checkTimeRule(ruleValue: TimeRuleValue | any): boolean { // Retain any here due to parsing flexibility
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

// Define needed types locally if not imported globally
interface OrderItem { product_id: string; quantity: number; price: number; }
// Assuming UserCoupon type includes nested coupon definition
type UserCouponWithCoupon = Database['public']['Tables']['user_coupons']['Row'] & {
  coupons: Database['public']['Tables']['coupons']['Row'] & {
    coupon_rules: Database['public']['Tables']['coupon_rules']['Row'][] | null;
  } | null;
};

// POST: 获取对特定订单可用的优惠券列表
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
    const { order_amount, order_items } = body;
    
    // 验证必要参数
    if (!order_amount || typeof order_amount !== 'number' || order_amount <= 0) {
      return NextResponse.json({ error: '订单金额必须大于0' }, { status: 400 });
    }
    
    // Fetch user coupons with nested coupon and rules data
    const { data: userCouponsData, error: userCouponsError } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupons:coupon_id (*, coupon_rules(*))
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('is_used', false);
      
    const userCoupons = userCouponsData as UserCouponWithCoupon[] | null; // Cast to our specific type

    if (userCouponsError) {
      console.error('Error fetching user coupons:', userCouponsError);
      return NextResponse.json({ error: '获取优惠券信息失败' }, { status: 500 });
    }
    
    if (!userCoupons || userCoupons.length === 0) {
      return NextResponse.json({
        applicable_coupons: [],
        message: '没有可用的优惠券'
      });
    }
    
    // Pre-fetch user data once for user_group checks
    let userDataApplicable: { role: string | null } | null = null;
    let userFetchErrorApplicable: Error | null = null;
    // Check if any coupon has a user_group rule
    const needsUserCheck = userCoupons.some(uc => 
        uc.coupons?.coupon_rules?.some(r => r.rule_type === 'user_group' && r.is_active)
    );
    if (needsUserCheck) {
        const { data, error } = await supabase
           .from('users')
           .select('role')
           .eq('id', userId)
           .single<{ role: string | null }>();
        userDataApplicable = data;
        userFetchErrorApplicable = error;
    }

    // Helper function for rule checking
    // Added types for coupon and currentUserData
    async function checkCouponRules(
        coupon: UserCouponWithCoupon['coupons'], 
        orderItemsInput: OrderItem[], 
        userIdInput: string, 
        currentUserData: { role: string | null } | null, 
        // Use Error | null type for fetchError
        fetchError: Error | null 
    ): Promise<boolean> { 
        if (!coupon) return false; // Coupon definition must exist
        const rulesToCheck = coupon.coupon_rules || [];
        if (rulesToCheck.length === 0) return true;

        for (const rule of rulesToCheck) {
            if (!rule.is_active) continue;

            if (rule.rule_type === 'product_applicable' && orderItemsInput && Array.isArray(orderItemsInput)) {
                try {
                    // Keep 'as any' for parsed rule_value due to Json type origin
                    const ruleValueParsed = typeof rule.rule_value === 'string' ? JSON.parse(rule.rule_value) : rule.rule_value as any;
                    const applicableProductIds = ruleValueParsed?.product_ids || [];
                    const minQuantity = ruleValueParsed?.min_quantity;
                    if (applicableProductIds.length > 0) {
                         const orderProductIds = orderItemsInput.map(item => item.product_id);
                         const hasApplicableProduct = orderProductIds.some(id => applicableProductIds.includes(id));
                         if (!hasApplicableProduct) return false;
                         if (minQuantity > 0) {
                              const applicableItemsQuantity = orderItemsInput
                                 .filter(item => applicableProductIds.includes(item.product_id))
                                 .reduce((sum, item) => sum + item.quantity, 0);
                              if (applicableItemsQuantity < minQuantity) return false;
                         }
                    }
                } catch (e) { console.error('Parse product rule error:', e); return false; }
            }

            if (rule.rule_type === 'user_group') {
                 try {
                     if (fetchError) { console.error('User fetch error for applicability:', fetchError); return false; }
                     if (currentUserData) {
                        // Keep 'as any' for parsed rule_value
                        const ruleValueParsed = typeof rule.rule_value === 'string' ? JSON.parse(rule.rule_value) : rule.rule_value as any;
                        const applicableGroups = ruleValueParsed?.groups || [];
                        const userGroup = currentUserData.role;
                        if (applicableGroups.length > 0 && userGroup && !applicableGroups.includes(userGroup)) {
                            return false;
                        }
                     } else {
                          // If check needed but data unavailable, fail the check
                          if (needsUserCheck) return false; 
                     }
                 } catch (e) { console.error('User group rule parse error:', e); return false; }
             }

              if (rule.rule_type === 'time') {
                  try {
                      // Keep 'as any' for parsed rule_value
                      const ruleValueParsed = typeof rule.rule_value === 'string' ? JSON.parse(rule.rule_value) : rule.rule_value as any;
                      const isTimeValid = checkTimeRule(ruleValueParsed);
                      if (!isTimeValid) return false;
                  } catch(e) { console.error('Parse time rule error:', e); return false; }
              }
            // Add other rule checks
        }
        return true;
    }

    // Filter applicable coupons (async)
    const now = new Date();
    const applicableCouponsPromises = userCoupons.map(async (userCoupon) => {
      if (!userCoupon.coupons) return null;
      const coupon = userCoupon.coupons;

      // Basic checks
      if (!coupon.is_active) return null;
      const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
      const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
      if (startDate && now < startDate) return null;
      if (endDate && now > endDate) return null;
      if (userCoupon.expired_at && now > new Date(userCoupon.expired_at)) return null;
      if (coupon.min_purchase && order_amount < coupon.min_purchase) return null;

      // Coupon Rules Check
      const rulesValid = await checkCouponRules(coupon, order_items, userId, userDataApplicable, userFetchErrorApplicable);
      if (!rulesValid) return null;

      return userCoupon;
    });

    const applicableCoupons = (await Promise.all(applicableCouponsPromises))
        .filter((c): c is UserCouponWithCoupon => c !== null); // Type guard to filter nulls and keep type

    // Calculate discount for applicable coupons
    const couponsWithDiscount = applicableCoupons.map(userCoupon => {
      // Coupon definition is guaranteed to exist here due to filter
      const coupon = userCoupon.coupons!;
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (order_amount * coupon.value) / 100;
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.value;
      }
      discountAmount = Math.min(discountAmount, order_amount);
      if (coupon.max_discount !== null) {
        discountAmount = Math.min(discountAmount, coupon.max_discount);
      }
      discountAmount = Math.round(discountAmount * 100) / 100;
      
      return {
        ...userCoupon,
        discount_amount: discountAmount,
        // Calculate final_amount based on this single coupon's discount for display purposes
        final_amount: Math.max(0, order_amount - discountAmount)
      };
    });
    
    // Sort by discount amount
    couponsWithDiscount.sort((a, b) => b.discount_amount - a.discount_amount);
    
    return NextResponse.json({
      applicable_coupons: couponsWithDiscount,
      total_coupons: userCoupons.length,
      applicable_count: couponsWithDiscount.length
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 