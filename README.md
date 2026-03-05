# 智能记账系统 (Smart Ledger)

面向小微企业和个体工商户的一站式智能财务管理系统。集成了AI对话记账、语音识别、OCR拍照识别、银行流水对账、库存管理、税务申报、智能报表等功能，覆盖日常经营中的全部记账和财务需求。

---

## 技术栈

**前端**
- React 19 + TypeScript 5.9 + Vite 7
- TailwindCSS v4（通过 @tailwindcss/vite 插件集成）
- shadcn/ui 组件库（New York 风格）+ Radix UI 全套原语
- React Router DOM（客户端路由，支持懒加载）
- Zustand（全局状态管理，支持 localStorage 持久化）
- TanStack React Query（服务端状态管理和数据缓存）
- TanStack React Table（数据表格，支持排序/筛选/分页）
- React Hook Form + Zod（表单管理和数据验证）
- Recharts（数据可视化图表）
- Framer Motion（页面过渡和交互动画）
- Lucide React（图标库）
- date-fns（日期处理）
- Sonner（Toast 通知）
- xlsx（Excel 导入导出）

**后端**
- Express 5（API 服务器）
- 百度 AI 开放平台代理（OCR 文字识别、语音识别、千帆大模型）
- Multer（文件上传处理）
- Helmet + CORS + Compression（安全和性能中间件）

**数据存储**
- 前端 localStorage（所有业务数据存储在浏览器本地，无需数据库部署）
- Prisma + SQLite（ORM 已配置，可按需切换到服务端数据库）

**开发工具**
- Prettier（代码格式化）
- ESLint（代码检查）
- tsx（TypeScript 服务端执行）
- concurrently（前后端同时启动）

---

## 目录结构

