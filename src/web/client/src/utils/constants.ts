import type { SlashCommand } from '../types';

// 斜杠命令列表（与官方 @anthropic-ai/claude-code v2.1.4 及后端 slash-commands.ts 对齐）
export const SLASH_COMMANDS: SlashCommand[] = [
  // General
  { name: '/help', description: '显示所有可用命令', usage: '/help [命令名]', category: 'general' },
  { name: '/clear', description: '清除对话历史并释放上下文', aliases: ['/reset', '/new'], category: 'general' },
  { name: '/status', description: '显示系统状态（版本、模型、API 等）', category: 'general' },
  { name: '/exit', description: '退出 Claude Code', aliases: ['/quit'], category: 'general' },
  { name: '/doctor', description: '诊断安装和设置', category: 'general' },
  { name: '/color', description: '设置提示栏颜色', category: 'general' },
  { name: '/release-notes', description: '查看版本更新日志', category: 'general' },
  { name: '/btw', description: '快速提一个侧问题', category: 'general' },

  // Session
  { name: '/compact', description: '压缩对话历史并保留摘要', category: 'session' },
  { name: '/context', description: '显示当前上下文使用情况', category: 'session' },
  { name: '/cost', description: '显示当前会话费用和时长', category: 'session' },
  { name: '/resume', description: '恢复之前的对话', aliases: ['/continue'], category: 'session' },
  { name: '/rename', description: '重命名当前对话', category: 'session' },
  { name: '/export', description: '导出对话到文件或剪贴板', category: 'session' },
  { name: '/tag', description: '切换会话的可搜索标签', category: 'session' },
  { name: '/stats', description: '显示 Claude Code 使用统计', category: 'session' },
  { name: '/files', description: '列出当前上下文中的所有文件', category: 'session' },
  { name: '/fork', description: '创建对话的分叉副本', category: 'session' },
  { name: '/copy', description: '复制 Claude 的上一条回复', category: 'session' },
  { name: '/session', description: '显示远程会话 URL 和二维码', aliases: ['/remote'], category: 'session' },
  { name: '/rewind', description: '恢复代码/对话到之前的状态', aliases: ['/checkpoint'], category: 'session' },

  // Config
  { name: '/model', description: '设置 AI 模型', category: 'config' },
  { name: '/config', description: '打开配置面板', aliases: ['/settings'], category: 'config' },
  { name: '/permissions', description: '管理工具权限规则', aliases: ['/allowed-tools'], category: 'config' },
  { name: '/hooks', description: '管理钩子配置', category: 'config' },
  { name: '/privacy-settings', description: '查看和更新隐私设置', category: 'config' },
  { name: '/theme', description: '更改主题', category: 'config' },
  { name: '/vim', description: '切换 Vim 编辑模式', category: 'config' },
  { name: '/keybindings', description: '打开键绑定配置文件', category: 'config' },
  { name: '/output-style', description: '设置输出风格', category: 'config' },
  { name: '/plan', description: '启用 plan 模式或查看会话计划', category: 'config' },
  { name: '/terminal-setup', description: '终端配置', category: 'config' },
  { name: '/remote-env', description: '配置远程环境', category: 'config' },

  // Utility
  { name: '/tasks', description: '列出和管理后台任务', aliases: ['/bashes'], category: 'utility' },
  { name: '/todos', description: '列出当前待办事项', category: 'utility' },
  { name: '/add-dir', description: '添加新的工作目录', category: 'utility' },
  { name: '/skills', description: '列出可用技能', category: 'utility' },
  { name: '/memory', description: '编辑 Claude 记忆文件', category: 'utility' },
  { name: '/usage', description: '显示计划使用限制', category: 'utility' },
  { name: '/extra-usage', description: '配置额外用量', category: 'utility' },
  { name: '/rate-limit-options', description: '显示速率限制选项', category: 'utility' },
  { name: '/stickers', description: '订购 Claude Code 贴纸', category: 'utility' },

  // Integration
  { name: '/mcp', description: '管理 MCP 服务器', category: 'config' },
  { name: '/agents', description: '管理代理配置', aliases: ['/plugins', '/marketplace'], category: 'integration' },
  { name: '/plugin', description: '管理 Claude Code 插件', aliases: ['/plugins', '/marketplace'], category: 'integration' },
  { name: '/ide', description: '管理 IDE 集成并显示状态', category: 'integration' },
  { name: '/chrome', description: 'Claude in Chrome (Beta) 设置', category: 'integration' },
  { name: '/mobile', description: '显示移动端应用二维码', aliases: ['/ios', '/android'], category: 'integration' },
  { name: '/install', description: '安装 Claude Code 原生构建', category: 'integration' },
  { name: '/install-github-app', description: '设置 Claude GitHub Actions', category: 'integration' },
  { name: '/install-slack-app', description: '安装 Claude Slack 应用', category: 'integration' },

  // Auth
  { name: '/login', description: '使用 Anthropic 账户登录', category: 'auth' },
  { name: '/logout', description: '从 Anthropic 账户登出', category: 'auth' },
  { name: '/upgrade', description: '升级到 Max 获取更高速率限制', category: 'auth' },
  { name: '/passes', description: '管理 passes', category: 'auth' },

  // Development
  { name: '/init', description: '初始化新的 CLAUDE.md 文件', category: 'development' },
  { name: '/review', description: '审查 Pull Request', category: 'development' },
  { name: '/feedback', description: '提交 Claude Code 反馈', aliases: ['/bug'], category: 'development' },
  { name: '/pr-comments', description: '获取 GitHub PR 的评论', category: 'development' },
  { name: '/think-back', description: '2025 年度 Claude Code 回顾', category: 'development' },
  { name: '/thinkback-play', description: '播放年度回顾动画', category: 'development' },
  { name: '/insights', description: '生成会话分析报告', category: 'development' },
];

// 工具名称映射
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  Bash: '终端命令',
  BashOutput: '终端输出',
  KillShell: '终止进程',
  Read: '读取文件',
  Write: '写入文件',
  Edit: '编辑文件',
  MultiEdit: '批量编辑',
  Glob: '文件搜索',
  Grep: '内容搜索',
  WebFetch: '网页获取',
  WebSearch: '网页搜索',
  TodoWrite: '任务管理',
  Task: '子任务',
  NotebookEdit: '笔记本编辑',
  AskUserQuestion: '询问用户',
  ScheduleTask: '定时任务',
};

// 工具图标映射
export const TOOL_ICONS: Record<string, string> = {
  Bash: '💻',
  Read: '📖',
  Write: '✏️',
  Edit: '🔧',
  MultiEdit: '📝',
  Glob: '🔍',
  Grep: '🔎',
  WebFetch: '🌐',
  WebSearch: '🔍',
  TodoWrite: '📋',
  Task: '🤖',
  NotebookEdit: '📓',
  AskUserQuestion: '❓',
  ScheduleTask: '⏰',
};

// 格式化日期
export function formatDate(timestamp: number | undefined | null): string {
  // 处理无效输入
  if (timestamp === undefined || timestamp === null || isNaN(timestamp)) {
    return '未知时间';
  }

  const date = new Date(timestamp);

  // 检查是否是有效日期
  if (isNaN(date.getTime())) {
    return '未知时间';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
