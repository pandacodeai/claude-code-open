/**
 * CommitDetail - Commit 详情面板
 * 显示选中 commit 的元信息、文件列表和操作按钮
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import { GitCommit } from './index';

interface CommitDetailProps {
  commit: GitCommit | null;
  send: (msg: any) => void;
  addMessageHandler: (handler: (msg: any) => void) => () => void;
  projectPath?: string;
}

interface CommitFile {
  status: 'M' | 'A' | 'D' | 'R' | 'C';
  file: string;
}

/**
 * 格式化日期为可读格式
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'M': return '#f59e0b';
    case 'A': return '#10b981';
    case 'D': return '#ef4444';
    case 'R': return '#6366f1';
    case 'C': return '#3b82f6';
    default: return '#9ca3af';
  }
}

export function CommitDetail({ commit, send, addMessageHandler, projectPath }: CommitDetailProps) {
  const { t } = useLanguage();
  const [files, setFiles] = useState<CommitFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // 监听 commit_detail_response
  useEffect(() => {
    const handler = (msg: any) => {
      if (msg?.type === 'git:commit_detail_response' && msg.payload?.success) {
        const { hash, files: responseFiles } = msg.payload.data;
        if (hash === commit?.hash && responseFiles) {
          setFiles(responseFiles);
          setLoadingFiles(false);
        }
      }
    };

    const unsubscribe = addMessageHandler(handler);
    return () => unsubscribe();
  }, [addMessageHandler, commit?.hash]);

  // 当 commit 改变时，请求文件列表
  useEffect(() => {
    if (commit && projectPath) {
      setLoadingFiles(true);
      setFiles([]);
      send({
        type: 'git:get_commit_detail',
        payload: { projectPath, hash: commit.hash },
      });
    }
  }, [commit?.hash, projectPath, send]);

  // 处理文件点击 - 查看 diff
  const handleFileClick = (file: string) => {
    if (!commit || !projectPath) return;
    send({
      type: 'git:get_commit_file_diff',
      payload: { projectPath, hash: commit.hash, file },
    });
  };

  // AI Explain
  const handleExplain = () => {
    if (!commit || !projectPath) return;
    send({
      type: 'git:explain_commit',
      payload: { projectPath, hash: commit.hash },
    });
  };

  // Revert
  const handleRevert = () => {
    if (!commit || !projectPath) return;
    const confirmed = window.confirm(
      t('git.confirmRevert', { hash: commit.shortHash })
    );
    if (!confirmed) return;
    
    send({
      type: 'git:revert_commit',
      payload: { projectPath, hash: commit.hash },
    });
  };

  // Cherry-pick
  const handleCherryPick = () => {
    if (!commit || !projectPath) return;
    const confirmed = window.confirm(
      t('git.confirmCherryPick', { hash: commit.shortHash })
    );
    if (!confirmed) return;
    
    send({
      type: 'git:cherry_pick',
      payload: { projectPath, hash: commit.hash },
    });
  };

  // 空状态
  if (!commit) {
    return (
      <div className="git-commit-detail-panel">
        <div className="git-commit-detail-empty">
          {t('git.selectCommitToView')}
        </div>
      </div>
    );
  }

  return (
    <div className="git-commit-detail-panel">
      {/* Commit 元信息头部 */}
      <div className="git-commit-detail-header">
        <div className="git-commit-detail-row">
          <span className="git-commit-detail-label">{t('git.commitHash')}:</span>
          <span className="git-commit-detail-value git-commit-detail-hash">
            {commit.hash}
          </span>
        </div>
        <div className="git-commit-detail-row">
          <span className="git-commit-detail-label">{t('git.shortHash')}:</span>
          <span className="git-commit-detail-value git-commit-detail-short-hash">
            {commit.shortHash}
          </span>
        </div>
        <div className="git-commit-detail-row">
          <span className="git-commit-detail-label">{t('git.author')}:</span>
          <span className="git-commit-detail-value">{commit.author}</span>
        </div>
        <div className="git-commit-detail-row">
          <span className="git-commit-detail-label">{t('git.date')}:</span>
          <span className="git-commit-detail-value">{formatDate(commit.date)}</span>
        </div>
        <div className="git-commit-detail-row git-commit-detail-row--message">
          <span className="git-commit-detail-label">{t('git.message')}:</span>
          <pre className="git-commit-detail-message">{commit.message}</pre>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="git-commit-detail-files">
        <div className="git-commit-detail-files-header">
          {t('git.changedFiles')} ({files.length})
        </div>
        {loadingFiles && (
          <div className="git-commit-detail-files-loading">{t('common.loading')}</div>
        )}
        {!loadingFiles && files.length === 0 && (
          <div className="git-commit-detail-files-empty">{t('git.noChanges')}</div>
        )}
        {!loadingFiles && files.length > 0 && (
          <div className="git-commit-detail-files-list">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="git-commit-detail-file-item"
                onClick={() => handleFileClick(file.file)}
                title={`${t('git.viewDiff')}: ${file.file}`}
              >
                <span
                  className="git-commit-detail-file-status"
                  style={{
                    backgroundColor: `${getStatusColor(file.status)}20`,
                    color: getStatusColor(file.status),
                  }}
                >
                  {file.status}
                </span>
                <span className="git-commit-detail-file-name">{file.file}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="git-commit-detail-actions">
        <button
          className="git-commit-detail-action-button git-commit-detail-action-button--primary"
          onClick={handleExplain}
          title={t('git.explainCommit')}
        >
          🤖 {t('git.aiExplain')}
        </button>
        <button
          className="git-commit-detail-action-button git-commit-detail-action-button--danger"
          onClick={handleRevert}
          title={t('git.revert')}
        >
          ↩️ {t('git.revert')}
        </button>
        <button
          className="git-commit-detail-action-button git-commit-detail-action-button--secondary"
          onClick={handleCherryPick}
          title={t('git.cherryPick')}
        >
          🍒 {t('git.cherryPick')}
        </button>
      </div>
    </div>
  );
}
