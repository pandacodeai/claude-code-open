# LandingPage 实现计划

## 目标
创建一个面向开发者的产品 Landing Page，介绍 Claude Code WebUI 移动端的工作原理和优势。作为 WebUI 的一个新页面模块集成到现有路由系统中。

## 核心内容（基于代码分析）

### 要展示的技术亮点
1. **Tailscale 多端协同** — 服务器自动检测 100.x CGNAT 地址，零配置远程访问（`src/web/server/index.ts:190-205`）
2. **PWA 原生体验** — manifest.webmanifest + Service Worker + iOS standalone 模式
3. **三级响应式适配** — 768px（平板）→ 480px（手机）→ 触摸设备（`index.css:2099-2357`）
4. **WebSocket 实时通信** — 手机上也能实时对话、权限审批、工具调用
5. **Safe Area + 横屏** — iOS 刘海屏、底部安全区、横屏模式全适配

## 架构设计

### 新增文件
```
src/web/client/src/pages/LandingPage/
  index.tsx              # 页面主组件
  LandingPage.module.css # 样式（CSS Modules，跟 BlueprintPage 同模式）
  sections/
    HeroSection.tsx      # 顶部大图+标语
    ArchitectureSection.tsx  # 工作原理（架构图）
    FeaturesSection.tsx  # 六大优势卡片
    DemoSection.tsx      # 手机端演示效果（模拟手机框+截图）
    GetStartedSection.tsx    # 快速开始步骤
    FooterSection.tsx    # 底部
```

### 路由集成
修改 `Root.tsx`：
- `Page` 类型增加 `'landing'`
- TopNavBar 增加 Landing 入口
- 页面容器挂载 LandingPage

### 设计风格
- 复用现有 CSS 变量（Deep Universe 暗色主题）
- 使用 Glass Effect（`--glass-panel`）
- Indigo 主色调（`--accent-primary: #6366f1`）
- 全页面滚动，各 section 全宽
- 移动端自身也要做响应式适配（dogfooding）

## 页面内容草稿

### Hero Section
- 大标题：「Claude Code, 随身携带」
- 副标题：「通过 Tailscale 组网，在手机上远程操控你的开发环境。PWA 原生体验，无需安装任何 App。」
- CTA 按钮：「开始使用」→ 跳转到 chat 页面

### Architecture Section（工作原理）
- 可视化架构图：`PC (Claude Code Server)` ←WebSocket→ `Tailscale Network` ←HTTPS→ `Phone (PWA)`
- 三步流程：
  1. PC 启动 `claude-code --web --host 0.0.0.0`
  2. Tailscale 自动分配内网地址（100.x.x.x）
  3. 手机浏览器访问，添加到主屏幕即为原生 App

### Features Section（六大优势）
| 特性 | 描述 |
|------|------|
| 零配置组网 | Tailscale 自动检测，启动即显示手机访问地址 |
| PWA 原生体验 | 添加到主屏幕，全屏运行，无浏览器地址栏 |
| 实时双向通信 | WebSocket 长连接，对话/权限/工具调用毫秒级响应 |
| 深度触控优化 | 44px 最小点击区域，安全区适配，手势友好 |
| 三级响应式 | 平板/手机/横屏三套布局，智能隐藏次要功能 |
| 端到端加密 | Tailscale WireGuard 隧道，流量不经公网 |

### Demo Section
- CSS 模拟 iPhone 手机框
- 内嵌实际 WebUI 截图或 iframe 预览

### Get Started Section
- 三步快速开始的代码块
- 环境要求说明

## 实现顺序
1. 创建 LandingPage 目录结构和主组件
2. 实现各 Section 组件
3. 编写 CSS Module 样式
4. 集成到 Root.tsx 路由
5. TopNavBar 增加入口

## 约束
- 不引入额外依赖，纯 React + CSS
- 复用项目现有设计系统变量
- 所有文案中文
- 页面本身也要移动端适配
