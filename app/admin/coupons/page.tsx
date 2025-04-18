'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CouponColumns } from '@/components/admin/coupon/coupon-columns'
import { CouponFormDialog } from '@/components/admin/coupon/coupon-form-dialog'
import { Icons } from '@/components/icons'
import { Coupon } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StackingRuleFormDialog } from '@/components/admin/coupon/stacking-rule-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// 优惠券项类型
interface CouponOrderItem {
  id: string;
  name?: string;
  type?: string;
}

// 叠加规则类型 (Ensure this matches types/supabase.ts if generated)
interface StackingRule {
  id: string;
  name: string | null;
  description: string | null;
  rule_type: 'ALLOW' | 'DISALLOW';
  coupon_ids: string[];
  is_active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// 可排序的优惠券项组件
function SortableCouponItem({ id, item, index, coupons, onRemove }: {
  id: string;
  item: CouponOrderItem;
  index: number;
  coupons: Coupon[];
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  const coupon = coupons.find(c => c.id === item.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-3 border rounded-md bg-background touch-none"
    >
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-6 text-center cursor-grab">{index + 1}</div>
        <div>{item.name || '未知优惠券'}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {coupon ? (coupon.type === 'product' ? '商品券' :
                   coupon.type === 'time' ? '限时券' :
                   coupon.type === 'amount' ? '满减券' : '未知类型') : ''}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => {
            e.stopPropagation();
            onRemove(item.id); 
          }}
          className="h-8 w-8 rounded-full"
        >
          <Icons.close className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  // 主tab页切换状态
  const [activeTab, setActiveTab] = useState('coupons')
  // 规则管理子tab切换状态
  const [activeRuleTab, setActiveRuleTab] = useState('stacking')

  // 优惠券管理页状态
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [openCouponDialog, setOpenCouponDialog] = useState(false)

  // --- New States for Stacking Rules ---
  const [stackingRules, setStackingRules] = useState<StackingRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false); // Reuse or rename if needed
  const [editingRule, setEditingRule] = useState<StackingRule | null>(null);
  const [openRuleDialog, setOpenRuleDialog] = useState(false);
  const [ruleTypeToEdit, setRuleTypeToEdit] = useState<'ALLOW' | 'DISALLOW'>('ALLOW');
  const [ruleToDelete, setRuleToDelete] = useState<StackingRule | null>(null);
  // --- End New States ---

  // 动态规则管理页状态
  const [maxPercentage, setMaxPercentage] = useState(50)
  const [maxPercentageEnabled, setMaxPercentageEnabled] = useState(false)
  const [maxAmount, setMaxAmount] = useState(100)
  const [maxAmountEnabled, setMaxAmountEnabled] = useState(false)
  const [applicationOrder, setApplicationOrder] = useState<CouponOrderItem[]>([])

  // 获取优惠券列表
  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coupons')
      
      if (!response.ok) {
        throw new Error('获取优惠券列表失败')
      }
      
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('获取优惠券列表失败')
    } finally {
      setLoading(false)
    }
  }

  // Fetch Stacking Rules
  const fetchStackingRules = async () => {
    try {
      setLoadingRules(true);
      const response = await fetch('/api/admin/coupons/stacking-rules');
      if (!response.ok) {
        throw new Error('获取叠加规则失败');
      }
      const data = await response.json();
      setStackingRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching stacking rules:', error);
      toast.error('获取叠加规则失败');
      setStackingRules([]); // Ensure state is array on error
    } finally {
      setLoadingRules(false);
    }
  };

  // 获取优惠上限设置
  const fetchLimits = async () => {
    try {
      setLoadingRules(true)
      const response = await fetch('/api/admin/coupons/settings')
      
      if (!response.ok) {
        throw new Error('获取优惠上限设置失败')
      }
      
      const data = await response.json()
      if (data.settings) {
        setMaxPercentage(data.settings.max_percentage || 50)
        setMaxPercentageEnabled(data.settings.max_percentage_enabled || false)
        setMaxAmount(data.settings.max_amount || 100)
        setMaxAmountEnabled(data.settings.max_amount_enabled || false)
      }
    } catch (error) {
      console.error('Error fetching limits:', error)
      // 使用默认值
    } finally {
      setLoadingRules(false)
    }
  }

  // 获取优惠券应用顺序
  const fetchApplicationOrder = async () => {
    try {
      setLoadingRules(true)
      const response = await fetch('/api/admin/coupons/application-order')
      
      if (!response.ok) {
        throw new Error('获取优惠券应用顺序失败')
      }
      
      const data = await response.json()
      // Log the raw API response
      console.log('API Response for application order:', data);
      
      const orderFromApi = data.applicationOrder || [];
      // Log the value being set to state
      console.log('Setting applicationOrder state to:', orderFromApi);
      
      // 直接使用 API 返回的 applicationOrder 数组
      setApplicationOrder(orderFromApi); 

    } catch (error) {
      console.error('Error fetching application order:', error)
      // 使用空数组
      setApplicationOrder([])
    } finally {
      setLoadingRules(false)
    }
  }

  // 保存优惠上限设置
  const saveLimits = async () => {
    try {
      const response = await fetch('/api/admin/coupons/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_percentage_enabled: maxPercentageEnabled,
          max_percentage: maxPercentage,
          max_amount_enabled: maxAmountEnabled,
          max_amount: maxAmount,
        }),
      })
      
      if (!response.ok) {
        throw new Error('保存优惠上限设置失败')
      }
      
      toast.success('优惠上限设置已保存')
    } catch (error) {
      console.error('Error saving limits:', error)
      toast.error('保存优惠上限设置失败')
    }
  }

  // 保存优惠券应用顺序
  const saveApplicationOrder = async () => {
    try {
      // 直接发送前端状态中的 applicationOrder 数组
      // const orderToSave = applicationOrder.map((item, index) => ({
      //   type: item.type || 'unknown', // 使用内部标识符
      //   order: index + 1
      // }));
      
      const response = await fetch('/api/admin/coupons/application-order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 发送原始的 applicationOrder 状态数组
          applicationOrder: applicationOrder, 
        }),
      })
      
      if (!response.ok) {
        throw new Error('保存优惠券应用顺序失败')
      }
      
      toast.success('优惠券应用顺序已保存')
    } catch (error) {
      console.error('Error saving application order:', error)
      toast.error('保存优惠券应用顺序失败')
    }
  }

  // 使用 dnd-kit 的传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // dnd-kit 的拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setApplicationOrder((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return items; // 如果找不到项目，不进行操作
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // 初始加载
  useEffect(() => {
    fetchCoupons()
  }, [])

  // Fetch data based on active tabs
  useEffect(() => {
    // Fetch coupons initially or when coupon tab is active
    if (activeTab === 'coupons' || !coupons.length) {
      fetchCoupons();
    }
    
    // Fetch rules when rules tab is active
    if (activeTab === 'rules') {
      if (activeRuleTab === 'stacking') {
        fetchStackingRules();
      } else if (activeRuleTab === 'limits') {
        fetchLimits();
      } else if (activeRuleTab === 'order') {
        // Ensure coupons are fetched for the selector
        if (!coupons.length) fetchCoupons(); 
        fetchApplicationOrder();
      }
    }
  }, [activeTab, activeRuleTab]); // Removed coupons.length dependency from here

  // 创建新优惠券
  const handleCreateCoupon = () => {
    setSelectedCoupon(null)
    setOpenCouponDialog(true)
  }

  // 编辑优惠券
  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setOpenCouponDialog(true)
  }

  // 删除优惠券
  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('删除优惠券失败')
      }
      
      toast.success('优惠券已删除')
      fetchCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('删除优惠券失败')
    }
  }

  // 移除已选择的优惠券
  const handleRemoveOrderItem = (id: string) => {
    setApplicationOrder(applicationOrder.filter(item => item.id !== id));
  }

  // --- New Handlers for Stacking Rules ---
  const handleCreateRule = (type: 'ALLOW' | 'DISALLOW') => {
    setEditingRule(null);
    setRuleTypeToEdit(type);
    setOpenRuleDialog(true);
  };

  const handleEditRule = (rule: StackingRule) => {
    setEditingRule(rule);
    setRuleTypeToEdit(rule.rule_type);
    setOpenRuleDialog(true);
  };

  const handleSaveRule = async (ruleData: Partial<StackingRule>) => {
    const isEditing = !!editingRule?.id;
    const url = isEditing ? `/api/admin/coupons/stacking-rules/${editingRule.id}` : '/api/admin/coupons/stacking-rules';
    const method = isEditing ? 'PUT' : 'POST';

    // Ensure rule_type is included for new rules
    const payload = isEditing ? ruleData : { ...ruleData, rule_type: ruleTypeToEdit };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isEditing ? '更新规则失败' : '创建规则失败'));
      }

      toast.success(isEditing ? '叠加规则已更新' : '叠加规则已创建');
      setOpenRuleDialog(false);
      fetchStackingRules(); // Refresh the list
    } catch (error) {
      console.error('Error saving stacking rule:', error);
      toast.error(error instanceof Error ? error.message : '保存规则失败');
    }
  };

  const handleDeleteRuleConfirm = async () => {
    if (!ruleToDelete) return;
    try {
      const response = await fetch(`/api/admin/coupons/stacking-rules/${ruleToDelete.id}`, {
        method: 'DELETE',
      });

      // DELETE returns 204 No Content on success
      if (!response.ok && response.status !== 204) { 
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default empty
        throw new Error(errorData.error || '删除规则失败');
      }

      toast.success('叠加规则已删除');
      setRuleToDelete(null); // Close confirmation
      fetchStackingRules(); // Refresh the list
    } catch (error) {
      console.error('Error deleting stacking rule:', error);
      toast.error(error instanceof Error ? error.message : '删除规则失败');
      setRuleToDelete(null); // Close confirmation even on error
    }
  };
  // --- End New Handlers ---

  // 渲染优惠券列表页面
  const renderCouponsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Heading
            title="优惠券管理"
            description="管理系统中的所有优惠券"
          />
        </div>
        <Button onClick={handleCreateCoupon}>
          <Icons.add className="mr-2 h-4 w-4" />
          添加优惠券
        </Button>
      </div>
      <Separator />
      
      <DataTable
        columns={CouponColumns({
          onEdit: handleEditCoupon,
          onDelete: handleDeleteCoupon,
        })}
        data={coupons}
        isLoading={loading}
        searchKey="name"
        searchPlaceholder="搜索优惠券名称..."
      />
      
      <CouponFormDialog
        open={openCouponDialog}
        onOpenChange={setOpenCouponDialog}
        coupon={selectedCoupon}
        onSaved={fetchCoupons}
      />
    </div>
  )

  // Render Stacking Rules Tab
  const renderStackingRulesTab = () => {
    const allowRules = stackingRules.filter(rule => rule.rule_type === 'ALLOW');
    const disallowRules = stackingRules.filter(rule => rule.rule_type === 'DISALLOW');

    const renderRuleList = (rules: StackingRule[]) => {
      if (loadingRules) {
        return <div className="text-center py-4 text-muted-foreground">加载中...</div>;
      }
      if (rules.length === 0) {
        return <div className="text-center py-4 text-muted-foreground">暂无规则，请点击上方按钮添加。</div>;
      }
      return (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="overflow-hidden">
              <CardContent className="p-4 flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <p className="font-semibold">{rule.name || '未命名规则'}</p>
                  {rule.description && <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>}
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">涉及的优惠券:</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.coupon_ids.length > 0 ? rule.coupon_ids.map(couponId => {
                        const coupon = coupons.find(c => c.id === couponId);
                        return (
                          <Badge key={couponId} variant="secondary">
                            {coupon ? coupon.name : `ID: ${couponId.substring(0, 6)}...`}
                          </Badge>
                        );
                      }) : <span className="text-xs text-muted-foreground">无</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                  <Switch 
                     checked={!!rule.is_active}
                     onCheckedChange={(checked) => handleSaveRule({ id: rule.id, is_active: checked })} // Quick toggle
                     className="mb-2"
                  />
                  <div className="flex space-x-1">
                     <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                       <Icons.edit className="h-3 w-3 mr-1" /> 编辑
                     </Button>
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm" onClick={() => setRuleToDelete(rule)}>
                           <Icons.delete className="h-3 w-3 mr-1" /> 删除
                         </Button>
                       </AlertDialogTrigger>
                       {/* Content defined later */}
                     </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <Heading
          title="叠加规则配置"
          description="设置哪些优惠券可以一起使用，哪些不能一起使用"
        />
        <Separator />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ALLOW Rules Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>可叠加规则 (ALLOW)</CardTitle>
                <CardDescription>这些规则定义了哪些优惠券可以组合使用。</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleCreateRule('ALLOW')}>
                <Icons.add className="mr-2 h-4 w-4" /> 添加规则
              </Button>
            </CardHeader>
            <CardContent>
              {renderRuleList(allowRules)}
            </CardContent>
          </Card>

          {/* DISALLOW Rules Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>不可叠加规则 (DISALLOW)</CardTitle>
                <CardDescription>这些规则定义了哪些优惠券不能同时使用。</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleCreateRule('DISALLOW')}>
                 <Icons.add className="mr-2 h-4 w-4" /> 添加规则
              </Button>
            </CardHeader>
            <CardContent>
              {renderRuleList(disallowRules)}
            </CardContent>
          </Card>
        </div>

        {/* Form Dialog */}
        <StackingRuleFormDialog
          open={openRuleDialog}
          onOpenChange={setOpenRuleDialog}
          ruleToEdit={editingRule}
          ruleType={ruleTypeToEdit}
          onSuccess={fetchStackingRules}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!ruleToDelete} onOpenChange={() => setRuleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除叠加规则?</AlertDialogTitle>
              <AlertDialogDescription>
                此操作无法撤销。确定要删除规则 &quot;{ruleToDelete?.name || '此规则'}&quot; 吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRuleConfirm}>确认删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  // 渲染优惠上限设置页面
  const renderLimitsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="优惠上限设置"
          description="设置订单的最大优惠比例或金额"
        />
        <Button onClick={saveLimits}>保存设置</Button>
      </div>
      <Separator />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>全局优惠限制</CardTitle>
          <CardDescription>
            设置订单可享受的最大优惠比例和金额
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">最大优惠比例</Label>
              <p className="text-sm text-muted-foreground">
                启用后，订单最多可享受订单金额的一定比例作为优惠
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24">
                <Input
                  type="number"
                  value={maxPercentage}
                  onChange={(e) => setMaxPercentage(parseFloat(e.target.value) || 0)}
                  disabled={!maxPercentageEnabled}
                  min={0}
                  max={100}
                />
              </div>
              <div className="w-12 text-center">%</div>
              <Switch
                checked={maxPercentageEnabled}
                onCheckedChange={setMaxPercentageEnabled}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">最大优惠金额</Label>
              <p className="text-sm text-muted-foreground">
                启用后，订单最多可享受固定金额的优惠
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24">
                <Input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(parseFloat(e.target.value) || 0)}
                  disabled={!maxAmountEnabled}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="w-12 text-center">元</div>
              <Switch
                checked={maxAmountEnabled}
                onCheckedChange={setMaxAmountEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 渲染优先级和计算顺序页面 - 使用 dnd-kit
  const renderOrderTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="优先级和计算顺序"
          description="设置多个优惠券的应用顺序"
        />
        <Button 
          onClick={saveApplicationOrder} 
          disabled={applicationOrder.length === 0}
        >
          保存顺序
        </Button>
      </div>
      <Separator />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>优惠券应用顺序</CardTitle>
          <CardDescription>
            拖拽下方的优惠券来设置它们的应用顺序，顺序靠前的优惠券会先被应用
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRules ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="space-y-6">
              {/* 优惠券选择器 - 始终显示 */}
              <div className="p-4 border rounded-lg space-y-2">
                <Label>选择要添加的优惠券</Label>
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (!applicationOrder.some(item => item.id === value)) {
                        const coupon = coupons.find(c => c.id === value);
                        setApplicationOrder([...applicationOrder, {
                          id: value,
                          name: coupon?.name || '未知优惠券',
                          type: coupon?.type || 'unknown'
                        }]);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择优惠券" />
                    </SelectTrigger>
                    <SelectContent>
                      {coupons
                        .filter(coupon => !applicationOrder.some(item => item.id === coupon.id))
                        .map((coupon) => (
                          <SelectItem key={coupon.id} value={coupon.id!}>
                            {coupon.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {applicationOrder.length > 0 && (
                    <Button variant="outline" onClick={() => setApplicationOrder([])}>
                      清空
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 优惠券拖拽排序区域 - 使用 dnd-kit */} 
              {applicationOrder.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">已选择的优惠券 ({applicationOrder.length})</h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={applicationOrder.map(item => item.id)} // 传递 ID 数组
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {applicationOrder.map((item, index) => (
                          <SortableCouponItem
                            key={item.id}
                            id={item.id}
                            item={item}
                            index={index}
                            coupons={coupons}
                            onRemove={handleRemoveOrderItem}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  暂无优惠券应用顺序，请从上方选择优惠券添加
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 渲染规则管理页面
  const renderRulesTab = () => (
    <div className="space-y-4">
      <div>
        <Heading
          title="动态规则管理"
          description="配置优惠券的叠加规则、上限和应用顺序"
        />
      </div>
      <Tabs value={activeRuleTab} onValueChange={setActiveRuleTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="stacking">叠加规则配置</TabsTrigger>
          <TabsTrigger value="limits">优惠上限设置</TabsTrigger>
          <TabsTrigger value="order">优先级和计算顺序</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="stacking">
            {renderStackingRulesTab()}
          </TabsContent>
          <TabsContent value="limits">
            {renderLimitsTab()}
          </TabsContent>
          <TabsContent value="order">
            {renderOrderTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="coupons">优惠券管理</TabsTrigger>
          <TabsTrigger value="rules">动态规则管理</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="coupons">
            {renderCouponsTab()}
          </TabsContent>
          <TabsContent value="rules">
            {renderRulesTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 