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

// 定义订单状态常量
const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PENDING_SHIPMENT: 'PENDING_SHIPMENT',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

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
    // const userRole = await getUserRole(userId);
    // const isAdmin = userRole === 'admin';
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
            *,
            products ( id, name, images )
        )
      `)
      .eq('id', orderId)
      .single(); // 获取单个记录
      // query中模版字符串末尾去掉了{isAdmin ? ', users ( id, email, name )' : ''}

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
    // if (!isAdmin && order.user_id !== userId) {
    if (order.user_id !== userId) {
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
 * PUT /api/orders/[id] - 更新订单状态
 * 普通用户可以更新自己的订单（支付和取消）
 * 管理员可以更新所有订单
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const orderId = await params.id;
  const supabase = createClient();

  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'Invalid Order ID format' }, { status: 400 });
  }

  try {
    // 认证检查
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const userRole = await getUserRole(userId);
    const isAdmin = userRole === 'admin';

    // 解析和验证请求体
    let body;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { status, payment_status, payment_method } = body;

    // 获取当前订单信息，检查所有权
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // 未找到记录
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
    
    // 权限检查: 非管理员只能更新自己的订单
    if (!isAdmin && currentOrder.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own orders' }, { status: 403 });
    }
    
    // 非管理员的操作限制
    if (!isAdmin) {
      // 检查操作权限
      if (status) {
        // 允许的操作:
        // 1. 从PENDING_PAYMENT → PENDING_SHIPMENT（支付）或CANCELLED（取消订单）
        // 2. 从SHIPPED → COMPLETED（确认收货）
        const allowedTransitions = {
          [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.PENDING_SHIPMENT, ORDER_STATUS.CANCELLED],
          [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.COMPLETED]
        };
        
        const currentStatus = currentOrder.status as keyof typeof allowedTransitions;
        
        // 检查当前状态是否允许操作
        if (!allowedTransitions[currentStatus]) {
          return NextResponse.json({ 
            error: `You cannot update orders with ${currentStatus} status` 
          }, { status: 403 });
        }
        
        // 检查目标状态是否允许
        const allowedStatusChanges = allowedTransitions[currentStatus];
        if (!allowedStatusChanges.includes(status as any)) {
          return NextResponse.json({ 
            error: `Cannot change order from ${currentStatus} to ${status}` 
          }, { status: 403 });
        }
      }
    }

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

    if (payment_method) {
      updateData.payment_method = payment_method;
      updateTimestamp = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    if (updateTimestamp) {
      updateData.updated_at = new Date().toISOString();
    }

    // 特殊处理: 如果是管理员，需要处理取消订单时的库存恢复等
    if (isAdmin && status === 'CANCELLED') {
      const adminSupabase = createAdminClient();
      
      // 1. 获取订单项
      const { data: itemsToRestock, error: itemsError } = await adminSupabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error(`Failed to get items for restocking on order ${orderId}:`, itemsError);
        // 继续尝试取消订单，但记录错误
      } else if (itemsToRestock) {
        // 2. 尝试增加库存
        try {
          for (const item of itemsToRestock) {
            if (item.product_id && item.quantity > 0) {
              const { error: restockError } = await adminSupabase.rpc(
                'adjust_product_stock' as any, 
                {
                  product_uuid: item.product_id,
                  quantity_change: item.quantity // 正数表示增加
                }
              );
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
      if (updateData.payment_status !== 'refunded') {
        const { data: paymentData } = await adminSupabase
          .from('orders')
          .select('payment_status')
          .eq('id', orderId)
          .single();
        
        if (paymentData?.payment_status === 'paid') {
          updateData.payment_status = 'refunded';
          // 这里应该有实际的退款逻辑
        }
      }
    }

    // 执行更新
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
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
    console.error(`Unexpected error updating order ${orderId}:`, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}