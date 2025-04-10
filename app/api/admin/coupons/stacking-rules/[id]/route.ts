import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Helper function to check admin role
async function requireAdmin() { // Removed req parameter as it's not needed here
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return { error: NextResponse.json({ error: '未授权访问' }, { status: 401 }), isAdmin: false };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userError || userData?.role !== 'admin') {
    return { error: NextResponse.json({ error: '没有权限访问' }, { status: 403 }), isAdmin: false };
  }

  return { error: null, isAdmin: true, supabase };
}

// 更新叠加规则
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error: authError, isAdmin, supabase } = await requireAdmin();
  if (!isAdmin || !supabase) return authError;
  
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // 准备更新数据，只包含请求体中存在的字段
    const updateData: Partial<Database['public']['Tables']['coupon_stacking_rules']['Update']> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.rule_type !== undefined) {
      if (!['ALLOW', 'DISALLOW'].includes(body.rule_type)) {
        return NextResponse.json({ error: '无效的规则类型 (rule_type)' }, { status: 400 });
      }
      updateData.rule_type = body.rule_type;
    }
    if (body.coupon_ids !== undefined) {
      if (!Array.isArray(body.coupon_ids)) {
         return NextResponse.json({ error: 'coupon_ids 必须是数组' }, { status: 400 });
      }
       updateData.coupon_ids = body.coupon_ids;
    }
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    // 如果没有提供任何要更新的字段
    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: '没有提供要更新的字段' }, { status: 400 });
    }
    
    // 添加 updated_at 时间戳
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('coupon_stacking_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API PUT Stacking Rules] Error updating:', error);
      // 处理规则不存在的情况
      if (error.code === 'PGRST116') { // PostgREST error for no rows found
         return NextResponse.json({ error: `规则 ID ${id} 未找到` }, { status: 404 });
      }
      return NextResponse.json({ error: '更新叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('[API PUT Stacking Rules] Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除叠加规则
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { error: authError, isAdmin, supabase } = await requireAdmin();
  if (!isAdmin || !supabase) return authError;

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
  }
  
  try {
    const { error } = await supabase
      .from('coupon_stacking_rules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[API DELETE Stacking Rules] Error deleting:', error);
      // PGRST116 错误码表示没有找到要删除的行，这在 DELETE 中通常不是一个需要阻止操作的错误
      if (error.code === 'PGRST116') {
         return NextResponse.json({ error: `规则 ID ${id} 未找到` }, { status: 404 });
      } 
      return NextResponse.json({ error: '删除叠加规则失败' }, { status: 500 });
    }
    
    // 返回 204 No Content 表示成功删除
    return new Response(null, { status: 204 }); 
  } catch (error) {
    console.error('[API DELETE Stacking Rules] Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 