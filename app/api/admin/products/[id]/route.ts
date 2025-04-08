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
 * GET /api/admin/products/[id] - 获取单个商品详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const accessCheck = await checkAdminAccess();
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }
    
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json({ error: "商品ID不能为空" }, { status: 400 });
    }
    
    // 使用管理员权限访问数据库
    const adminSupabase = createAdminClient();
    
    // 获取商品详情
    const { data: product, error } = await adminSupabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('获取商品详情失败:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "商品不存在" }, { status: 404 });
      }
      
      return NextResponse.json({ error: "获取商品详情失败" }, { status: 500 });
    }
    
    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('获取商品详情异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id] - 更新商品
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const accessCheck = await checkAdminAccess();
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }
    
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json({ error: "商品ID不能为空" }, { status: 400 });
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
    
    // 检查商品是否存在
    const { data: existingProduct, error: checkError } = await adminSupabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
    
    if (checkError || !existingProduct) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    
    // 设置更新数据
    const updateData = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      original_price: body.originalPrice,
      stock: body.stock,
      images: body.images,
      specs: body.specs,
      is_featured: body.is_featured,
      status: body.status,
      updated_at: new Date().toISOString()
    };
    
    // 执行更新
    const { data: updatedProduct, error } = await adminSupabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('*')
      .single();
    
    if (error) {
      console.error('更新商品失败:', error);
      return NextResponse.json({ error: "更新商品失败" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: "更新商品成功", 
      product: updatedProduct 
    });
  } catch (error) {
    console.error('更新商品异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id] - 删除商品
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查管理员权限
    const accessCheck = await checkAdminAccess();
    if ('error' in accessCheck) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
    }
    
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json({ error: "商品ID不能为空" }, { status: 400 });
    }
    
    // 使用管理员权限访问数据库
    const adminSupabase = createAdminClient();
    
    // 检查商品是否存在
    const { data: existingProduct, error: checkError } = await adminSupabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
    
    if (checkError || !existingProduct) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    
    // 执行删除
    const { error } = await adminSupabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error('删除商品失败:', error);
      return NextResponse.json({ error: "删除商品失败" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: "删除商品成功" 
    });
  } catch (error) {
    console.error('删除商品异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器错误" }, 
      { status: 500 }
    );
  }
} 