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
#### 2.2.1 数据表结构
- **products表**：存储商品基本信息
  - id, name, description, price, stock, category_id, images, specs, created_at, updated_at等字段
  
- **categories表**：商品分类
  - id, name, parent_id, slug, description等字段
  
- **users表**：用户信息
  - id, email, password_hash, name, phone, created_at, last_login等字段
  
- **addresses表**：用户收货地址
  - id, user_id, name, phone, province, city, address, is_default等字段
  
- **orders表**：订单主表
  - id, user_id, total_amount, status, payment_method, address_id, created_at, updated_at等字段
  
- **order_items表**：订单商品明细
  - id, order_id, product_id, quantity, price等字段
  
- **coupons表**：优惠券定义
  - id, type, code, value, min_purchase, start_date, end_date, coupon_rule等字段
  
- **user_coupons表**：用户持有的优惠券
  - id, user_id, coupon_id, is_used, used_at等字段

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
│   │   ├── checkout         # 结算页面
│   │   ├── orders           # 订单管理页面
│   │   ├── account          # 用户账户页面
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
│   └── layout.tsx            # 根布局(已存在)
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
│   │   ├── pagination.tsx
│   │   ├── popover.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   ├── layout               # 布局组件
│   │   ├── header.tsx       # 页头
│   │   ├── footer.tsx       # 页脚
│   │   ├── navbar.tsx       # 导航栏
│   │   ├── sidebar.tsx      # 侧边栏
│   │   └── admin-nav.tsx    # 管理后台导航
│   ├── products             # 商品相关组件
│   │   ├── product-card.tsx # 商品卡片
│   │   ├── product-grid.tsx # 商品网格
│   │   └── product-filter.tsx # 商品筛选
│   ├── cart                 # 购物车相关组件
│   │   ├── cart-item.tsx    # 购物车项目
│   │   └── coupon-selector.tsx # 优惠券选择器
│   ├── checkout             # 结算相关组件
│   ├── search               # 搜索相关组件
│   │   ├── search-bar.tsx   # 搜索框组件
│   │   └── filter-panel.tsx # 高级筛选面板
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
│   ├── hooks.ts              # 自定义Hook
│   ├── db.ts                 # Supabase客户端配置
│   ├── supabase              # Supabase相关配置
│   │   ├── schema.ts         # 数据库schema定义
│   │   └── migrations        # 数据库迁移文件
│   ├── auth.ts               # 认证相关工具
│   ├── coupon-rules.ts       # 优惠券规则处理
│   ├── store                 # 状态管理
│   │   ├── cart-store.ts     # 购物车状态
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
