# 国际化 (i18n) 实现方案

## 背景
- 官方 Claude Code **没有** i18n 系统，这是自主扩展功能
- 项目已有 `language` 配置字段（`settings.json` 中），但仅用于控制 Claude 的响应语言
- 需要支持中文 + 英文，覆盖所有面向用户的 UI 文本

## 方案：轻量级自研 i18n（不引入第三方库）

### 理由
- 项目是 CLI 工具，不需要 i18next 那种重量级方案
- 文本量约几百条，结构简单，key-value 即可
- 自研方便控制，零依赖
- 保持项目简洁

### 核心设计

#### 1. 文件结构
```
src/i18n/
├── index.ts          # t() 函数、初始化、语言切换
├── types.ts          # 类型定义（所有 key 的联合类型）
└── locales/
    ├── en.ts         # 英文翻译（默认/fallback）
    └── zh.ts         # 中文翻译
```

#### 2. API 设计
```typescript
// src/i18n/index.ts
import en from './locales/en.js';
import zh from './locales/zh.js';

type LocaleKey = keyof typeof en;

const locales = { en, zh } as const;
type LocaleName = keyof typeof locales;

let currentLocale: LocaleName = 'en';

// 初始化：从 settings.json 的 language 字段读取
export function initI18n(language?: string): void {
  if (language === 'zh' || language === 'chinese' || language === '中文') {
    currentLocale = 'zh';
  } else {
    currentLocale = 'en';
  }
}

// 核心翻译函数
export function t(key: LocaleKey, params?: Record<string, string | number>): string {
  const template = locales[currentLocale]?.[key] ?? locales.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export function getCurrentLocale(): LocaleName {
  return currentLocale;
}
```

#### 3. 翻译文件格式
```typescript
// src/i18n/locales/en.ts
export default {
  // Header
  'header.connected': 'Connected',
  'header.connecting': 'Connecting...',
  'header.disconnected': 'Disconnected',
  'header.connectionError': 'Connection Error',
  
  // Shortcuts
  'shortcut.showHelp': 'Show/hide this help',
  'shortcut.cancel': 'Cancel current operation / Exit',
  
  // Permission
  'permission.allowOnce': 'Yes, allow once',
  'permission.deny': 'Deny this operation',
  
  // Tools
  'tool.fileNotFound': 'File not found: {path}',
  'tool.pathIsDirectory': 'Path is a directory: {path}',
  
  // CLI
  'cli.description': 'Claude Code - starts an interactive session by default',
  'cli.debugMode': 'Enable debug mode with optional category filtering',
  
  // ... 按模块组织
} as const;
```

#### 4. 语言检测优先级
1. `settings.json` 的 `language` 字段
2. 环境变量 `CLAUDE_CODE_LANG`
3. 系统 locale（`process.env.LANG`、`process.env.LC_ALL`）
4. 默认 `en`

#### 5. 初始化时机
在 `src/cli.ts` 的启动阶段，加载配置后立即调用 `initI18n(config.language)`。

### 实施步骤

#### Phase 1: 搭建基础设施
1. 创建 `src/i18n/index.ts` — t() 函数、initI18n、语言检测
2. 创建 `src/i18n/locales/en.ts` — 英文翻译文件（先放空壳）
3. 创建 `src/i18n/locales/zh.ts` — 中文翻译文件（先放空壳）
4. 在 `src/cli.ts` 启动时调用 `initI18n()`

#### Phase 2: 逐模块替换硬编码文本
按优先级逐步替换，每个模块一个 PR/批次：

1. **src/ui/components/** — UI 组件（Header, ShortcutHelp, PermissionPrompt, TrustDialog 等）
2. **src/tools/** — 工具错误消息和描述
3. **src/cli.ts** — CLI 帮助文本
4. **src/core/** — 系统错误消息

每个文件的替换模式：
```typescript
// Before
return 'Connected';

// After
import { t } from '../../i18n/index.js';
return t('header.connected');
```

#### Phase 3: 中文翻译
- 填充 `zh.ts` 的所有翻译

### 不做的事情
- **不翻译 system prompt**（`src/prompt/`）— 这些是给 AI 读的，保持英文
- **不翻译 debug/log 消息** — 这些是给开发者看的
- **不引入 ICU 消息格式** — 简单的 `{param}` 替换足够
- **不做复数处理** — 英文用简单的三元表达式，中文无复数问题
- **不做 lazy loading** — 两个语言包加起来很小

### 注意事项
- 翻译 key 按模块命名：`module.submodule.key`
- 英文翻译文件同时作为 fallback 和 key 的文档
- 类型安全：通过 `keyof typeof en` 确保只能用已定义的 key
