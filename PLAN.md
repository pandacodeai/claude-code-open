# Plan: 全局搜索面板（类似 VS Code Search）

## 目标

在 Web UI 的左侧 FileTree 面板中，添加类似 VS Code 的全局搜索功能。用户可以在文件树和搜索面板之间切换。

## 功能规格

### 搜索面板功能
1. **文本搜索**：在项目文件中搜索文本内容
2. **替换功能**：支持单个替换和全部替换
3. **搜索选项**：
   - 大小写匹配 (Aa)
   - 全词匹配 (ab)
   - 正则表达式 (.*)
4. **结果展示**：按文件分组，显示匹配行内容、行号，高亮匹配文本
5. **结果交互**：点击结果项打开对应文件并跳转到对应行

### 面板切换
- FileTree header 区域添加两个图标按钮：文件浏览器 / 搜索
- 快捷键 `Ctrl+Shift+F` 切换到搜索面板

## 架构设计

### 后端：新增 REST API

在 `src/web/server/routes/file-api.ts` 中添加：

```
POST /api/files/search
Body: {
  query: string;       // 搜索文本
  root?: string;       // 项目根目录
  isRegex?: boolean;   // 是否正则
  isCaseSensitive?: boolean;  // 区分大小写
  isWholeWord?: boolean;      // 全词匹配
  includePattern?: string;    // 包含的文件 glob（预留）
  excludePattern?: string;    // 排除的文件 glob（预留）
  maxResults?: number;        // 最大结果数（默认 500）
}

Response: {
  results: Array<{
    file: string;              // 相对路径
    matches: Array<{
      line: number;            // 行号（1-based）
      column: number;          // 列号（0-based）
      length: number;          // 匹配长度
      lineContent: string;     // 整行内容
      previewBefore: string;   // 匹配前的文本片段
      matchText: string;       // 匹配的文本
      previewAfter: string;    // 匹配后的文本片段
    }>;
  }>;
  totalMatches: number;
  truncated: boolean;          // 是否被截断
}
```

```
POST /api/files/replace
Body: {
  file: string;        // 文件相对路径
  root?: string;
  replacements: Array<{
    line: number;
    column: number;
    length: number;
    newText: string;
  }>;
}

Response: { success: boolean; replacedCount: number; }
```

**搜索实现**：使用 ripgrep（项目已有 `src/search/ripgrep.ts`），如不可用则回退到递归 fs 搜索。

### 前端：新组件 SearchPanel

**文件清单**：

| 文件 | 说明 |
|------|------|
| `src/web/client/src/components/CodeView/SearchPanel.tsx` | 搜索面板组件 |
| `src/web/client/src/components/CodeView/SearchPanel.module.css` | 搜索面板样式 |

**修改文件**：

| 文件 | 修改说明 |
|------|----------|
| `src/web/client/src/components/CodeView/FileTree.tsx` | header 添加面板切换按钮 |
| `src/web/client/src/components/CodeView/FileTree.module.css` | 面板切换按钮样式 |
| `src/web/client/src/components/CodeView/index.tsx` | 管理 activePanel 状态，渲染 SearchPanel |
| `src/web/server/routes/file-api.ts` | 添加 search 和 replace API |

### 组件结构

```
CodeView (index.tsx)
  └── fileTreePanel
      ├── PanelHeader (显示项目名 + 切换按钮)
      │   ├── 文件浏览器图标 (active when activePanel === 'explorer')
      │   └── 搜索图标 (active when activePanel === 'search')
      ├── FileTree (when activePanel === 'explorer')
      └── SearchPanel (when activePanel === 'search')
```

### SearchPanel 内部结构

```
SearchPanel
├── 搜索输入区域
│   ├── 搜索输入框 + 选项按钮(Aa, ab, .*)
│   ├── 展开箭头（展开/收起替换框）
│   └── 替换输入框 + 替换按钮（单个替换, 全部替换）
├── 结果统计栏（"X 个文件中有 Y 个结果"）
└── 结果列表（按文件分组）
    ├── 文件节点（可折叠）
    │   ├── 匹配行1（高亮匹配文本）
    │   ├── 匹配行2
    │   └── ...
    └── ...
```

### 数据流

```
用户输入搜索 → debounce(300ms) → POST /api/files/search → 更新结果
用户点击结果 → onFileSelect(file) + goToLine(line)
用户点击替换 → POST /api/files/replace → 重新搜索更新结果
```

## 实施步骤

### Step 1: 后端搜索 API
- 在 `file-api.ts` 中添加 `POST /api/files/search` 端点
- 使用递归文件扫描实现搜索（排除 node_modules 等）
- 支持 caseSensitive、wholeWord、regex 选项
- 添加 `POST /api/files/replace` 端点

### Step 2: 前端 SearchPanel 组件
- 创建 `SearchPanel.tsx` + `SearchPanel.module.css`
- 实现搜索/替换 UI（输入框、选项按钮、结果列表）
- 实现 debounce 搜索调用
- 实现结果展示（按文件分组、行内容高亮）

### Step 3: CodeView 集成
- 修改 `CodeView/index.tsx`：添加 activePanel 状态、条件渲染
- 修改 `FileTree.tsx`：header 区域添加面板切换按钮
- 添加 `Ctrl+Shift+F` 快捷键
- 点击结果打开文件并跳转

### Step 4: 替换功能
- 单个替换：替换一个匹配项
- 全部替换：替换文件中所有匹配项
- 替换后自动刷新搜索结果
