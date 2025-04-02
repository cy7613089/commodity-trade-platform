"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { useOrderStore, OrderStatus } from "@/lib/store/order-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User, 
  Package, 
  MapPin, 
  Lock, 
  ChevronRight, 
  Calendar, 
  Mail, 
  Phone, 
  Edit,
  CheckCircle
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { initMockUser, user, mockInitialized, updateUserInfo } = useUserStore();
  const { initMockOrders, orders, mockInitialized: ordersMockInitialized } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 编辑表单状态
  const [formState, setFormState] = useState({
    nickname: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '',
  });
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    if (!mockInitialized) {
      initMockUser();
    }
    if (!ordersMockInitialized) {
      initMockOrders();
    }
  }, [initMockUser, initMockOrders, mockInitialized, ordersMockInitialized]);
  
  // 当用户数据加载时更新表单状态
  useEffect(() => {
    if (user) {
      setFormState({
        nickname: user.nickname || '',
        email: user.email,
        phone: user.phone,
        birthdate: user.birthdate || '',
        gender: user.gender || '',
      });
    }
  }, [user]);
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // 处理选择框变化
  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // 保存用户信息
  const handleSaveUserInfo = () => {
    updateUserInfo({
      nickname: formState.nickname,
      email: formState.email,
      phone: formState.phone,
      birthdate: formState.birthdate,
      gender: formState.gender,
    });
    
    setIsEditing(false);
    toast.success("个人信息已更新");
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    if (user) {
      setFormState({
        nickname: user.nickname || '',
        email: user.email,
        phone: user.phone,
        birthdate: user.birthdate || '',
        gender: user.gender || '',
      });
    }
    setIsEditing(false);
  };
  
  // 计算各状态订单数量
  const pendingPaymentCount = orders.filter(order => order.status === OrderStatus.PENDING_PAYMENT).length;
  const pendingShipmentCount = orders.filter(order => order.status === OrderStatus.PENDING_SHIPMENT).length;
  const shippedCount = orders.filter(order => order.status === OrderStatus.SHIPPED).length;
  
  // 注册时间格式化
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  if (!mounted || !user) {
    return <div className="container mx-auto py-10">加载中...</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">个人中心</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* 左侧：个人信息卡片和导航 */}
        <div className="space-y-6">
          {/* 用户卡片 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative h-24 w-24 mb-4">
                  <Image
                    src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                    alt={user.nickname || user.username}
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold">{user.nickname || user.username}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  注册于 {formatRegistrationDate(user.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* 导航菜单 */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                <Link href="/account" className="flex items-center justify-between p-4 hover:bg-accent">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3 text-primary" />
                    <span>个人信息</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/account/addresses" className="flex items-center justify-between p-4 hover:bg-accent">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                    <span>收货地址</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/account/security" className="flex items-center justify-between p-4 hover:bg-accent">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 mr-3 text-primary" />
                    <span>账户安全</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/orders" className="flex items-center justify-between p-4 hover:bg-accent">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-3 text-primary" />
                    <span>我的订单</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧：内容区 */}
        <div className="md:col-span-2 space-y-6">
          {/* 订单概览 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>我的订单</CardTitle>
              <CardDescription>您可以查看和管理所有订单</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <Link href={`/orders?status=${OrderStatus.PENDING_PAYMENT}`} className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-accent">
                  <div className="relative">
                    <Package className="h-8 w-8 text-yellow-500" />
                    {pendingPaymentCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingPaymentCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">待付款</span>
                </Link>
                
                <Link href={`/orders?status=${OrderStatus.PENDING_SHIPMENT}`} className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-accent">
                  <div className="relative">
                    <Package className="h-8 w-8 text-blue-500" />
                    {pendingShipmentCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingShipmentCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">待发货</span>
                </Link>
                
                <Link href={`/orders?status=${OrderStatus.SHIPPED}`} className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-accent">
                  <div className="relative">
                    <Package className="h-8 w-8 text-green-500" />
                    {shippedCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {shippedCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">待收货</span>
                </Link>
                
                <Link href="/orders" className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-accent">
                  <Package className="h-8 w-8 text-gray-500" />
                  <span className="text-sm">全部订单</span>
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">查看全部订单</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* 个人信息表单/展示 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>个人信息</CardTitle>
                <CardDescription>管理您的个人资料</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                // 编辑表单
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nickname">昵称</Label>
                      <Input
                        id="nickname"
                        name="nickname"
                        value={formState.nickname}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">手机号码</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formState.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthdate">出生日期</Label>
                      <Input
                        id="birthdate"
                        name="birthdate"
                        type="date"
                        value={formState.birthdate}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">性别</Label>
                      <Select
                        value={formState.gender}
                        onValueChange={(value) => handleSelectChange('gender', value)}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="选择性别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="男">男</SelectItem>
                          <SelectItem value="女">女</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                // 信息展示
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">用户名</p>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">昵称</p>
                      <p className="font-medium">{user.nickname || '未设置'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        邮箱
                      </p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        手机号码
                      </p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        出生日期
                      </p>
                      <p className="font-medium">{user.birthdate || '未设置'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">性别</p>
                      <p className="font-medium">{user.gender || '未设置'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>取消</Button>
                <Button onClick={handleSaveUserInfo}>保存</Button>
              </CardFooter>
            )}
          </Card>
          
          {/* 安全信息概览 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>账户安全</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 mr-3 text-primary" />
                    <span>登录密码</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm text-muted-foreground mr-2">已设置</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/account/security">修改</Link>
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-primary" />
                    <span>手机验证</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm text-muted-foreground mr-2">已绑定 {user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/account/security">修改</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/account/security">查看更多安全设置</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 