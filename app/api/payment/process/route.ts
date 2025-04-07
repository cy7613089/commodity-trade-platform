import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

function createClient() {
  return createServerComponentClient<Database>({ cookies });
}

/**
 * POST /api/payment/process - 模拟发起支付
 * 请求体: { orderId: string }
 */
export async function POST(request: Request) {
    const supabase = createClient();

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        const { orderId } = body;

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ error: 'Invalid or missing orderId' }, { status: 400 });
        }

        // 1. 验证订单是否存在、属于当前用户且状态为 PENDING_PAYMENT
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, user_id, status, payment_status, final_amount')
            .eq('id', orderId)
            .eq('user_id', userId) // 用户只能支付自己的订单
            .single();

        if (orderError) {
             if (orderError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Order not found or you are not authorized' }, { status: 404 });
            }
            console.error(`Error fetching order ${orderId} for payment processing:`, orderError);
            return NextResponse.json({ error: 'Failed to retrieve order for payment' }, { status: 500 });
        }

         if (!order) {
            return NextResponse.json({ error: 'Order not found or you are not authorized' }, { status: 404 });
        }

        if (order.status !== 'PENDING_PAYMENT' || order.payment_status !== 'unpaid') {
            return NextResponse.json({ error: `Order status is not pending payment (Current: ${order.status}, Payment: ${order.payment_status})` }, { status: 400 });
        }

        // 2. 模拟支付处理 (例如生成一个带回调URL的假支付链接)
        console.log(`Simulating payment process initiated for order ${orderId} amount ${order.final_amount}...`);

        // 模拟支付成功/失败的回调URL
        // 在真实场景中，这会是支付网关提供的
        const callbackBaseUrl = `${request.headers.get('origin') || 'http://localhost:3000'}/api/payment/callback`;

        // 模拟随机成功或失败
        const paymentSuccess = Math.random() > 0.1; // 90% 成功率

        const callbackUrl = `${callbackBaseUrl}?orderId=${orderId}&success=${paymentSuccess}&mockToken=VALID_MOCK_TOKEN`; // 添加一个简单的mock token

        // 3. 返回模拟支付信息
        // 真实场景可能会返回支付网关的URL或需要客户端进一步操作的信息
        return NextResponse.json({
            message: 'Payment initiated (simulation)',
            paymentUrl: `/mock-payment-page?orderId=${orderId}&amount=${order.final_amount}&callback=${encodeURIComponent(callbackUrl)}`, // 提供一个前端可以跳转的模拟支付页面URL
            callbackUrl: callbackUrl // 也可直接返回回调URL供测试
        });

    } catch (error) {
        console.error('Payment processing error:', error);
        return NextResponse.json({ error: 'Internal server error during payment processing' }, { status: 500 });
    }
} 