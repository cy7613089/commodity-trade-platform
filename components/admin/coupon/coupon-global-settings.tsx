"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// 全局设置类型接口
interface GlobalSettings {
  max_percentage: number;
  max_percentage_enabled: boolean;
  max_amount: number;
  max_amount_enabled: boolean;
}

export function CouponGlobalSettings() {
  const [settings, setSettings] = useState<GlobalSettings>({
    max_percentage: 50,
    max_percentage_enabled: true,
    max_amount: 1000,
    max_amount_enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // 获取当前设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/coupons/settings');
        
        if (!response.ok) {
          throw new Error('获取优惠券设置失败');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching coupon settings:', error);
        toast.error('获取优惠券设置失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // 处理输入变化
  const handleInputChange = (field: keyof GlobalSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) : value
    }));
  };

  // 保存设置
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/coupons/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存设置失败');
      }
      
      toast.success('优惠券设置已保存');
      router.refresh();
    } catch (error) {
      console.error('Error saving coupon settings:', error);
      toast.error(error instanceof Error ? error.message : '保存设置失败');
    } finally {
      setIsSaving(false);
    }
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
        <CardTitle>优惠券全局设置</CardTitle>
        <CardDescription>
          设置优惠券的全局限制，包括最大百分比和最大金额。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-percentage-enabled" className="text-base font-medium">
                启用最大百分比限制
              </Label>
              <Switch 
                id="max-percentage-enabled"
                checked={settings.max_percentage_enabled}
                onCheckedChange={(checked) => handleInputChange('max_percentage_enabled', checked)}
              />
            </div>
            {settings.max_percentage_enabled && (
              <div className="space-y-2">
                <Label htmlFor="max-percentage" className="text-sm">
                  最大折扣百分比 (%)
                </Label>
                <Input
                  id="max-percentage"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.max_percentage}
                  onChange={(e) => handleInputChange('max_percentage', e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  百分比类型的优惠券最大可设置的折扣百分比值
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-amount-enabled" className="text-base font-medium">
                启用最大金额限制
              </Label>
              <Switch 
                id="max-amount-enabled"
                checked={settings.max_amount_enabled}
                onCheckedChange={(checked) => handleInputChange('max_amount_enabled', checked)}
              />
            </div>
            {settings.max_amount_enabled && (
              <div className="space-y-2">
                <Label htmlFor="max-amount" className="text-sm">
                  最大优惠金额 (元)
                </Label>
                <Input
                  id="max-amount"
                  type="number"
                  min={1}
                  value={settings.max_amount}
                  onChange={(e) => handleInputChange('max_amount', e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  固定金额类型的优惠券最大可设置的优惠金额
                </p>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full mt-6" 
            onClick={saveSettings} 
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
                保存设置
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 