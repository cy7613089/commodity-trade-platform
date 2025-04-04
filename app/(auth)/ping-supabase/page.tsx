'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function PingSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('检查Supabase连接中...');
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClientComponentClient();
        setMessage('正在连接Supabase...');
        
        // 尝试获取会话，这是一个基本操作，可以验证连接
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // 尝试查询users表
        setMessage('正在查询users表...');
        const { error: queryError } = await supabase.from('users').select('id').limit(1);
        
        if (queryError) {
          setStatus('error');
          setMessage('连接成功但查询失败');
          setDetails(`查询错误: ${queryError.message}`);
          return;
        }
        
        setStatus('success');
        setMessage('连接成功 ✅');
        setDetails('Supabase服务正常运行，API访问正常');
      } catch (error) {
        setStatus('error');
        setMessage('连接失败');
        
        if (error instanceof Error) {
          setDetails(`错误: ${error.message}`);
        } else {
          setDetails('发生未知错误');
        }
      }
    }
    
    checkConnection();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Supabase连接测试</h1>
          <div className="mt-4">
            {status === 'loading' && (
              <div className="flex justify-center items-center">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {status === 'success' && (
              <div className="bg-green-100 text-green-800 p-4 rounded-md">
                <p className="text-lg font-medium">✅ {message}</p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-100 text-red-800 p-4 rounded-md">
                <p className="text-lg font-medium">❌ {message}</p>
              </div>
            )}
            
            {details && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm overflow-auto max-h-40">
                <pre>{details}</pre>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Supabase配置信息</h2>
            <div className="mt-2 text-left">
              <p>
                <span className="font-medium">URL: </span>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置 ✅' : '未设置 ❌'}
              </p>
              <p>
                <span className="font-medium">匿名密钥: </span>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置 ✅' : '未设置 ❌'}
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-gray-500 text-sm">
              如果连接测试失败，请检查：<br />
              1. Supabase项目是否在线<br />
              2. 环境变量是否正确配置<br />
              3. 网络连接是否正常<br />
              4. 浏览器控制台是否有其他错误
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 