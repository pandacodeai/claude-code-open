/**
 * 中文语言包
 */
import type { LocaleKeys } from './en.js';

const zh: Record<LocaleKeys, string> = {
  // ============ Header ============
  'header.connected': '已连接',
  'header.connecting': '连接中...',
  'header.disconnected': '已断开',
  'header.connectionError': '连接错误',
  'header.planMode': '计划模式',
  'header.planModeActive': '计划模式已激活',
  'header.planModeHint': '只读探索模式。使用 /plan exit 提交计划。',
  'header.updateAvailable': '可更新: v{{version}}',
  'header.updateAvailableShort': 'v{{version}} 可用',
  'header.newVersionAvailable': '新版本可用！运行：',
  'header.welcomeBack': '欢迎回来 {{username}}！',
  'header.pressForShortcuts': '按 ? 查看快捷键',
  'header.task': '{{count}} 个任务',
  'header.tasks': '{{count}} 个任务',

  // ============ ShortcutHelp ============
  'shortcut.title': '键盘快捷键',
  'shortcut.closeHint': '按 ? 或 Esc 关闭',
  'shortcut.tip': '提示：输入 /help 查看所有可用命令',
  // General
  'shortcut.showHelp': '显示/隐藏帮助',
  'shortcut.cancel': '取消当前操作 / 退出',
  'shortcut.clearScreen': '清屏',
  'shortcut.goBack': '取消 / 返回',
  // Input
  'shortcut.submit': '发送消息',
  'shortcut.navigateHistory': '浏览历史',
  'shortcut.autocomplete': '自动补全命令',
  'shortcut.externalEditor': '在外部编辑器中打开',
  // Model
  'shortcut.switchModel': '切换模型 (opus → sonnet → haiku)',
  'shortcut.switchModelAlt': '切换模型（备用键）',
  // Tasks
  'shortcut.backgroundTask': '将当前任务移至后台',
  'shortcut.toggleTodos': '显示/隐藏待办事项',
  // Commands
  'shortcut.showCommands': '显示所有命令',
  'shortcut.clearConversation': '清除对话',
  'shortcut.compactHistory': '压缩对话历史',
  'shortcut.switchModelCmd': '切换模型',
  'shortcut.showStatus': '显示会话状态',
  'shortcut.runDiagnostics': '运行诊断',
  // Categories
  'shortcut.category.general': '通用',
  'shortcut.category.input': '输入',
  'shortcut.category.model': '模型',
  'shortcut.category.tasks': '任务',
  'shortcut.category.commands': '命令',

  // ============ PermissionPrompt ============
  'permission.title': '需要授权',
  'permission.titleDangerous': '危险操作 - 需要授权',
  'permission.allowOnce': '是，允许一次',
  'permission.allowOnceDesc': '仅允许本次操作',
  'permission.deny': '否，拒绝',
  'permission.denyDesc': '拒绝本次操作',
  'permission.allowSession': '本次会话允许',
  'permission.allowSessionDesc': '记住直到程序退出',
  'permission.allowAlways': '始终允许（记住）',
  'permission.allowAlwaysDesc': '保存到配置文件',
  'permission.neverAllow': '始终拒绝（记住）',
  'permission.neverAllowDesc': '保存拒绝到配置文件',
  'permission.warningDestructive': '警告：此操作可能造成破坏性影响！',
  'permission.similarPatterns': '已记住的相似模式：{{patterns}}',
  'permission.feedbackPrompt': '提供反馈（可选）：',
  'permission.feedbackHint': 'Enter：提交并拒绝 · ESC：取消',
  'permission.footerNav': '↑/↓ 导航 · 回车 选择 · 快捷键',
  'permission.footerTab': 'Tab：自动补全',
  'permission.footerShortcuts': 'y：允许一次 · n：拒绝 · s：本次会话',
  'permission.footerShiftTab': 'Shift+Tab：切换模式',
  'permission.autoAcceptEdits': '自动接受编辑模式',
  'permission.planMode': '计划模式',
  // Permission types
  'permission.type.fileRead': '文件读取',
  'permission.type.fileWrite': '文件写入',
  'permission.type.fileDelete': '文件删除',
  'permission.type.bashCommand': 'Bash 命令',
  'permission.type.networkRequest': '网络请求',
  'permission.type.mcpServer': 'MCP 服务器',
  'permission.type.pluginInstall': '插件安装',
  'permission.type.systemConfig': '系统配置',
  'permission.type.elevatedCommand': '管理员权限',
  'permission.type.unknown': '未知',
  // Resource labels
  'permission.resource.file': '文件',
  'permission.resource.command': '命令',
  'permission.resource.url': 'URL',
  'permission.resource.server': '服务器',
  'permission.resource.default': '资源',
  // Elevated command
  'permission.elevated.title': '需要管理员权限',
  'permission.elevated.win32': '批准后将弹出 Windows UAC 对话框',
  'permission.elevated.darwin': '批准后将弹出 macOS 密码输入对话框',
  'permission.elevated.linux': '批准后需要输入 sudo 密码',

  // ============ WelcomeScreen ============
  'welcome.welcomeBack': '欢迎回来 {{username}}！',
  'welcome.welcomeTo': '欢迎使用 Claude Code！',
  'welcome.recentActivity': '最近活动',
  'welcome.resumeForMore': '/resume 查看更多',
  'welcome.noRecentActivity': '暂无最近活动',
  'welcome.whatsNew': '最新动态',
  'welcome.releaseNotes': '/release-notes 查看更多',
  'welcome.justNow': '刚刚',
  'welcome.minutesAgo': '{{count}}分钟前',
  'welcome.hoursAgo': '{{count}}小时前',
  'welcome.daysAgo': '{{count}}天前',

  // ============ TrustDialog ============
  'trust.default.title': '信任此文件夹？',
  'trust.default.body': 'Claude Code 将在此文件夹中工作。\n\n这意味着我可以：\n- 读取此文件夹中的任何文件\n- 创建、编辑或删除文件\n- 运行命令（如 npm、git、tests、ls、rm）\n- 使用 .mcp.json 中定义的工具',
  'trust.default.learnMore': '了解更多',
  'trust.default.yes': '是，继续',
  'trust.default.no': '否，退出',
  'trust.normalize.title': '访问工作区：',
  'trust.normalize.body': '安全检查：这是你创建的项目还是你信任的项目？（比如你自己的代码、知名开源项目或团队项目）。如果不是，请先查看此文件夹中的内容。\n\nClaude Code 将能够读取、编辑和执行此处的文件。',
  'trust.normalize.learnMore': '安全指南',
  'trust.normalize.yes': '是，我信任此文件夹',
  'trust.normalize.no': '否，退出',
  'trust.explicit.title': '你想在此文件夹中工作吗？',
  'trust.explicit.body': '要在此文件夹中工作，我们需要你授权 Claude Code 读取、编辑和执行文件。\n\n如果此文件夹包含恶意代码或不受信任的脚本，Claude Code 在尝试帮助时可能会运行它们。',
  'trust.explicit.learnMore': '安全指南',
  'trust.explicit.yes': '是，我信任此文件夹',
  'trust.explicit.no': '否，退出',
  'trust.homeDirectory': '主目录',
  'trust.homeWarning': '注意：你正在主目录中运行。接受信任将启用 hooks 和 skills 等可执行代码的功能。',
  'trust.navHint': '使用方向键选择，回车确认，Esc 取消',
  'trust.processing': '处理中...',

  // ============ StatusBar ============
  'status.msgs': '条消息',
  'status.tokens': 'tokens',
  'status.processing': '处理中...',
  'status.context': '上下文:',

  // ============ TodoList ============
  'todo.title': '任务',
  'todo.progress': '进度：{{current}}/{{total}} ({{percentage}}%)',
  'todo.inProgress': '进行中',
  'todo.pending': '待处理',
  'todo.completed': '已完成',
  'todo.navHint': '使用 ↑↓ 导航',

  // ============ BackgroundTasksPanel ============
  'bgTasks.title': '后台任务 ({{count}})',
  'bgTasks.running': '运行中：{{count}}',
  'bgTasks.completed': '已完成：{{count}}',
  'bgTasks.failed': '失败：{{count}}',
  'bgTasks.moreTasks': '... 还有 {{count}} 个任务',
  'bgTasks.hint': '按 Ctrl+B 关闭 | 使用 /tasks 管理',

  // ============ UpdateNotification ============
  'update.checking': '正在检查更新…',
  'update.available': '有新版本可用！',
  'update.newVersion': '新版本 ({{version}}) 已发布。',
  'update.runCommand': '运行：npm install -g @anthropic-ai/claude-code',
  'update.checkFailed': '更新检查失败：{{error}}',
};

export default zh;
