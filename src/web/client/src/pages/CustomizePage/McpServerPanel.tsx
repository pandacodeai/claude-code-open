import React from 'react';
import { McpPanel } from '../../components/McpPanel';
import styles from './McpServerPanel.module.css';

interface McpServerPanelProps {
  onSendMessage?: (message: any) => void;
  addMessageHandler?: (handler: (msg: any) => void) => () => void;
}

/**
 * McpServerPanel - MCP 服务器管理（CustomizePage 版）
 * 
 * 直接复用 McpPanel 组件（包含服务器列表/详情/工具/添加等完整功能），
 * 让其在自定义页面的内容区中展示。
 */
export default function McpServerPanel({
  onSendMessage,
  addMessageHandler,
}: McpServerPanelProps) {
  return (
    <div className={styles.mcpServerPanel}>
      <McpPanel
        onSendMessage={onSendMessage}
        addMessageHandler={addMessageHandler}
      />
    </div>
  );
}
