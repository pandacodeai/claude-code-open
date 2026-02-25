# ErrorWatcher 重构：通知主 Agent 而非创建独立修复会话

## 问题

当前 ErrorWatcher 检测到源码错误后，创建一个**独立修复会话**（`repairSessionCreator`）。这不够 agentic：
1. 独立会话没有用户当前对话上下文
2. 用户可能不会注意到新出现的修复会话
3. 修复会话可能与用户正在做的事冲突
4. 额外的 ScheduleTask error-log-watcher 是冗余的（读文件轮询方式）

## 方案

ErrorWatcher 检测到源码错误 → **向当前活跃会话发送一条消息** → 主 Agent 自己决定是否修复。

### 改动清单

#### 1. `src/utils/error-watcher.ts` — 简化回调类型

- `RepairSessionCreator` → `ErrorNotifier`
- 新类型签名：`(pattern: ErrorPattern, sourceContext: string) => Promise<void>`
- `setRepairSessionCreator` → `setErrorNotifier`
- `triggerRepair()` 内：调 `this.errorNotifier(pattern, sourceContext)` 即可，不再关心 sessionId

#### 2. `src/web/server/conversation.ts` — 新增 `notifyActiveSession` 方法

```typescript
/**
 * 向当前活跃会话注入错误通知，让主 Agent 感知并自行修复
 * "活跃" = 有 ws 连接且非 auto-repair tag 的会话，优先选最近有消息的
 */
async notifyActiveSession(errorMessage: string): Promise<boolean> {
  // 1. 遍历 sessions，找有 ws 连接的、非 processing 的会话
  // 2. 如果正在 processing，排队等完成后再发（或直接利用 chat() 的插话机制）
  // 3. 调 chat(sessionId, errorMessage, ...) 发送
  // 4. 返回是否成功发送
}
```

#### 3. `src/web/server/index.ts` — 简化 ErrorWatcher 注入

删除 `buildRepairPrompt`、`buildRepairCallbacks` 两个大函数（约 150 行）。

替换为：
```typescript
errorWatcher.setErrorNotifier(async (pattern, sourceContext) => {
  const message = buildErrorNotification(pattern, sourceContext);
  const sent = await conversationManager.notifyActiveSession(message);
  if (!sent) {
    console.log('[ErrorWatcher] No active session to notify');
  }
});
```

`buildErrorNotification` 是简短的通知消息（不是"修复任务"）：
```
<system-reminder>
[ErrorWatcher] 检测到源码错误反复发生：
- 模块: XXX
- 错误: XXX  
- 位置: src/xxx.ts:123
- 5分钟内重复 5 次

请检查是否需要修复。源码上下文：
（上下文代码片段）
</system-reminder>
```

注意：用 `<system-reminder>` 标签包裹，让 Agent 知道这是系统级通知。

#### 4. 删除 error-log-watcher 定时任务

如果任务数据在 `daemon-tasks.json` 中，启动时检查并跳过即可。UI 上已经标记为"已禁用"，可以让用户手动删除，或代码中加一个清理逻辑。

### 不改的部分

- ErrorWatcher 的指纹提取、分类、聚合、阈值检测逻辑**保留不变**——这些纯本地逻辑很好
- `writeToNotebook` **保留**——写 notebook 仍然有价值
- `appendRepairLog` **保留**——审计日志有用

### 风险

- 如果没有活跃会话（用户关了浏览器），错误就只写日志，不会被修复。这是 OK 的——没有用户在线就不应该自动改代码。
- Agent 可能忽略通知或处理不当。这也 OK——Agent 有上下文，比独立修复会话更靠谱。
