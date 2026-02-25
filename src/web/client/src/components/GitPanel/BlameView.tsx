/**
 * BlameView - 文件追溯视图
 * 显示每行代码的最后修改信息（提交哈希、作者、日期）
 * 支持点击提交哈希查看提交详情
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';

interface GitBlameLine {
  lineNumber: number;
  commit: string;
  author: string;
  date: string;
  content: string;
}

interface BlameViewProps {
  file: string;
  send: (msg: any) => void;
  addMessageHandler?: (handler: (msg: any) => void) => () => void;
  projectPath?: string;
  onClose: () => void;
}

/**
 * 将 ISO 时间格式转换为相对时间字符串
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function BlameView({
  file,
  send,
  addMessageHandler,
  projectPath,
  onClose,
}: BlameViewProps) {
  const { t } = useLanguage();
  const [blameLines, setBlameLines] = useState<GitBlameLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  // 注册 WebSocket 消息处理器
  useEffect(() => {
    if (!addMessageHandler) return;

    const unsubscribe = addMessageHandler((msg: any) => {
      if (msg.type === 'git:blame_response') {
        if (msg.payload.success && msg.payload.data) {
          setBlameLines(msg.payload.data);
          setError(null);
        } else {
          setError(msg.payload.error || t('git.unknownError'));
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [addMessageHandler, t]);

  // 初始化：获取文件 blame 数据
  useEffect(() => {
    setLoading(true);
    setError(null);
    send({
      type: 'git:get_blame',
      payload: { file },
    });
  }, [file, send]);

  // 处理点击提交哈希
  const handleCommitClick = (hash: string) => {
    setExpandedHash(expandedHash === hash ? null : hash);
    if (expandedHash !== hash && projectPath) {
      send({
        type: 'git:get_commit_detail',
        payload: { projectPath, hash },
      });
    }
  };

  // 加载中
  if (loading) {
    return (
      <div className="git-blame-view">
        <div className="git-blame-header">
          <div className="git-blame-title">
            <span className="git-blame-file-name">{file}</span>
          </div>
          <button
            className="git-blame-close"
            onClick={onClose}
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="git-blame-content">
          <div className="git-loading">{t('git.loading')}</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="git-blame-view">
        <div className="git-blame-header">
          <div className="git-blame-title">
            <span className="git-blame-file-name">{file}</span>
          </div>
          <button
            className="git-blame-close"
            onClick={onClose}
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="git-blame-content">
          <div className="git-error-state">{error}</div>
        </div>
      </div>
    );
  }

  // 无行内容
  if (blameLines.length === 0) {
    return (
      <div className="git-blame-view">
        <div className="git-blame-header">
          <div className="git-blame-title">
            <span className="git-blame-file-name">{file}</span>
          </div>
          <button
            className="git-blame-close"
            onClick={onClose}
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="git-blame-content">
          <div className="git-empty-state">
            {t('git.blameEmpty')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="git-blame-view">
      {/* 头部 */}
      <div className="git-blame-header">
        <div className="git-blame-title">
          <span className="git-blame-file-name">{file}</span>
          <span className="git-blame-count">
            {blameLines.length} {t('git.lines')}
          </span>
        </div>
        <button
          className="git-blame-close"
          onClick={onClose}
          title={t('common.close')}
        >
          ✕
        </button>
      </div>

      {/* 追溯表格 */}
      <div className="git-blame-content">
        <div className="git-blame-table">
          {/* 表头 */}
          <div className="git-blame-table-header">
            <div className="git-blame-col git-blame-col--line-number">
              {t('git.lineNumber')}
            </div>
            <div className="git-blame-col git-blame-col--commit">
              {t('git.commit')}
            </div>
            <div className="git-blame-col git-blame-col--author">
              {t('git.author')}
            </div>
            <div className="git-blame-col git-blame-col--date">
              {t('git.date')}
            </div>
            <div className="git-blame-col git-blame-col--code">
              {t('git.code')}
            </div>
          </div>

          {/* 表体行 */}
          {blameLines.map((line) => {
            const isExpanded = expandedHash === line.commit;

            return (
              <div
                key={`${line.lineNumber}-${line.commit}`}
                className={`git-blame-row ${
                  isExpanded ? 'git-blame-row--expanded' : ''
                }`}
              >
                {/* 行号列 */}
                <div className="git-blame-col git-blame-col--line-number">
                  <span className="git-blame-line-number">{line.lineNumber}</span>
                </div>

                {/* 提交哈希列（可点击） */}
                <div className="git-blame-col git-blame-col--commit">
                  <button
                    className="git-blame-commit-link"
                    onClick={() => handleCommitClick(line.commit)}
                    title={`${t('git.viewCommitDetails')}: ${line.commit}`}
                  >
                    {line.commit}
                  </button>
                </div>

                {/* 作者列 */}
                <div className="git-blame-col git-blame-col--author">
                  <span className="git-blame-author">{line.author}</span>
                </div>

                {/* 日期列 */}
                <div className="git-blame-col git-blame-col--date">
                  <span className="git-blame-date">
                    {formatRelativeTime(line.date)}
                  </span>
                </div>

                {/* 代码列 */}
                <div className="git-blame-col git-blame-col--code">
                  <pre className="git-blame-code">{line.content}</pre>
                </div>

                {/* 展开后显示完整日期 */}
                {isExpanded && (
                  <div className="git-blame-row-details">
                    <div className="git-blame-details-item">
                      <label>{t('git.commitHash')}:</label>
                      <code>{line.commit}</code>
                    </div>
                    <div className="git-blame-details-item">
                      <label>{t('git.fullDate')}:</label>
                      <span>{new Date(line.date).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
