# WebUI 斜杠命令系统对齐官方 CLI

## 目标
将 WebUI + CLI 的斜杠命令系统与官方 `@anthropic-ai/claude-code` v2.1.4 完全对齐。

## 官方命令完整列表（62 个用户可用命令）

| 命令 | 类型 | 描述 | 别名 |
|------|------|------|------|
| add-dir | local-jsx | Add a new working directory | |
| agents | local-jsx | Manage agent configurations | plugins, marketplace |
| btw | local-jsx | Ask a quick side question | |
| chrome | local-jsx | Claude in Chrome (Beta) settings | |
| clear | local | Clear conversation history and free up context | reset, new |
| color | local | Set the prompt bar color for this session | |
| compact | local | Clear conversation history but keep a summary | |
| config | local-jsx | Open config panel | settings |
| context | local-jsx / local | Show current context usage | |
| copy | local | Copy Claude's last response | |
| cost | local | Show total cost and duration of session | |
| doctor | local-jsx | Diagnose installation and settings | |
| exit | local-jsx | Exit the REPL | quit |
| export | local-jsx | Export conversation to file or clipboard | |
| extra-usage | local-jsx | Configure extra usage | |
| feedback | local-jsx | Submit feedback about Claude Code | bug |
| files | local | List all files currently in context | |
| fork | local-jsx | Create a fork of the conversation | |
| help | local-jsx | Show help and available commands | |
| hooks | local-jsx | Manage hook configurations | |
| ide | prompt | Manage IDE integrations and show status | |
| init | local-jsx | Initialize a new CLAUDE.md file | |
| install | local-jsx | Install Claude Code native build | |
| install-github-app | local-jsx | Set up Claude GitHub Actions | |
| install-slack-app | local | Install the Claude Slack app | |
| keybindings | local | Open keybindings configuration file | |
| login | local-jsx | Sign in with Anthropic account | |
| logout | local-jsx | Sign out from Anthropic account | |
| mcp | local-jsx | Manage MCP servers | |
| memory | local-jsx | Edit Claude memory files | |
| mobile | local-jsx | Show QR code for Claude mobile app | ios, android |
| model | local-jsx | Set the AI model | |
| output-style | local-jsx | Set the output style | |
| passes | local-jsx | Manage passes | |
| permissions | local-jsx | Manage tool permission rules | allowed-tools |
| plan | local-jsx | Enable plan mode or view session plan | |
| plugin | local-jsx | Manage Claude Code plugins | plugins, marketplace |
| pr-comments | prompt | Get comments from a GitHub PR | |
| privacy-settings | local-jsx | View and update privacy settings | |
| rate-limit-options | local-jsx | Show options when rate limit reached | |
| release-notes | local | View release notes | |
| remote-env | local-jsx | Configure remote environment for teleport | |
| rename | local | Rename the current conversation | |
| resume | local-jsx | Resume a previous conversation | continue |
| review | local-jsx | Review a pull request | |
| rewind | local | Restore code/conversation to previous point | checkpoint |
| session | local-jsx | Show remote session URL and QR code | remote |
| skills | local-jsx | List available skills | |
| stats | local-jsx | Show Claude Code usage statistics | |
| status | local-jsx | Show status (version, model, API, etc.) | |
| stickers | prompt | Order Claude Code stickers | |
| tag | local-jsx | Toggle a searchable tag on session | |
| tasks | local-jsx | List and manage background tasks | bashes |
| terminal-setup | local-jsx | Terminal configuration | |
| theme | local-jsx | Change the theme | |
| think-back | local-jsx | Your 2025 Claude Code Year in Review | |
| thinkback-play | local | Play the thinkback animation | |
| todos | local-jsx | List current todo items | |
| upgrade | local-jsx | Upgrade to Max for higher rate limits | |
| usage | local-jsx | Show plan usage limits | |
| vim | local | Toggle Vim editing mode | |
| insights | prompt | Generate session analysis report | |

