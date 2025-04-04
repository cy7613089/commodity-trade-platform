import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const timings: Record<string, number> = {};
  const errors: Record<string, string> = {};
  
  // 记录开始时间
  const startTime = Date.now();
  
  try {
    // 确保环境变量存在
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: '环境变量未设置' 
      }, { status: 500 });
    }
    
    // 记录环境变量获取时间
    timings.envVars = Date.now() - startTime;
    
    // 创建Supabase客户端
    const clientStartTime = Date.now();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    timings.clientCreation = Date.now() - clientStartTime;
    
    // 测试1: 连接测试
    const connectStartTime = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      timings.connectionTest = Date.now() - connectStartTime;
      
      if (error) {
        errors.connectionTest = error.message;
      }
    } catch (err) {
      timings.connectionTest = Date.now() - connectStartTime;
      errors.connectionTest = err instanceof Error ? err.message : '未知错误';
    }
    
    // 测试2: 简单查询
    const queryStartTime = Date.now();
    try {
      const { error } = await supabase.from('users').select('count(*)', { count: 'exact' }).limit(0);
      timings.simpleQuery = Date.now() - queryStartTime;
      
      if (error) {
        errors.simpleQuery = error.message;
      }
    } catch (err) {
      timings.simpleQuery = Date.now() - queryStartTime;
      errors.simpleQuery = err instanceof Error ? err.message : '未知错误';
    }
    
    // 测试3: 稍复杂查询
    const complexQueryStartTime = Date.now();
    try {
      const { error } = await supabase.from('users').select('id, email, created_at').limit(5);
      timings.complexQuery = Date.now() - complexQueryStartTime;
      
      if (error) {
        errors.complexQuery = error.message;
      }
    } catch (err) {
      timings.complexQuery = Date.now() - complexQueryStartTime;
      errors.complexQuery = err instanceof Error ? err.message : '未知错误';
    }
    
    // 返回计时结果
    return NextResponse.json({
      success: true,
      totalTime: Date.now() - startTime,
      timings,
      errors: Object.keys(errors).length > 0 ? errors : null,
      message: '性能测试完成'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      totalTime: Date.now() - startTime,
      timings
    }, { status: 500 });
  }
} 