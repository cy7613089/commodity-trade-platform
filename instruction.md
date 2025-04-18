# 项目概览

你需要设计一个线上商品交易平台，用户可以在平台上浏览商品、购买商品、管理订单。管理员可以通过管理后台管理商品和订单。支付功能通过mock方式实现，无需对接真实支付接口。为了提升业务复杂度和用户体验，平台引入了增强型的优惠券模块，新增多种功能和规则。

你是一名精通Next.js 14的高级全栈工程师，拥有20年的Web开发经验，在该项目中会使用 Next.js 14、shadcn、tailwind、Lucid icon，后端数据库使用 Supabase。

# 目标要求

- 设计一个完整的线上商品交易平台，集成上述增强型优惠券模块。
- 确保优惠券功能支持灵活的配置（如类型、规则、计算顺序）和用户友好的体验。
- 系统需具备可扩展性，能够应对未来新增的优惠券类型或规则。

# 核心功能

## 1. 前端功能
### 1.1 用户界面
#### 1.1.1 商品展示页面
- **商品列表页**：
  - 使用响应式网格布局展示商品，支持多种视图模式（卡片、列表）
  - 每个商品卡片显示图片、名称、价格、评分和简短描述
  - 支持分页功能，每页默认显示10个商品
  - 使用shadcn的Card、AspectRatio组件构建商品卡片
  - 实现分页导航

- **商品详情页**：
  - 展示商品完整信息，包括多张图片、详细描述、规格参数
  - 图片展示区支持轮播功能（使用Carousel组件）
  - 提供数量选择器和"加入购物车"按钮
  - 显示相关推荐商品
  - 产品评价区域，展示用户评价和评分

#### 1.1.2 购物车页面
- 列表展示已添加商品，包括商品图片、名称、单价、数量、小计
- 支持修改商品数量、删除商品
- 实时计算总价格，并显示折扣信息
- 优惠券选择区域，可应用多张优惠券
- 结算按钮引导至结算页面
- 使用Table组件实现购物车列表，便于数据管理

#### 1.1.3 订单管理页面
- 订单列表展示所有历史订单
- 每个订单显示订单号、日期、总金额、支付状态、发货状态
- 订单详情展示包含的商品、收货地址、支付方式等信息
- 支持按状态筛选订单（待付款、待发货、已发货、已完成）
- 提供取消订单、确认收货等操作按钮
- 使用Tabs组件分类显示不同状态的订单

#### 1.1.4 个人中心页面
- 用户基本信息展示和编辑功能
- 收货地址管理（增加、编辑、删除、设为默认）
- 账户安全设置（修改密码等）
- 个人订单数据统计和快速入口
- 使用Form组件实现信息编辑表单

### 1.2 功能实现
#### 1.2.1 浏览和搜索商品
- **分类导航**：
  - 顶部导航栏显示主要商品分类
  - 侧边栏提供多级分类导航
  - 使用DropdownMenu组件实现分类下拉菜单

- **搜索功能**：
  - 顶部搜索框支持模糊搜索和精确搜索
  - 自动补全功能，提供热门搜索词
  - 搜索结果页支持高级筛选（价格区间、品牌、评分等）
  - 搜索历史记录功能
  - 使用Combobox组件实现搜索框自动补全

- **商品筛选**：
  - 价格区间筛选（使用Slider组件）
  - 品牌、类别多选筛选（使用Checkbox组件）
  - 评分筛选（使用RadioGroup组件）
  - 排序选项（价格升序/降序、销量、新品等）
  - 筛选结果实时更新

#### 1.2.2 购物车与下单
- **加入购物车**：
  - 支持从商品列表页和详情页添加商品
  - 数量选择功能
  - 加入成功时显示确认信息（使用Sonner组件）
  - 支持快速查看购物车内容

- **购物车管理**：
  - 商品数量调整、删除功能
  - 商品库存实时检查
  - 选择/取消选择商品进行结算
  - 清空购物车功能

- **结算流程**：
  - 确认订单信息（商品、数量、金额）
  - 选择收货地址或添加新地址
  - 选择支付方式
  - 应用优惠券
  - 提交订单

#### 1.2.3 支付功能（Mock）
- 提供多种支付方式选择（信用卡、支付宝、微信支付等）的UI界面
- 模拟支付处理流程，无需实际对接支付接口
- 支付成功/失败状态处理
- 订单状态自动更新
- 使用Dialog组件实现支付确认弹窗

#### 1.2.4 订单历史管理
- 分页展示历史订单列表
- 详细订单信息查看
- 订单状态跟踪显示（使用Badge组件标识不同状态）
- 订单搜索和筛选功能
- 订单取消和退款申请流程

## 2. 后端功能
### 2.1 API服务
#### 2.1.1 商品管理API
- `/api/products`：获取商品列表，支持分页、排序和筛选
- `/api/products/[id]`：获取单个商品详细信息
- `/api/products/search`：商品搜索API，支持关键词、分类、价格区间等筛选
- 使用Next.js的Server Actions实现数据获取和缓存
- 使用Supabase数据库存储和查询商品数据

