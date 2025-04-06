import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';

// GET handler to fetch user profile
export async function GET() {
  try {
    // 获取当前认证会话
    const cookieStore = await cookies();
    
    // 使用 createRouteHandlerClient 获取会话
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // 获取用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('获取会话错误:', sessionError);
      return NextResponse.json({ error: "获取会话失败" }, { status: 500 });
    }
    
    if (!session) {
      console.log('用户未认证');
      return NextResponse.json({ error: "未认证" }, { status: 401 });
    }
    
    const authUserId = session.user.id;
    const userEmail = session.user.email;
    
    console.log('当前认证用户ID:', authUserId);
    console.log('当前认证用户邮箱:', userEmail);
    
    if (!userEmail) {
      console.error('用户没有邮箱，无法查询用户记录');
      return NextResponse.json({ error: "用户没有邮箱信息" }, { status: 400 });
    }
    
    // 创建管理员客户端（使用service_role密钥，可以绕过RLS限制）
    const adminClient = createAdminClient();
    
    // 优先通过邮箱查询用户资料，因为邮箱在两个表中应该是相同的
    const { data: profileByEmail, error: emailError } = await adminClient
      .from('users')
      .select('id, email, name, phone, avatar, created_at')
      .eq('email', userEmail)
      .maybeSingle();
      
    console.log('通过邮箱查询结果:', profileByEmail);
    
    if (emailError) {
      console.error('通过邮箱查询失败:', emailError);
    }
    
    // 如果通过邮箱找到了用户
    if (profileByEmail) {
      console.log('通过邮箱找到用户资料');
      
      // 如果用户在public.users表中的ID与auth.users不同，更新ID
      if (profileByEmail.id !== authUserId) {
        console.log('用户ID不匹配，尝试更新用户ID');
        console.log('当前public.users表中ID:', profileByEmail.id);
        console.log('auth.users中ID:', authUserId);
        
        // 尝试更新用户ID - 使用管理员客户端
        const { data: updatedUser, error: updateError } = await adminClient
          .from('users')
          .update({ id: authUserId })
          .eq('id', profileByEmail.id)
          .select('id, email, name, phone, avatar, created_at')
          .single();
          
        if (updateError) {
          console.error('更新用户ID失败:', updateError);
          // 即使更新失败，仍返回找到的用户资料
          return NextResponse.json(profileByEmail);
        }
        
        console.log('用户ID更新成功');
        return NextResponse.json(updatedUser);
      }
      
      return NextResponse.json(profileByEmail);
    }
    
    // 如果通过邮箱没找到，尝试通过ID查询
    console.log('通过邮箱未找到用户，尝试通过ID查询');
    const { data: profileById } = await adminClient
      .from('users')
      .select('id, email, name, phone, avatar, created_at')
      .eq('id', authUserId)
      .maybeSingle();
      
    if (profileById) {
      console.log('通过ID找到用户资料');
      return NextResponse.json(profileById);
    }
    
    // 两种方式都没找到，创建新用户记录
    console.log('用户在数据库中不存在，创建新用户记录');
    
    try {
      // 创建新用户记录 - 使用管理员客户端
      const { data: insertResult, error: insertError } = await adminClient
        .from('users')
        .insert({
          id: authUserId,
          email: userEmail,
          name: userEmail.split('@')[0], // 使用邮箱前缀作为默认名称
          role: 'customer', // 默认角色
          email_verified: session.user.email_confirmed_at ? true : false,
          auth_provider: session.user.app_metadata?.provider || 'email',
          created_at: new Date().toISOString()
        })
        .select('id, email, name, phone, avatar, created_at')
        .single();
      
      if (insertError) {
        console.error('创建用户记录失败:', insertError);
        
        // 如果是主键或唯一约束错误，可能是同时创建导致的冲突
        if (insertError.code === '23505') {
          console.log('创建时发生冲突，可能已被创建，再次查询');
          
          // 再次尝试查询 - 使用管理员客户端
          const { data: retryProfile, error: retryError } = await adminClient
            .from('users')
            .select('id, email, name, phone, avatar, created_at')
            .eq('email', userEmail)
            .maybeSingle();
            
          if (!retryError && retryProfile) {
            console.log('重试查询成功:', retryProfile);
            return NextResponse.json(retryProfile);
          }
          
          console.error('重试查询失败:', retryError);
          return NextResponse.json({ 
            error: "创建后无法查询用户资料", 
            details: retryError 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          error: "创建用户记录失败", 
          details: insertError 
        }, { status: 500 });
      }
      
      console.log('成功创建用户记录:', insertResult);
      return NextResponse.json(insertResult);
    } catch (insertCatchError) {
      console.error('创建用户记录异常:', insertCatchError);
      return NextResponse.json({ 
        error: "创建用户时发生异常", 
        details: String(insertCatchError) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('获取用户资料异常:', error);
    return NextResponse.json({ 
      error: "服务器错误", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// PUT handler to update user profile
export async function PUT(request: NextRequest) {
  try {
    // 获取当前认证会话
    const cookieStore = await cookies();
    
    // 使用 createRouteHandlerClient 获取会话
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // 获取用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('获取会话错误:', sessionError);
      return NextResponse.json({ error: "获取会话失败" }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ error: "未认证" }, { status: 401 });
    }
    
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: "用户没有邮箱信息" }, { status: 400 });
    }
    
    // 创建管理员客户端
    const adminClient = createAdminClient();
    
    // 首先确认用户在数据库中存在，优先使用邮箱查询
    const { data: existingUser, error: queryError } = await adminClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
      
    if (queryError) {
      console.error('查询用户是否存在失败:', queryError);
      return NextResponse.json({ error: "查询用户失败", details: queryError }, { status: 500 });
    }
    
    // 如果用户不存在，返回错误
    if (!existingUser) {
      console.error('尝试更新不存在的用户资料');
      return NextResponse.json({ error: "用户资料不存在，请先访问个人中心" }, { status: 404 });
    }
    
    // 解析请求数据
    const data = await request.json();
    
    // 只允许更新特定字段
    const allowedUpdates = {
      name: data.name,
      phone: data.phone,
      avatar: data.avatar
    };
    
    // 过滤掉未定义的字段
    const finalUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([, value]) => value !== undefined)
    );
    
    if (Object.keys(finalUpdates).length === 0) {
      return NextResponse.json({ error: "没有提供任何要更新的字段" }, { status: 400 });
    }
    
    // 更新用户资料，使用email确保更新正确的记录 - 使用管理员客户端
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('users')
      .update(finalUpdates)
      .eq('email', userEmail)
      .select('id, email, name, phone, avatar, created_at')
      .single();
    
    if (updateError) {
      console.error('更新用户资料错误:', updateError);
      return NextResponse.json({ error: "更新用户资料失败", details: updateError }, { status: 500 });
    }
    
    if (!updatedProfile) {
      return NextResponse.json({ error: "无法获取更新后的用户资料" }, { status: 500 });
    }
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('更新用户资料异常:', error);
    return NextResponse.json({ 
      error: "服务器错误", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 