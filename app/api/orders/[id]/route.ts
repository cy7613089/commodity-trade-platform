import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// --- Helper Functions (与上面相同) ---
function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key for admin client');
    throw new Error('Server configuration error');
  }
  return createServerComponentClient<Database>(
    { cookies: () => cookies() },
    {
      supabaseUrl: supabaseUrl,
      supabaseKey: serviceRoleKey,
    }
  );
}

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

// --- API Route Handlers ---

/**
 * GET /api/orders/[id] - 获取单个订单详情
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const orderId = await params.id;

  if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Invalid Order ID format' }, { status: 400 });
  }

  try {
    // 恢复认证检查
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const userRole = await getUserRole(userId);
    const isAdmin = userRole === 'admin';
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        addresses (*),
        order_items (
            *,
            products ( id, name, images )
        )
        ${isAdmin ? ', users ( id, email, name )' : ''}
      `)
      .eq('id', orderId)
      .single(); // 获取单个记录

    if (error) {
        if (error.code === 'PGRST116') { // specific code for no rows found
             return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        console.error(`Fetch order error for ID ${orderId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
    }

    if (!order) { // double check although single() should handle it
         return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 恢复权限检查
    // 权限检查: 非管理员只能看自己的订单
    if (!isAdmin && order.user_id !== userId) {
      console.warn(`User ${userId} attempted to access order ${orderId} belonging to ${order.user_id}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);

  } catch (error) {
    console.error(`Unexpected error fetching order ${orderId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/orders/[id] - 更新订单状态 (通常仅限管理员)
 * 请求体: { status?: string, payment_status?: string }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = await params.id;
  let supabaseAdmin: ReturnType<typeof createAdminClient>;

  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'Invalid Order ID format' }, { status: 400 });
  }

  try {
    // 权限检查 (需要 Admin)
     const supabase = createClient(); // Need client for session check
     const { data: { session } } = await supabase.auth.getSession();
     if (!session) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     const userRole = await getUserRole(session.user.id);
     if (userRole !== 'admin') {
         return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
     }
     supabaseAdmin = createAdminClient(); // Initialize admin client only if authorized

    // 解析和验证请求体
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { status, payment_status } = body;

    const allowedOrderStatuses = ['PENDING_PAYMENT', 'PENDING_SHIPMENT', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    const allowedPaymentStatuses = ['unpaid', 'paid', 'refunded'];

    const updateData: Partial<Database['public']['Tables']['orders']['Update']> = {};
    let updateTimestamp = false;

    if (status) {
        if (!allowedOrderStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid order status: ${status}` }, { status: 400 });
        }
        updateData.status = status;
        if (status === 'SHIPPED') updateData.shipped_at = new Date().toISOString();
        if (status === 'COMPLETED') updateData.delivered_at = new Date().toISOString();
        updateTimestamp = true;
    }

    if (payment_status) {
        if (!allowedPaymentStatuses.includes(payment_status)) {
            return NextResponse.json({ error: `Invalid payment status: ${payment_status}` }, { status: 400 });
        }
        updateData.payment_status = payment_status;
        if (payment_status === 'paid') updateData.paid_at = new Date().toISOString();
        updateTimestamp = true;
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    if (updateTimestamp) {
        updateData.updated_at = new Date().toISOString();
    }

    // 特殊处理：取消订单时可能需要恢复库存 (使用数据库函数更安全)
    if (status === 'CANCELLED') {
        // 1. 获取订单项
        const { data: itemsToRestock, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', orderId);

        if (itemsError) {
            console.error(`Failed to get items for restocking on order ${orderId}:`, itemsError);
            // 继续尝试取消订单，但记录错误
        } else if (itemsToRestock) {
            // 2. 尝试增加库存 (同样，数据库函数是最佳实践)
            try {
                 for (const item of itemsToRestock) {
                    if (item.product_id && item.quantity > 0) {
                         const { error: restockError } = await supabaseAdmin.rpc('adjust_product_stock', {
                            product_uuid: item.product_id,
                            quantity_change: item.quantity // 正数表示增加
                         });
                         if (restockError) {
                              console.error(`Failed to restock product ${item.product_id} for order ${orderId}:`, restockError);
                              // 记录错误，但继续取消订单
                         }
                    }
                 }
            } catch(restockErr) {
                 console.error(`Error during restocking process for order ${orderId}:`, restockErr);
            }
        }
         // 3. 如果支付状态是 'paid'，则应触发退款流程，并将payment_status设为'refunded'
         // TODO: 实现退款逻辑
         if (updateData.payment_status !== 'refunded') { // 避免重复设置
             const { data: currentOrder } = await supabaseAdmin.from('orders').select('payment_status').eq('id', orderId).single();
             if (currentOrder?.payment_status === 'paid') {
                  updateData.payment_status = 'refunded';
                  // 触发实际退款...
             }
         }
    }


    // 执行更新
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        addresses (*),
        order_items (
            *,
            products ( id, name, images )
        )
      `)
      .single();

    if (updateError) {
      console.error(`Update order error for ID ${orderId}:`, updateError);
      if (updateError.code === 'PGRST116') {
           return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }
     if (!updatedOrder) {
         return NextResponse.json({ error: 'Order not found after update attempt' }, { status: 404 });
    }


    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error(`Unexpected error updating order ${orderId}:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
} 