#### 2.1.2 用户管理API
- `/api/auth/register`：用户注册
- `/api/auth/login`：用户登录
- `/api/auth/logout`：用户登出
- `/api/user/profile`：获取和更新用户资料
- `/api/user/addresses`：管理用户收货地址
- 集成Supabase Authentication进行用户身份验证
- 使用Middleware实现路由保护和权限控制

#### 2.1.3 订单管理API
- `/api/orders`：创建订单和获取订单列表
- `/api/orders/[id]`：获取、更新单个订单信息
- `/api/orders/user/[userId]`：获取特定用户的订单历史
- `/api/payment/process`：处理支付请求（模拟）
- `/api/payment/callback`：支付回调处理（模拟）
- 使用Server Actions实现事务处理和状态更新
- 实时库存检查和更新机制

#### 2.1.4 购物车管理API
- `/api/cart`(GET)：获取当前用户的购物车及所有商品
- `/api/cart`(DELETE)：清空当前用户的购物车
- `/api/cart/items`：添加商品到购物车
- `/api/cart/items/[id]`(PUT/DELETE)：更新或删除购物车中的商品
- `/api/cart/items/select`：批量选择或取消选择购物车商品
- 与用户认证集成，确保每个用户访问自己的购物车
- 实时库存检查与数量限制
- 支持商品价格与折扣实时计算

#### 2.1.5 优惠券管理API
- `/api/coupons`：获取优惠券列表，支持分页、排序和筛选（优惠券类型、状态等）
- `/api/coupons/[id]`：获取、更新或删除单个优惠券详细信息
- `/api/coupons/search`：根据优惠券代码、名称或描述搜索优惠券
- `/api/coupon-rules`：获取或创建优惠券规则
- `/api/coupon-rules/[id]`：获取、更新或删除单个优惠券规则
- `/api/coupon-rules/coupon/[couponId]`：获取指定优惠券的所有规则
- `/api/coupon-stacking`：获取或设置优惠券叠加规则
- `/api/coupon-settings`：获取或更新全局优惠券设置（如最大优惠比例、最大优惠金额）
- `/api/coupon-application-order`：获取或设置优惠券应用顺序
- `/api/user-coupons`：获取当前用户的所有优惠券
- `/api/user-coupons/[id]`：获取、更新特定用户优惠券（如标记为已使用）
- `/api/user-coupons/assign`：为用户分配优惠券
- `/api/user-coupons/calculate`：计算应用特定优惠券组合的优惠金额
- `/api/user-coupons/applicable`：获取对特定订单可用的优惠券列表
- `/api/admin/coupons/batch`：管理员批量操作优惠券（创建、激活、停用）
- `/api/admin/user-coupons`：管理员管理用户优惠券（查询、分配、撤销）
- `/api/admin/coupons/stacking-rules/check`：管理员检查多个优惠券是否可以叠加使用，基于系统中定义的ALLOW和DISALLOW规则
- `/api/coupons/stacking-check`：用户端检查所选优惠券是否可以叠加使用，验证优惠券所有权并提供友好的错误消息
- 使用Next.js 14的路由处理程序处理API请求
- 利用Server Actions进行数据验证和处理
- 集成Supabase数据库进行优惠券数据的存储和查询
- 实现优惠券计算逻辑，支持多种优惠券类型和规则
- 使用事务确保优惠券状态更新的原子性（特别是优惠券使用时）
- 实现安全机制防止优惠券滥用，包括频率限制和服务器端验证

### 2.2 数据库设计
#### 2.2.1 Supabase安装与配置

##### 安装Supabase相关包
要在Next.js项目中使用Supabase，需要安装以下npm包：

```bash
# 安装Supabase客户端和Auth Helpers
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs --legacy-peer-deps

# 如需使用Supabase Auth UI组件
npm install @supabase/auth-ui-react @supabase/auth-ui-shared --legacy-peer-deps
```

> 注意：由于可能存在的依赖冲突，我们使用`--legacy-peer-deps`标志进行安装。

##### 环境变量配置
创建或编辑`.env.local`文件，添加以下环境变量:

```
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> 注意：`NEXT_PUBLIC_`前缀的环境变量可在客户端和服务器端访问，而其他变量仅在服务器端可用。`SUPABASE_SERVICE_ROLE_KEY`具有管理员权限，应妥善保管。

##### Supabase客户端配置
在`lib/db.ts`文件中创建和配置Supabase客户端:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // 类型定义

// 检查环境变量是否存在
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// 创建Supabase客户端 - 可在客户端和服务器端使用
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 创建带管理员权限的客户端（仅在服务器端使用）
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

##### 配置中间件
在项目根目录创建`middleware.ts`文件，用于处理认证:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 刷新会话以确保最新的auth状态
  await supabase.auth.getSession();
  
  return res;
}

// 指定中间件应用于的路由
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/auth).*)',
  ],
};
```

