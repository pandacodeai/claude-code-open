import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import { useWebSocket } from '../../hooks/useWebSocket';
import styles from './ConnectorsPanel.module.css';

// 获取 WebSocket URL
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

interface McpServer {
  name: string;
  type: 'stdio' | 'sse' | 'http';
  enabled: boolean;
  command?: string;
  args?: string[];
  url?: string;
  scope?: 'user' | 'project' | 'local' | 'dynamic';
  toolsCount?: number;
  resourcesCount?: number;
  promptsCount?: number;
}

interface ConnectorsPanelProps {
  onSendMessage?: (message: any) => void;
  addMessageHandler?: (handler: (msg: any) => void) => () => void;
}

// ========================================
// Connector 图标映射
// ========================================

function getConnectorIcon(name: string): JSX.Element {
  const lowerName = name.toLowerCase();

  // GitHub
  if (lowerName.includes('github')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    );
  }

  // Google Drive
  if (lowerName.includes('google') || lowerName.includes('gdrive') || lowerName.includes('drive')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.5 3l-5.5 9.5L7.5 21h9l4.5-7.8L15.5 3h-7zm6.4 2L18 12h-7.2L7.6 5h7.3zM6 13.5L8.5 18l-2.5 4.3L3 18l3-4.5zm4.5 0h7l-3.5 6.5h-7l3.5-6.5z" />
      </svg>
    );
  }

  // Slack
  if (lowerName.includes('slack')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 15a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2h2v2zm1 0a2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2v-5zM9 6a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v2H9zm0 1a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2 2 2 0 012-2h5zm9 2a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2V9h2zm-1 0a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2V9zm-2 9a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2v-2h2zm0-1a2 2 0 01-2-2 2 2 0 012-2h5a2 2 0 012 2 2 2 0 01-2 2h-5z" />
      </svg>
    );
  }

  // Notion
  if (lowerName.includes('notion')) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6c-1.1 0-2 .9-2 2zm12 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V4.5L18.5 9H13z" />
      </svg>
    );
  }

  // Database (Postgres, MySQL, SQLite)
  if (
    lowerName.includes('postgres') ||
    lowerName.includes('mysql') ||
    lowerName.includes('sqlite') ||
    lowerName.includes('database') ||
    lowerName.includes('db')
  ) {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    );
  }

  // 默认：拼图图标
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 15.439a3 3 0 004.122-4.122L15.439 3.195a3 3 0 00-4.122 4.122l8.122 8.122zM8.561 8.561a3 3 0 00-4.122 4.122l8.122 8.122a3 3 0 004.122-4.122L8.561 8.561z" />
    </svg>
  );
}

// ========================================
// ConnectorsPanel 主组件
// ========================================

