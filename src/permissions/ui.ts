/**
 * 权限 UI 完善
 * 提供完整的权限交互式界面系统
 *
 * 功能：
 * - 交互式权限提示（Ink-based UI）
 * - 权限历史查看
 * - 批量权限操作
 * - 权限状态可视化
 * - 格式化和美化工具
 */

import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import type {
  PermissionRequest,
  PermissionDecision,
  PermissionType,
  PermissionConfig,
} from './index.js';

// ============ 类型定义 ============

/**
 * 权限提示选项
 */
export interface PermissionPromptOptions {
  tool: string;
  action: string;
  details?: string;
  resource?: string;
  timeout?: number;
  defaultAction?: 'allow' | 'deny';
}

/**
 * 权限响应
 */
export interface PermissionResponse {
  allowed: boolean;
  remember?: boolean;
  scope?: 'once' | 'session' | 'always';
  timedOut?: boolean;
  /** v2.1.7: 用户在接受权限提示时提供的可选反馈 */
  feedback?: string;
}

/**
 * 工具权限信息
 */
export interface ToolPermission {
  tool: string;
  type: PermissionType;
  allowed: boolean;
  scope: 'once' | 'session' | 'always';
  pattern?: string;
  timestamp: number;
}

/**
 * 权限历史条目
 */
export interface PermissionHistoryEntry {
  timestamp: string;
  type: PermissionType;
  tool: string;
  resource?: string;
  decision: 'allow' | 'deny';
  scope?: 'once' | 'session' | 'always';
  reason?: string;
  user: boolean;
  /** v2.1.7: 用户在接受权限提示时提供的可选反馈 */
  feedback?: string;
  /** v2.1.7: 是否包含反馈 */
  hasFeedback?: boolean;
}

/**
 * 快捷操作
 */
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  action: () => void;
  dangerous?: boolean;
}

/**
 * 权限状态
 */
export interface PermissionStatus {
  mode: string;
  totalRemembered: number;
  sessionPermissions: number;
  alwaysPermissions: number;
  deniedPermissions: number;
  auditEnabled: boolean;
}

// ============ 权限 UI 类 ============

/**
 * 权限 UI 管理器
 * 提供完整的权限交互式用户界面
 */
export class PermissionUI {
  private configDir: string;
  private auditLogPath: string;

  constructor(configDir?: string) {
    this.configDir = configDir ||
      process.env.AXON_CONFIG_DIR ||
      path.join(process.env.HOME || '~', '.axon');
    this.auditLogPath = path.join(this.configDir, 'permissions-audit.log');
  }

  /**
   * 交互式权限提示
   * 使用 Ink UI 组件显示权限请求
   */
  async promptUser(options: PermissionPromptOptions): Promise<PermissionResponse> {
    const { tool, action, details, resource, timeout, defaultAction } = options;

    // 构造权限请求
    const request: PermissionRequest = {
      type: this.inferPermissionType(action),
      tool,
      description: details || action,
      resource,
    };

    // 如果设置了超时，使用 Promise.race
    if (timeout && timeout > 0) {
      const timeoutPromise = new Promise<PermissionResponse>((resolve) => {
        setTimeout(() => {
          resolve({
            allowed: defaultAction === 'allow',
            timedOut: true,
            scope: 'once',
          });
        }, timeout);
      });

      const promptPromise = this.showPermissionPrompt(request);

      return Promise.race([promptPromise, timeoutPromise]);
    }

    return this.showPermissionPrompt(request);
  }

  /**
   * 显示权限提示 UI
   * 使用纯终端界面（chalk + readline）
   */
  private async showPermissionPrompt(request: PermissionRequest): Promise<PermissionResponse> {
    // 显示权限请求信息
    this.printPermissionRequest(request);

    // 获取用户输入
    return this.getUserDecision(request);
  }

