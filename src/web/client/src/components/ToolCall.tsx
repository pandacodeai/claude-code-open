import { useState } from 'react';
import { TOOL_DISPLAY_NAMES, TOOL_ICONS } from '../utils/constants';
import type { ToolUse, SubagentToolCall } from '../types';

interface ToolCallProps {
  toolUse: ToolUse;
}

/**
 * 子 agent 工具调用项
 */
function SubagentToolItem({ toolCall }: { toolCall: SubagentToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICONS[toolCall.name] || '🔧';
  const displayName = TOOL_DISPLAY_NAMES[toolCall.name] || toolCall.name;

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'running': return '执行中...';
      case 'completed': return '完成';
      case 'error': return '错误';
      default: return '等待中';
    }
  };

  const getDuration = () => {
    if (!toolCall.endTime) return null;
    const duration = toolCall.endTime - toolCall.startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="subagent-tool-item">
      <div
        className="subagent-tool-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="tool-icon">{icon}</span>
        <span className="tool-name">{displayName}</span>
        <span className={`tool-status ${toolCall.status}`}>{getStatusText()}</span>
        {getDuration() && <span className="tool-duration">{getDuration()}</span>}
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="subagent-tool-body">
          {toolCall.input && (
            <div className="tool-input">
              <div className="tool-label">输入参数</div>
              <pre>
                <code>{JSON.stringify(toolCall.input, null, 2)}</code>
              </pre>
            </div>
          )}
          {(toolCall.result || toolCall.error) && (
            <div className="tool-output">
              <div className="tool-label">{toolCall.error ? '错误信息' : '输出结果'}</div>
              <pre>
                <code>{toolCall.result || toolCall.error || '(无输出)'}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 格式化倒计时剩余时间
 */
function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec >= 60) {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
  }
  return `${totalSec}s`;
}

export function ToolCall({ toolUse }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const { name, input, status, result, subagentToolCalls, toolUseCount, lastToolInfo, scheduleCountdown } = toolUse;

  const icon = TOOL_ICONS[name] || '🔧';
  const displayName = TOOL_DISPLAY_NAMES[name] || name;

  // 判断是否是 Task 或 ScheduleTask 工具
  const isTaskTool = name === 'Task';
  const isScheduleTask = name === 'ScheduleTask';
  const hasSubagentFeatures = isTaskTool || isScheduleTask;

  // 计算 ScheduleTask 的显示状态（CSS class），解决倒计时期间 status 始终为 'running' 的不匹配问题
  const getDisplayStatus = (): string => {
    if (isScheduleTask && scheduleCountdown) {
      switch (scheduleCountdown.phase) {
        case 'countdown': return 'countdown';
        case 'executing': return 'running';
        case 'done':
          if (result && !result.success) return 'error';
          if (status === 'error') return 'error';
          return 'completed';
      }
    }
    return status;
  };

  const displayStatus = getDisplayStatus();

  const getStatusText = () => {
    // ScheduleTask 倒计时状态
    if (isScheduleTask && scheduleCountdown) {
      switch (scheduleCountdown.phase) {
        case 'countdown':
          return `倒计时 ${formatCountdown(scheduleCountdown.remainingMs)}`;
        case 'executing':
          return '执行中...';
        case 'done':
          return (result && !result.success) || status === 'error' ? '错误' : '完成';
      }
    }

    switch (status) {
      case 'running': return '执行中...';
      case 'completed': return '完成';
      case 'error': return '错误';
      default: return '等待中';
    }
  };

  // 渲染进度信息
  const renderTaskProgress = () => {
    if (!hasSubagentFeatures) return null;

    const parts: string[] = [];

    // ScheduleTask 倒计时信息
    if (isScheduleTask && scheduleCountdown) {
      if (scheduleCountdown.taskName) {
        parts.push(scheduleCountdown.taskName);
      }
    }

    if (toolUseCount && toolUseCount > 0) {
      parts.push(`${toolUseCount} 工具调用`);
    }
    if (lastToolInfo) {
      parts.push(lastToolInfo);
    }

    if (parts.length === 0) return null;

    return (
      <span className="task-progress">
        {parts.join(' · ')}
      </span>
    );
  };

  // 渲染 ScheduleTask 倒计时进度条
  const renderCountdownBar = () => {
    if (!isScheduleTask || !scheduleCountdown || scheduleCountdown.phase !== 'countdown') return null;

    const triggerAt = scheduleCountdown.triggerAt;
    const remainingMs = scheduleCountdown.remainingMs;
    // 估算总等待时间：triggerAt - (triggerAt - remainingMs) = remainingMs 初始值
    // 但我们只有当前 remainingMs，用 triggerAt - Date.now() 近似
    const totalMs = triggerAt - (Date.now() - remainingMs);
    const progress = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - remainingMs) / totalMs) * 100)) : 100;

    return (
      <div className="schedule-countdown">
        <div className="countdown-bar-track">
          <div className="countdown-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="countdown-time">还剩 {formatCountdown(remainingMs)}</span>
      </div>
    );
  };

  return (
    <div className={`tool-call ${hasSubagentFeatures ? 'task-tool' : ''}`}>
      <div className="tool-call-header" onClick={() => setExpanded(!expanded)}>
        <span className="tool-icon">{icon}</span>
        <span className="tool-name">{displayName}</span>
        {renderTaskProgress()}
        <span className={`tool-status ${displayStatus}`}>{getStatusText()}</span>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>

      {/* ScheduleTask 倒计时进度条（始终显示，不需要展开） */}
      {renderCountdownBar()}

      {expanded && (
        <div className="tool-call-body">
          <div className="tool-input">
            <div className="tool-label">输入参数</div>
            <pre>
              <code>{JSON.stringify(input, null, 2)}</code>
            </pre>
          </div>

          {/* 子 agent 工具调用列表 */}
          {hasSubagentFeatures && subagentToolCalls && subagentToolCalls.length > 0 && (
            <div className="subagent-tools">
              <div className="tool-label">子 Agent 工具调用 ({subagentToolCalls.length})</div>
              <div className="subagent-tools-list">
                {subagentToolCalls.map((tc) => (
                  <SubagentToolItem key={tc.id} toolCall={tc} />
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="tool-output">
              <div className="tool-label">{result.success ? '输出结果' : '错误信息'}</div>
              <pre>
                <code>{result.output || result.error || '(无输出)'}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
