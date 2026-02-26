/**
 * GenerateBlueprint 工具 - Chat Tab 主 Agent 专用
 *
 * v10.0: 将对话中收集的需求结构化为项目蓝图
 *
 * 设计理念：
 * - 主 Agent 通过自然对话收集需求后，调用此工具生成 Blueprint
 * - 工具注册到全局 ToolRegistry（提供 schema）
 * - 实际执行由 ConversationManager.executeTool() 拦截处理
 *   （同 Task/AskUserQuestion 模式）
 */

import { BaseTool } from './base.js';
import type { ToolResult, ToolDefinition } from '../types/index.js';

export interface GenerateBlueprintInput {
  name: string;
  description: string;
  requirements: string[];
  techStack?: {
    language?: string;
    framework?: string;
    database?: string;
    styling?: string;
    testing?: string;
    [key: string]: string | undefined;
  };
  constraints?: string[];
  brief: string;
  // 全景蓝图字段（Agent 扫描代码库后填充）
  modules?: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    rootPath?: string;
    responsibilities?: string[];
    dependencies?: string[];
  }>;
  businessProcesses?: Array<{
    id: string;
    name: string;
    type?: string;
    description: string;
    steps?: string[];
  }>;
  nfrs?: Array<{
    name: string;
    category: string;
    description: string;
  }>;
}

/**
 * GenerateBlueprint 工具
 * 主 Agent 专用，将对话需求结构化为项目蓝图
 */
export class GenerateBlueprintTool extends BaseTool<GenerateBlueprintInput, ToolResult> {
  name = 'GenerateBlueprint';
  description = `将对话中收集的需求或代码库分析结果结构化为项目蓝图

## 两种模式

### 模式1：需求蓝图（新项目）
用户描述需求后，填写 name/description/requirements/techStack/brief 生成蓝图。

### 模式2：全景蓝图（已有项目）
用户要求分析已有代码库时，先用 Glob/Grep/Read 探索项目结构，然后填写 modules/businessProcesses/nfrs 生成全景蓝图。

## 参数说明
- name: 项目名称
- description: 项目描述（1-3句话）
- requirements: 核心需求列表（需求蓝图用）
- techStack: 技术栈
- constraints: 约束条件（可选）
- brief: **最重要的参数** — 你对需求/项目的深度理解
- modules: 识别的系统模块（全景蓝图用）
- businessProcesses: 识别的业务流程（全景蓝图用）
- nfrs: 非功能需求（全景蓝图用）

## 注意
- 需求蓝图：在调用前确保已充分了解用户需求
- 全景蓝图：在调用前必须用工具充分探索代码库
- 生成后蓝图会保存，用户可在蓝图页面查看`;

  getInputSchema(): ToolDefinition['inputSchema'] {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '项目名称',
        },
        description: {
          type: 'string',
          description: '项目描述（1-3句话概括项目目标）',
        },
        requirements: {
          type: 'array',
          items: { type: 'string' },
          description: '核心需求列表（每条一个功能点）',
        },
        techStack: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            framework: { type: 'string' },
            database: { type: 'string' },
            styling: { type: 'string' },
            testing: { type: 'string' },
          },
          description: '技术栈选择',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: '约束条件（可选）',
        },
        brief: {
          type: 'string',
          description: '关键上下文简报：设计决策、用户偏好、排除项、技术选型理由等（传递给执行引擎）',
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', description: 'frontend|backend|service|database|infrastructure|shared|other' },
              description: { type: 'string' },
              rootPath: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
            },
            required: ['id', 'name', 'type', 'description'],
          },
          description: '全景蓝图用：识别的系统模块列表',
        },
        businessProcesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', description: 'core|support|management' },
              description: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
            },
            required: ['id', 'name', 'description'],
          },
          description: '全景蓝图用：识别的业务流程列表',
        },
        nfrs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', description: 'performance|security|reliability|scalability|maintainability|usability' },
              description: { type: 'string' },
            },
            required: ['name', 'category', 'description'],
          },
          description: '全景蓝图用：非功能需求列表',
        },
      },
      required: ['name', 'description', 'brief'],
    };
  }

  async execute(_input: GenerateBlueprintInput): Promise<ToolResult> {
    // 实际执行由 ConversationManager.executeTool() 拦截处理
    // 这里仅作为 fallback（CLI 模式或未被拦截时）
    return {
      success: false,
      output: 'GenerateBlueprint 工具需要通过 Web 聊天界面使用。请在 Chat Tab 中调用。',
    };
  }
}
