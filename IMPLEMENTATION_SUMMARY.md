# 长期记忆向量检索补充层 - 实现总结

## 概述

成功实现了基于 BM25 + SQLite FTS5 的长期记忆检索系统，作为现有 notebook 全量注入的补充层。

## 实现文件清单

### 核心模块 (src/memory/)

1. **types.ts** (57 行)
   - 记忆系统共享类型定义
   - MemoryImportance 枚举、MemorySource 类型
   - MemorySearchResult、MemoryChunk、MemoryLink 接口

2. **bm25-engine.ts** (350 行)
   - 自研 BM25 搜索引擎
   - 支持中英文混合分词（单字 + 2-gram + 停用词过滤）
   - BM25Engine 类：addDocument、search、buildIndex、export/import
   - ✅ 15/15 测试通过

3. **link-memory.ts** (625 行)
   - 基于 JSON 文件的关联记忆系统
   - 多维索引：file/symbol/topic/conversation/session/importance/timeRange
   - 双向关联管理、组合查询、持久化
   - ✅ 33/33 测试通过

4. **long-term-store.ts** (471 行)
   - SQLite + FTS5 长期存储层
   - 使用 better-sqlite3（同步 API）
   - FTS5 虚拟表（带 graceful fallback）
   - 分块索引、时间衰减（30天半衰期）

5. **memory-sync.ts** (241 行)
   - 增量同步引擎
   - 基于 hash 对比，递归扫描 .md 文件
   - 支持 memory 和 session 目录同步

6. **memory-search.ts** (189 行)
   - 统一搜索接口
   - 协调 LongTermStore 和 MemorySyncEngine
   - dirty flag 机制，按需同步

### 工具层 (src/tools/)

7. **memory-search.ts** (103 行)
   - MemorySearchTool 工具实现
   - 继承 BaseTool，zod schema 定义
   - 格式化搜索结果（score、age、source、path、snippet）
   - 已在 tools/index.ts 注册

### 集成修改

8. **src/core/loop.ts** (+7 行)
   - L75: 导入 initMemorySearchManager、getMemorySearchManager
   - L1904-1906: 初始化 MemorySearchManager
   - L3111-3114: autoMemorize 中调用 markDirty

9. **src/prompt/builder.ts** (+12 行)
   - L390-399: MemorySearch 工具提示词说明

10. **src/tools/index.ts** (+4 行)
    - L61: 导入 MemorySearchTool
    - L174-175: 注册 MemorySearchTool

## 关键特性

### 1. 零外部依赖
- 只使用已有的 better-sqlite3 依赖
- 不引入向量嵌入模型（避免 API key、编译问题、成本）

### 2. 自研 BM25 算法
- 不使用 wink-bm25-text-search（不支持中文）
- 中英文混合分词：英文分词 + 中文单字/2-gram
- 精确的停用词过滤

### 3. 六层防污染机制
| # | 措施 | 实现位置 | 说明 |
|---|------|---------|------|
| 1 | 项目隔离 | long-term-store.ts | 每项目独立 SQLite |
| 2 | 时间衰减 | long-term-store.ts | 30天半衰期 |
| 3 | 来源标注 | 搜索结果 | path + line + timestamp |
| 4 | 高阈值 | memory-search.ts | minScore ≥ 0.3 |
| 5 | 限制条数 | memory-search.ts | 默认最多 8 条 |
| 6 | 笔记本优先 | 架构层面 | 补充而非替代 |

### 4. 性能优化
- SQLite FTS5 全文索引（BM25 内置）
- 增量同步（hash 对比）
- dirty flag 机制（按需同步）
- 事务批量写入

### 5. 容错处理
- FTS5 不可用时 graceful fallback 到 LIKE 搜索
- 单个文件失败不影响其他文件
- 同步失败静默处理

## 测试覆盖

- ✅ BM25 引擎：15 个测试全部通过
  - 中英文分词、停用词过滤、数字处理
  - 文档索引、搜索、删除、清空
  - 序列化/反序列化、统计信息

- ✅ 关联记忆：33 个测试全部通过
  - 链接创建、更新、删除
  - 多维索引查询（6 种维度）
  - 时间范围查询、组合查询
  - 双向关联管理、持久化

- ✅ 类型检查：npx tsc --noEmit 通过

## 使用方式

### AI 调用 MemorySearch 工具

```typescript
// AI 可调用的搜索工具
{
  "name": "MemorySearch",
  "input": {
    "query": "机器学习",
    "source": "all",        // 'all' | 'memory' | 'session'
    "maxResults": 8
  }
}
```

### 返回格式

```
Found 3 memories:

[1] (score: 0.856, 3d ago, memory)
    File: projects/ai-project/notes.md:45-67
    ...机器学习是人工智能的一个分支...

[2] (score: 0.742, 1mo ago, session)
    File: session-123/summary.md:12-34
    ...讨论了深度学习在项目中的应用...
```

## 存储路径

- **全局记忆**: `~/.claude/memory/links.json`
- **项目记忆**: `{projectDir}/.claude/memory/links.json`
- **长期存储**: `~/.claude/memory/projects/{projectHash}/ltm.sqlite`
- **会话历史**: `~/.claude/projects/{sanitizedPath}/*/session-memory/summary.md`

## 技术栈

- TypeScript + ES2022 + NodeNext 模块系统
- better-sqlite3 (^11.10.0) - SQLite 同步 API
- glob (^10.3.0) - 文件递归查找
- zod (^3.22.0) - Schema 验证
- 自研 BM25 算法（~350 行）

## 性能指标

- 分块大小：400 tokens（~1600 字符）
- 重叠大小：80 tokens（~320 字符）
- 时间衰减半衰期：30 天
- 默认搜索阈值：0.3
- 默认返回条数：8

## 未来优化方向

1. **删除孤立文件**: 实现 store 中存在但磁盘上已删除的文件清理
2. **增量更新**: 支持文件部分更新（当前是全量重新索引）
3. **统计面板**: 添加 CLI 命令查看记忆存储统计
4. **配置化**: 将 token 大小、衰减参数等暴露为配置项

## 总结

成功实现了一个轻量级、零依赖、高性能的长期记忆检索系统：

- ✅ 所有 48 个测试通过
- ✅ 类型检查通过
- ✅ 集成到核心循环
- ✅ 工具已注册并可用
- ✅ 防污染机制完备
- ✅ 文档注释完整

实现遵循了 PLAN.md 的完整设计，所有约束条件均已满足。