##### 创建Supabase上下文提供者
创建`components/providers/supabase-provider.tsx`文件，为应用提供Supabase上下文:

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClientComponentClient<Database>());

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      // 可以在这里处理身份验证状态变化
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
};
```

##### 配置根布局
更新`app/layout.tsx`文件，添加Supabase提供者:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import SupabaseProvider from "@/components/providers/supabase-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

##### 创建认证相关帮助函数
创建`lib/auth.ts`文件，提供认证相关的帮助函数:

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function getUserSession() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const session = await getUserSession();
  if (!session) return null;
  
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isUserLoggedIn() {
  const session = await getUserSession();
  return !!session;
}

export async function signOut() {
  const supabase = createServerComponentClient<Database>({ cookies });
  await supabase.auth.signOut();
}
```

#### 2.2.2 详细数据表结构

##### products 表（商品表）
```
商品基本信息表
- id: uuid PRIMARY KEY (使用 Supabase 自动生成的 UUID)
- name: text NOT NULL (商品名称)
- slug: text UNIQUE NOT NULL (URL友好的商品标识)
- description: text (商品描述)
- price: decimal(10,2) NOT NULL (商品价格)
- originalPrice: decimal(10,2) (原价，用于显示折扣)
- stock: integer NOT NULL (库存数量)
- images: jsonb (商品图片路径数组 ['url1', 'url2', ...])
- specs: jsonb (商品规格参数，JSON格式)
- rating: numeric(2,1) DEFAULT 0 (商品评分，1-5分)
- reviewCount: integer DEFAULT 0 (评价数量)
- is_featured: boolean DEFAULT false (是否为推荐商品)
- status: text DEFAULT 'active' (商品状态：active/inactive)
- created_at: timestamptz DEFAULT now() (创建时间)
- updated_at: timestamptz DEFAULT now() (更新时间)
```

##### users 表（用户表）
```
用户信息表 (与 Supabase Auth 集成)
- id: uuid PRIMARY KEY (与 Supabase Auth 用户ID保持一致)
- email: text UNIQUE NOT NULL (邮箱，与 Auth 一致)
- name: text (用户名)
- phone: text (电话号码)
- avatar: text (头像URL)
- role: text DEFAULT 'customer' (用户角色: customer/admin)
- email_verified: boolean DEFAULT false (邮箱是否已验证)
- auth_provider: text DEFAULT 'email' (认证提供商: email/google/facebook等)
- created_at: timestamptz DEFAULT now()
- last_login: timestamptz
```

##### addresses 表（地址表）
```
用户收货地址表
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE (用户ID)
- recipient_name: text NOT NULL (收件人姓名)
- phone: text NOT NULL (联系电话)
- province: text NOT NULL (省份)
- city: text NOT NULL (城市)
- district: text (区县)
- street: text NOT NULL (街道地址)
- address: text NOT NULL (完整地址，包含省市区街道)
- postal_code: text (邮政编码)
- is_default: boolean DEFAULT false (是否默认地址)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### orders 表（订单主表）
```
订单主表
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) (用户ID)
- order_number: text UNIQUE NOT NULL (订单编号，便于查询)
- total_amount: decimal(10,2) NOT NULL (订单总金额)
- discount_amount: decimal(10,2) DEFAULT 0 (优惠金额)
- final_amount: decimal(10,2) NOT NULL (最终支付金额)
- status: text NOT NULL (订单状态：PENDING_PAYMENT/PENDING_SHIPMENT/SHIPPED/COMPLETED/CANCELLED)
- payment_method: text (支付方式: alipay/wechat/creditcard/cash)
- payment_status: text DEFAULT 'unpaid' (支付状态：unpaid/paid/refunded)
- address_id: uuid REFERENCES addresses(id) (收货地址ID)
- shipping_fee: decimal(10,2) DEFAULT 0 (运费)
- notes: text (订单备注)
- created_at: timestamptz DEFAULT now() (下单时间)
- updated_at: timestamptz DEFAULT now() (更新时间)
- paid_at: timestamptz (支付时间)
- shipped_at: timestamptz (发货时间)
- delivered_at: timestamptz (送达时间)
```

##### order_items 表（订单项表）
```
订单商品明细表
- id: uuid PRIMARY KEY
- order_id: uuid REFERENCES orders(id) ON DELETE CASCADE (订单ID)
- product_id: uuid REFERENCES products(id) (商品ID)
- product_name: text NOT NULL (商品名称，存储下单时的商品名)
- product_image: text (商品图片，存储下单时的图片)
- quantity: integer NOT NULL (购买数量)
- price: decimal(10,2) NOT NULL (购买时商品单价)
- original_price: decimal(10,2) (购买时商品原价，用于计算折扣)
- subtotal: decimal(10,2) NOT NULL (小计金额)
- discount: decimal(10,2) DEFAULT 0 (该商品优惠金额)
- created_at: timestamptz DEFAULT now()
```

##### coupons 表（优惠券定义表）
```
优惠券定义表
- id: uuid PRIMARY KEY
- code: text UNIQUE NOT NULL (优惠券代码)
- name: text NOT NULL (优惠券名称)
- description: text (优惠券描述)
- type: text NOT NULL (优惠券类型：product/time/amount/combination)
- value: decimal(10,2) NOT NULL (优惠券面值)
- discount_type: text NOT NULL (折扣类型：fixed/percentage)
- min_purchase: decimal(10,2) DEFAULT 0 (最低消费金额)
- max_discount: decimal(10,2) (最大优惠金额，针对百分比折扣)
- usage_limit: integer (使用次数限制)
- end_date: timestamptz NOT NULL (有效期结束)
- is_active: boolean DEFAULT true (是否激活)
- color: text DEFAULT 'blue' (优惠券颜色标识: blue/green/purple/orange)
- icon: text (优惠券图标)
- coupon_rule: jsonb (优惠规则，JSON格式)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

