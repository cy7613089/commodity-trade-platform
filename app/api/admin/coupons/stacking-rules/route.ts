import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Helper function to check admin role
async function requireAdmin(req: NextRequest) {
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

// 获取叠加规则列表
export async function GET(request: NextRequest) {
  const { error: authError, isAdmin, supabase } = await requireAdmin(request);
  if (!isAdmin || !supabase) return authError;

  try {
    const { data, error } = await supabase
      .from('coupon_stacking_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API GET Stacking Rules] Error fetching:', error);
      return NextResponse.json({ error: '获取叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json({ rules: data });
  } catch (error) {
    console.error('[API GET Stacking Rules] Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新叠加规则
export async function POST(request: NextRequest) {
  const { error: authError, isAdmin, supabase } = await requireAdmin(request);
  if (!isAdmin || !supabase) return authError;

  try {
    const body = await request.json();

    // 验证必要字段
    const { name, description, rule_type, coupon_ids, is_active } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '规则名称 (name) 是必需的字符串' }, { status: 400 });
    }
    if (!rule_type || !['ALLOW', 'DISALLOW'].includes(rule_type)) {
      return NextResponse.json({ error: '规则类型 (rule_type) 必须是 ALLOW 或 DISALLOW' }, { status: 400 });
    }
    if (!coupon_ids || !Array.isArray(coupon_ids) || coupon_ids.length === 0) {
      return NextResponse.json({ error: '优惠券ID列表 (coupon_ids) 是必需的且不能为空数组' }, { status: 400 });
    }
    // 可选：验证 coupon_ids 中的每个 ID 都是有效的 UUID 格式

    const { data, error } = await supabase
      .from('coupon_stacking_rules')
      .insert({
        name,
        description,
        rule_type,
        coupon_ids,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('[API POST Stacking Rules] Error creating:', error);
      // 检查是否是重复键错误 (如果 name 或其他字段有唯一约束)
      if (error.code === '23505') { // PostgreSQL unique violation code
         return NextResponse.json({ error: `规则名称 "${name}" 已存在` }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: '创建叠加规则失败' }, { status: 500 });
    }

    return NextResponse.json({ rule: data }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('[API POST Stacking Rules] Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 移除旧的 PUT 和 DELETE 方法，它们将移到 [id]/route.ts
// export async function PUT(request: NextRequest) { ... }
// export async function DELETE(request: NextRequest) { ... } 