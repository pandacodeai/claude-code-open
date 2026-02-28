/**
 * Config 子命令 - 配置管理 CLI
 * 实现类似 git config 的命令行接口
 * 支持: list, get, set, unset, edit, path, reset, export, import
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { configManager, type UserConfig } from '../config/index.js';

// ============ 辅助函数 ============

/**
 * 格式化配置值用于显示
 */
function formatValue(value: any): string {
  if (value === undefined || value === null) {
    return chalk.gray('(not set)');
  }
  if (typeof value === 'boolean') {
    return value ? chalk.green('true') : chalk.red('false');
  }
  if (typeof value === 'number') {
    return chalk.cyan(value.toString());
  }
  if (typeof value === 'string') {
    return chalk.yellow(`"${value}"`);
  }
  if (Array.isArray(value)) {
    return chalk.magenta(`[${value.length} items]`);
  }
  if (typeof value === 'object') {
    return chalk.blue('{...}');
  }
  return String(value);
}

/**
 * 解析配置值（从字符串）
 */
function parseValue(value: string): any {
  // 尝试解析为 JSON
  try {
    return JSON.parse(value);
  } catch {
    // 如果不是 JSON，返回原始字符串
    return value;
  }
}

/**
 * 获取配置文件路径
 */
function getConfigPath(scope: 'global' | 'local' = 'global'): string {
  if (scope === 'global') {
    const configDir = process.env.AXON_CONFIG_DIR ||
                      path.join(os.homedir(), '.axon');
    return path.join(configDir, 'settings.json');
  } else {
    return path.join(process.cwd(), '.axon', 'settings.json');
  }
}

/**
 * 打开编辑器
 */
function openEditor(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const editor = process.env.EDITOR || process.env.VISUAL || 'vi';

    // 确保文件存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf-8');
    }

    const child = spawn(editor, [filePath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * 获取配置项的描述
 */
function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    version: 'Configuration version',
    apiKey: 'Anthropic API key',
    model: 'Default AI model',
    maxTokens: 'Maximum output tokens',
    temperature: 'Sampling temperature (0-1)',
    useBedrock: 'Use AWS Bedrock instead of direct API',
    useVertex: 'Use Google Vertex AI instead of direct API',
    oauthToken: 'OAuth token for authentication',
    maxRetries: 'Maximum retry attempts for API calls',
    debugLogsDir: 'Directory for debug logs',
    theme: 'UI theme (dark/light/auto)',
    verbose: 'Enable verbose logging',
    enableTelemetry: 'Enable telemetry reporting',
    disableFileCheckpointing: 'Disable file checkpointing',
    enableAutoSave: 'Enable automatic session saving',
    maxConcurrentTasks: 'Maximum concurrent task execution',
    requestTimeout: 'API request timeout (ms)',
    mcpServers: 'MCP server configurations',
    allowedTools: 'List of allowed tools',
    disallowedTools: 'List of disallowed tools',
    systemPrompt: 'Custom system prompt',
    defaultWorkingDir: 'Default working directory',
    permissions: 'Permission settings',
  };
  return descriptions[key] || 'No description available';
}

/**
 * 验证配置键是否有效
 */
function isValidConfigKey(key: string): boolean {
  const validKeys = [
    'version', 'apiKey', 'model', 'maxTokens', 'temperature',
    'useBedrock', 'useVertex', 'oauthToken', 'maxRetries',
    'debugLogsDir', 'theme', 'verbose', 'enableTelemetry',
    'disableFileCheckpointing', 'enableAutoSave', 'maxConcurrentTasks',
    'requestTimeout', 'mcpServers', 'allowedTools', 'disallowedTools',
    'systemPrompt', 'defaultWorkingDir', 'permissions',
  ];
  return validKeys.includes(key);
}

// ============ 子命令实现 ============

/**
 * config list - 列出所有配置
 */
