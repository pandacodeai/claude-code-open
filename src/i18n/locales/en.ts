/**
 * English locale - default language
 */
const en = {
  // ============ Header ============
  'header.connected': 'Connected',
  'header.connecting': 'Connecting...',
  'header.disconnected': 'Disconnected',
  'header.connectionError': 'Connection Error',
  'header.planMode': 'PLAN MODE',
  'header.planModeActive': 'PLAN MODE ACTIVE',
  'header.planModeHint': 'Read-only exploration mode. Use /plan exit to submit plan.',
  'header.updateAvailable': 'Update Available: v{{version}}',
  'header.updateAvailableShort': 'v{{version}} available',
  'header.newVersionAvailable': 'New version available! Run:',
  'header.welcomeBack': 'Welcome back {{username}}!',
  'header.pressForShortcuts': 'Press ? for shortcuts',
  'header.task': '{{count}} task',
  'header.tasks': '{{count}} tasks',

  // ============ ShortcutHelp ============
  'shortcut.title': 'Keyboard Shortcuts',
  'shortcut.closeHint': 'Press ? or Esc to close',
  'shortcut.tip': 'Tip: Type /help for all available slash commands',
  // General
  'shortcut.showHelp': 'Show/hide this help',
  'shortcut.cancel': 'Cancel current operation / Exit',
  'shortcut.clearScreen': 'Clear screen',
  'shortcut.goBack': 'Cancel / Go back',
  // Input
  'shortcut.submit': 'Submit message',
  'shortcut.navigateHistory': 'Navigate history',
  'shortcut.autocomplete': 'Autocomplete command',
  'shortcut.externalEditor': 'Open in external editor',
  // Model
  'shortcut.switchModel': 'Switch model (opus → sonnet → haiku)',
  'shortcut.switchModelAlt': 'Switch model (alternative)',
  // Tasks
  'shortcut.backgroundTask': 'Move current task to background',
  'shortcut.toggleTodos': 'Show/hide todos',
  // Commands
  'shortcut.showCommands': 'Show all commands',
  'shortcut.clearConversation': 'Clear conversation',
  'shortcut.compactHistory': 'Compact conversation history',
  'shortcut.switchModelCmd': 'Switch model',
  'shortcut.showStatus': 'Show session status',
  'shortcut.runDiagnostics': 'Run diagnostics',
  // Categories
  'shortcut.category.general': 'General',
  'shortcut.category.input': 'Input',
  'shortcut.category.model': 'Model',
  'shortcut.category.tasks': 'Tasks',
  'shortcut.category.commands': 'Commands',

  // ============ PermissionPrompt ============
  'permission.title': 'Permission Required',
  'permission.titleDangerous': 'DANGEROUS OPERATION - Permission Required',
  'permission.allowOnce': 'Yes, allow once',
  'permission.allowOnceDesc': 'Allow this operation one time only',
  'permission.deny': 'No, deny',
  'permission.denyDesc': 'Deny this operation',
  'permission.allowSession': 'Allow for this session',
  'permission.allowSessionDesc': 'Remember until program exits',
  'permission.allowAlways': 'Always allow (remember)',
  'permission.allowAlwaysDesc': 'Persist to config file',
  'permission.neverAllow': 'Never allow (remember)',
  'permission.neverAllowDesc': 'Persist denial to config file',
  'permission.warningDestructive': 'WARNING: This operation could be destructive!',
  'permission.similarPatterns': 'Similar patterns already remembered: {{patterns}}',
  'permission.feedbackPrompt': 'Provide feedback (optional):',
  'permission.feedbackHint': 'Enter: submit and deny · ESC: cancel',
  'permission.footerNav': '↑/↓ navigate · enter select · shortcut key',
  'permission.footerTab': 'Tab: auto-complete',
  'permission.footerShortcuts': 'y: allow once · n: deny · s: session',
  'permission.footerShiftTab': 'Shift+Tab: mode switch',
  'permission.autoAcceptEdits': 'Auto-accept edits mode',
  'permission.planMode': 'Plan mode',
  // Permission types
  'permission.type.fileRead': 'File Read',
  'permission.type.fileWrite': 'File Write',
  'permission.type.fileDelete': 'File Delete',
  'permission.type.bashCommand': 'Bash Command',
  'permission.type.networkRequest': 'Network Request',
  'permission.type.mcpServer': 'MCP Server',
  'permission.type.pluginInstall': 'Plugin Install',
  'permission.type.systemConfig': 'System Config',
  'permission.type.elevatedCommand': 'Elevated Command',
  'permission.type.unknown': 'Unknown',
  // Resource labels
  'permission.resource.file': 'File',
  'permission.resource.command': 'Command',
  'permission.resource.url': 'URL',
  'permission.resource.server': 'Server',
  'permission.resource.default': 'Resource',
  // Elevated command
  'permission.elevated.title': 'Administrator privileges required',
  'permission.elevated.win32': 'Windows UAC dialog will appear after approval',
  'permission.elevated.darwin': 'macOS password dialog will appear after approval',
  'permission.elevated.linux': 'sudo password required after approval',

  // ============ WelcomeScreen ============
  'welcome.welcomeBack': 'Welcome back {{username}}!',
  'welcome.welcomeTo': 'Welcome to Claude Code!',
  'welcome.recentActivity': 'Recent activity',
  'welcome.resumeForMore': '/resume for more',
  'welcome.noRecentActivity': 'No recent activity',
  'welcome.whatsNew': "What's new",
  'welcome.releaseNotes': '/release-notes for more',
  'welcome.justNow': 'just now',
  'welcome.minutesAgo': '{{count}}m ago',
  'welcome.hoursAgo': '{{count}}h ago',
  'welcome.daysAgo': '{{count}}d ago',

  // ============ TrustDialog ============
  'trust.default.title': 'Trust this folder?',
  'trust.default.body': 'Claude Code will be working in this folder.\n\nThis means I can:\n- Read any file in this folder\n- Create, edit, or delete files\n- Run commands (like npm, git, tests, ls, rm)\n- Use tools defined in .mcp.json',
  'trust.default.learnMore': 'Learn more',
  'trust.default.yes': 'Yes, continue',
  'trust.default.no': 'No, exit',
  'trust.normalize.title': 'Accessing workspace:',
  'trust.normalize.body': "Quick safety check: Is this a project you created or one you trust? (Like your own code, a well-known open source project, or work from your team). If not, take a moment to review what's in this folder first.\n\nClaude Code'll be able to read, edit, and execute files here.",
  'trust.normalize.learnMore': 'Security guide',
  'trust.normalize.yes': 'Yes, I trust this folder',
  'trust.normalize.no': 'No, exit',
  'trust.explicit.title': 'Do you want to work in this folder?',
  'trust.explicit.body': 'In order to work in this folder, we need your permission for Claude Code to read, edit, and execute files.\n\nIf this folder has malicious code or untrusted scripts, Claude Code could run them while trying to help.',
  'trust.explicit.learnMore': 'Security guide',
  'trust.explicit.yes': 'Yes, I trust this folder',
  'trust.explicit.no': 'No, exit',
  'trust.homeDirectory': 'home directory',
  'trust.homeWarning': 'Note: You are running from your home directory. Accepting trust will enable features like hooks and skills that can execute code.',
  'trust.navHint': 'Use arrow keys to select, Enter to confirm, Esc to cancel',
  'trust.processing': 'Processing...',

  // ============ StatusBar ============
  'status.msgs': 'msgs',
  'status.tokens': 'tokens',
  'status.processing': 'Processing...',
  'status.context': 'ctx:',

  // ============ TodoList ============
  'todo.title': 'Tasks',
  'todo.progress': 'Progress: {{current}}/{{total}} ({{percentage}}%)',
  'todo.inProgress': 'In Progress',
  'todo.pending': 'Pending',
  'todo.completed': 'Completed',
  'todo.navHint': 'Use ↑↓ to navigate',

  // ============ BackgroundTasksPanel ============
  'bgTasks.title': 'Background Tasks ({{count}})',
  'bgTasks.running': 'Running: {{count}}',
  'bgTasks.completed': 'Completed: {{count}}',
  'bgTasks.failed': 'Failed: {{count}}',
  'bgTasks.moreTasks': '... and {{count}} more tasks',
  'bgTasks.hint': 'Press Ctrl+B to close | Use /tasks to manage',

  // ============ UpdateNotification ============
  'update.checking': 'Auto-updating…',
  'update.available': 'Update Available!',
  'update.newVersion': 'A new version ({{version}}) is available.',
  'update.runCommand': 'Run: npm install -g @anthropic-ai/claude-code',
  'update.checkFailed': 'Update check failed: {{error}}',
} as const;

export type LocaleKeys = keyof typeof en;
export default en;
