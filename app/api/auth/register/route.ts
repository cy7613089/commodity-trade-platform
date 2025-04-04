import { NextRequest, NextResponse } from 'next/server';
import { supabase, createAdminClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// 通用的重试函数，可用于任何操作
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 如果不是第一次尝试，增加等待时间
      if (attempt > 0) {
        const delay = initialDelay * Math.pow(2, attempt); // 指数退避
        console.log(`重试操作，尝试第 ${attempt + 1}/${maxRetries} 次，等待 ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`操作失败 (尝试 ${attempt + 1}/${maxRetries})`, lastError);
    }
  }
  
  throw lastError || new Error('操作失败，达到最大重试次数');
}

export async function POST(request: NextRequest) {
  console.log('[注册API] 开始注册流程');
  
  try {
    // 解析请求数据
    const data = await request.json();
    const { email, password, name, phone } = data;
    
    // 验证基本字段
    if (!email || !password) {
      return NextResponse.json({ 
        error: '必须提供邮箱和密码' 
      }, { status: 400 });
    }
    
    console.log(`[注册API] 验证注册数据: ${email}`);
    
    // 第0步：检查Supabase连接
    try {
      const { error: connectionError } = await supabase.auth.getSession();
      if (connectionError) {
        console.error('[注册API] Supabase连接错误:', connectionError);
        return NextResponse.json({ 
          error: 'Supabase连接错误',
          details: connectionError.message
        }, { status: 500 });
      }
    } catch (connectionError) {
      console.error('[注册API] Supabase连接检查失败:', connectionError);
      return NextResponse.json({ 
        error: 'Supabase连接检查失败',
        details: connectionError instanceof Error ? connectionError.message : '未知错误'
      }, { status: 500 });
    }
    
    // 第1步：检查邮箱是否已存在
    console.log(`[注册API] 步骤1: 检查邮箱 ${email} 是否已存在`);
    let userExists = false;
    
    try {
      // 使用重试机制检查用户是否存在
      const checkUserResult = await retryOperation(async () => {
        const { data: existingUsers, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        
        if (error) {
          throw new Error(`检查用户是否存在时出错: ${error.message}`);
        }
        
        return !!existingUsers;
      });
      
      userExists = checkUserResult;
    } catch (error) {
      console.error('[注册API] 步骤1错误:', error);
      return NextResponse.json({ 
        error: '检查用户是否存在时出错',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }
    
    if (userExists) {
      console.log(`[注册API] 用户 ${email} 已存在，拒绝注册`);
      return NextResponse.json({ 
        error: '该邮箱已注册' 
      }, { status: 409 });
    }
    
    // 第2步：创建用户记录 (不使用触发器，直接插入)
    console.log('[注册API] 步骤2: 创建用户记录');
    const userId = uuidv4();
    let userRecord = null;
    
    try {
      // 使用管理员权限创建用户记录
      const adminClient = createAdminClient();
      
      // 使用重试机制创建用户记录
      userRecord = await retryOperation(async () => {
        const { data, error } = await adminClient
          .from('users')
          .insert({
            id: userId,
            email,
            name: name || email.split('@')[0],
            phone: phone || null,
            role: 'customer',
            email_verified: true,
            auth_provider: 'email'
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`创建用户记录时出错: ${error.message}`);
        }
        
        return data;
      });
      
      console.log(`[注册API] 用户记录创建成功, ID: ${userId}`);
    } catch (error) {
      console.error('[注册API] 步骤2错误:', error);
      return NextResponse.json({ 
        error: '创建用户记录时出错',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }
    
    // 第3步：创建认证用户
    console.log('[注册API] 步骤3: 创建认证用户');
    let authUser = null;
    
    try {
      // 使用重试机制创建认证用户
      const signUpResult = await retryOperation(async () => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          }
        });
        
        if (error) {
          throw new Error(`创建认证用户时出错: ${error.message}`);
        }
        
        return data;
      });
      
      authUser = signUpResult.user;
      console.log(`[注册API] 认证用户创建成功, Auth ID: ${authUser?.id}`);
    } catch (error) {
      console.error('[注册API] 步骤3错误:', error);
      
      // 如果创建认证用户失败，回滚用户记录
      if (userRecord) {
        try {
          console.log('[注册API] 回滚用户记录...');
          const adminClient = createAdminClient();
          await adminClient.from('users').delete().eq('id', userId);
        } catch (rollbackError) {
          console.error('[注册API] 回滚用户记录失败:', rollbackError);
        }
      }
      
      return NextResponse.json({ 
        error: '创建认证用户时出错',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 });
    }
    
    // 注册完成
    console.log('[注册API] 注册流程完成');
    return NextResponse.json({ 
      success: true, 
      message: '注册成功，请登录', 
      profile: {
        id: userId,
        email,
        name: name || email.split('@')[0],
        authId: authUser?.id
      }
    });
  } catch (error) {
    console.error('[注册API] 未处理的错误:', error);
    return NextResponse.json({ 
      error: '注册过程中发生错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 