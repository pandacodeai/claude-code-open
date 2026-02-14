/**
 * BM25 搜索引擎
 * 自研实现，支持中英文混合分词
 */

// 英文停用词列表
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'to', 'of',
  'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or',
  'nor', 'not', 'so', 'very', 'just', 'about', 'up', 'its', 'no', 'it',
  'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you',
  'your', 'he', 'him', 'his', 'she', 'her',
]);

/**
 * 中英文混合分词
 * - 英文：按空格/标点分割，转小写，过滤停用词
 * - 中文：单字分割 + 相邻字符 2-gram
 * - 数字：按非字母分割后保留
 */
export function tokenize(text: string): string[] {
  if (!text) return [];

  const tokens: string[] = [];
  const chars = Array.from(text); // 支持 Unicode

  let i = 0;
  while (i < chars.length) {
    const char = chars[i];
    const code = char.charCodeAt(0);

    // 中文字符范围 (CJK Unified Ideographs)
    const isChinese = (code >= 0x4e00 && code <= 0x9fff) ||
                      (code >= 0x3400 && code <= 0x4dbf) ||
                      (code >= 0x20000 && code <= 0x2a6df);

    if (isChinese) {
      // 单字
      tokens.push(char);
      
      // 2-gram（如果下一个字符也是中文）
      if (i + 1 < chars.length) {
        const nextChar = chars[i + 1];
        const nextCode = nextChar.charCodeAt(0);
        const nextIsChinese = (nextCode >= 0x4e00 && nextCode <= 0x9fff) ||
                              (nextCode >= 0x3400 && nextCode <= 0x4dbf) ||
                              (nextCode >= 0x20000 && nextCode <= 0x2a6df);
        if (nextIsChinese) {
          tokens.push(char + nextChar);
        }
      }
      i++;
    } else {
      // 英文/数字：分别收集字母和数字
      let word = '';
      let isNumber = /[0-9]/.test(char);
      
      while (i < chars.length) {
        const c = chars[i];
        const cc = c.charCodeAt(0);
        const isCJK = (cc >= 0x4e00 && cc <= 0x9fff) ||
                      (cc >= 0x3400 && cc <= 0x4dbf) ||
                      (cc >= 0x20000 && cc <= 0x2a6df);
        
        if (isCJK) break;
        
        // 字母和数字分开处理
        if (isNumber && /[0-9]/.test(c)) {
          word += c;
          i++;
        } else if (!isNumber && /[a-zA-Z]/.test(c)) {
          word += c;
          i++;
        } else if (/[a-zA-Z0-9]/.test(c)) {
          // 遇到不同类型的字符，结束当前单词
          break;
        } else {
          // 标点或空格，结束当前单词
          i++;
          break;
        }
      }

      if (word) {
        const lower = word.toLowerCase();
        // 过滤停用词（仅英文）
        if (!/^\d+$/.test(lower) && !STOP_WORDS.has(lower)) {
          tokens.push(lower);
        } else if (/^\d+$/.test(lower)) {
          // 纯数字保留
          tokens.push(lower);
        }
      }
    }
  }

  return tokens;
}

// BM25 文档接口
export interface BM25Document {
  id: string;
  text: string;
  fields?: Record<string, string>;
}

// BM25 搜索结果
export interface BM25SearchResult {
  id: string;
  score: number;
  matchedTerms: string[];
}

// 倒排索引项
interface InvertedIndexEntry {
  docId: string;
  termFreq: number; // 该词在该文档中的频率
}

// BM25 引擎选项
export interface BM25EngineOptions {
  k1?: number; // term frequency saturation parameter (默认 1.5)
  b?: number;  // length normalization parameter (默认 0.75)
}

/**
 * BM25 搜索引擎
 * 
 * BM25 评分公式：
 * score = Σ IDF(qi) * (f(qi,D) * (k1+1)) / (f(qi,D) + k1 * (1 - b + b * |D|/avgdl))
 * 
 * 其中：
 * - IDF(qi) = ln((N - n(qi) + 0.5) / (n(qi) + 0.5) + 1)
 * - f(qi,D) = qi 在文档 D 中的词频
 * - |D| = 文档 D 的长度
 * - avgdl = 平均文档长度
 * - N = 文档总数
 * - n(qi) = 包含 qi 的文档数
 */
export class BM25Engine {
  private k1: number;
  private b: number;
  
  // 文档存储
  private documents = new Map<string, { tokens: string[]; length: number }>();
  
