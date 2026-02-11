/**
 * 权限配置面板组件
 * 用于配置完整的权限系统，包括默认模式、工具权限、路径权限、命令权限、网络权限和审计日志
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import '../../styles/config-panels.css';

// ============ 类型定义 ============

interface ConfigPanelProps {
  onSave: (config: PermissionsConfig) => void;
  onClose?: () => void;
  initialConfig?: PermissionsConfig;
}

interface PermissionsConfig {
  defaultMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  tools?: {
    allow?: string[];
    deny?: string[];
  };
  paths?: {
    allow?: string[];
    deny?: string[];
  };
  commands?: {
    allow?: string[];
    deny?: string[];
  };
  network?: {
    allow?: string[];
    deny?: string[];
  };
  audit?: {
    enabled?: boolean;
    logFile?: string;
  };
}

// ============ 主组件 ============

export function PermissionsConfigPanel({ onSave, onClose, initialConfig }: ConfigPanelProps) {
  const { t } = useLanguage();
  const [config, setConfig] = useState<PermissionsConfig>({
    defaultMode: 'default',
    tools: { allow: [], deny: [] },
    paths: { allow: [], deny: [] },
    commands: { allow: [], deny: [] },
    network: { allow: [], deny: [] },
    audit: { enabled: false },
  });

  // 加载初始配置
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        ...initialConfig,
        tools: initialConfig.tools || { allow: [], deny: [] },
        paths: initialConfig.paths || { allow: [], deny: [] },
        commands: initialConfig.commands || { allow: [], deny: [] },
        network: initialConfig.network || { allow: [], deny: [] },
        audit: initialConfig.audit || { enabled: false },
      });
    }
  }, [initialConfig]);

  const handleSave = () => {
    // 清理空数组和未启用的配置
    const cleanedConfig: PermissionsConfig = {
      defaultMode: config.defaultMode,
    };

    if (config.tools?.allow?.length || config.tools?.deny?.length) {
      cleanedConfig.tools = {
        allow: config.tools.allow?.filter(Boolean),
        deny: config.tools.deny?.filter(Boolean),
      };
    }

    if (config.paths?.allow?.length || config.paths?.deny?.length) {
      cleanedConfig.paths = {
        allow: config.paths.allow?.filter(Boolean),
        deny: config.paths.deny?.filter(Boolean),
      };
    }

    if (config.commands?.allow?.length || config.commands?.deny?.length) {
      cleanedConfig.commands = {
        allow: config.commands.allow?.filter(Boolean),
        deny: config.commands.deny?.filter(Boolean),
      };
    }

    if (config.network?.allow?.length || config.network?.deny?.length) {
      cleanedConfig.network = {
        allow: config.network.allow?.filter(Boolean),
        deny: config.network.deny?.filter(Boolean),
      };
    }

    if (config.audit?.enabled) {
      cleanedConfig.audit = config.audit;
    }

    onSave(cleanedConfig);
  };

  return (
    <div className="permissions-config-panel">
      <div className="config-panel-header">
        <h3>{t('permissions.title')}</h3>
        <p className="config-description">
          {t('permissions.description')}
        </p>
      </div>

      {/* 默认权限模式 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('permissions.mode.title')}</h4>
        <p className="config-section-description">
          {t('permissions.mode.description')}
        </p>
        <div className="setting-item">
          <label className="setting-label">{t('permissions.mode.label')}</label>
          <select
            className="setting-select"
            value={config.defaultMode}
            onChange={(e) => setConfig({ ...config, defaultMode: e.target.value as any })}
          >
            <option value="default">{t('permissions.mode.default')}</option>
            <option value="acceptEdits">{t('permissions.mode.acceptEdits')}</option>
            <option value="bypassPermissions">{t('permissions.mode.bypassPermissions')}</option>
            <option value="plan">{t('permissions.mode.plan')}</option>
          </select>
          <div className="setting-hint">
            {config.defaultMode === 'default' && t('permissions.mode.hint.default')}
            {config.defaultMode === 'acceptEdits' && t('permissions.mode.hint.acceptEdits')}
            {config.defaultMode === 'bypassPermissions' && t('permissions.mode.hint.bypassPermissions')}
            {config.defaultMode === 'plan' && t('permissions.mode.hint.plan')}
          </div>
        </div>
      </section>

      {/* 工具权限 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('permissions.tools.title')}</h4>
        <p className="config-section-description">
          {t('permissions.tools.description')}
        </p>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.tools.allow.label')}
            <span className="setting-label-hint">{t('permissions.tools.allow.hint')}</span>
          </label>
          <input
            type="text"
            className="setting-input"
            value={config.tools?.allow?.join(', ') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                tools: {
                  ...config.tools,
                  allow: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                },
              })
            }
            placeholder="Bash, Read, Write, Edit, Glob, Grep"
          />
          <div className="setting-hint">
            {t('permissions.tools.allow.example')}
          </div>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.tools.deny.label')}
            <span className="setting-label-hint">{t('permissions.tools.deny.hint')}</span>
          </label>
          <input
            type="text"
            className="setting-input"
            value={config.tools?.deny?.join(', ') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                tools: {
                  ...config.tools,
                  deny: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                },
              })
            }
            placeholder="WebFetch, WebSearch"
          />
          <div className="setting-hint">
            {t('permissions.tools.deny.description')}
          </div>
        </div>
      </section>

      {/* 路径权限 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('permissions.paths.title')}</h4>
        <p className="config-section-description">
          {t('permissions.paths.description')}
        </p>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.paths.allow.label')}
            <span className="setting-label-hint">{t('permissions.paths.allow.hint')}</span>
          </label>
          <textarea
            className="setting-textarea"
            value={config.paths?.allow?.join('\n') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                paths: {
                  ...config.paths,
                  allow: e.target.value.split('\n').filter(Boolean),
                },
              })
            }
            placeholder="/home/user/**&#10;/project/**/*.ts&#10;/data/**/*.json"
            rows={4}
          />
          <div className="setting-hint">
            {t('permissions.paths.allow.example')}
          </div>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.paths.deny.label')}
            <span className="setting-label-hint">{t('permissions.paths.deny.hint')}</span>
          </label>
          <textarea
            className="setting-textarea"
            value={config.paths?.deny?.join('\n') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                paths: {
                  ...config.paths,
                  deny: e.target.value.split('\n').filter(Boolean),
                },
              })
            }
            placeholder="/etc/**&#10;/root/**&#10;/sys/**"
            rows={4}
          />
          <div className="setting-hint">
            {t('permissions.paths.deny.description')}
          </div>
        </div>
      </section>

      {/* 命令权限 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('permissions.commands.title')}</h4>
        <p className="config-section-description">
          {t('permissions.commands.description')}
        </p>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.commands.allow.label')}
            <span className="setting-label-hint">{t('permissions.commands.allow.hint')}</span>
          </label>
          <textarea
            className="setting-textarea"
            value={config.commands?.allow?.join('\n') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                commands: {
                  ...config.commands,
                  allow: e.target.value.split('\n').filter(Boolean),
                },
              })
            }
            placeholder="git *&#10;npm *&#10;ls *&#10;cat *"
            rows={3}
          />
          <div className="setting-hint">
            {t('permissions.commands.allow.example')}
          </div>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.commands.deny.label')}
            <span className="setting-label-hint">{t('permissions.commands.deny.hint')}</span>
          </label>
          <textarea
            className="setting-textarea"
            value={config.commands?.deny?.join('\n') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                commands: {
                  ...config.commands,
                  deny: e.target.value.split('\n').filter(Boolean),
                },
              })
            }
            placeholder="rm -rf *&#10;sudo *&#10;chmod 777 *"
            rows={3}
          />
          <div className="setting-hint">
            {t('permissions.commands.deny.description')}
          </div>
        </div>
      </section>

      {/* 网络权限 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('permissions.network.title')}</h4>
        <p className="config-section-description">
          {t('permissions.network.description')}
        </p>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.network.allow.label')}
            <span className="setting-label-hint">{t('permissions.network.allow.hint')}</span>
          </label>
          <textarea
            className="setting-textarea"
            value={config.network?.allow?.join('\n') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                network: {
                  ...config.network,
                  allow: e.target.value.split('\n').filter(Boolean),
                },
              })
            }
            placeholder="https://api.github.com/**&#10;https://*.anthropic.com/**&#10;https://npmjs.com/**"
            rows={3}
          />
          <div className="setting-hint">
            {t('permissions.network.allow.example')}
          </div>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            {t('permissions.network.deny.label')}
            <span className="setting-label-hint">{t('permissions.network.deny.hint')}</span>
          </label>
          <textarea
            className="setting-textarea"
            value={config.network?.deny?.join('\n') || ''}
            onChange={(e) =>
              setConfig({
                ...config,
                network: {
                  ...config.network,
                  deny: e.target.value.split('\n').filter(Boolean),
                },
              })
            }
            placeholder="http://**&#10;https://malicious.com/**"
            rows={3}
          />
          <div className="setting-hint">
            {t('permissions.network.deny.description')}
          </div>
        </div>
      </section>

      {/* 审计日志 */}
      <section className="config-section">
        <h4 className="config-section-title">{t('permissions.audit.title')}</h4>
        <p className="config-section-description">
          {t('permissions.audit.description')}
        </p>
        <div className="setting-item">
          <label className="setting-checkbox-label">
            <input
              type="checkbox"
              className="setting-checkbox"
              checked={config.audit?.enabled || false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  audit: { ...config.audit, enabled: e.target.checked },
                })
              }
            />
            {t('permissions.audit.enable')}
          </label>
          <div className="setting-hint">
            {t('permissions.audit.enableHint')}
          </div>
        </div>
        {config.audit?.enabled && (
          <div className="setting-item">
            <label className="setting-label">{t('permissions.audit.logFile')}</label>
            <input
              type="text"
              className="setting-input"
              value={config.audit?.logFile || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  audit: { ...config.audit, logFile: e.target.value },
                })
              }
              placeholder="~/.claude/audit.log"
            />
            <div className="setting-hint">
              {t('permissions.audit.logFileHint')}
            </div>
          </div>
        )}
      </section>

      {/* 操作按钮 */}
      <div className="config-actions">
        <button className="config-btn config-btn-primary" onClick={handleSave}>
          {t('permissions.save')}
        </button>
        {onClose && (
          <button className="config-btn config-btn-secondary" onClick={onClose}>
            {t('permissions.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}

export default PermissionsConfigPanel;
