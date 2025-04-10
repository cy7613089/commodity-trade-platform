import { Metadata } from "next";
import { CouponApplicationOrder } from "@/components/admin/coupon/coupon-application-order";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponGlobalSettings } from "@/components/admin/coupon/coupon-global-settings";

export const metadata: Metadata = {
  title: "优惠券设置 | 优惠券管理",
  description: "管理优惠券全局设置和应用顺序",
};

export default function CouponSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">优惠券设置</h1>
          <p className="text-muted-foreground mt-1">管理优惠券全局设置和应用顺序</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/coupons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回优惠券列表
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="global-settings">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="global-settings">全局设置</TabsTrigger>
          <TabsTrigger value="application-order">应用顺序</TabsTrigger>
        </TabsList>
        <TabsContent value="global-settings" className="mt-6">
          <CouponGlobalSettings />
        </TabsContent>
        <TabsContent value="application-order" className="mt-6">
          <CouponApplicationOrder />
        </TabsContent>
      </Tabs>
    </div>
  );
} 