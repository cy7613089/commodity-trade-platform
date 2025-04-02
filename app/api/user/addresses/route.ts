import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 获取用户所有地址
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    // 获取用户地址
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: '获取地址失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error('获取地址错误:', error);
    return NextResponse.json(
      { error: '获取地址过程中发生错误' },
      { status: 500 }
    );
  }
}

// 添加新地址
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    // 获取请求体
    const addressData = await request.json();
    
    // 必填字段验证
    const requiredFields = ['recipient_name', 'phone', 'province', 'city', 'street', 'address'];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return NextResponse.json(
          { error: `${field} 是必填项` },
          { status: 400 }
        );
      }
    }
    
    // 如果设置为默认地址，先将其他地址设为非默认
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }
    
    // 添加地址
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...addressData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '添加地址失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ address: data }, { status: 201 });
  } catch (error) {
    console.error('添加地址错误:', error);
    return NextResponse.json(
      { error: '添加地址过程中发生错误' },
      { status: 500 }
    );
  }
} 