import { useState, useEffect, useMemo } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useMessageHandler } from './hooks/useMessageHandler';
import { useSessionManager } from './hooks/useSessionManager';
import { useChatInput } from './hooks/useChatInput';
import {
  Message,
  WelcomeScreen,
  UserQuestionDialog,
  PermissionDialog,
  SettingsPanel,
  DebugPanel,
} from './components';
import { InputArea } from './components/InputArea';
import { useProject } from './contexts/ProjectContext';
import { BlueprintDetailContent } from './components/swarm/BlueprintDetailPanel/BlueprintDetailContent';
import { TerminalPanel } from './components/Terminal/TerminalPanel';
import type { SessionActions } from './types';

// 获取 WebSocket URL
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

interface AppProps {
  onNavigateToBlueprint?: (blueprintId: string) => void;
  onNavigateToSwarm?: (blueprintId?: string) => void;
  onNavigateToCode?: (context?: any) => void;
  showCodePanel?: boolean;
  onToggleCodePanel?: () => void;
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onSessionsChange?: (sessions: any[]) => void;
  onSessionIdChange?: (id: string | null) => void;
  onConnectedChange?: (connected: boolean) => void;
  registerSessionActions?: (actions: SessionActions) => void;
}

function AppContent({
  onNavigateToBlueprint, onNavigateToSwarm, onNavigateToCode,
  showCodePanel,
  showSettings, onCloseSettings,
  onSessionsChange, onSessionIdChange, onConnectedChange,
  registerSessionActions,
}: AppProps) {
  const { state: projectState } = useProject();
  const currentProjectPath = projectState.currentProject?.path;
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(280);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const { connected, sessionId, model, setModel, send, addMessageHandler } = useWebSocket(getWebSocketUrl());

  // 消息处理
  const {
    messages,
    setMessages,
    status,
    setStatus,
    contextUsage,
    compactState,
    permissionRequest,
    setPermissionRequest,
    userQuestion,
    setUserQuestion,
    permissionMode,
    setPermissionMode,
    currentMessageRef,
    interruptPendingRef,
    isTranscriptMode,
    setIsTranscriptMode,
  } = useMessageHandler({
    addMessageHandler,
    model,
    send,
    refreshSessions: () => sessionManager.refreshSessions(),
    onNavigateToSwarm,
    sessionId: sessionId ?? null,
  });

  // 会话管理
  const sessionManager = useSessionManager({
    connected,
    send,
    addMessageHandler,
    sessionId: sessionId ?? null,
    model,
    currentProjectPath,
    setMessages,
  });

  // 输入处理
  const chatInput = useChatInput({
    connected,
    send,
    model,
    status,
    setStatus,
    messages,
    setMessages,
    currentMessageRef,
    interruptPendingRef,
    currentProjectPath,
    permissionRequest,
    setPermissionRequest,
    userQuestion,
    setUserQuestion,
    setPermissionMode,
  });

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 上报会话数据给 Root
  useEffect(() => {
    onSessionsChange?.(sessionManager.sessions);
  }, [sessionManager.sessions, onSessionsChange]);

  useEffect(() => {
    onSessionIdChange?.(sessionId ?? null);
  }, [sessionId, onSessionIdChange]);

  useEffect(() => {
    onConnectedChange?.(connected);
  }, [connected, onConnectedChange]);

  // 注册会话操作回调给 Root
  useEffect(() => {
    registerSessionActions?.({
      selectSession: sessionManager.handleSessionSelect,
      deleteSession: sessionManager.handleSessionDelete,
      renameSession: sessionManager.handleSessionRename,
      newSession: sessionManager.handleNewSession,
    });
  }, [sessionManager.handleSessionSelect, sessionManager.handleSessionDelete, sessionManager.handleSessionRename, sessionManager.handleNewSession, registerSessionActions]);

  // 全局快捷键
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setIsTranscriptMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setIsTranscriptMode]);

  // 对齐官方渲染管线
  const visibleMessages = useMemo(() => {
    let filtered = messages;
    if (!isTranscriptMode) {
      let lastBoundaryIndex = -1;
      for (let i = filtered.length - 1; i >= 0; i--) {
        if (filtered[i].isCompactBoundary) {
          lastBoundaryIndex = i;
          break;
        }
      }
      if (lastBoundaryIndex !== -1) {
        filtered = filtered.slice(lastBoundaryIndex);
      }
    }
    filtered = filtered.filter(msg => {
      if (msg.isVisibleInTranscriptOnly && !isTranscriptMode) return false;
      return true;
    });
    return filtered;
  }, [messages, isTranscriptMode]);

  const hasCompactBoundary = useMemo(() => messages.some(m => m.isCompactBoundary), [messages]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flex: 1 }}>
      <div className="main-content" style={{ flex: 1, ...(showCodePanel ? { flexDirection: 'row' as const } : {}) }}>
        {showCodePanel && (
          <div className="code-panel">
            <BlueprintDetailContent blueprintId="code-browser-standalone" />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
          <div className={`chat-panel ${showCodePanel ? 'chat-panel-split' : ''}`} style={{ flex: 1, minHeight: 0 }}>
            <div className="chat-container" ref={chatContainerRef}>
              {visibleMessages.length === 0 && messages.length === 0 ? (
                <WelcomeScreen onBlueprintCreated={onNavigateToBlueprint} />
              ) : (
                visibleMessages.map(msg => (
                  <Message
                    key={msg.id}
                    message={msg}
                    onNavigateToBlueprint={onNavigateToBlueprint}
                    onNavigateToSwarm={onNavigateToSwarm}
                    onNavigateToCode={onNavigateToCode}
                    onDevAction={chatInput.handleDevAction}
                    isStreaming={currentMessageRef.current?.id === msg.id && status !== 'idle'}
                    isTranscriptMode={isTranscriptMode}
                  />
                ))
              )}
            </div>

            <InputArea
              input={chatInput.input}
              onInputChange={chatInput.handleInputChange}
              onKeyDown={chatInput.handleKeyDown}
              onPaste={chatInput.handlePaste}
              inputRef={chatInput.inputRef}
              fileInputRef={chatInput.fileInputRef}
              attachments={chatInput.attachments}
              onRemoveAttachment={chatInput.handleRemoveAttachment}
              onFileSelect={chatInput.handleFileSelect}
              showCommandPalette={chatInput.showCommandPalette}
              onCommandSelect={chatInput.handleCommandSelect}
              onCloseCommandPalette={() => chatInput.setShowCommandPalette(false)}
              connected={connected}
              status={status}
              model={model}
              onModelChange={setModel}
              permissionMode={permissionMode}
              onPermissionModeChange={chatInput.handlePermissionModeChange}
              onSend={chatInput.handleSend}
              onCancel={chatInput.handleCancel}
              contextUsage={contextUsage}
              compactState={compactState}
              hasCompactBoundary={hasCompactBoundary}
              isTranscriptMode={isTranscriptMode}
              onToggleTranscriptMode={() => setIsTranscriptMode(!isTranscriptMode)}
              showTerminal={showTerminal}
              onToggleTerminal={() => setShowTerminal(!showTerminal)}
              onOpenDebugPanel={() => setShowDebugPanel(true)}
            />
          </div>

          <TerminalPanel
            send={send}
            addMessageHandler={addMessageHandler}
            connected={connected}
            visible={showTerminal}
            height={terminalHeight}
            onClose={() => setShowTerminal(false)}
            onHeightChange={setTerminalHeight}
            projectPath={currentProjectPath}
          />
        </div>
      </div>

      {userQuestion && (
        <UserQuestionDialog question={userQuestion} onAnswer={chatInput.handleAnswerQuestion} />
      )}
      {permissionRequest && (
        <PermissionDialog
          request={permissionRequest}
          onRespond={chatInput.handlePermissionRespond}
          onRespondWithDestination={chatInput.handlePermissionRespondWithDestination}
          showFullSelector={true}
          defaultDestination="session"
        />
      )}
      <SettingsPanel
        isOpen={!!showSettings}
        onClose={() => onCloseSettings?.()}
        model={model}
        onModelChange={setModel}
      />
      <DebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        send={send}
        addMessageHandler={addMessageHandler}
      />
    </div>
  );
}

// 需要 React 导入用于 useRef
import React from 'react';

function App(props: AppProps) {
  return <AppContent {...props} />;
}

export default App;