另外 4 个内部/特殊命令（用户不直接调用）: callback, function, mcp__, statusline

## 我们需要删除的命令（12个，官方没有）

- checkpoint, plugins(改为plugin), version, bug(改为feedback别名), discover, transcript, sandbox, api, pr, security-review, map, dev

## 我们需要新增的命令（21个）

- btw, color, copy, extra-usage, fork, install, install-github-app, install-slack-app, keybindings, output-style, plan, plugin, rate-limit-options, release-notes, remote-env, session, stickers, terminal-setup, think-back, thinkback-play, insights

## 关键设计决策

### 1. 命令执行方式（核心问题）

官方 CLI 命令分三种类型：
- **local**: 纯本地函数调用，直接返回文本结果
- **local-jsx**: 渲染 React(Ink) 组件到终端，有交互式 UI
- **prompt**: 构造系统消息发送给 Claude API，由 AI 执行

我们的 WebUI 后端不能渲染 Ink 组件，所以统一采用 **文本结果 + JSON 数据** 方式。
- `local` / `local-jsx` → 后端直接执行，返回 `CommandResult { success, message, data, action }`
- `prompt` → 返回结果告诉用户该命令会作为提示发给 Claude，或者后端将内容注入对话

### 2. 文件修改范围

三个文件需要同步修改：

1. **`src/web/server/slash-commands.ts`** — 后端命令注册和执行（主要工作量）
2. **`src/web/client/src/utils/constants.ts`** — 前端命令面板列表
3. **`src/cli.ts`** — CLI 模式斜杠命令处理

### 3. 分类调整

官方没有使用分类系统，但我们的 WebUI 前端需要分类来组织面板。保持现有分类但调整：
- general: help, clear, exit, status, doctor, color, release-notes
- session: compact, context, cost, resume, rename, export, tag, stats, files, fork, copy, session, rewind
- config: model, config, permissions, hooks, privacy-settings, theme, vim, keybindings, output-style, plan, terminal-setup, remote-env
- utility: tasks, todos, add-dir, skills, memory, usage, extra-usage, rate-limit-options, stickers
- integration: mcp, agents, plugin, ide, chrome, mobile, install, install-github-app, install-slack-app
- auth: login, logout, upgrade, passes
- development: review, feedback, pr-comments, init, btw, insights, think-back, thinkback-play

## 实施步骤

### Step 1: 清理后端 slash-commands.ts
- 删除 12 个非官方命令: checkpoint, plugins, version, bug, discover, transcript, sandbox, api, pr, security-review, map, dev
- 注意 `plugins` 改为 `plugin`（别名 plugins, marketplace），`bug` 改为 `feedback` 的别名

### Step 2: 新增 21 个命令到后端 slash-commands.ts
每个命令用简洁实现：
- btw: 提示用户直接在对话中问侧问题
- color: 返回当前颜色设置说明
- copy: 提示功能说明
- extra-usage: 显示额外用量配置
- fork: 提示会话 fork 功能
- install: 显示安装信息
- install-github-app: 显示 GitHub 设置指引
- install-slack-app: 显示 Slack 设置指引
- keybindings: 显示键绑定配置路径
- output-style: 显示输出风格设置
- plan: 显示/切换 plan 模式
- plugin: 管理插件（替代旧 plugins 命令）
- rate-limit-options: 显示限速时的选项
- release-notes: 显示版本更新日志
- remote-env: 显示远程环境配置
- session: 显示会话信息
- stickers: 彩蛋命令
- terminal-setup: 终端配置
- think-back: 年度回顾
- thinkback-play: 播放回顾动画
- insights: 提示为 prompt 类型命令

### Step 3: 同步前端 constants.ts
更新 SLASH_COMMANDS 数组与后端完全对齐

### Step 4: 同步 CLI cli.ts
更新 handleSlashCommand 中的 switch 分支与后端对齐

### Step 5: 构建验证
运行 `npx tsc --noEmit` 确保类型检查通过
