/**
 * Daemon 定时调度器
 * 单 timer + 60s 上限模式，参考 OpenClaw 的 timer.ts 设计
 *
 * 核心机制：
 * - 全局只有一个 setTimeout，指向最近到期的任务
 * - 最大延迟 60 秒，防止系统休眠/时钟漂移导致错过任务
 * - 任务执行期间 timer 会重新设置 60s 等待，避免调度器死锁
 */

import { TaskExecutor } from './executor.js';
import { TaskStore, type ScheduledTask } from './store.js';
import { locked, type Lockable } from './locked.js';
import { isSessionActive, writeAlarm, type AlarmSignal } from './alarm.js';

// 最大 timer 延迟，防止时钟漂移
const MAX_TIMER_DELAY_MS = 60_000;

// 卡住任务超时：10 分钟自动清除 runningAtMs 标记（任务默认超时 5 分钟）
const STUCK_RUN_MS = 10 * 60 * 1000;

/**
 * 错误指数退避时间表（毫秒）
 */
const ERROR_BACKOFF_SCHEDULE_MS = [
  30_000,       // 1st error  →  30 s
  60_000,       // 2nd error  →   1 min
  5 * 60_000,   // 3rd error  →   5 min
  15 * 60_000,  // 4th error  →  15 min
  60 * 60_000,  // 5th+ error →  60 min
];

function errorBackoffMs(consecutiveErrors: number): number {
  const idx = Math.min(consecutiveErrors - 1, ERROR_BACKOFF_SCHEDULE_MS.length - 1);
  return ERROR_BACKOFF_SCHEDULE_MS[Math.max(0, idx)];
}

export class Scheduler implements Lockable {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  /** 并发锁状态 */
  op: Promise<unknown> = Promise.resolve();

  constructor(
    private executor: TaskExecutor,
    private store: TaskStore,
  ) {}

  // =========================================================================
  // 公共接口
  // =========================================================================

  /**
   * 注册一次性定时任务
   * 不直接创建 timer，只设置 nextRunAtMs 然后 armTimer
   */
  scheduleOnce(task: ScheduledTask): void {
    if (!task.triggerAt) return;

    const now = Date.now();
    // 计算 nextRunAtMs
    this.store.updateTask(task.id, {
      nextRunAtMs: task.triggerAt,
    });

    console.log(`[Scheduler] Registered once task: "${task.name}" (trigger at ${new Date(task.triggerAt).toISOString()}, ${task.triggerAt <= now ? 'PAST DUE' : `in ${Math.round((task.triggerAt - now) / 1000)}s`})`);
    this.armTimer();
  }

  /**
   * 注册周期性任务
   * 计算下一个执行时间点并 armTimer
   */
  scheduleInterval(task: ScheduledTask): void {
    if (!task.intervalMs || task.intervalMs <= 0) return;

    const now = Date.now();
    const nextRunAtMs = this.computeIntervalNextRun(task, now);
    this.store.updateTask(task.id, { nextRunAtMs });

    console.log(`[Scheduler] Registered interval task: "${task.name}" (every ${task.intervalMs}ms, next at ${new Date(nextRunAtMs).toISOString()})`);
    this.armTimer();
  }

  /**
   * 取消单个任务
   */
  cancel(taskId: string): void {
    this.store.updateTask(taskId, {
      nextRunAtMs: undefined,
      runningAtMs: undefined,
    });
    this.armTimer();
  }

