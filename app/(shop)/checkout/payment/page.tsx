"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard, Wallet, Smartphone, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "failed">("processing");
  const [seconds, setSeconds] = useState(5);
  
  // 获取URL参数
  const orderId = searchParams.get("orderId") || "未知订单";
  const amount = Number(searchParams.get("amount")) || 0;
  const method = searchParams.get("method") || "alipay";
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  useEffect(() => {
    // 获取订单详情
    const fetchOrderDetails = async () => {
      if (orderId === "未知订单") return;
      
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);
        }
      } catch (error) {
        console.error("获取订单详情失败:", error);
      }
    };
    
    fetchOrderDetails();
    
    // 模拟支付处理
    const timer = setTimeout(() => {
      // 模拟90%的概率支付成功
      const isSuccess = Math.random() < 0.9;
      setPaymentStatus(isSuccess ? "success" : "failed");
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId]);

  // 成功后自动跳转倒计时
  useEffect(() => {
    if (paymentStatus === "success" && seconds > 0) {
      const timer = setTimeout(() => setSeconds(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (paymentStatus === "success" && seconds === 0) {
      router.push("/orders");
    }
  }, [paymentStatus, seconds, router]);

  // 获取支付方式图标
  const getPaymentIcon = () => {
    switch (method) {
      case "alipay":
        return <Wallet className="h-12 w-12 text-blue-500" />;
      case "wechat":
        return <Smartphone className="h-12 w-12 text-green-500" />;
      case "creditcard":
        return <CreditCard className="h-12 w-12 text-purple-500" />;
      default:
        return <CreditCard className="h-12 w-12 text-gray-500" />;
    }
  };

  // 获取支付方式名称
  const getPaymentMethodName = () => {
    switch (method) {
      case "alipay":
        return "支付宝";
      case "wechat":
        return "微信支付";
      case "creditcard":
        return "信用卡支付";
      case "cash":
        return "货到付款";
      default:
        return "未知支付方式";
    }
  };

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">支付{paymentStatus === "processing" ? "处理中" : paymentStatus === "success" ? "成功" : "失败"}</CardTitle>
          <CardDescription>
            订单号: {orderDetails?.order_number || orderId}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {paymentStatus === "processing" ? (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            ) : paymentStatus === "success" ? (
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-16 w-16 text-green-600" />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-4">
                <CreditCard className="h-16 w-16 text-red-600" />
              </div>
            )}
          </div>
          
          <div className="rounded-lg bg-accent p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">支付方式</span>
              <div className="flex items-center gap-2">
                {getPaymentIcon()}
                <span className="font-medium">{getPaymentMethodName()}</span>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">支付金额</span>
              <span className="text-xl font-bold">¥{formatPrice(amount)}</span>
            </div>
          </div>
          
          {paymentStatus === "processing" && (
            <p className="text-center text-muted-foreground">
              正在处理您的支付，请稍候...
            </p>
          )}
          
          {paymentStatus === "success" && (
            <div className="space-y-4">
              <p className="text-center text-green-600">
                支付已成功完成，感谢您的购买！
              </p>
              <p className="text-center text-sm text-muted-foreground">
                {seconds}秒后自动跳转到订单页面...
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/orders">
                  <Button>查看订单</Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline">继续购物</Button>
                </Link>
              </div>
            </div>
          )}
          
          {paymentStatus === "failed" && (
            <div className="space-y-4">
              <p className="text-center text-red-600">
                支付处理过程中发生错误，请重试
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => {
                    setPaymentStatus("processing");
                    setTimeout(() => {
                      setPaymentStatus("success");
                    }, 2000);
                  }}
                >
                  重新支付
                </Button>
                <Link href="/cart">
                  <Button variant="outline">返回购物车</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 