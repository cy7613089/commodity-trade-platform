"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Alert,
  AlertDescription, 
  AlertTitle
} from "@/components/ui/alert";
import { toast } from "sonner";
import { ChevronLeft, Lock, AlertCircle, AlertTriangle, Shield, Phone, Mail } from "lucide-react";

export default function SecurityPage() {
  const { initMockUser, user, mockInitialized, changePassword } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // 密码表单状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // 表单错误
  const [error, setError] = useState<string | null>(null);
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    if (!mockInitialized) {
      initMockUser();
    }
  }, [initMockUser, mockInitialized]);
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除错误提示
    setError(null);
  };
  
  // 处理密码修改
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("请填写所有密码字段");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("新密码和确认密码不匹配");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError("新密码长度不能少于6位");
      return;
    }
    
    // 模拟密码修改流程
    const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    
    if (success) {
      toast.success("密码修改成功");
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } else {
      setError("当前密码不正确");
    }
  };
  
  if (!mounted || !user) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/account">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回个人中心
          </Button>
        </Link>
      </div>
      
      <h1 className="mb-6 text-3xl font-bold">账户安全</h1>
      
      <div className="space-y-6 max-w-2xl">
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4" />
          <AlertTitle>账户安全提醒</AlertTitle>
          <AlertDescription>
            定期修改密码并使用强密码可以有效提高账户安全性。不要在不同平台使用相同的密码。
          </AlertDescription>
        </Alert>
        
        {/* 密码管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              登录密码
            </CardTitle>
            <CardDescription>用于登录账户的密码，建议定期修改</CardDescription>
          </CardHeader>
          <CardContent>
            {isChangingPassword ? (
              <form onSubmit={handleChangePassword}>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>错误</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handleInputChange}
                      placeholder="请输入当前密码"
                    />
                    <p className="text-xs text-muted-foreground">提示：测试环境使用&quot;123456&quot;作为当前密码</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handleInputChange}
                      placeholder="请输入新密码"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="请再次输入新密码"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsChangingPassword(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit">保存修改</Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    上次修改时间：2023年10月15日
                  </p>
                  <p className="text-sm mt-1">
                    建议您定期修改密码以保证账户安全
                  </p>
                </div>
                <Button onClick={() => setIsChangingPassword(true)}>
                  修改密码
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 手机验证 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              手机验证
            </CardTitle>
            <CardDescription>用于接收安全验证码和重要通知</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">已绑定手机：{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  该手机号将用于接收验证码和重要通知
                </p>
              </div>
              <Button variant="outline">
                更换手机
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 邮箱验证 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              邮箱验证
            </CardTitle>
            <CardDescription>用于接收安全验证码和重要通知</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">已绑定邮箱：{user.email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  该邮箱将用于接收验证码和重要通知
                </p>
              </div>
              <Button variant="outline">
                更换邮箱
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 安全提示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              安全提示
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5 text-sm">
              <li>定期修改密码，使用数字、字母和特殊字符的组合</li>
              <li>不要在不同平台使用相同的密码</li>
              <li>不要将密码告诉他人</li>
              <li>不要在公共设备上保存密码</li>
              <li>及时更新手机号码和邮箱地址，确保能收到安全验证信息</li>
              <li>收到可疑短信或邮件时，请不要点击其中的链接</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 