  /**
   * 取消所有任务
   */
  cancelAll(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 当前有 nextRunAtMs 的任务数量
   */
  getActiveCount(): number {
    return this.store.listTasks().filter(t =>
      t.enabled && typeof t.nextRunAtMs === 'number'
    ).length;
  }

  /**
   * 重启时执行错过的任务
   */
  async runMissedJobs(): Promise<void> {
    const tasks = this.store.listTasks();
    const now = Date.now();

    const missed = tasks.filter(t => {
      if (!t.enabled) return false;
      if (typeof t.runningAtMs === 'number') return false;
      // once 类型如果已经执行过（有 lastRunStatus），跳过
      if (t.type === 'once' && t.lastRunStatus) return false;
      const next = t.nextRunAtMs;
      return typeof next === 'number' && now >= next;
    });

    if (missed.length > 0) {
      console.log(`[Scheduler] Running ${missed.length} missed job(s) after restart: ${missed.map(t => t.name).join(', ')}`);
      for (const task of missed) {
        await this.executeTask(task);
      }
    }
  }

  /**
   * 重新计算所有任务的 nextRunAtMs
   */
  recomputeNextRuns(): void {
    const tasks = this.store.listTasks();
    const now = Date.now();

    for (const task of tasks) {
      if (!task.enabled) {
        if (task.nextRunAtMs !== undefined || task.runningAtMs !== undefined) {
          this.store.updateTask(task.id, {
            nextRunAtMs: undefined,
            runningAtMs: undefined,
          });
        }
        continue;
      }

      // 清除卡住的 runningAtMs
      if (typeof task.runningAtMs === 'number' && now - task.runningAtMs > STUCK_RUN_MS) {
        console.log(`[Scheduler] Clearing stuck running marker for "${task.name}" (running since ${new Date(task.runningAtMs).toISOString()})`);
        this.store.updateTask(task.id, { runningAtMs: undefined });
      }

      // 只重新计算缺失或已过期的 nextRunAtMs
      const nextRun = task.nextRunAtMs;
      if (nextRun === undefined || now >= nextRun) {
        let newNext: number | undefined;
        if (task.type === 'once' && task.triggerAt) {
          newNext = task.triggerAt;
        } else if (task.type === 'interval') {
          newNext = this.computeIntervalNextRun(task, now);
        }
        if (newNext !== undefined && newNext !== task.nextRunAtMs) {
          this.store.updateTask(task.id, { nextRunAtMs: newNext });
        }
      }
    }
  }

  // =========================================================================
  // Timer 机制
  // =========================================================================

  /**
   * 设置/重设全局 timer，指向最近到期的任务
   */
  armTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const nextAt = this.nextWakeAtMs();
    if (nextAt === undefined) return;

    const now = Date.now();
    const delay = Math.max(nextAt - now, 0);
    // 最大 60 秒，防止时钟漂移和系统休眠
    const clampedDelay = Math.min(delay, MAX_TIMER_DELAY_MS);

    this.timer = setTimeout(async () => {
      try {
        await this.onTimer();
      } catch (err) {
        console.error(`[Scheduler] Timer tick failed:`, err instanceof Error ? err.message : err);
      }
    }, clampedDelay);
  }

  /**
   * Timer 回调：查找并执行所有到期任务
   */
  private async onTimer(): Promise<void> {
    // 如果有任务正在执行，重新设置 60s timer 等待
    if (this.running) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(async () => {
        try {
          await this.onTimer();
        } catch (err) {
          console.error(`[Scheduler] Timer tick failed:`, err instanceof Error ? err.message : err);
        }
      }, MAX_TIMER_DELAY_MS);
      return;
    }

