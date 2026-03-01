# Customize 页面（Connectors + Skills）

## 目标
新增独立的 Customize 页面，类似 Claude.ai 的 `/customize/connectors`，包含两个子页面：
- **Skills**: 展示已安装的 Skills，支持启用/禁用
- **Connectors**: 展示 MCP 服务器连接状态，支持连接/断开/管理

## UI 设计（参考 Claude.ai 截图）

```
┌─────────────────────────────────────────────────────────────────┐
│  TopNavBar: [Chat] [Blueprint] [Swarm] [Schedule] [Customize]  │
├────────────┬────────────────────┬───────────────────────────────┤
│ ← Customize│   Connectors       │                               │
│            │ ┌──────────────────┐│                               │
│  Skills    │ │ ▽ Not connected  ││    [GitHub Logo]              │
│  Connectors│ │   GitHub      ◎  ││                               │
│            │ │   Google Drive ◎  ││ You are not connected to     │
│            │ │                  ││ GitHub yet.                   │
│            │ │ ▽ Connected      ││                               │
│            │ │   Slack       ✓  ││    [Connect]                  │
│            │ │   Notion      ✓  ││                               │
│            │ └──────────────────┘│                               │
├────────────┴────────────────────┴───────────────────────────────┤
```

### 三栏布局
1. **左栏（导航）**: 220px 宽，"← Customize" 标题 + Skills/Connectors 菜单项
2. **中栏（列表）**: 400px 宽，连接器列表，按 "Not connected" / "Connected" 分组
3. **右栏（详情）**: flex-1，选中某个 Connector 后显示其状态和操作按钮

## 涉及文件

### 新增文件
1. `src/web/client/src/pages/CustomizePage/index.tsx` — Customize 页面主组件
2. `src/web/client/src/pages/CustomizePage/CustomizePage.module.css` — 页面样式
3. `src/web/client/src/pages/CustomizePage/ConnectorsPanel.tsx` — Connectors 子面板
4. `src/web/client/src/pages/CustomizePage/SkillsPanel.tsx` — Skills 子面板

### 修改文件
5. `src/web/client/src/Root.tsx` — 添加 'customize' 到 Page 类型 + 挂载 CustomizePage
6. `src/web/client/src/components/swarm/TopNavBar/index.tsx` — 添加 Customize tab
7. `src/web/client/src/i18n/en.json` — 英文翻译
8. `src/web/client/src/i18n/zh.json` — 中文翻译

## 实现步骤

### Step 1: 创建 CustomizePage 页面组件
- 三栏布局：左侧导航 + 中间列表 + 右侧详情
- 左侧导航有"Skills"和"Connectors"两个菜单项
- 默认显示 Connectors
- 顶部"← Customize"标题，点击"←"可返回 Chat 页面

### Step 2: 创建 ConnectorsPanel 组件
- 复用现有 McpPanel 的数据获取逻辑（WebSocket 通信获取 MCP 服务器列表）
- 将服务器分为 "Connected" 和 "Not connected" 两组显示
- 每个 Connector 显示：图标 + 名称 + 状态指示器
- 选中 Connector 后，右侧显示详情：
  - 大图标
  - 连接状态文字
  - Connect/Disconnect 按钮
  - 查看工具、重连、删除等操作

### Step 3: 创建 SkillsPanel 组件
- 从后端获取已安装的 Skills 列表
- 展示 Skill 名称、描述、状态
- 支持启用/禁用

### Step 4: 修改 Root.tsx 添加路由
- `type Page` 增加 `'customize'`
- 添加 `<CustomizePage>` 组件挂载
- 传递必要的 props（onSendMessage, addMessageHandler）

### Step 5: 修改 TopNavBar 添加 tab
- 在页面 Tab 列表中增加 "Customize" tab
- 使用拼图/自定义图标

### Step 6: 添加国际化文本
- en.json / zh.json 中添加 customize.* 相关 key

## Connectors 数据来源

Connectors 本质就是 MCP 服务器。数据来源：
- WebSocket 消息 `mcp_list` / `mcp_list_response`（已有实现）
- 操作：`mcp_toggle`（启用/禁用），`mcp_add`（添加），`mcp_remove`（删除）

不同于现有 McpPanel 的 CLI 风格界面，Connectors 使用 Claude.ai 风格的现代 UI：
- 分组显示（Connected / Not connected）
- 大图标 + 简洁状态
- 详情面板 + Connect 按钮

## 预置 Connector 图标

为常见 MCP 服务器提供品牌图标：
- GitHub (Octocat)
- Google Drive
- Slack
- Notion
- PostgreSQL/MySQL (数据库)
- 其他使用通用拼图图标

## 注意事项
- 页面使用 CSS Modules，保持与现有组件一致
- 颜色使用 CSS 变量（`var(--bg-primary)` 等），不硬编码
- 页面挂载后保持 display:none 策略（与其他页面一致，避免丢失 WebSocket 状态）
- Skills 面板可先做简版，展示列表 + 描述即可
