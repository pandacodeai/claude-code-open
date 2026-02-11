/**
 * 前端 i18n 翻译表
 * 用于 WebUI React 组件的国际化
 */

export type Locale = 'en' | 'zh';

export interface Translations {
  [key: string]: string;
}

const en: Translations = {
  // SettingsPanel - Header
  'settings.title': 'Settings',

  // SettingsPanel - Tabs
  'settings.tab.general': 'General',
  'settings.tab.model': 'Model',
  'settings.tab.apiAdvanced': 'API Advanced',
  'settings.tab.permissions': 'Permissions',
  'settings.tab.hooks': 'Hooks',
  'settings.tab.system': 'System',
  'settings.tab.cache': 'Cache',
  'settings.tab.importExport': 'Import/Export',
  'settings.tab.mcp': 'MCP',
  'settings.tab.plugins': 'Plugins',
  'settings.tab.about': 'About',

  // SettingsPanel - General tab
  'settings.general.title': 'General Settings',
  'settings.general.description': 'Configure general application settings.',
  'settings.general.theme': 'Theme',
  'settings.general.theme.dark': 'Dark (Default)',
  'settings.general.theme.light': 'Light',
  'settings.general.language': 'Language',
  'settings.general.autoSave': 'Auto-save Sessions',
  'settings.general.enabled': 'Enabled',
  'settings.general.disabled': 'Disabled',

  // SettingsPanel - Model tab
  'settings.model.title': 'Model Settings',
  'settings.model.description': 'Choose which Claude model to use for conversations.',
  'settings.model.defaultModel': 'Default Model',
  'settings.model.opus.name': 'Claude Opus 4.5 (Most capable)',
  'settings.model.sonnet.name': 'Claude Sonnet 4.5 (Balanced)',
  'settings.model.haiku.name': 'Claude Haiku 4.5 (Fastest)',
  'settings.model.opus.title': 'Claude Opus 4.5',
  'settings.model.opus.desc': 'Most intelligent and capable model. Best for complex reasoning, analysis, and creative tasks. Extended thinking capabilities.',
  'settings.model.sonnet.title': 'Claude Sonnet 4.5',
  'settings.model.sonnet.desc': 'Balanced performance. Great for most coding tasks and general assistance. Good speed-to-capability ratio.',
  'settings.model.haiku.title': 'Claude Haiku 4.5',
  'settings.model.haiku.desc': 'Fastest and most cost-effective. Ideal for simple tasks and quick responses.',

  // SettingsPanel - About tab
  'settings.about.title': 'About Claude Code WebUI',
  'settings.about.description': 'An educational reverse-engineering project that recreates Claude Code CLI.',
  'settings.about.version': 'Version',
  'settings.about.repository': 'Repository',
  'settings.about.license': 'License',
  'settings.about.licenseValue': 'Educational Use Only',
  'settings.about.disclaimer': 'Disclaimer',
  'settings.about.disclaimerText': 'This is NOT the official Claude Code source. It is a learning project based on public APIs and type definitions.',
  'settings.about.features': 'Features',
  'settings.about.feature1': '25+ integrated tools for file operations and code analysis',
  'settings.about.feature2': 'Session management with persistence',
  'settings.about.feature3': 'MCP (Model Context Protocol) server support',
  'settings.about.feature4': 'Plugin system for extensibility',
  'settings.about.feature5': 'Multi-model support (Opus, Sonnet, Haiku)',
  'settings.about.feature6': 'File attachments and image support',
  'settings.about.feature7': 'Slash commands for quick actions',
  'settings.about.links': 'Useful Links',
  'settings.about.link.docs': 'Claude Code Documentation',
  'settings.about.link.mcp': 'MCP Documentation',
  'settings.about.link.github': 'GitHub Repository',
};

const zh: Translations = {
  // SettingsPanel - Header
  'settings.title': '设置',

  // SettingsPanel - Tabs
  'settings.tab.general': '通用',
  'settings.tab.model': '模型',
  'settings.tab.apiAdvanced': 'API 高级',
  'settings.tab.permissions': '权限',
  'settings.tab.hooks': '钩子',
  'settings.tab.system': '系统',
  'settings.tab.cache': '缓存',
  'settings.tab.importExport': '导入/导出',
  'settings.tab.mcp': 'MCP',
  'settings.tab.plugins': '插件',
  'settings.tab.about': '关于',

  // SettingsPanel - General tab
  'settings.general.title': '通用设置',
  'settings.general.description': '配置应用程序的通用设置。',
  'settings.general.theme': '主题',
  'settings.general.theme.dark': '深色（默认）',
  'settings.general.theme.light': '浅色',
  'settings.general.language': '语言',
  'settings.general.autoSave': '自动保存会话',
  'settings.general.enabled': '启用',
  'settings.general.disabled': '禁用',

  // SettingsPanel - Model tab
  'settings.model.title': '模型设置',
  'settings.model.description': '选择对话使用的 Claude 模型。',
  'settings.model.defaultModel': '默认模型',
  'settings.model.opus.name': 'Claude Opus 4.5（最强）',
  'settings.model.sonnet.name': 'Claude Sonnet 4.5（均衡）',
  'settings.model.haiku.name': 'Claude Haiku 4.5（最快）',
  'settings.model.opus.title': 'Claude Opus 4.5',
  'settings.model.opus.desc': '最智能、最强大的模型。擅长复杂推理、分析和创意任务，支持扩展思考。',
  'settings.model.sonnet.title': 'Claude Sonnet 4.5',
  'settings.model.sonnet.desc': '性能均衡。适合大多数编程任务和通用辅助，速度与能力比优秀。',
  'settings.model.haiku.title': 'Claude Haiku 4.5',
  'settings.model.haiku.desc': '最快速、最经济。适合简单任务和快速响应。',

  // SettingsPanel - About tab
  'settings.about.title': '关于 Claude Code WebUI',
  'settings.about.description': '一个以教育为目的的逆向工程项目，重现 Claude Code CLI。',
  'settings.about.version': '版本',
  'settings.about.repository': '仓库',
  'settings.about.license': '许可',
  'settings.about.licenseValue': '仅供教育用途',
  'settings.about.disclaimer': '免责声明',
  'settings.about.disclaimerText': '这不是官方 Claude Code 源码。这是一个基于公开 API 和类型定义的学习项目。',
  'settings.about.features': '功能特性',
  'settings.about.feature1': '25+ 集成工具，支持文件操作和代码分析',
  'settings.about.feature2': '会话管理与持久化',
  'settings.about.feature3': 'MCP（模型上下文协议）服务器支持',
  'settings.about.feature4': '可扩展的插件系统',
  'settings.about.feature5': '多模型支持（Opus、Sonnet、Haiku）',
  'settings.about.feature6': '文件附件和图片支持',
  'settings.about.feature7': '斜杠命令快速操作',
  'settings.about.links': '相关链接',
  'settings.about.link.docs': 'Claude Code 文档',
  'settings.about.link.mcp': 'MCP 文档',
  'settings.about.link.github': 'GitHub 仓库',
};

export const locales: Record<Locale, Translations> = { en, zh };
