/**
 * PermissionPrompt 组件
 * 增强版工具权限确认对话框
 *
 * 支持功能:
 * - 多种工具类型的详细显示 (Bash, FileEdit, FileWrite 等)
 * - 文件路径高亮和命令格式化
 * - 权限记忆选项 (once, session, always, never)
 * - 危险操作警告
 * - 快捷键支持 (y/n/s/a/A/N)
 *
 * v2.1.0 改进:
 * - Tab hint 移到底部 footer
 * - 关闭对话框后恢复光标
 *
 * v2.1.6 改进:
 * - 添加反馈面板功能，用户拒绝时可以提供反馈文本
 * - 修复在反馈输入框中输入 'n' 时面板错误关闭的问题
 * - 在输入反馈文本时禁用全局快捷键处理
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import * as path from 'path';
import { restoreCursorAfterDialog } from '../utils/terminal.js';
import type { QuickPermissionMode } from './Input.js';
import { convertFullwidthToHalfwidth, charToDigit } from '../../utils/index.js';
import { t } from '../../i18n/index.js';

// 重新导出 QuickPermissionMode 类型以便其他模块使用
export type { QuickPermissionMode };

// 权限请求类型
export type PermissionType =
  | 'file_read'
  | 'file_write'
  | 'file_delete'
  | 'bash_command'
  | 'network_request'
  | 'mcp_server'
  | 'plugin_install'
  | 'system_config'
  | 'elevated_command';  // v2.1.28: 需要管理员权限的命令

// 权限作用域
export type PermissionScope = 'once' | 'session' | 'always' | 'never';

// 权限决策回调
export interface PermissionDecision {
  allowed: boolean;
  scope: PermissionScope;
  remember: boolean;
  /** v2.1.6: 用户拒绝时提供的反馈文本 */
  feedback?: string;
}

export interface PermissionPromptProps {
  // 工具名称 (如 "Bash", "Edit", "Write")
  toolName: string;

  // 权限类型
  type: PermissionType;

  // 简短描述
  description: string;

  // 资源路径 (文件路径、命令、URL 等)
  resource?: string;

  // 额外详细信息
  details?: Record<string, unknown>;

  // 决策回调
  onDecision: (decision: PermissionDecision) => void;

  // 可选：已记住的权限模式
  rememberedPatterns?: string[];
}

