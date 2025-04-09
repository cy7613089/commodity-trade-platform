import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';
import { Database } from '@/types/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper function to check admin role
async function isAdminUser() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) return false;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return !userError && userData?.role === 'admin';
}

// GET: 获取优惠券应用顺序规则 (假设只有一条或少数几条记录)
export async function GET(/* request: NextRequest */) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

     // You might want a query param to select a specific rule if multiple are allowed
     // const { searchParams } = new URL(request.url);
     // const ruleName = searchParams.get('name') || 'default'; // Example

    // For simplicity, assume only one active rule exists or we fetch the first active one
    const { data, error } = await supabaseAdmin
      .from('coupon_application_order')
      .select('*')
      .eq('is_active', true) // Fetch only active rules
      .order('created_at', { ascending: false }) // Get the most recent one if multiple active
      .maybeSingle(); // Fetch one or none

    if (error) {
      console.error('Error fetching coupon application order:', error);
      return NextResponse.json({ error: '获取优惠券应用顺序失败' }, { status: 500 });
    }

     // Return default if none found
    const applicationOrder = data || {
        id: null,
        coupon_ids: [],
        is_active: false,
        created_at: null,
        updated_at: null
    };


    return NextResponse.json(applicationOrder);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新或创建优惠券应用顺序规则
export async function PUT(request: NextRequest) {
   try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

    const body = await request.json();
    const {
        coupon_ids, // Array of coupon IDs in the desired order
        is_active = true // Whether this rule should be active
        // id // Optional: ID of the specific rule to update if multiple rules are allowed
    } = body;


    if (!Array.isArray(coupon_ids)) {
       return NextResponse.json({ error: 'coupon_ids 必须是数组' }, { status: 400 });
    }
    if (is_active !== undefined && typeof is_active !== 'boolean') {
         return NextResponse.json({ error: 'is_active 必须是布尔值' }, { status: 400 });
    }

    // Validate coupon_ids exist? (Optional)

    // Specify the correct type for updateData
    const updateData: Partial<Database['public']['Tables']['coupon_application_order']['Update']> = {
        coupon_ids,
        is_active,
        updated_at: new Date().toISOString()
    };


    // Logic to decide whether to update or insert
    // For simplicity, let's assume we update the *first* existing active rule,
    // or create a new one if none exist. A more robust system might use names or IDs.

    const { data: existingRule, error: fetchError } = await supabaseAdmin
        .from('coupon_application_order')
        .select('id')
        .eq('is_active', true) // Find an existing active rule
        .order('created_at', { ascending: true }) // Get the oldest active one
        .limit(1)
        .maybeSingle();

    if (fetchError) {
        console.error('Error checking for existing application order rule:', fetchError);
        return NextResponse.json({ error: '检查应用顺序规则时出错' }, { status: 500 });
    }

     let resultData, resultError;

    if (existingRule?.id) {
        // If setting a new rule active, potentially deactivate others?
        // This logic depends on whether multiple active rules are allowed.
        // For now, just update the found rule.
         const { data, error } = await supabaseAdmin
            .from('coupon_application_order')
            .update(updateData)
            .eq('id', existingRule.id)
            .select()
            .single();
        resultData = data;
        resultError = error;
    } else {
        // Create a new rule if no active one exists
         const { data, error } = await supabaseAdmin
            .from('coupon_application_order')
            // Cast to Insert type
            .insert(updateData as Database['public']['Tables']['coupon_application_order']['Insert'])
            .select()
            .single();
         resultData = data;
         resultError = error;
    }


    if (resultError) {
      console.error('Error updating/creating coupon application order:', resultError);
      return NextResponse.json({ error: '更新或创建优惠券应用顺序失败' }, { status: 500 });
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 