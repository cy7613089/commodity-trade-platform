import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// 创建带超时的fetch函数
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 20000) => {
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

// 记录Supabase环境变量状态
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('警告: Supabase环境变量未设置', {
    url: SUPABASE_URL ? '已设置' : '未设置',
    anonKey: SUPABASE_ANON_KEY ? '已设置' : '未设置'
  });
}

// 创建默认Supabase客户端
export const supabase = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      fetch: fetchWithTimeout as unknown as typeof fetch
    }
  }
);

// 创建管理员Supabase客户端
export function createAdminClient<T = Database>() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('警告: SUPABASE_SERVICE_ROLE_KEY环境变量未设置');
  }
  
  return createClient<T>(
    SUPABASE_URL || '',
    serviceRoleKey || '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        fetch: fetchWithTimeout as unknown as typeof fetch
      }
    }
  );
} 