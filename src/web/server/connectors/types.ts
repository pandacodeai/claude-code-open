/**
 * OAuth Connector 系统类型定义
 */

// ConnectorProvider: 预定义连接器模板
export interface ConnectorProvider {
  id: string;              // 'github', 'gmail', 'google-calendar', 'google-drive'
  name: string;            // 显示名
  category: 'web' | 'google' | 'feishu' | 'dingtalk' | 'microsoft' | 'custom';
  description: string;     // 连接后能做什么
  icon: string;            // 图标标识符（前端用于匹配 SVG）
  // OAuth 配置（钉钉等凭据直连的 Connector 不需要 OAuth）
  oauth?: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    scopes: string[];
    responseType?: string;  // 默认 'code'
    grantType?: string;     // 默认 'authorization_code'
    // 环境变量名：部署时设置，用户无需手动填写 Client ID/Secret
    envClientId?: string;    // e.g. 'GITHUB_CLIENT_ID'
    envClientSecret?: string; // e.g. 'GITHUB_CLIENT_SECRET'
  };
  // 凭据直连配置（不走 OAuth，用户填入 Key/Secret/Token 直接启动 MCP）
  credentials?: {
    fields: {
      key: string;        // 字段标识符，如 'token', 'teamId'
      label: string;      // 显示标签，如 'Bot Token'
      type: 'text' | 'password';
      envVar?: string;    // 用于读取预配置值的环境变量名（如 'NOTION_TOKEN'）
      mcpEnvVar?: string; // 传给 MCP 进程的环境变量名（如 'OPENAPI_MCP_HEADERS'）
    }[];
  };
  // MCP 远程 OAuth URL（通过 mcp-remote 代理，如 https://mcp.notion.com/mcp）
  // 设置此字段后，authType 自动为 'mcp-oauth'，无需 oauth 或 credentials 配置
  mcpRemoteUrl?: string;
  mcpServer?: {
    serverName: string;  // MCP server 注册名，如 'connector-github'
    command: string;     // 'npx'
    args: string[];      // ['-y', '@modelcontextprotocol/server-github']
    envMapping: Record<string, 'accessToken' | 'refreshToken'>;
    // key = 环境变量名, value = 从 ConnectorTokenData 中取哪个字段
    shared?: boolean;    // 多个 connector 共享同一个 MCP server（如 Google 系列）
    tokenFilePath?: string; // 预写 token 文件路径（用于 Google workspace MCP 等需要 token 文件的包）
  };
}

// ConnectorTokenData: 存储在 settings.json 中的 token 数据
export interface ConnectorTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes: string[];
  connectedAt: number;
  userInfo?: Record<string, any>;
  teamId?: string;  // Slack OAuth 返回的 team.id，MCP 需要 SLACK_TEAM_ID
}

// ConnectorClientConfig: 用户在设置中配置的 OAuth 凭证或凭据直连字段
export interface ConnectorClientConfig {
  clientId: string;
  clientSecret: string;
  // 额外字段（凭据直连模式可能有 >2 个字段）
  [key: string]: string | undefined;
}

// ConnectorStatus: API 返回给前端的连接器状态
export interface ConnectorStatus {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: 'connected' | 'not_connected';
  configured: boolean;     // 是否已配置 clientId/clientSecret
  configureHint?: string;  // 未配置时的引导文案
  connectedAt?: number;
  userInfo?: Record<string, any>;
  mcpServerName?: string;   // 关联的 MCP server name
  mcpConnected?: boolean;   // MCP server 是否已连接
  mcpToolCount?: number;    // 可用工具数量
  authType?: 'oauth' | 'credentials' | 'mcp-oauth'; // 认证方式：OAuth 弹窗 / 凭据直连 / MCP 远程 OAuth
  credentialFields?: { key: string; label: string; type: 'text' | 'password' }[];
}

// OAuthState: 临时存储的 OAuth 状态（防 CSRF）
export interface OAuthState {
  connectorId: string;
  state: string;
  codeVerifier?: string;   // PKCE
  createdAt: number;
}
