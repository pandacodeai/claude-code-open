import { useState, useMemo, useEffect, useRef } from 'react';
import type { ChatMessage, ToolStatus } from '../types';

export interface FileArtifact {
  id: string;
  filePath: string;
  toolName: 'Edit' | 'Write' | 'MultiEdit';
  timestamp: number;
  messageId: string;
  toolUseId: string;
  status: ToolStatus;
  oldString?: string;
  newString?: string;
  content?: string;
}

export interface ArtifactGroup {
  filePath: string;
  artifacts: FileArtifact[];
  latestTimestamp: number;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function useArtifacts(messages: ChatMessage[]) {
  const artifacts = useMemo(() => {
    const result: FileArtifact[] = [];

    for (const msg of messages) {
      for (const block of msg.content) {
        if (block.type !== 'tool_use') continue;

        const toolUse = block as any;
        const input = toolUse.input as any;

        if (toolUse.name === 'Edit' && input?.file_path) {
          result.push({
            id: `${msg.id}-${toolUse.id}`,
            filePath: normalizePath(input.file_path),
            toolName: 'Edit',
            timestamp: msg.timestamp,
            messageId: msg.id,
            toolUseId: toolUse.id,
            status: toolUse.status,
            oldString: input.old_string,
            newString: input.new_string,
          });
        } else if (toolUse.name === 'Write' && input?.file_path) {
          result.push({
            id: `${msg.id}-${toolUse.id}`,
            filePath: normalizePath(input.file_path),
            toolName: 'Write',
            timestamp: msg.timestamp,
            messageId: msg.id,
            toolUseId: toolUse.id,
            status: toolUse.status,
            content: input.content,
          });
        } else if (toolUse.name === 'MultiEdit' && input?.file_path) {
          result.push({
            id: `${msg.id}-${toolUse.id}`,
            filePath: normalizePath(input.file_path),
            toolName: 'MultiEdit',
            timestamp: msg.timestamp,
            messageId: msg.id,
            toolUseId: toolUse.id,
            status: toolUse.status,
          });
        }

        // 递归扫描 Task 工具的 subagentToolCalls
        if (toolUse.name === 'Task' && toolUse.subagentToolCalls) {
          for (const sub of toolUse.subagentToolCalls) {
            const subInput = sub.input as any;
            if (!subInput?.file_path) continue;

            if (sub.name === 'Edit') {
              result.push({
                id: `${msg.id}-${sub.id}`,
                filePath: normalizePath(subInput.file_path),
                toolName: 'Edit',
                timestamp: sub.startTime || msg.timestamp,
                messageId: msg.id,
                toolUseId: sub.id,
                status: sub.status === 'running' ? 'running' : sub.status === 'error' ? 'error' : 'completed',
                oldString: subInput.old_string,
                newString: subInput.new_string,
              });
            } else if (sub.name === 'Write') {
              result.push({
                id: `${msg.id}-${sub.id}`,
                filePath: normalizePath(subInput.file_path),
                toolName: 'Write',
                timestamp: sub.startTime || msg.timestamp,
                messageId: msg.id,
                toolUseId: sub.id,
                status: sub.status === 'running' ? 'running' : sub.status === 'error' ? 'error' : 'completed',
                content: subInput.content,
              });
            }
          }
        }
      }
    }

    return result;
  }, [messages]);

  // 按文件路径分组
  const groups = useMemo(() => {
    const map = new Map<string, ArtifactGroup>();
    for (const a of artifacts) {
      const existing = map.get(a.filePath);
      if (existing) {
        existing.artifacts.push(a);
        existing.latestTimestamp = Math.max(existing.latestTimestamp, a.timestamp);
      } else {
        map.set(a.filePath, {
          filePath: a.filePath,
          artifacts: [a],
          latestTimestamp: a.timestamp,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [artifacts]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // 新产物出现时自动打开面板
  const prevCountRef = useRef(artifacts.length);
  useEffect(() => {
    if (artifacts.length > prevCountRef.current && artifacts.length > 0) {
      setIsPanelOpen(true);
    }
    prevCountRef.current = artifacts.length;
  }, [artifacts.length]);

  const selectedArtifact = useMemo(
    () => artifacts.find(a => a.id === selectedId) || null,
    [artifacts, selectedId]
  );

  return {
    artifacts,
    groups,
    selectedId,
    setSelectedId,
    selectedArtifact,
    isPanelOpen,
    setIsPanelOpen,
  };
}
