import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * POST: 添加商品到购物车
 * 请求体示例:
 * {
 *   productId: "product-uuid", // 商品ID
 *   quantity: 2 // 添加数量，默认为1
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 解析请求体
    const body = await request.json();
    const { productId, quantity = 1 } = body;
    
    if (!productId) {
      return NextResponse.json({ error: "缺少商品ID" }, { status: 400 });
    }
    
    // 验证商品是否存在
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, price')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      console.error('获取商品信息失败:', productError);
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    
    // 检查库存
    if (product.stock < quantity) {
      return NextResponse.json({ 
        error: "库存不足", 
        available: product.stock 
      }, { status: 400 });
    }
    
    // 获取或创建购物车
    let { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (cartError && cartError.code !== 'PGRST116') {
      console.error('获取购物车失败:', cartError);
      return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
    }
    
    // 如果购物车不存在，则创建一个
    if (!cart) {
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert([{ user_id: userId }])
        .select('id')
        .single();
      
      if (createError) {
        console.error('创建购物车失败:', createError);
        return NextResponse.json({ error: "创建购物车失败" }, { status: 500 });
      }
      
      cart = newCart;
    }
    
    // 检查商品是否已在购物车中
    const { data: existingItem, error: itemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();
    
    if (itemError && itemError.code !== 'PGRST116') {
      console.error('检查购物车商品失败:', itemError);
      return NextResponse.json({ error: "检查购物车商品失败" }, { status: 500 });
    }
    
    let result;
    
    // 如果商品已在购物车中，更新数量
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      // 确保不超过库存
      const finalQuantity = Math.min(newQuantity, product.stock);
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: finalQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('更新购物车商品失败:', updateError);
        return NextResponse.json({ error: "更新购物车商品失败" }, { status: 500 });
      }
      
      result = {
        ...updatedItem,
        updated: true,
        message: "商品数量已更新"
      };
    } 
    // 否则，添加新商品到购物车
    else {
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cart.id,
          product_id: productId,
          quantity: quantity,
          selected: true // 默认选中
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error('添加购物车商品失败:', insertError);
        return NextResponse.json({ error: "添加购物车商品失败" }, { status: 500 });
      }
      
      result = {
        ...newItem,
        added: true,
        message: "商品已添加到购物车"
      };
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('添加商品到购物车异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}
