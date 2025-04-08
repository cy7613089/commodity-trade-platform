import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// 创建Supabase客户端
function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

// 获取用户角色
async function getUserRole(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    console.error(`Error fetching role for user ${userId}:`, error);
    return null;
  }
  
  return data.role;
}

/**
 * PUT /api/admin/orders/[id] - 管理员更新订单状态
 * 仅管理员可访问
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const orderId = params.id;

  try {
    // 验证用户会话和权限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const userRole = await getUserRole(userId);
    
    // 检查是否为管理员
    if (userRole !== 'admin') {
      return NextResponse.json({ error: '没有权限访问' }, { status: 403 });
    }

    // 解析请求体
    const body = await request.json();
    const { status } = body;

    // 验证状态值
    const validStatuses = ['PENDING_PAYMENT', 'PENDING_SHIPMENT', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: '无效的订单状态' }, { status: 400 });
    }

    // 更新订单状态
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ 
        status: status,
        // 添加相应的时间戳
        ...(status === 'PENDING_SHIPMENT' && { paid_at: new Date().toISOString() }),
        ...(status === 'SHIPPED' && { shipped_at: new Date().toISOString() }),
        ...(status === 'COMPLETED' && { delivered_at: new Date().toISOString() }),
      })
      .eq('id', orderId)
      .select(`
        id,
        order_number,
        user_id,
        total_amount,
        discount_amount,
        final_amount,
        shipping_fee,
        status,
        payment_method,
        payment_status,
        created_at,
        users (
          id, 
          email,
          name
        ),
        order_items (
          id,
          product_id,
          product_name,
          product_image,
          quantity,
          price
        )
      `)
      .single();

    if (error) {
      console.error('管理员更新订单状态错误:', error);
      return NextResponse.json({ error: '更新订单状态失败' }, { status: 500 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('更新订单状态错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 