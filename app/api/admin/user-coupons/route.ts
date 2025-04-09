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

// GET: 管理员获取用户优惠券列表
export async function GET(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const userId = searchParams.get('user_id');
    const couponId = searchParams.get('coupon_id');
    const status = searchParams.get('status');
    const isUsed = searchParams.get('is_used');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 计算分页偏移量
    const offset = (page - 1) * limit;
    
    // 构建查询
    let query = supabase
      .from('user_coupons')
      .select(`
        *,
        user:user_id (id, email, name),
        coupon:coupon_id (*)
      `, { count: 'exact' });
    
    // 应用筛选条件
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (couponId) {
      query = query.eq('coupon_id', couponId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (isUsed !== null && isUsed !== undefined) {
      query = query.eq('is_used', isUsed === 'true');
    }
    
    // 应用排序和分页
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching user coupons:', error);
      return NextResponse.json({ error: '获取用户优惠券列表失败' }, { status: 500 });
    }
    
    // 计算总页数
    const totalPages = count ? Math.ceil(count / limit) : 0;
    
    return NextResponse.json({
      user_coupons: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// POST: 管理员批量为用户分配优惠券
export async function POST(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    
    // 解析请求体
    const body = await request.json();
    const { user_ids, coupon_id, expire_days, status = 'active' } = body;
    
    // 验证必须字段
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: '缺少必要字段: user_ids (必须是非空数组)' }, { status: 400 });
    }
    
    if (!coupon_id) {
      return NextResponse.json({ error: '缺少必要字段: coupon_id' }, { status: 400 });
    }
    
    // 检查优惠券是否存在
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', coupon_id)
      .single();
    
    if (couponError || !coupon) {
      return NextResponse.json({ error: '优惠券不存在' }, { status: 404 });
    }
    
    // 计算过期时间
    let expiredAt;
    if (expire_days && typeof expire_days === 'number') {
      const now = new Date();
      expiredAt = new Date(now.setDate(now.getDate() + expire_days)).toISOString();
    } else {
      expiredAt = coupon.end_date;
    }
    
    // 构建插入数据
    const userCouponsData = user_ids.map(userId => ({
      user_id: userId,
      coupon_id,
      status,
      is_used: false,
      expired_at: expiredAt
    }));
    
    // 批量插入用户优惠券
    const { data, error } = await supabase
      .from('user_coupons')
      .insert(userCouponsData)
      .select();
    
    if (error) {
      console.error('Error assigning coupons to users:', error);
      return NextResponse.json({ error: '分配优惠券失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `成功为${data.length}个用户分配优惠券`,
      assigned_coupons: data
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 管理员批量撤销用户优惠券
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdminUser()) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const supabase = createAdminClient();
    
    // 解析请求体
    const body = await request.json();
    const { user_coupon_ids } = body;
    
    // 验证必须字段
    if (!Array.isArray(user_coupon_ids) || user_coupon_ids.length === 0) {
      return NextResponse.json({ error: '缺少必要字段: user_coupon_ids (必须是非空数组)' }, { status: 400 });
    }
    
    // 检查这些优惠券是否已被使用
    const { data: usedCoupons, error: checkError } = await supabase
      .from('user_coupons')
      .select('id')
      .in('id', user_coupon_ids)
      .eq('is_used', true);
    
    if (checkError) {
      console.error('Error checking used coupons:', checkError);
      return NextResponse.json({ error: '检查优惠券状态失败' }, { status: 500 });
    }
    
    // 如果有优惠券已被使用，返回错误
    if (usedCoupons && usedCoupons.length > 0) {
      const usedIds = usedCoupons.map(c => c.id);
      return NextResponse.json({
        error: '无法撤销已使用的优惠券',
        used_coupon_ids: usedIds
      }, { status: 400 });
    }
    
    // 批量删除未使用的优惠券
    const { data, error } = await supabase
      .from('user_coupons')
      .delete()
      .in('id', user_coupon_ids)
      .select();
    
    if (error) {
      console.error('Error revoking user coupons:', error);
      return NextResponse.json({ error: '撤销优惠券失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `成功撤销${data.length}张优惠券`,
      revoked_coupons: data
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 