```
zhinengjizhang/
├── server/                          # 后端 API 服务
│   ├── index.ts                     # Express 服务入口，端口 3001
│   └── baidu-ai.ts                  # 百度 AI 代理路由（OCR/语音/大模型）
├── src/                             # 前端源码
│   ├── main.tsx                     # 应用入口
│   ├── App.tsx                      # 根组件（路由 + 主题管理）
│   ├── index.css                    # 全局样式（TailwindCSS + CSS 变量）
│   ├── app/
│   │   ├── router.tsx               # 路由定义（全部页面懒加载）
│   │   └── providers.tsx            # 全局 Provider（QueryClient/Tooltip/Toaster）
│   ├── components/
│   │   ├── brand/
│   │   │   └── logo.tsx             # 品牌 Logo 组件
│   │   ├── layout/
│   │   │   ├── app-layout.tsx       # 主布局（认证守卫 + 侧边栏 + 顶栏 + Outlet）
│   │   │   ├── auth-layout.tsx      # 认证页布局（左侧品牌 + 右侧表单）
│   │   │   ├── sidebar.tsx          # 深色侧边栏（导航高亮、可折叠、主题切换）
│   │   │   └── header.tsx           # 顶部栏（面包屑导航、搜索框、通知铃铛）
│   │   ├── shared/
│   │   │   ├── animated-number.tsx  # 数字滚动动画组件
│   │   │   ├── audio-waveform.tsx   # 语音录制波形动画
│   │   │   └── data-table-pagination.tsx  # 通用分页组件（跳页/每页条数）
│   │   └── ui/                      # shadcn/ui 基础组件（30+ 个）
│   ├── config/
│   │   ├── categories.ts            # 会计科目分类映射 + 快捷模板
│   │   ├── tax-rules.ts             # 税种规则/免税阈值/申报步骤
│   │   └── templates.ts             # AI 聊天快捷提示词模板
│   ├── hooks/
│   │   ├── use-mobile.ts            # 响应式移动端检测
│   │   └── use-theme.ts             # 亮色/暗色主题切换
│   ├── lib/
│   │   ├── category-colors.ts       # 分类颜色映射
│   │   ├── export.ts                # Excel 导出工具（智能文件名 + 多种导出格式）
│   │   ├── format.ts                # 日期/金额格式化工具
│   │   ├── seed-data.ts             # 演示数据生成（35 条记账 + 商品 + 库存）
│   │   ├── utils.ts                 # cn() 类名合并工具
│   │   └── validators.ts            # Zod 表单验证 Schema
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.tsx            # 登录页
│   │   │   └── register.tsx         # 注册页
│   │   ├── dashboard/
│   │   │   └── index.tsx            # 工作台（统计卡片/趋势图/饼图/流水/提醒）
│   │   ├── accounting/
│   │   │   ├── index.tsx            # 记账列表（搜索/筛选/Tab/分页/导出）
│   │   │   ├── new-record.tsx       # 新建记录（手动/模板/OCR拍照/语音）
│   │   │   └── reconciliation.tsx   # 对账中心（流水导入/匹配/对账/导出）
│   │   ├── ai-chat/
│   │   │   └── index.tsx            # AI 助手对话页
│   │   ├── inventory/
│   │   │   ├── index.tsx            # 库存列表（预警/搜索/管理）
│   │   │   ├── product-detail.tsx   # 商品详情
│   │   │   ├── stock-in.tsx         # 入库操作
│   │   │   └── stock-out.tsx        # 出库操作
│   │   ├── tax/
│   │   │   ├── index.tsx            # 税务首页（提醒/指引）
│   │   │   ├── declaration.tsx      # 生成申报表
│   │   │   └── calendar.tsx         # 申报日历
│   │   ├── reports/
│   │   │   ├── index.tsx            # 报表导航
│   │   │   ├── daily.tsx            # 日结报表
│   │   │   ├── monthly.tsx          # 月结报表
│   │   │   └── tax-summary.tsx      # 报税汇总
│   │   ├── profile/
│   │   │   └── index.tsx            # 个人设置
│   │   └── notifications/
│   │       └── index.tsx            # 通知中心
│   ├── services/                    # 业务逻辑层
│   │   ├── storage.ts               # localStorage 封装（读/写/前缀隔离/ID生成）
│   │   ├── base.service.ts          # 通用 CRUD 基类（LocalStorageService）
│   │   ├── accounting.service.ts    # 记账服务（增删改查/汇总/搜索/分类匹配）
│   │   ├── ai-chat.service.ts       # AI 对话服务（意图识别/自动记账/记忆系统）
│   │   ├── ai-parse.service.ts      # AI 文本解析（自然语言 -> 结构化记账数据）
│   │   ├── auth.service.ts          # 认证服务（登录/注册/Token）
│   │   ├── inventory.service.ts     # 库存服务（商品管理/库存预警/出入库）
│   │   ├── ocr.service.ts           # OCR 服务（发票识别/银行流水识别）
│   │   ├── reconciliation.service.ts # 对账服务（自动匹配/流水导入）
│   │   ├── report.service.ts        # 报表服务（日结/月结/趋势数据）
│   │   ├── tax.service.ts           # 税务服务（申报表生成/到期提醒）
│   │   └── voice.service.ts         # 语音服务（录音/转写/解析）
│   ├── stores/                      # Zustand 状态管理
│   │   ├── auth.store.ts            # 认证状态（用户信息 + 持久化）
│   │   ├── chat.store.ts            # 聊天状态（消息历史）
│   │   ├── notification.store.ts    # 通知状态
│   │   └── ui.store.ts              # UI 状态（侧边栏折叠等）
│   └── types/                       # TypeScript 类型定义
│       ├── accounting.ts            # 记账相关类型
│       ├── auth.ts                  # 认证相关类型
│       ├── chat.ts                  # 聊天相关类型
│       ├── inventory.ts             # 库存相关类型
│       ├── report.ts                # 报表相关类型
│       └── tax.ts                   # 税务相关类型
├── test-samples/                    # 测试样本文件
│   ├── README.md                    # 测试说明
│   ├── generate-samples.mjs         # 样本生成脚本
│   ├── receipt-sample.txt           # 小票 OCR 测试样本
│   ├── receipt-invoice.txt          # 发票 OCR 测试样本
│   ├── receipt-supermarket.txt      # 超市小票 OCR 测试样本
│   └── 银行流水-*.xlsx              # Excel 银行流水导入测试文件（3种格式）
├── prisma/
│   └── schema.prisma                # Prisma 数据模型定义
├── .env.example                     # 环境变量模板（API 密钥配置说明）
├── vite.config.ts                   # Vite 配置（路径别名/API代理/TailwindCSS）
├── components.json                  # shadcn/ui 组件配置
├── tsconfig.json                    # TypeScript 根配置
├── tsconfig.app.json                # 前端 TS 配置
├── tsconfig.node.json               # 服务端 TS 配置
├── eslint.config.js                 # ESLint 配置
├── .prettierrc                      # Prettier 格式化配置
├── netlify.toml                     # Netlify 部署配置
└── package.json                     # 依赖和脚本
```

