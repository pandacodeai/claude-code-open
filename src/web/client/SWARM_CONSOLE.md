# 蜂群控制台 (Swarm Console)

## 概述

蜂群控制台是 Axon WebUI 的新增功能模块，提供可视化的蜂群任务管理界面。

## 已完成的工作 (Worker-1)

### 1. 页面框架和路由

#### 创建的文件

```
src/web/client/src/
├── Root.tsx                                      # 根组件，处理顶层路由
├── pages/SwarmConsole/
│   ├── index.tsx                                 # 蜂群控制台主页面组件
│   └── SwarmConsole.module.css                   # 页面样式（CSS Modules）
├── components/swarm/TopNavBar/
│   ├── index.tsx                                 # 顶部导航栏组件
│   └── TopNavBar.module.css                      # 导航栏样式（CSS Modules）
└── types/
    └── css-modules.d.ts                          # CSS Modules TypeScript 类型声明
```

#### 修改的文件

- `src/web/client/src/main.tsx` - 更新入口文件，使用 Root 组件
- `src/web/client/src/App.tsx` - 添加容器 div 以适配新布局
- `src/web/client/src/styles/index.css` - 移除 #root 的固定 flex 布局

### 2. 页面布局

蜂群控制台采用以下布局结构：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [💬 聊天]  [🐝 蜂群]  [📋 蓝图]          Axon     [⚙️]          │  ← 48px
├─────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┬───────────────────────────┬─────────────────────────┐ │
│ │ 📋 蓝图列表    │    🌳 任务树区域           │   👷 Workers (0/8)      │ │
│ │               │                           │                         │ │
│ │ 200px         │      flex: 1              │      320px              │ │
│ │               │                           │                         │ │
│ └───────────────┴───────────────────────────┴─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                   ⏱️ 时间线 (可折叠, 150px) ▼                           │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 布局特点

- **顶部导航栏** (48px)：全局导航，支持三个页面切换
  - 💬 聊天：原有的聊天界面
  - 🐝 蜂群：新增的蜂群控制台
  - 📋 蓝图：蓝图管理（占位）

- **三栏主区域**：
  - 左侧栏 (200px)：蓝图列表区域
  - 中央区 (flex:1)：任务树显示区域
  - 右侧栏 (320px)：Worker 状态面板

- **底部时间线** (150px)：
  - 可折叠/展开
  - 显示蜂群运行时的事件记录

### 3. 技术实现

- **React 18 + TypeScript**：完整的类型安全
- **CSS Modules**：模块化样式管理，避免全局污染
- **响应式设计**：支持移动端自适应
- **已有基础设施集成**：
  - 使用现有的 CSS 变量和主题系统
  - 兼容现有的 WebSocket 通信机制
  - 复用已定义的类型系统 (types.ts)

### 4. 路由系统

采用简单的基于状态的路由系统：

```typescript
type Page = 'chat' | 'swarm' | 'blueprint';
```

- **chat**: 显示原有的聊天界面
- **swarm**: 显示蜂群控制台
- **blueprint**: 蓝图管理（待开发）

### 5. 开发状态

✅ 已完成：
- [x] 页面框架和基础布局
- [x] 顶部导航栏
- [x] 路由配置
- [x] 三栏布局结构
- [x] 可折叠时间线面板
- [x] 响应式设计
- [x] CSS Modules 配置
- [x] TypeScript 类型支持

🚧 待完成（需要其他 Workers）：
- [ ] 蓝图列表组件和数据绑定
- [ ] 任务树组件和可视化
- [ ] Worker 面板和状态监控
- [ ] 时间线事件展示
- [ ] WebSocket 实时通信集成
- [ ] 交互功能（暂停/恢复/停止等）

## 如何使用

### 启动开发服务器

```bash
cd src/web/client
npm run dev
```

### 访问页面

打开浏览器访问 `http://localhost:3457`，点击顶部的 "🐝 蜂群" 标签即可查看蜂群控制台。

## 现有基础设施

项目已经包含以下基础设施（可直接使用）：

- `pages/SwarmConsole/types.ts` - 完整的类型定义
- `pages/SwarmConsole/hooks/` - WebSocket 和状态管理 hooks
  - `useSwarmWebSocket.ts` - WebSocket 通信
  - `useSwarmState.ts` - 状态管理

## 下一步工作建议

1. **Worker-2**: 实现左侧蓝图列表组件
2. **Worker-3**: 实现中央任务树可视化
3. **Worker-4**: 实现右侧 Worker 面板
4. **Worker-5**: 实现底部时间线组件
5. **Worker-6**: 集成 WebSocket 实时通信
6. **Worker-7**: 实现交互功能和业务逻辑

## 技术细节

### CSS 变量（来自全局样式）

```css
--bg-primary: #1a1b26;        /* 主背景色 */
--bg-secondary: #24283b;      /* 次要背景色 */
--bg-tertiary: #414868;       /* 第三背景色 */
--text-primary: #c0caf5;      /* 主文本色 */
--text-secondary: #a9b1d6;    /* 次要文本色 */
--text-muted: #565f89;        /* 静音文本色 */
--accent-primary: #7aa2f7;    /* 主强调色 */
--accent-success: #9ece6a;    /* 成功色 */
--accent-warning: #e0af68;    /* 警告色 */
--accent-error: #f7768e;      /* 错误色 */
--border-color: #414868;      /* 边框色 */
--code-bg: #1f2335;          /* 代码背景色 */
```

### 响应式断点

- Desktop: > 1200px
- Tablet: 768px - 1200px
- Mobile: < 768px

## 注意事项

1. 项目使用 Vite，CSS Modules 开箱即用
2. TypeScript 严格模式已启用
3. 现有代码中有一些类型错误（McpPanel、PluginsPanel），但不影响新功能
4. 所有新组件都使用 CSS Modules 以保持样式隔离

## 验证

开发服务器已成功启动，确认所有新文件都已正确创建和配置。
