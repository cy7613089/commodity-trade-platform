"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { Coupon } from '@/types'; // Assuming Coupon type is defined in @/types
import { safeMultiply, safeAdd, safeDivide, safeSubtract } from '@/lib/utils/format';

// Define a basic CartItem type or import it if defined elsewhere
interface CartItem {
  product_id: string;
  quantity: number;
  price: number; // Price per unit *after* any product-specific discounts, before order-level coupons
  // Add other relevant fields like original_price, product details if needed for rules
}

// 为规则、设置等定义类型
interface StackingRule {
  id: string;
  name: string | null;  // 修改为允许null
  rule_type: string;    // 允许更灵活的类型
  coupon_ids: string[];
}

interface GlobalSettings {
  id?: string;
  max_percentage_enabled: boolean | null;
  max_percentage: number | null;
  max_amount_enabled: boolean | null;
  max_amount: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// 定义Tier类型
interface Tier {
  min_amount: number;
  discount: number;
}

/**
 * 获取当前登录用户可用且有效的优惠券列表
 */
export async function getAvailableUserCoupons(): Promise<Coupon[]> {
  const supabase = createServerActionClient<Database>({ cookies });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error("Auth error fetching user coupons:", sessionError);
    return []; // Or throw an error, depending on desired handling
  }

  const now = new Date().toISOString();

  // 1. Fetch user coupon IDs that are active and not expired
  const { data: userCouponData, error: userCouponError } = await supabase
    .from('user_coupons')
    .select('coupon_id')
    .eq('user_id', session.user.id)
    .eq('is_used', false)
    // Assuming 'active' means the user_coupon record itself is active
    .eq('status', 'active') 
    // Ensure the coupon itself hasn't passed its inherent end_date stored in user_coupons if applicable,
    // or rely on the join below for the main coupon end_date.
    // If user_coupons.expired_at exists and is relevant, add: .gt('expired_at', now)
    
  if (userCouponError) {
    console.error("Error fetching user coupon IDs:", userCouponError);
    return [];
  }

  if (!userCouponData || userCouponData.length === 0) {
    return [];
  }

  const availableCouponIds = userCouponData.map(uc => uc.coupon_id).filter(id => id !== null) as string[];

  if (availableCouponIds.length === 0) {
    return [];
  }

  // 2. Fetch full coupon details for those IDs, ensuring the coupon itself is active and valid
  const { data: coupons, error: couponError } = await supabase
    .from('coupons')
    .select('*') // Select all coupon fields defined in your Coupon type
    .in('id', availableCouponIds)
    .eq('is_active', true)
    .gte('end_date', now);    // Ensure coupon has not ended

  if (couponError) {
    console.error("Error fetching coupon details:", couponError);
    return [];
  }

  // Ensure the return type matches Coupon[] defined in @/types
  // Perform any necessary mapping if the DB schema differs from the Coupon type
  return (coupons || []) as Coupon[]; 
}

