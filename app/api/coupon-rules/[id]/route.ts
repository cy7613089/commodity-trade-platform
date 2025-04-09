import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createAdminClient } from '@/lib/db';

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

// GET: 获取单个优惠券规则详情（管理员）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    const ruleId = params.id;

    if (!ruleId) {
      return NextResponse.json({ error: '规则ID不能为空' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('coupon_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error || !data) {
      console.error('Error fetching coupon rule:', error);
      return NextResponse.json({ error: '规则不存在' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新单个优惠券规则（管理员）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    const ruleId = params.id;

    if (!ruleId) {
      return NextResponse.json({ error: '规则ID不能为空' }, { status: 400 });
    }

    const body = await request.json();
    const { rule_type, rule_value, priority, is_active } = body;

    const updateData: Partial<Database['public']['Tables']['coupon_rules']['Update']> = {};

    if (rule_type !== undefined) updateData.rule_type = rule_type;
    if (rule_value !== undefined) updateData.rule_value = rule_value;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length <= 1) { // Only updated_at is added by default
        return NextResponse.json({ error: '没有提供要更新的字段' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('coupon_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating coupon rule:', error);
       if (error.code === 'PGRST116') { // Check if rule exists
         return NextResponse.json({ error: '规则不存在' }, { status: 404 });
      }
      return NextResponse.json({ error: '更新规则失败' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 删除单个优惠券规则（管理员）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    const ruleId = params.id;

    if (!ruleId) {
      return NextResponse.json({ error: '规则ID不能为空' }, { status: 400 });
    }

    const { error } = await supabase
      .from('coupon_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Error deleting coupon rule:', error);
       if (error.code === 'PGRST116') {
         return NextResponse.json({ success: true, message: '规则不存在或已被删除' });
      }
      return NextResponse.json({ error: '删除规则失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '规则已删除' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 