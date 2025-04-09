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

// GET: 获取全局优惠设置 (假设只有一条记录)
export async function GET(/* request: NextRequest */) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('global_coupon_settings')
      .select('*')
      .maybeSingle(); // Use maybeSingle as there might be no settings yet

    if (error) {
      console.error('Error fetching global coupon settings:', error);
      return NextResponse.json({ error: '获取全局优惠设置失败' }, { status: 500 });
    }

    // 如果还没有设置，可以返回一个默认值或空对象
    const settings = data || {
        id: null, // Indicate no existing record
        max_percentage_enabled: false,
        max_percentage: 50.00,
        max_amount_enabled: false,
        max_amount: 100.00,
        created_at: null,
        updated_at: null
    };


    return NextResponse.json(settings);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新或创建全局优惠设置
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

    const body = await request.json();
    const {
        max_percentage_enabled,
        max_percentage,
        max_amount_enabled,
        max_amount
    } = body;

    // Basic validation
     if (max_percentage_enabled !== undefined && typeof max_percentage_enabled !== 'boolean') {
        return NextResponse.json({ error: 'max_percentage_enabled 必须是布尔值' }, { status: 400 });
    }
     if (max_amount_enabled !== undefined && typeof max_amount_enabled !== 'boolean') {
        return NextResponse.json({ error: 'max_amount_enabled 必须是布尔值' }, { status: 400 });
    }
    if (max_percentage !== undefined && (typeof max_percentage !== 'number' || max_percentage < 0 || max_percentage > 100)) {
       return NextResponse.json({ error: 'max_percentage 必须是 0 到 100 之间的数字' }, { status: 400 });
    }
    if (max_amount !== undefined && (typeof max_amount !== 'number' || max_amount < 0)) {
       return NextResponse.json({ error: 'max_amount 必须是非负数' }, { status: 400 });
    }

    // Specify the correct type for updateData
    const updateData: Partial<Database['public']['Tables']['global_coupon_settings']['Update']> = {};
    if (max_percentage_enabled !== undefined) updateData.max_percentage_enabled = max_percentage_enabled;
    if (max_percentage !== undefined) updateData.max_percentage = max_percentage;
    if (max_amount_enabled !== undefined) updateData.max_amount_enabled = max_amount_enabled;
    if (max_amount !== undefined) updateData.max_amount = max_amount;

    if (Object.keys(updateData).length === 0) {
         return NextResponse.json({ error: '没有提供要更新的字段' }, { status: 400 });
    }
    updateData.updated_at = new Date().toISOString(); // Update timestamp

    // Try to fetch existing settings to get the ID
    const { data: existingSettings, error: fetchError } = await supabaseAdmin
        .from('global_coupon_settings')
        .select('id')
        .maybeSingle();

     if (fetchError) {
        console.error('Error checking for existing settings:', fetchError);
        return NextResponse.json({ error: '检查设置时出错' }, { status: 500 });
     }


    let resultData, resultError;

    if (existingSettings?.id) {
      // Update existing settings
      const { data, error } = await supabaseAdmin
        .from('global_coupon_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select()
        .single();
        resultData = data;
        resultError = error;
    } else {
      // Create new settings if none exist
       const { data, error } = await supabaseAdmin
        .from('global_coupon_settings')
        // Cast to Insert type, ensuring all required fields for insert are provided or defaulted in DB
        .insert(updateData as Database['public']['Tables']['global_coupon_settings']['Insert'])
        .select()
        .single();
        resultData = data;
        resultError = error;
    }


    if (resultError) {
      console.error('Error updating/creating global coupon settings:', resultError);
      return NextResponse.json({ error: '更新或创建全局优惠设置失败' }, { status: 500 });
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 