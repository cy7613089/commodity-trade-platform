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
                         
    // 检查是否为管理员路由
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    
    // 如果是受保护的路由且用户未登录，重定向到登录页面
    if (isAuthRoute && !session) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // 如果是管理员路由，需要验证用户是否为管理员
    if (isAdminRoute) {
      // 如果用户未登录，重定向到登录页面
      if (!session) {
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // 获取用户角色
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      // 如果不是管理员，重定向到首页
      if (error || !data || data.role !== 'admin') {
        return NextResponse.redirect(new URL('/products', req.url));
      }
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