  /**
   * 打印权限请求信息
   */
  private printPermissionRequest(request: PermissionRequest): void {
    const isDangerous = this.isDangerousOperation(request);
    const borderColor = isDangerous ? 'red' : 'yellow';

    console.log();
    console.log(chalk[borderColor].bold('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
    console.log(chalk[borderColor].bold('┃       🔐 Permission Required                ┃'));
    console.log(chalk[borderColor].bold('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));

    // 工具和类型
    const icon = this.getPermissionIcon(request.type);
    console.log();
    console.log(`  ${icon}  ${chalk.cyan.bold(this.formatToolName(request.tool))} ${chalk.gray(`(${request.type})`)}`);

    // 描述
    console.log();
    console.log(`  ${chalk.white(request.description)}`);

    // 资源
    if (request.resource) {
      const label = this.getResourceLabel(request.type);
      const resource = this.formatResourcePath(request.resource);
      console.log();
      console.log(`  ${chalk.gray(label + ':')} ${chalk.cyan(resource)}`);
    }

    // 危险操作警告
    if (isDangerous) {
      console.log();
      console.log(chalk.red.bold('  ⚠️  WARNING: This operation could be destructive!'));
    }

    console.log();
  }

  /**
   * 获取用户决策
   * v2.1.7: 添加反馈收集功能
   */
  private async getUserDecision(request: PermissionRequest): Promise<PermissionResponse> {
    const readline = await import('readline');

    console.log(chalk.white('  Choose an option:'));
    console.log(`    ${chalk.cyan('[y]')} Yes, allow once`);
    console.log(`    ${chalk.red('[n]')} No, deny`);
    console.log(`    ${chalk.yellow('[s]')} Allow for this session`);
    console.log(`    ${chalk.green('[A]')} Always allow (remember)`);
    console.log(`    ${chalk.red('[N]')} Never allow (remember)`);
    console.log(`    ${chalk.magenta('[f]')} Yes, allow once with feedback`);
    console.log();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(chalk.white('  Your choice: '), (answer) => {
        const choice = answer.trim().toLowerCase();

        // v2.1.7: 处理带反馈的选项
        if (choice === 'f') {
          rl.question(chalk.white('  Enter feedback (optional): '), (feedbackInput) => {
            rl.close();
            const feedback = feedbackInput.trim() || undefined;
            console.log();
            resolve({ allowed: true, scope: 'once', remember: false, feedback });
          });
          return;
        }

        rl.close();

        let response: PermissionResponse;

        switch (choice) {
          case 'y':
            response = { allowed: true, scope: 'once', remember: false };
            break;
          case 's':
            response = { allowed: true, scope: 'session', remember: true };
            break;
          case 'a':
            response = { allowed: true, scope: 'always', remember: true };
            break;
          case 'n':
            response = { allowed: false, scope: 'once', remember: false };
            break;
          case 'never':
            response = { allowed: false, scope: 'always', remember: true };
            break;
          default:
            // 默认拒绝
            response = { allowed: false, scope: 'once', remember: false };
            break;
        }

        console.log();
        resolve(response);
      });
    });
  }

  /**
   * 判断是否为危险操作
   */
  private isDangerousOperation(request: PermissionRequest): boolean {
    if (request.type === 'file_delete') return true;
    if (request.type === 'system_config') return true;

    if (request.type === 'bash_command' && request.resource) {
      const dangerousCommands = ['rm', 'sudo', 'chmod', 'chown', 'mv', 'dd', 'mkfs', 'fdisk', 'reboot', 'shutdown'];
      return dangerousCommands.some((cmd) => request.resource!.trim().startsWith(cmd));
    }

    return false;
  }

  /**
   * 获取资源标签
   */
  private getResourceLabel(type: PermissionType): string {
    const labels: Record<PermissionType, string> = {
      file_read: 'File',
      file_write: 'File',
      file_delete: 'File',
      bash_command: 'Command',
      network_request: 'URL',
      mcp_server: 'Server',
      plugin_install: 'Plugin',
      system_config: 'Config',
      elevated_command: 'Elevated',
    };
    return labels[type] || 'Resource';
  }

  /**
   * 格式化资源路径
   */
  private formatResourcePath(resource: string): string {
    const maxLength = 70;

    // 尝试显示相对路径
    try {
      const cwd = process.cwd();
      if (resource.startsWith(cwd)) {
        resource = './' + path.relative(cwd, resource);
      }
    } catch {
      // 保持原路径
    }

    // 截断过长的路径
    if (resource.length > maxLength) {
      return '...' + resource.slice(-(maxLength - 3));
    }

    return resource;
  }

  /**
   * 显示权限状态
   * 展示当前权限配置和记住的权限
   */
  showPermissionStatus(permissions: ToolPermission[]): void {
    console.log(chalk.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.cyan('           Permission Status'));
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    if (permissions.length === 0) {
      console.log(chalk.gray('  No remembered permissions\n'));
      return;
    }

    // 按作用域分组
    const byScope = this.groupByScope(permissions);

    // 显示会话权限
    if (byScope.session.length > 0) {
      console.log(chalk.bold.yellow('  Session Permissions (until exit):'));
      byScope.session.forEach((perm) => {
        this.printPermission(perm);
      });
      console.log();
    }

    // 显示永久权限
    if (byScope.always.length > 0) {
      console.log(chalk.bold.green('  Always Allowed:'));
      byScope.always.filter(p => p.allowed).forEach((perm) => {
        this.printPermission(perm);
      });
      console.log();
    }

    // 显示永久拒绝
    const denied = byScope.always.filter(p => !p.allowed);
    if (denied.length > 0) {
      console.log(chalk.bold.red('  Always Denied:'));
      denied.forEach((perm) => {
        this.printPermission(perm);
      });
      console.log();
    }

    // 统计信息
    console.log(chalk.gray('  ─────────────────────────────────────'));
    console.log(chalk.gray(`  Total: ${permissions.length} permissions`));
    console.log(chalk.gray(`  Session: ${byScope.session.length} | Always: ${byScope.always.length}\n`));
  }

  /**
   * 显示权限历史
   * 从审计日志中读取并展示权限决策历史
   * v2.1.7: 添加反馈信息显示
   */
  showPermissionHistory(history: PermissionHistoryEntry[], limit: number = 20): void {
    console.log(chalk.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.cyan('          Permission History'));
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    if (history.length === 0) {
      console.log(chalk.gray('  No permission history\n'));
      return;
    }

    // 限制显示条目数
    const entries = history.slice(-limit);

    entries.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleString();
      const decision = entry.decision === 'allow'
        ? chalk.green('✓ ALLOW')
        : chalk.red('✗ DENY');

      const userDecision = entry.user
        ? chalk.yellow(' [USER]')
        : chalk.gray(' [AUTO]');

      // v2.1.7: 显示是否包含反馈
      const feedbackBadge = entry.hasFeedback
        ? chalk.magenta(' [FEEDBACK]')
        : '';

      console.log(`  ${chalk.gray(time)} ${decision}${userDecision}${feedbackBadge}`);
      console.log(`    ${chalk.cyan(entry.tool)} - ${chalk.white(entry.type)}`);

      if (entry.resource) {
        const resourceStr = entry.resource.length > 60
          ? '...' + entry.resource.slice(-57)
          : entry.resource;
        console.log(`    ${chalk.gray('Resource:')} ${resourceStr}`);
      }

      if (entry.reason) {
        console.log(`    ${chalk.gray('Reason:')} ${entry.reason}`);
      }

      // v2.1.7: 显示反馈内容
      if (entry.feedback) {
        const feedbackStr = entry.feedback.length > 80
          ? entry.feedback.slice(0, 77) + '...'
          : entry.feedback;
        console.log(`    ${chalk.magenta('Feedback:')} ${feedbackStr}`);
      }

      if (index < entries.length - 1) {
        console.log();
      }
    });

    console.log(chalk.gray('\n  ─────────────────────────────────────'));
    console.log(chalk.gray(`  Showing ${entries.length} of ${history.length} entries\n`));
  }

