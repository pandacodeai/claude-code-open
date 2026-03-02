import React from 'react';
import { PluginsPanel } from '../../components/PluginsPanel';
import styles from './SkillsPanel.module.css';

interface SkillsPanelProps {
  onSendMessage?: (message: any) => void;
  addMessageHandler?: (handler: (msg: any) => void) => () => void;
}

/**
 * SkillsPanel - 技能 & 插件管理（CustomizePage 版）
 * 
 * 直接复用 PluginsPanel 组件（包含 Skills / Plugins / Discover / Marketplaces / Errors 五个子标签），
 * 让其完整功能在自定义页面的内容区中展示。
 */
export default function SkillsPanel({
  onSendMessage,
  addMessageHandler,
}: SkillsPanelProps) {
  return (
    <div className={styles.skillsPanel}>
      <PluginsPanel
        onSendMessage={onSendMessage}
        addMessageHandler={addMessageHandler}
      />
    </div>
  );
}
