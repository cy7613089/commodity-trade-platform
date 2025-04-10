"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// 应用顺序类型接口
interface CouponApplicationOrderItem {
  type: string;
  order: number;
  id?: string;
}

export function CouponApplicationOrder() {
  const [applicationOrder, setApplicationOrder] = useState<CouponApplicationOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // 获取当前应用顺序
  useEffect(() => {
    const fetchApplicationOrder = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/coupons/application-order');
        
        if (!response.ok) {
          throw new Error('获取应用顺序失败');
        }
        
        const data = await response.json();
        setApplicationOrder(data.applicationOrder);
      } catch (error) {
        console.error('Error fetching application order:', error);
        toast.error('获取应用顺序失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicationOrder();
  }, []);

  // 上移优惠券类型
  const moveUp = (index: number) => {
    if (index <= 0) return;
    
    const newOrder = [...applicationOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    
    // 重新排序
    newOrder.forEach((item, i) => {
      item.order = i + 1;
    });
    
    setApplicationOrder(newOrder);
  };

  // 下移优惠券类型
  const moveDown = (index: number) => {
    if (index >= applicationOrder.length - 1) return;
    
    const newOrder = [...applicationOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    
    // 重新排序
    newOrder.forEach((item, i) => {
      item.order = i + 1;
    });
    
    setApplicationOrder(newOrder);
  };

  // 保存应用顺序
  const saveApplicationOrder = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/coupons/application-order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationOrder }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存应用顺序失败');
      }
      
      toast.success('应用顺序已保存');
      router.refresh();
    } catch (error) {
      console.error('Error saving application order:', error);
      toast.error(error instanceof Error ? error.message : '保存应用顺序失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 获取类型中文名称
  const getTypeName = (type: string) => {
    switch (type) {
      case '商品券':
        return '商品券 (针对特定商品)';
      case '满减券':
        return '满减券 (满足金额条件)';
      case '时间券':
        return '时间券 (特定时间段有效)';
      default:
        return type;
    }
  };

  // 获取优先级说明
  const getPriorityDescription = (index: number) => {
    if (index === 0) return '(最高优先级)';
    if (index === applicationOrder.length - 1) return '(最低优先级)';
    return '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>优惠券应用顺序</CardTitle>
        <CardDescription>
          设置不同类型优惠券的应用优先级。排在前面的优惠券类型将优先应用。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applicationOrder.map((item, index) => (
            <div key={item.type} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label className="text-base font-medium">
                  {index + 1}. {getTypeName(item.type)} {getPriorityDescription(index)}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveDown(index)}
                  disabled={index === applicationOrder.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button 
            className="w-full mt-6" 
            onClick={saveApplicationOrder} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存应用顺序
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 