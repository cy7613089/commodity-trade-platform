'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { CouponColumns } from '@/components/admin/coupon/coupon-columns'
import { CouponFormDialog } from '@/components/admin/coupon/coupon-form-dialog'
import { Icons } from '@/components/icons'
import { Coupon } from '@/types'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [open, setOpen] = useState(false)

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

  // 初始加载
  useEffect(() => {
    fetchCoupons()
  }, [])

  // 创建新优惠券
  const handleCreateCoupon = () => {
    setSelectedCoupon(null)
    setOpen(true)
  }

  // 编辑优惠券
  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setOpen(true)
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="优惠券管理"
          description="管理系统中的所有优惠券"
        />
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
        open={open}
        onOpenChange={setOpen}
        coupon={selectedCoupon}
        onSaved={fetchCoupons}
      />
    </div>
  )
} 