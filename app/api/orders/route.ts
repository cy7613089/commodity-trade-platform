import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { CartItem } from '@/lib/store/cart-store'; // 确保此类型已定义并导入

// --- Helper Functions ---
// 创建普通Supabase客户端
function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

// 创建具有管理员权限的Supabase客户端 (仅在需要时使用)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key for admin client');
    throw new Error('Server configuration error'); // 避免泄露密钥信息
  }
  // 重要: 此客户端拥有完全权限，仅在绝对必要时在服务器端使用
  return createServerComponentClient<Database>(
    { cookies: () => cookies() }, // 传递cookies函数
    {
      supabaseUrl: supabaseUrl,
      supabaseKey: serviceRoleKey,
    }
  );
}

// 获取用户角色 (示例, 需要根据你的实现调整)
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
 * POST /api/orders - 创建新订单
 * 需要认证用户
 * 请求体: { address_id: string, payment_method: string, notes?: string, coupon_code?: string }
 */
export async function POST(request: Request) {
  const supabase = createClient();
  let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null; // 延迟初始化

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. 解析和验证请求体
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { address_id, payment_method, notes, coupon_code } = body; // 增加coupon_code

    if (!address_id || typeof address_id !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing required field: address_id (string)' }, { status: 400 });
    }
    if (!payment_method || typeof payment_method !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing required field: payment_method (string)' }, { status: 400 });
    }
     if (notes && typeof notes !== 'string') {
      return NextResponse.json({ error: 'Invalid field type: notes (should be string)' }, { status: 400 });
    }
    if (coupon_code && typeof coupon_code !== 'string') {
      return NextResponse.json({ error: 'Invalid field type: coupon_code (should be string)' }, { status: 400 });
    }

    // 2. 验证收货地址是否属于该用户
    const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('id')
        .eq('id', address_id)
        .eq('user_id', userId)
        .maybeSingle(); // 使用 maybeSingle 避免未找到时报错

    if (addressError) {
        console.error('Address validation error:', addressError);
        return NextResponse.json({ error: 'Failed to validate address' }, { status: 500 });
    }
    if (!addressData) {
        return NextResponse.json({ error: 'Invalid or unauthorized address ID' }, { status: 400 });
    }


    // 3. 获取用户购物车中选中的商品及产品信息
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, cart_items(id, quantity, selected, products(id, name, price, stock, image))')
      .eq('user_id', userId)
      .single();

    if (cartError) {
      console.error('Cart fetch error:', cartError);
      return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
    }
    if (!cart || !cart.cart_items) {
         return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const selectedCartItems = cart.cart_items.filter(item => item.selected && item.products);

    if (selectedCartItems.length === 0) {
      return NextResponse.json({ error: 'No items selected in cart' }, { status: 400 });
    }

    // 4. 检查库存, 计算金额, 准备订单项
    let totalAmount = 0;
    const orderItemsData: Omit<Database['public']['Tables']['order_items']['Insert'], 'id' | 'order_id' | 'created_at'>[] = [];
    const stockUpdates: { id: string; quantityChange: number }[] = []; // 记录库存变化量

    for (const item of selectedCartItems) {
      const product = item.products;
      if (!product) {
         console.warn(`Product details missing for cart item ID ${item.id}, skipping.`);
         continue; // 跳过无效的购物车项
      }
      if (item.quantity <= 0) {
           return NextResponse.json({ error: `Invalid quantity for product: ${product.name}` }, { status: 400 });
      }
      if (item.quantity > product.stock) {
        return NextResponse.json({ error: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` }, { status: 400 });
      }

      // 确保价格是数字
      const price = Number(product.price);
      if (isNaN(price)) {
           console.error(`Invalid price for product ID ${product.id}:`, product.price);
           return NextResponse.json({ error: `Invalid price for product: ${product.name}` }, { status: 500 });
      }

      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        quantity: item.quantity,
        price: price,
        original_price: price, // TODO: 实际应从产品获取原价
        subtotal: subtotal,
        discount: 0, // 折扣稍后计算
      });

      stockUpdates.push({ id: product.id, quantityChange: -item.quantity }); // 记录需要减少的数量
    }

    // --- 重要提示: 事务性 ---
    // 下面的步骤 (创建订单, 创建订单项, 更新库存, 清空购物车) 应该在一个数据库事务中完成。
    // Supabase JS v2 不直接支持跨表事务，强烈建议使用 Supabase Database Function (plpgsql) 来封装此逻辑，保证原子性。
    // 此处提供按顺序执行的示例，但它在失败时难以完全可靠地回滚。

    // 5. 计算运费和应用优惠券 (示例)
    const shippingFee = totalAmount > 99 ? 0 : 10.00; // 满99包邮示例
    let discountAmount = 0;
    // TODO: 实现优惠券验证和应用逻辑
    if (coupon_code === 'SAVE10') { // 示例优惠码
        discountAmount = 10.00;
    }
    // 确保折扣不超过总金额
    discountAmount = Math.min(totalAmount, discountAmount);

    const finalAmount = Math.max(0, totalAmount + shippingFee - discountAmount); // 确保最终金额不为负

    // 6. 创建订单记录
    const orderNumber = `ORD${Date.now()}${Math.random().toString().slice(2, 8)}`; // 更唯一的订单号
    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        status: 'PENDING_PAYMENT',
        payment_method: payment_method,
        payment_status: 'unpaid',
        address_id: address_id,
        shipping_fee: shippingFee,
        notes: notes ?? null,
      })
      .select('id')
      .single();

    if (orderInsertError || !newOrder) {
      console.error('Order insert error:', orderInsertError);
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
    }
    const orderId = newOrder.id;

    // 7. 插入订单项
    const orderItemsToInsert = orderItemsData.map(item => ({
      ...item,
      order_id: orderId,
    }));
    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsInsertError) {
      console.error(`Order items insert error for order ${orderId}:`, itemsInsertError);
      // 尝试删除已创建的订单头 (简单回滚)
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 });
    }

    // 8. 更新产品库存 (需要Admin权限)
    try {
        supabaseAdmin = createAdminClient();
        // 使用数据库函数来原子性地更新库存是最佳实践
        // 此处使用循环更新作为示例，但非原子操作
        for (const update of stockUpdates) {
            const { error: stockUpdateError } = await supabaseAdmin.rpc('adjust_product_stock', {
                product_uuid: update.id,
                quantity_change: update.quantityChange
            });
            if (stockUpdateError) {
                throw new Error(`Failed to update stock for product ${update.id}: ${stockUpdateError.message}`);
            }
        }
    } catch (stockError) {
        console.error(`Stock update error for order ${orderId}:`, stockError);
        // !! 复杂回滚逻辑 !!
        // 理想情况下数据库函数会处理失败。手动回滚非常困难且易错：
        // 1. 删除已创建的订单项
        // 2. 删除已创建的订单头
        // 3. 尝试将已扣减的库存加回去 (需要记录哪些成功了哪些失败了)
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
        // TODO: 尝试恢复库存 (可能需要额外逻辑)
        return NextResponse.json({ error: 'Failed to update product stock, order creation rolled back (partially?). Please try again.' }, { status: 500 });
    }

    // 9. 从购物车中删除已下单的商品
    const itemIdsToDelete = selectedCartItems.map(item => item.id);
    const { error: deleteCartItemsError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', itemIdsToDelete);

    if(deleteCartItemsError) {
        console.error(`Failed to delete cart items for cart ${cart.id} after order ${orderId} creation:`, deleteCartItemsError);
        // 记录日志，因为订单已创建但购物车未清理
    }

    // 10. 返回成功响应
    return NextResponse.json({
        message: 'Order created successfully',
        orderId: orderId,
        orderNumber: orderNumber,
        finalAmount: finalAmount
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error during order creation:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    // 避免在生产中暴露过多细节
    return NextResponse.json({ error: 'Internal server error during order creation.' }, { status: 500 });
  }
}

/**
 * GET /api/orders - 获取订单列表
 * 支持按 status 过滤, 分页 (page, limit)
 * 普通用户只能看自己的, 管理员可以看所有 (需实现角色检查)
 */
export async function GET(request: Request) { // 另写一个接口实现管理员订单管理页面逻辑
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  // 分页参数
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;

  // 过滤参数
  const statusFilter = searchParams.get('status');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    // const userRole = await getUserRole(userId); // 获取用户角色
    // const isAdmin = userRole === 'admin';

    let query = supabase.from('orders').select(`
      id,
      order_number,
      final_amount,
      status,
      payment_status,
      created_at,
      order_items (
        id,
        product_id,
        product_name,
        product_image,
        quantity,
        price
      )
    `, { count: 'exact' }); // 获取总数用于分页
      // query中模版字符串末尾去掉了{isAdmin ? ', users ( id, email, name )' : ''}
    
    // 条件查询
    // if (!isAdmin) {
    query = query.eq('user_id', userId);
    // }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // 排序和分页
    query = query.order('created_at', { ascending: false }).range(startIndex, endIndex);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Fetch orders error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // 计算分页信息
    const totalPages = Math.ceil((count ?? 0) / limit);

    return NextResponse.json({
        data: orders,
        pagination: {
            currentPage: page,
            pageSize: limit,
            totalItems: count ?? 0,
            totalPages: totalPages,
        }
    });

  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 