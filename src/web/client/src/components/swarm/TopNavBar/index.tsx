import { useState, useEffect, useRef } from 'react';
import styles from './TopNavBar.module.css';
import ProjectSelector from '../ProjectSelector/ProjectSelector';
import { useLanguage } from '../../../i18n';

interface SessionItem {
  id: string;
  name: string;
  updatedAt: number;
  messageCount: number;
}

interface ProjectItem {
  id: string;
  name: string;
  path: string;
  lastOpenedAt?: string;
  isEmpty?: boolean;
  hasBlueprint?: boolean;
}

export interface TopNavBarProps {
  currentPage: 'chat' | 'swarm' | 'blueprint';
  onPageChange: (page: 'chat' | 'swarm' | 'blueprint') => void;
  onSettingsClick?: () => void;
  /** 代码面板是否激活 */
  codePanelActive?: boolean;
  /** 切换代码面板 */
  onToggleCode?: () => void;
  /** 连接状态 */
  connected?: boolean;
  // 项目相关
  currentProject?: ProjectItem | null;
  onProjectChange?: (project: ProjectItem) => void;
  onOpenFolder?: () => void;
  onProjectRemove?: (project: ProjectItem) => void;
  // 会话相关
  sessions?: SessionItem[];
  currentSessionId?: string | null;
  onSessionSelect?: (id: string) => void;
  onNewSession?: () => void;
  onSessionDelete?: (id: string) => void;
  onSessionRename?: (id: string, name: string) => void;
}

/**
 * 顶部导航栏组件
 * 集成页面切换、项目选择、会话管理、设置入口
 */
export default function TopNavBar({
  currentPage, onPageChange, onSettingsClick,
  codePanelActive, onToggleCode, connected,
  currentProject, onProjectChange, onOpenFolder, onProjectRemove,
  sessions = [], currentSessionId, onSessionSelect, onNewSession,
  onSessionDelete, onSessionRename,
}: TopNavBarProps) {
  const { t } = useLanguage();
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭会话下拉
  useEffect(() => {
    if (!sessionDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(e.target as Node)) {
        setSessionDropdownOpen(false);
        setEditingSessionId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sessionDropdownOpen]);

  // 聚焦重命名输入框
  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleStartRename = (e: React.MouseEvent, session: SessionItem) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name || '');
  };

  const handleFinishRename = (sessionId: string) => {
    if (editingName.trim()) {
      onSessionRename?.(sessionId, editingName.trim());
    }
    setEditingSessionId(null);
  };

  return (
    <nav className={styles.topNavBar}>
      {/* 左侧：导航标签 */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.navTab} ${currentPage === 'chat' && !codePanelActive ? styles.active : ''}`}
          onClick={() => onPageChange('chat')}
        >
          <span className={styles.icon}>💬</span>
          <span>{t('nav.chat')}</span>
        </button>
        <button
          className={`${styles.navTab} ${currentPage === 'blueprint' ? styles.active : ''}`}
          onClick={() => onPageChange('blueprint')}
        >
          <span className={styles.icon}>📋</span>
          <span>{t('nav.blueprint')}</span>
        </button>
        <button
          className={`${styles.navTab} ${currentPage === 'swarm' ? styles.active : ''}`}
          onClick={() => onPageChange('swarm')}
        >
          <span className={styles.icon}>🐝</span>
          <span>{t('nav.swarm')}</span>
        </button>
        <button
          className={`${styles.navTab} ${codePanelActive ? styles.active : ''}`}
          onClick={() => onToggleCode?.()}
        >
          <span className={styles.icon}>📁</span>
          <span>{t('nav.code')}</span>
        </button>
      </div>

      {/* 中央：项目选择器 + 会话选择器 */}
      <div className={styles.centerControls}>
        <ProjectSelector
          currentProject={currentProject}
          onProjectChange={onProjectChange}
          onOpenFolder={onOpenFolder}
          onProjectRemove={onProjectRemove}
          className={styles.navProjectSelector}
        />

        <div className={styles.centerDivider} />

        {/* 会话选择器 */}
        <div className={styles.sessionSelector} ref={sessionDropdownRef}>
          <button
            className={`${styles.sessionTrigger} ${sessionDropdownOpen ? styles.open : ''}`}
            onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
          >
            <span className={styles.sessionIcon}>💬</span>
            <span className={styles.sessionName}>
              {currentSession?.name || t('nav.newSession')}
            </span>
            <span className={`${styles.sessionArrow} ${sessionDropdownOpen ? styles.open : ''}`}>▼</span>
          </button>

          {sessionDropdownOpen && (
            <div className={styles.sessionDropdown}>
              <div className={styles.sessionDropdownHeader}>{t('nav.recentSessions')}</div>
              <div className={styles.sessionList}>
                {sessions.length === 0 ? (
                  <div className={styles.sessionEmpty}>{t('nav.noSessions')}</div>
                ) : (
                  sessions.map(session => (
                    <div
                      key={session.id}
                      className={`${styles.sessionItem} ${session.id === currentSessionId ? styles.active : ''}`}
                      onClick={() => {
                        if (editingSessionId !== session.id) {
                          onSessionSelect?.(session.id);
                          setSessionDropdownOpen(false);
                        }
                      }}
                    >
                      <div className={styles.sessionItemInfo}>
                        {editingSessionId === session.id ? (
                          <input
                            ref={renameInputRef}
                            className={styles.renameInput}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename(session.id);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            onBlur={() => handleFinishRename(session.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <span className={styles.sessionItemName}>
                              {session.name || t('nav.unnamedSession')}
                            </span>
                            <span className={styles.sessionItemMeta}>
                              {t('nav.messageCount', { count: session.messageCount })} · {formatTime(session.updatedAt)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className={styles.sessionItemActions}>
                        <button
                          className={styles.sessionRenameBtn}
                          onClick={(e) => handleStartRename(e, session)}
                          title={t('nav.rename')}
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.sessionDeleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionDelete?.(session.id);
                          }}
                          title={t('nav.deleteSession')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：连接状态 + 新对话 + 设置 */}
      <div className={styles.actions}>
        {connected !== undefined && (
          <span className={`${styles.connectionDot} ${connected ? styles.connected : ''}`} title={connected ? t('nav.connected') : t('nav.disconnected')} />
        )}
        <button className={styles.newSessionButton} onClick={onNewSession} title={t('nav.newSession')}>
          +
        </button>
        <button className={styles.settingsButton} onClick={onSettingsClick} title={t('nav.settings')}>
          ⚙️
        </button>
      </div>
    </nav>
  );
}
