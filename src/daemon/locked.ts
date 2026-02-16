/**
 * 简单的 Promise 串行锁
 * 参考 OpenClaw 的 locked.ts 实现
 *
 * 确保所有操作串行执行，防止并发竞态
 */

export interface Lockable {
  op: Promise<unknown>;
}

/**
 * 在锁保护下执行异步操作
 * 所有 locked() 调用会串行执行，不会并发
 */
export function locked<T>(state: Lockable, fn: () => Promise<T>): Promise<T> {
  const next = state.op.then(() => fn(), () => fn());
  state.op = next.catch(() => {});
  return next;
}
