/**
 * PermissionDestinationSelector 组件
 * VSCode 扩展中权限请求的可点击目标选择器
 *
 * v2.1.3 新功能：允许用户选择权限设置保存的位置
 * - This project: 保存到 .axon/settings.json（团队共享）
 * - All projects: 保存到 ~/.axon/settings.json（全局）
 * - Shared with team: 保存到 .axon/settings.local.json（本地机器特定）
 * - Session only: 仅当前会话，不持久化
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '../i18n';
import styles from './PermissionDestinationSelector.module.css';

/**
 * 权限保存目标类型
 */
export type PermissionDestination = 'project' | 'global' | 'team' | 'session';

/**
 * 目标配置信息
 */
export interface DestinationConfig {
  id: PermissionDestination;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  path?: string; // 配置文件路径（session 没有路径）
}

/**
 * 静态目标配置（icon/shortcut/path 不需要翻译）
 */
const DESTINATION_CONFIGS: Array<{
  id: PermissionDestination;
  labelKey: string;
  descKey: string;
  icon: string;
  shortcut?: string;
  path?: string;
}> = [
  {
    id: 'project',
    labelKey: 'permission.destination.project.label',
    descKey: 'permission.destination.project.desc',
    icon: '📁',
    shortcut: 'P',
    path: '.axon/settings.json',
  },
  {
    id: 'global',
    labelKey: 'permission.destination.global.label',
    descKey: 'permission.destination.global.desc',
    icon: '🌐',
    shortcut: 'G',
    path: '~/.axon/settings.json',
  },
  {
    id: 'team',
    labelKey: 'permission.destination.team.label',
    descKey: 'permission.destination.team.desc',
    icon: '👥',
    shortcut: 'T',
    path: '.axon/settings.local.json',
  },
  {
    id: 'session',
    labelKey: 'permission.destination.session.label',
    descKey: 'permission.destination.session.desc',
    icon: '⏱️',
    shortcut: 'S',
  },
];

/**
 * 用翻译函数生成 PERMISSION_DESTINATIONS
 */
function getTranslatedDestinations(t: (key: string) => string): DestinationConfig[] {
  return DESTINATION_CONFIGS.map((cfg) => ({
    id: cfg.id,
    label: t(cfg.labelKey),
    description: t(cfg.descKey),
    icon: cfg.icon,
    shortcut: cfg.shortcut,
    path: cfg.path,
  }));
}

/**
 * 导出静态版本（向后兼容，用于不在 React 组件内的场景）
 * 使用英文 fallback
 */
export const PERMISSION_DESTINATIONS: DestinationConfig[] = DESTINATION_CONFIGS.map((cfg) => ({
  id: cfg.id,
  label: cfg.labelKey, // fallback to key
  description: cfg.descKey,
  icon: cfg.icon,
  shortcut: cfg.shortcut,
  path: cfg.path,
}));

/**
 * 组件属性
 */
export interface PermissionDestinationSelectorProps {
  /** 当前选中的目标 */
  currentDestination?: PermissionDestination;
  /** 选择目标时的回调 */
  onSelect: (destination: PermissionDestination) => void;
  /** 是否禁用选择器 */
  disabled?: boolean;
  /** 是否显示快捷键提示 */
  showShortcuts?: boolean;
  /** 是否显示配置路径 */
  showPaths?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
  /** 紧凑模式 */
  compact?: boolean;
  /** 方向：水平或垂直 */
  direction?: 'horizontal' | 'vertical';
}

/**
 * PermissionDestinationSelector 组件
 *
 * 可点击的目标选择器，允许用户选择权限设置保存的位置
 */
