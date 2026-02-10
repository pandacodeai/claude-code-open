/**
 * ShortcutHelp 组件
 * 显示键盘快捷键帮助
 */

import React from 'react';
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';

interface Shortcut {
  key: string;
  description: string;
  category?: string;
}

interface ShortcutHelpProps {
  isVisible: boolean;
  onClose: () => void;
}

const SHORTCUTS: Shortcut[] = [
  // 导航
  { key: '?', description: t('shortcut.showHelp'), category: t('shortcut.category.general') },
  { key: 'Ctrl+C', description: t('shortcut.cancel'), category: t('shortcut.category.general') },
  { key: 'Ctrl+L', description: t('shortcut.clearScreen'), category: t('shortcut.category.general') },
  { key: 'Escape', description: t('shortcut.goBack'), category: t('shortcut.category.general') },

  // 输入
  { key: 'Enter', description: t('shortcut.submit'), category: t('shortcut.category.input') },
  { key: '↑/↓', description: t('shortcut.navigateHistory'), category: t('shortcut.category.input') },
  { key: 'Tab', description: t('shortcut.autocomplete'), category: t('shortcut.category.input') },
  { key: 'Ctrl+G', description: t('shortcut.externalEditor'), category: t('shortcut.category.input') },

  // 模型
  { key: 'Alt+P', description: t('shortcut.switchModel'), category: t('shortcut.category.model') },
  { key: 'Ctrl+M', description: t('shortcut.switchModelAlt'), category: t('shortcut.category.model') },

  // 任务管理
  { key: 'Ctrl+B', description: t('shortcut.backgroundTask'), category: t('shortcut.category.tasks') },
  { key: 'Ctrl+T', description: t('shortcut.toggleTodos'), category: t('shortcut.category.tasks') },

  // 命令
  { key: '/help', description: t('shortcut.showCommands'), category: t('shortcut.category.commands') },
  { key: '/clear', description: t('shortcut.clearConversation'), category: t('shortcut.category.commands') },
  { key: '/compact', description: t('shortcut.compactHistory'), category: t('shortcut.category.commands') },
  { key: '/model', description: t('shortcut.switchModelCmd'), category: t('shortcut.category.commands') },
  { key: '/status', description: t('shortcut.showStatus'), category: t('shortcut.category.commands') },
  { key: '/doctor', description: t('shortcut.runDiagnostics'), category: t('shortcut.category.commands') },
];

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color="cyan" bold>
          ⌨️  {t('shortcut.title')}
        </Text>
        <Text color="gray" dimColor>
          {t('shortcut.closeHint')}
        </Text>
      </Box>

      <Box height={1}>
        <Text color="cyan">{'─'.repeat(50)}</Text>
      </Box>

      {categories.map((category) => (
        <Box key={category} flexDirection="column" marginTop={1}>
          <Text color="yellow" bold>
            {category}
          </Text>
          {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
            <Box key={shortcut.key} marginLeft={2}>
              <Box width={15}>
                <Text color="green" bold>
                  {shortcut.key}
                </Text>
              </Box>
              <Text color="gray">{shortcut.description}</Text>
            </Box>
          ))}
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {t('shortcut.tip')}
        </Text>
      </Box>
    </Box>
  );
};

export default ShortcutHelp;