    this.running = true;
    try {
      // 使用并发锁保护
      await locked(this, async () => {
        // 重新从磁盘加载任务（可能被外部修改）
        this.store.reload();

        const dueJobs = this.findDueJobs();
        if (dueJobs.length === 0) {
          this.recomputeNextRuns();
          return;
        }

        // 逐个执行到期任务
        for (const task of dueJobs) {
          await this.executeTask(task);
        }

        this.recomputeNextRuns();
      });
    } finally {
      this.running = false;
      this.armTimer();
    }
  }

  // =========================================================================
  // 内部方法
  // =========================================================================

  /**
   * 找到所有到期的任务
   */
  private findDueJobs(): ScheduledTask[] {
    const tasks = this.store.listTasks();
    const now = Date.now();

    return tasks.filter(t => {
      if (!t.enabled) return false;
      if (typeof t.runningAtMs === 'number') return false;
      const next = t.nextRunAtMs;
      return typeof next === 'number' && now >= next;
    });
  }

  /**
   * 执行单个任务
   *
   * 闹钟模式：如果有活跃的前台会话，写入闹钟信号让前台会话处理，
   * 模型在完整的对话上下文中自主决策如何执行。
   * 如果没有活跃会话，走后台 executor 执行（降级路径）。
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    // 闹钟优先：检查是否有活跃的前台会话
    if (isSessionActive()) {
      console.log(`[Scheduler] Active session detected, sending alarm for "${task.name}"`);

      const alarm: AlarmSignal = {
        taskId: task.id,
        taskName: task.name,
        prompt: task.prompt,
        context: task.context,
        executionMemory: task.executionMemory,
        triggeredAt: Date.now(),
        workingDir: task.workingDir,
        taskType: task.type,
      };
      writeAlarm(alarm);

      // 标记任务已发送闹钟，避免 daemon 重复触发
      // 用 runningAtMs 标记，前台处理完后会清除
      this.store.updateTask(task.id, {
        runningAtMs: Date.now(),
      });

      // once 类型发完闹钟后禁用，防止重复调度
      if (task.type === 'once') {
        this.store.updateTask(task.id, {
          enabled: false,
          nextRunAtMs: undefined,
        });
      }
      return;
    }

    // 降级路径：没有活跃会话，后台执行
    console.log(`[Scheduler] No active session, executing "${task.name}" in background`);
    const startedAt = Date.now();

    // 标记为正在执行
    this.store.updateTask(task.id, {
      runningAtMs: startedAt,
      lastRunError: undefined,
    });

    try {
      await this.executor.execute({ task });

      // 执行成功
      const endedAt = Date.now();
      this.applyTaskResult(task, {
        status: 'success',
        startedAt,
        endedAt,
      });
    } catch (err) {
      const endedAt = Date.now();
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTimeout = errMsg.includes('timeout');

      this.applyTaskResult(task, {
        status: isTimeout ? 'timeout' : 'failed',
        error: errMsg,
        startedAt,
        endedAt,
      });
    }
  }

  /**
   * 应用任务执行结果，处理退避和一次性任务
   * 参考 OpenClaw 的 applyJobResult
   */
  private applyTaskResult(task: ScheduledTask, result: {
    status: 'success' | 'failed' | 'timeout';
    error?: string;
    startedAt: number;
    endedAt: number;
  }): void {
    const updates: Partial<ScheduledTask> = {
      runningAtMs: undefined,
      lastRunAt: result.startedAt,
      lastRunStatus: result.status,
      lastRunError: result.status === 'success' ? undefined : result.error,
      lastDurationMs: Math.max(0, result.endedAt - result.startedAt),
      runCount: (task.runCount || 0) + 1,
    };

    // 更新连续错误计数
    if (result.status !== 'success') {
      updates.consecutiveErrors = (task.consecutiveErrors || 0) + 1;
    } else {
      updates.consecutiveErrors = 0;
    }

    // once 类型：无论成功失败都禁用，防止循环重调度
    if (task.type === 'once') {
      updates.enabled = false;
      updates.nextRunAtMs = undefined;
      if (result.status !== 'success') {
        console.log(`[Scheduler] One-shot task "${task.name}" ${result.status}, disabling`);
      }
    } else if (result.status !== 'success' && task.enabled) {
      // interval 类型失败：指数退避
      const consecutiveErrors = updates.consecutiveErrors!;
      const backoff = errorBackoffMs(consecutiveErrors);
      const normalNext = this.computeIntervalNextRun(task, result.endedAt);
      const backoffNext = result.endedAt + backoff;
      updates.nextRunAtMs = Math.max(normalNext, backoffNext);
      console.log(`[Scheduler] Task "${task.name}" ${result.status} (${consecutiveErrors} consecutive), backoff ${backoff}ms, next at ${new Date(updates.nextRunAtMs).toISOString()}`);
    } else if (task.enabled) {
      // 成功：计算正常下次执行时间
      updates.nextRunAtMs = this.computeIntervalNextRun(task, result.endedAt);
    } else {
      updates.nextRunAtMs = undefined;
    }

    this.store.updateTask(task.id, updates);
  }

  /**
   * 计算 interval 任务的下一个执行时间
   */
  private computeIntervalNextRun(task: ScheduledTask, afterMs: number): number {
    if (!task.intervalMs || task.intervalMs <= 0) return afterMs;

    // 基于 createdAt 作为 anchor，保持间隔对齐
    const anchor = task.createdAt;
    const elapsed = afterMs - anchor;
    const steps = Math.max(1, Math.ceil(elapsed / task.intervalMs));
    return anchor + steps * task.intervalMs;
  }

  /**
   * 获取所有任务中最近的 nextRunAtMs
   */
  private nextWakeAtMs(): number | undefined {
    const tasks = this.store.listTasks();
    const enabled = tasks.filter(t =>
      t.enabled && typeof t.nextRunAtMs === 'number'
    );
    if (enabled.length === 0) return undefined;

    return enabled.reduce(
      (min, t) => Math.min(min, t.nextRunAtMs as number),
      enabled[0].nextRunAtMs as number,
    );
  }
}
