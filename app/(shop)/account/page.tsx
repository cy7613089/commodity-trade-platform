"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, User } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';

export default function AccountPage() {
  const { user, isLoading: userLoading, updateUserInfo, syncUserWithAuth } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    // 页面加载时同步用户信息
    syncUserWithAuth();
  }, [syncUserWithAuth]);

  useEffect(() => {
    if (user) {
      setFormState({
        name: user.nickname || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUserInfo = async () => {
    try {
      setIsSubmitting(true);
      setApiError(null);
      
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formState.name,
          phone: formState.phone
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '更新个人信息失败');
      }

      const updatedUser = await res.json();
      // 使用获取到的用户数据更新存储
      updateUserInfo({
        nickname: updatedUser.name,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar
      });
      
      toast.success('个人信息更新成功');
    } catch (err) {
      console.error('更新用户资料错误:', err);
      setApiError(err instanceof Error ? err.message : '更新个人信息失败');
      toast.error(err instanceof Error ? err.message : '更新个人信息失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryLoadUser = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-start py-10">
      <div className="w-full max-w-xl px-4">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">个人中心</h1>

        <Card className="w-full shadow-md">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-center text-xl">个人信息</CardTitle>
            <CardDescription className="text-center">查看并更新您的个人资料</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {userLoading ? (
              <div className="space-y-6 py-4">
                <div className="flex justify-center">
                  <Skeleton className="h-20 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : apiError ? (
              <div className="p-6 mb-4 text-red-500 bg-red-50 rounded-md">
                <p className="text-center font-medium mb-2">出错了</p>
                <p className="text-center mb-4">{apiError}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleRetryLoadUser}
                >
                  重试
                </Button>
              </div>
            ) : user ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSaveUserInfo();
              }}>
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/10">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.nickname || "用户"}
                          width={96}
                          height={96}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-lg">{user.email}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        注册于: {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-base">姓名</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="请输入姓名"
                        value={formState.name}
                        onChange={handleInputChange}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base">手机号码</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="请输入手机号码"
                        value={formState.phone}
                        onChange={handleInputChange}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-8">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-2 h-11"
                    size="lg"
                  >
                    {isSubmitting ? '保存中...' : '保存修改'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6 text-center">
                <p className="mb-4 text-lg">未找到用户信息</p>
                <Button 
                  variant="outline" 
                  className="mx-auto"
                  onClick={handleRetryLoadUser}
                >
                  重试
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 