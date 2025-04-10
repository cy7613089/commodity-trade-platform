import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 获取全局优惠设置
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
      return NextResponse.json({ error: '没有权限访问全局优惠设置' }, { status: 403 });
    }
    
    // 获取全局优惠设置 (通常只有一条记录)
    const { data, error } = await supabase
      .from('global_coupon_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录，不算错误
      console.error('Error fetching global coupon settings:', error);
      return NextResponse.json({ error: '获取全局优惠设置失败' }, { status: 500 });
    }
    
    // 如果没有找到记录，返回默认设置
    const settings = data || {
      max_percentage_enabled: false,
      max_percentage: 50.00,
      max_amount_enabled: false,
      max_amount: 100.00
    };
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新优惠上限设置
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
      return NextResponse.json({ error: '没有权限修改全局优惠设置' }, { status: 403 });
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证数值类型和范围
    const maxPercentage = parseFloat(body.max_percentage);
    const maxAmount = parseFloat(body.max_amount);
    
    if (isNaN(maxPercentage) || maxPercentage < 0 || maxPercentage > 100) {
      return NextResponse.json({ error: '最大优惠比例必须在0到100之间' }, { status: 400 });
    }
    
    if (isNaN(maxAmount) || maxAmount < 0) {
      return NextResponse.json({ error: '最大优惠金额必须大于等于0' }, { status: 400 });
    }
    
    // 获取当前设置
    const { data: existingSettings } = await supabase
      .from('global_coupon_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    let result;
    
    if (existingSettings) {
      // 更新现有设置
      const { data, error } = await supabase
        .from('global_coupon_settings')
        .update({
          max_percentage_enabled: !!body.max_percentage_enabled,
          max_percentage: maxPercentage,
          max_amount_enabled: !!body.max_amount_enabled,
          max_amount: maxAmount
        })
        .eq('id', existingSettings.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating global settings:', error);
        return NextResponse.json({ error: '更新全局优惠设置失败' }, { status: 500 });
      }
      
      result = data;
    } else {
      // 创建新设置
      const { data, error } = await supabase
        .from('global_coupon_settings')
        .insert({
          max_percentage_enabled: !!body.max_percentage_enabled,
          max_percentage: maxPercentage,
          max_amount_enabled: !!body.max_amount_enabled,
          max_amount: maxAmount
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating global settings:', error);
        return NextResponse.json({ error: '创建全局优惠设置失败' }, { status: 500 });
      }
      
      result = data;
    }
    
    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 