function configList(options: { scope?: string; format?: string }): void {
  try {
    const config = configManager.getAll();

    if (options.format === 'json') {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    console.log(chalk.bold.cyan('\n📋 Current Configuration:\n'));

    // 按类别分组显示
    const categories = {
      'API & Model': ['apiKey', 'model', 'maxTokens', 'temperature', 'useBedrock', 'useVertex', 'oauthToken'],
      'Behavior': ['maxRetries', 'requestTimeout', 'maxConcurrentTasks', 'enableAutoSave'],
      'UI & Output': ['theme', 'verbose', 'debugLogsDir'],
      'Features': ['enableTelemetry', 'disableFileCheckpointing'],
      'Tools & Permissions': ['allowedTools', 'disallowedTools', 'permissions'],
      'Advanced': ['systemPrompt', 'defaultWorkingDir', 'mcpServers', 'version'],
    };

    for (const [category, keys] of Object.entries(categories)) {
      console.log(chalk.bold.blue(`${category}:`));
      for (const key of keys) {
        const value = config[key as keyof UserConfig];
        const formattedValue = formatValue(value);
        const desc = chalk.gray(`  # ${getConfigDescription(key)}`);
        console.log(`  ${chalk.white(key)}: ${formattedValue}`);
        if (options.scope !== 'minimal') {
          console.log(desc);
        }
      }
      console.log('');
    }

    const configPath = getConfigPath('global');
    console.log(chalk.gray(`Config file: ${configPath}\n`));
  } catch (error) {
    console.error(chalk.red('Error listing configuration:'), error);
    process.exit(1);
  }
}

/**
 * config get - 获取配置值
 */
function configGet(key: string, options: { format?: string }): void {
  try {
    if (!key) {
      console.error(chalk.red('Error: Configuration key is required'));
      console.log(chalk.gray('Usage: claude config get <key>'));
      process.exit(1);
    }

    const value = configManager.get(key as keyof UserConfig);

    if (options.format === 'json') {
      console.log(JSON.stringify({ [key]: value }, null, 2));
      return;
    }

    if (value === undefined) {
      console.log(chalk.yellow(`Configuration "${key}" is not set`));
      console.log(chalk.gray(`Description: ${getConfigDescription(key)}`));
    } else {
      console.log(chalk.cyan(`${key}:`), formatValue(value));
    }
  } catch (error) {
    console.error(chalk.red('Error getting configuration:'), error);
    process.exit(1);
  }
}

/**
 * config set - 设置配置值
 */
function configSet(key: string, value: string, options: { scope?: string; type?: string }): void {
  try {
    if (!key || value === undefined) {
      console.error(chalk.red('Error: Key and value are required'));
      console.log(chalk.gray('Usage: claude config set <key> <value>'));
      process.exit(1);
    }

    if (!isValidConfigKey(key)) {
      console.error(chalk.red(`Error: Invalid configuration key "${key}"`));
      console.log(chalk.gray('Use "claude config list" to see available keys'));
      process.exit(1);
    }

    // 解析值
    let parsedValue: any;
    if (options.type === 'string') {
      parsedValue = value;
    } else if (options.type === 'number') {
      parsedValue = Number(value);
      if (isNaN(parsedValue)) {
        console.error(chalk.red(`Error: "${value}" is not a valid number`));
        process.exit(1);
      }
    } else if (options.type === 'boolean') {
      parsedValue = value.toLowerCase() === 'true' || value === '1';
    } else if (options.type === 'json') {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        console.error(chalk.red('Error: Invalid JSON value'));
        process.exit(1);
      }
    } else {
      // 自动检测类型
      parsedValue = parseValue(value);
    }

    // 设置配置
    if (options.scope === 'local') {
      configManager.saveProject({ [key]: parsedValue });
      console.log(chalk.green(`✓ Set ${key} = ${formatValue(parsedValue)} (local)`));
    } else {
      configManager.set(key as keyof UserConfig, parsedValue);
      console.log(chalk.green(`✓ Set ${key} = ${formatValue(parsedValue)}`));
    }
  } catch (error) {
    console.error(chalk.red('Error setting configuration:'), error);
    process.exit(1);
  }
}

/**
 * config unset - 删除配置值
 */
