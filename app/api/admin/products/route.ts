import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// 创建常规客户端
function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

// 创建管理员客户端
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key for admin client');
    throw new Error('Server configuration error');
  }
  
  return createServerComponentClient<Database>(
    { cookies: () => cookies() },
    {
      supabaseUrl: supabaseUrl,
      supabaseKey: serviceRoleKey,
    }
  );
}

// 获取用户角色
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

// 检查管理员权限
async function checkAdminAccess() {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }
  
  const userId = session.user.id;
  const userRole = await getUserRole(userId);
  
  if (userRole !== 'admin') {
    return { error: "Forbidden: Admin access required", status: 403 };
  }
  
  return { userId, userRole };
}

/**
 * GET /api/admin/products - 获取所有商品
 */
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const accessCheck = await checkAdminAccess();
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : null;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    
    // 校验参数
    const validPage = isNaN(page) || page < 1 ? 1 : page;
    
    // 使用管理员权限访问数据库，避免RLS限制
    const adminSupabase = createAdminClient();
    
    // 构建查询
    let query = adminSupabase
      .from('products')
      .select('*', { count: 'exact' });
    
    // 应用筛选条件
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // 获取商品总数
    const { count } = await query;
    
    // 应用排序
    query = query.order(sortBy, { ascending: order === 'asc' });
    
    // 如果指定了limit，则应用分页
    if (limit !== null) {
      const validLimit = limit < 1 ? 10 : limit; // 如果limit小于1，默认使用10
      const offset = (validPage - 1) * validLimit;
      query = query.range(offset, offset + validLimit - 1);
    }
    
    // 执行查询
    const { data: products, error } = await query;
    
    if (error) {
      console.error('获取商品列表失败:', error);
      return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 });
    }
    
    // 返回响应，包括商品列表、分页信息和总数
    return NextResponse.json({
      products,
      pagination: limit !== null ? {
        page: validPage,
        limit: limit < 1 ? 10 : limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / (limit < 1 ? 10 : limit)) : 0
      } : {
        total: count || 0
      }
    });
  } catch (error) {
    console.error('获取商品列表异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products - 创建新商品
 */
export async function POST(request: NextRequest) {
  try {
    // 检查管理员权限
    const accessCheck = await checkAdminAccess();
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证必填字段
    const { name, price, stock } = body;
    
    if (!name || !price || stock === undefined) {
      return NextResponse.json({ 
        error: "商品名称、价格和库存为必填项" 
      }, { status: 400 });
    }
    
    // 使用管理员权限访问数据库
    const adminSupabase = createAdminClient();
    
    // 生成商品slug
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .concat('-', Math.floor(Math.random() * 1000).toString()); // 添加随机数避免冲突
    
    // 设置默认值
    console.log("创建商品 - 原始请求体:", body);
    console.log("创建商品 - 原始originalPrice值:", body.originalPrice);
    
    const productData = {
      name: body.name,
      slug,
      description: body.description,
      price: body.price,
      originalprice: body.originalPrice === 0 ? 0 : (body.originalPrice || null),
      stock: body.stock,
      images: body.images,
      specs: body.specs,
      is_featured: body.is_featured,
      status: body.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("创建商品 - 处理后数据:", productData);
    console.log("创建商品 - 处理后originalprice:", productData.originalprice);
    
    // 创建商品
    const { data: newProduct, error } = await adminSupabase
      .from('products')
      .insert(productData)
      .select('*')
      .single();
    
    if (error) {
      console.error('创建商品失败:', error);
      return NextResponse.json({ error: "创建商品失败" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: "创建商品成功", 
      product: newProduct 
    }, { status: 201 });
  } catch (error) {
    console.error('创建商品异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
} 