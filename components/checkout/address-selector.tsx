"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";

// 模拟地址数据，实际应用中应该从API或状态管理中获取
const mockAddresses = [
  {
    id: "1",
    name: "张三",
    phone: "13812345678",
    address: "北京市海淀区清华园1号",
    isDefault: true,
  },
  {
    id: "2",
    name: "李四",
    phone: "13987654321",
    address: "上海市浦东新区张江高科技园区",
    isDefault: false,
  },
];

interface AddressSelectorProps {
  onAddressSelect: (addressId: string) => void;
}

export default function AddressSelector({ onAddressSelect }: AddressSelectorProps) {
  const [selectedAddress, setSelectedAddress] = useState<string>(
    mockAddresses.find((addr) => addr.isDefault)?.id || ""
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // 添加useEffect，在组件挂载时通知父组件默认选中的地址
  useEffect(() => {
    // 如果有默认选中的地址，通知父组件
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
    }
  }, [selectedAddress, onAddressSelect]);

  const handleAddressChange = (value: string) => {
    setSelectedAddress(value);
    onAddressSelect(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>收货地址</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedAddress}
          onValueChange={handleAddressChange}
          className="space-y-3"
        >
          {mockAddresses.map((address) => (
            <div
              key={address.id}
              className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent"
            >
              <RadioGroupItem value={address.id} id={`address-${address.id}`} />
              <div className="flex-1">
                <Label
                  htmlFor={`address-${address.id}`}
                  className="flex cursor-pointer justify-between"
                >
                  <div>
                    <div className="font-medium">
                      {address.name} {address.isDefault && <span className="ml-2 text-xs text-blue-600">默认</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">{address.phone}</div>
                    <div className="mt-1 text-sm">{address.address}</div>
                  </div>
                  <Button variant="outline" size="sm">
                    编辑
                  </Button>
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>

        <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="mt-4 w-full justify-start"
              onClick={() => setIsAddingAddress(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              添加新地址
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新地址</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // 这里处理地址添加逻辑
                setIsAddingAddress(false);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">收货人</Label>
                  <Input id="name" placeholder="请输入收货人姓名" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input id="phone" placeholder="请输入手机号码" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">详细地址</Label>
                <Textarea
                  id="address"
                  placeholder="请输入详细地址"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingAddress(false)}
                >
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 