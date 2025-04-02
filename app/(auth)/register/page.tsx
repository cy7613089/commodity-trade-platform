'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      // 使用我们的API端点进行注册
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name || undefined,
          phone: values.phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: '注册失败',
          description: data.error || '注册过程中出现错误',
        });
        return;
      }

      toast({
        title: '注册成功',
        description: '请检查您的邮箱以完成注册流程',
      });
      router.push('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        variant: 'destructive',
        title: '注册失败',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

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
      </div>
    </div>
  );
} 