---

## 环境准备和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入百度 AI 开放平台的 API 密钥：

```bash
cp .env.example .env
```

需要配置的密钥（均来自百度智能云控制台）：

- **BAIDU_OCR_API_KEY / BAIDU_OCR_SECRET_KEY** -- 文字识别 OCR，用于拍照识别发票和银行流水。申请地址：https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
- **BAIDU_VOICE_API_KEY / BAIDU_VOICE_SECRET_KEY** -- 语音识别，用于语音记账功能。申请地址：https://console.bce.baidu.com/ai/#/ai/speech/overview/index
- **BAIDU_QIANFAN_API_KEY** -- 千帆大模型（默认使用 ernie-lite-pro-128k），用于 AI 对话、智能解析记账文本、OCR 结果智能提取。申请地址：https://console.bce.baidu.com/qianfan/overview

如果不配置这些密钥，系统的核心记账功能仍然可以正常使用（手动记账、模板记账、导入导出、对账、税务、报表等），只是 AI 相关功能（AI 对话、语音识别、OCR 拍照识别）会降级到本地正则解析或提示未配置。

### 3. 启动开发环境

**同时启动前端和后端（推荐）：**

```bash
npm run dev:all
```

这会同时启动：
- 前端开发服务器：http://localhost:5173（Vite，支持热更新）
- 后端 API 服务器：http://localhost:3001（Express，tsx watch 自动重启）

前端通过 Vite 的 proxy 配置，将 `/api` 请求自动代理到后端 3001 端口。

**单独启动：**

```bash
npm run dev          # 仅启动前端
npm run dev:server   # 仅启动后端
```

### 4. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 5. 其他命令

```bash
npm run lint         # ESLint 代码检查
npm run format       # Prettier 格式化
npm run preview      # 预览生产构建
npm run db:generate  # Prisma 客户端生成
npm run db:push      # Prisma 数据库同步
npm run db:studio    # Prisma 可视化管理
```

---

## 默认账号

首次打开系统会自动进入登录页。系统内置了演示数据，使用以下账号登录：

- 账号：`admin`
- 密码：`123456`

登录后会自动加载 35 条演示记账记录、10 个商品和库存数据，可以直接体验所有功能。

---

## 功能详解

### 一、工作台（Dashboard）

系统登录后的首页，提供全局经营数据概览：

- **统计卡片** -- 展示今日收入、今日支出、本月利润、对账率四个核心指标，数字使用滚动动画展示。
- **收入趋势图** -- 最近 7 天的收入折线图（Recharts LineChart），鼠标悬浮显示详细数值。
- **支出分类饼图** -- 本月各类支出占比（Recharts PieChart），直观看到钱花在哪里。
- **近期流水** -- 最近 5 条收支记录，按时间倒序排列，点击可跳转详情。
- **税务申报提醒** -- 显示最近的增值税和所得税申报截止日期，临近时高亮警告。
- **库存预警** -- 库存低于安全线的商品自动出现在这里，提醒及时补货。
- **快捷入口** -- 新建记录、AI 助手、对账中心、库存管理四个常用入口。

### 二、智能记账

#### 2.1 记账列表页

完整的记账记录管理界面：

- **Tab 切换** -- 全部 / 收入 / 支出三个标签页，显示各自的记录数量。
- **搜索** -- 支持按描述、分类、商品名称模糊搜索。
- **筛选** -- 按日期、分类下拉筛选，可组合使用。
- **按日分组** -- 记录按日期分组展示，每组显示当天的收入和支出小计。
- **分页** -- 支持自定义每页条数（10/20/50/100），可跳页。
- **对账状态标记** -- 每条记录显示「已对账」或「未对账」状态。
- **来源标识** -- 显示记录来源（手动、语音、拍照、模板、AI 对话、库存）。
- **导出** -- 下拉菜单，支持「导出全部」和「导出筛选结果」。导出为 Excel 文件，文件名会根据当前筛选条件智能命名，例如"记账记录_收入_销售收入_2026-03-03.xlsx"。

#### 2.2 新建记录页

四种记账方式，覆盖不同使用场景：

**手动录入** -- 表单方式填写类型、金额、分类、描述、日期等字段。分类下拉菜单包含收入 6 类、支出 17 类。金额输入支持小数。