function configUnset(key: string, options: { scope?: string }): void {
  try {
    if (!key) {
      console.error(chalk.red('Error: Configuration key is required'));
      console.log(chalk.gray('Usage: claude config unset <key>'));
      process.exit(1);
    }

    const configPath = getConfigPath(options.scope === 'local' ? 'local' : 'global');

    if (!fs.existsSync(configPath)) {
      console.log(chalk.yellow(`Configuration file does not exist: ${configPath}`));
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (!(key in config)) {
      console.log(chalk.yellow(`Configuration "${key}" is not set`));
      return;
    }

    delete config[key];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    configManager.reload();
    console.log(chalk.green(`✓ Unset ${key}`));
  } catch (error) {
    console.error(chalk.red('Error unsetting configuration:'), error);
    process.exit(1);
  }
}

/**
 * config edit - 用编辑器打开配置文件
 */
async function configEdit(options: { scope?: string }): Promise<void> {
  try {
    const configPath = getConfigPath(options.scope === 'local' ? 'local' : 'global');

    console.log(chalk.cyan(`Opening ${configPath} in editor...`));
    await openEditor(configPath);

    // 重新加载配置
    configManager.reload();
    console.log(chalk.green('✓ Configuration updated'));
  } catch (error) {
    console.error(chalk.red('Error editing configuration:'), error);
    process.exit(1);
  }
}

/**
 * config path - 显示配置文件路径
 */
function configPath(options: { scope?: string }): void {
  const configPath = getConfigPath(options.scope === 'local' ? 'local' : 'global');
  console.log(configPath);
}

/**
 * config reset - 重置为默认配置
 */
function configReset(options: { confirm?: boolean; scope?: string }): void {
  try {
    if (!options.confirm) {
      console.log(chalk.yellow('⚠️  This will reset all configuration to defaults!'));
      console.log(chalk.gray('Use --confirm to proceed'));
      process.exit(1);
    }

    const configPath = getConfigPath(options.scope === 'local' ? 'local' : 'global');

    if (options.scope === 'local') {
      // 删除本地配置文件
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log(chalk.green('✓ Local configuration reset'));
      } else {
        console.log(chalk.yellow('No local configuration found'));
      }
    } else {
      // 重置全局配置
      configManager.reset();
      console.log(chalk.green('✓ Configuration reset to defaults'));
    }
  } catch (error) {
    console.error(chalk.red('Error resetting configuration:'), error);
    process.exit(1);
  }
}

/**
 * config export - 导出配置为 JSON
 */
function configExport(options: { output?: string; maskSecrets?: boolean }): void {
  try {
    const maskSecrets = options.maskSecrets !== false; // 默认掩码
    const configJson = configManager.export(maskSecrets);

    if (options.output) {
      fs.writeFileSync(options.output, configJson, 'utf-8');
      console.log(chalk.green(`✓ Configuration exported to ${options.output}`));
    } else {
      console.log(configJson);
    }
  } catch (error) {
    console.error(chalk.red('Error exporting configuration:'), error);
    process.exit(1);
  }
}

/**
 * config import - 从文件导入配置
 */
