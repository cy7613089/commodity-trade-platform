import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// 创建普通Supabase客户端
function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

/**
 * POST /api/checkout - 生成待付款订单
 * 将购物车中的选中商品转为待付款订单，不清空购物车
 * 请求体: {}（空请求体）
 * 返回：{ orderId: string, orderNumber: string }
 */
export async function POST(request: Request) {
  const supabase = createClient();

  try {
    // 1. 获取当前用户会话
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;

    // 2. 获取用户购物车中选中的商品及产品信息
    // 检查用户是否为管理员
    // const { data: userData, error: userError } = await supabase
    //   .from('users')
    //   .select('role')
    //   .eq('id', userId)
    //   .single();

    // if (userError) {
    //   console.error('Error fetching user role:', userError);
    //   return NextResponse.json({ error: 'Failed to validate user' }, { status: 500 });
    // }

    // const isAdmin = userData.role === 'admin';
    // let cartQuery;

    // 根据用户角色查询不同的购物车
    // if (isAdmin) {
    //   const adminCartId = `admin_${userId}`;
    //   cartQuery = supabase
    //     .from('carts')
    //     .select(`
    //       id, 
    //       cart_items(
    //         id, 
    //         quantity, 
    //         selected, 
    //         products(
    //           id, 
    //           name, 
    //           price, 
    //           originalprice, 
    //           stock, 
    //           images
    //         )
    //       )
    //     `)
    //     .eq('id', adminCartId);
    // } else {
    const cartQuery = supabase
        .from('carts')
        .select(`
          id, 
          cart_items(
            id, 
            quantity, 
            selected, 
            products(
              id, 
              name, 
              price, 
              originalprice, 
              stock, 
              images
            )
          )
        `)
        .eq('user_id', userId);
    // }

    const { data: cart, error: cartError } = await cartQuery.single();

    if (cartError) {
      console.error('Cart fetch error:', cartError);
      return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
    }

    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 筛选出已选择的商品
    const selectedCartItems = cart.cart_items.filter(item => item.selected && item.products);

    if (selectedCartItems.length === 0) {
      return NextResponse.json({ error: 'No items selected in cart' }, { status: 400 });
    }

    // 3. 检查库存，计算金额，准备订单项
    let totalAmount = 0;
    let originalTotalAmount = 0;
    const orderItemsData = [];

    for (const item of selectedCartItems) {
      const product = item.products;
      if (!product) {
        console.warn(`Product details missing for cart item ID ${item.id}, skipping.`);
        continue;
      }

      if (item.quantity <= 0) {
        return NextResponse.json({ error: `Invalid quantity for product: ${product.name}` }, { status: 400 });
      }
      
      if (item.quantity > product.stock) {
        return NextResponse.json({ 
          error: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        }, { status: 400 });
      }

      // 确保价格是数字
      const price = Number(product.price);
      const originalPrice = Number(product.originalprice || product.price);
      
      if (isNaN(price) || isNaN(originalPrice)) {
        console.error(`Invalid price for product ID ${product.id}:`, product.price);
        return NextResponse.json({ error: `Invalid price for product: ${product.name}` }, { status: 500 });
      }

      const subtotal = price * item.quantity;
      const originalSubtotal = originalPrice * item.quantity;
      const itemDiscount = Math.max(0, originalSubtotal - subtotal);
      
      totalAmount += subtotal;
      originalTotalAmount += originalSubtotal;

      orderItemsData.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.images ? product.images[0] : null,
        quantity: item.quantity,
        price: price,
        original_price: originalPrice,
        subtotal: subtotal,
        discount: itemDiscount,
      });
    }

    // 4. 计算运费和折扣
    const shippingFee = totalAmount >= 99 ? 0 : 10.00; // 满99包邮示例
    const discountAmount = Math.max(0, originalTotalAmount - totalAmount); // 商品折扣
    const finalAmount = totalAmount + shippingFee; // 最终金额 = 商品总价 + 运费

    // 5. 获取用户默认收货地址(可选)
    let addressId = null;
    try {
      const { data: address } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (address?.id) {
        addressId = address.id;
      } else {
        // 尝试获取任意一个地址
        const { data: anyAddress } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
          
        if (anyAddress?.id) {
          addressId = anyAddress.id;
        }
      }
    } catch (error) {
      console.log('获取地址失败，但不影响订单创建:', error);
    }

    // 6. 创建订单记录
    const orderNumber = `ORD${Date.now()}${Math.random().toString().slice(2, 6)}`;
    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        total_amount: originalTotalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        status: 'PENDING_PAYMENT', // 待付款状态
        payment_method: null, // 设为null，符合数据库约束
        payment_status: 'unpaid',
        address_id: addressId, // 可能为null
        shipping_fee: shippingFee,
      })
      .select('id, order_number')
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
      // 删除已创建的订单头（简单回滚）
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 });
    }

    // 8. 返回订单ID和订单号
    return NextResponse.json({
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      message: "Order created successfully",
    });
    
  } catch (error) {
    console.error('Checkout process error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 