**模板记账** -- 预设 8 个常用模板（销售收款、采购付款、房租支出、水电费、工资发放、运费支出、服务收入、业务招待），点击模板后自动填充类型和分类，只需输入金额和描述。

**OCR 拍照识别** -- 拍照或选择图片上传，系统调用百度 OCR 识别图片中的文字，然后通过百度千帆大模型智能提取金额、描述、分类等信息。如果 AI 解析失败，会降级到本地正则匹配。识别结果自动填入表单，用户确认后保存。

**语音记账** -- 点击麦克风按钮开始录音，录音过程中显示波形动画。停止后将音频转为 PCM 格式发送到百度语音识别 API 转为文字，再通过 AI 大模型智能解析出结构化记账数据。例如用户说"今天卖了三箱苹果收了两百块"，系统会自动识别为：收入、200 元、销售收入分类、商品苹果。

**智能分类匹配** -- 无论哪种方式输入，系统都会根据描述文本自动匹配分类。匹配逻辑基于关键词权重表（categories.ts），内置 40+ 条映射规则。用户也可以自定义映射，自定义规则会被持久化保存并优先使用。

#### 2.3 对账中心

银行流水与记账记录的自动匹配核对：

**流水导入** -- 两种导入方式：
- 拍照导入：拍摄银行流水截图，OCR 识别后用 AI 大模型智能提取每一条流水的日期、金额、收支类型、描述。如果 AI 不可用，降级到增强正则解析（支持多种金额格式：3200 / 3,200.00 / +3200 / -280.00 等）。
- Excel 导入：上传 xlsx/xls/csv 文件，自动解析表格数据，智能识别列名映射（支持中文列名如"交易金额"、英文列名如"Amount"等多种格式）。

**导入处理** -- 导入过程中显示持久化的 Loading 状态（带旋转图标、进度条、状态文字提示），不是一闪而过的 Toast，让用户清楚知道系统正在工作。导入期间按钮自动禁用防止重复点击。

**自动匹配** -- 导入的银行流水会自动与现有记账记录进行匹配。匹配规则：金额差值 < 0.01 且收支类型相同且日期差 <= 1 天。匹配成功的记录标记为「已对账」。

**导入结果展示** -- 导入完成后展示全部流水记录（不是只展示未匹配的），用不同颜色和图标区分已匹配和未匹配条目。已匹配显示绿色背景和「已对照」标签，未匹配显示黄色边框和「补录」按钮。列表支持滚动，滚动不会穿透到页面（使用 overscroll-behavior: contain）。

**补录功能** -- 未匹配的银行流水可以一键「补录」为记账记录，也可以批量「全部补录未入账」。

**对账统计** -- 顶部四格统计栏显示总记录数、已对账数、未对账数、对账率进度条。左侧汇总卡显示已核实收入、已核实支出、待核实笔数。支持一键对账（将所有未对账记录标为已对账）。

**记录列表** -- 右侧展示所有记账记录的对账状态，支持搜索。点击某条记录可切换其对账状态。分页展示，支持每页条数设置和跳页。

**导出** -- 导出全部记账记录为 Excel，文件名自动标注"全部"。

### 三、AI 助手

一个聊天界面的智能财务助手，名叫"小智"：

**对话能力** -- 系统将用户消息连同本地数据上下文（今日概览、月度概览、最近记录等）一起发送给百度千帆大模型，AI 基于真实数据回答问题。支持询问"今天赚了多少""这个月支出最多的是什么""库存还有多少"等。

**自动记账** -- 系统内置意图识别逻辑。当用户消息包含记账意图（如"帮我记一笔""卖了三箱苹果收了200"），会自动触发 AI 解析流程，将自然语言转为结构化数据并保存到数据库，然后返回确认消息（包含类型、金额、描述、分类、日期、时间等完整信息）。

**记忆系统** -- AI 助手具备简单的长期记忆能力，会自动从对话中提取用户提到的店铺名称、主营业务等信息并保存。后续对话中会参考这些记忆，让回答更个性化。记忆持久化在 localStorage，最多保留 50 条。

**快捷模板** -- 聊天输入框上方提供常用提问模板（查看今日流水、本月收支分析、库存预警等），点击即可快速发起对话。

**数据关联** -- AI 的回复可能附带关联数据（记账记录、商品信息、报表数据），聊天界面会以卡片形式展示这些关联信息。

### 四、库存管理

面向有实体商品的经营者：

