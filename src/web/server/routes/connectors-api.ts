/**
 * OAuth Connectors API 路由
 * 管理 OAuth 连接器的认证和配置
 */

import { Router } from 'express';
import { connectorManager } from '../connectors/index.js';

const router = Router();

// ========================================
// GET /api/connectors/callback - OAuth 回调
// 注意：这个路由必须在 /:id 之前注册！
// ========================================
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // 返回一个 HTML 页面：通过 postMessage 通知父窗口，然后关闭弹窗
  const sendAndClose = (payload: { type: string; connectorId?: string; error?: string }) => {
    const json = JSON.stringify(payload);
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html><html><body><script>
      if (window.opener) {
        window.opener.postMessage(${json}, window.location.origin);
      }
      window.close();
    </script><p>Authorization complete. You can close this window.</p></body></html>`);
  };

  // OAuth 错误处理
  if (error) {
    console.error('[Connectors] OAuth error:', error);
    return sendAndClose({ type: 'oauth-error', error: error as string });
  }

  // 参数验证
  if (!code || !state) {
    console.error('[Connectors] Missing code or state');
    return sendAndClose({ type: 'oauth-error', error: 'missing_params' });
  }

  try {
    // 从请求头或协议推断 redirectBase
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectBase = `${protocol}://${host}`;

    // 处理 OAuth 回调
    const connectorId = await connectorManager.handleCallback(
      code as string,
      state as string,
      redirectBase
    );

    console.log('[Connectors] OAuth callback successful:', connectorId);

    // OAuth 成功后，尝试自动激活 MCP（异步，不阻塞）
    const manager = req.app.locals.conversationManager;
    if (manager) {
      manager.activateConnectorMcp(connectorId).catch((err: any) => {
        console.warn(`[Connectors] Failed to auto-activate MCP for ${connectorId}:`, err);
      });
    }

    // 通知父窗口并关闭弹窗
    sendAndClose({ type: 'oauth-success', connectorId });
  } catch (err: any) {
    console.error('[Connectors] OAuth callback failed:', err);
    sendAndClose({ type: 'oauth-error', error: err.message });
  }
});

