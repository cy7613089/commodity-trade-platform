import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

export default function RegisterConfirmPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 text-card-foreground shadow-lg">
        <div className="flex flex-col items-center text-center">
          <MailCheck className="mb-4 h-16 w-16 text-green-500" />
          <h1 className="text-3xl font-bold">注册成功！</h1>
          <p className="mt-3 text-muted-foreground">
            我们已发送确认邮件至您的邮箱。
          </p>
          <p className="mt-1 font-medium text-primary">
            请检查您的收件箱（包括垃圾邮件箱）并点击确认链接以激活您的账户。
          </p>
        </div>
        
        <div className="mt-6 flex flex-col items-center space-y-3">
           <p className="text-sm text-muted-foreground">
            确认邮箱后即可登录。
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">前往登录页面</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 