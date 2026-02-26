/**
 * RemotesView - Git 远程仓库管理视图
 * 显示 remotes 列表，支持添加、删除、fetch 操作
 */

import { useState } from 'react';
import { useLanguage } from '../../i18n';

export interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

interface RemotesViewProps {
  remotes: GitRemote[];
  send: (msg: any) => void;
  projectPath?: string;
}

export function RemotesView({ remotes, send, projectPath }: RemotesViewProps) {
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [remoteName, setRemoteName] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');

  // 添加 remote
  const handleAddRemote = () => {
    if (!projectPath) return;
    
    const name = remoteName.trim();
    const url = remoteUrl.trim();
    if (!name || !url) return;

    send({
      type: 'git:add_remote',
      payload: {
        projectPath,
        name,
        url,
      },
    });

    // 重置对话框
    setRemoteName('');
    setRemoteUrl('');
    setShowAddDialog(false);

    // 重新获取 remotes 列表
    setTimeout(() => {
      send({
        type: 'git:get_remotes',
        payload: { projectPath },
      });
    }, 100);
  };

  // 删除 remote
  const handleRemoveRemote = (name: string) => {
    if (!projectPath) return;
    
    const confirmMessage = t('git.confirmRemoveRemote').replace('{{remote}}', name);
    if (window.confirm(confirmMessage)) {
      send({
        type: 'git:remove_remote',
        payload: { projectPath, name },
      });

      // 重新获取 remotes 列表
      setTimeout(() => {
        send({
          type: 'git:get_remotes',
          payload: { projectPath },
        });
      }, 100);
    }
  };

  // Fetch 单个 remote
  const handleFetch = (remoteName?: string) => {
    if (!projectPath) return;
    send({
      type: 'git:fetch',
      payload: {
        projectPath,
        remote: remoteName,
      },
    });
  };

  // Fetch 所有 remotes
  const handleFetchAll = () => {
    handleFetch(); // 不传 remote 参数表示 fetch --all
  };

  return (
    <div className="git-remotes-view">
      {/* 顶部操作栏 */}
      <div className="git-remotes-header">
        <button className="git-new-remote-button" onClick={() => setShowAddDialog(true)}>
          + {t('git.newRemote')}
        </button>
        <button
          className="git-fetch-all-button"
          onClick={handleFetchAll}
          disabled={remotes.length === 0}
        >
          {t('git.fetchAll')}
        </button>
      </div>

      {/* 添加 Remote 对话框 */}
      {showAddDialog && (
        <div className="git-input-dialog">
          <div className="git-input-dialog-content">
            <div className="git-input-dialog-header">
              <h3>{t('git.newRemote')}</h3>
              <button
                className="git-input-dialog-close"
                onClick={() => {
                  setShowAddDialog(false);
                  setRemoteName('');
                  setRemoteUrl('');
                }}
              >
                ✕
              </button>
            </div>

            {/* Remote 名称输入 */}
            <input
              type="text"
              className="git-input-dialog-input"
              placeholder={t('git.remoteName')}
              value={remoteName}
              onChange={(e) => setRemoteName(e.target.value)}
              autoFocus
            />

            {/* Remote URL 输入 */}
            <input
              type="text"
              className="git-input-dialog-input"
              placeholder={t('git.remoteUrl')}
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
            />

            <div className="git-input-dialog-actions">
              <button
                className="git-input-dialog-cancel"
                onClick={() => {
                  setShowAddDialog(false);
                  setRemoteName('');
                  setRemoteUrl('');
                }}
              >
                {t('git.cancel')}
              </button>
              <button
                className="git-input-dialog-confirm"
                onClick={handleAddRemote}
                disabled={!remoteName.trim() || !remoteUrl.trim()}
              >
                {t('git.newRemote')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remotes 列表 */}
      {remotes.length === 0 ? (
        <div className="git-empty-state">
          {t('git.noRemotes')}
        </div>
      ) : (
        <div className="git-remote-list">
          {remotes.map((remote) => (
            <div key={remote.name} className="git-remote-item">
              <div className="git-remote-info">
                <div className="git-remote-name">{remote.name}</div>
                <div className="git-remote-urls">
                  <div className="git-remote-url">
                    <span className="git-remote-url-label">Fetch:</span>
                    <span className="git-remote-url-value">{remote.fetchUrl}</span>
                  </div>
                  <div className="git-remote-url">
                    <span className="git-remote-url-label">Push:</span>
                    <span className="git-remote-url-value">{remote.pushUrl}</span>
                  </div>
                </div>
              </div>
              <div className="git-remote-actions">
                <button
                  onClick={() => handleFetch(remote.name)}
                  title={t('git.fetch')}
                >
                  {t('git.fetch')}
                </button>
                <button
                  onClick={() => handleRemoveRemote(remote.name)}
                  title={t('git.delete')}
                >
                  {t('git.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
