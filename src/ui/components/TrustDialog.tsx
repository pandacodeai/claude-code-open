/**
 * Trust Dialog Component
 * 信任对话框组件 - 询问用户是否信任当前工作目录
 *
 * 修复官方 v2.1.3 bug:
 * 当从 home 目录运行时接受信任对话框后，
 * hooks 等需要信任的功能应该立即生效
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { trustManager, type TrustState } from '../../trust/index.js';
import { t } from '../../i18n/index.js';

/**
 * 信任对话框变体配置
 */
interface TrustDialogVariant {
  title: string;
  bodyText: string;
  showDetailedPermissions: boolean;
  learnMoreText: string;
  yesButtonLabel: string;
  noButtonLabel: string;
}

/**
 * 信任对话框变体
 * 与官方 Axon 一致
 */
function getTrustDialogVariants(): Record<string, TrustDialogVariant> {
  return {
    default: {
      title: t('trust.default.title'),
      bodyText: t('trust.default.body'),
      showDetailedPermissions: false,
      learnMoreText: t('trust.default.learnMore'),
      yesButtonLabel: t('trust.default.yes'),
      noButtonLabel: t('trust.default.no'),
    },
    normalize_action: {
      title: t('trust.normalize.title'),
      bodyText: t('trust.normalize.body'),
      showDetailedPermissions: false,
      learnMoreText: t('trust.normalize.learnMore'),
      yesButtonLabel: t('trust.normalize.yes'),
      noButtonLabel: t('trust.normalize.no'),
    },
    explicit: {
      title: t('trust.explicit.title'),
      bodyText: t('trust.explicit.body'),
      showDetailedPermissions: false,
      learnMoreText: t('trust.explicit.learnMore'),
      yesButtonLabel: t('trust.explicit.yes'),
      noButtonLabel: t('trust.explicit.no'),
    },
  };
}

export interface TrustDialogProps {
  /** 要信任的目录 */
  directory: string;
  /** 用户接受时的回调 */
  onAccept: () => void;
  /** 用户拒绝时的回调 */
  onReject: () => void;
  /** 是否是 home 目录 */
  isHomeDirectory?: boolean;
  /** 对话框变体（可选，默认根据目录自动选择） */
  variant?: 'default' | 'normalize_action' | 'explicit';
}

export const TrustDialog: React.FC<TrustDialogProps> = ({
  directory,
  onAccept,
  onReject,
  isHomeDirectory,
  variant: forcedVariant,
}) => {
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no'>('yes');
  const [isProcessing, setIsProcessing] = useState(false);

  // 确定对话框变体
  const variant = forcedVariant || trustManager.getTrustDialogVariant(directory);
  const variants = getTrustDialogVariants();
  const config = variants[variant] || variants.default;

  // 实际是否为 home 目录
  const actualIsHomeDirectory = isHomeDirectory ?? trustManager.isHomeDirectory(directory);

  // 处理键盘输入
  useInput(
    useCallback(
      (input, key) => {
        if (isProcessing) return;

        if (key.upArrow || key.downArrow || input === 'j' || input === 'k') {
          setSelectedOption((prev) => (prev === 'yes' ? 'no' : 'yes'));
        }

        if (key.return) {
          setIsProcessing(true);

          if (selectedOption === 'yes') {
            // 关键修复：使用 trustManager 来接受信任
            // 这会触发需要信任的功能（如 hooks）重新初始化
            trustManager
              .acceptTrustDialog(directory)
              .then(() => {
                onAccept();
              })
              .catch((error) => {
                console.error('[TrustDialog] Failed to accept trust:', error);
                setIsProcessing(false);
              });
          } else {
            trustManager
              .rejectTrustDialog(directory)
              .then(() => {
                onReject();
              })
              .catch((error) => {
                console.error('[TrustDialog] Failed to reject trust:', error);
                setIsProcessing(false);
              });
          }
        }

        // ESC 或 'q' 拒绝
        if (key.escape || input === 'q') {
          setIsProcessing(true);
          trustManager
            .rejectTrustDialog(directory)
            .then(() => {
              onReject();
            })
            .catch(() => {
              setIsProcessing(false);
            });
        }
      },
      [selectedOption, isProcessing, directory, onAccept, onReject]
    )
  );

  return (
    <Box flexDirection="column" padding={1}>
      {/* 标题 */}
      <Box marginBottom={1}>
        <Text bold color="yellow">
          {config.title}
        </Text>
      </Box>

      {/* 目录路径 */}
      <Box marginBottom={1}>
        <Text color="cyan">{directory}</Text>
        {actualIsHomeDirectory && (
          <Text color="yellow" dimColor>
            {' '}
            ({t('trust.homeDirectory')})
          </Text>
        )}
      </Box>

      {/* 正文 */}
      <Box marginBottom={1} flexDirection="column">
        {config.bodyText.split('\n').map((line, index) => (
          <Text key={index} dimColor>
            {line}
          </Text>
        ))}
      </Box>

      {/* Home 目录特殊警告 */}
      {actualIsHomeDirectory && (
        <Box marginBottom={1} borderStyle="single" borderColor="yellow" padding={1}>
          <Text color="yellow">
            {t('trust.homeWarning')}
          </Text>
        </Box>
      )}

      {/* 选项 */}
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text
            color={selectedOption === 'yes' ? 'green' : undefined}
            bold={selectedOption === 'yes'}
          >
            {selectedOption === 'yes' ? '> ' : '  '}
            {config.yesButtonLabel}
          </Text>
        </Box>
        <Box>
          <Text
            color={selectedOption === 'no' ? 'red' : undefined}
            bold={selectedOption === 'no'}
          >
            {selectedOption === 'no' ? '> ' : '  '}
            {config.noButtonLabel}
          </Text>
        </Box>
      </Box>

      {/* 帮助提示 */}
      <Box marginTop={1}>
        <Text dimColor>
          {t('trust.navHint')}
        </Text>
      </Box>

      {/* 处理中状态 */}
      {isProcessing && (
        <Box marginTop={1}>
          <Text color="blue">{t('trust.processing')}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * 信任对话框钩子
 * 用于在应用中管理信任对话框的显示状态
 */
export function useTrustDialog(directory: string) {
  const [showDialog, setShowDialog] = useState(false);
  const [trusted, setTrusted] = useState<boolean | null>(null);

  useEffect(() => {
    // 检查是否需要显示信任对话框
    if (trustManager.shouldShowTrustDialog(directory)) {
      setShowDialog(true);
      setTrusted(null);
    } else {
      setShowDialog(false);
      setTrusted(true);
    }
  }, [directory]);

  const handleAccept = useCallback(() => {
    setShowDialog(false);
    setTrusted(true);
  }, []);

  const handleReject = useCallback(() => {
    setShowDialog(false);
    setTrusted(false);
  }, []);

  return {
    showDialog,
    trusted,
    handleAccept,
    handleReject,
    TrustDialogComponent: showDialog ? (
      <TrustDialog
        directory={directory}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    ) : null,
  };
}

export default TrustDialog;
