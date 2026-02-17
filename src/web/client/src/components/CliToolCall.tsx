import { useState, useMemo, ReactNode } from 'react';
import { CliSpinner, CliStatusIndicator } from './common/CliSpinner';
import { useLanguage } from '../i18n';
import './CliToolCall.css';
import type { ToolUse, SubagentToolCall } from '../types';
import { computeSideBySideDiff } from '../utils/diffUtils';
import type { DiffRow } from '../utils/diffUtils';

// 默认显示的最大行数（与官方 CLI 保持一致）
const DEFAULT_MAX_LINES = 10;

// CLI 风格的工具名称
const CLI_TOOL_NAMES: Record<string, string> = {
  Bash: 'Bash',
  BashOutput: 'Bash',
  KillShell: 'Kill',
  Read: 'Read',
  Write: 'Write',
  Edit: 'Edit',
  MultiEdit: 'MultiEdit',
  Glob: 'Glob',
  Grep: 'Grep',
  WebFetch: 'WebFetch',
  WebSearch: 'WebSearch',
  TodoWrite: 'Update Todos',
  Task: 'Task',
  NotebookEdit: 'NotebookEdit',
  AskUserQuestion: 'AskUserQuestion',
  Browser: 'Browser',
};

interface CliToolCallProps {
  toolUse: ToolUse;
}

/**
 * 可展开的内容包装组件 - 支持 "Click to expand" 功能
 */