  /**
   * 创建快捷操作
   * 提供批量权限管理的快捷操作
   */
  createQuickActions(permissionManager?: {
    clearSessionPermissions: () => void;
    getPermissionConfig: () => PermissionConfig;
    setPermissionConfig: (config: PermissionConfig) => void;
  }): QuickAction[] {
    const actions: QuickAction[] = [];

    // 清除会话权限
    if (permissionManager) {
      actions.push({
        id: 'clear-session',
        label: 'Clear Session Permissions',
        description: 'Remove all session-scoped permissions',
        action: () => {
          permissionManager.clearSessionPermissions();
          console.log(chalk.green('✓ Session permissions cleared'));
        },
      });

      // 允许所有文件读取
      actions.push({
        id: 'allow-all-reads',
        label: 'Allow All File Reads',
        description: 'Automatically allow all file read operations',
        action: () => {
          const config = permissionManager.getPermissionConfig();
          config.paths = config.paths || {};
          config.paths.allow = config.paths.allow || [];
          if (!config.paths.allow.includes('**/*')) {
            config.paths.allow.push('**/*');
          }
          permissionManager.setPermissionConfig(config);
          console.log(chalk.green('✓ All file reads now allowed'));
        },
      });

      // 允许特定工具
      actions.push({
        id: 'allow-safe-tools',
        label: 'Allow Safe Tools',
        description: 'Allow read-only tools (Glob, Grep, Read)',
        action: () => {
          const config = permissionManager.getPermissionConfig();
          config.tools = config.tools || {};
          config.tools.allow = ['Glob', 'Grep', 'Read', 'LSP'];
          permissionManager.setPermissionConfig(config);
          console.log(chalk.green('✓ Safe tools allowed'));
        },
      });

      // 危险：允许所有
      actions.push({
        id: 'allow-all',
        label: 'Allow All Operations',
        description: 'DANGEROUS: Allow all operations without prompting',
        dangerous: true,
        action: () => {
          console.log(chalk.red.bold('⚠️  WARNING: This will allow ALL operations!'));
          console.log(chalk.yellow('This is a dangerous action. Press Ctrl+C to cancel.\n'));
          // 这里可以添加确认逻辑
        },
      });
    }

    // 查看审计日志
    actions.push({
      id: 'view-audit',
      label: 'View Audit Log',
      description: 'Show recent permission audit entries',
      action: () => {
        const history = this.loadAuditLog();
        this.showPermissionHistory(history, 30);
      },
    });

    // 导出权限配置
    actions.push({
      id: 'export-config',
      label: 'Export Configuration',
      description: 'Export current permission configuration',
      action: () => {
        if (permissionManager) {
          const config = permissionManager.getPermissionConfig();
          console.log(chalk.cyan('\nCurrent Permission Configuration:'));
          console.log(JSON.stringify(config, null, 2));
        }
      },
    });

    return actions;
  }