// --- Implementation for calculateDiscount ---
export async function calculateDiscount(
  cartItems: CartItem[],
  selectedCouponIds: string[],
  signal?: AbortSignal
): Promise<{ appliedCoupons: Coupon[]; totalDiscount: number }> {
  console.log("--- calculateDiscount Start ---");
  console.log("Received cartItems:", JSON.stringify(cartItems));
  console.log("Received selectedCouponIds:", selectedCouponIds);

  const supabase = createServerActionClient<Database>({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("用户未登录");
  }
  if (selectedCouponIds.length === 0) {
    return { appliedCoupons: [], totalDiscount: 0 };
  }

  const now = new Date().toISOString();
  // -- Log cartTotal calculation --
  const cartTotal = cartItems.reduce((sum, item) => 
    safeAdd(sum, safeMultiply(item.price, item.quantity)), 
  0);
  console.log(`Calculated cartTotal: ${cartTotal}`);

  try {
    // 1. 获取已选的优惠券
    // Try passing signal directly if supported by Supabase types, otherwise might need 'as any' or ts-ignore
    // For now, we keep 'as any' as Supabase types might not explicitly include AbortSignal yet.
    // Use @ts-ignore because Supabase type definitions for select options don't include 'signal',
    // even though the runtime accepts it. @ts-expect-error is unused as TS itself doesn't flag an error here.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { data: userCouponsData, error: userCouponsError } = await supabase
      .from('user_coupons')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('coupon_id', { signal } as any)
      .eq('user_id', session.user.id)
      .eq('is_used', false)
      .eq('status', 'active')
      .in('coupon_id', selectedCouponIds);

    let validSelectedIds = selectedCouponIds;
    
    // 如果用户拥有所选优惠券，则使用这些优惠券
    if (!userCouponsError && userCouponsData && userCouponsData.length > 0) {
      const ownedCouponIds = new Set(userCouponsData.map(uc => uc.coupon_id));
      validSelectedIds = selectedCouponIds.filter(id => ownedCouponIds.has(id));
    }
    // 如果没有找到用户拥有的优惠券，则使用所有选中的优惠券
    // 这样即使用户没有已分配的优惠券，也可以使用平台可用优惠券

    // -- 新增：验证 validSelectedIds 中的 ID 格式 --
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const fullyValidatedIds = validSelectedIds.filter(id => uuidRegex.test(id));

    if (fullyValidatedIds.length === 0) {
      console.log("No valid UUIDs found in selected coupons.");
      return { appliedCoupons: [], totalDiscount: 0 };
    }
    // -- 验证结束 --

    if (validSelectedIds.length === 0) {
      console.log("No valid coupons selected.");
      return { appliedCoupons: [], totalDiscount: 0 };
    }

    // -- Log before fetching coupon details --
    console.log("Fetching details for coupon IDs (fullyValidatedIds):", fullyValidatedIds);

    // 2. 拆分查询，单独处理每个查询以避免整体失败
    // 2.1 优惠券查询
    let potentiallyApplicableCoupons: Coupon[] = [];
    try {
      // Use @ts-ignore for the same reason as above.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('*', { signal } as any)
        .in('id', fullyValidatedIds);
      
      if (couponsError?.name === 'AbortError') {
          console.log("Fetching coupons aborted.");
          return { appliedCoupons: [], totalDiscount: -1 }; 
      }
      if (couponsError) {
          console.error("Error fetching coupons:", couponsError);
          throw new Error(`获取优惠券详情失败: ${couponsError.message}`);
      }

      // 在获取基本数据后再进行过滤，移除 start_date 检查
      potentiallyApplicableCoupons = (couponsData || [])
        .filter(coupon => {
          const isActive = coupon.is_active === true;
          const hasNotEnded = coupon.end_date && new Date(coupon.end_date) >= new Date(now);

          // Log filtering details for debugging
          if (!isActive) console.log(`Coupon ${coupon.id} filtered: Not active.`);
          if (!hasNotEnded) console.log(`Coupon ${coupon.id} filtered: End date ${coupon.end_date} is before now ${now}.`);
          
          return isActive && hasNotEnded;
        })
        .map(coupon => coupon as Coupon); // Ensure correct type after filtering
      
      if (potentiallyApplicableCoupons.length === 0) {
        console.log("No active coupons found within valid date range");
        return { appliedCoupons: [], totalDiscount: 0 };
      }
      console.log(`Fetched ${potentiallyApplicableCoupons.length} potentially applicable, active coupons.`);
    } catch (error: unknown) { // Use unknown for better type safety
        if (error instanceof Error && error.name === 'AbortError') {
             console.log("Fetching coupons aborted (caught).");
             return { appliedCoupons: [], totalDiscount: -1 }; 
        }
        console.error("Error during coupon data fetch:", error);
        throw error; // Re-throw other errors
    }

    // 2.2 获取叠加规则
    let stackingRules: StackingRule[] = [];
    try {
      // Use @ts-ignore for the same reason as above.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { data: stackingData, error: stackingError } = await supabase
        .from('coupon_stacking_rules')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('id, name, rule_type, coupon_ids', { signal } as any)
        .eq('is_active', true);
      
      if (stackingError?.name === 'AbortError') {
          console.log("Fetching stacking rules aborted.");
          return { appliedCoupons: [], totalDiscount: -1 }; 
      }
      if (stackingError) {
          console.error("Error fetching stacking rules:", stackingError);
          // Decide handling: maybe proceed without rules or throw
          console.warn("无法加载叠加规则，将不应用任何叠加限制。"); 
          // Or: throw new Error(`获取叠加规则失败: ${stackingError.message}`);
      } else {
          stackingRules = stackingData || [];
      }
    } catch (error: unknown) { // Use unknown
        if (error instanceof Error && error.name === 'AbortError') {
             console.log("Fetching stacking rules aborted (caught).");
             return { appliedCoupons: [], totalDiscount: -1 }; 
        }
        console.error("Error during stacking rule fetch:", error);
        // Decide handling
        console.warn("获取叠加规则时出错，将不应用任何叠加限制。");
    }

    // 2.3 获取全局设置
    let globalSettings: GlobalSettings | null = null;
    try {
      // Use @ts-ignore for the same reason as above.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { data: settingsData, error: settingsError } = await supabase
        .from('global_coupon_settings')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('*', { signal } as any)
        .limit(1)
        .maybeSingle();
      
      if (settingsError?.name === 'AbortError') {
          console.log("Fetching global settings aborted.");
          return { appliedCoupons: [], totalDiscount: -1 }; 
      }
      if (settingsError) {
          console.error("Error fetching global settings:", settingsError);
          // Decide handling: proceed with defaults or throw
           console.warn("无法加载全局优惠券设置，将使用默认行为。");
          // Or: throw new Error(`获取全局设置失败: ${settingsError.message}`);
      } else {
           globalSettings = settingsData;
      }
    } catch (error: unknown) { // Use unknown
        if (error instanceof Error && error.name === 'AbortError') {
             console.log("Fetching global settings aborted (caught).");
             return { appliedCoupons: [], totalDiscount: -1 }; 
        }
        console.error("Error during global settings fetch:", error);
        // Decide handling
        console.warn("获取全局设置时出错，将使用默认行为。");
    }

    // 2.4 获取应用顺序
    let applicationOrder: string[] = [];
    console.log("Attempting to fetch coupon application order...");
    try {
      // Use @ts-ignore for the same reason as above.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { data: orderData, error: orderError } = await supabase
        .from('coupon_application_order')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('order_config', { signal } as any)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
        
      console.log("Raw applicationOrder fetch result:", { orderData, orderError });

      if (orderError?.name === 'AbortError') {
          console.log("Fetching application order aborted.");
          return { appliedCoupons: [], totalDiscount: -1 }; 
      }

      if (orderError) {
        console.error("Error explicitly fetching application order:", orderError);
      } else if (orderData && Array.isArray(orderData.order_config)) {
        // 安全地转换类型并提取 ID
        const orderConfigArray = orderData.order_config as unknown[]; // 转为 unknown[] 更安全
        applicationOrder = orderConfigArray
                            // 使用类型守卫来确保 item 是包含 id 的对象
                            .filter((item): item is { id: string } => 
                                typeof item === 'object' && 
                                item !== null && 
                                'id' in item && 
                                typeof (item as { id: unknown }).id === 'string'
                            )
                            .map(item => item.id); // 现在 item 被推断为 { id: string }
        console.log("Successfully fetched and processed application order:", applicationOrder);
      } else {
        console.log("No active application order row found or order_config field is missing/empty/invalid.", { hasOrderData: !!orderData });
      }
    } catch (error: unknown) { // Use unknown
        if (error instanceof Error && error.name === 'AbortError') {
             console.log("Fetching application order aborted (caught).");
             return { appliedCoupons: [], totalDiscount: -1 }; 
        }
        console.error("Error during application order fetch:", error);
        // Decide handling
        console.warn("获取优惠券应用顺序时出错，将使用默认顺序。");
    }

    // 3. Filter based on individual coupon conditions (Basic: min_purchase)
    const countBeforeMinPurchaseFilter = potentiallyApplicableCoupons.length;
    potentiallyApplicableCoupons = potentiallyApplicableCoupons.filter(coupon => {
      const meetsMinPurchase = (coupon.min_purchase || 0) <= cartTotal;
      if (!meetsMinPurchase) {
        console.log(`Coupon ${coupon.name} (ID: ${coupon.id}) filtered out: Min purchase ${coupon.min_purchase} > cartTotal ${cartTotal}`);
      }
      return meetsMinPurchase;
    });
    console.log(`Coupons after min_purchase filter: ${potentiallyApplicableCoupons.length} (removed ${countBeforeMinPurchaseFilter - potentiallyApplicableCoupons.length})`);

    if (potentiallyApplicableCoupons.length === 0) {
        console.log("No coupons meet individual conditions.")
        return { appliedCoupons: [], totalDiscount: 0 };
    }

    const applicableCouponIds = new Set(potentiallyApplicableCoupons.map(c => c.id!));

    // 4. Apply Stacking Rules
    // DISALLOW check: If any 2+ applicable coupons are in a DISALLOW rule, it's invalid (or needs adjustment)
    const disallowRules = stackingRules.filter(r => r.rule_type === 'DISALLOW');
    for (const rule of disallowRules) {
      const ruleCouponIds = new Set(rule.coupon_ids);
      const intersection = [...applicableCouponIds].filter(id => ruleCouponIds.has(id));
      if (intersection.length >= 2) {
        console.warn(`Stacking conflict (DISALLOW rule: ${rule.name || rule.id}) for coupons:`, intersection);
        // Strategy: For now, just disallow the whole selection if a conflict exists.
        // A more complex strategy could remove lower priority coupons based on applicationOrder.
        return { appliedCoupons: [], totalDiscount: 0 }; 
      }
    }

    // ALLOW check: If ALLOW rules exist, the final set must be within *one* of the ALLOW rules.
    const allowRules = stackingRules.filter(r => r.rule_type === 'ALLOW');
    if (allowRules.length > 0 && applicableCouponIds.size > 1) {
      let allowed = false;
      for (const rule of allowRules) {
        const ruleCouponIds = new Set(rule.coupon_ids);
        if ([...applicableCouponIds].every(id => ruleCouponIds.has(id))) {
          allowed = true;
          break;
        }
      }
      if (!allowed) {
         console.warn(`Stacking conflict: Coupons ${[...applicableCouponIds].join(', ')} not found together in any ALLOW rule.`);
         // If not explicitly allowed, only allow the highest priority single coupon (or none)
         // Simplification: return none for now if combination isn't explicitly allowed
         return { appliedCoupons: [], totalDiscount: 0 }; 
      }
    }
    // If only one coupon remains after filtering, stacking rules don't prevent it.

    // 5. Apply Application Order (Sort applicable coupons)
    const finalApplicableCoupons = potentiallyApplicableCoupons.filter(c => applicableCouponIds.has(c.id!));

    console.log("Coupons before sorting:", finalApplicableCoupons.map(c => ({ id: c.id, name: c.name })));
    console.log("Application Order from DB:", applicationOrder);

    if (applicationOrder.length > 0 && finalApplicableCoupons.length > 1) {
        finalApplicableCoupons.sort((a, b) => {
            const idA = a.id!;
            const idB = b.id!;
            const indexA = applicationOrder.indexOf(idA);
            const indexB = applicationOrder.indexOf(idB);
            
            let sortResult = 0;
            // 如果 a 不在顺序列表中，排在后面
            if (indexA === -1 && indexB !== -1) sortResult = 1;
            // 如果 b 不在顺序列表中，排在后面
            else if (indexA !== -1 && indexB === -1) sortResult = -1;
            // 如果都不在，保持原始顺序
            else if (indexA === -1 && indexB === -1) sortResult = 0; 
            // 都在列表中，按索引排序
            else sortResult = indexA - indexB;
            
            // -- 添加详细比较日志 --
            console.log(`  Sorting Compare: ${a.name} vs ${b.name} | ID_A: ${idA} (idx: ${indexA}) | ID_B: ${idB} (idx: ${indexB}) | Result: ${sortResult}`);
            // -- 日志结束 --

            return sortResult;
        });
        console.log("Coupons after sorting by application order:", finalApplicableCoupons.map(c => ({ id: c.id, name: c.name })));
    } else {
        console.log("No application order found or only one coupon, skipping sort.");
    }

    // 6. Calculate Discount Iteratively (respecting order)
    let currentTotalDiscount = 0;
    let remainingCartTotal = cartTotal; // Base for percentage calculation starts as full total
    const appliedCouponsList: Coupon[] = [];

    console.log(`Starting discount calculation. Initial cartTotal: ${cartTotal}`);

    for (const coupon of finalApplicableCoupons) {
        let discountAmountThisCoupon = 0;
        const couponRule = coupon.coupon_rule ? 
          (typeof coupon.coupon_rule === 'string' ? JSON.parse(coupon.coupon_rule) : coupon.coupon_rule) 
          : null;

        // Check general min_purchase condition first
        const meetsMinPurchaseOnRemaining = (coupon.min_purchase || 0) <= remainingCartTotal;
        if (!meetsMinPurchaseOnRemaining) {
             console.log(`Coupon ${coupon.name} (ID: ${coupon.id}) skipped: Minimum purchase ${coupon.min_purchase} not met on remaining total ${remainingCartTotal}`);
             continue;
        }

        // -- Log coupon details before type check --
        console.log(`Processing coupon: ${coupon.name} (ID: ${coupon.id})`, {
            type: coupon.type,
            discount_type: coupon.discount_type,
            value: coupon.value,
            min_purchase: coupon.min_purchase,
            coupon_rule: couponRule // Log parsed rule
        });

        // Handle different coupon types with clear separation
        if (coupon.type === 'amount' && couponRule?.tiers) {
            console.log("  -> Handling as 'amount' type with tiered discount (Iterative Logic).");
            const tiers = (couponRule.tiers as Tier[])
                          .sort((a, b) => b.min_amount - a.min_amount); // Ensure descending order
            console.log("     Sorted Tiers:", tiers);
            
            let remainingAmountForTierCalc = cartTotal; // Use original cart total for this coupon's calculation
            discountAmountThisCoupon = 0; // Reset for this coupon
            console.log(`     Starting iterative tier calculation with amount: ${remainingAmountForTierCalc}`);

            for (const tier of tiers) {
                if (tier.min_amount <= 0) continue; // Avoid division by zero or infinite loop

                if (remainingAmountForTierCalc >= tier.min_amount) {
                    const numberOfApplications = Math.floor(remainingAmountForTierCalc / tier.min_amount);
                    console.log(`     Tier (${tier.min_amount} - ${tier.discount}): Found ${numberOfApplications} applications.`);
                    if (numberOfApplications > 0) {
                        const discountForThisTier = safeMultiply(numberOfApplications, tier.discount);
                        discountAmountThisCoupon = safeAdd(discountAmountThisCoupon, discountForThisTier);
                        remainingAmountForTierCalc = safeSubtract(remainingAmountForTierCalc, safeMultiply(numberOfApplications, tier.min_amount));
                        console.log(`       Added discount: ${discountForThisTier}. Total coupon discount now: ${discountAmountThisCoupon}. Remaining amount: ${remainingAmountForTierCalc}`);
                    }
                } else {
                  console.log(`     Tier (${tier.min_amount} - ${tier.discount}): Minimum not met for remaining amount ${remainingAmountForTierCalc}.`);
                }
            }
             console.log(`     Finished iterative tier calculation. Total discount for this coupon: ${discountAmountThisCoupon}`);

        } else if (coupon.discount_type === 'fixed') {
            discountAmountThisCoupon = coupon.value || 0;
            console.log(`  -> Fixed Discount: ${discountAmountThisCoupon}`);
        } else if (coupon.discount_type === 'percentage') {
            const couponValue = coupon.value || 0;
            discountAmountThisCoupon = safeMultiply(remainingCartTotal, safeDivide(couponValue, 100));
            console.log(`  -> Percentage Discount (Raw): ${discountAmountThisCoupon} (${couponValue}% of ${remainingCartTotal})`);
            if (coupon.max_discount && discountAmountThisCoupon > coupon.max_discount) {
                console.log(`  -> Applying Max Discount Limit: ${coupon.max_discount}`);
                discountAmountThisCoupon = coupon.max_discount;
            }
        } else {
            console.warn(`  -> Unhandled Type/DiscountType. Type: ${coupon.type}, DiscountType: ${coupon.discount_type}. Skipping coupon.`);
            // Keep discountAmountThisCoupon as 0
        }

        // Ensure discount doesn't exceed the remaining total
        if (discountAmountThisCoupon > remainingCartTotal) {
            console.log(`  -> Discount ${discountAmountThisCoupon} capped to remaining total ${remainingCartTotal}`);
            discountAmountThisCoupon = remainingCartTotal;
        }

        // Ensure discount is non-negative
        discountAmountThisCoupon = Math.max(0, discountAmountThisCoupon);

        // Apply the calculated discount
        if (discountAmountThisCoupon > 0) {
            currentTotalDiscount = safeAdd(currentTotalDiscount, discountAmountThisCoupon);
            console.log(`  => Applied Discount: ${discountAmountThisCoupon}. New currentTotalDiscount: ${currentTotalDiscount}`);
            
            // -- 修改：所有应用的折扣都减少 remainingCartTotal --
            remainingCartTotal = safeSubtract(remainingCartTotal, discountAmountThisCoupon);
            console.log(`     Remaining Cart Total after applying ${coupon.name}: ${remainingCartTotal}`);
            // -- 修改结束 --
            
            appliedCouponsList.push(coupon);
        } else {
             console.log(`  -> Calculated discount is 0 for ${coupon.name}. Coupon not applied.`);
        }

        // Early exit if remaining total is zero or less
        if (remainingCartTotal <= 0) {
            remainingCartTotal = 0;
            console.log("Remaining cart total reached 0 or less. Exiting discount loop.");
            break;
        }
    }

    console.log(`Finished iterative calculation. Total Discount Before Global Limits: ${currentTotalDiscount}`);

    // 7. Apply Global Limits
    let finalDiscount = currentTotalDiscount;
    if (globalSettings) {
        if (globalSettings.max_percentage_enabled && globalSettings.max_percentage && globalSettings.max_percentage > 0) {
            const maxDiscountByPercentage = safeMultiply(cartTotal, safeDivide(globalSettings.max_percentage, 100));
            if (finalDiscount > maxDiscountByPercentage) {
                console.log(`Applying global max percentage limit: ${globalSettings.max_percentage}%`);
                finalDiscount = maxDiscountByPercentage;
            }
        }
        if (globalSettings.max_amount_enabled && globalSettings.max_amount && globalSettings.max_amount > 0) {
            if (finalDiscount > globalSettings.max_amount) {
                console.log(`Applying global max amount limit: ${globalSettings.max_amount}`);
                finalDiscount = globalSettings.max_amount;
            }
        }
    }
    
    // Ensure discount doesn't exceed original cart total
    finalDiscount = Math.min(finalDiscount, cartTotal);
    finalDiscount = Math.max(0, finalDiscount); // Ensure discount is not negative

    // Final check: The appliedCouponsList might be longer than what the finalDiscount reflects
    // due to global limits. We could prune appliedCouponsList here if needed, but for now
    // return the list that *could* apply before limits, and the final limited discount.

    console.log("Calculation finished:", { appliedCoupons: appliedCouponsList.map(c=>c.name), totalDiscount: finalDiscount });
    console.log("--- calculateDiscount End ---");
    return {
      appliedCoupons: appliedCouponsList,
      totalDiscount: finalDiscount,
    };

  } catch (error: unknown) { // Use unknown for the main catch block
    if (error instanceof Error && error.name === 'AbortError') {
      console.log("calculateDiscount aborted during processing.");
      // Return specific state indicating abortion
      return { appliedCoupons: [], totalDiscount: -1 }; 
    }
    console.error("Error in calculateDiscount Server Action:", error);
    console.log("--- calculateDiscount End (Error) ---");
    // Return 0 discount in case of any other error during calculation
    // Consider if throwing is more appropriate for non-abort errors
    return { appliedCoupons: [], totalDiscount: 0 }; 
  }

  console.log("--- calculateDiscount End (Success) ---");
  // This part needs to be correctly placed after the try-catch block 
  // if it represents the successful completion path.
  // Assuming the main logic correctly calculates and returns the result before this line.
  // The actual return should happen within the try block upon successful calculation.
  // Let's assume the final return statement is handled within the main logic part
  // that applies rules and calculates discount.

} // End of calculateDiscount function 