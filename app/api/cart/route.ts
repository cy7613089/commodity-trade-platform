import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * GET: 获取当前用户的购物车及所有商品
 * 返回：
 * - 购物车ID
 * - 购物车中的所有商品（包括商品详情）
 * - 所有商品的总价
 * - 选中商品的总价
 */
export async function GET(_request: NextRequest) {
  try {
    // 使用createServerComponentClient，不需要await cookies()
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('获取用户会话失败:', sessionError);
      return NextResponse.json({ error: "获取用户会话失败" }, { status: 401 });
    }
    
    if (!session) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 获取或创建购物车 - 使用any类型绕过类型检查
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;
    
    const { data: cart, error: cartError } = await supabaseAny
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (cartError && cartError.code !== 'PGRST116') { // PGRST116是"没有找到结果"错误
      console.error('获取购物车失败:', cartError);
      return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
    }
    
    // 如果购物车不存在，则创建一个
    let cartId = cart?.id;
    if (!cart) {
      const { data: newCart, error: createError } = await supabaseAny
        .from('carts')
        .insert([{ user_id: userId }])
        .select('id')
        .single();
      
      if (createError) {
        console.error('创建购物车失败:', createError);
        return NextResponse.json({ error: "创建购物车失败" }, { status: 500 });
      }
      
      cartId = newCart.id;
    }
    
    // 获取购物车中的所有商品 - 使用小写字段名修复数据库列名不匹配问题
    const { data: cartItems, error: itemsError } = await supabaseAny
      .from('cart_items')
      .select(`
        id,
        quantity,
        selected,
        products (
          id,
          name,
          price,
          originalprice,
          stock,
          images
        )
      `)
      .eq('cart_id', cartId);
    
    if (itemsError) {
      console.error('获取购物车商品失败:', itemsError);
      return NextResponse.json({ error: "获取购物车商品失败" }, { status: 500 });
    }
    
    // 处理返回的数据格式
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = cartItems.map((item: any) => ({
      id: item.id,
      productId: item.products.id,
      name: item.products.name,
      price: Number(item.products.price),
      originalPrice: item.products.originalprice ? Number(item.products.originalprice) : undefined,
      image: item.products.images && item.products.images.length > 0 ? item.products.images[0] : null,
      quantity: item.quantity,
      stock: item.products.stock,
      selected: item.selected,
      subtotal: Number(item.products.price) * item.quantity
    }));
    
    // 计算总金额
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    
    // 计算选中商品的总金额
    const selectedTotalAmount = items
      .filter((item: any) => item.selected)
      .reduce((sum: number, item: any) => sum + item.subtotal, 0);
    
    return NextResponse.json({
      id: cartId,
      items,
      totalAmount,
      selectedTotalAmount,
      itemCount: items.length
    });
    
  } catch (error) {
    console.error('获取购物车异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE: 清空当前用户的购物车
 * 删除购物车中的所有商品
 */
export async function DELETE(_request: NextRequest) {
  try {
    // 使用createServerComponentClient，不需要await cookies()
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 使用any类型绕过类型检查
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;
    
    // 获取用户的购物车
    const { data: cart, error: cartError } = await supabaseAny
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (cartError) {
      console.error('获取购物车失败:', cartError);
      return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
    }
    
    // 删除购物车中的所有商品
    const { error: deleteError } = await supabaseAny
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);
    
    if (deleteError) {
      console.error('清空购物车失败:', deleteError);
      return NextResponse.json({ error: "清空购物车失败" }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "购物车已清空"
    });
    
  } catch (error) {
    console.error('清空购物车异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}
