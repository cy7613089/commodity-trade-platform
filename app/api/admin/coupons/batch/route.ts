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

// PUT: 管理员批量激活/停用优惠券
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    
    // 解析请求体
    const body = await request.json();
    const { coupon_ids, action } = body;
    
    // 验证必须字段
    if (!Array.isArray(coupon_ids) || coupon_ids.length === 0) {
      return NextResponse.json({ error: '缺少必要字段: coupon_ids (必须是非空数组)' }, { status: 400 });
    }
    
    if (action !== 'activate' && action !== 'deactivate') {
      return NextResponse.json({ error: '无效的操作: action 必须是 activate 或 deactivate' }, { status: 400 });
    }
    
    // 确定要更新的状态
    const newStatus = action === 'activate';
    
    // 批量更新优惠券状态
    const { data, error } = await supabase
      .from('coupons')
      .update({ 
        is_active: newStatus, 
        updated_at: new Date().toISOString() 
      } as Database['public']['Tables']['coupons']['Update'])
      .in('id', coupon_ids)
    
    if (error) {
      console.error('Error batch updating coupons:', error);
      return NextResponse.json({ error: '批量更新优惠券状态失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `成功将 ${data?.length || 0} 张优惠券状态更新为 ${newStatus ? '激活' : '停用'}`,
      updated_coupons: data
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 