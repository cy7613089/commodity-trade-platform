import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // 创建 Supabase 客户端
    const supabase = createMiddlewareClient({ req, res });
    
    // 获取会话状态
    const { data: { session } } = await supabase.auth.getSession();
    
    // 处理受保护路由
    const isAuthRoute = req.nextUrl.pathname.startsWith('/account') || 
                         req.nextUrl.pathname.startsWith('/orders') || 
                         req.nextUrl.pathname.startsWith('/checkout');
                         
    // 如果是受保护的路由且用户未登录，重定向到登录页面
    if (isAuthRoute && !session) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
  } catch (error) {
    console.error('中间件错误:', error);
    return res;
  }
}

// 指定中间件应用于的路由
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/auth).*)',
  ],
}; 