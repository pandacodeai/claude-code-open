/**
 * StatusBar 组件
 * 底部状态栏 - 增强版
 *
 * 显示：模型、Token、费用、会话时长、上下文使用、网络状态、权限模式、Git 分支、工作目录
 */

import React from 'react';
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';

/**
 * PR 审核状态类型
 * 官方 2.1.20 新增
 */
export type PRReviewState = 'approved' | 'changes_requested' | 'pending' | 'draft' | null;

/**
 * PR 状态信息
 */
export interface PRStatusInfo {
  number: number | null;
  url: string | null;
  reviewState: PRReviewState;
}

interface StatusBarProps {
  // 基础信息
  messageCount: number;
  tokenCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: string;
  duration?: number;
  isProcessing?: boolean;

  // 模型信息
  model?: string;
  modelDisplayName?: string;

  // 上下文使用
  contextUsed?: number;
  contextMax?: number;
  contextPercentage?: number;

  // 网络状态
  networkStatus?: 'online' | 'offline' | 'error';
  lastApiCall?: number;

  // 权限模式
  permissionMode?: string;

  // Git 信息
  gitBranch?: string;

  // 工作目录
  cwd?: string;

  // PR 审核状态 (官方 2.1.20 新增)
  prStatus?: PRStatusInfo;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  messageCount,
  tokenCount,
  inputTokens,
  outputTokens,
  cost,
  duration,
  isProcessing,
  model,
  modelDisplayName,
  contextUsed,
  contextMax,
  contextPercentage,
  networkStatus = 'online',
  lastApiCall,
  permissionMode,
  gitBranch,
  cwd,
  prStatus,
}) => {
  // 格式化时长
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes < 60) return `${minutes}m ${seconds}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // 格式化 Token 数量
  const formatTokens = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 获取网络状态图标和颜色
  const getNetworkIndicator = (): { icon: string; color: string } => {
    switch (networkStatus) {
      case 'online':
        return { icon: '●', color: 'green' };
      case 'offline':
        return { icon: '●', color: 'gray' };
      case 'error':
        return { icon: '●', color: 'red' };
      default:
        return { icon: '●', color: 'gray' };
    }
  };

  // 获取上下文使用颜色
  const getContextColor = (percentage?: number): string => {
    if (!percentage) return 'white';
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  };

  // 格式化模型名称
  const getModelDisplay = (): string => {
    if (modelDisplayName) return modelDisplayName;
    if (!model) return 'claude-sonnet-4.5';

    // 简化模型名称
    if (model.includes('opus')) return 'opus-4.5';
    if (model.includes('sonnet')) return 'sonnet-4.5';
    if (model.includes('haiku')) return 'haiku-4.0';
    return model;
  };

  // 格式化工作目录（缩短路径）
  const formatCwd = (path?: string): string => {
    if (!path) return '';
    const home = process.env.HOME || process.env.USERPROFILE || '';
    if (home && path.startsWith(home)) {
      return `~${path.slice(home.length)}`;
    }
    // 如果路径太长，只显示最后两个部分
    const parts = path.split(/[/\\]/);
    if (parts.length > 3) {
      return `.../${parts.slice(-2).join('/')}`;
    }
    return path;
  };

  const networkIndicator = getNetworkIndicator();

  // 获取 PR 审核状态颜色 (官方 2.1.20)
  const getPRStatusColor = (state: PRReviewState): string => {
    switch (state) {
      case 'approved':
        return 'green';
      case 'changes_requested':
        return 'red';
      case 'pending':
        return 'yellow';
      case 'draft':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Box flexDirection="column">
      {/* 第一行：主要信息 */}
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        justifyContent="space-between"
      >
        <Box gap={2}>
          {/* 模型 */}
          <Text color="cyan" bold>
            {getModelDisplay()}
          </Text>

          {/* 消息数 */}
          <Text color="gray">
            <Text color="white">{messageCount}</Text> {t('status.msgs')}
          </Text>

          {/* Token 详情 */}
          {(inputTokens !== undefined || outputTokens !== undefined) && (
            <Text color="gray">
              <Text color="white">{formatTokens(inputTokens || 0)}</Text>
              <Text color="gray">/</Text>
              <Text color="white">{formatTokens(outputTokens || 0)}</Text>
              <Text color="gray"> {t('status.tokens')}</Text>
            </Text>
          )}

          {/* Token 总数（兼容旧版） */}
          {tokenCount !== undefined && inputTokens === undefined && (
            <Text color="gray">
              <Text color="white">{formatTokens(tokenCount)}</Text> {t('status.tokens')}
            </Text>
          )}

          {/* 费用 */}
          {cost && (
            <Text color="gray">
              <Text color="green">{cost}</Text>
            </Text>
          )}

          {/* 上下文使用百分比 */}
          {contextPercentage !== undefined && (
            <Text color="gray">
              ctx: <Text color={getContextColor(contextPercentage)}>
                {contextPercentage.toFixed(0)}%
              </Text>
            </Text>
          )}

          {/* 上下文详情（可选） */}
          {contextUsed !== undefined && contextMax !== undefined && (
            <Text color="gray" dimColor>
              ({formatTokens(contextUsed)}/{formatTokens(contextMax)})
            </Text>
          )}
        </Box>

        <Box gap={2}>
          {/* 处理状态 */}
          {isProcessing && (
            <Text color="yellow">⚙ {t('status.processing')}</Text>
          )}

          {/* 会话时长 */}
          {duration !== undefined && (
            <Text color="gray">
              <Text color="white">{formatDuration(duration)}</Text>
            </Text>
          )}

          {/* 网络状态 */}
          <Text color={networkIndicator.color}>
            {networkIndicator.icon}
          </Text>

          {/* 权限模式 */}
          {permissionMode && permissionMode !== 'default' && (
            <Text color="magenta">
              [{permissionMode}]
            </Text>
          )}
        </Box>
      </Box>

      {/* 第二行：环境信息（可选） */}
      {(gitBranch || cwd || prStatus?.reviewState) && (
        <Box paddingX={1} gap={2}>
          {/* Git 分支 */}
          {gitBranch && (
            <Text color="gray">
              <Text color="blue">⎇</Text> {gitBranch}
            </Text>
          )}

          {/* PR 审核状态 (官方 2.1.20) */}
          {prStatus?.reviewState && (
            <Text color="gray">
              <Text color={getPRStatusColor(prStatus.reviewState)}>●</Text>
              {' PR #'}{prStatus.number}
            </Text>
          )}

          {/* 工作目录 */}
          {cwd && (
            <Text color="gray">
              <Text color="cyan">📁</Text> {formatCwd(cwd)}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StatusBar;
