import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * PUT: 更新购物车中的商品
 * 请求体示例:
 * {
 *   quantity: 3, // 新数量
 *   selected: true // 是否选中
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const itemId = params.id;
    
    // 解析请求体
    const body = await request.json();
    const { quantity, selected } = body;
    
    // 至少需要更新数量或选中状态之一
    if (quantity === undefined && selected === undefined) {
      return NextResponse.json({ 
        error: "请指定要更新的数量或选中状态" 
      }, { status: 400 });
    }
    
    // 验证参数
    if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
      return NextResponse.json({ error: "数量必须大于0" }, { status: 400 });
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
    
    // 获取购物车商品及对应的商品信息
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        products (
          stock
        )
      `)
      .eq('id', itemId)
      .eq('cart_id', cart.id)
      .single();
    
    if (itemError) {
      console.error('获取购物车商品失败:', itemError);
      return NextResponse.json({ 
        error: "购物车商品不存在或您无权修改" 
      }, { status: 404 });
    }
    
    // 准备更新内容
    const updateData: { quantity?: number; selected?: boolean } = {};
    
    // 如果要更新数量
    if (quantity !== undefined) {
      // 检查库存
      if (quantity > cartItem.products.stock) {
        return NextResponse.json({ 
          error: "库存不足", 
          available: cartItem.products.stock 
        }, { status: 400 });
      }
      
      updateData.quantity = quantity;
    }
    
    // 如果要更新选中状态
    if (selected !== undefined) {
      updateData.selected = selected;
    }
    
    // 更新购物车商品
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新购物车商品失败:', updateError);
      return NextResponse.json({ error: "更新购物车商品失败" }, { status: 500 });
    }
    
    return NextResponse.json({
      ...updatedItem,
      message: "购物车商品已更新"
    });
    
  } catch (error) {
    console.error('更新购物车商品异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE: 从购物车中删除商品
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const itemId = params.id;
    
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
    
    // 验证商品是否属于该用户的购物车
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('id', itemId)
      .eq('cart_id', cart.id)
      .single();
    
    if (itemError) {
      console.error('验证购物车商品失败:', itemError);
      return NextResponse.json({ 
        error: "购物车商品不存在或您无权删除" 
      }, { status: 404 });
    }
    
    // 删除购物车商品
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (deleteError) {
      console.error('删除购物车商品失败:', deleteError);
      return NextResponse.json({ error: "删除购物车商品失败" }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "商品已从购物车中删除"
    });
    
  } catch (error) {
    console.error('删除购物车商品异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
} 