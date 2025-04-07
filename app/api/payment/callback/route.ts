import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// 需要 Admin Client 来更新订单状态
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

/**
 * GET /api/payment/callback - 处理模拟支付回调
 * 通常支付回调是POST，但GET方便浏览器跳转测试
 * 参数: orderId, success (boolean string), mockToken
 */
export async function GET(request: Request) {
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const orderId = searchParams.get('orderId');
    const success = searchParams.get('success') === 'true'; // 将字符串转为布尔值
    const mockToken = searchParams.get('mockToken');

    // 1. 验证回调参数和来源 (非常重要，真实场景需要验证签名)
    if (!orderId || typeof success === 'undefined' || mockToken !== 'VALID_MOCK_TOKEN') { // 简单token验证
        console.warn('Invalid payment callback received:', searchParams.toString());
        // 不应给调用者过多信息
        return new NextResponse('Invalid callback parameters', { status: 400 });
    }

    try {
        // 2. 获取订单当前状态，确保是 PENDING_PAYMENT
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, status, payment_status')
            .eq('id', orderId)
            .single();

        if (fetchError) {
             if (fetchError.code === 'PGRST116') {
                 console.error(`Payment callback received for non-existent order ID: ${orderId}`);
                 return new NextResponse('Order not found', { status: 404 });
             }
             console.error(`Error fetching order ${orderId} during payment callback:`, fetchError);
             return new NextResponse('Failed to process callback', { status: 500 });
        }

        if (!order) {
              console.error(`Payment callback logic error: Order ${orderId} not found after fetch.`);
              return new NextResponse('Order not found', { status: 404 });
        }


        // 如果订单已不是待支付状态，说明可能重复回调或状态已变更，直接返回成功避免重复处理
        if (order.status !== 'PENDING_PAYMENT' || order.payment_status !== 'unpaid') {
            console.log(`Order ${orderId} status is already '${order.status}/${order.payment_status}'. Ignoring payment callback.`);
             // 可以重定向到订单详情页
            return NextResponse.redirect(new URL(`/orders/${orderId}`, request.url));
        }

        // 3. 根据支付结果更新订单状态
        let updateData: Partial<Database['public']['Tables']['orders']['Update']> = {
            updated_at: new Date().toISOString()
        };
        let redirectPath = `/orders/${orderId}?payment=failed`; // 默认失败路径

        if (success) {
            console.log(`Payment successful for order ${orderId}. Updating status.`);
            updateData.status = 'PENDING_SHIPMENT';
            updateData.payment_status = 'paid';
            updateData.paid_at = new Date().toISOString();
            redirectPath = `/orders/${orderId}?payment=success`; // 成功路径
        } else {
            console.log(`Payment failed for order ${orderId}. Keeping status as PENDING_PAYMENT.`);
            // 可以选择不更新状态，或者标记为支付失败等
            // updateData.status = 'PAYMENT_FAILED'; // 如果有此状态
        }

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) {
            console.error(`Failed to update order ${orderId} status after payment callback:`, updateError);
            // 即使更新失败，也可能需要通知用户检查订单状态
             return new NextResponse('Failed to update order status', { status: 500 });
        }

        console.log(`Order ${orderId} status updated successfully after payment callback.`);

        // 4. 重定向用户到订单详情页或其他结果页面
        return NextResponse.redirect(new URL(redirectPath, request.url));

    } catch (error) {
        console.error('Payment callback processing error:', error);
         return new NextResponse('Internal server error during callback processing', { status: 500 });
    }
} 