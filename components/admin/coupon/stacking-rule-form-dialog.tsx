'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { HeadlessMultiSelect } from '@/components/ui/headless-multi-select'
import { Coupon } from '@/types'
import { toast } from 'sonner'

// Stacking Rule type (adjust if needed)
interface StackingRule {
  id: string;
  name: string | null;
  description: string | null;
  rule_type: 'ALLOW' | 'DISALLOW';
  coupon_ids: string[];
  is_active: boolean | null;
}

// Form Schema Validation - 改为要求至少选择两张优惠券
const formSchema = z.object({
  name: z.string().min(1, { message: '规则名称不能为空' }),
  description: z.string().optional(),
  coupon_ids: z.array(z.string()).min(2, { message: '请至少选择两张优惠券' }),
  is_active: z.boolean(), // Keep boolean, default set in useForm
});

type FormValues = z.infer<typeof formSchema>;

type StackingRuleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleToEdit?: StackingRule | null;
  ruleType: 'ALLOW' | 'DISALLOW';
  onSuccess?: () => void;
};

// Helper function for default values
const getDefaultValues = (ruleToEdit: StackingRule | null): FormValues => ({
  name: ruleToEdit?.name || '',
  description: ruleToEdit?.description || '',
  coupon_ids: ruleToEdit?.coupon_ids || [],
  is_active: ruleToEdit?.is_active === null || ruleToEdit?.is_active === undefined ? true : ruleToEdit.is_active,
});

export function StackingRuleFormDialog({
  open,
  onOpenChange,
  ruleToEdit,
  ruleType,
  onSuccess,
}: StackingRuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(ruleToEdit || null),
  });

  // 获取优惠券列表
  const fetchCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      const response = await fetch('/api/admin/coupons');
      if (!response.ok) {
        throw new Error('获取优惠券列表失败');
      }
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('获取优惠券列表失败');
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  // 保存叠加规则
  const onSave = async (ruleData: Partial<StackingRule>) => {
    try {
      const url = '/api/admin/coupons/stacking-rules' + (ruleData.id ? `/${ruleData.id}` : '');
      const method = ruleData.id ? 'PUT' : 'POST';
      
      // 添加规则类型
      const dataToSend = {
        ...ruleData,
        rule_type: ruleType,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存规则失败');
      }

      toast.success(ruleData.id ? '规则更新成功' : '规则创建成功');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving stacking rule:', error);
      toast.error(error instanceof Error ? error.message : '保存规则失败');
    }
  };

  useEffect(() => {
    if (open) {
      // 重置表单并获取优惠券列表
      form.reset(getDefaultValues(ruleToEdit || null));
      
      // 无论如何都从API获取最新的优惠券列表
      fetchCoupons();
    } 
  }, [ruleToEdit, open, form]);

  // Explicitly type the onSubmit handler
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      console.log('Form values on submit:', values);
      const saveData: Partial<StackingRule> = {
        name: values.name,
        description: values.description,
        coupon_ids: values.coupon_ids,
        is_active: values.is_active,
      };
      if (ruleToEdit) {
         saveData.id = ruleToEdit.id; // Include ID for update
      }
      await onSave(saveData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 将优惠券数据转换为选项格式
  const couponOptions = coupons.map(c => ({ 
    value: c.id || '', 
    label: `${c.name} (${c.type === 'product' ? '商品券' : c.type === 'time' ? '限时券' : c.type === 'amount' ? '满减券' : '组合券'})`
  }));
  
  console.log('Available coupons:', coupons.length);
  console.log('Coupon options:', couponOptions);
  console.log('Selected coupon IDs:', form.getValues('coupon_ids'));
  
  // Use standard form.control instead of casting to any
  const control = form.control;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {ruleToEdit ? '编辑' : '创建'} {ruleType === 'ALLOW' ? '可叠加' : '不可叠加'} 规则
          </DialogTitle>
          <DialogDescription>
            {ruleType === 'ALLOW'
              ? '定义一组可以同时使用的优惠券。'
              : '定义一组不能同时使用的优惠券。'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>规则名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：新手券与活动券不可叠加" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>规则描述 (可选)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="详细说明此规则的用途或条件" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="coupon_ids"
              render={({ field }) => {
                console.log('Field value in render:', field.value);
                return (
                <FormItem>
                  <FormLabel>选择优惠券</FormLabel>
                  <FormControl>
                    <HeadlessMultiSelect
                      options={couponOptions}
                      value={field.value || []}
                      onChange={(values: string[]) => {
                        console.log('HeadlessMultiSelect onChange:', values);
                        field.onChange(values);
                      }}
                      placeholder={isLoadingCoupons ? "加载优惠券中..." : "选择至少两张优惠券..."}
                      disabled={isLoadingCoupons}
                      className={isLoadingCoupons ? "opacity-70 cursor-wait" : ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {ruleType === 'ALLOW' 
                      ? '选择可以同时使用的优惠券组合。请至少选择2张优惠券。'
                      : '选择不能同时使用的优惠券组合。请至少选择2张优惠券。'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}}
            />
            
             <FormField
              control={control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>激活状态</FormLabel>
                    <FormDescription>
                      规则是否立即生效？
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingCoupons}>
                {isSubmitting ? '保存中...' : '保存规则'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 