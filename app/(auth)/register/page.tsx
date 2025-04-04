'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useUserStore } from '@/lib/store/user-store';

const formSchema = z.object({
  email: z.string().email({
    message: '请输入有效的电子邮件地址',
  }),
  password: z.string().min(6, {
    message: '密码必须至少6个字符',
  }),
  confirmPassword: z.string().min(6, {
    message: '密码必须至少6个字符',
  }),
  name: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
    },
  });

  const { syncUserWithAuth } = useUserStore();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { email, password, name, phone } = values;
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          phone
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setDebugInfo(JSON.stringify(result, null, 2));
        const errorMessage = result.error || '注册过程中出现错误';
        toast.error("注册失败", {
          description: errorMessage,
        });
        setError(errorMessage);
        return;
      } else {
        setError(null);
        setDebugInfo(null);
        await syncUserWithAuth();
        router.push('/register/confirm');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error("请求错误", {
        description: errorMessage,
      });
      setError(errorMessage);
      setDebugInfo(JSON.stringify({ error: errorMessage }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">注册</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            创建您的账户以开始购物
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>电子邮件</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名 (选填)</FormLabel>
                  <FormControl>
                    <Input placeholder="张三" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号码 (选填)</FormLabel>
                  <FormControl>
                    <Input placeholder="13812345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '注册中...' : '注册'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          <p>
            已有账户？{' '}
            <Link href="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/products" className="text-muted-foreground hover:underline">
              返回商品列表
            </Link>
          </p>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 调试信息 */}
        {debugInfo && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">调试信息:</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-60">
              {debugInfo}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 