  /**
   * 从审计日志加载历史记录
   */
  loadAuditLog(): PermissionHistoryEntry[] {
    if (!fs.existsSync(this.auditLogPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.auditLogPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      return lines.map(line => {
        try {
          return JSON.parse(line) as PermissionHistoryEntry;
        } catch {
          return null;
        }
      }).filter((entry): entry is PermissionHistoryEntry => entry !== null);
    } catch (err) {
      console.warn('Failed to load audit log:', err);
      return [];
    }
  }

  // ============ 辅助方法 ============

  /**
   * 推断权限类型
   */
  private inferPermissionType(action: string): PermissionType {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('read')) return 'file_read';
    if (lowerAction.includes('write') || lowerAction.includes('edit')) return 'file_write';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'file_delete';
    if (lowerAction.includes('bash') || lowerAction.includes('command')) return 'bash_command';
    if (lowerAction.includes('network') || lowerAction.includes('fetch') || lowerAction.includes('http')) {
      return 'network_request';
    }
    if (lowerAction.includes('mcp')) return 'mcp_server';
    if (lowerAction.includes('plugin')) return 'plugin_install';
    if (lowerAction.includes('config')) return 'system_config';

    return 'file_read'; // 默认
  }

  /**
   * 格式化工具名称
   */
  private formatToolName(toolName: string): string {
    return toolName.charAt(0).toUpperCase() + toolName.slice(1);
  }

  /**
   * 按作用域分组权限
   */
  private groupByScope(permissions: ToolPermission[]): {
    once: ToolPermission[];
    session: ToolPermission[];
    always: ToolPermission[];
  } {
    return {
      once: permissions.filter(p => p.scope === 'once'),
      session: permissions.filter(p => p.scope === 'session'),
      always: permissions.filter(p => p.scope === 'always'),
    };
  }

  /**
   * 打印单个权限
   */
  private printPermission(perm: ToolPermission): void {
    const icon = this.getPermissionIcon(perm.type);
    const statusIcon = perm.allowed ? chalk.green('✓') : chalk.red('✗');
    const time = new Date(perm.timestamp).toLocaleString();

    console.log(`    ${statusIcon} ${icon} ${chalk.cyan(perm.tool)} - ${perm.type}`);

    if (perm.pattern) {
      const patternStr = perm.pattern.length > 50
        ? '...' + perm.pattern.slice(-47)
        : perm.pattern;
      console.log(`       ${chalk.gray('Pattern:')} ${patternStr}`);
    }

    console.log(`       ${chalk.gray('Saved:')} ${time}`);
  }

