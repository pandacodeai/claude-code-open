/**
 * ErrorBoundary 组件
 * 捕获 React 渲染错误，防止白屏
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `: ${this.props.name}` : ''}] Uncaught error:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#e0e0e0',
          backgroundColor: '#1a1a2e',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {'\u26A0\uFE0F'}
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
            {this.props.name ? `${this.props.name} ` : ''}
            {'\u53D1\u751F\u4E86\u9519\u8BEF'}
          </h2>
          <p style={{ margin: '0 0 24px', color: '#888', fontSize: '14px', maxWidth: '500px', textAlign: 'center' }}>
            {this.state.error?.message || '\u672A\u77E5\u9519\u8BEF'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: '#2a2a3e',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {'\u91CD\u8BD5'}
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#4a6cf7',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {'\u91CD\u65B0\u52A0\u8F7D\u9875\u9762'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