以下是各种类型优惠券的规则JSON结构示例：

```
-- 商品券规则示例
{
  "product_ids": ["uuid1", "uuid2", "uuid3"],
  "min_quantity": 2
}

-- 时间券规则示例(固定日期)
{
  "time_type": "fixed",
  "fixed_dates": ["2023-11-11", "2023-12-12"],
  "time_ranges": ["09:00-18:00"]
}

-- 时间券规则示例(周期性)
{
  "time_type": "recurring",
  "recurring": {
    "days_of_week": [1, 2], // 周一、周二
    "time_ranges": ["09:00-18:00"]
  }
}

-- 满减券规则示例
{
  "tiers": [
    {"min_amount": 100, "discount": 20},
    {"min_amount": 200, "discount": 50},
    {"min_amount": 300, "discount": 80}
  ]
}
```

##### coupon_rules 表（优惠券规则表）
```
优惠券详细规则表
- id: uuid PRIMARY KEY
- coupon_id: uuid REFERENCES coupons(id) ON DELETE CASCADE (优惠券ID)
- rule_type: text NOT NULL (规则类型：product/time/amount/combination)
- rule_value: jsonb NOT NULL (具体规则值，JSON格式)
- priority: integer DEFAULT 0 (规则优先级)
- is_active: boolean DEFAULT true (是否启用该规则)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### user_coupons 表（用户优惠券表）
```
用户持有的优惠券表
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE (用户ID)
- coupon_id: uuid REFERENCES coupons(id) ON DELETE CASCADE (优惠券ID)
- status: text DEFAULT 'active' (状态：active/used/expired)
- is_used: boolean DEFAULT false (是否已使用)
- used_at: timestamptz (使用时间)
- used_order_id: uuid REFERENCES orders(id) (使用的订单ID)
- created_at: timestamptz DEFAULT now() (获得时间)
- expired_at: timestamptz (到期时间，可能与优惠券本身的过期时间不同)
```

##### coupon_stacking_rules 表（优惠券叠加规则表）
```
优惠券叠加规则表
- id: uuid PRIMARY KEY
- name: text (规则名称)
- description: text (规则描述)
- rule_type: text (规则类型: ALLOW (可叠加), DISALLOW (不可叠加))
- coupon_ids: uuid[] NOT NULL (可叠加使用的优惠券ID数组)
- is_active: boolean DEFAULT true (是否启用)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### global_coupon_settings 表（全局优惠设置表）
```
全局优惠设置表 (通常只有一条记录)
- id: uuid PRIMARY KEY
- max_percentage_enabled: boolean DEFAULT false (是否启用最大优惠比例)
- max_percentage: decimal(5,2) DEFAULT 50.00 (最大优惠比例，如50%)
- max_amount_enabled: boolean DEFAULT false (是否启用最大优惠金额)
- max_amount: decimal(10,2) DEFAULT 100.00 (最大优惠金额)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### coupon_application_order 表（优惠券应用顺序表）
```
优惠券应用顺序表
- id: uuid PRIMARY KEY
- order_config: jsonb NOT NULL (应用顺序排列的优惠券{id,name,type}对象数组，JSON格式)
- is_active: boolean DEFAULT true (是否启用)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```
order_config字段示例：
```
[
  {
    "id": "095de5e6-7e3c-47c0-907e-22596901750b",
    "name": "满减券阶梯式",
    "type": "amount"
  },
  {
    "id": "76be2a81-ec3d-425f-b47b-a19f01ef02f4",
    "name": "商品券按金额",
    "type": "product"
  },
  {
    "id": "52ea4ec3-8b27-4c1c-9f7a-ba2c138ee70a",
    "name": "商品券按比例",
    "type": "product"
  }
]
```

##### carts 表（购物车表）
```
购物车表
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE (用户ID，登录用户)
- session_id: text (会话ID，未登录用户)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### cart_items 表（购物车项表）
```
购物车商品项表
- id: uuid PRIMARY KEY
- cart_id: uuid REFERENCES carts(id) ON DELETE CASCADE (购物车ID)
- product_id: uuid REFERENCES products(id) (商品ID)
- quantity: integer NOT NULL (数量)
- selected: boolean DEFAULT true (是否选中用于结算)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### product_reviews 表（商品评价表）
```
商品评价表
- id: uuid PRIMARY KEY
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE (商品ID)
- user_id: uuid REFERENCES users(id) (用户ID)
- order_id: uuid REFERENCES orders(id) (订单ID)
- rating: integer NOT NULL (评分1-5)
- content: text (评价内容)
- images: jsonb (评价图片)
- is_anonymous: boolean DEFAULT false (是否匿名评价)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

