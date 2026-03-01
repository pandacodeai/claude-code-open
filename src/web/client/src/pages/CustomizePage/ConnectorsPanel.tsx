import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../i18n';
import styles from './ConnectorsPanel.module.css';

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

// ========================================
// Connector 图标映射
// ========================================

function getConnectorIcon(name: string, size: number = 32): JSX.Element {
  const lowerName = name.toLowerCase();

  // GitHub
  if (lowerName.includes('github')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    );
  }

  // Google Drive
  if (lowerName.includes('google') || lowerName.includes('gdrive') || lowerName.includes('drive')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.71 3.5L1.15 15l2.86 4.96L10.57 8.45 7.71 3.5zM8.8 3.5h6.4l6.65 11.5H15.2L8.8 3.5zm7.1 12.5H2.6l3.2 5.5h13.6l3.2-5.5H15.9z" />
      </svg>
    );
  }

  // Slack
  if (lowerName.includes('slack')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 15a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2h2v2zm1 0a2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2v-5zM9 6a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v2H9zm0 1a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2 2 2 0 012-2h5zm9 2a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2V9h2zm-1 0a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2V9zm-2 9a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2v-2h2zm0-1a2 2 0 01-2-2 2 2 0 012-2h5a2 2 0 012 2 2 2 0 01-2 2h-5z" />
      </svg>
    );
  }

  // Notion
  if (lowerName.includes('notion')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
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
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    );
  }

  // Email
  if (lowerName.includes('email') || lowerName.includes('mail') || lowerName.includes('smtp')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    );
  }

  // Filesystem
  if (lowerName.includes('filesystem') || lowerName.includes('file')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    );
  }

  // Default: puzzle piece icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16V7a2 2 0 00-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6a2 2 0 00-2 2v4c1.66 0 3 1.34 3 3s-1.34 3-3 3v3a2 2 0 002 2h4c0-1.66 1.34-3 3-3s3 1.34 3 3h4a2 2 0 002-2z" />
    </svg>
  );
}

// ========================================
// ConnectorsPanel 主组件
// ========================================

export default function ConnectorsPanel() {
  const { t } = useLanguage();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);

  // 通过 HTTP API 获取 MCP 服务器列表
  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch('/api/mcp/servers');
      if (res.ok) {
        const data = await res.json();
        const mappedServers: McpServer[] = (data.servers || []).map((s: any) => ({
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
      }
    } catch (err) {
      console.error('Failed to fetch MCP servers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 连接/断开操作
  const handleToggle = async (server: McpServer) => {
    const newEnabled = !server.enabled;
    // 乐观更新 UI
    setServers((prev) =>
      prev.map((s) => (s.name === server.name ? { ...s, enabled: newEnabled } : s))
    );
    if (selectedServer?.name === server.name) {
      setSelectedServer({ ...server, enabled: newEnabled });
    }
    // 调用 API
    try {
      await fetch(`/api/mcp/servers/${encodeURIComponent(server.name)}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
    } catch (err) {
      console.error('Failed to toggle server:', err);
      // 回滚
      setServers((prev) =>
        prev.map((s) => (s.name === server.name ? { ...s, enabled: !newEnabled } : s))
      );
    }
  };

  // 移除连接器
  const handleRemove = async (server: McpServer) => {
    setServers((prev) => prev.filter((s) => s.name !== server.name));
    if (selectedServer?.name === server.name) {
      setSelectedServer(null);
    }
    try {
      await fetch(`/api/mcp/servers/${encodeURIComponent(server.name)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to remove server:', err);
      // 回滚
      fetchServers();
    }
  };

  // 分组：已连接 vs 未连接
  const connectedServers = servers.filter((s) => s.enabled);
  const notConnectedServers = servers.filter((s) => !s.enabled);

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
              {notConnectedServers.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupHeader}>{t('customize.notConnected')}</div>
                  <div className={styles.connectorList}>
                    {notConnectedServers.map((server) => (
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
              {connectedServers.length > 0 && (
                <div className={styles.group}>
                  <div className={styles.groupHeader}>{t('customize.connected')}</div>
                  <div className={styles.connectorList}>
                    {connectedServers.map((server) => (
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
            <p>{servers.length === 0 ? t('customize.noConnectors') : t('customize.selectConnector')}</p>
          </div>
        ) : (
          <div className={styles.detailContent}>
            {/* 大图标 */}
            <div className={styles.detailIcon}>{getConnectorIcon(selectedServer.name, 64)}</div>

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