- **商品列表** -- 展示所有商品的名称、SKU、当前库存、单价、库存状态。库存低于安全线的商品会以红色预警标识。
- **搜索和筛选** -- 支持按商品名称和 SKU 搜索，按库存状态筛选。
- **商品详情** -- 查看单个商品的完整信息：基本信息、库存变动历史、出入库记录。
- **入库** -- 录入进货数据，系统自动增加库存数量并记录入库流水。
- **出库** -- 录入出货数据，系统自动减少库存数量并记录出库流水。如果出库数量超过当前库存会提示错误。
- **库存预警** -- 在 config 中为每个商品设置最低库存阈值，低于阈值时在库存列表和工作台同时展示预警。

### 五、智能税务

**税务首页** -- 展示当前适用的税种（增值税、个人所得税）、申报周期（按季申报）、下次申报截止日期、剩余天数。临近截止日会以红色高亮提醒。提供申报操作的分步指引，告诉用户如何在电子税务局完成申报。

**生成申报表** -- 系统根据选定的申报期间，自动汇总该期间内所有记账记录的收入和支出，按照税法规则计算应纳税额。核心计算逻辑：

- 增值税：小规模纳税人税率 1%，季度销售额 30 万以下免征。
- 个人所得税（经营所得）：税率 5%，按利润（收入 - 支出）计算。

计算结果可以导出为 Excel 申报表，文件名包含税种和日期。

**申报日历** -- 可视化展示全年的申报截止日期，方便提前安排。

### 六、智能报表

- **日结报表** -- 选择日期查看当天的收支明细汇总。
- **月结报表** -- 选择月份查看当月的收入、支出、利润，按分类汇总。
- **报税汇总** -- 汇总全部财务数据，生成适合报税参考的综合报表，可导出 Excel。

### 七、认证和用户

- **登录/注册** -- React Hook Form + Zod 验证，左侧品牌展示 + 右侧表单的双栏布局。
- **认证守卫** -- 未登录时自动跳转登录页，登录状态通过 Zustand + localStorage 持久化。
- **个人设置** -- 用户信息查看和编辑。
- **主题切换** -- 支持亮色和暗色两种主题，通过 CSS 变量实现，切换时所有组件同步变化。侧边栏底部有主题切换按钮。

### 八、通知系统

- **通知中心** -- 统一展示系统通知（税务提醒、库存预警等）。
- **未读计数** -- 顶部导航栏的铃铛图标实时显示未读通知数量。

---

## 核心架构设计

### 数据层架构

系统采用三层数据架构：

**Storage 层**（storage.ts）-- 封装 localStorage 的读写操作，所有 key 统一加 `znjz_` 前缀避免冲突。提供 getItem/setItem/removeItem/generateId/getNow 等基础方法。

**BaseService 层**（base.service.ts）-- 泛型 CRUD 基类 `LocalStorageService<T>`，实现了 getAll/getById/create/update/delete/count/clear 等通用方法。所有实体自动维护 id/createdAt/updatedAt 字段。支持按条件筛选（filters 参数）。

**业务 Service 层** -- 各模块的 Service 继承 BaseService，添加业务特有方法。例如 AccountingService 增加了 getByDateRange、getTodaySummary、getMonthSummary、autoClassify、searchRecords 等方法。

这种设计的好处是：全部数据存储在浏览器 localStorage，无需部署数据库，打开浏览器即可使用。同时 BaseService 的接口设计与后端 REST API 一致，未来需要接入后端数据库时只需替换 Service 实现。

### AI 解析流程

系统中涉及 AI 的地方都采用「AI 优先 + 正则降级」的双重保障策略：

1. **AI 对话记账**：用户发消息 -> 意图识别（isAccountingIntent 正则判断） -> AI 大模型解析（aiParseAccountingText，发送到千帆 API） -> 提取 JSON 结果 -> 校验字段有效性 -> 保存记账记录。如果 AI API 不可用，降级到本地正则解析（fallbackParse），通过关键词匹配提取金额和类型。

2. **OCR 发票识别**：上传图片 -> 百度 OCR API 识别文字 -> AI 大模型智能提取结构化数据（aiParseOcrText） -> 如果 AI 失败，降级到正则解析（parseOcrLines）。

3. **OCR 银行流水识别**：上传图片 -> 百度 OCR API 识别文字 -> AI 大模型解析每一条流水（aiParseBankStatementText） -> 如果 AI 失败，降级到增强正则解析（regexParseBankLines，支持多种金额格式和日期格式）。