// ========================================
// GET /api/connectors - 列出所有连接器
// ========================================
router.get('/', async (req, res) => {
  try {
    const connectors = connectorManager.listConnectors();
    
    // 填充 MCP 运行时状态（工具数量、连接状态）
    const manager = req.app.locals.conversationManager;
    if (manager) {
      for (const connector of connectors) {
        if (connector.mcpServerName) {
          const tools = manager.getMcpToolsForConnector(connector.id);
          connector.mcpConnected = tools.length > 0;
          connector.mcpToolCount = tools.length;
        }
      }
    }

    res.json({ connectors });
  } catch (err: any) {
    console.error('[Connectors] Failed to list connectors:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// GET /api/connectors/:id - 单个连接器详情
// ========================================
router.get('/:id', async (req, res) => {
  try {
    const connector = connectorManager.getConnector(req.params.id);
    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // 填充 MCP 运行时状态
    const manager = req.app.locals.conversationManager;
    if (manager && connector.mcpServerName) {
      const tools = manager.getMcpToolsForConnector(connector.id);
      connector.mcpConnected = tools.length > 0;
      connector.mcpToolCount = tools.length;
    }

    res.json(connector);
  } catch (err: any) {
    console.error('[Connectors] Failed to get connector:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/connect - 启动 OAuth
// ========================================
router.post('/:id/connect', async (req, res) => {
  try {
    // 从请求头或协议推断 redirectBase
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectBase = `${protocol}://${host}`;

    const result = connectorManager.startOAuth(req.params.id, redirectBase);
    res.json(result);
  } catch (err: any) {
    console.error('[Connectors] Failed to start OAuth:', err);
    res.status(400).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/mcp-oauth-connect - MCP 远程 OAuth 连接
// 通过 mcp-remote 代理，OAuth 由 mcp-remote 在 MCP 启动时自动弹窗处理
// ========================================
router.post('/:id/mcp-oauth-connect', async (req, res) => {
  try {
    const connectorId = connectorManager.mcpOAuthConnect(req.params.id);

    // 启动 MCP（mcp-remote 首次连接时会自动弹浏览器做 OAuth）
    const manager = req.app.locals.conversationManager;
    if (manager) {
      manager.activateConnectorMcp(connectorId).catch((err: any) => {
        console.warn(`[Connectors] Failed to auto-activate MCP for ${connectorId}:`, err);
      });
    }

    res.json({ success: true, connectorId });
  } catch (err: any) {
    console.error('[Connectors] Failed to mcp-oauth-connect:', err);
    res.status(400).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/direct-connect - 凭据直连（不走 OAuth）
// ========================================
router.post('/:id/direct-connect', async (req, res) => {
  let credentials = req.body || {};

  // 如果前端没传凭据或凭据不完整，尝试从环境变量/settings 读取合并
  const existingConfig = connectorManager.getClientConfig(req.params.id);
  if (existingConfig) {
    credentials = { ...existingConfig, ...credentials };
  }

  // 至少需要有一个有值的字段
  const hasAnyValue = Object.values(credentials).some((v: any) => v && typeof v === 'string' && v.trim());
  if (!hasAnyValue) {
    return res.status(400).json({ error: 'At least one credential field is required' });
  }

  try {
    const connectorId = connectorManager.directConnect(req.params.id, credentials);

    // 自动激活 MCP
    const manager = req.app.locals.conversationManager;
    if (manager) {
      manager.activateConnectorMcp(connectorId).catch((err: any) => {
        console.warn(`[Connectors] Failed to auto-activate MCP for ${connectorId}:`, err);
      });
    }

    res.json({ success: true, connectorId });
  } catch (err: any) {
    console.error('[Connectors] Failed to direct connect:', err);
    res.status(400).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/disconnect - 断开连接
// ========================================
router.post('/:id/disconnect', async (req, res) => {
  try {
    // 先停用 MCP（在断开连接之前）
    const manager = req.app.locals.conversationManager;
    if (manager) {
      await manager.deactivateConnectorMcp(req.params.id).catch((err: any) => {
        console.warn(`[Connectors] Failed to deactivate MCP for ${req.params.id}:`, err);
      });
    }

    connectorManager.disconnect(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Connectors] Failed to disconnect:', err);
    res.status(400).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/config - 保存 OAuth 客户端配置
// ========================================
router.post('/:id/config', async (req, res) => {
  const { clientId, clientSecret } = req.body;

  // 参数验证
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'clientId and clientSecret are required' });
  }

  try {
    connectorManager.setClientConfig(req.params.id, { clientId, clientSecret });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Connectors] Failed to save config:', err);
    res.status(400).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/activate-mcp - 激活 MCP Server
// ========================================
router.post('/:id/activate-mcp', async (req, res) => {
  try {
    const manager = req.app.locals.conversationManager;
    if (!manager) {
      return res.status(500).json({ error: 'ConversationManager not available' });
    }

    const result = await manager.activateConnectorMcp(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('[Connectors] Failed to activate MCP:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/deactivate-mcp - 停用 MCP Server
// ========================================
router.post('/:id/deactivate-mcp', async (req, res) => {
  try {
    const manager = req.app.locals.conversationManager;
    if (!manager) {
      return res.status(500).json({ error: 'ConversationManager not available' });
    }

    await manager.deactivateConnectorMcp(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Connectors] Failed to deactivate MCP:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// POST /api/connectors/:id/refresh - 刷新 Token
// ========================================
router.post('/:id/refresh', async (req, res) => {
  try {
    const success = await connectorManager.refreshTokenIfNeeded(req.params.id);
    
    if (success) {
      // 返回更新后的 connector 状态
      const connector = connectorManager.getConnector(req.params.id);
      res.json({ success: true, connector });
    } else {
      res.status(400).json({ error: 'Token refresh failed' });
    }
  } catch (err: any) {
    console.error('[Connectors] Failed to refresh token:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
