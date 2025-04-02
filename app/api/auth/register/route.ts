import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createAdminClient } from '@/lib/db';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体内容
    const { email, password, name, phone } = await request.json();

    // 参数验证
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必填项' },
        { status: 400 }
      );
    }

    // 创建非管理员客户端以处理认证
    const supabase = createRouteHandlerClient({ cookies });
    
    // 使用Supabase Auth创建用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (authError) {
      console.error('Auth Error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // 如果Auth创建成功，同步创建用户到users表
    if (authData.user) {
      // 使用admin客户端以便具有直接操作数据库的权限
      const adminClient = createAdminClient();
      
      // 检查users表中是否已存在该用户
      const { data: existingUser } = await adminClient
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      // 如果users表中不存在该用户，则创建
      if (!existingUser) {
        const { error: dbError } = await adminClient
          .from('users')
          .insert({
            id: authData.user.id, // 使用auth用户的UUID作为ID
            email: authData.user.email,
            name: name || authData.user.email?.split('@')[0], // 如果没有提供名字，使用邮箱前缀
            phone: phone || null,
            role: 'customer', // 默认角色
            email_verified: false, // 初始未验证
            auth_provider: 'email', // 默认提供商
          });

        if (dbError) {
          console.error('Database Error:', dbError);
          // 注意：我们不返回错误，因为Auth用户已创建成功
          // 但我们记录错误以便后续处理
        }
      }
    }

    return NextResponse.json(
      { 
        message: '注册成功，请检查您的电子邮件进行确认',
        user: authData.user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected Error:', error);
    return NextResponse.json(
      { error: '注册过程中发生错误' },
      { status: 500 }
    );
  }
} 