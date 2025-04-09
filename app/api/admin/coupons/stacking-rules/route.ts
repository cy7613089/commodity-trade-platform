import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db'; // Assuming admin client creator is in lib/db.ts
import { Database } from '@/types/supabase';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Helper function to check admin role using a regular client first
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

// GET: 获取所有优惠券叠加规则
export async function GET(/* request: NextRequest */) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient(); // Use admin client for data fetching

    const { data, error } = await supabaseAdmin
      .from('coupon_stacking_rules')
      .select('*');

    if (error) {
      console.error('Error fetching stacking rules:', error);
      return NextResponse.json({ error: '获取叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST: 创建新的优惠券叠加规则
export async function POST(request: NextRequest) {
  try {
     if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient(); // Use admin client for data insertion

    const body = await request.json();
    const { name, description, coupon_ids, is_active = true } = body;

    if (!name || !Array.isArray(coupon_ids) || coupon_ids.length === 0) {
      return NextResponse.json({ error: '缺少必要字段: name, coupon_ids' }, { status: 400 });
    }

    // Validate coupon_ids exist? (Optional, depends on requirements)

    const { data, error } = await supabaseAdmin
      .from('coupon_stacking_rules')
      .insert({ name, description, coupon_ids, is_active })
      .select()
      .single();

    if (error) {
      console.error('Error creating stacking rule:', error);
      return NextResponse.json({ error: '创建叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新单个叠加规则 (根据ID)
export async function PUT(request: NextRequest) {
  try {
     if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少必要参数: id' }, { status: 400 });
    }

    const body = await request.json();
    // Only allow updating specific fields
    const { name, description, coupon_ids, is_active } = body;
    // Specify the correct type for updateData
    const updateData: Partial<Database['public']['Tables']['coupon_stacking_rules']['Update']> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coupon_ids !== undefined) {
        if (!Array.isArray(coupon_ids)) return NextResponse.json({ error: 'coupon_ids 必须是数组' }, { status: 400 });
        updateData.coupon_ids = coupon_ids;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: '没有提供要更新的字段' }, { status: 400 });
    }
    updateData.updated_at = new Date().toISOString(); // Update timestamp

    const { data, error } = await supabaseAdmin
      .from('coupon_stacking_rules')
      .update(updateData)
      .eq('id', id as string)
      .select()
      .single();

    if (error) {
      console.error('Error updating stacking rule:', error);
      if (error.code === 'PGRST116') { // Check for specific Supabase error if row doesn't exist
         return NextResponse.json({ error: '叠加规则不存在' }, { status: 404 });
      }
      return NextResponse.json({ error: '更新叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 删除单个叠加规则 (根据ID)
export async function DELETE(request: NextRequest) {
  try {
     if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const supabaseAdmin = createAdminClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少必要参数: id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('coupon_stacking_rules')
      .delete()
      .eq('id', id as string);

    if (error) {
      console.error('Error deleting stacking rule:', error);
       if (error.code === 'PGRST116') {
         // Consider if a 404 is appropriate or just success if it doesn't exist
         return NextResponse.json({ success: true, message: '叠加规则不存在或已被删除' });
      }
      return NextResponse.json({ error: '删除叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '叠加规则已删除' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 