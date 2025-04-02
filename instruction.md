# 项目概览

你需要设计一个线上商品交易平台，用户可以在平台上浏览商品、购买商品、管理订单。管理员可以通过管理后台管理商品和订单。支付功能通过mock方式实现，无需对接真实支付接口。为了提升业务复杂度和用户体验，平台引入了增强型的优惠券模块，新增多种功能和规则。

你是一名精通Next.js 14的高级全栈工程师，拥有20年的Web开发经验，在该项目中会使用 Next.js 14、shadcn、tailwind、Lucid icon，后端数据库使用 Supabase。

# 目标要求

- 设计一个完整的线上商品交易平台，集成上述增强型优惠券模块。
- 确保优惠券功能支持灵活的配置（如类型、规则、计算顺序）和用户友好的体验。
- 系统需具备可扩展性，能够应对未来新增的优惠券类型或规则。

# 核心功能

1. 前端
- 用户界面： 
  - 商品展示页面（列表、详情）
  - 购物车页面
  - 订单管理页面
  - 个人中心页面
- 功能： 
  - 浏览商品、搜索商品
  - 将商品加入购物车、下单
  - 模拟支付（mock）
  - 查看订单历史
2. 后端
- API服务： 
  - 商品管理：商品列表、详情、搜索
  - 用户管理：注册、登录、用户信息
  - 订单管理：创建订单、支付（mock）、订单状态更新
- 数据库： 
  - 存储商品信息、用户信息、订单数据
3. 管理后台
- 管理员界面： 
  - 商品管理页面
  - 订单管理页面
- 功能： 
  - 添加、编辑、删除商品
  - 查看和处理订单
4. 优惠券
为了提升平台的营销能力和用户粘性，平台引入了复杂的优惠券业务模块，支持多样化的优惠券类型、管理功能和使用规则。具体需求如下：
4.1 优惠券类型
平台支持以下类型的优惠券：
- 商品券： 
  - 针对特定商品或商品类别（如“电子产品”或“指定品牌”）。
  - 支持设置最低购买数量（如“买2件可用”）。
- 时间券： 
  - 在特定时间段内有效（如“双11当天”或“每周一”).
- 满减券： 
  - 当订单金额达到门槛时减免固定金额（如“满100减20”）。
  - 支持阶梯式满减（如“满200减50，满300减80”）。
- 组合券： 
  - 允许用户在单笔订单中组合使用多种优惠（如“商品券+满减券”）。
  - 可设置组合使用的优先级和限制条件。
4.2 管理后台功能
管理员通过后台对优惠券进行全面管理：
- 创建与管理： 
  - 创建优惠券。
- 动态规则配置： 
  - 配置优惠券叠加规则（如“商品券与时间券可叠加，但不可与满减券叠加”）。
  - 设置优惠上限（如“优惠金额不超过订单金额的50%”）。
  - 定义优惠券的优先级和计算顺序（如“先用满减券，再用商品券”）。
4.3 前端功能
- 多券选择： 
  - 用户可在下单时手动选择多张优惠券，系统实时显示优惠后的金额。

# 当前目录结构
├── README.md
├── app
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   └── ui
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── radio-group.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── components.json
├── eslint.config.mjs
├── instruction.md
├── lib
│   └── utils.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json

# 数据库设计