#### 2.2.3 数据关系与索引设计

##### 表关系设计
- **一对多关系**：
  - 用户与订单：一个用户可以有多个订单
  - 用户与地址：一个用户可以有多个收货地址
  - 订单与订单项：一个订单包含多个订单项

- **多对多关系**：
  - 用户与优惠券：通过user_coupons表连接
  - 优惠券与规则：通过coupon_rules表连接

##### 索引设计
```
-- 商品表索引
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_is_featured ON products(is_featured);

-- 订单表索引
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- 用户优惠券表索引
CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);
CREATE INDEX idx_user_coupons_expired_at ON user_coupons(expired_at);

-- 购物车项索引
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- 商品评价表索引
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);

-- 优惠券规则表索引
CREATE INDEX idx_coupon_rules_coupon_id ON coupon_rules(coupon_id);
CREATE INDEX idx_coupon_rules_rule_type ON coupon_rules(rule_type);
CREATE INDEX idx_coupon_rules_priority ON coupon_rules(priority);
CREATE INDEX idx_coupon_rules_is_active ON coupon_rules(is_active);

-- 优惠券叠加规则表索引
CREATE INDEX idx_coupon_stacking_rules_is_active ON coupon_stacking_rules(is_active);
CREATE INDEX idx_coupon_stacking_rules_coupon_ids ON coupon_stacking_rules USING GIN(coupon_ids);

#### 2.2.4 数据访问策略

##### RLS（行级安全）策略
Supabase 提供了强大的行级安全性(RLS)功能，用于控制数据访问权限：

```sql
-- 用户表RLS策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看编辑自己的资料" ON users 
    FOR ALL USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);
