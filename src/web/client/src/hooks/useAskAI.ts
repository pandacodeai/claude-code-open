/**
 * useAskAI Hook
 * 
 * 从 BlueprintDetailContent.tsx 提取的选中即问 AI 逻辑
 * 提供代码片段选中并提问 AI 的功能
 */

import { useState, useCallback } from 'react';
import type * as Monaco from 'monaco-editor';
import { aiAskApi } from '../api/ai-editor';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Hook 配置选项
 */
export interface UseAskAIOptions {
  /** 当前文件路径 */
  filePath: string | null;
  /** Monaco Editor 实例引用 */
  editorRef: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>;
}

/**
 * Ask AI 状态
 */
export interface AskAIState {
  /** 对话框是否可见 */
  visible: boolean;
  /** 选中的代码片段 */
  selectedCode: string;
  /** 选中的行范围 */
  selectedRange: { startLine: number; endLine: number } | null;
  /** 用户输入的问题 */
  question: string;
  /** AI 返回的答案 */
  answer: string | null;
  /** 是否正在加载 */
  loading: boolean;
}

/**
 * Hook 返回值
 */
export interface UseAskAIReturn {
  /** Ask AI 状态 */
  askAIState: AskAIState;
  /** 打开 Ask AI 对话框（获取选中文本） */
  openAskAI: () => void;
  /** 提交问题 */
  submitQuestion: (question: string) => Promise<void>;
  /** 关闭对话框 */
  closeAskAI: () => void;
  /** 设置问题 */
  setQuestion: (question: string) => void;
}

// ============================================================================
// Hook 实现
// ============================================================================

/**
 * useAskAI Hook
 * 
 * 提供选中代码片段并向 AI 提问的功能
 */
export function useAskAI(options: UseAskAIOptions): UseAskAIReturn {
  const { filePath, editorRef } = options;

  // Ask AI 状态
  const [askAIState, setAskAIState] = useState<AskAIState>({
    visible: false,
    selectedCode: '',
    selectedRange: null,
    question: '',
    answer: null,
    loading: false,
  });

  /**
   * 打开 Ask AI 对话框
   * 获取编辑器当前选中的文本
   */
  const openAskAI = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;

    const selectedText = model.getValueInRange(selection);
    if (!selectedText.trim()) return;

    setAskAIState({
      visible: true,
      selectedCode: selectedText,
      selectedRange: {
        startLine: selection.startLineNumber,
        endLine: selection.endLineNumber,
      },
      question: '',
      answer: null,
      loading: false,
    });
  }, [editorRef]);

  /**
   * 提交问题到 AI
   */
  const submitQuestion = useCallback(async (question: string) => {
    if (!question.trim() || !askAIState.selectedCode) return;

    setAskAIState(prev => ({ ...prev, loading: true, answer: null }));

    try {
      // 从文件路径提取语言
      const language = filePath?.split('.').pop() || 'typescript';

      // 调用后端 AI 接口
      const response = await aiAskApi.ask({
        code: askAIState.selectedCode,
        question: question,
        filePath: filePath || undefined,
        context: {
          language,
        },
      });

      if (response.success && response.answer) {
        setAskAIState(prev => ({
          ...prev,
          answer: response.answer!,
          loading: false,
        }));
      } else {
        setAskAIState(prev => ({
          ...prev,
          answer: `❌ AI 服务暂时不可用: ${response.error || '请稍后重试'}`,
          loading: false,
        }));
      }
    } catch (err: any) {
      setAskAIState(prev => ({
        ...prev,
        answer: `❌ 网络错误: ${err.message || '无法连接到 AI 服务'}`,
        loading: false,
      }));
    }
  }, [askAIState.selectedCode, filePath]);

  /**
   * 关闭 Ask AI 对话框
   */
  const closeAskAI = useCallback(() => {
    setAskAIState({
      visible: false,
      selectedCode: '',
      selectedRange: null,
      question: '',
      answer: null,
      loading: false,
    });
  }, []);

  /**
   * 设置问题
   */
  const setQuestion = useCallback((question: string) => {
    setAskAIState(prev => ({ ...prev, question }));
  }, []);

  return {
    askAIState,
    openAskAI,
    submitQuestion,
    closeAskAI,
    setQuestion,
  };
}
