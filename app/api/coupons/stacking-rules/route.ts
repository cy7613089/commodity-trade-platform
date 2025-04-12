import { NextResponse } from 'next/server';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; 
import { Database } from '@/types/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  // 使用你的Supabase服务器客户端创建函数
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore }); 

  try {
    // 获取当前会话 (保留但不使用变量)
    // const { data: { session } } = await supabase.auth.getSession();
    await supabase.auth.getSession(); // 调用以确保认证状态

    const { data, error } = await supabase
      .from('coupon_stacking_rules')
      .select('id, name, rule_type, coupon_ids') // 选择必要的字段
      .eq('is_active', true);

    if (error) {
      console.error("Error fetching stacking rules:", error);
      throw error; // 抛出错误让外层 catch 处理
    }

    // 返回 JSON 数据
    return NextResponse.json(data || []);

  } catch (error) {
    console.error("API Error fetching stacking rules:", error);
    // 根据错误类型返回更具体的错误信息
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stacking rules';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 