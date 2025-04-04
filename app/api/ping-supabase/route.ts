import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/db';
import { NextResponse } from 'next/server';

// 创建超时控制的fetch函数
const fetchWithTimeout = (url: string, options: any, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const fetchPromise = fetch(url, {
    ...options,
    signal: controller.signal
  });
  
  return Promise.race([
    fetchPromise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`请求超时 (${timeout}ms)`)), timeout)
    )
  ]).finally(() => clearTimeout(id));
};

export async function GET() {
  try {
    const checkResults = {
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? true : false,
        anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? true : false,
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? true : false
      },
      connection: {
        status: false,
        error: null
      },
      queries: {
        users_table: {
          status: false,
          error: null
        }
      }
    };
    
    // 检查环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        success: false, 
        message: '环境变量未正确配置',
        details: '缺少必要的Supabase环境变量',
        checkResults 
      });
    }
    
    // 创建带超时的客户端
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // 创建带超时的supabase客户端
    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: fetchWithTimeout as any
      }
    });
    
    // 测试连接
    const { error: connectionError } = await supabase.auth.getSession();
    
    if (connectionError) {
      checkResults.connection.error = connectionError.message;
      return NextResponse.json({
        success: false,
        message: 'Supabase连接失败',
        details: connectionError.message,
        checkResults
      });
    }
    
    checkResults.connection.status = true;
    
    // 测试查询users表
    try {
      const { error: queryError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (queryError) {
        checkResults.queries.users_table.error = queryError.message;
      } else {
        checkResults.queries.users_table.status = true;
      }
    } catch (queryError: any) {
      checkResults.queries.users_table.error = queryError.message || '查询users表时出错';
    }
    
    // 检查admin客户端
    let adminClientWorks = false;
    let adminClientError = null;
    
    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient.from('users').select('id').limit(1);
      
      if (!error) {
        adminClientWorks = true;
      } else {
        adminClientError = error.message;
      }
    } catch (error: any) {
      adminClientError = error.message || '创建或使用admin客户端时出错';
    }
    
    return NextResponse.json({
      success: true,
      message: '连接检查完成',
      details: checkResults.queries.users_table.status 
        ? '所有连接正常' 
        : '基础连接正常，但查询users表失败',
      checkResults: {
        ...checkResults,
        admin_client: {
          status: adminClientWorks,
          error: adminClientError
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '检查过程中发生错误',
      details: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
} 