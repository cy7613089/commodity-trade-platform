import { createClient } from '@supabase/supabase-js';
import { type Database } from '@/types/supabase';

// 创建带超时的fetch函数 - 使用 AbortSignal.timeout 简化实现
const fetchWithTimeout = (timeout = 8000) => {
  return async (url: string, options: RequestInit = {}) => {
    try {
      const controller = new AbortController();
      options.signal = controller.signal;
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(timeout)
        });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error(`Supabase 请求错误 (${timeout}ms):`, error);
      throw error;
    }
  };
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
      persistSession: true,
      storageKey: 'supabase-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: fetchWithTimeout()
    },
    db: {
      schema: 'public'
    }
  }
);

// 创建管理员Supabase客户端
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('警告: SUPABASE_SERVICE_ROLE_KEY环境变量未设置');
  }
  
  return createClient<Database>(
    SUPABASE_URL || '',
    serviceRoleKey || '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        fetch: fetchWithTimeout()
      }
    }
  );
} 