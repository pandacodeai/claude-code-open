/**
 * Daemon 结构化运行日志
 * 每个任务独立一个 JSONL 文件，参考 OpenClaw 的 run-log.ts
 *
 * 文件路径: ~/.claude/daemon-runs/<taskId>.jsonl
 * 每行一个 JSON 对象，自动裁剪防止文件过大
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// 类型定义
// ============================================================================

export interface RunLogEntry {
  /** 记录时间戳（Unix ms） */
  ts: number;
  /** 任务 ID */
  taskId: string;
  /** 任务名称 */
  taskName: string;
  /** 动作（目前只有 finished） */
  action: 'finished';
  /** 执行状态 */
  status: 'success' | 'failed' | 'timeout';
  /** 错误信息 */
  error?: string;
  /** 结果摘要 */
  summary?: string;
  /** 执行耗时（ms） */
  durationMs?: number;
  /** 下次执行时间 */
  nextRunAtMs?: number;
}

// ============================================================================
// 路径
// ============================================================================

const RUNS_DIR = path.join(os.homedir(), '.claude', 'daemon-runs');

/** 获取任务的运行日志文件路径 */
export function resolveRunLogPath(taskId: string): string {
  return path.join(RUNS_DIR, `${taskId}.jsonl`);
}

// ============================================================================
// 写入
// ============================================================================

// 防止并发写入同一文件导致数据损坏
const writesByPath = new Map<string, Promise<void>>();

/** 默认裁剪参数 */
const DEFAULT_MAX_BYTES = 2_000_000; // 2MB
const DEFAULT_KEEP_LINES = 2_000;

/**
 * 文件超限时裁剪到最近 N 行
 */
async function pruneIfNeeded(
  filePath: string,
  maxBytes: number,
  keepLines: number,
): Promise<void> {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size <= maxBytes) return;
  } catch {
    return;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const kept = lines.slice(Math.max(0, lines.length - keepLines));
    const tmp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, kept.join('\n') + '\n', 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch {
    // 裁剪失败不影响运行
  }
}

/**
 * 追加一条运行日志
 */
export async function appendRunLog(
  entry: RunLogEntry,
  opts?: { maxBytes?: number; keepLines?: number },
): Promise<void> {
  const filePath = resolveRunLogPath(entry.taskId);
  const resolved = path.resolve(filePath);

  const prev = writesByPath.get(resolved) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(async () => {
    // 确保目录存在
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 追加一行 JSON
    fs.appendFileSync(resolved, JSON.stringify(entry) + '\n', 'utf-8');

    // 自动裁剪
    await pruneIfNeeded(
      resolved,
      opts?.maxBytes ?? DEFAULT_MAX_BYTES,
      opts?.keepLines ?? DEFAULT_KEEP_LINES,
    );
  });

  writesByPath.set(resolved, next);
  await next;
}

// ============================================================================
// 读取
// ============================================================================

/**
 * 读取任务的运行日志（最近 N 条，倒序读取后翻转为正序）
 */
export function readRunLogEntries(
  taskId: string,
  opts?: { limit?: number },
): RunLogEntry[] {
  const filePath = resolveRunLogPath(taskId);
  const limit = Math.max(1, Math.min(5000, Math.floor(opts?.limit ?? 200)));

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  if (!raw.trim()) return [];

  const parsed: RunLogEntry[] = [];
  const lines = raw.split('\n');

  // 从末尾开始读，取最近的 limit 条
  for (let i = lines.length - 1; i >= 0 && parsed.length < limit; i--) {
    const line = lines[i]?.trim();
    if (!line) continue;

    try {
      const obj = JSON.parse(line) as Partial<RunLogEntry>;
      if (!obj || typeof obj !== 'object') continue;
      if (obj.action !== 'finished') continue;
      if (typeof obj.taskId !== 'string' || !obj.taskId.trim()) continue;
      if (typeof obj.ts !== 'number' || !Number.isFinite(obj.ts)) continue;

      parsed.push({
        ts: obj.ts,
        taskId: obj.taskId,
        taskName: obj.taskName || '',
        action: 'finished',
        status: obj.status || 'failed',
        error: obj.error,
        summary: obj.summary,
        durationMs: obj.durationMs,
        nextRunAtMs: obj.nextRunAtMs,
      });
    } catch {
      // 忽略无效行
    }
  }

  // 翻转为正序（时间从早到晚）
  return parsed.reverse();
}
