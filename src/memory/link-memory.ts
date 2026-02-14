/**
 * 关联记忆系统
 * 基于 JSON 文件持久化，支持多维索引和关系管理
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MemoryImportance, type MemoryLink } from './types.js';

/**
 * 规范化文件路径（反斜杠转正斜杠）
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * 生成随机链接 ID
 */
function generateLinkId(): string {
  return 'link_' + Math.random().toString(36).substring(2, 15);
}

/**
 * 确保目录存在
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 获取链接存储文件路径
 */
function getLinksFilePath(projectDir?: string): string {
  if (projectDir) {
    // 项目级：{projectDir}/.claude/memory/links.json
    return path.join(projectDir, '.claude', 'memory', 'links.json');
  } else {
    // 全局级：~/.claude/memory/links.json
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    return path.join(claudeDir, 'memory', 'links.json');
  }
}

/**
 * 关联记忆存储格式
 */
interface LinkMemoryStore {
  links: MemoryLink[];
  version: number;
}

/**
 * 关联记忆管理器
 */
export class LinkMemory {
  private projectDir?: string;
  private filePath: string;
  private links = new Map<string, MemoryLink>();

  // 多维索引
  private fileIndex = new Map<string, Set<string>>();
  private symbolIndex = new Map<string, Set<string>>();
  private topicIndex = new Map<string, Set<string>>();
  private conversationIndex = new Map<string, Set<string>>();
  private sessionIndex = new Map<string, Set<string>>();

  constructor(projectDir?: string) {
    this.projectDir = projectDir;
    this.filePath = getLinksFilePath(projectDir);
    this.load();
  }

  /**
   * 从文件加载数据
   */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const store: LinkMemoryStore = JSON.parse(content);
        
        // 恢复链接
        for (const link of store.links) {
          this.links.set(link.id, link);
        }
        