// Shift+Tab 双击检测间隔（毫秒）
// 官方 v2.1.2: 一次 Shift+Tab = Auto-Accept Edits, 两次 = Plan Mode
const SHIFT_TAB_DOUBLE_PRESS_INTERVAL = 500;

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  toolName,
  type,
  description,
  resource,
  details,
  onDecision,
  rememberedPatterns = [],
}) => {
  const [selected, setSelected] = useState(0);

  // Shift+Tab 快速模式状态
  const [quickMode, setQuickMode] = useState<QuickPermissionMode>('default');
  const lastShiftTabTimeRef = useRef<number>(0);
  const shiftTabCountRef = useRef<number>(0);

  // v2.1.6: 反馈面板状态
  // showFeedbackInput: 控制反馈输入面板的显示
  // feedbackText: 存储用户输入的反馈文本
  // feedbackCursor: 文本光标位置
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCursor, setFeedbackCursor] = useState(0);

  // v2.1.0 改进：组件卸载时恢复光标
  useEffect(() => {
    return () => {
      // 确保在对话框关闭后光标可见
      restoreCursorAfterDialog();
    };
  }, []);

  // 定义可用选项
  const options = useMemo(() => {
    const opts = [
      {
        label: t('permission.allowOnce'),
        key: 'y',
        scope: 'once' as PermissionScope,
        allowed: true,
        description: t('permission.allowOnceDesc'),
      },
      {
        label: t('permission.deny'),
        key: 'n',
        scope: 'once' as PermissionScope,
        allowed: false,
        description: t('permission.denyDesc'),
      },
      {
        label: t('permission.allowSession'),
        key: 's',
        scope: 'session' as PermissionScope,
        allowed: true,
        description: t('permission.allowSessionDesc'),
      },
      {
        label: t('permission.allowAlways'),
        key: 'A',
        scope: 'always' as PermissionScope,
        allowed: true,
        description: t('permission.allowAlwaysDesc'),
      },
      {
        label: t('permission.neverAllow'),
        key: 'N',
        scope: 'never' as PermissionScope,
        allowed: false,
        description: t('permission.neverAllowDesc'),
      },
    ];
    return opts;
  }, []);

  // 处理 Shift+Tab 快速模式切换
  // 官方行为：一次 = Auto-Accept Edits, 两次 = Plan Mode
  const handleShiftTab = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPress = now - lastShiftTabTimeRef.current;

    if (timeSinceLastPress < SHIFT_TAB_DOUBLE_PRESS_INTERVAL) {
      // 连续按下 - 增加计数
      shiftTabCountRef.current += 1;
    } else {
      // 超时 - 重置计数
      shiftTabCountRef.current = 1;
    }

    lastShiftTabTimeRef.current = now;

    // 根据按下次数决定模式
    if (shiftTabCountRef.current === 1) {
      // 一次 Shift+Tab -> Auto-Accept Edits
      setQuickMode('acceptEdits');
      // 直接执行 acceptEdits 选项
      onDecision({
        allowed: true,
        scope: 'session', // 会话级别的 acceptEdits
        remember: false,
        quickMode: 'acceptEdits',
      } as PermissionDecision & { quickMode: QuickPermissionMode });
    } else if (shiftTabCountRef.current >= 2) {
      // 两次 Shift+Tab -> Plan Mode
      setQuickMode('plan');
      // 重置计数，避免继续累加
      shiftTabCountRef.current = 0;
      onDecision({
        allowed: true,
        scope: 'session',
        remember: false,
        quickMode: 'plan',
      } as PermissionDecision & { quickMode: QuickPermissionMode });
    }
  }, [onDecision]);

  // v2.1.6: 提交反馈并拒绝操作
  const submitFeedbackAndDeny = useCallback(() => {
    onDecision({
      allowed: false,
      scope: 'once',
      remember: false,
      feedback: feedbackText.trim() || undefined,
    });
    // 重置反馈面板状态
    setShowFeedbackInput(false);
    setFeedbackText('');
    setFeedbackCursor(0);
  }, [onDecision, feedbackText]);

  // v2.1.6: 取消反馈输入，返回选项列表
  const cancelFeedbackInput = useCallback(() => {
    setShowFeedbackInput(false);
    setFeedbackText('');
    setFeedbackCursor(0);
  }, []);

  // 处理用户输入
  useInput((input, key) => {
    // 将全角字符转换为半角字符（支持日语 IME 输入）
    const normalizedInput = convertFullwidthToHalfwidth(input);

    // ===== v2.1.6: 反馈面板输入处理 =====
    // 当反馈面板显示时，所有按键都应作为文本输入处理
    // 只有 ESC（取消）和 Enter（提交）是特殊按键
    if (showFeedbackInput) {
      // ESC - 取消反馈输入，返回选项列表
      if (key.escape) {
        cancelFeedbackInput();
        return;
      }

      // Enter - 提交反馈并执行拒绝操作
      if (key.return) {
        submitFeedbackAndDeny();
        return;
      }

      // Backspace - 删除光标前的字符
      if (key.backspace || key.delete) {
        if (feedbackCursor > 0) {
          setFeedbackText((prev) => prev.slice(0, feedbackCursor - 1) + prev.slice(feedbackCursor));
          setFeedbackCursor((prev) => prev - 1);
        }
        return;
      }

      // 左方向键 - 光标左移
      if (key.leftArrow) {
        setFeedbackCursor((prev) => Math.max(0, prev - 1));
        return;
      }

      // 右方向键 - 光标右移
      if (key.rightArrow) {
        setFeedbackCursor((prev) => Math.min(feedbackText.length, prev + 1));
        return;
      }

      // Ctrl+A - 光标移到开头
      if (key.ctrl && input === 'a') {
        setFeedbackCursor(0);
        return;
      }

      // Ctrl+E - 光标移到结尾
      if (key.ctrl && input === 'e') {
        setFeedbackCursor(feedbackText.length);
        return;
      }

      // Ctrl+U - 清除光标前的所有文本
      if (key.ctrl && input === 'u') {
        setFeedbackText((prev) => prev.slice(feedbackCursor));
        setFeedbackCursor(0);
        return;
      }

      // Ctrl+K - 清除光标后的所有文本
      if (key.ctrl && input === 'k') {
        setFeedbackText((prev) => prev.slice(0, feedbackCursor));
        return;
      }

      // 普通字符输入（包括 'n', 'y' 等所有字符）
      // 这是关键修复：在反馈面板中，任何字符都应该作为普通文本输入
      if (input && !key.ctrl && !key.meta && !key.upArrow && !key.downArrow) {
        setFeedbackText((prev) => prev.slice(0, feedbackCursor) + input + prev.slice(feedbackCursor));
        setFeedbackCursor((prev) => prev + input.length);
        return;
      }

      // 其他按键在反馈模式下忽略
      return;
    }

    // ===== 以下是非反馈模式（正常选项列表）的处理逻辑 =====

    // 检测 Shift+Tab (转义序列 \x1b[Z 或 key.tab && key.shift)
    if (key.tab && key.shift) {
      handleShiftTab();
      return;
    }

    // 备用检测：某些终端发送 \x1b[Z 作为 Shift+Tab
    if (input === '\x1b[Z') {
      handleShiftTab();
      return;
    }

    if (key.upArrow || key.leftArrow) {
      setSelected((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.downArrow || key.rightArrow) {
      setSelected((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const option = options[selected];
      // v2.1.6: 如果选中的是拒绝选项，显示反馈面板
      if (!option.allowed && option.scope === 'once') {
        setShowFeedbackInput(true);
        return;
      }
      onDecision({
        allowed: option.allowed,
        scope: option.scope,
        remember: option.scope === 'always' || option.scope === 'never',
      });
    } else {
      // 快捷键（支持全角字符输入）
      const option = options.find((o) => o.key === normalizedInput || o.key.toLowerCase() === normalizedInput);
      if (option) {
        // v2.1.6: 如果按 'n' 键拒绝，显示反馈面板而不是直接拒绝
        if (!option.allowed && option.key.toLowerCase() === 'n' && option.scope === 'once') {
          setShowFeedbackInput(true);
          return;
        }
        onDecision({
          allowed: option.allowed,
          scope: option.scope,
          remember: option.scope === 'always' || option.scope === 'never',
        });
      }
    }
  });

  // 判断是否为危险操作
  const isDangerous = useMemo(() => {
    if (type === 'file_delete') return true;
    if (type === 'bash_command' && resource) {
      const dangerousCommands = ['rm', 'sudo', 'chmod', 'chown', 'mv', 'dd', 'mkfs', 'fdisk'];
      return dangerousCommands.some((cmd) => resource.trim().startsWith(cmd));
    }
    if (type === 'system_config') return true;
    // v2.1.28: 管理员权限命令总是显示为危险操作
    if (type === 'elevated_command') return true;
    return false;
  }, [type, resource]);

  // v2.1.28: 判断是否为管理员权限请求
  const isElevated = type === 'elevated_command';

  // 格式化资源显示
  const formatResource = () => {
    if (!resource) return null;

    const maxLength = 80;
    let displayResource = resource;
    let label = t('permission.resource.default');

    switch (type) {
      case 'file_read':
      case 'file_write':
      case 'file_delete':
        label = t('permission.resource.file');
        // 显示相对路径（如果可能）
        try {
          const cwd = process.cwd();
          if (resource.startsWith(cwd)) {
            displayResource = './' + path.relative(cwd, resource);
          }
        } catch {
          // 保持原路径
        }
        break;
      case 'bash_command':
        label = t('permission.resource.command');
        break;
      case 'network_request':
        label = t('permission.resource.url');
        break;
      case 'mcp_server':
        label = t('permission.resource.server');
        break;
    }

    // 截断过长的资源名
    if (displayResource.length > maxLength) {
      displayResource = '...' + displayResource.slice(-(maxLength - 3));
    }

    return (
      <Box marginTop={1}>
        <Text color="gray">{label}: </Text>
        <Text color="cyan" bold>
          {displayResource}
        </Text>
      </Box>
    );
  };

  // 显示额外详细信息
  const renderDetails = () => {
    if (!details || Object.keys(details).length === 0) return null;

    return (
      <Box marginTop={1} flexDirection="column">
        {Object.entries(details).map(([key, value]) => (
          <Box key={key}>
            <Text color="gray">
              {key}: <Text color="white">{String(value)}</Text>
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

  // 获取权限类型图标和颜色
  const getTypeDisplay = () => {
    const displays: Record<PermissionType, { icon: string; color: string; label: string }> = {
      file_read: { icon: '📖', color: 'cyan', label: t('permission.type.fileRead') },
      file_write: { icon: '✏️ ', color: 'yellow', label: t('permission.type.fileWrite') },
      file_delete: { icon: '🗑️ ', color: 'red', label: t('permission.type.fileDelete') },
      bash_command: { icon: '⚡', color: 'magenta', label: t('permission.type.bashCommand') },
      network_request: { icon: '🌐', color: 'blue', label: t('permission.type.networkRequest') },
      mcp_server: { icon: '🔌', color: 'green', label: t('permission.type.mcpServer') },
      plugin_install: { icon: '📦', color: 'yellow', label: t('permission.type.pluginInstall') },
      system_config: { icon: '⚙️ ', color: 'red', label: t('permission.type.systemConfig') },
      elevated_command: { icon: '🔐', color: 'red', label: t('permission.type.elevatedCommand') },
    };

    return displays[type] || { icon: '🔧', color: 'white', label: t('permission.type.unknown') };
  };

  const typeDisplay = getTypeDisplay();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={isDangerous ? 'red' : 'yellow'}
      paddingX={2}
      paddingY={1}
    >
      {/* 标题行 */}
      <Box>
        <Text color={isDangerous ? 'red' : 'yellow'} bold>
          {isDangerous ? `⚠️  ${t('permission.titleDangerous')}` : `🔐 ${t('permission.title')}`}
        </Text>
      </Box>

      {/* 工具和类型 */}
      <Box marginTop={1}>
        <Text>{typeDisplay.icon} </Text>
        <Text bold color={typeDisplay.color}>
          {toolName}
        </Text>
        <Text color="gray"> ({typeDisplay.label})</Text>
      </Box>

      {/* 描述 */}
      <Box marginTop={1} marginLeft={2}>
        <Text>{description}</Text>
      </Box>

      {/* 资源 */}
      {formatResource()}

      {/* 额外详细信息 */}
      {renderDetails()}

      {/* 已记住的模式提示 */}
      {rememberedPatterns.length > 0 && (
        <Box marginTop={1}>
          <Text color="green" dimColor>
            ℹ  {t('permission.similarPatterns', { patterns: rememberedPatterns.join(', ') })}
          </Text>
        </Box>
      )}

      {/* 危险操作警告 */}
      {isDangerous && !isElevated && (
        <Box marginTop={1} paddingX={1} borderStyle="single" borderColor="red">
          <Text color="red" bold>
            ⚠️  {t('permission.warningDestructive')}
          </Text>
        </Box>
      )}

      {/* v2.1.28: 管理员权限提示 */}
      {isElevated && (
        <Box marginTop={1} paddingX={1} borderStyle="double" borderColor="yellow" flexDirection="column">
          <Text color="yellow" bold>
            🔐 {t('permission.elevated.title')}
          </Text>
          <Text color="gray">
            {process.platform === 'win32'
              ? t('permission.elevated.win32')
              : process.platform === 'darwin'
              ? t('permission.elevated.darwin')
              : t('permission.elevated.linux')}
          </Text>
        </Box>
      )}

      {/* 选项列表 - 当反馈面板显示时隐藏 */}
      {!showFeedbackInput && (
        <Box marginTop={2} flexDirection="column">
          {options.map((option, index) => {
            const isSelected = index === selected;

            return (
              <Box key={option.key} marginBottom={index < options.length - 1 ? 0 : 0}>
                <Text color={isSelected ? 'cyan' : 'gray'}>
                  {isSelected ? '❯ ' : '  '}
                </Text>
                <Text
                  color={isSelected ? 'cyan' : 'white'}
                  bold={isSelected}
                >
                  [{option.key}] {option.label}
                </Text>
                {isSelected && option.description && (
                  <Text color="gray" dimColor>
                    {' '}
                    - {option.description}
                  </Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* v2.1.6: 反馈面板 */}
      {showFeedbackInput && (
        <Box marginTop={2} flexDirection="column">
          <Box>
            <Text color="yellow" bold>
              {t('permission.feedbackPrompt')}
            </Text>
          </Box>
          <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
            {/* 反馈输入框 - 带光标显示 */}
            <Text>
              {feedbackText.slice(0, feedbackCursor)}
            </Text>
            <Text backgroundColor="gray" color="black">
              {feedbackText[feedbackCursor] || ' '}
            </Text>
            <Text>
              {feedbackText.slice(feedbackCursor + 1)}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {t('permission.feedbackHint')}
            </Text>
          </Box>
        </Box>
      )}

      {/* Footer 提示区域 - v2.1.0 改进：Tab hint 移到底部 */}
      {/* v2.1.6: 当反馈面板显示时隐藏 footer */}
      {!showFeedbackInput && (
        <Box marginTop={2} flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
          {/* 主操作提示 */}
          <Box justifyContent="space-between">
            <Text color="gray" dimColor>
              {t('permission.footerNav')}
            </Text>
            <Text color="cyan" dimColor>
              {t('permission.footerTab')}
            </Text>
          </Box>
          {/* Shift+Tab 快捷键提示 - 官方 v2.1.2 功能 */}
          <Box justifyContent="space-between">
            <Text color="gray" dimColor>
              {t('permission.footerShortcuts')}
            </Text>
            <Text color="cyan" dimColor>
              {t('permission.footerShiftTab')}
            </Text>
          </Box>
        </Box>
      )}

      {/* 当前快捷模式指示 */}
      {quickMode !== 'default' && (
        <Box marginTop={1}>
          <Text color="green" bold>
            {quickMode === 'acceptEdits' ? `✓ ${t('permission.autoAcceptEdits')}` : `✓ ${t('permission.planMode')}`}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PermissionPrompt;
