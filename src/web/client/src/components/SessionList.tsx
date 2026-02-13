import { useState } from 'react';
import { formatDate } from '../utils/constants';
import { useLanguage } from '../i18n';
import type { Session } from '../types';

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, name: string) => void;
}

export function SessionList({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
}: SessionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const { t } = useLanguage();

  const handleRenameStart = (session: Session) => {
    setEditingId(session.id);
    setNewTitle(session.name || t('session.unnamed'));
  };

  const handleRenameSubmit = (sessionId: string) => {
    if (newTitle.trim()) {
      onSessionRename(sessionId, newTitle.trim());
    }
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setNewTitle('');
  };

  if (sessions.length === 0) {
    return <div className="session-list-empty">{t('session.empty')}</div>;
  }

  return (
    <div className="session-list">
      {sessions.map((session, index) => (
        <div
          key={session.id || `session-${index}`}
          className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
          onClick={() => editingId !== session.id && onSessionSelect(session.id)}
        >
          {editingId === session.id ? (
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={() => handleRenameSubmit(session.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit(session.id);
                } else if (e.key === 'Escape') {
                  handleRenameCancel();
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <>
              <div className="session-title">{session.name || t('session.unnamed')}</div>
              <div className="session-meta">
                <span className="session-date">{formatDate(session.updatedAt)}</span>
                <span className="session-count">{t('session.messages', { count: session.messageCount })}</span>
              </div>
              <div className="session-actions">
                <button
                  className="session-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameStart(session);
                  }}
                  title={t('session.rename')}
                >
                  ✏️
                </button>
                <button
                  className="session-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t('session.deleteConfirm', { name: session.name || t('session.unnamed') }))) {
                      onSessionDelete(session.id);
                    }
                  }}
                  title={t('session.delete')}
                >
                  🗑️
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
