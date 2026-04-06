# 记账本 Web 前端

个人记账应用的前端项目，采用 React 19 单文件组件架构，面向移动端优先的响应式设计。支持收支记录管理、数据统计可视化、微信/Excel 账单导入等功能。

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | React 19.2 | 函数组件 + Hooks，无路由库 |
| 构建工具 | rolldown-vite 7.2 | 通过 npm alias 引入，API 代理至后端 3000 端口 |
| 样式 | Tailwind CSS 3.4 | 自定义 CSS 动画，无 tailwindcss-animate 插件 |
| 图标 | Lucide React | 统一的 SVG 图标体系 |
| 图表 | 自定义 SVG | 柱状图、环形饼图，无第三方图表库 |
| Excel 解析 | SheetJS | CDN 加载（xlsx-0.20.0），按需引入 |

## 目录结构

```
com.bookkeeping.web/
├── index.html              # HTML 入口
├── vite.config.js          # Vite 配置（API 代理、SWC 插件）
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── eslint.config.js        # ESLint 配置
├── package.json            # 依赖与脚本
├── public/                 # 静态资源
└── src/
    ├── main.jsx            # 应用入口
    ├── App.jsx             # 主组件（单文件架构，约 1500 行）
    ├── index.css           # 全局样式 + CSS 动画定义
    └── tools/
        ├── constants.js    # 分类常量（图标、颜色、关键词映射）
        └── parser.js       # 微信/Excel 账单文件解析器
```

## 功能列表

### 用户系统

- 用户登录与注册，对接后端 API
- 内置 Mock 演示模式（账号 demo/123），无需后端即可体验

### 收支管理

- 按月展示交易流水列表，左右滑动切换月份
- 新增/编辑/删除交易记录，支持分类选择
- 19 种支出分类、4 种收入分类，每种分类配备独立图标与配色

### 数据统计

- 支出/收入维度切换
- 近 6 个月趋势柱状图（带生长动画）
- 分类占比环形饼图（带缩放动画）
- 分类明细页（全屏右滑进入）

### 账单导入

- 支持微信支付导出的 CSV 文件
- 支持 Excel 文件（.xlsx / .xls）
- 根据商品名称与交易对方自动匹配分类
- 服务端去重处理，导入状态弹窗（加载/成功/失败动画）

### 交互细节

- 卡片数值滚动计数动画
- Tab 切换时页面状态保持（CSS display 切换，非卸载重建）
- 移动端优先的响应式布局
- 自定义滚动条隐藏

## 组件一览

所有组件定义在 `src/App.jsx` 中：

| 组件 | 职责 |
|------|------|
| `App` | 根组件，全局状态管理与路由逻辑 |
| `LoginScreen` | 登录/注册界面 |
| `HomeView` | 首页，月度交易列表 |
| `StatsView` | 统计页，图表与分类汇总 |
| `SimplePieChart` | 环形饼图（SVG，缩放动画） |
| `MonthlyTrendChart` | 月度趋势柱状图（SVG，生长动画） |
| `AnimatedNumber` | 数值滚动计数动画组件 |
| `AddTransactionModal` | 新增/编辑交易弹窗 |
| `TransactionDetailModal` | 交易详情弹窗 |
| `ImportModal` | 账单文件导入弹窗 |
| `ImportStatusModal` | 导入进度状态弹窗 |
| `ConfirmModal` | 通用确认弹窗 |
| `SettingsModal` | 设置弹窗 |

## CSS 动画

定义在 `src/index.css` 中，包括：

- `animate-fade-in` -- 淡入
- `animate-slide-up` -- 上滑出现
- `animate-slide-from-bottom` -- 底部弹出
- `animate-slide-from-right` -- 右侧滑入
- `animate-zoom-in` -- 缩放出现
- `stagger-item` -- 列表项逐条出现
- `chart-line-draw` -- 折线描绘动画
- `chart-bar-grow` -- 柱状条生长动画
- `pie-slice` -- 饼图扇形展开动画
- `pie-center-text` -- 饼图中心文字淡入

## 分类体系

支出分类（19 种）：餐饮、零食、购物、服饰、交通、汽车、居住、社交、娱乐、运动、医疗、教育、阅读、亲子、美容、数码、旅行、宠物、其他。

收入分类（4 种）：工资、奖金、理财、其他。

每种分类在 `src/tools/constants.js` 中配置了 Lucide 图标、Tailwind 配色类名和自动归类关键词列表。

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+

### 安装与运行

```bash
npm install
npm run dev
```

开发服务器启动在 `http://localhost:5173`，API 请求自动代理至 `http://localhost:3000`。

### 构建生产版本

```bash
npm run build
```

输出目录为 `dist/`。

### 代码检查

```bash
npm run lint
```

### 后端对接

前端通过 `/api` 前缀与后端通信。若后端未启动，应用会自动降级为 Mock 演示模式，使用内存模拟数据。

后端 API 端点：

- `POST /api/auth/login` -- 登录
- `POST /api/auth/register` -- 注册
- `GET  /api/transactions?userId=` -- 查询交易列表
- `POST /api/transactions` -- 新增交易
- `PUT  /api/transactions/:id` -- 更新交易
- `DELETE /api/transactions/:id` -- 删除交易
- `POST /api/import` -- 批量导入账单

## 架构说明

项目采用单文件组件架构，所有 UI 组件集中在 `App.jsx` 中。这种设计在项目初期具有以下优势：

- 状态共享简单，无需跨组件通信方案
- 组件间跳转逻辑清晰，不依赖路由库
- 开发迭代迅速，适合个人项目快速验证

业务逻辑拆分至 `tools/` 目录：`constants.js` 管理分类常量配置，`parser.js` 处理文件解析与数据转换。
