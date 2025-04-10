'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Resolver } from 'react-hook-form'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { Coupon, CouponType, Product } from '@/types'

// 定义优惠券类型的中文名称
const couponTypeNames: Record<CouponType, string> = {
  'product': '商品券',
  'time': '限时券',
  'amount': '满减券'
};

// 基础表单验证schema
const formSchema = z.object({
  name: z.string().min(2, { message: '名称至少需要2个字符' }).max(50, { message: '名称不能超过50个字符' }),
  type: z.enum(['product', 'time', 'amount']),
  discount_type: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().refine(val => val >= 0, {
    message: '优惠值不能为负数'
  }).optional(),
  end_date: z.date(),
  is_active: z.boolean().default(true),
  coupon_rule: z.object({
    product_ids: z.array(z.string().uuid()).optional(),
    min_quantity: z.number().int().min(1).optional(),
    time_type: z.enum(['fixed', 'recurring']).optional(),
    fixed_dates: z.array(z.string()).optional(),
    time_ranges: z.array(z.string()).optional(),
    recurring: z.object({
      days_of_week: z.array(z.number().min(0).max(6)),
      time_ranges: z.array(z.string())
    }).optional(),
    tiers: z.array(z.object({
      min_amount: z.number().min(0),
      discount: z.number().min(0)
    })).optional()
  }).optional(),
});

// 修改CouponRule类型定义
type RecurringRule = {
  days_of_week: number[];
  time_ranges: string[];
};

type CouponRule = {
  product_ids?: string[];
  min_quantity?: number;
  time_type?: 'fixed' | 'recurring';
  fixed_dates?: string[];
  time_ranges?: string[];
  recurring?: RecurringRule;
  tiers?: Array<{
    min_amount: number;
    discount: number;
  }>;
};

type FormValues = z.infer<typeof formSchema> & {
  coupon_rule: CouponRule;
};

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  onSaved: () => void;
}

