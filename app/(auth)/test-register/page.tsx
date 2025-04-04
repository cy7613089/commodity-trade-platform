'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<unknown>(null); // Keep for general debugging
  
  const [supabaseStatus, setSupabaseStatus] = useState<'未检查' | '检查中' | '连接成功' | '连接失败'>('未检查');
  const [supabaseDetails, setSupabaseDetails] = useState<string | null>(null);
  const [timingResults, setTimingResults] = useState<Record<string, number> | null>(null);
  
  // 检查Supabase连接
  const checkSupabaseConnection = async () => {
    setSupabaseStatus('检查中');
    setSupabaseDetails(null);
    setError(null);
    setDebugInfo(null); // Clear debug info when testing connection
    
    try {
      const response = await fetch('/api/ping-supabase');
      const result = await response.json();
      
      setDebugInfo(result); // Show connection test results
      
      if (result.success) {
        setSupabaseStatus('连接成功');
        setSupabaseDetails(`${result.message}: ${result.details}`);
      } else {
        setSupabaseStatus('连接失败');
        setSupabaseDetails(`错误: ${result.message} - ${result.details || '未知错误'}`);
      }
    } catch (err) {
      setSupabaseStatus('连接失败');
      setSupabaseDetails(`请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setDebugInfo({ error: err instanceof Error ? err.message : '未知错误' });
    }
  };
  
  // 测试Supabase性能
  const testSupabasePerformance = async () => {
    setSupabaseStatus('检查中');
    setSupabaseDetails('正在进行性能测试...');
    setTimingResults(null);
    setError(null);
    setDebugInfo(null);
    
    try {
      const response = await fetch('/api/supabase-timing-test');
      const result = await response.json();
      
      setDebugInfo(result); // Show performance results
      
      if (result.success) {
        setSupabaseStatus('连接成功');
        setSupabaseDetails(`性能测试完成，总耗时: ${result.totalTime}ms`);
        setTimingResults(result.timings);
      } else {
        setSupabaseStatus('连接失败');
        setSupabaseDetails(`性能测试失败: ${result.error || '未知错误'}`);
      }
    } catch (err) {
      setSupabaseStatus('连接失败');
      setSupabaseDetails(`性能测试请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
      setDebugInfo({ error: err instanceof Error ? err.message : '未知错误' });
    }
  };
  
  // 直接测试客户端连接
  const testClientConnection = async () => {
    setSupabaseStatus('检查中');
    setSupabaseDetails(null);
    setError(null);
    setDebugInfo(null);
    
    try {
      const supabase = createClientComponentClient();
      const { error: sessionError } = await supabase.auth.getSession();
      let connectionDetails = '';
      
      if (sessionError) {
        setSupabaseStatus('连接失败');
        connectionDetails = `客户端连接错误: ${sessionError.message}`;
        setSupabaseDetails(connectionDetails);
        setDebugInfo({ error: sessionError.message });
      } else {
        setSupabaseStatus('连接成功');
        connectionDetails = '客户端SDK连接成功';
        
        // 尝试一个简单查询
        const { error: queryError } = await supabase.from('users').select('id').limit(1);
        if (queryError) {
          connectionDetails += `, 但查询失败: ${queryError.message}`;
          setDebugInfo({ error: queryError.message });
        } else {
          connectionDetails += `, 查询成功`;
        }
        setSupabaseDetails(connectionDetails);
      }
    } catch (err) {
      setSupabaseStatus('连接失败');
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setSupabaseDetails(`客户端连接异常: ${errorMsg}`);
      setDebugInfo({ error: errorMsg });
    }
  };
  
  // 主要的注册测试函数 (使用 register)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone }),
      });
      
      const data = await response.json();
      setDebugInfo(data); // 显示注册结果
      
      if (response.ok) {
        setSuccess(`注册成功! 用户ID: ${data.profile?.id}. ${data.message || '请前往登录'}`);
      } else {
        setError(`注册失败: ${data.error} ${data.details ? `- ${data.details}` : ''}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(`请求异常: ${errorMsg}`);
      setDebugInfo({ error: errorMsg });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Supabase连接与注册测试</h1>
        
        {/* Supabase连接测试部分 */}
        <div className="mb-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">1. 测试Supabase连接</h2>
          
          <div className="flex flex-wrap gap-2 mb-4"> {/* 使用 flex-wrap 和 gap */} 
            <button
              onClick={checkSupabaseConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              disabled={supabaseStatus === '检查中'}
            >
              通过API测试
            </button>
            
            <button
              onClick={testClientConnection}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              disabled={supabaseStatus === '检查中'}
            >
              直接客户端测试
            </button>
            
            <button
              onClick={testSupabasePerformance}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
              disabled={supabaseStatus === '检查中'}
            >
              性能测试
            </button>
          </div>
          
          {supabaseStatus !== '未检查' && (
            <div className={`p-3 rounded ${
              supabaseStatus === '检查中' ? 'bg-yellow-100 text-yellow-800' :
              supabaseStatus === '连接成功' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              <p className="font-medium">{supabaseStatus}</p>
              {supabaseDetails && <p className="text-sm mt-1">{supabaseDetails}</p>}
            </div>
          )}
        </div>
        
        {/* 表单部分 */}
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">2. 测试注册功能</h2>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">姓名 (可选)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">电话 (可选)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
              {loading ? '处理中...' : '测试注册 (register)'}
            </button>
          </form>
        </div>
        
        {/* 结果显示区域 */}
        {(error || success) && (
          <div className={`p-4 mb-4 rounded-md ${error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            <p className="font-medium">{error || success}</p>
          </div>
        )}
        
        {/* 调试信息 */}
        {debugInfo && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">调试信息:</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-60">
              {typeof debugInfo === 'string' ? debugInfo : JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {/* 性能测试结果 */}
        {timingResults && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h3 className="text-md font-semibold">性能测试结果 (毫秒):</h3>
            <ul className="mt-2 text-sm">
              <li className="flex justify-between">
                <span>环境变量获取:</span> 
                <span className="font-mono">{timingResults.envVars}ms</span>
              </li>
              <li className="flex justify-between">
                <span>客户端创建:</span> 
                <span className="font-mono">{timingResults.clientCreation}ms</span>
              </li>
              <li className="flex justify-between">
                <span>连接测试:</span> 
                <span className="font-mono">{timingResults.connectionTest}ms</span>
              </li>
              <li className="flex justify-between">
                <span>简单查询:</span> 
                <span className="font-mono">{timingResults.simpleQuery}ms</span>
              </li>
              <li className="flex justify-between">
                <span>复杂查询:</span> 
                <span className="font-mono">{timingResults.complexQuery}ms</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 