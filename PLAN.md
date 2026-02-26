# 定时任务完整 CRUD 支持

## 现状

- Create/Read/Delete 完整
- Update 严重缺失：除 enabled 开关外所有字段创建后不可修改
- 后端无通用 update API
- 前端无编辑表单
- ScheduleTask 工具无 update action

## 方案

### 1. 后端：添加 PATCH API (`schedule-api.ts`)

新增 `PATCH /api/schedule/tasks/:id` 路由：
- 接受可修改字段：name, prompt, model, timeoutMs, triggerAt, intervalMs, watchPaths, watchEvents, debounceMs, notify, feishuChatId, silentToken, context
- 不可修改字段：id, createdAt, createdBy, workingDir, type（类型变更太复杂，改了得重算调度逻辑）
- 验证逻辑：类型特定字段校验（interval 改 intervalMs 要 > 0，once 改 triggerAt 要有效时间戳）
- 修改后调用 `store.signalReload()` 通知调度器

### 2. 前端：详情页增加内联编辑 (`SchedulePage/index.tsx`)

**方案：点击字段进入编辑模式（inline edit）**

不用弹模态框，直接在详情页的各 infoCard 上点击即可编辑：
- 可编辑字段显示一个编辑图标（铅笔）
- 点击后 infoValue 变为 input/textarea
- 修改后自动 PATCH 保存（失焦或回车确认）
- Prompt 区域：点击后变为 textarea
- 不可编辑字段（type, createdAt, runCount 等）保持只读

需要的状态：
- `editingField: string | null` — 当前编辑中的字段名
- `editValue: string` — 当前编辑值

可编辑字段列表：
| 字段 | 编辑控件 | 适用类型 |
|------|---------|---------|
| name | input text | 全部 |
| prompt | textarea | 全部 |
| model | select | 全部 |
| intervalMs | number + unit select | interval |
| triggerAt | datetime-local | once |
| watchPaths | input text (逗号分隔) | watch |
| silentToken | input text | 全部 |
| timeoutMs | number (秒) | 全部 |

### 3. ScheduleTask 工具增加 update action (`schedule.ts`)

- 新增 `action: 'update'`
- 输入：taskId + 要修改的字段（与 create 类似但都是可选的）
- 调用 `store.updateTask()` 后 `signalReload()`

### 4. WebScheduler 调度器兼容 (`web-scheduler.ts`)

**无需改动**。WebScheduler 每次 tick 从 store 读取最新数据，PATCH 修改后 signalReload 触发重新加载，调度器自然读到新值。interval 类型改了 intervalMs 后，下次 `recomputeNextRuns` 会用新值计算。

## 修改文件清单

1. `src/web/server/routes/schedule-api.ts` — 新增 PATCH 路由
2. `src/web/client/src/pages/SchedulePage/index.tsx` — 添加内联编辑
3. `src/web/client/src/pages/SchedulePage/SchedulePage.module.css` — 编辑相关样式
4. `src/tools/schedule.ts` — 新增 update action
5. `src/prompt/templates.ts` — ScheduleTask 工具描述更新（系统提示词里的描述）

## 不做的事

- 不支持修改 type（once↔interval↔watch）：类型变更涉及调度逻辑重构，复杂度过高且场景少，用户可以删了重建
- 不支持修改 id/createdAt/createdBy/workingDir：这些是系统字段
- 不支持修改执行状态字段（lastRunAt, runCount 等）：由系统自动管理
