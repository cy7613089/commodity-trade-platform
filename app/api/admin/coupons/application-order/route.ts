import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 定义应用顺序类型接口
interface CouponApplicationOrderItem {
  type: string;
  order: number;
  id?: string;
}

// 获取优惠券应用顺序设置
export async function GET() {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 验证用户身份和权限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 验证用户是否为管理员
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: '没有权限访问应用顺序设置' }, { status: 403 });
    }
    
    // 尝试获取现有的应用顺序设置
    const { data, error } = await supabase
      .from('coupon_application_order')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    // Log the database query result
    console.log('[API GET] Supabase query data:', data);
    console.error('[API GET] Supabase query error:', error);
    
    if (error) {
      console.error('Error fetching application order:', error);
      return NextResponse.json({ error: '获取应用顺序设置失败' }, { status: 500 });
    }
    
    // 如果没有设置，返回默认空数组
    if (!data) {
      // 返回空数组，因为现在前端有添加功能
      return NextResponse.json({ applicationOrder: [] });
    }
    
    // 如果有新的order_config字段，返回解析后的应用顺序
    if (data.order_config) {
      let orderConfig: CouponApplicationOrderItem[] = []; // 初始化为空数组
      
      // Log the raw order_config value
      console.log('[API GET] Raw data.order_config:', data.order_config);
      
      try {
        let rawConfig = data.order_config;
        // 如果是字符串，先解析
        if (typeof rawConfig === 'string') {
          rawConfig = JSON.parse(rawConfig);
        }

        // 校验解析后的数据是否为数组，且元素包含 id, type
        if (Array.isArray(rawConfig) && 
            rawConfig.length > 0 && 
            rawConfig[0] !== null && // 确保第一个元素不是null
            typeof rawConfig[0] === 'object' && // 确保第一个元素是对象
            'id' in rawConfig[0] && 
            'type' in rawConfig[0]) 
        {
          orderConfig = rawConfig as unknown as CouponApplicationOrderItem[]; // 使用 as unknown 修复类型转换
        } else if (Array.isArray(rawConfig) && rawConfig.length === 0) {
          // 如果是空数组，也接受
          orderConfig = [];
        } else {
           console.warn('[API GET] Invalid order_config structure:', rawConfig);
        }

      } catch (parseError) {
        console.error('[API GET] Error parsing or validating order_config:', parseError);
        // 解析或校验失败，返回空数组
        return NextResponse.json({ applicationOrder: [] });
      }
      
      // 返回 orderConfig
      return NextResponse.json({ applicationOrder: orderConfig });
    }
    
    // 如果使用旧的coupon_ids字段，返回空数组（或根据需要处理旧数据迁移）
    return NextResponse.json({ applicationOrder: [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新优惠券应用顺序设置
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // 验证用户身份和权限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 验证用户是否为管理员
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: '没有权限修改应用顺序设置' }, { status: 403 });
    }
    
    // 解析请求体
    const body = await request.json();
    const { applicationOrder } = body;
    
    if (!applicationOrder || !Array.isArray(applicationOrder) || applicationOrder.length === 0) {
      return NextResponse.json({ error: '应用顺序不能为空' }, { status: 400 });
    }
    
    // 验证数据格式
    const validTypes = ['product', 'time', 'amount']; // 使用内部标识符验证
    for (const item of applicationOrder) {
      // 前端发送的结构是 { id, name, type }，order 由数组索引决定
      if (!item.id || typeof item.id !== 'string') {
        return NextResponse.json({ error: `无效的优惠券 ID: ${item.id}` }, { status: 400 });
      }
      if (!item.type || !validTypes.includes(item.type)) {
        return NextResponse.json({ error: `无效的优惠券类型: ${item.type}` }, { status: 400 });
      }
      // 移除 order 校验，因为它不直接在数组元素中
      // if (typeof item.order !== 'number' || item.order < 1) {
      //   return NextResponse.json({ error: '顺序值必须是大于0的数字' }, { status: 400 });
      // }
    }
    
    // 删除现有配置
    const { error: deleteError } = await supabase
      .from('coupon_application_order')
      .delete()
      .not('id', 'is', null); // 使用对 UUID 有效的条件删除所有行
    
    if (deleteError) {
      console.error('Error deleting existing application order:', deleteError);
      return NextResponse.json({ error: '重置应用顺序失败' }, { status: 500 });
    }
    
    // 插入新的配置
    await supabase
      .from('coupon_application_order')
      .insert({
        // 直接存储前端发送的包含 { id, name, type } 的数组
        order_config: applicationOrder, 
        is_active: true,
        updated_at: new Date().toISOString()
      });
    
    return NextResponse.json({ 
      applicationOrder, 
      message: '应用顺序已更新' 
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 