  /**
   * 获取权限类型图标
   */
  private getPermissionIcon(type: PermissionType): string {
    const icons: Record<PermissionType, string> = {
      file_read: '📖',
      file_write: '✏️',
      file_delete: '🗑️',
      bash_command: '⚡',
      network_request: '🌐',
      mcp_server: '🔌',
      plugin_install: '📦',
      system_config: '⚙️',
      elevated_command: '🔐',
    };
    return icons[type] || '🔧';
  }
}

// ============ 格式化工具函数 ============

/**
 * 格式化权限请求
 * 将权限请求转换为人类可读的字符串
 */
export function formatPermissionRequest(request: PermissionRequest): string {
  const lines: string[] = [];

  lines.push(chalk.bold.yellow('Permission Request:'));
  lines.push(`  Tool: ${chalk.cyan(request.tool)}`);
  lines.push(`  Type: ${chalk.magenta(request.type)}`);
  lines.push(`  Description: ${request.description}`);

  if (request.resource) {
    const resource = request.resource.length > 70
      ? '...' + request.resource.slice(-67)
      : request.resource;
    lines.push(`  Resource: ${chalk.gray(resource)}`);
  }

  if (request.details && Object.keys(request.details).length > 0) {
    lines.push('  Details:');
    Object.entries(request.details).forEach(([key, value]) => {
      lines.push(`    ${key}: ${value}`);
    });
  }

  return lines.join('\n');
}

/**
 * 创建权限横幅
 * 显示当前权限状态的视觉横幅
 */
export function createPermissionBanner(status: PermissionStatus): string {
  const lines: string[] = [];

  lines.push(chalk.bold.cyan('╔═════════════════════════════════════════════╗'));
  lines.push(chalk.bold.cyan('║         Permission System Status            ║'));
  lines.push(chalk.bold.cyan('╠═════════════════════════════════════════════╣'));

  // 模式
  const modeColor = status.mode === 'bypassPermissions' ? 'red' : 'green';
  lines.push(`║  Mode: ${chalk[modeColor](status.mode.padEnd(35))}  ║`);

  // 统计
  lines.push(`║  Total Remembered: ${String(status.totalRemembered).padEnd(23)} ║`);
  lines.push(`║    - Session: ${String(status.sessionPermissions).padEnd(28)} ║`);
  lines.push(`║    - Always: ${String(status.alwaysPermissions).padEnd(29)} ║`);
  lines.push(`║    - Denied: ${String(status.deniedPermissions).padEnd(29)} ║`);

  // 审计
  const auditStatus = status.auditEnabled
    ? chalk.green('Enabled')
    : chalk.gray('Disabled');
  lines.push(`║  Audit Logging: ${auditStatus.padEnd(26)} ║`);

  lines.push(chalk.bold.cyan('╚═════════════════════════════════════════════╝'));

  return lines.join('\n');
}

/**
 * 格式化权限决策
 * v2.1.7: 添加反馈信息显示
 */
export function formatPermissionDecision(decision: PermissionDecision): string {
  const allowed = decision.allowed
    ? chalk.green.bold('ALLOWED')
    : chalk.red.bold('DENIED');

  const scope = decision.scope
    ? chalk.yellow(`(${decision.scope})`)
    : '';

  const reason = decision.reason
    ? chalk.gray(`- ${decision.reason}`)
    : '';

  // v2.1.7: 添加反馈显示
  const feedback = decision.feedback
    ? chalk.magenta(`[Feedback: ${decision.feedback.length > 30 ? decision.feedback.slice(0, 27) + '...' : decision.feedback}]`)
    : '';

  return `${allowed} ${scope} ${reason} ${feedback}`.trim();
}

/**
 * 创建权限摘要
 */
export function createPermissionSummary(permissions: ToolPermission[]): string {
  const byType: Record<PermissionType, number> = {
    file_read: 0,
    file_write: 0,
    file_delete: 0,
    bash_command: 0,
    network_request: 0,
    mcp_server: 0,
    plugin_install: 0,
    system_config: 0,
    elevated_command: 0,
  };

  permissions.forEach(perm => {
    byType[perm.type]++;
  });

  const lines: string[] = [];
  lines.push(chalk.bold('Permission Summary:'));

  Object.entries(byType).forEach(([type, count]) => {
    if (count > 0) {
      const ui = new PermissionUI();
      const icon = (ui as any).getPermissionIcon(type as PermissionType);
      lines.push(`  ${icon} ${type}: ${chalk.cyan(String(count))}`);
    }
  });

  return lines.join('\n');
}

// ============ 导出 ============

export default PermissionUI;
