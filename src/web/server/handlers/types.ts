/**
 * WebSocket handler 共享类型和工具函数
 */

import { WebSocket } from 'ws';
import type { ServerMessage } from '../../shared/types.js';

export interface ClientConnection {
  id: string;
  ws: WebSocket;
  sessionId: string;
  model: string;
  isAlive: boolean;
  swarmSubscriptions: Set<string>;
  projectPath?: string;
  permissionMode?: string;
}

export interface WorkerAgent {
  id: string;
  taskId?: string;
  status: string;
  queenId?: string;
  tddCycle?: any;
  history?: any[];
}

export interface QueenAgent {
  id: string;
  blueprintId: string;
  taskTreeId: string;
  status: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  timestamp: Date;
  message: string;
  description?: string;
  data?: any;
}

export interface TaskNode {
  id: string;
  name: string;
  description: string;
  status: string;
  dependencies: string[];
  children?: TaskNode[];
  agentId?: string;
  codeArtifacts?: any[];
  createdAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface E2ETestState {
  status: string;
  message?: string;
  e2eTaskId: string;
  result?: any;
}

export interface LeadAgentPersistState {
  phase: string;
  stream: Array<
    | { type: 'text'; text: string }
    | { type: 'tool'; id: string; name: string; input?: any; result?: string; error?: string; status: 'running' | 'completed' | 'error' }
  >;
  events: Array<{ type: string; data: Record<string, unknown>; timestamp: string }>;
  systemPrompt?: string;
  lastUpdated: string;
}

export interface ContinuousDevOrchestrator {
  on: (event: string, handler: (...args: any[]) => void) => void;
  getState: () => { phase: string; message?: string };
  getProgress: () => any;
  pause: () => void;
  resume: () => void;
  processRequirement: (requirement: string) => Promise<{ success: boolean; error?: string }>;
  approveAndExecute: () => Promise<void>;
}

/**
 * 发送消息到客户端
 */
export function sendMessage(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    const sessionId = ('payload' in message ? (message.payload as any)?.sessionId : '') || '';
    console.warn(`[WebSocket] 消息被丢弃 (ws.readyState=${ws.readyState}): type=${message.type}, session=${sessionId}`);
  }
}
