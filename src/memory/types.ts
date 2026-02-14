/**
 * 记忆系统共享类型定义
 * 用于长期记忆向量检索补充层
 */

// 记忆重要性枚举
export enum MemoryImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 记忆来源类型
export type MemorySource = 'memory' | 'session' | 'notebook';

// 记忆搜索结果
export interface MemorySearchResult {
  id: string;                   // chunk ID
  path: string;                 // 来源文件路径
  startLine: number;            // chunk 起始行
  endLine: number;              // chunk 结束行
  score: number;                // BM25 分数（已应用时间衰减）
  snippet: string;              // 匹配文本片段
  source: MemorySource;         // 来源类型
  timestamp: string;            // 写入时间 (ISO 8601)
  age: number;                  // 距今毫秒数（用于衰减计算）
}

// 记忆 chunk（索引单元）
export interface MemoryChunk {
  id: string;                   // chunk 唯一标识
  path: string;                 // 文件路径（相对路径）
  source: MemorySource;         // 来源类型
  startLine: number;            // chunk 起始行
  endLine: number;              // chunk 结束行
  text: string;                 // chunk 文本内容
  hash: string;                 // chunk 哈希（用于去重）
  createdAt: number;            // 创建时间戳（毫秒）
  updatedAt: number;            // 更新时间戳（毫秒）
}

// 链接记忆条目
export interface MemoryLink {
  id: string;                   // 链接唯一标识
  timestamp: string;            // ISO 8601 时间戳
  conversationId?: string;      // 关联的对话 ID
  sessionId?: string;           // 关联的会话 ID
  files: string[];              // 相关文件列表
  symbols: string[];            // 相关符号（函数名、类名等）
  commits: string[];            // 相关提交哈希
  topics: string[];             // 话题标签
  description: string;          // 链接描述
  importance: MemoryImportance; // 重要性级别
  relatedLinks: string[];       // 相关链接 ID 列表
}
