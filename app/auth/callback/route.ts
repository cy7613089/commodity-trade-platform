import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    
    // 获取用户信息
    const { data: { user } } = await supabase.auth.getUser();
    
    // 如果有用户，更新用户的邮箱验证状态
    if (user) {
      const { error } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating user verification status:', error);
      }
    }
  }

  // 重定向到登录页
  return NextResponse.redirect(new URL('/login', request.url));
} 