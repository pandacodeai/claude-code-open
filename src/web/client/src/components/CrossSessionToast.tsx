/**
 * CrossSessionToast - 跨会话通知
 * 当其他会话有权限请求或用户问题等待时，在右下角弹出通知
 * 点击后自动切换到对应会话
 */

import './CrossSessionToast.css';
import type { CrossSessionNotification } from '../hooks/useMessageHandler';

interface CrossSessionToastProps {
  notification: CrossSessionNotification;
  sessionName?: string;
  onSwitch: (sessionId: string) => void;
  onDismiss: () => void;
}

export function CrossSessionToast({ notification, sessionName, onSwitch, onDismiss }: CrossSessionToastProps) {
  const isPermission = notification.type === 'permission_request';
  const title = isPermission ? '权限确认等待中' : '需要回答问题';
  const detail = isPermission
    ? `工具 ${notification.toolName || '未知'} 请求权限`
    : notification.questionHeader || '有问题需要回答';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSwitch(notification.sessionId);
    onDismiss();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  return (
    <div className="cross-session-toast cross-session-toast-pulse" onClick={handleClick}>
      <div className="cross-session-toast-icon">
        {isPermission ? '\u26A0' : '\u2753'}
      </div>
      <div className="cross-session-toast-body">
        <div className="cross-session-toast-title">{title}</div>
        <div className="cross-session-toast-detail">
          {sessionName ? `${sessionName}: ` : ''}{detail}
        </div>
        <div className="cross-session-toast-action">
          点击切换到该会话
        </div>
      </div>
      <button className="cross-session-toast-close" onClick={handleClose} title="关闭">
        &times;
      </button>
    </div>
  );
}
