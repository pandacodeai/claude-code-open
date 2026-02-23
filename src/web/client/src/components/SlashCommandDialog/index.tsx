/**
 * SlashCommandDialog - 斜杠命令结果对话框
 * 以弹窗形式展示命令执行结果，替代插入聊天消息的方式
 */

import { useEffect, useCallback } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import './SlashCommandDialog.css';

interface SessionInfo {
  id: string;
  name?: string;
  updatedAt: number;
  createdAt: number;
  messageCount: number;
  model?: string;
  summary?: string;
  projectPath?: string;
}

export interface SlashCommandResult {
  command: string;
  success: boolean;
  message?: string;
  data?: any;
  action?: string;
  dialogType?: 'text' | 'session-list' | 'compact-result';
}

interface SlashCommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: SlashCommandResult | null;
  onSessionSelect?: (sessionId: string) => void;
}

function formatTimeAgo(timestamp: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minutesAgo', { count: mins });
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  if (days < 7) return t('time.daysAgo', { count: days });
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function SlashCommandDialog({ isOpen, onClose, result, onSessionSelect }: SlashCommandDialogProps) {
  const { t } = useLanguage();
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !result) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const commandName = result.command.startsWith('/')
    ? result.command.split(/\s+/)[0]
    : '/' + result.command.split(/\s+/)[0];
  const dialogType = result.dialogType || 'text';

  return (
    <div className="slash-cmd-backdrop" onClick={handleBackdropClick}>
      <div className="slash-cmd-dialog">
        {/* Header */}
        <div className="slash-cmd-header">
          <div className="slash-cmd-header-left">
            <div className={`slash-cmd-icon ${result.success ? 'success' : 'error'}`}>
              {result.success ? '✓' : '✗'}
            </div>
            <h3 className="slash-cmd-title">
              {dialogType === 'session-list' ? t('session.restore') :
               dialogType === 'compact-result' ? t('session.compactResult') :
               commandName}
            </h3>
          </div>
          <button className="slash-cmd-close" onClick={onClose} title={t('common.close')}>✕</button>
        </div>

        {/* Content */}
        <div className="slash-cmd-content">
          {dialogType === 'session-list' ? (
            <SessionListView
              sessions={result.data?.sessions || []}
              onSelect={(id) => {
                onSessionSelect?.(id);
                onClose();
              }}
            />
          ) : dialogType === 'compact-result' ? (
            <CompactResultView result={result} />
          ) : (
            <div className="slash-cmd-text">{result.message || (result.success ? t('session.commandSuccess') : t('session.commandFailed'))}</div>
          )}
        </div>

        {/* Footer */}
        <div className="slash-cmd-footer">
          <button className="slash-cmd-footer-btn" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
}

function SessionListView({ sessions, onSelect }: { sessions: SessionInfo[]; onSelect: (id: string) => void }) {
  const { t } = useLanguage();
  
  if (sessions.length === 0) {
    return <div className="slash-cmd-empty">{t('session.noSessions')}</div>;
  }

  return (
    <ul className="slash-cmd-session-list">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="slash-cmd-session-item"
          onClick={() => onSelect(session.id)}
        >
          <div className="slash-cmd-session-name">
            {session.name || t('session.name', { id: session.id.slice(0, 8) })}
          </div>
          <div className="slash-cmd-session-meta">
            <span>{formatTimeAgo(session.updatedAt, t)}</span>
            <span>{t('session.messageCount', { count: session.messageCount })}</span>
            {session.model && <span>{session.model}</span>}
            {session.projectPath && (
              <span title={session.projectPath}>
                {session.projectPath.split(/[/\\]/).pop()}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function CompactResultView({ result }: { result: SlashCommandResult }) {
  const { t } = useLanguage();
  const data = result.data || {};

  if (!result.success) {
    return <div className="slash-cmd-text">{result.message || t('session.compactFailed')}</div>;
  }

  return (
    <>
      <div className="slash-cmd-compact-stats">
        <div className="slash-cmd-stat-card highlight">
          <div className="slash-cmd-stat-value">~{(data.savedTokens || 0).toLocaleString()}</div>
          <div className="slash-cmd-stat-label">{t('session.tokensSaved')}</div>
        </div>
        <div className="slash-cmd-stat-card">
          <div className="slash-cmd-stat-value">{data.messagesBefore || '?'}</div>
          <div className="slash-cmd-stat-label">{t('session.beforeMessages')}</div>
        </div>
        <div className="slash-cmd-stat-card">
          <div className="slash-cmd-stat-value">{data.messagesAfter || '?'}</div>
          <div className="slash-cmd-stat-label">{t('session.afterMessages')}</div>
        </div>
        <div className="slash-cmd-stat-card">
          <div className="slash-cmd-stat-value">
            {data.messagesBefore && data.messagesAfter
              ? `${Math.round((1 - data.messagesAfter / data.messagesBefore) * 100)}%`
              : '?'}
          </div>
          <div className="slash-cmd-stat-label">{t('session.compactRate')}</div>
        </div>
      </div>
    </>
  );
}
