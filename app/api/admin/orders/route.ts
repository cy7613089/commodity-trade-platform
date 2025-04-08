import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// 创建管理员权限的Supabase客户端(使用服务角色密钥绕过RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    throw new Error('Server configuration error');
  }
  
  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey
  );
}

// 获取用户角色
async function getUserRole(userId: string): Promise<string | null> {
  // 使用管理员客户端查询用户角色
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      console.error(`Error fetching role for user ${userId}:`, error);
      return null;
    }
    
    return data.role;
  } catch (error) {
    console.error(`Error in getUserRole for user ${userId}:`, error);
    return null;
  }
}

/**
 * GET /api/admin/orders - 管理员获取订单列表
 * 支持按 status 过滤, 分页 (page, limit)
 * 仅管理员可访问
 */
export async function GET(request: Request) {
  // 创建普通客户端用于认证
  const supabase = createServerComponentClient<Database>({ cookies });
  // 创建管理员客户端用于数据查询
  const adminSupabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  // 分页参数
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;

  // 过滤参数
  const statusFilter = searchParams.get('status');

  try {
    // 验证用户会话和权限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const userRole = await getUserRole(userId);
    
    // 检查是否为管理员
    if (userRole !== 'admin') {
      return NextResponse.json({ error: '没有权限访问' }, { status: 403 });
    }

    // 查询订单数据
    let query = adminSupabase.from('orders').select(`
      id,
      order_number,
      user_id,
      total_amount,
      discount_amount,
      final_amount,
      shipping_fee,
      status,
      payment_method,
      payment_status,
      created_at,
      order_items (
        id,
        product_id,
        product_name,
        product_image,
        quantity,
        price
      )
    `, { count: 'exact' });
    
    // 应用过滤条件
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // 排序和分页
    query = query.order('created_at', { ascending: false }).range(startIndex, endIndex);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('管理员获取订单列表错误:', error);
      return NextResponse.json({ error: '获取订单列表失败' }, { status: 500 });
    }

    // 提取有效的用户ID
    const userIds: string[] = [];
    orders?.forEach(order => {
      if (order.user_id) {
        userIds.push(order.user_id);
      }
    });

    // 如果有用户ID，获取用户信息
    const usersData: Record<string, { id: string, email: string, name: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await adminSupabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds);
        
      if (usersError) {
        console.error('获取用户信息失败:', usersError);
      } else if (users) {
        // 创建用户ID到用户数据的映射
        users.forEach(user => {
          usersData[user.id] = user;
        });
      }
    }
    
    // 将用户数据添加到订单
    const ordersWithUserInfo = orders?.map(order => {
      return {
        ...order,
        users: order.user_id ? usersData[order.user_id] || null : null
      };
    });

    // 计算分页信息
    const totalPages = Math.ceil((count ?? 0) / limit);

    return NextResponse.json({
      data: ordersWithUserInfo,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: count ?? 0,
        totalPages: totalPages,
      }
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
} 