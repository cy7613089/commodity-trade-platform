'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Coupon, CouponType } from '@/types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

// 定义优惠券类型与中文描述的映射
const couponTypeMap: Record<CouponType, string> = {
  'product': '商品券',
  'time': '限时券',
  'amount': '满减券'
};

interface CouponColumnsProps {
  onEdit: (coupon: Coupon) => void
  onDelete: (couponId: string) => void
}

export function CouponColumns({ onEdit, onDelete }: CouponColumnsProps): ColumnDef<Coupon>[] {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  const handleDeleteClick = (coupon: Coupon) => {
    setDeletingCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingCoupon?.id) {
      onDelete(deletingCoupon.id);
    }
    setIsDeleteDialogOpen(false);
    setDeletingCoupon(null);
  };

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          名称
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = row.getValue('type') as CouponType
        return <div>{couponTypeMap[type] || type}</div>
      },
    },
    {
      accessorKey: 'discount_type',
      header: '折扣类型',
      cell: ({ row }) => {
        const type = row.getValue('discount_type') as 'fixed' | 'percentage'
        return <div>{type === 'fixed' ? '固定金额' : '百分比折扣'}</div>
      },
    },
    {
      accessorKey: 'value',
      header: '优惠值',
      cell: ({ row }) => {
        const coupon = row.original
        const value = parseFloat(row.getValue('value') as string) 
        return (
          <div>
            {coupon.discount_type === 'fixed' 
              ? `¥${value.toFixed(2)}`
              : `${value}%`
            }
          </div>
        )
      },
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      cell: ({ row }) => {
        const dateValue = row.getValue('end_date')
        const formatted = dateValue
          ? format(new Date(dateValue as string), 'yyyy-MM-dd')
          : '-'
        return <div>{formatted}</div>
      },
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? '激活' : '未激活'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const coupon = row.original
        
        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">操作菜单</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(coupon)}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteClick(coupon)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除优惠券</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要删除优惠券 &quot;{deletingCoupon?.name}&quot; 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <Button 
                    variant="destructive" 
                    onClick={handleConfirmDelete}
                  >
                    确认删除
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )
      },
    },
  ]
} 