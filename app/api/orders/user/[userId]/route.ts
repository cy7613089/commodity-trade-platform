import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// --- Helper Functions (与上面相同) ---
function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

async function getUserRole(userId: string): Promise<string | null> {
    const supabase = createClient();
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
}

// --- API Route Handlers ---

/**
 * GET /api/orders/user/[userId] - 获取特定用户的订单列表 (限管理员)
 * 支持按 status 过滤, 分页 (page, limit)
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const supabase = createClient();
  const targetUserId = params.userId;
  const { searchParams } = new URL(request.url);

  // 分页参数
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;

  // 过滤参数
  const statusFilter = searchParams.get('status');

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
  }

  try {
    // 权限检查 (需要 Admin)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = await getUserRole(session.user.id);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          final_amount,
          status,
          payment_status,
          created_at,
          users ( id, email, name ),
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            price
          )
        `, { count: 'exact' }) // 获取总数
        .eq('user_id', targetUserId); // 明确指定查询的用户

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // 排序和分页
    query = query.order('created_at', { ascending: false }).range(startIndex, endIndex);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error(`Fetch user orders error for user ${targetUserId}:`, error);
      return NextResponse.json({ error: 'Failed to fetch orders for the specified user' }, { status: 500 });
    }

     // 计算分页信息
    const totalPages = Math.ceil((count ?? 0) / limit);


    return NextResponse.json({
        data: orders,
        pagination: {
            currentPage: page,
            pageSize: limit,
            totalItems: count ?? 0,
            totalPages: totalPages,
        }
    });

  } catch (error) {
    console.error(`Unexpected error fetching orders for user ${targetUserId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 