function configImport(file: string, options: { merge?: boolean }): void {
  try {
    if (!file) {
      console.error(chalk.red('Error: Input file is required'));
      console.log(chalk.gray('Usage: claude config import <file>'));
      process.exit(1);
    }

    if (!fs.existsSync(file)) {
      console.error(chalk.red(`Error: File not found: ${file}`));
      process.exit(1);
    }

    const configJson = fs.readFileSync(file, 'utf-8');

    if (options.merge) {
      // 合并配置
      const newConfig = JSON.parse(configJson);
      const currentConfig = configManager.getAll();
      const merged = { ...currentConfig, ...newConfig };
      configManager.save(merged);
      console.log(chalk.green('✓ Configuration merged'));
    } else {
      // 完全替换
      const success = configManager.import(configJson);
      if (success) {
        console.log(chalk.green('✓ Configuration imported'));
      } else {
        console.error(chalk.red('Failed to import configuration'));
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error importing configuration:'), error);
    process.exit(1);
  }
}

/**
 * config validate - 验证配置
 */
function configValidate(): void {
  try {
    const validation = configManager.validate();

    if (validation.valid) {
      console.log(chalk.green('✓ Configuration is valid'));
    } else {
      console.log(chalk.red('✗ Configuration has errors:'));
      if (validation.errors) {
        for (const error of validation.errors.errors) {
          console.log(chalk.red(`  - ${error.path.join('.')}: ${error.message}`));
        }
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error validating configuration:'), error);
    process.exit(1);
  }
}

/**
 * config mcp - MCP 服务器管理
 */
function configMcp(action: string, name?: string, config?: string): void {
  try {
    switch (action) {
      case 'list': {
        const servers = configManager.getMcpServers();
        if (Object.keys(servers).length === 0) {
          console.log(chalk.yellow('No MCP servers configured'));
          return;
        }
        console.log(chalk.bold.cyan('\n📡 MCP Servers:\n'));
        for (const [serverName, serverConfig] of Object.entries(servers)) {
          console.log(chalk.white(`${serverName}:`));
          console.log(`  Type: ${chalk.cyan(serverConfig.type)}`);
          if (serverConfig.command) {
            console.log(`  Command: ${chalk.gray(serverConfig.command)}`);
          }
          if (serverConfig.url) {
            console.log(`  URL: ${chalk.blue(serverConfig.url)}`);
          }
          console.log('');
        }
        break;
      }

      case 'add': {
        if (!name || !config) {
          console.error(chalk.red('Error: Server name and config are required'));
          console.log(chalk.gray('Usage: claude config mcp add <name> <json-config>'));
          process.exit(1);
        }
        const serverConfig = JSON.parse(config);
        configManager.addMcpServer(name, serverConfig);
        console.log(chalk.green(`✓ Added MCP server "${name}"`));
        break;
      }

      case 'remove': {
        if (!name) {
          console.error(chalk.red('Error: Server name is required'));
          console.log(chalk.gray('Usage: claude config mcp remove <name>'));
          process.exit(1);
        }
        const removed = configManager.removeMcpServer(name);
        if (removed) {
          console.log(chalk.green(`✓ Removed MCP server "${name}"`));
        } else {
          console.log(chalk.yellow(`MCP server "${name}" not found`));
        }
        break;
      }

      default:
        console.error(chalk.red(`Unknown MCP action: ${action}`));
        console.log(chalk.gray('Available actions: list, add, remove'));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error managing MCP servers:'), error);
    process.exit(1);
  }
}

// ============ 创建命令 ============

/**
 * 创建 config 子命令
 */
export function createConfigCommand(): Command {
  const configCommand = new Command('config')
    .description('Manage Axon configuration');

  // config list
  configCommand
    .command('list')
    .description('List all configuration values')
    .option('--scope <scope>', 'Configuration scope (minimal, full)', 'full')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .action(configList);

  // config get
  configCommand
    .command('get <key>')
    .description('Get a configuration value')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .action(configGet);

  // config set
  configCommand
    .command('set <key> <value>')
    .description('Set a configuration value')
    .option('--scope <scope>', 'Configuration scope (global, local)', 'global')
    .option('--type <type>', 'Value type (string, number, boolean, json)')
    .action(configSet);

  // config unset
  configCommand
    .command('unset <key>')
    .description('Remove a configuration value')
    .option('--scope <scope>', 'Configuration scope (global, local)', 'global')
    .action(configUnset);

  // config edit
  configCommand
    .command('edit')
    .description('Open configuration file in editor')
    .option('--scope <scope>', 'Configuration scope (global, local)', 'global')
    .action(configEdit);

  // config path
  configCommand
    .command('path')
    .description('Show configuration file path')
    .option('--scope <scope>', 'Configuration scope (global, local)', 'global')
    .action(configPath);

  // config reset
  configCommand
    .command('reset')
    .description('Reset configuration to defaults')
    .option('--confirm', 'Confirm reset operation')
    .option('--scope <scope>', 'Configuration scope (global, local)', 'global')
    .action(configReset);

  // config export
  configCommand
    .command('export')
    .description('Export configuration to JSON')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-mask-secrets', 'Do not mask sensitive values')
    .action(configExport);

  // config import
  configCommand
    .command('import <file>')
    .description('Import configuration from file')
    .option('--merge', 'Merge with existing configuration')
    .action(configImport);

  // config validate
  configCommand
    .command('validate')
    .description('Validate current configuration')
    .action(configValidate);

  // config mcp
  configCommand
    .command('mcp <action> [name] [config]')
    .description('Manage MCP servers (actions: list, add, remove)')
    .action(configMcp);

  return configCommand;
}

// ============ 导出 ============

export default createConfigCommand;
