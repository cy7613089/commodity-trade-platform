"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore, Address } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, Home, MapPin, Edit, Trash2, Plus } from "lucide-react";

export default function AddressesPage() {
  const { initMockUser, user, mockInitialized, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null);
  
  // 表单状态
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    isDefault: false,
  });
  
  // 客户端组件挂载和初始化
  useEffect(() => {
    setMounted(true);
    if (!mockInitialized) {
      initMockUser();
    }
  }, [initMockUser, mockInitialized]);
  
  // 初始化编辑表单
  const initEditForm = (address: Address) => {
    setFormState({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      address: address.address,
      isDefault: address.isDefault,
    });
    setCurrentAddressId(address.id);
    setIsEditing(true);
    setIsOpen(true);
  };
  
  // 初始化新增表单
  const initAddForm = () => {
    setFormState({
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      address: '',
      isDefault: false,
    });
    setCurrentAddressId(null);
    setIsEditing(false);
    setIsOpen(true);
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // 处理复选框变化
  const handleCheckboxChange = (checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      isDefault: checked,
    }));
  };
  
  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formState.name || !formState.phone || !formState.province || 
        !formState.city || !formState.district || !formState.address) {
      toast.error("请填写完整的地址信息");
      return;
    }
    
    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formState.phone)) {
      toast.error("请输入有效的手机号码");
      return;
    }
    
    if (isEditing && currentAddressId) {
      // 更新地址
      updateAddress(currentAddressId, formState);
      toast.success("地址已更新");
    } else {
      // 添加新地址
      addAddress(formState);
      toast.success("地址已添加");
    }
    
    // 关闭对话框
    setIsOpen(false);
  };
  
  // 处理删除地址
  const handleDeleteAddress = (id: string) => {
    if (window.confirm("确定要删除此地址吗？")) {
      deleteAddress(id);
      toast.success("地址已删除");
    }
  };
  
  // 处理设置默认地址
  const handleSetDefaultAddress = (id: string) => {
    setDefaultAddress(id);
    toast.success("默认地址已设置");
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
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">收货地址管理</h1>
        <Button onClick={initAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          添加新地址
        </Button>
      </div>
      
      {user.addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-4">暂无收货地址</p>
            <Button onClick={initAddForm}>
              添加新地址
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {user.addresses.map((address) => (
            <Card key={address.id} className={address.isDefault ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    {address.name}
                    {address.isDefault && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        默认地址
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => initEditForm(address)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(address.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{address.phone}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <p>{address.province} {address.city} {address.district}</p>
                <p className="text-sm text-muted-foreground mt-1">{address.address}</p>
              </CardContent>
              
              {!address.isDefault && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => handleSetDefaultAddress(address.id)}
                  >
                    设为默认
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* 添加/编辑地址对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "编辑地址" : "添加新地址"}</DialogTitle>
            <DialogDescription>
              请填写完整的收货地址信息
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">收货人</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleInputChange}
                    placeholder="请输入收货人姓名"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formState.phone}
                    onChange={handleInputChange}
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="province">省份</Label>
                  <Input
                    id="province"
                    name="province"
                    value={formState.province}
                    onChange={handleInputChange}
                    placeholder="省份"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">城市</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formState.city}
                    onChange={handleInputChange}
                    placeholder="城市"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="district">区/县</Label>
                  <Input
                    id="district"
                    name="district"
                    value={formState.district}
                    onChange={handleInputChange}
                    placeholder="区/县"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">详细地址</Label>
                <Input
                  id="address"
                  name="address"
                  value={formState.address}
                  onChange={handleInputChange}
                  placeholder="街道、小区、门牌号等"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formState.isDefault}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="isDefault" className="cursor-pointer">设为默认收货地址</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 