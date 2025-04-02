import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 刷新会话以确保最新的auth状态
  await supabase.auth.getSession();
  
  return res;
}

// 指定中间件应用于的路由
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/auth).*)',
  ],
}; 