        // 重建索引
        this.rebuildIndexesSync();
      }
    } catch (error) {
      // 加载失败时静默处理，从空状态开始
      console.warn('[LinkMemory] Failed to load:', error);
    }
  }

  /**
   * 保存到文件
   */
  private save(): void {
    try {
      const store: LinkMemoryStore = {
        links: Array.from(this.links.values()),
        version: 1,
      };
      
      ensureDir(path.dirname(this.filePath));
      fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch (error) {
      console.error('[LinkMemory] Failed to save:', error);
    }
  }

  /**
   * 创建链接
   */
  async createLink(data: Partial<MemoryLink> & Required<Pick<MemoryLink, 'files' | 'symbols' | 'commits' | 'topics' | 'description' | 'importance' | 'relatedLinks'>>): Promise<string> {
    const id = data.id || generateLinkId();
    const timestamp = data.timestamp || new Date().toISOString();
    
    // 规范化文件路径
    const normalizedFiles = data.files.map(f => normalizePath(f));
    
    const link: MemoryLink = {
      id,
      timestamp,
      conversationId: data.conversationId,
      sessionId: data.sessionId,
      files: normalizedFiles,
      symbols: data.symbols,
      commits: data.commits,
      topics: data.topics,
      description: data.description,
      importance: data.importance,
      relatedLinks: data.relatedLinks,
    };

    this.links.set(id, link);
    this.addToIndexes(link);
    this.save();
    
    return id;
  }

  /**
   * 获取链接
   */
  async getLink(id: string): Promise<MemoryLink | null> {
    return this.links.get(id) || null;
  }

  /**
   * 更新链接
   */
  async updateLink(id: string, updates: Partial<MemoryLink>): Promise<void> {
    const link = this.links.get(id);
    if (!link) return;

    // 移除旧索引
    this.removeFromIndexes(link);

    // 更新链接
    const updatedLink: MemoryLink = {
      ...link,
      ...updates,
      id, // ID 不允许修改
    };

    // 如果更新了 files，需要规范化路径
    if (updates.files) {
      updatedLink.files = updates.files.map(f => normalizePath(f));
    }

    this.links.set(id, updatedLink);
    this.addToIndexes(updatedLink);
    this.save();
  }

  /**
   * 删除链接
   */
  async removeLink(id: string): Promise<boolean> {
    const link = this.links.get(id);
    if (!link) return false;

    // 移除索引
    this.removeFromIndexes(link);
    
    // 清理其他链接中的 relatedLinks 引用
    for (const otherLink of this.links.values()) {
      if (otherLink.relatedLinks.includes(id)) {
        otherLink.relatedLinks = otherLink.relatedLinks.filter(rid => rid !== id);
      }
    }

    this.links.delete(id);
    this.save();
    return true;
  }

  /**
   * 按文件查找链接
   */
  async findByFile(file: string): Promise<MemoryLink[]> {
    const normalizedFile = normalizePath(file);
    const linkIds = this.fileIndex.get(normalizedFile);
    if (!linkIds) return [];
    
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * 按符号查找链接
   */
  async findBySymbol(symbol: string): Promise<MemoryLink[]> {
    const linkIds = this.symbolIndex.get(symbol);
    if (!linkIds) return [];
    
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * 按话题查找链接
   */
  async findByTopic(topic: string): Promise<MemoryLink[]> {
    const linkIds = this.topicIndex.get(topic);
    if (!linkIds) return [];
    
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * 按对话 ID 查找链接
   */
  async findByConversation(conversationId: string): Promise<MemoryLink[]> {
    const linkIds = this.conversationIndex.get(conversationId);
    if (!linkIds) return [];
    
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * 按会话 ID 查找链接
   */
  async findBySession(sessionId: string): Promise<MemoryLink[]> {
    const linkIds = this.sessionIndex.get(sessionId);
    if (!linkIds) return [];
    
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }

  /**
   * 按重要性查找链接
   * 返回 >= minImportance 的所有链接
   */
  async findByImportance(minImportance: MemoryImportance): Promise<MemoryLink[]> {
    const importanceOrder = [
      MemoryImportance.LOW,
      MemoryImportance.MEDIUM,
      MemoryImportance.HIGH,
      MemoryImportance.CRITICAL,
    ];
    
    const minLevel = importanceOrder.indexOf(minImportance);
    
    return Array.from(this.links.values()).filter(link => {
      const linkLevel = importanceOrder.indexOf(link.importance);
      return linkLevel >= minLevel;
    });
  }

  /**
   * 按时间范围查找链接
   */
  async findByTimeRange(start: string, end: string): Promise<MemoryLink[]> {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    
    return Array.from(this.links.values()).filter(link => {
      const linkTime = new Date(link.timestamp).getTime();
      return linkTime >= startTime && linkTime <= endTime;
    });
  }

  /**
   * 组合查询（OR 关系）
   */
  async query(opts: {
    files?: string[];
    topics?: string[];
    symbols?: string[];
    importance?: MemoryImportance;
    limit?: number;
  }): Promise<MemoryLink[]> {
    const resultSet = new Set<string>();

    // 按文件查询
    if (opts.files) {
      for (const file of opts.files) {
        const normalizedFile = normalizePath(file);
        const linkIds = this.fileIndex.get(normalizedFile);
        if (linkIds) {
          linkIds.forEach(id => resultSet.add(id));
        }
      }
    }

    // 按话题查询
    if (opts.topics) {
      for (const topic of opts.topics) {
        const linkIds = this.topicIndex.get(topic);
        if (linkIds) {
          linkIds.forEach(id => resultSet.add(id));
        }
      }
    }

    // 按符号查询
    if (opts.symbols) {
      for (const symbol of opts.symbols) {
        const linkIds = this.symbolIndex.get(symbol);
        if (linkIds) {
          linkIds.forEach(id => resultSet.add(id));
        }
      }
    }

    // 转换为链接对象
    let results = Array.from(resultSet).map(id => this.links.get(id)!).filter(Boolean);

    // 按重要性过滤
    if (opts.importance) {
      const importanceOrder = [
        MemoryImportance.LOW,
        MemoryImportance.MEDIUM,
        MemoryImportance.HIGH,
        MemoryImportance.CRITICAL,
      ];
      const minLevel = importanceOrder.indexOf(opts.importance);
      results = results.filter(link => {
        const linkLevel = importanceOrder.indexOf(link.importance);
        return linkLevel >= minLevel;
      });
    }

    // 限制结果数量
    if (opts.limit) {
      results = results.slice(0, opts.limit);
    }

    return results;
  }

  /**
   * 建立双向关联
   */
  async linkRelated(id1: string, id2: string): Promise<boolean> {
    const link1 = this.links.get(id1);
    const link2 = this.links.get(id2);
    
    if (!link1 || !link2) return false;

    // 添加双向关联
    if (!link1.relatedLinks.includes(id2)) {
      link1.relatedLinks.push(id2);
    }
    if (!link2.relatedLinks.includes(id1)) {
      link2.relatedLinks.push(id1);
    }

    this.save();
    return true;
  }

  /**
   * 解除双向关联
   */
  async unlinkRelated(id1: string, id2: string): Promise<void> {
    const link1 = this.links.get(id1);
    const link2 = this.links.get(id2);
    
    if (link1) {
      link1.relatedLinks = link1.relatedLinks.filter(id => id !== id2);
    }
    if (link2) {
      link2.relatedLinks = link2.relatedLinks.filter(id => id !== id1);
    }

    this.save();
  }

  /**
   * 获取相关链接的完整对象
   */
  async getRelated(id: string): Promise<MemoryLink[]> {
    const link = this.links.get(id);
    if (!link) return [];

    return link.relatedLinks
      .map(relatedId => this.links.get(relatedId))
      .filter((l): l is MemoryLink => l !== undefined);
  }

  /**
   * 查找两个链接之间的共同属性
   */
  async findConnections(id1: string, id2: string): Promise<{
    commonFiles: string[];
    commonSymbols: string[];
    commonTopics: string[];
  }> {
    const link1 = this.links.get(id1);
    const link2 = this.links.get(id2);
    
    if (!link1 || !link2) {
      return { commonFiles: [], commonSymbols: [], commonTopics: [] };
    }

    const commonFiles = link1.files.filter(f => link2.files.includes(f));
    const commonSymbols = link1.symbols.filter(s => link2.symbols.includes(s));
    const commonTopics = link1.topics.filter(t => link2.topics.includes(t));

    return { commonFiles, commonSymbols, commonTopics };
  }

  /**
   * 重建所有索引
   */
  async rebuildIndexes(): Promise<void> {
    this.rebuildIndexesSync();
  }

  /**
   * 重建所有索引（同步版本）
   */
  private rebuildIndexesSync(): void {
    // 清空索引
    this.fileIndex.clear();
    this.symbolIndex.clear();
    this.topicIndex.clear();
    this.conversationIndex.clear();
    this.sessionIndex.clear();

    // 重建索引
    for (const link of this.links.values()) {
      this.addToIndexes(link);
    }
  }

  /**
   * 添加到索引
   */
  private addToIndexes(link: MemoryLink): void {
    // 文件索引
    for (const file of link.files) {
      if (!this.fileIndex.has(file)) {
        this.fileIndex.set(file, new Set());
      }
      this.fileIndex.get(file)!.add(link.id);
    }

    // 符号索引
    for (const symbol of link.symbols) {
      if (!this.symbolIndex.has(symbol)) {
        this.symbolIndex.set(symbol, new Set());
      }
      this.symbolIndex.get(symbol)!.add(link.id);
    }

    // 话题索引
    for (const topic of link.topics) {
      if (!this.topicIndex.has(topic)) {
        this.topicIndex.set(topic, new Set());
      }
      this.topicIndex.get(topic)!.add(link.id);
    }

    // 对话索引
    if (link.conversationId) {
      if (!this.conversationIndex.has(link.conversationId)) {
        this.conversationIndex.set(link.conversationId, new Set());
      }
      this.conversationIndex.get(link.conversationId)!.add(link.id);
    }

    // 会话索引
    if (link.sessionId) {
      if (!this.sessionIndex.has(link.sessionId)) {
        this.sessionIndex.set(link.sessionId, new Set());
      }
      this.sessionIndex.get(link.sessionId)!.add(link.id);
    }
  }

  /**
   * 从索引中移除
   */
  private removeFromIndexes(link: MemoryLink): void {
    // 文件索引
    for (const file of link.files) {
      this.fileIndex.get(file)?.delete(link.id);
      if (this.fileIndex.get(file)?.size === 0) {
        this.fileIndex.delete(file);
      }
    }

    // 符号索引
    for (const symbol of link.symbols) {
      this.symbolIndex.get(symbol)?.delete(link.id);
      if (this.symbolIndex.get(symbol)?.size === 0) {
        this.symbolIndex.delete(symbol);
      }
    }

    // 话题索引
    for (const topic of link.topics) {
      this.topicIndex.get(topic)?.delete(link.id);
      if (this.topicIndex.get(topic)?.size === 0) {
        this.topicIndex.delete(topic);
      }
    }

    // 对话索引
    if (link.conversationId) {
      this.conversationIndex.get(link.conversationId)?.delete(link.id);
      if (this.conversationIndex.get(link.conversationId)?.size === 0) {
        this.conversationIndex.delete(link.conversationId);
      }
    }

    // 会话索引
    if (link.sessionId) {
      this.sessionIndex.get(link.sessionId)?.delete(link.id);
      if (this.sessionIndex.get(link.sessionId)?.size === 0) {
        this.sessionIndex.delete(link.sessionId);
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalLinks: number;
    totalFiles: number;
    totalSymbols: number;
    totalTopics: number;
    oldestLink?: string;
    newestLink?: string;
  } {
    const links = Array.from(this.links.values());
    
    let oldestLink: MemoryLink | undefined;
    let newestLink: MemoryLink | undefined;
    
    for (const link of links) {
      const linkTime = new Date(link.timestamp).getTime();
      
      if (!oldestLink || new Date(oldestLink.timestamp).getTime() > linkTime) {
        oldestLink = link;
      }
      if (!newestLink || new Date(newestLink.timestamp).getTime() < linkTime) {
        newestLink = link;
      }
    }

    return {
      totalLinks: this.links.size,
      totalFiles: this.fileIndex.size,
      totalSymbols: this.symbolIndex.size,
      totalTopics: this.topicIndex.size,
      oldestLink: oldestLink?.timestamp,
      newestLink: newestLink?.timestamp,
    };
  }

  /**
   * 获取所有已索引的文件路径
   */
  getAllFiles(): string[] {
    return Array.from(this.fileIndex.keys());
  }

  /**
   * 清空所有数据和索引
   */
  clear(): void {
    this.links.clear();
    this.fileIndex.clear();
    this.symbolIndex.clear();
    this.topicIndex.clear();
    this.conversationIndex.clear();
    this.sessionIndex.clear();
  }
}

// ============================================================================
// 工厂函数和缓存管理
// ============================================================================

const linkMemoryCache = new Map<string, LinkMemory>();

/**
 * 获取 LinkMemory 实例（带缓存）
 */
export function getLinkMemory(projectDir?: string): LinkMemory {
  const key = projectDir || '__global__';
  
  if (!linkMemoryCache.has(key)) {
    linkMemoryCache.set(key, new LinkMemory(projectDir));
  }
  
  return linkMemoryCache.get(key)!;
}

/**
 * 清除 LinkMemory 缓存
 */
export function resetLinkMemoryCache(): void {
  linkMemoryCache.clear();
}
