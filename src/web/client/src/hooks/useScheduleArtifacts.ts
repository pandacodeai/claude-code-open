import { useState, useMemo, useEffect, useRef } from 'react';
import type { ChatMessage, ToolResult } from '../types';

export type SchedulePhase = 'pending' | 'countdown' | 'executing' | 'done';

export interface ScheduleArtifact {
  id: string;
  taskName: string;
  toolUseId: string;
  messageId: string;
  timestamp: number;
  phase: SchedulePhase;
  triggerAt?: number;
  remainingMs?: number;
  prompt?: string;
  result?: ToolResult;
}

export function useScheduleArtifacts(messages: ChatMessage[]) {
  const artifacts = useMemo(() => {
    const result: ScheduleArtifact[] = [];

    for (const msg of messages) {
      for (const block of msg.content) {
        if (block.type !== 'tool_use') continue;

        const toolUse = block as any;
        if (toolUse.name !== 'ScheduleTask') continue;

        const input = toolUse.input as any;
        // 只提取 create 操作（list/cancel/watch 不算产物）
        if (input?.action && input.action !== 'create') continue;

        const countdown = toolUse.scheduleCountdown as {
          triggerAt: number;
          remainingMs: number;
          phase: 'countdown' | 'executing' | 'done';
          taskName: string;
        } | undefined;

        let phase: SchedulePhase = 'pending';
        if (countdown) {
          phase = countdown.phase;
        } else if (toolUse.status === 'completed' || toolUse.status === 'error') {
          phase = 'done';
        }

        result.push({
          id: `${msg.id}-${toolUse.id}`,
          taskName: countdown?.taskName || input?.name || 'Scheduled Task',
          toolUseId: toolUse.id,
          messageId: msg.id,
          timestamp: msg.timestamp,
          phase,
          triggerAt: countdown?.triggerAt,
          remainingMs: countdown?.remainingMs,
          prompt: input?.prompt,
          result: toolUse.result,
        });
      }
    }

    return result;
  }, [messages]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedArtifact = useMemo(
    () => artifacts.find(a => a.id === selectedId) || null,
    [artifacts, selectedId]
  );

  // 追踪数量变化，供外部判断是否自动打开面板
  const prevCountRef = useRef(artifacts.length);
  const [hasNew, setHasNew] = useState(false);
  useEffect(() => {
    if (artifacts.length > prevCountRef.current && artifacts.length > 0) {
      setHasNew(true);
    }
    prevCountRef.current = artifacts.length;
  }, [artifacts.length]);

  const clearHasNew = () => setHasNew(false);

  return {
    scheduleArtifacts: artifacts,
    selectedScheduleId: selectedId,
    setSelectedScheduleId: setSelectedId,
    selectedScheduleArtifact: selectedArtifact,
    hasNewScheduleArtifact: hasNew,
    clearHasNew,
  };
}