export function PermissionDestinationSelector({
  currentDestination = 'session',
  onSelect,
  disabled = false,
  showShortcuts = true,
  showPaths = true,
  className = '',
  compact = false,
  direction = 'vertical',
}: PermissionDestinationSelectorProps) {
  const [hoveredId, setHoveredId] = useState<PermissionDestination | null>(null);
  const { t } = useLanguage();

  const destinations = useMemo(() => getTranslatedDestinations(t), [t]);

  // 处理选择事件
  const handleSelect = useCallback(
    (destination: PermissionDestination) => {
      if (!disabled) {
        onSelect(destination);
      }
    },
    [disabled, onSelect]
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, destination: PermissionDestination) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelect(destination);
      }
    },
    [handleSelect]
  );

  // 处理快捷键
  React.useEffect(() => {
    if (disabled) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的按键
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toUpperCase();
      const destination = destinations.find((d) => d.shortcut === key);
      if (destination) {
        event.preventDefault();
        handleSelect(destination.id);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [disabled, handleSelect, destinations]);

  // 计算容器类名
  const containerClassName = useMemo(() => {
    const classes = [styles.container];
    if (compact) classes.push(styles.compact);
    if (direction === 'horizontal') classes.push(styles.horizontal);
    if (disabled) classes.push(styles.disabled);
    if (className) classes.push(className);
    return classes.join(' ');
  }, [compact, direction, disabled, className]);

  return (
    <div className={containerClassName} role="radiogroup" aria-label="Permission save location">
      <div className={styles.header}>
        <span className={styles.headerIcon}>📍</span>
        <span className={styles.headerText}>{t('permission.destination.header')}</span>
      </div>

      <div className={styles.optionsContainer}>
        {destinations.map((dest) => {
          const isSelected = currentDestination === dest.id;
          const isHovered = hoveredId === dest.id;

          return (
            <button
              key={dest.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${styles.option} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
              onClick={() => handleSelect(dest.id)}
              onKeyDown={(e) => handleKeyDown(e, dest.id)}
              onMouseEnter={() => setHoveredId(dest.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={disabled}
              tabIndex={isSelected ? 0 : -1}
            >
              <span className={styles.optionIcon}>{dest.icon}</span>
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>
                  {dest.label}
                  {showShortcuts && dest.shortcut && (
                    <kbd className={styles.shortcut}>{dest.shortcut}</kbd>
                  )}
                </span>
                {!compact && (
                  <span className={styles.optionDescription}>{dest.description}</span>
                )}
                {showPaths && dest.path && !compact && (
                  <code className={styles.optionPath}>{dest.path}</code>
                )}
              </div>
              {isSelected && <span className={styles.checkmark}>✓</span>}
            </button>
          );
        })}
      </div>

      {showShortcuts && (
        <div className={styles.shortcutHint}>
          {t('permission.destination.shortcutHint', { keys: 'P/G/T/S' })}
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑版下拉选择器
 */
export function PermissionDestinationDropdown({
  currentDestination = 'session',
  onSelect,
  disabled = false,
  className = '',
}: Omit<PermissionDestinationSelectorProps, 'compact' | 'direction' | 'showShortcuts' | 'showPaths'>) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const destinations = useMemo(() => getTranslatedDestinations(t), [t]);

  const currentConfig = useMemo(
    () => destinations.find((d) => d.id === currentDestination),
    [currentDestination, destinations]
  );

  const handleSelect = useCallback(
    (destination: PermissionDestination) => {
      onSelect(destination);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  // 点击外部关闭
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(`.${styles.dropdown}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`${styles.dropdown} ${className}`}>
      <button
        type="button"
        className={styles.dropdownTrigger}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.dropdownIcon}>{currentConfig?.icon}</span>
        <span className={styles.dropdownLabel}>{currentConfig?.label}</span>
        <span className={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {destinations.map((dest) => {
            const isSelected = currentDestination === dest.id;

            return (
              <button
                key={dest.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ''}`}
                onClick={() => handleSelect(dest.id)}
              >
                <span className={styles.dropdownItemIcon}>{dest.icon}</span>
                <div className={styles.dropdownItemContent}>
                  <span className={styles.dropdownItemLabel}>{dest.label}</span>
                  <span className={styles.dropdownItemDescription}>{dest.description}</span>
                </div>
                {isSelected && <span className={styles.dropdownItemCheck}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PermissionDestinationSelector;