export function CouponFormDialog({ open, onOpenChange, coupon, onSaved }: CouponFormDialogProps) {
  // 状态管理
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      type: 'amount',
      discount_type: 'fixed',
      value: 0,
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_active: true,
      coupon_rule: {
        product_ids: [],
        min_quantity: 1,
        time_type: 'fixed' as const,
        fixed_dates: [],
        time_ranges: [],
        tiers: [{ min_amount: 0, discount: 0 }]
      }
    }
  });

  // 获取商品列表
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/admin/products?limit=100');
      if (!response.ok) {
        throw new Error('获取商品列表失败');
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('获取商品列表失败');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // 在组件加载和优惠券类型变更时获取商品列表
  useEffect(() => {
    if (open && form.watch('type') === 'product') {
      fetchProducts();
    }
  }, [open, form.watch('type')]);

  // 设置表单初始值
  useEffect(() => {
    if (coupon) {
      const endDate = typeof coupon.end_date === 'string'
        ? new Date(coupon.end_date)
        : coupon.end_date;
      
      const defaultRule: CouponRule = {
        product_ids: [],
        min_quantity: 1,
        time_type: 'fixed' as const,
        fixed_dates: [],
        time_ranges: [],
        tiers: [{ min_amount: 0, discount: 0 }]
      };

      const couponRule = coupon.coupon_rule 
        ? { ...defaultRule, ...coupon.coupon_rule as CouponRule }
        : defaultRule;

      form.reset({
        name: coupon.name,
        type: coupon.type,
        discount_type: coupon.discount_type,
        value: coupon.value,
        end_date: endDate,
        is_active: coupon.is_active,
        coupon_rule: couponRule
      });
    } else {
      const defaultRule: CouponRule = {
        product_ids: [],
        min_quantity: 1,
        time_type: 'fixed' as const,
        fixed_dates: [],
        time_ranges: [],
        tiers: [{ min_amount: 0, discount: 0 }]
      };

      form.reset({
        name: '',
        type: 'amount',
        discount_type: 'fixed',
        value: 0,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true,
        coupon_rule: defaultRule
      });
    }
  }, [coupon, form]);

  // 处理表单提交
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // 确保满减券类型时设置正确的值
      if (values.type === 'amount') {
        values.discount_type = 'fixed';
        values.value = 0;
      }
      
      // 构建请求数据
      const requestData = {
        ...values,
        coupon_rule: values.coupon_rule || {},
      };
      
      // 确定请求URL和方法
      const url = coupon?.id 
        ? `/api/coupons/${coupon.id}` 
        : '/api/coupons';
      
      const method = coupon?.id ? 'PUT' : 'POST';
      
      // 发送请求
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存优惠券失败');
      }
      
      // 成功处理
      toast.success(coupon?.id ? '优惠券更新成功' : '优惠券创建成功');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(error instanceof Error ? error.message : '保存优惠券失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染规则表单字段
  const renderRuleFields = () => {
    const type = form.watch('type');

    switch (type) {
      case 'product':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">商品规则设置</h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="coupon_rule.product_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>适用商品</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Select
                          onValueChange={(value) => {
                            const currentIds = field.value || [];
                            if (!currentIds.includes(value)) {
                              field.onChange([...currentIds, value]);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingProducts ? "加载商品中..." : "选择商品"} />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem 
                                key={product.id} 
                                value={product.id}
                                disabled={(field.value || []).includes(product.id)}
                              >
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* 已选商品列表 */}
                        <div className="space-y-2">
                          {(field.value || []).map((productId) => {
                            const product = products.find(p => p.id === productId);
                            if (!product) return null;
                            
                            return (
                              <div 
                                key={productId}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <span>{product.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentIds = field.value || [];
                                    field.onChange(currentIds.filter(id => id !== productId));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      可以选择多个商品，已选商品将显示在下方列表中
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="coupon_rule.min_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最小购买数量</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        min={1}
                      />
                    </FormControl>
                    <FormDescription>
                      使用优惠券需要购买的最小商品数量
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 'time':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">时间规则设置</h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="coupon_rule.time_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>时间类型</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择时间类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">固定日期</SelectItem>
                        <SelectItem value="recurring">周期性</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('coupon_rule.time_type') === 'fixed' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="coupon_rule.fixed_dates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>固定日期范围</FormLabel>
                        <FormControl>
                          <div className="grid gap-4">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value?.length === 2 
                                    ? `${field.value[0]} 至 ${field.value[1]}`
                                    : "选择日期范围"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="range"
                                  selected={{
                                    from: field.value?.[0] ? new Date(field.value[0]) : undefined,
                                    to: field.value?.[1] ? new Date(field.value[1]) : undefined
                                  }}
                                  onSelect={(range) => {
                                    if (range?.from) {
                                      const dates = [
                                        format(range.from, 'yyyy-MM-dd'),
                                        range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')
                                      ];
                                      field.onChange(dates);
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            
                            {field.value?.length === 2 && (
                              <div className="text-sm text-muted-foreground">
                                生效时间：{field.value[0]} 至 {field.value[1]}
                                {(() => {
                                  const timeRange = form.watch('coupon_rule.time_ranges')?.[0];
                                  return timeRange ? ` ${timeRange}` : ' 00:00-24:00';
                                })()}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coupon_rule.time_ranges"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>时间段（可选）</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="默认 00:00-24:00"
                            value={field.value?.[0] || ''}
                            onChange={(e) => field.onChange([e.target.value])}
                          />
                        </FormControl>
                        <FormDescription>
                          输入格式：HH:mm-HH:mm，不填则默认全天有效
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.watch('coupon_rule.time_type') === 'recurring' && (
                <FormField
                  control={form.control}
                  name="coupon_rule.recurring.days_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>重复周期</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 flex-wrap">
                          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                            <Button
                              key={index}
                              type="button"
                              variant={(field.value || []).includes(index) ? 'default' : 'outline'}
                              onClick={() => {
                                const current = field.value || [];
                                const newValue = current.includes(index)
                                  ? current.filter(d => d !== index)
                                  : [...current, index].sort((a, b) => a - b);
                                field.onChange(newValue);
                                
                                // 更新 coupon_rule
                                const currentRule = form.getValues('coupon_rule') || {};
                                const currentRecurring: RecurringRule = {
                                  days_of_week: currentRule.recurring?.days_of_week || [],
                                  time_ranges: currentRule.recurring?.time_ranges || []
                                };
                                form.setValue('coupon_rule', {
                                  ...currentRule,
                                  recurring: {
                                    ...currentRecurring,
                                    days_of_week: newValue,
                                    time_ranges: currentRecurring.time_ranges
                                  }
                                });
                              }}
                              className="w-12"
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>
                        选择优惠券生效的星期
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('coupon_rule.time_type') === 'recurring' && (
                <FormField
                  control={form.control}
                  name="coupon_rule.recurring.time_ranges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>时间段（可选）</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="默认 00:00-24:00"
                          value={field.value?.[0] || ''}
                          onChange={(e) => {
                            const newValue = [e.target.value];
                            field.onChange(newValue);
                            
                            // 更新 coupon_rule
                            const currentRule = form.getValues('coupon_rule') || {};
                            const currentRecurring: RecurringRule = {
                              days_of_week: currentRule.recurring?.days_of_week || [],
                              time_ranges: currentRule.recurring?.time_ranges || []
                            };
                            form.setValue('coupon_rule', {
                              ...currentRule,
                              recurring: {
                                ...currentRecurring,
                                days_of_week: currentRecurring.days_of_week,
                                time_ranges: newValue
                              }
                            });
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        输入格式：HH:mm-HH:mm，不填则默认全天有效
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('coupon_rule.time_type') === 'recurring' && 
               (form.watch('coupon_rule.recurring')?.days_of_week?.length ?? 0) > 0 && (
                <div className="text-sm text-muted-foreground">
                  生效时间：每周
                  {(form.watch('coupon_rule.recurring')?.days_of_week ?? [])
                    .map(day => ['日', '一', '二', '三', '四', '五', '六'][day])
                    .join('、')}
                  {(() => {
                    const timeRange = form.watch('coupon_rule.recurring')?.time_ranges?.[0];
                    return timeRange ? ` ${timeRange}` : ' 00:00-24:00';
                  })()}
                </div>
              )}
            </div>
          </div>
        );

      case 'amount':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">满减规则设置</h3>
            <div className="space-y-4">
              {form.watch('coupon_rule.tiers')?.map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`coupon_rule.tiers.${index}.min_amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>满额条件</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            min={0}
                            step={0.01}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`coupon_rule.tiers.${index}.discount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优惠金额</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            min={0}
                            step={0.01}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentTiers = form.getValues('coupon_rule.tiers') || [];
                  form.setValue('coupon_rule.tiers', [
                    ...currentTiers,
                    { min_amount: 0, discount: 0 }
                  ]);
                }}
              >
                添加满减阶梯
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? '编辑优惠券' : '创建优惠券'}</DialogTitle>
          <DialogDescription>
            填写以下表单创建或更新优惠券，包括基本信息和使用规则。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 基本信息 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名称</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="优惠券名称" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>优惠券类型</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择优惠券类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(couponTypeNames).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch('type') !== 'amount' && (
              <>
                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>折扣类型</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="fixed" />
                            </FormControl>
                            <FormLabel className="font-normal">固定金额</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="percentage" />
                            </FormControl>
                            <FormLabel className="font-normal">百分比折扣</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优惠值</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input 
                              type="number" 
                              {...field} 
                              min={0} 
                              step={form.watch('discount_type') === 'percentage' ? 1 : 0.01}
                            />
                            <span className="ml-2">
                              {form.watch('discount_type') === 'fixed' ? '元' : '%'}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            
            {/* 满减券的隐藏字段 */}
            {form.watch('type') === 'amount' && (
              <>
                <input 
                  type="hidden" 
                  {...form.register('discount_type')}
                  value="fixed" 
                />
                <input 
                  type="hidden" 
                  {...form.register('value', { valueAsNumber: true })}
                  value="0"
                />
              </>
            )}
            
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>结束日期</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "yyyy-MM-dd")
                          ) : (
                            <span>选择日期</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      激活状态
                    </FormLabel>
                    <FormDescription>
                      优惠券是否处于激活状态可以使用
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
            
            {/* 规则设置区域 */}
            {renderRuleFields()}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存优惠券'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 