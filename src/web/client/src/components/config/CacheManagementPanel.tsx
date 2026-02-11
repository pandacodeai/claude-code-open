/**
 * 缓存管理面板组件
 * 用于管理蓝图分析缓存
 */

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../i18n';
import { cacheApi } from '../../api/blueprint';
import '../../styles/config-panels.css';

// ============ 类型定义 ============

interface CacheStats {
  total: number;
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

interface ConfigPanelProps {
  onSave?: () => void;
  onClose?: () => void;
}

// ============ 工具函数 ============

/**
 * 格式化字节大小为人类可读格式
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化命中率为百分比
 */
function formatHitRate(rate: number): string {
  return (rate * 100).toFixed(1) + '%';
}

// ============ 主组件 ============

export function CacheManagementPanel({ onSave, onClose }: ConfigPanelProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [clearPath, setClearPath] = useState('');

  // 获取缓存统计
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cacheApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      setMessage({ type: 'error', text: t('cache.stats.empty') });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 初始化加载
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 清除所有缓存
  const handleClearAll = async () => {
    if (!window.confirm(t('cache.cleanup.allConfirm'))) return;

    setActionLoading('clearAll');
    setMessage(null);
    try {
      const result = await cacheApi.clearAll();
      setMessage({ type: 'success', text: result.message || t('cache.cleanup.all') });
      await fetchStats();
      onSave?.();
    } catch (error) {
      console.error('清除缓存失败:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('cache.cleanup.all')
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 清除过期缓存
  const handleClearExpired = async () => {
    setActionLoading('clearExpired');
    setMessage(null);
    try {
      const result = await cacheApi.clearExpired();
      setMessage({ type: 'success', text: result.message || t('cache.cleanup.expired') });
      await fetchStats();
      onSave?.();
    } catch (error) {
      console.error('清除过期缓存失败:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('cache.cleanup.expired')
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 清除指定路径的缓存
  const handleClearPath = async () => {
    if (!clearPath.trim()) {
      setMessage({ type: 'error', text: t('cache.path.required') });
      return;
    }

    setActionLoading('clearPath');
    setMessage(null);
    try {
      const result = await cacheApi.clearPath(clearPath.trim());
      setMessage({ type: 'success', text: result.message || t('cache.path.clear') });
      setClearPath('');
      await fetchStats();
      onSave?.();
    } catch (error) {
      console.error('清除路径缓存失败:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('cache.path.clear')
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 重置统计
  const handleResetStats = async () => {
    setActionLoading('resetStats');
    setMessage(null);
    try {
      const result = await cacheApi.resetStats();
      setMessage({ type: 'success', text: result.message || t('cache.stats.reset') });
      await fetchStats();
    } catch (error) {
      console.error('重置统计失败:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('cache.stats.reset')
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="cache-management-panel">
        <div className="config-loading">{t('cache.stats.loading')}</div>
      </div>
    );
  }

  return (
    <div className="cache-management-panel">
      <div className="config-panel-header">
        <h3>{t('cache.title')}</h3>
        <p className="config-description">
          {t('cache.description')}
        </p>
      </div>

      {message && (
        <div className={`config-message config-message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 缓存统计信息 */}
      <section className="config-section">
        <h4>{t('cache.stats.title')}</h4>

        {stats ? (
          <div className="cache-stats-grid">
            <div className="cache-stat-item">
              <span className="cache-stat-label">{t('cache.stats.fileCount')}</span>
              <span className="cache-stat-value">{stats.total}</span>
            </div>
            <div className="cache-stat-item">
              <span className="cache-stat-label">{t('cache.stats.totalSize')}</span>
              <span className="cache-stat-value">{formatBytes(stats.size)}</span>
            </div>
            <div className="cache-stat-item">
              <span className="cache-stat-label">{t('cache.stats.hits')}</span>
              <span className="cache-stat-value">{stats.hits}</span>
            </div>
            <div className="cache-stat-item">
              <span className="cache-stat-label">{t('cache.stats.misses')}</span>
              <span className="cache-stat-value">{stats.misses}</span>
            </div>
            <div className="cache-stat-item cache-stat-highlight">
              <span className="cache-stat-label">{t('cache.stats.hitRate')}</span>
              <span className="cache-stat-value">{formatHitRate(stats.hitRate)}</span>
            </div>
          </div>
        ) : (
          <div className="cache-stats-empty">{t('cache.stats.empty')}</div>
        )}

        <div className="cache-stat-actions">
          <button
            className="config-btn config-btn-secondary config-btn-sm"
            onClick={fetchStats}
            disabled={loading}
          >
            {loading ? t('cache.stats.refreshing') : t('cache.stats.refresh')}
          </button>
          <button
            className="config-btn config-btn-secondary config-btn-sm"
            onClick={handleResetStats}
            disabled={actionLoading === 'resetStats'}
          >
            {actionLoading === 'resetStats' ? t('cache.stats.resetting') : t('cache.stats.reset')}
          </button>
        </div>
      </section>

      {/* 缓存清理操作 */}
      <section className="config-section">
        <h4>{t('cache.cleanup.title')}</h4>

        <div className="cache-actions-grid">
          <div className="cache-action-item">
            <div className="cache-action-info">
              <span className="cache-action-title">{t('cache.cleanup.expired')}</span>
              <span className="cache-action-desc">{t('cache.cleanup.expiredDesc')}</span>
            </div>
            <button
              className="config-btn config-btn-primary"
              onClick={handleClearExpired}
              disabled={actionLoading === 'clearExpired'}
            >
              {actionLoading === 'clearExpired' ? t('cache.cleanup.clearing') : t('cache.cleanup.expiredBtn')}
            </button>
          </div>

          <div className="cache-action-item">
            <div className="cache-action-info">
              <span className="cache-action-title">{t('cache.cleanup.all')}</span>
              <span className="cache-action-desc cache-action-desc-warning">
                {t('cache.cleanup.allDesc')}
              </span>
            </div>
            <button
              className="config-btn config-btn-danger"
              onClick={handleClearAll}
              disabled={actionLoading === 'clearAll'}
            >
              {actionLoading === 'clearAll' ? t('cache.cleanup.clearing') : t('cache.cleanup.allBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* 指定路径清除 */}
      <section className="config-section">
        <h4>{t('cache.path.title')}</h4>
        <p className="config-description">
          {t('cache.path.description')}
        </p>

        <div className="cache-path-input">
          <label className="config-label">
            <span className="label-text">{t('cache.path.label')}</span>
            <input
              type="text"
              className="config-input"
              value={clearPath}
              onChange={(e) => setClearPath(e.target.value)}
              placeholder={t('cache.path.placeholder')}
            />
          </label>
          <button
            className="config-btn config-btn-primary"
            onClick={handleClearPath}
            disabled={actionLoading === 'clearPath' || !clearPath.trim()}
          >
            {actionLoading === 'clearPath' ? t('cache.cleanup.clearing') : t('cache.path.clear')}
          </button>
        </div>
      </section>

      {/* 关于缓存 */}
      <section className="config-section">
        <h4>{t('cache.about.title')}</h4>
        <div className="cache-about">
          <p>
            {t('cache.about.intro')}
          </p>
          <ul>
            <li>{t('cache.about.item1')}</li>
            <li>{t('cache.about.item2')}</li>
            <li>{t('cache.about.item3')}</li>
            <li>{t('cache.about.item4')}</li>
          </ul>
          <p>
            {t('cache.about.outro')}
          </p>
        </div>
      </section>

      <div className="config-actions">
        {onClose && (
          <button
            className="config-btn config-btn-secondary"
            onClick={onClose}
          >
            {t('cache.close')}
          </button>
        )}
      </div>
    </div>
  );
}

export default CacheManagementPanel;