export default function ConnectorsPanel({ onSendMessage, addMessageHandler }: ConnectorsPanelProps) {
  const { t } = useLanguage();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 如果没有通过props传递WebSocket，则自己创建连接
  const internalWs = useWebSocket(getWebSocketUrl());
  const send = onSendMessage || internalWs.send;
  const addHandler = addMessageHandler || internalWs.addMessageHandler;

  // 请求 MCP 服务器列表
  useEffect(() => {
    if (send) {
      send({ type: 'mcp_list' });
    }
  }, [send]);

  // 监听 MCP 列表响应
  useEffect(() => {
    if (!addHandler) {
      setLoading(false);
      return;
    }

    const unsubscribe = addHandler((msg: any) => {
      if (msg.type === 'mcp_list_response') {
        const { servers: serverList } = msg.payload;
        const mappedServers: McpServer[] = (serverList || []).map((s: any) => ({
          name: s.name,
          type: s.type || 'stdio',
          enabled: s.enabled !== false,
          command: s.command,
          args: s.args,
          url: s.url,
          scope: s.scope || 'user',
          toolsCount: s.toolsCount || 0,
          resourcesCount: s.resourcesCount || 0,
          promptsCount: s.promptsCount || 0,
        }));
        setServers(mappedServers);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [addHandler]);

  // 连接/断开操作
  const handleToggle = (server: McpServer) => {
    const newEnabled = !server.enabled;
    // 立即更新 UI
    setServers((prev) =>
      prev.map((s) => (s.name === server.name ? { ...s, enabled: newEnabled } : s))
    );
    if (selectedServer?.name === server.name) {
      setSelectedServer({ ...server, enabled: newEnabled });
    }
    // 发送 WebSocket 消息
    if (send) {
      send({
        type: 'mcp_toggle',
        payload: { name: server.name, enabled: newEnabled },
      });
    }
  };

  // 移除连接器
  const handleRemove = (server: McpServer) => {
    setServers((prev) => prev.filter((s) => s.name !== server.name));
    if (selectedServer?.name === server.name) {
      setSelectedServer(null);
    }
    if (send) {
      send({
        type: 'mcp_remove',
        payload: { name: server.name },
      });
    }
  };

  // 分组：已连接 vs 未连接
  const connectedServers = servers.filter((s) => s.enabled);
  const notConnectedServers = servers.filter((s) => !s.enabled);

  // 搜索过滤
  const filterServers = (list: McpServer[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(query));
  };

  const filteredConnected = filterServers(connectedServers);
  const filteredNotConnected = filterServers(notConnectedServers);

  return (
    <div className={styles.connectorsPanel}>
      {/* 中栏：列表 */}
      <div className={styles.middleColumn}>
        <div className={styles.middleHeader}>
          <h2 className={styles.middleTitle}>{t('customize.connectors')}</h2>
          <div className={styles.middleActions}>
            <button className={styles.searchButton} title={t('customize.search')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
            </button>
            <button className={styles.addButton} title={t('customize.addConnector')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.middleContent}>
          {loading ? (
            <div className={styles.emptyState}>{t('mcp.loading')}</div>
          ) : servers.length === 0 ? (
            <div className={styles.emptyState}>{t('customize.noConnectors')}</div>
          ) : (
            <>
              {/* 未连接分组 */}
              {filteredNotConnected.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupHeader}>{t('customize.notConnected')}</div>
                  <div className={styles.connectorList}>
                    {filteredNotConnected.map((server) => (
                      <button
                        key={server.name}
                        className={`${styles.connectorItem} ${selectedServer?.name === server.name ? styles.active : ''}`}
                        onClick={() => setSelectedServer(server)}
                      >
                        <span className={styles.connectorIcon}>{getConnectorIcon(server.name)}</span>
                        <span className={styles.connectorName}>{server.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 已连接分组 */}
              {filteredConnected.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupHeader}>{t('customize.connected')}</div>
                  <div className={styles.connectorList}>
                    {filteredConnected.map((server) => (
                      <button
                        key={server.name}
                        className={`${styles.connectorItem} ${selectedServer?.name === server.name ? styles.active : ''}`}
                        onClick={() => setSelectedServer(server)}
                      >
                        <span className={styles.connectorIcon}>{getConnectorIcon(server.name)}</span>
                        <span className={styles.connectorName}>{server.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右栏：详情 */}
      <div className={styles.rightColumn}>
        {!selectedServer ? (
          <div className={styles.emptyDetail}>
            <p>{t('customize.noConnectors')}</p>
          </div>
        ) : (
          <div className={styles.detailContent}>
            {/* 大图标 */}
            <div className={styles.detailIcon}>{getConnectorIcon(selectedServer.name)}</div>

            {/* 状态文字 */}
            <div className={styles.detailStatus}>
              {selectedServer.enabled
                ? t('customize.connectedTo', { name: selectedServer.name })
                : t('customize.notConnectedYet', { name: selectedServer.name })}
            </div>

            {/* 主操作按钮 */}
            <div className={styles.detailActions}>
              <button
                className={`${styles.primaryButton} ${selectedServer.enabled ? styles.danger : ''}`}
                onClick={() => handleToggle(selectedServer)}
              >
                {selectedServer.enabled ? t('customize.disconnect') : t('customize.connect')}
              </button>
            </div>

            {/* 已连接时的额外信息 */}
            {selectedServer.enabled && (
              <div className={styles.detailInfo}>
                {selectedServer.toolsCount !== undefined && selectedServer.toolsCount > 0 && (
                  <div className={styles.infoRow}>
                    {t('customize.toolCount', { count: selectedServer.toolsCount })}
                  </div>
                )}
                <div className={styles.secondaryActions}>
                  <button className={styles.secondaryButton} onClick={() => handleToggle(selectedServer)}>
                    {t('customize.reconnect')}
                  </button>
                  <button className={styles.secondaryButton} onClick={() => handleRemove(selectedServer)}>
                    {t('customize.remove')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
