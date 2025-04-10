import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// 获取叠加规则列表
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: '没有权限访问叠加规则' }, { status: 403 });
    }
    
    // 获取叠加规则
    const { data, error } = await supabase
      .from('coupon_stacking_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching stacking rules:', error);
      return NextResponse.json({ error: '获取叠加规则失败' }, { status: 500 });
    }
    
    return NextResponse.json({ rules: data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建或更新叠加规则
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
      return NextResponse.json({ error: '没有权限修改叠加规则' }, { status: 403 });
    }
    
    // 解析请求体
    const body = await request.json();
    
    // 验证必要字段
    if (!body.name || !body.coupon_ids || !Array.isArray(body.coupon_ids)) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }
    
    let result;
    
    if (body.id) {
      // 更新现有规则
      const { data, error } = await supabase
        .from('coupon_stacking_rules')
        .update({
          name: body.name,
          description: body.description,
          coupon_ids: body.coupon_ids,
          is_active: body.is_active !== undefined ? body.is_active : true
        })
        .eq('id', body.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating stacking rule:', error);
        return NextResponse.json({ error: '更新叠加规则失败' }, { status: 500 });
      }
      
      result = data;
    } else {
      // 创建新规则
      const { data, error } = await supabase
        .from('coupon_stacking_rules')
        .insert({
          name: body.name,
          description: body.description,
          coupon_ids: body.coupon_ids,
          is_active: body.is_active !== undefined ? body.is_active : true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating stacking rule:', error);
        return NextResponse.json({ error: '创建叠加规则失败' }, { status: 500 });
      }
      
      result = data;
    }
    
    return NextResponse.json({ rule: result });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除叠加规则
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
    }
    
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
      return NextResponse.json({ error: '没有权限删除叠加规则' }, { status: 403 });
    }
    
    // 删除规则
    const { error } = await supabase
      .from('coupon_stacking_rules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting stacking rule:', error);
      return NextResponse.json({ error: '删除叠加规则失败' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 