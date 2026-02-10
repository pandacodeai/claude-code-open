/**
 * UpdateNotification 组件
 * 显示自动更新状态和通知
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { updateManager } from '../../updater/index.js';
import { t } from '../../i18n/index.js';

interface UpdateNotificationProps {
  checkOnMount?: boolean;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  checkOnMount = true,
}) => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'error'>('idle');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!checkOnMount) return;

    const handleChecking = () => {
      setUpdateStatus('checking');
      setIsVisible(true);
    };

    const handleAvailable = (info: { currentVersion: string; latestVersion: string }) => {
      setUpdateStatus('available');
      setLatestVersion(info.latestVersion);
      setIsVisible(true);
    };

    const handleNotAvailable = () => {
      setUpdateStatus('idle');
      setIsVisible(false);
    };

    const handleError = (err: Error) => {
      setUpdateStatus('error');
      setError(err.message);
      // Don't show error for update check failures - it's not critical
      setTimeout(() => setIsVisible(false), 3000);
    };

    // Listen for update events
    updateManager.on('checking', handleChecking);
    updateManager.on('update-available', handleAvailable);
    updateManager.on('update-not-available', handleNotAvailable);
    updateManager.on('error', handleError);

    // Check for updates
    updateManager.checkForUpdates().catch(() => {});

    return () => {
      updateManager.off('checking', handleChecking);
      updateManager.off('update-available', handleAvailable);
      updateManager.off('update-not-available', handleNotAvailable);
      updateManager.off('error', handleError);
    };
  }, [checkOnMount]);

  if (!isVisible) return null;

  return (
    <Box flexDirection="column" marginY={1}>
      {updateStatus === 'checking' && (
        <Box>
          <Text color="gray" dimColor>
            {t('update.checking')}
          </Text>
        </Box>
      )}

      {updateStatus === 'available' && latestVersion && (
        <Box
          borderStyle="round"
          borderColor="green"
          paddingX={2}
          paddingY={1}
        >
          <Box flexDirection="column">
            <Text color="green" bold>
              🎉 {t('update.available')}
            </Text>
            <Text color="gray">
              {t('update.newVersion', { version: latestVersion })}
            </Text>
            <Text color="gray" dimColor>
              {t('update.runCommand')}
            </Text>
          </Box>
        </Box>
      )}

      {updateStatus === 'error' && error && (
        <Box>
          <Text color="yellow" dimColor>
            {t('update.checkFailed', { error })}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default UpdateNotification;