CREATE POLICY "管理员可以查看所有用户" ON users 
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 订单表RLS策略
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的订单" ON orders 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "管理员可以查看和修改所有订单" ON orders 
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 类似策略适用于其他表...
```

#### 2.2.5 数据同步与刷新策略

##### 缓存策略
- 使用 Next.js 15 的服务器组件缓存机制缓存商品和分类数据
- 利用 Supabase 的实时订阅功能（Realtime）获取订单和购物车更新

##### 数据刷新机制
- 设置商品数据每24小时自动刷新一次
- 热门商品和首页推荐商品每6小时刷新一次
- 使用增量更新策略，只获取变更的数据

```typescript
// revalidation.json 配置示例
{
  "paths": [
    { "path": "/api/products", "interval": 86400 },    // 24小时
    { "path": "/api/products/featured", "interval": 21600 }  // 6小时
  ]
}
```

#### 2.2.6 Supabase 集成核心组件

##### 1. 数据库客户端配置
在 `lib/db.ts` 中配置 Supabase 客户端，用于所有数据库访问操作：

```
// 客户端配置示意
supabaseClient:
- 环境变量配置
- 类型安全的客户端设置
- 错误处理中间件
- 请求拦截器用于性能监控
```

##### 2. 认证集成
在 `lib/auth.ts` 中设置 Supabase Auth 相关的功能：

```
认证集成组件:
- 会话管理
- 登录/注册流程
- 权限控制
- 中间件集成
```

##### 3. 数据访问层
在 `lib/actions/` 目录中实现 Server Actions，处理数据CRUD操作：

```
Server Actions:
- product-actions.ts: 商品数据操作
- order-actions.ts: 订单处理逻辑
- coupon-actions.ts: 优惠券管理和应用逻辑
- user-actions.ts: 用户资料管理
```

##### 4. 数据迁移与Schema管理
在 `lib/supabase/migrations/` 目录管理数据库结构变更：

```
数据库迁移策略:
- 版本化的Schema定义
- 增量迁移脚本
- 回滚机制
```

## 3. 管理后台
### 3.1 管理员界面
#### 3.1.1 商品管理页面
- **商品列表**：
  - 支持分页
  - 显示商品ID、名称、图片、价格、库存、状态等信息

- **商品创建/编辑表单**：
  - 完整的商品信息表单

#### 3.1.2 订单管理页面
- **订单列表**：
  - 显示订单号、用户信息、金额、日期、状态等

### 3.2 管理功能
#### 3.2.1 商品管理功能
  - 添加、编辑、删除商品

#### 3.2.2 订单处理功能
- 订单状态更新

## 4. 优惠券系统
### 4.1 优惠券类型
#### 4.1.0 通用规则
- **功能实现**：
  - 支持设置固定金额或百分比折扣

平台支持以下4种类型的优惠券：
#### 4.1.1 商品券
- **功能实现**：
  - 支持设置多选适用于哪些特定商品
  - 支持设置最低购买数量要求（如至少买2件可用）

#### 4.1.2 时间券
- **功能实现**：
  - 支持设置固定时间段（如双十一当天）
  - 支持设置周期性时间（如每周一）
  - 时间验证逻辑在前端和后端同时实现

#### 4.1.3 满减券
- **功能实现**：
  - 支持设置订单满额减免条件（如满100元减20元）
  - 支持设置阶梯式满减规则配置（如满100元减20元，满200元减50元，满300元减80元）

#### 4.1.4 组合券
- **功能实现**：
  - 支持设置组合使用多种优惠券的优先级和限制条件，参考4.2.2

### 4.2 管理后台功能
管理后台分为'优惠券管理'和'动态规则管理'两个子页面，通过2个tab切换
#### 4.2.1 优惠券管理
- 优惠券列表，展示字段参考2.2.2中coupons表字段
- 优惠券创建按钮置于列表右上角，点击弹出表单弹框，表单字段参考2.2.2中coupons表字段和4.1中优惠券类型的设计
- 列表最后一列操作列支持编辑功能，与优惠券创建表单复用同一个弹框

#### 4.2.2 动态规则管理
动态规则管理分为以下3个子页面，通过3个tab切换
- **叠加规则配置**：
  - 分为'可叠加使用'和'不可叠加使用'两部分
  - '可叠加使用'部分支持设置哪些优惠券可以叠加使用，可以添加不止一条规则
  - '不可叠加使用'部分支持设置哪些优惠券不可以叠加使用，可以添加不止一条规则
  - 规则表单支持规则名称、描述、选择多个优惠券以及激活状态的设置
  - 提供检查API接口和Hook工具，验证多个优惠券是否可以一起使用
具体使用原则：
- 如果用户选择了一张优惠券 A，而优惠券 B 与 A 存在于同一个 DISALLOW 规则中，则 B 会被禁用。
- 如果用户选择了一张或多张优惠券（集合 S），并且存在一个 ALLOW 规则 R 包含了集合 S 中的所有优惠券：
  - 那么，任何不在规则 R 中的优惠券 C 都会被禁用（显示 "不符合当前已选组合的叠加规则"）。
  - 任何与集合 S 中某张券存在 DISALLOW 冲突的券 D 也会被禁用。
- 如果用户选择的组合 S 不被任何一个 ALLOW 规则完全包含，那么选择器不会额外根据 ALLOW 规则禁用其他选项（但 DISALLOW 规则仍然有效）。

- **优惠上限设置**：
  - 支持设置订单最大优惠比例（如不超过订单金额的50%）
  - 支持设置最大优惠金额（如不超过100元）

- **优先级和计算顺序**：
  - 可视化配置界面支持设置优惠券应用顺序，考虑拖拽式规则配置
  - 给出多个优惠券按设置顺序实时计算后的优惠比例或金额

### 4.3 前端功能
#### 4.3.1 多券选择
- 结算页面优惠券选择界面，支持选择多张优惠券
- 通过4.1中不同优惠券的规则和4.2.2中的动态规则实时计算优惠券能否可用，不可用时显示原因提示
- 4.2.2叠加规则配置优惠券叠加检查的结果包括可叠加状态、匹配的规则信息和友好的提示消息
- 实时计算和显示应用优惠券后的金额，需要考虑4.2.2中的优惠上限设置和计算顺序

# 当前目录结构

├── README.md
├── app                       # Next.js App Router目录
│   ├── (auth)                # 身份验证相关路由
│   │   ├── layout.tsx       # 认证页面共用布局
│   │   ├── login
│   │   │   └── page.tsx     # 登录页
│   │   ├── ping-supabase
│   │   │   └── page.tsx     # Supabase连接测试页
│   │   ├── register
│   │   │   ├── confirm
│   │   │   │   └── page.tsx # 注册确认页
│   │   │   └── page.tsx     # 注册页
│   │   └── test-register
│   │       └── page.tsx     # 注册测试页
│   ├── (shop)                # 客户端商城路由
│   │   ├── account          # 用户账户页面
│   │   │   ├── addresses
│   │   │   │   └── page.tsx # 地址管理页
│   │   │   ├── page.tsx     # 账户首页
│   │   │   └── security
│   │   │       └── page.tsx # 安全设置页
│   │   ├── cart             # 购物车页面
│   │   │   └── page.tsx
│   │   ├── checkout         # 结算页面
│   │   │   ├── page.tsx     # 结算步骤页
│   │   │   └── payment
│   │   │       └── page.tsx # 支付页(mock)
│   │   ├── layout.tsx       # 商城页面共用布局
│   │   ├── orders           # 订单管理页面
│   │   │   ├── [id]
│   │   │   │   └── page.tsx # 订单详情页
│   │   │   └── page.tsx     # 订单列表页
│   │   └── products         # 商品相关页面
│   │       ├── [id]
│   │       │   └── page.tsx # 商品详情页
│   │       └── page.tsx     # 商品列表页
│   ├── admin                 # 管理后台路由
│   │   ├── coupons           # 优惠券管理
│   │   │   ├── page.tsx     # 优惠券列表与管理主页
│   │   │   └── settings     # 优惠券设置页 (全局, 叠加, 顺序)
│   │   │       └── page.tsx
│   │   ├── orders           # 管理后台订单管理
│   │   │   └── page.tsx
│   │   └── products         # 管理后台商品管理
│   │       └── page.tsx
│   ├── api                   # API路由
│   │   ├── admin             # 管理员相关API
│   │   │   ├── coupons       # 管理员优惠券API
│   │   │   │   ├── application-order # 优惠券应用顺序API
│   │   │   │   │   └── route.ts
│   │   │   │   ├── batch        # 批量操作优惠券API
│   │   │   │   │   └── route.ts
│   │   │   │   ├── route.ts     # 优惠券列表/创建/更新API
│   │   │   │   ├── settings     # 全局设置API
│   │   │   │   │   └── route.ts
│   │   │   │   └── stacking-rules # 叠加规则API
│   │   │   │       ├── [id]       # 单个叠加规则API
│   │   │   │       │   └── route.ts
│   │   │   │       ├── check      # 叠加规则检查API
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts     # 叠加规则列表/创建API
│   │   │   ├── orders         # 管理员订单API
│   │   │   │   ├── [id]       # 单个订单API
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts     # 订单列表API
│   │   │   ├── products       # 管理员商品API
│   │   │   │   ├── [id]       # 单个商品API
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts     # 商品列表/创建API
│   │   │   └── user-coupons   # 管理员用户优惠券API
│   │   │       └── route.ts
│   │   ├── auth             # 认证相关API
│   │   │   ├── login
│   │   │   │   └── route.ts # 登录API
│   │   │   ├── logout
│   │   │   │   └── route.ts # 登出API
│   │   │   └── register
│   │   │       └── route.ts # 注册API
│   │   ├── cart             # 购物车相关API
│   │   │   ├── items        # 购物车项API
│   │   │   │   ├── [id]     # 单个购物车项API
│   │   │   │   │   └── route.ts
│   │   │   │   ├── route.ts   # 添加购物车项API
│   │   │   │   └── select   # 批量选择购物车项API
│   │   │   │       └── route.ts
│   │   │   └── route.ts       # 获取/清空购物车API
│   │   ├── coupon-rules     # 优惠券规则API (一个优惠券关联多条规则时使用此逻辑)
│   │   │   ├── [id]
│   │   │   │   └── route.ts
│   │   │   ├── coupon
│   │   │   │   └── [couponId]
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   ├── coupons          # 用户优惠券相关API
│   │   │   ├── [id]         # 单个优惠券详情API (用户侧)
│   │   │   │   └── route.ts
│   │   │   ├── route.ts     # 获取所有可用优惠券API (用户侧)
│   │   │   ├── search       # 搜索优惠券API (用户侧)
│   │   │   │   └── route.ts
│   │   │   ├── stacking-check # 用户端叠加检查API
│   │   │   │   └── route.ts
│   │   │   ├── stacking-rules # 获取叠加规则API (用户侧)
│   │   │   │   └── route.ts
│   │   ├── orders           # 用户订单相关API
│   │   │   ├── [id]         # 单个订单API (获取/更新状态)
│   │   │   │   └── route.ts
│   │   │   ├── route.ts     # 创建订单/获取列表API
│   │   │   └── user         # 获取特定用户订单API (暂未使用此逻辑)
│   │   │       └── [userId]
│   │   │           └── route.ts
│   │   ├── payment          # 支付相关API (mock)
│   │   │   ├── callback     # 支付回调API (mock)
│   │   │   │   └── route.ts
│   │   │   └── process      # 处理支付请求API (mock)
│   │   │       └── route.ts
│   │   ├── ping-supabase    # Supabase连接测试API
│   │   │   └── route.ts
│   │   ├── products         # 用户商品相关API
│   │   │   ├── [id]         # 单个商品详情API
│   │   │   │   └── route.ts
│   │   │   ├── route.ts     # 商品列表API
│   │   │   └── search       # 商品搜索API
│   │   │       └── route.ts
│   │   ├── supabase-timing-test # Supabase性能测试API
│   │   │   └── route.ts
│   │   ├── user             # 用户资料和地址API
│   │   │   ├── addresses    # 用户地址API
│   │   │   │   ├── [id]     # 单个地址API
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts   # 地址列表/创建API
│   │   │   └── profile      # 用户资料API
│   │   │       └── route.ts
│   │   └── user-coupons     # 用户持有优惠券相关API
│   │       ├── [id]         # 单个用户优惠券API
│   │       │   └── route.ts
│   │       ├── applicable   # 获取可用优惠券API
│   │       │   └── route.ts
│   │       ├── assign       # 分配优惠券API (可能仅限特殊场景)
│   │       │   └── route.ts
│   │       ├── calculate    # 计算优惠金额API
│   │       │   └── route.ts
│   │       └── route.ts     # 获取用户持有优惠券列表API
│   ├── auth                # Supabase认证回调
│   │   └── callback
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 根页面/首页
│   └── profile               # 用户个人资料页(可能与(shop)/account冲突或重复)
│       └── page.tsx
├── components                # 组件目录
│   ├── admin                 # 管理后台相关组件
│   │   ├── coupon            # 管理后台优惠券组件
│   │   │   ├── coupon-application-order.tsx # 应用顺序配置组件
│   │   │   ├── coupon-columns.tsx           # 优惠券列表列定义
│   │   │   ├── coupon-form-dialog.tsx       # 优惠券表单对话框
│   │   │   ├── coupon-global-settings.tsx   # 全局设置配置组件
│   │   │   ├── coupon-list.tsx              # 优惠券列表组件
│   │   │   └── stacking-rule-form-dialog.tsx # 叠加规则表单对话框
│   │   └── page-header.tsx     # 管理后台页面头部组件
│   ├── cart                 # 购物车相关组件
│   │   └── coupon-selector.tsx # 优惠券选择器
│   ├── checkout             # 结算相关组件
│   │   ├── address-selector.tsx # 地址选择器
│   │   └── payment-method.tsx # 支付方式选择器
│   ├── icons.tsx              # 自定义图标组件
│   ├── layout               # 布局组件
│   │   └── navbar.tsx       # 导航栏
│   ├── products             # 商品相关组件
│   │   ├── product-card.tsx # 商品卡片
│   │   ├── product-details.tsx # 商品详情组件
│   │   ├── product-filter.tsx # 商品筛选
│   │   ├── product-grid.tsx # 商品网格
│   │   └── product-pagination.tsx # 商品分页
│   ├── providers            # 全局上下文提供者
│   │   └── supabase-provider.tsx # Supabase Context
│   ├── search               # 搜索相关组件
│   │   └── search-box.tsx   # 搜索框组件
│   ├── theme                # 主题相关组件
│   │   ├── theme-mode-toggle.tsx # 主题模式切换
│   │   └── theme-provider.tsx # 主题提供者
│   └── ui                    # UI基础组件 (shadcn/ui)
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── checkbox.tsx
│       ├── data-table.tsx    # 数据表格组件
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── heading.tsx       # 标题组件
│       ├── headless-multi-select.tsx # 无头多选组件
│       ├── input.tsx
│       ├── label.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── radio-group.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── site-header.tsx   # 网站头部组件
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx        # Toast 通知
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── tooltip.tsx
│       └── use-toast.ts
├── components.json           # shadcn/ui 配置文件
├── eslint.config.mjs         # ESLint 配置文件
├── hooks                     # 自定义 Hooks
│   ├── use-coupon-stacking.ts # 优惠券叠加逻辑 Hook
│   └── use-user-coupon-stacking.ts # 用户侧优惠券叠加 Hook
├── instruction.md            # 项目说明与规划文档
├── lib                       # 工具库与核心逻辑
│   ├── actions               # Server Actions
│   │   └── coupon-actions.ts # 优惠券相关 Server Actions
│   ├── auth.ts               # 认证相关工具函数
│   ├── data                  # 静态数据或配置
│   │   └── categories.ts     # 商品分类数据
│   ├── db.ts                 # Supabase客户端配置
│   ├── hooks                 # 工具库内的 Hooks
│   │   └── use-debounce.ts   # 防抖 Hook
│   ├── services              # 服务层逻辑
│   │   └── search.ts         # 搜索服务逻辑
│   ├── store                 # 状态管理 (Zustand)
│   │   ├── admin-order-store.ts # 管理后台订单状态
│   │   ├── admin-product-store.ts # 管理后台商品状态
│   │   ├── cart-store.ts     # 购物车状态
│   │   ├── order-store.ts    # 用户订单状态
│   │   └── user-store.ts     # 用户状态
│   ├── supabase
│   │   └── migrations        # Supabase 数据库迁移文件
│   │       └── users-setup.sql # 初始用户相关设置SQL
│   ├── utils
│   │   └── format.ts         # 格式化工具函数 (日期, 货币等)
│   └── utils.ts              # 通用工具函数 (shadcn/ui 生成)
├── middleware.ts             # Next.js 中间件 (认证等)
├── next-env.d.ts             # Next.js TypeScript 环境定义
├── next.config.ts            # Next.js 配置文件
├── package-lock.json
├── package.json
├── postcss.config.mjs        # PostCSS 配置文件
├── public                    # 静态资源目录
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── products # 商品图片目录
│   ├── vercel.svg
│   └── window.svg
├── tsconfig.json             # TypeScript 配置文件
└── types                     # TypeScript 类型定义
    ├── index.ts              # 项目自定义类型
    └── supabase.ts           # Supabase 数据库类型 (自动生成)
