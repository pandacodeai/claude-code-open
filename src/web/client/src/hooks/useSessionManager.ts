/**
 * useSessionManager hook
 * 从 App.tsx 提取的会话管理逻辑
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectChangeListener, type Project, type BlueprintInfo } from '../contexts/ProjectContext';
import type { Session, WSMessage } from '../types';

// 防抖函数
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  return debouncedFn;
}

interface UseSessionManagerParams {
  connected: boolean;
  send: (msg: any) => void;
  addMessageHandler: (handler: (msg: WSMessage) => void) => () => void;
  sessionId: string | null;
  model: string;
  currentProjectPath?: string;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

interface UseSessionManagerReturn {
  sessions: Session[];
  refreshSessions: () => void;
  handleSessionSelect: (id: string) => void;
  handleSessionDelete: (id: string) => void;
  handleSessionRename: (id: string, name: string) => void;
  handleNewSession: () => void;
}

export function useSessionManager({
  connected,
  send,
  addMessageHandler,
  sessionId,
  model,
  currentProjectPath,
  setMessages,
}: UseSessionManagerParams): UseSessionManagerReturn {
  const [sessions, setSessions] = useState<Session[]>([]);

  // 防抖的会话列表刷新函数
  const refreshSessionsRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    refreshSessionsRef.current = debounce(() => {
      if (connected) {
        send({
          type: 'session_list',
          payload: {
            limit: 50,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            projectPath: currentProjectPath,
          },
        });
      }
    }, 500);

    return () => {
      refreshSessionsRef.current?.cancel();
    };
  }, [connected, send, currentProjectPath]);

  const refreshSessions = useCallback(() => {
    refreshSessionsRef.current?.();
  }, []);

  // 监听 session_list_response 和 session_deleted/renamed 消息
  useEffect(() => {
    const unsubscribe = addMessageHandler((msg: WSMessage) => {
      const payload = msg.payload as Record<string, unknown>;

      switch (msg.type) {
        case 'session_list_response':
          if (payload.sessions) {
            setSessions(payload.sessions as Session[]);
          }
          break;

        case 'session_deleted':
          if (payload.success) {
            const deletedId = payload.sessionId as string;
            setSessions(prev => prev.filter(s => s.id !== deletedId));
          }
          break;

        case 'session_renamed':
          if (payload.success) {
            setSessions(prev =>
              prev.map(s => (s.id === payload.sessionId ? { ...s, name: payload.name as string } : s))
            );
          }
          break;

        case 'session_created':
          if (payload.sessionId) {
            refreshSessions();
          }
          break;
      }
    });

    return unsubscribe;
  }, [addMessageHandler, refreshSessions]);

  // 连接成功后请求会话列表
  useEffect(() => {
    if (connected) {
      send({
        type: 'session_list',
        payload: {
          limit: 50,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          projectPath: currentProjectPath,
        },
      });
    }
  }, [connected, send, currentProjectPath]);

  // 监听项目切换事件
  useProjectChangeListener(
    useCallback(
      (project: Project | null, _blueprint: BlueprintInfo | null) => {
        console.log('[App] 项目切换，刷新会话列表:', project?.path);
        if (connected) {
          send({
            type: 'session_list',
            payload: {
              limit: 50,
              sortBy: 'updatedAt',
              sortOrder: 'desc',
              projectPath: project?.path,
            },
          });
        }
      },
      [connected, send]
    )
  );

  const handleSessionSelect = useCallback(
    (id: string) => {
      send({ type: 'session_switch', payload: { sessionId: id } });
    },
    [send]
  );

  const handleSessionDelete = useCallback(
    (id: string) => {
      send({ type: 'session_delete', payload: { sessionId: id } });
    },
    [send]
  );

  const handleSessionRename = useCallback(
    (id: string, name: string) => {
      send({ type: 'session_rename', payload: { sessionId: id, name } });
    },
    [send]
  );

  const handleNewSession = useCallback(() => {
    setMessages([]);
    send({ type: 'session_new', payload: { model, projectPath: currentProjectPath } });
  }, [send, model, currentProjectPath, setMessages]);

  return {
    sessions,
    refreshSessions,
    handleSessionSelect,
    handleSessionDelete,
    handleSessionRename,
    handleNewSession,
  };
}
