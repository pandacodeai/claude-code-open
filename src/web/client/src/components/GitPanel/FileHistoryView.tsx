/**
 * FileHistoryView - 文件修改历史视图
 * 显示指定文件的提交历史，支持展开查看每个提交中的 diff
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import { DiffView } from './DiffView';
import { GitFileHistoryCommit } from '../../types';

interface FileHistoryViewProps {
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

export function FileHistoryView({
  file,
  send,
  addMessageHandler,
  projectPath,
  onClose,
}: FileHistoryViewProps) {
  const { t } = useLanguage();
  const [commits, setCommits] = useState<GitFileHistoryCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [viewingDiff, setViewingDiff] = useState<{
    hash: string;
    diff: string;
  } | null>(null);

  // 注册 WebSocket 消息处理器
  useEffect(() => {
    if (!addMessageHandler) return;

    const unsubscribe = addMessageHandler((msg: any) => {
      if (msg.type === 'git:file_history_response') {
        if (msg.payload.success && msg.payload.data) {
          setCommits(msg.payload.data);
          setError(null);
        } else {
          setError(msg.payload.error || t('git.unknownError'));
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [addMessageHandler, t]);

  // 初始化：获取文件历史
  useEffect(() => {
    setLoading(true);
    setError(null);
    send({
      type: 'git:get_file_history',
      payload: { file, limit: 50 },
    });
  }, [file, send]);

  // 切换 commit 展开/折叠
  const toggleCommit = (hash: string) => {
    if (expandedHash === hash) {
      setExpandedHash(null);
    } else {
      setExpandedHash(hash);
    }
  };

  // 查看 diff
  const handleViewDiff = (commit: GitFileHistoryCommit) => {
    if (commit.diff) {
      setViewingDiff({
        hash: commit.hash,
        diff: commit.diff,
      });
    }
  };

  // 关闭 diff 视图
  const handleCloseDiff = () => {
    setViewingDiff(null);
  };

  // 如果正在查看 diff，显示 diff 视图
  if (viewingDiff) {
    return (
      <DiffView
        diff={viewingDiff.diff}
        fileName={`${file} @ ${viewingDiff.hash.substring(0, 7)}`}
        onClose={handleCloseDiff}
      />
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className="git-file-history-view">
        <div className="git-file-history-header">
          <div className="git-file-history-title">
            <span className="git-file-history-file-name">{file}</span>
          </div>
          <button
            className="git-file-history-close"
            onClick={onClose}
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="git-file-history-content">
          <div className="git-loading">{t('git.loading')}</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="git-file-history-view">
        <div className="git-file-history-header">
          <div className="git-file-history-title">
            <span className="git-file-history-file-name">{file}</span>
          </div>
          <button
            className="git-file-history-close"
            onClick={onClose}
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="git-file-history-content">
          <div className="git-error-state">{error}</div>
        </div>
      </div>
    );
  }

  // 无历史记录
  if (commits.length === 0) {
    return (
      <div className="git-file-history-view">
        <div className="git-file-history-header">
          <div className="git-file-history-title">
            <span className="git-file-history-file-name">{file}</span>
          </div>
          <button
            className="git-file-history-close"
            onClick={onClose}
            title={t('common.close')}
          >
            ✕
          </button>
        </div>
        <div className="git-file-history-content">
          <div className="git-empty-state">
            {t('git.noCommits')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="git-file-history-view">
      {/* 头部 */}
      <div className="git-file-history-header">
        <div className="git-file-history-title">
          <span className="git-file-history-file-name">{file}</span>
          <span className="git-file-history-count">
            {commits.length} {t('git.commits')}
          </span>
        </div>
        <button
          className="git-file-history-close"
          onClick={onClose}
          title={t('common.close')}
        >
          ✕
        </button>
      </div>

      {/* 提交历史列表 */}
      <div className="git-file-history-content">
        {commits.map((commit) => {
          const isExpanded = expandedHash === commit.hash;

          return (
            <div
              key={commit.hash}
              className={`git-file-history-commit ${
                isExpanded ? 'git-file-history-commit--expanded' : ''
              }`}
            >
              {/* Commit 头部 - 可点击展开 */}
              <div
                className="git-file-history-commit-header"
                onClick={() => toggleCommit(commit.hash)}
              >
                <span className="git-file-history-commit-hash">
                  {commit.shortHash}
                </span>
                <span className="git-file-history-commit-message">
                  {commit.message}
                </span>
              </div>

              {/* Commit 元信息 */}
              <div className="git-file-history-commit-meta">
                <span className="git-file-history-commit-author">
                  {commit.author}
                </span>
                <span className="git-file-history-commit-time">
                  {formatRelativeTime(commit.date)}
                </span>
              </div>

              {/* 展开后显示操作按钮和 diff 预览 */}
              {isExpanded && (
                <div className="git-file-history-commit-details">
                  {commit.diff && commit.diff.trim() ? (
                    <>
                      <div className="git-file-history-commit-actions">
                        <button
                          className="git-file-history-view-diff-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDiff(commit);
                          }}
                        >
                          {t('git.viewDiff')}
                        </button>
                      </div>
                      {/* Diff 预览（显示前几行） */}
                      <div className="git-file-history-diff-preview">
                        <pre>{commit.diff.split('\n').slice(0, 20).join('\n')}</pre>
                        {commit.diff.split('\n').length > 20 && (
                          <div className="git-file-history-diff-truncated">
                            ... {commit.diff.split('\n').length - 20} more lines
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="git-file-history-no-diff">
                      {t('git.noDiffAvailable')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
