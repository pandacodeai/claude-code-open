/**
 * Hooks 配置面板组件
 * 用于配置 12 个事件钩子，支持命令和 URL 两种类型
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import '../../styles/config-panels.css';

// ============ 类型定义 ============

interface ConfigPanelProps {
  onSave: (config: HooksConfig) => void;
  onClose?: () => void;
  initialConfig?: HooksConfig;
}

interface HooksConfig {
  enabled?: boolean;
  globalTimeout?: number;
  maxConcurrent?: number;
  [key: string]: any; // 用于存储各个 hook 事件的配置
}

interface HookConfig {
  type?: 'command' | 'url';
  command?: string;
  args?: string[];
  url?: string;
  method?: string;
  timeout?: number;
  blocking?: boolean;
  matcher?: string;
}

interface HookEditorProps {
  hookConfig: HookConfig;
  onChange: (config: HookConfig) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// 12 个事件钩子 ID
const HOOK_EVENT_IDS = [
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Notification',
  'UserPromptSubmit',
  'SessionStart',
  'SessionEnd',
  'Stop',
  'SubagentStart',
  'SubagentStop',
  'PreCompact',
  'PermissionRequest',
];

// ============ Hook 编辑器子组件 ============

function HookEditor({ hookConfig, onChange, t }: HookEditorProps) {
  return (
    <div className="hook-editor">
      <div className="hook-editor-grid">
        <div className="setting-item">
          <label className="setting-label">{t('hooks.editor.type')}</label>
          <select
            className="setting-select"
            value={hookConfig.type || 'command'}
            onChange={(e) => onChange({ ...hookConfig, type: e.target.value as any })}
          >
            <option value="command">{t('hooks.editor.type.command')}</option>
            <option value="url">{t('hooks.editor.type.url')}</option>
          </select>
        </div>

        {hookConfig.type === 'command' ? (
          <>
            <div className="setting-item">
              <label className="setting-label">{t('hooks.editor.commandPath')}</label>
              <input
                type="text"
                className="setting-input"
                value={hookConfig.command || ''}
                onChange={(e) => onChange({ ...hookConfig, command: e.target.value })}
                placeholder="/path/to/script.sh 或 /usr/bin/python"
              />
              <div className="setting-hint">
                {t('hooks.editor.commandPathHint')}
              </div>
            </div>
            <div className="setting-item">
              <label className="setting-label">
                {t('hooks.editor.args')}
                <span className="setting-label-hint">{t('hooks.editor.argsOptional')}</span>
              </label>
              <input
                type="text"
                className="setting-input"
                value={hookConfig.args?.join(', ') || ''}
                onChange={(e) =>
                  onChange({
                    ...hookConfig,
                    args: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="arg1, arg2, arg3"
              />
              <div className="setting-hint">
                {t('hooks.editor.argsHint')}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="setting-item">
              <label className="setting-label">{t('hooks.editor.webhookUrl')}</label>
              <input
                type="text"
                className="setting-input"
                value={hookConfig.url || ''}
                onChange={(e) => onChange({ ...hookConfig, url: e.target.value })}
                placeholder="https://example.com/webhook"
              />
              <div className="setting-hint">
                {t('hooks.editor.webhookUrlHint')}
              </div>
            </div>
            <div className="setting-item">
              <label className="setting-label">{t('hooks.editor.httpMethod')}</label>
              <select
                className="setting-select"
                value={hookConfig.method || 'POST'}
                onChange={(e) => onChange({ ...hookConfig, method: e.target.value })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </>
        )}

        <div className="setting-item">
          <label className="setting-label">{t('hooks.editor.timeout')}</label>
          <input
            type="number"
            className="setting-input"
            value={hookConfig.timeout || 30000}
            onChange={(e) => onChange({ ...hookConfig, timeout: parseInt(e.target.value) || 30000 })}
            min="1000"
            max="300000"
            step="1000"
          />
          <div className="setting-hint">
            {t('hooks.editor.timeoutHint')}
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-checkbox-label">
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={hookConfig.blocking || false}
              onChange={(e) => onChange({ ...hookConfig, blocking: e.target.checked })}
            />
            {t('hooks.editor.blocking')}
          </label>
          <div className="setting-hint">
            {t('hooks.editor.blockingHint')}
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            {t('hooks.editor.matcher')}
            <span className="setting-label-hint">{t('hooks.editor.matcherOptional')}</span>
          </label>
          <input
            type="text"
            className="setting-input"
            value={hookConfig.matcher || ''}
            onChange={(e) => onChange({ ...hookConfig, matcher: e.target.value })}
            placeholder="^(Read|Write)$"
          />
          <div className="setting-hint">
            {t('hooks.editor.matcherHint')}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 主组件 ============

export function HooksConfigPanel({ onSave, onClose, initialConfig }: ConfigPanelProps) {
  const { t } = useLanguage();
  const [config, setConfig] = useState<HooksConfig>({
    enabled: false,
    globalTimeout: 30000,
    maxConcurrent: 5,
  });

  const [selectedHook, setSelectedHook] = useState<string | null>(null);

  // 加载初始配置
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const updateHookConfig = (event: string, hookConfig: HookConfig) => {
    setConfig({
      ...config,
      [event]: hookConfig,
    });
  };

  const removeHookConfig = (event: string) => {
    const newConfig = { ...config };
    delete newConfig[event];
    setConfig(newConfig);
  };

  const handleSave = () => {
    // 清理未配置的 hook
    const cleanedConfig: HooksConfig = {
      enabled: config.enabled,
      globalTimeout: config.globalTimeout,
      maxConcurrent: config.maxConcurrent,
    };

    HOOK_EVENT_IDS.forEach((eventId) => {
      if (config[eventId]) {
        cleanedConfig[eventId] = config[eventId];
      }
    });

    onSave(cleanedConfig);
  };

  return (
    <div className="hooks-config-panel">
      <div className="config-panel-header">
        <h3>{t('hooks.title')}</h3>
        <p className="config-description">
          {t('hooks.description')}
        </p>
      </div>

      {/* 全局设置 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('hooks.global.title')}</h4>
        <p className="config-section-description">
          {t('hooks.global.description')}
        </p>

        <div className="setting-item">
          <label className="setting-checkbox-label">
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={config.enabled || false}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            />
            {t('hooks.global.enable')}
          </label>
          <div className="setting-hint">
            {t('hooks.global.enableHint')}
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">{t('hooks.global.timeout')}</label>
          <input
            type="number"
            className="setting-input"
            value={config.globalTimeout || 30000}
            onChange={(e) => setConfig({ ...config, globalTimeout: parseInt(e.target.value) || 30000 })}
            min="1000"
            max="300000"
            step="1000"
          />
          <div className="setting-hint">
            {t('hooks.global.timeoutHint')}
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">{t('hooks.global.maxConcurrent')}</label>
          <input
            type="number"
            className="setting-input"
            value={config.maxConcurrent || 5}
            onChange={(e) => setConfig({ ...config, maxConcurrent: parseInt(e.target.value) || 5 })}
            min="1"
            max="20"
          />
          <div className="setting-hint">
            {t('hooks.global.maxConcurrentHint')}
          </div>
        </div>
      </section>

      {/* Hook 事件列表 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('hooks.events.title')}</h4>
        <p className="config-section-description">
          {t('hooks.events.description')}
        </p>

        <div className="hooks-list">
          {HOOK_EVENT_IDS.map((eventId) => {
            const isConfigured = !!config[eventId];
            const isExpanded = selectedHook === eventId;

            return (
              <div key={eventId} className="hook-item">
                <div
                  className="hook-header"
                  onClick={() => setSelectedHook(isExpanded ? null : eventId)}
                >
                  <div className="hook-header-left">
                    <span className="hook-icon">
                      {isConfigured ? '✓' : '○'}
                    </span>
                    <div className="hook-info">
                      <span className="hook-name">{t(`hooks.event.${eventId}`)}</span>
                      <span className="hook-id">{eventId}</span>
                    </div>
                  </div>
                  <div className="hook-header-right">
                    <span className={`hook-status ${isConfigured ? 'hook-configured' : 'hook-unconfigured'}`}>
                      {isConfigured ? t('hooks.event.configured') : t('hooks.event.notConfigured')}
                    </span>
                    <span className="hook-expand-icon">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="hook-content">
                    <div className="hook-description">
                      {t(`hooks.event.${eventId}.desc`)}
                    </div>
                    <HookEditor
                      hookConfig={config[eventId] || {}}
                      onChange={(hookConfig) => updateHookConfig(eventId, hookConfig)}
                      t={t}
                    />
                    {isConfigured && (
                      <div className="hook-actions">
                        <button
                          className="config-btn config-btn-danger-small"
                          onClick={() => removeHookConfig(eventId)}
                        >
                          {t('hooks.removeHook')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 操作按钮 */}
      <div className="config-actions">
        <button className="config-btn config-btn-primary" onClick={handleSave}>
          {t('hooks.save')}
        </button>
        {onClose && (
          <button className="config-btn config-btn-secondary" onClick={onClose}>
            {t('hooks.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}

export default HooksConfigPanel;
