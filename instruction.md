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
- `/api/products/categories`：获取商品分类数据
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

### 2.2 数据库设计
#### 2.2.1 Supabase 概述与配置

##### Supabase 简介
Supabase 是一个开源的 Firebase 替代品，提供了一套完整的后端服务，包括托管的 PostgreSQL 数据库、认证系统、实时订阅、存储和自动生成的 API。

##### 项目配置要点
- **初始化配置**：使用环境变量管理 Supabase URL 和 API Key
- **数据库连接**：通过 `lib/db.ts` 配置 Supabase 客户端
- **认证集成**：使用 Supabase Auth 服务处理用户注册与登录
- **存储集成**：利用 Supabase Storage 存储商品图片

#### 2.2.2 详细数据表结构

##### products 表（商品表）
```
商品基本信息表
- id: uuid PRIMARY KEY (使用 Supabase 自动生成的 UUID)
- name: text NOT NULL (商品名称)
- slug: text UNIQUE NOT NULL (URL友好的商品标识)
- description: text (商品描述)
- price: decimal(10,2) NOT NULL (商品价格)
- stock: integer NOT NULL (库存数量)
- category_id: uuid REFERENCES categories(id) (商品分类ID)
- images: jsonb (商品图片路径数组 ['url1', 'url2', ...])
- specs: jsonb (商品规格参数，JSON格式)
- is_featured: boolean DEFAULT false (是否为推荐商品)
- status: text DEFAULT 'active' (商品状态：active/inactive)
- created_at: timestamptz DEFAULT now() (创建时间)
- updated_at: timestamptz DEFAULT now() (更新时间)
```

##### categories 表（分类表）
```
商品分类表
- id: uuid PRIMARY KEY
- name: text NOT NULL (分类名称)
- slug: text UNIQUE NOT NULL (URL友好的分类标识)
- description: text (分类描述)
- parent_id: uuid REFERENCES categories(id) (父分类ID，支持多级分类)
- image: text (分类图片路径)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
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
- status: text NOT NULL (订单状态：pending/paid/shipped/delivered/cancelled)
- payment_method: text (支付方式)
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
- type: text NOT NULL (优惠券类型：product/time/amount/combination)
- value: decimal(10,2) NOT NULL (优惠券面值)
- discount_type: text NOT NULL (折扣类型：fixed/percentage)
- min_purchase: decimal(10,2) DEFAULT 0 (最低消费金额)
- max_discount: decimal(10,2) (最大优惠金额，针对百分比折扣)
- usage_limit: integer (使用次数限制)
- start_date: timestamptz NOT NULL (有效期开始)
- end_date: timestamptz NOT NULL (有效期结束)
- is_active: boolean DEFAULT true (是否激活)
- coupon_rule: jsonb (优惠规则，JSON格式)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

##### coupon_rules 表（优惠券规则表）
```
优惠券详细规则表
- id: uuid PRIMARY KEY
- coupon_id: uuid REFERENCES coupons(id) ON DELETE CASCADE (优惠券ID)
- rule_type: text NOT NULL (规则类型：product/category/time/amount/combination)
- rule_value: jsonb NOT NULL (具体规则值，JSON格式)
- priority: integer DEFAULT 0 (规则优先级)
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
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
```

#### 2.2.3 数据关系与索引设计

##### 表关系设计
- **一对多关系**：
  - 用户与订单：一个用户可以有多个订单
  - 用户与地址：一个用户可以有多个收货地址
  - 订单与订单项：一个订单包含多个订单项
  - 分类与商品：一个分类可以包含多个商品
  - 分类与子分类：一个分类可以有多个子分类（自引用关系）

- **多对多关系**：
  - 用户与优惠券：通过user_coupons表连接
  - 优惠券与规则：通过coupon_rules表连接

##### 索引设计
```
-- 商品表索引
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_is_featured ON products(is_featured);

