import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 获取用户资料
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
    
    // 获取用户详细资料
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return NextResponse.json(
        { error: '获取用户资料失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    return NextResponse.json(
      { error: '获取用户资料过程中发生错误' },
      { status: 500 }
    );
  }
}

// 更新用户资料
export async function PATCH(request: NextRequest) {
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
    
    // 获取要更新的数据
    const updates = await request.json();
    
    // 只允许更新特定字段
    const allowedFields = ['name', 'phone', 'avatar'];
    const sanitizedUpdates: Record<string, string | null> = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });
    
    // 检查是否有数据需要更新
    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { error: '没有提供有效的更新数据' },
        { status: 400 }
      );
    }
    
    // 更新用户资料
    const { data, error } = await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '更新用户资料失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    return NextResponse.json(
      { error: '更新用户资料过程中发生错误' },
      { status: 500 }
    );
  }
} 