4. **语音记账**：浏览器 MediaRecorder 录音 -> 转为 16bit PCM -> 发送到百度语音 API 转文字 -> AI 大模型解析文字（aiParseAccountingText） -> 保存记账记录。

### 对账匹配算法

reconciliation.service.ts 中的 autoMatch 方法实现了银行流水与记账记录的自动匹配：

1. 遍历所有导入的银行流水。
2. 对每条流水，在记账记录中查找满足以下全部条件的记录：金额差值小于 0.01、收支类型一致、日期差不超过 1 天、尚未被其他流水匹配、尚未标记为已对账。
3. 找到匹配后，将流水状态更新为 matched，将记账记录标记为 isReconciled = true，并记录双向关联 ID。
4. 使用 Set 记录已匹配的记录 ID，防止一条记录被多条流水重复匹配。

### 智能分类系统

categories.ts 定义了 40+ 条关键词到分类的映射规则，每条规则有权重（weight）。匹配时按权重降序排列，第一个命中的关键词决定分类。用户可以通过 AccountingService.updateCategoryMapping 添加自定义映射，自定义规则的权重从 11 开始（高于内置规则的最高权重 10），确保优先匹配。

### 导出系统

export.ts 提供四种导出功能：

- **exportAccountingRecords** -- 导出记账记录，支持传入 ExportFilterOptions 控制文件名。全部导出时文件名包含"全部"，筛选导出时文件名包含类型/分类/日期/搜索关键词。
- **exportTaxDeclaration** -- 导出税务申报表。
- **exportTaxSummary** -- 导出报税汇总。
- **importExcelFile** -- 通用 Excel 导入解析。

所有导出基于 xlsx 库，生成标准的 .xlsx 文件，列宽已预设。

### 后端 API 代理

server/baidu-ai.ts 提供三组 API 代理路由：

- `POST /api/baidu/ocr/general` -- OCR 通用文字识别，接收图片文件或 URL。
- `POST /api/baidu/ocr/receipt` -- OCR 小票/发票识别。
- `POST /api/baidu/voice/recognize` -- 语音识别，接收 PCM 音频数据。
- `POST /api/baidu/llm/chat` -- 千帆大模型对话，接收 messages 数组和可选的 system prompt。

每个 API 都有详细的日志输出（请求时间、文件大小、响应状态、耗时等），方便调试。Access Token 在服务端缓存，过期前自动续期。

---

## 视觉设计

- **配色方案** -- 翡翠绿主色（hsl 158 64%）、琥珀金强调色（hsl 38 92%）。收入用绿色，支出用红色，整体风格偏向金融科技。
- **暗色模式** -- 完整的暗色主题支持，通过 CSS 变量切换，所有组件在两种主题下都有良好的视觉表现。
- **字体** -- 正文使用 DM Sans，标题使用 Plus Jakarta Sans，金额数字使用 JetBrains Mono 等宽字体。
- **动画** -- 页面切换使用 Framer Motion 的 fade + slide 动画。侧边栏导航高亮使用 layoutId 动画。数字变化使用滚动动画。
- **响应式** -- 侧边栏可折叠，移动端自动隐藏。布局在不同屏幕尺寸下自适应。

---

## 数据说明

所有业务数据存储在浏览器的 localStorage 中，key 前缀为 `znjz_`。主要的数据集合：

- `znjz_accounting_records` -- 记账记录
- `znjz_products` -- 商品列表
- `znjz_stock_movements` -- 库存变动记录
- `znjz_reconciliation_flows` -- 对账流水
- `znjz_tax_declarations` -- 税务申报记录
- `znjz_tax_config` -- 税务配置
- `znjz_auth_user` -- 用户信息
- `znjz_ai_chat_memories` -- AI 记忆
- `znjz_custom_category_mappings` -- 自定义分类映射

清除浏览器的 localStorage 即可重置所有数据。首次登录时系统会自动写入演示数据。

---

## 部署

项目已包含 netlify.toml 配置文件，可直接部署到 Netlify：

```bash
npm run build
```

将 `dist/` 目录上传到任何静态网站托管服务即可。注意：部署后如果需要 AI 功能（OCR/语音/大模型），需要单独部署 server/ 后端服务并配置环境变量。纯前端部署下，手动记账、模板记账、对账、税务、报表、导出等核心功能均可正常使用。