-- 分类表索引
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

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
```

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
- 使用 Next.js 14 的服务器组件缓存机制缓存商品和分类数据
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
    { "path": "/api/products/featured", "interval": 21600 },  // 6小时
    { "path": "/api/categories", "interval": 86400 }   // 24小时
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

#### 2.2.7 数据库环境配置与部署

##### 环境配置
通过 `.env` 文件管理不同环境的数据库连接：

```
环境变量:
- NEXT_PUBLIC_SUPABASE_URL: Supabase项目URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: 公共匿名密钥
- SUPABASE_SERVICE_ROLE_KEY: 服务端密钥(仅服务器端使用)
- DATABASE_URL: 直接数据库连接URL(可选)
```

##### 部署策略
```
部署考虑因素:
- 开发环境使用本地Supabase实例
- 测试环境使用独立的Supabase项目
- 生产环境使用生产级Supabase实例，启用自动备份
```

## 3. 管理后台
### 3.1 管理员界面
#### 3.1.1 商品管理页面
- **商品列表**：
  - 支持分页、搜索、筛选
  - 显示商品ID、名称、图片、价格、库存、状态等信息
  - 批量操作功能（上架、下架、删除）
  - 使用DataTable组件实现高级表格功能

- **商品创建/编辑表单**：
  - 完整的商品信息表单
  - 多图片上传功能
  - 商品规格和型号配置
  - 分类选择
  - 富文本编辑器支持（用于商品描述）
  - 使用Form组件实现表单验证

#### 3.1.2 订单管理页面
- **订单列表**：
  - 订单状态分类视图
  - 高级搜索和筛选功能
  - 显示订单号、用户信息、金额、日期、状态等
  - 使用DataTable和Tabs组件

- **订单详情视图**：
  - 完整订单信息展示
  - 包含商品明细、用户信息、支付记录
  - 订单状态管理功能
  - 支持添加备注、修改订单状态

#### 3.1.3 优惠券管理页面
- **优惠券列表**：
  - 显示各类优惠券及其状态
  - 支持搜索和筛选
  - 批量操作功能

- **优惠券创建/编辑**：
  - 支持设置各类优惠券参数
  - 高级规则配置界面
  - 使用动态表单根据优惠券类型显示不同配置项

### 3.2 管理功能
#### 3.2.1 商品管理功能
- 商品上架、下架、删除功能
- 批量操作和导入导出功能
- 商品分类管理
- 商品库存管理和预警
- 商品图片管理

#### 3.2.2 订单处理功能
- 订单状态更新（确认、发货、完成）
- 退款和取消订单处理
- 订单备注功能
- 订单导出功能
- 订单统计和分析

## 4. 优惠券系统
### 4.1 优惠券类型
#### 4.1.1 商品券
- **功能实现**：
  - 支持指定特定商品或商品分类
  - 可设置最低购买数量要求
  - 支持固定金额或百分比折扣
  - 单个商品可应用多张商品券
  - 基于商品ID或分类ID匹配规则

#### 4.1.2 时间券
- **功能实现**：
  - 支持设置固定时间段（如双十一当天）
  - 支持周期性时间（如每周一）
  - 支持设置券面值和使用条件
  - 时间验证逻辑在前端和后端同时实现

#### 4.1.3 满减券
- **功能实现**：
  - 支持设置订单满额条件（如满100元）
  - 支持设置减免金额（如减20元）
  - 支持阶梯式满减规则配置
  - 自动计算最优满减方案

#### 4.1.4 组合券
- **功能实现**：
  - 支持多种类型优惠券组合使用
  - 可配置优惠券间的组合规则和限制
  - 基于规则引擎实现复杂组合逻辑
  - 计算最终优惠金额的处理逻辑

### 4.2 管理后台功能
#### 4.2.1 创建与管理
- 优惠券创建表单，支持设置各类参数
- 优惠券批量生成功能
- 优惠券启用/禁用管理
- 优惠券分发管理（发放给指定用户）
- 优惠券使用情况统计和分析

#### 4.2.2 动态规则配置
- **叠加规则配置**：
  - 配置界面支持设置哪些类型的优惠券可以叠加使用
  - 支持拖拽式规则配置
  - 规则冲突检测和提示

- **优惠上限设置**：
  - 支持设置订单最大优惠比例（如不超过订单金额的50%）
  - 支持设置最大优惠金额

- **优先级和计算顺序**：
  - 可视化界面设置优惠券应用顺序
  - 优惠计算规则预览功能
  - 使用可视化流程图展示优惠券计算逻辑

### 4.3 前端功能
#### 4.3.1 多券选择
- 结算页面优惠券选择界面
- 实时计算和显示应用优惠券后的金额
- 自动推荐最优惠的券组合
- 优惠券不可用时显示原因提示
- 使用Select和自定义选择器组件实现

# 当前目录结构
├── README.md
├── app                       # Next.js App Router目录
│   ├── (auth)                # 身份验证相关路由
│   │   ├── login            
│   │   │   └── page.tsx     # 登录页
│   │   ├── register         
│   │   │   └── page.tsx     # 注册页
│   │   ├── reset-password   # 密码重置
│   │   │   └── page.tsx
│   │   └── layout.tsx       # 认证页面共用布局
│   ├── (shop)                # 客户端商城路由
│   │   ├── page.tsx         # 商城首页(使用现有page.tsx)
│   │   ├── products         # 商品相关页面
│   │   │   ├── page.tsx     # 商品列表页
│   │   │   ├── [id]         # 商品详情页路由 
│   │   │   │   └── page.tsx # 商品详情页
│   │   │   └── categories   # 分类浏览页
│   │   │       └── [slug]
│   │   │           └── page.tsx
│   │   ├── cart             # 购物车页面
│   │   │   └── page.tsx
│   │   ├── checkout         # 结算页面
│   │   │   ├── page.tsx
│   │   │   └── payment      # 支付页面
│   │   │       └── page.tsx
│   │   ├── orders           # 订单管理页面
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── account          # 用户账户页面
│   │   │   ├── addresses
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── security
│   │   │       └── page.tsx
│   │   └── layout.tsx       # 商城页面共用布局(改造现有layout.tsx)
│   ├── admin                 # 管理后台路由
│   │   ├── page.tsx         # 管理后台首页
│   │   ├── products         # 商品管理页面
│   │   ├── orders           # 订单管理页面
│   │   ├── coupons          # 优惠券管理页面
│   │   └── layout.tsx       # 管理后台共用布局
│   ├── api                   # API路由
│   │   ├── auth             # 认证相关API
│   │   ├── products         # 商品相关API
│   │   │   ├── route.ts     # 商品列表API
│   │   │   ├── [id]
│   │   │   │   └── route.ts # 单个商品API
│   │   │   └── search
│   │   │       └── route.ts # 商品搜索API
│   │   ├── orders           # 订单相关API
│   │   ├── coupons          # 优惠券相关API
│   │   └── payment          # 支付相关API(mock)
│   ├── favicon.ico
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局(已存在)
│   ├── page.tsx              # 根页面
│   └── profile               # 个人资料页面
│       └── page.tsx
├── components                # 组件目录
│   ├── ui                    # 已有的UI组件库
│   │   ├── alert.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── tooltip.tsx
│   │   └── use-toast.ts
│   ├── layout               # 布局组件
│   │   ├── header.tsx       # 页头
│   │   ├── footer.tsx       # 页脚
│   │   ├── navbar.tsx       # 导航栏
│   │   ├── sidebar.tsx      # 侧边栏
│   │   └── admin-nav.tsx    # 管理后台导航
│   ├── products             # 商品相关组件
│   │   ├── product-card.tsx # 商品卡片
│   │   ├── product-details.tsx # 商品详情组件
│   │   ├── product-grid.tsx # 商品网格
│   │   ├── product-filter.tsx # 商品筛选
│   │   └── product-pagination.tsx # 商品分页
│   ├── cart                 # 购物车相关组件
│   │   ├── cart-item.tsx    # 购物车项目
│   │   └── coupon-selector.tsx # 优惠券选择器
│   ├── checkout             # 结算相关组件
│   │   ├── address-selector.tsx # 地址选择器
│   │   ├── coupon-selector.tsx # 优惠券选择器
│   │   └── payment-method.tsx # 支付方式选择器
│   ├── search               # 搜索相关组件
│   │   ├── search-bar.tsx   # 搜索框组件
│   │   ├── search-box.tsx   # 搜索框组件
│   │   └── filter-panel.tsx # 高级筛选面板
│   ├── theme                # 主题相关组件
│   │   ├── theme-mode-toggle.tsx # 主题模式切换
│   │   └── theme-provider.tsx # 主题提供者
│   ├── providers            # 全局上下文提供者
│   │   ├── theme-provider.tsx
│   │   └── session-provider.tsx
│   └── common               # 通用组件
│       ├── rating.tsx       # 评分组件
│       ├── price.tsx        # 价格显示组件(含折扣)
│       └── image-gallery.tsx # 图片画廊
├── components.json
├── eslint.config.mjs
├── instruction.md
├── lib                       # 工具库
│   ├── utils.ts              # 已有的工具函数
│   ├── utils                 # 工具函数目录
│   │   ├── format.ts         # 格式化工具(价格、日期等)
│   │   ├── validation.ts     # 表单验证工具
│   │   └── storage.ts        # 本地存储工具
│   ├── hooks                 # 自定义Hook目录
│   │   ├── hooks.ts          # 自定义Hook
│   │   └── use-debounce.ts   # 防抖钩子
│   ├── data                  # 数据目录
│   │   └── categories.ts     # 分类数据
│   ├── services              # 服务目录
│   │   └── search.ts         # 搜索服务
│   ├── db.ts                 # Supabase客户端配置
│   ├── supabase              # Supabase相关配置
│   │   ├── schema.ts         # 数据库schema定义
│   │   └── migrations        # 数据库迁移文件
│   ├── auth.ts               # 认证相关工具
│   ├── coupon-rules.ts       # 优惠券规则处理
│   ├── store                 # 状态管理
│   │   ├── cart-store.ts     # 购物车状态
│   │   ├── order-store.ts    # 订单状态
│   │   ├── user-store.ts     # 用户状态
│   │   └── filter-store.ts   # 筛选条件状态
│   └── actions               # Server Actions集合 
│       ├── product-actions.ts
│       ├── order-actions.ts
│       └── coupon-actions.ts
├── middleware.ts             # 路由权限控制
├── types                     # 类型定义目录
│   └── index.ts              # 类型定义文件
├── __tests__                 # 测试文件目录
│   ├── components            # 组件测试
│   └── api                   # API测试
├── .env.example              # 环境变量示例
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public                    # 静态资源目录
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── products              # 商品图片目录(新建)
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json