interface ExpandableContentProps {
  children: ReactNode;
  maxLines?: number;
  totalLines: number;
  expanded: boolean;
  onToggle: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function ExpandableContent({
  children,
  maxLines = DEFAULT_MAX_LINES,
  totalLines,
  expanded,
  onToggle,
  t,
}: ExpandableContentProps) {
  const hiddenLines = totalLines - maxLines;
  const shouldTruncate = !expanded && hiddenLines > 0;

  return (
    <div className="cli-expandable-content">
      <div className={`cli-expandable-body ${shouldTruncate ? 'cli-expandable-truncated' : ''}`}>
        {children}
      </div>
      {hiddenLines > 0 && (
        <div className="cli-expand-footer">
          {!expanded && (
            <span className="cli-hidden-lines">{t('cli.hiddenLines', { count: hiddenLines })}</span>
          )}
          <button
            className="cli-expand-btn"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
          >
            {expanded ? t('cli.collapseButton') : t('cli.expandButton')}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 获取工具调用的简要描述
 */
function getToolDescription(name: string, input: any): string {
  switch (name) {
    case 'Bash':
      return input?.description || '';
    case 'Read':
      if (input?.file_path) {
        const path = String(input.file_path);
        return path;
      }
      return '';
    case 'Write':
      if (input?.file_path) {
        const path = String(input.file_path);
        const lines = input?.content?.split?.('\n')?.length || 0;
        return `${path}${lines > 0 ? ` (${lines} lines)` : ''}`;
      }
      return '';
    case 'Edit':
      if (input?.file_path) {
        return input.file_path;
      }
      return '';
    case 'Glob':
      return input?.pattern || '';
    case 'Grep':
      return `"${input?.pattern || ''}"` + (input?.path ? ` (in ${input.path})` : '');
    case 'WebFetch':
      return input?.url || '';
    case 'WebSearch':
      return input?.query || '';
    case 'Task':
      return input?.description || '';
    case 'Browser':
      return input?.action || '';
    default:
      return '';
  }
}

/**
 * 渲染 Bash 工具内容 - 带 IN/OUT 标签，支持 Click to expand
 */
function BashToolContent({ input, result }: { input: any; result?: any }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const output = result?.output || result?.error || t('cli.noOutput');
  const allLines = output.split('\n');
  const totalLines = allLines.length;
  const maxLines = DEFAULT_MAX_LINES;

  const displayOutput = expanded ? output : allLines.slice(0, maxLines).join('\n');

  return (
    <div className="cli-bash-content">
      {input?.command && (
        <div className="cli-bash-section">
          <span className="cli-bash-label">{t('cli.inputLabel')}</span>
          <pre className="cli-bash-code">{input.command}</pre>
        </div>
      )}
      {result && (
        <div className="cli-bash-section">
          <span className="cli-bash-label">{t('cli.outputLabel')}</span>
          <ExpandableContent
            totalLines={totalLines}
            maxLines={maxLines}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            t={t}
          >
            <pre className="cli-bash-code cli-bash-output">
              {displayOutput}
            </pre>
          </ExpandableContent>
        </div>
      )}
    </div>
  );
}


/**
 * 渲染 Edit 工具内容 - 左右对比 side-by-side diff，支持 Click to expand
 */
function EditToolContent({ input, result }: { input: any; result?: any }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const oldString = input?.old_string || '';
  const newString = input?.new_string || '';

  const oldLines = oldString ? oldString.split('\n') : [];
  const newLines = newString ? newString.split('\n') : [];

  const diffRows = useMemo(
    () => computeSideBySideDiff(oldLines, newLines),
    [oldString, newString]
  );

  const totalRows = diffRows.length;
  const maxRows = DEFAULT_MAX_LINES;
  const displayRows = expanded ? diffRows : diffRows.slice(0, maxRows);

  // 统计增删行数
  const removedCount = diffRows.filter(r => r.left && !r.right).length;
  const addedCount = diffRows.filter(r => !r.left && r.right).length;

  // 生成摘要文本
  const summaryParts: string[] = [];
  if (removedCount > 0) summaryParts.push(t('cli.editRemoved', { count: removedCount }));
  if (addedCount > 0) summaryParts.push(t('cli.editAdded', { count: addedCount }));
  const summary = summaryParts.length > 0 ? summaryParts.join(', ') : t('cli.editModified');

  return (
    <div className="cli-edit-content">
      <div className="cli-edit-header">
        <div className="cli-edit-status">{summary}</div>
        <div className="cli-edit-stats">
          {removedCount > 0 && <span className="cli-stat-removed">-{removedCount}</span>}
          {addedCount > 0 && <span className="cli-stat-added">+{addedCount}</span>}
        </div>
      </div>
      <ExpandableContent
        totalLines={totalRows}
        maxLines={maxRows}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        t={t}
      >
        <div className="cli-diff-sidebyside">
          {displayRows.map((row, i) => (
            <div key={i} className="cli-diff-row">
              {/* 左列 - old */}
              <div className={`cli-diff-cell ${
                row.left
                  ? (row.left.type === 'removed' ? 'cli-diff-cell--removed' : 'cli-diff-cell--unchanged')
                  : 'cli-diff-cell--empty'
              }`}>
                {row.left && (
                  <>
                    <span className="cli-diff-cell-prefix">
                      {row.left.type === 'removed' ? '\u2212' : '\u00A0'}
                    </span>
                    <span className="cli-diff-cell-text">{row.left.text || '\u00A0'}</span>
                  </>
                )}
              </div>
              {/* 右列 - new */}
              <div className={`cli-diff-cell ${
                row.right
                  ? (row.right.type === 'added' ? 'cli-diff-cell--added' : 'cli-diff-cell--unchanged')
                  : 'cli-diff-cell--empty'
              }`}>
                {row.right && (
                  <>
                    <span className="cli-diff-cell-prefix">
                      {row.right.type === 'added' ? '+' : '\u00A0'}
                    </span>
                    <span className="cli-diff-cell-text">{row.right.text || '\u00A0'}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </ExpandableContent>
    </div>
  );
}

/**
 * 渲染 Write 工具内容 - 支持 Click to expand
 */
function WriteToolContent({ input }: { input: any }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const content = input?.content || '';
  const allLines = content.split('\n');
  const totalLines = allLines.length;
  const maxLines = DEFAULT_MAX_LINES;

  const displayLines = expanded ? allLines : allLines.slice(0, maxLines);

  return (
    <div className="cli-write-content">
      <div className="cli-write-info">{t('cli.linesCount', { count: totalLines })}</div>
      <ExpandableContent
        totalLines={totalLines}
        maxLines={maxLines}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        t={t}
      >
        <pre className="cli-write-preview">
          {displayLines.join('\n')}
        </pre>
      </ExpandableContent>
    </div>
  );
}

/**
 * 渲染 TodoWrite 工具内容 - 带勾选框的列表
 */
function TodoWriteContent({ input }: { input: any }) {
  const todos = input?.todos || [];

  return (
    <div className="cli-todo-content">
      {todos.map((todo: any, index: number) => (
        <div key={index} className={`cli-todo-item cli-todo-${todo.status}`}>
          <span className="cli-todo-checkbox">
            {todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '◐' : '○'}
          </span>
          <span className={`cli-todo-text ${todo.status === 'completed' ? 'cli-todo-done' : ''}`}>
            {todo.content}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 渲染 Read 工具内容 - 支持 Click to expand
 */
function ReadToolContent({ input, result }: { input: any; result?: any }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const output = result?.output || '';
  const allLines = output.split('\n');
  const totalLines = allLines.length;
  const maxLines = DEFAULT_MAX_LINES;

  const displayLines = expanded ? allLines : allLines.slice(0, maxLines);

  return (
    <div className="cli-read-content">
      {result && (
        <>
          <div className="cli-read-info">{t('cli.linesOfOutput', { count: totalLines })}</div>
          <ExpandableContent
            totalLines={totalLines}
            maxLines={maxLines}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            t={t}
          >
            <pre className="cli-read-preview">
              {displayLines.join('\n')}
            </pre>
          </ExpandableContent>
        </>
      )}
    </div>
  );
}

/**
 * 渲染 Grep 工具内容 - 支持 Click to expand
 */
function GrepToolContent({ input, result }: { input: any; result?: any }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const output = result?.output || '';
  const allLines = output.split('\n');
  const totalLines = allLines.filter((l: string) => l.trim()).length;
  const maxLines = DEFAULT_MAX_LINES;

  const displayLines = expanded ? allLines : allLines.slice(0, maxLines);

  return (
    <div className="cli-grep-content">
      {result && (
        <>
          <div className="cli-grep-info">{t('cli.linesOfOutput', { count: totalLines })}</div>
          <ExpandableContent
            totalLines={allLines.length}
            maxLines={maxLines}
            expanded={expanded}
            onToggle={() => setExpanded(!expanded)}
            t={t}
          >
            <pre className="cli-grep-preview">{displayLines.join('\n')}</pre>
          </ExpandableContent>
        </>
      )}
    </div>
  );
}

/**
 * Browser 工具内容渲染
 * 支持截图预览和其他 Browser 操作的结果展示
 */
function BrowserToolContent({ input, result }: { input: any; result?: any }) {
  const action = input?.action || '';
  const images = result?.data?.images as Array<{ type: string; source: { type: string; media_type: string; data: string } }> | undefined;

  // 截图操作：渲染图片
  if (action === 'screenshot' && images && images.length > 0) {
    return (
      <div className="cli-browser-content">
        {images.map((img, i) => (
          <div key={i} style={{ marginTop: '8px' }}>
            <img
              src={`data:${img.source.media_type};base64,${img.source.data}`}
              alt="Browser screenshot"
              style={{
                maxWidth: '100%',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #333)',
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 其他 Browser 操作：显示文本输出
  const output = result?.output || result?.error || '';
  return output ? (
    <div className="cli-browser-content">
      <pre className="cli-generic-output">{output}</pre>
    </div>
  ) : null;
}

/**
 * 获取子工具的输入展示文本
 */
function getSubagentToolInput(name: string, input: any): string {
  switch (name) {
    case 'Bash':
      return input?.command || '';
    case 'Read':
      return input?.file_path || '';
    case 'Write':
      return input?.file_path ? `${input.file_path}` : '';
    case 'Edit':
      return input?.file_path || '';
    case 'Glob':
      return input?.pattern || '';
    case 'Grep':
      return input?.pattern || '';
    case 'WebFetch':
      return input?.url || '';
    case 'WebSearch':
      return input?.query || '';
    case 'Task':
      return input?.description || '';
    default:
      // 尝试序列化 input
      if (input) {
        try {
          const str = JSON.stringify(input);
          return str.length > 200 ? str.slice(0, 200) + '...' : str;
        } catch {
          return '';
        }
      }
      return '';
  }
}

/**
 * 子 agent 工具调用 - 详细展示版本，带 IN/OUT 标签
 */
function CliSubagentTool({ toolCall, index }: { toolCall: SubagentToolCall; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const toolName = CLI_TOOL_NAMES[toolCall.name] || toolCall.name;
  const description = getToolDescription(toolCall.name, toolCall.input);
  const inputText = getSubagentToolInput(toolCall.name, toolCall.input);
  const hasOutput = !!(toolCall.result || toolCall.error);
  const output = toolCall.result || toolCall.error || '';

  // 计算执行时间
  const duration = toolCall.endTime && toolCall.startTime
    ? toolCall.endTime - toolCall.startTime
    : null;

  // 输出行数（用于判断是否需要展开）
  const outputLines = output.split('\n');
  const totalOutputLines = outputLines.length;
  const maxLines = 5;
  const shouldTruncateOutput = !expanded && totalOutputLines > maxLines;
  const displayOutput = shouldTruncateOutput
    ? outputLines.slice(0, maxLines).join('\n')
    : output;

  return (
    <div className={`cli-subagent-tool cli-subagent-tool--${toolCall.status}`}>
      {/* 工具头部 */}
      <div
        className="cli-subagent-header"
        onClick={() => hasOutput && setExpanded(!expanded)}
      >
        <CliStatusIndicator
          status={toolCall.status || 'pending'}
          showSpinner={toolCall.status === 'running'}
        />
        <span className="cli-subagent-name">{toolName}</span>
        {description && <span className="cli-subagent-desc">{description}</span>}
        {duration !== null && (
          <span className="cli-subagent-duration">{duration}ms</span>
        )}
        {hasOutput && (
          <span className="cli-subagent-expand">{expanded ? '▼' : '▶'}</span>
        )}
      </div>

      {/* 输入区域 - IN 标签 */}
      {inputText && (
        <div className="cli-subagent-section">
          <span className="cli-subagent-label cli-subagent-label--in">{t('cli.inputLabel')}</span>
          <pre className="cli-subagent-code">{inputText}</pre>
        </div>
      )}

      {/* 输出区域 - OUT 标签 (可折叠) */}
      {hasOutput && expanded && (
        <div className="cli-subagent-section">
          <span className={`cli-subagent-label ${toolCall.error ? 'cli-subagent-label--error' : 'cli-subagent-label--out'}`}>
            {toolCall.error ? t('cli.errorLabel') : t('cli.outputLabel')}
          </span>
          <div className="cli-subagent-output-wrapper">
            <pre className={`cli-subagent-code cli-subagent-output ${toolCall.error ? 'cli-subagent-output--error' : ''}`}>
              {displayOutput}
            </pre>
            {shouldTruncateOutput && (
              <div className="cli-subagent-truncated">
                {t('cli.hiddenLines', { count: totalOutputLines - maxLines })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CLI 风格的工具调用组件 - 默认展开
 */
export function CliToolCall({ toolUse }: CliToolCallProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();
  const { name, input, status, result, subagentToolCalls, toolUseCount, lastToolInfo } = toolUse;

  const toolName = CLI_TOOL_NAMES[name] || name;
  const description = getToolDescription(name, input);
  const isTaskTool = name === 'Task';

  // Task 进度信息
  const taskProgress = useMemo(() => {
    if (!isTaskTool) return null;
    const parts: string[] = [];
    if (toolUseCount && toolUseCount > 0) {
      parts.push(t('cli.toolUses', { count: toolUseCount }));
    }
    if (lastToolInfo) {
      parts.push(lastToolInfo);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [isTaskTool, toolUseCount, lastToolInfo, t]);

  // 渲染工具特定内容
  const renderToolContent = () => {
    switch (name) {
      case 'Bash':
        return <BashToolContent input={input} result={result} />;
      case 'Edit':
        return <EditToolContent input={input} result={result} />;
      case 'Write':
        return <WriteToolContent input={input} />;
      case 'TodoWrite':
        return <TodoWriteContent input={input} />;
      case 'Read':
        return <ReadToolContent input={input} result={result} />;
      case 'Grep':
        return <GrepToolContent input={input} result={result} />;
      case 'Browser':
        return <BrowserToolContent input={input} result={result} />;
      case 'Task':
        return (
          <div className="cli-task-content">
            {/* Agent 工具日志标记 */}
            <div className="cli-agent-badge">
              <span className="cli-agent-badge-icon">🤖</span>
              <span className="cli-agent-badge-text">{t('cli.agentBadge')}</span>
              <span className="cli-agent-badge-type">{(input as any)?.subagent_type || 'general-purpose'}</span>
            </div>

            {subagentToolCalls && subagentToolCalls.length > 0 && (
              <div className="cli-subagent-list">
                {subagentToolCalls.map((tc, index) => (
                  <CliSubagentTool key={tc.id} toolCall={tc} index={index} />
                ))}
              </div>
            )}

            {/* 最终结果 */}
            {result && status === 'completed' && (
              <div className="cli-agent-result">
                <div className="cli-agent-result-header">{t('cli.agentResult')}</div>
                <pre className="cli-agent-result-content">
                  {typeof result === 'object' ? (result.output || result.error || JSON.stringify(result, null, 2)) : result}
                </pre>
              </div>
            )}
          </div>
        );
      default:
        // 通用显示
        return result ? (
          <div className="cli-generic-content">
            <pre className="cli-generic-output">
              {typeof result === 'string' ? result : (result.output || result.error || JSON.stringify(result, null, 2))}
            </pre>
          </div>
        ) : null;
    }
  };

  return (
    <div className={`cli-tool-call ${isTaskTool ? 'cli-tool-call--task' : ''}`}>
      {/* 工具头部 */}
      <div className="cli-tool-header" onClick={() => setCollapsed(!collapsed)}>
        <CliStatusIndicator
          status={status || 'pending'}
          showSpinner={status === 'running'}
        />
        <span className="cli-tool-name">{toolName}</span>
        {description && <span className="cli-tool-desc">{description}</span>}
        {taskProgress && <span className="cli-task-progress">{taskProgress}</span>}
        <span className="cli-collapse-btn">{collapsed ? '▶' : '▼'}</span>
      </div>

      {/* 工具内容 - 默认展开 */}
      {!collapsed && (
        <div className="cli-tool-body">
          {renderToolContent()}
        </div>
      )}
    </div>
  );
}
