import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

// 获取单个地址详情
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    
    // 获取指定地址
    const { data: address, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '地址不存在或无权访问' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ address }, { status: 200 });
  } catch (error) {
    console.error('获取地址详情错误:', error);
    return NextResponse.json(
      { error: '获取地址详情过程中发生错误' },
      { status: 500 }
    );
  }
}

// 更新地址
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    
    // 获取更新数据
    const updates = await request.json();
    
    // 验证地址是否属于当前用户
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !existingAddress) {
      return NextResponse.json(
        { error: '地址不存在或无权修改' },
        { status: 404 }
      );
    }
    
    // 如果设置为默认地址，先将其他地址设为非默认
    if (updates.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }
    
    // 更新地址
    const { data, error } = await supabase
      .from('addresses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '更新地址失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ address: data }, { status: 200 });
  } catch (error) {
    console.error('更新地址错误:', error);
    return NextResponse.json(
      { error: '更新地址过程中发生错误' },
      { status: 500 }
    );
  }
}

// 删除地址
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    
    // 验证地址是否属于当前用户
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !existingAddress) {
      return NextResponse.json(
        { error: '地址不存在或无权删除' },
        { status: 404 }
      );
    }
    
    // 删除地址
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json(
        { error: '删除地址失败' },
        { status: 500 }
      );
    }
    
    // 如果删除的是默认地址，将最新的地址设为默认
    if (existingAddress.is_default) {
      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (addresses && addresses.length > 0) {
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', addresses[0].id);
      }
    }
    
    return NextResponse.json({ message: '地址已成功删除' }, { status: 200 });
  } catch (error) {
    console.error('删除地址错误:', error);
    return NextResponse.json(
      { error: '删除地址过程中发生错误' },
      { status: 500 }
    );
  }
} 