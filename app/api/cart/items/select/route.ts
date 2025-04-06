import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * PATCH: 批量选择或取消选择购物车商品
 * 请求体示例:
 * {
 *   itemIds: ["id1", "id2", "id3"], // 商品项ID数组
 *   selected: true // 是否选中
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 解析请求体
    const body = await request.json();
    const { itemIds, selected } = body;
    
    // 参数验证
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "需要指定商品ID数组" }, { status: 400 });
    }
    
    if (selected === undefined) {
      return NextResponse.json({ error: "需要指定选中状态" }, { status: 400 });
    }
    
    // 获取用户的购物车
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (cartError) {
      console.error('获取购物车失败:', cartError);
      return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
    }
    
    // 验证所有商品是否都属于该用户的购物车
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cart.id)
      .in('id', itemIds);
    
    if (itemsError) {
      console.error('验证购物车商品失败:', itemsError);
      return NextResponse.json({ error: "验证购物车商品失败" }, { status: 500 });
    }
    
    // 检查是否所有指定的商品ID都找到了
    if (cartItems.length !== itemIds.length) {
      return NextResponse.json({ 
        error: "部分商品不存在或不属于您的购物车",
        validItems: cartItems.map(item => item.id)
      }, { status: 400 });
    }
    
    // 批量更新选中状态
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ selected })
      .in('id', itemIds)
      .eq('cart_id', cart.id);
    
    if (updateError) {
      console.error('更新购物车商品选中状态失败:', updateError);
      return NextResponse.json({ error: "更新商品选中状态失败" }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: selected ? "已选中指定的商品" : "已取消选中指定的商品",
      itemIds,
      selected
    });
    
  } catch (error) {
    console.error('批量更新购物车商品选中状态异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}
