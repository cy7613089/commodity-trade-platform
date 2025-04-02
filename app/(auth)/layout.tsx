import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "认证 - 商品交易平台",
  description: "登录或注册商品交易平台账户",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {children}
    </div>
  );
} 