  // 倒排索引：term -> [{ docId, termFreq }]
  private invertedIndex = new Map<string, InvertedIndexEntry[]>();
  
  // 统计信息
  private avgDocLength = 0;
  private isIndexBuilt = false;

  constructor(options: BM25EngineOptions = {}) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
  }

  /**
   * 添加文档
   */
  addDocument(doc: BM25Document): void {
    // 合并 text 和 fields
    const allText = [
      doc.text,
      ...Object.values(doc.fields || {}),
    ].join(' ');

    const tokens = tokenize(allText);
    this.documents.set(doc.id, { tokens, length: tokens.length });
    
    // 标记索引需要重建
    this.isIndexBuilt = false;
  }

  /**
   * 移除文档
   */
  removeDocument(id: string): void {
    if (this.documents.delete(id)) {
      this.isIndexBuilt = false;
    }
  }

  /**
   * 构建倒排索引
   */
  buildIndex(): void {
    this.invertedIndex.clear();
    
    // 计算平均文档长度
    let totalLength = 0;
    for (const doc of this.documents.values()) {
      totalLength += doc.length;
    }
    this.avgDocLength = this.documents.size > 0 ? totalLength / this.documents.size : 0;

    // 构建倒排索引
    for (const [docId, doc] of this.documents.entries()) {
      const termFreqs = new Map<string, number>();
      
      // 统计词频
      for (const term of doc.tokens) {
        termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
      }

      // 更新倒排索引
      for (const [term, freq] of termFreqs.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, []);
        }
        this.invertedIndex.get(term)!.push({ docId, termFreq: freq });
      }
    }

    this.isIndexBuilt = true;
  }

  /**
   * 搜索
   */
  search(query: string): BM25SearchResult[] {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }

    if (this.documents.size === 0) {
      return [];
    }

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) {
      return [];
    }

    // 计算每个文档的 BM25 分数
    const scores = new Map<string, { score: number; matchedTerms: Set<string> }>();
    const N = this.documents.size;

    for (const term of queryTerms) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      const n = postings.length; // 包含该词的文档数
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1);

      for (const { docId, termFreq } of postings) {
        const doc = this.documents.get(docId)!;
        const docLength = doc.length;

        // BM25 公式
        const numerator = termFreq * (this.k1 + 1);
        const denominator = termFreq + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
        const termScore = idf * (numerator / denominator);

        if (!scores.has(docId)) {
          scores.set(docId, { score: 0, matchedTerms: new Set() });
        }
        const entry = scores.get(docId)!;
        entry.score += termScore;
        entry.matchedTerms.add(term);
      }
    }

    // 排序并返回
    const results: BM25SearchResult[] = [];
    for (const [id, { score, matchedTerms }] of scores.entries()) {
      results.push({
        id,
        score,
        matchedTerms: Array.from(matchedTerms),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * 清空所有文档
   */
  clear(): void {
    this.documents.clear();
    this.invertedIndex.clear();
    this.avgDocLength = 0;
    this.isIndexBuilt = false;
  }

  /**
   * 导出索引（JSON 序列化）
   */
  exportIndex(): string {
    return JSON.stringify({
      k1: this.k1,
      b: this.b,
      documents: Array.from(this.documents.entries()),
      avgDocLength: this.avgDocLength,
    });
  }

  /**
   * 导入索引（反序列化）
   */
  importIndex(data: string): void {
    const parsed = JSON.parse(data);
    this.k1 = parsed.k1;
    this.b = parsed.b;
    this.documents = new Map(parsed.documents);
    this.avgDocLength = parsed.avgDocLength;
    this.buildIndex(); // 重建倒排索引
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    documentCount: number;
    vocabularySize: number;
    avgDocLength: number;
    isIndexBuilt: boolean;
  } {
    return {
      documentCount: this.documents.size,
      vocabularySize: this.invertedIndex.size,
      avgDocLength: this.avgDocLength,
      isIndexBuilt: this.isIndexBuilt,
    };
  }

  /**
   * 获取文档数量
   */
  getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * 获取词汇表大小
   */
  getVocabularySize(): number {
    if (!this.isIndexBuilt) {
      this.buildIndex();
    }
    return this.invertedIndex.size;
  }
}

/**
 * 工厂函数：创建 BM25 引擎实例
 */
export function createBM25Engine(options?: BM25EngineOptions): BM25Engine {
  return new BM25Engine(options);
}
