import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 登出用户
    await supabase.auth.signOut();
    
    return NextResponse.json({ message: '已成功登出' }, { status: 200 });
  } catch (error) {
    console.error('登出错误:', error);
    return NextResponse.json(
      { error: '登出过程中发生错误' },
      { status: 500 }
    );
  }
} 