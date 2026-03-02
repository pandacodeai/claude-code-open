/**
 * 代码结构分析器
 * 从代码内容中提取结构化信息，生成自然语言描述
 * 提取自 useCodeTour.ts，作为独立的纯函数模块
 */

import { TourStep } from '../api/ai-editor';
import { extractJSDocForLine, formatJSDocBrief } from './jsdocParser';

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 拆分驼峰命名为可读文本
 */
export function splitCamelCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
    .toLowerCase();
}

/**
 * 根据命名推断代码职责
 */
export function inferPurposeFromName(name: string): string {
  // 常见命名模式
  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    // 动作类
    [/^handle(\w+)$/, (m) => `处理 ${splitCamelCase(m[1])} 事件`],
    [/^on(\w+)$/, (m) => `响应 ${splitCamelCase(m[1])} 事件`],
    [/^get(\w+)$/, (m) => `获取 ${splitCamelCase(m[1])}`],
    [/^set(\w+)$/, (m) => `设置 ${splitCamelCase(m[1])}`],
    [/^fetch(\w+)$/, (m) => `请求 ${splitCamelCase(m[1])} 数据`],
    [/^load(\w+)$/, (m) => `加载 ${splitCamelCase(m[1])}`],
    [/^save(\w+)$/, (m) => `保存 ${splitCamelCase(m[1])}`],
    [/^create(\w+)$/, (m) => `创建 ${splitCamelCase(m[1])}`],
    [/^update(\w+)$/, (m) => `更新 ${splitCamelCase(m[1])}`],
    [/^delete(\w+)$/, (m) => `删除 ${splitCamelCase(m[1])}`],
    [/^remove(\w+)$/, (m) => `移除 ${splitCamelCase(m[1])}`],
    [/^add(\w+)$/, (m) => `添加 ${splitCamelCase(m[1])}`],
    [/^init(\w*)$/, (m) => m[1] ? `初始化 ${splitCamelCase(m[1])}` : '执行初始化'],
    [/^parse(\w+)$/, (m) => `解析 ${splitCamelCase(m[1])}`],
    [/^format(\w+)$/, (m) => `格式化 ${splitCamelCase(m[1])}`],
    [/^validate(\w+)$/, (m) => `验证 ${splitCamelCase(m[1])}`],
    [/^check(\w+)$/, (m) => `检查 ${splitCamelCase(m[1])}`],
    [/^is(\w+)$/, (m) => `判断是否 ${splitCamelCase(m[1])}`],
    [/^has(\w+)$/, (m) => `判断是否有 ${splitCamelCase(m[1])}`],
    [/^can(\w+)$/, (m) => `判断能否 ${splitCamelCase(m[1])}`],
    [/^should(\w+)$/, (m) => `判断是否应该 ${splitCamelCase(m[1])}`],
    [/^render(\w*)$/, (m) => m[1] ? `渲染 ${splitCamelCase(m[1])}` : '执行渲染'],
    [/^use(\w+)$/, (m) => `${splitCamelCase(m[1])} Hook`],
    [/^with(\w+)$/, (m) => `附加 ${splitCamelCase(m[1])} 能力的高阶组件`],
    // 角色类后缀
    [/(\w+)Manager$/, (m) => `${splitCamelCase(m[1])} 管理器`],
    [/(\w+)Service$/, (m) => `${splitCamelCase(m[1])} 服务`],
    [/(\w+)Controller$/, (m) => `${splitCamelCase(m[1])} 控制器`],
    [/(\w+)Handler$/, (m) => `${splitCamelCase(m[1])} 处理器`],
    [/(\w+)Provider$/, (m) => `${splitCamelCase(m[1])} 提供者`],
    [/(\w+)Factory$/, (m) => `${splitCamelCase(m[1])} 工厂`],
    [/(\w+)Builder$/, (m) => `${splitCamelCase(m[1])} 构建器`],
    [/(\w+)Helper$/, (m) => `${splitCamelCase(m[1])} 辅助工具`],
    [/(\w+)Util(?:s)?$/, (m) => `${splitCamelCase(m[1])} 工具函数`],
    [/(\w+)Coordinator$/, (m) => `${splitCamelCase(m[1])} 协调器，负责多组件间的协作调度`],
    [/(\w+)Registry$/, (m) => `${splitCamelCase(m[1])} 注册表`],
    [/(\w+)Pool$/, (m) => `${splitCamelCase(m[1])} 池`],
    [/(\w+)Queue$/, (m) => `${splitCamelCase(m[1])} 队列`],
    [/(\w+)Cache$/, (m) => `${splitCamelCase(m[1])} 缓存`],
    [/(\w+)Store$/, (m) => `${splitCamelCase(m[1])} 状态存储`],
    [/(\w+)Context$/, (m) => `${splitCamelCase(m[1])} 上下文`],
    [/(\w+)Reducer$/, (m) => `${splitCamelCase(m[1])} 状态管理 Reducer`],
    [/(\w+)Middleware$/, (m) => `${splitCamelCase(m[1])} 中间件`],
    [/(\w+)Plugin$/, (m) => `${splitCamelCase(m[1])} 插件`],
    [/(\w+)Adapter$/, (m) => `${splitCamelCase(m[1])} 适配器`],
    [/(\w+)Wrapper$/, (m) => `${splitCamelCase(m[1])} 包装器`],
    [/(\w+)Listener$/, (m) => `${splitCamelCase(m[1])} 监听器`],
    [/(\w+)Observer$/, (m) => `${splitCamelCase(m[1])} 观察者`],
    [/(\w+)Emitter$/, (m) => `${splitCamelCase(m[1])} 事件发射器`],
    [/(\w+)Client$/, (m) => `${splitCamelCase(m[1])} 客户端`],
    [/(\w+)Server$/, (m) => `${splitCamelCase(m[1])} 服务端`],
    [/(\w+)Api$/, (m) => `${splitCamelCase(m[1])} API 接口`],
    [/(\w+)Route(?:r)?$/, (m) => `${splitCamelCase(m[1])} 路由`],
    [/(\w+)Component$/, (m) => `${splitCamelCase(m[1])} 组件`],
    [/(\w+)View$/, (m) => `${splitCamelCase(m[1])} 视图`],
    [/(\w+)Page$/, (m) => `${splitCamelCase(m[1])} 页面`],
    [/(\w+)Modal$/, (m) => `${splitCamelCase(m[1])} 弹窗`],
    [/(\w+)Dialog$/, (m) => `${splitCamelCase(m[1])} 对话框`],
    [/(\w+)Form$/, (m) => `${splitCamelCase(m[1])} 表单`],
    [/(\w+)List$/, (m) => `${splitCamelCase(m[1])} 列表`],
    [/(\w+)Table$/, (m) => `${splitCamelCase(m[1])} 表格`],
    [/(\w+)Panel$/, (m) => `${splitCamelCase(m[1])} 面板`],
    [/(\w+)Card$/, (m) => `${splitCamelCase(m[1])} 卡片`],
    [/(\w+)Button$/, (m) => `${splitCamelCase(m[1])} 按钮`],
    [/(\w+)Input$/, (m) => `${splitCamelCase(m[1])} 输入框`],
    [/(\w+)Select$/, (m) => `${splitCamelCase(m[1])} 选择器`],
  ];

  for (const [pattern, generator] of patterns) {
    const match = name.match(pattern);
    if (match) {
      return generator(match);
    }
  }

  return '';
}

/**
 * 生成智能描述：优先使用 JSDoc，否则分析代码结构
 */
export function generateSmartDescription(
  type: 'class' | 'function' | 'component' | 'interface' | 'type',
  name: string,
  lineNum: number,
  content: string,
  filePath?: string
): string {
  // 1. 优先从 JSDoc 获取描述
  const jsdoc = extractJSDocForLine(content, lineNum, filePath);
  if (jsdoc && jsdoc.description) {
    return formatJSDocBrief(jsdoc);
  }

  // 2. 根据代码结构分析
  const lines = content.split('\n');

  if (type === 'interface' || type === 'type') {
    // 分析接口/类型定义
    const declLine = lines[lineNum - 1] || '';
    const parts: string[] = [];

    // 基于名称推断职责
    const nameDesc = inferPurposeFromName(name);
    if (nameDesc) {
      parts.push(nameDesc);
    }

    // 计算属性数量
    let braceCount = 0;
    let started = false;
    let propCount = 0;
    for (let i = lineNum - 1; i < Math.min(lineNum + 100, lines.length); i++) {
      const line = lines[i];
      if (line.includes('{')) { braceCount++; started = true; }
      if (line.includes('}')) braceCount--;
      if (started && braceCount === 0) break;

      // 识别属性（简化版）
      if (started && braceCount > 0 && line.match(/^\s*[\w]+\??:\s*/)) {
        propCount++;
      }
    }

    if (propCount > 0) {
      parts.push(`包含 ${propCount} 个属性`);
    }

    return parts.length > 0 ? parts.join('，') + '。' : `${type === 'interface' ? '接口' : '类型'} ${name}`;
  }

  if (type === 'class') {
    // 分析类的结构
    const classStartLine = lineNum - 1;
    let braceCount = 0;
    let started = false;
    let methodCount = 0;
    let propertyCount = 0;
    const methods: string[] = [];
    let extendsClass = '';
    let implementsInterfaces: string[] = [];

    // 解析 extends 和 implements
    const classDecl = lines[classStartLine];
    const extendsMatch = classDecl.match(/extends\s+(\w+)/);
    const implementsMatch = classDecl.match(/implements\s+([\w\s,]+)/);
    if (extendsMatch) extendsClass = extendsMatch[1];
    if (implementsMatch) {
      implementsInterfaces = implementsMatch[1].split(',').map(s => s.trim());
    }

    for (let i = classStartLine; i < Math.min(classStartLine + 200, lines.length); i++) {
      const line = lines[i];
      if (line.includes('{')) { braceCount++; started = true; }
      if (line.includes('}')) braceCount--;
      if (started && braceCount === 0) break;

      // 识别方法
      const methodMatch = line.match(/^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:async)?\s*(\w+)\s*\(/);
      if (methodMatch && methodMatch[1] !== 'constructor') {
        methodCount++;
        if (methods.length < 3) methods.push(methodMatch[1]);
      }

      // 识别属性
      const propMatch = line.match(/^\s*(?:public|private|protected)?\s*(?:static)?\s*(?:readonly)?\s*(\w+)\s*[?:]?\s*[:=]/);
      if (propMatch && !line.includes('(')) {
        propertyCount++;
      }
    }

    // 根据分析结果生成描述
    const parts: string[] = [];

    // 基于类名推断职责
    const nameDesc = inferPurposeFromName(name);
    if (nameDesc) {
      parts.push(nameDesc);
    }

    if (extendsClass) {
      parts.push(`继承自 ${extendsClass}`);
    }
    if (implementsInterfaces.length > 0) {
      parts.push(`实现 ${implementsInterfaces.join(', ')} 接口`);
    }
    if (methodCount > 0) {
      parts.push(`包含 ${methodCount} 个方法` + (methods.length > 0 ? `（${methods.join(', ')} 等）` : ''));
    }
    if (propertyCount > 0) {
      parts.push(`${propertyCount} 个属性`);
    }

    return parts.length > 0 ? parts.join('，') + '。' : `类 ${name}`;
  }

  if (type === 'function' || type === 'component') {
    // 分析函数/组件结构
    const funcStartLine = lineNum - 1;
    const funcDecl = lines[funcStartLine];

    // 提取参数
    const paramsMatch = funcDecl.match(/\(([^)]*)\)/);
    const params = paramsMatch ? paramsMatch[1].split(',').filter(p => p.trim()).map(p => {
      const nameMatch = p.trim().match(/^(\w+)/);
      return nameMatch ? nameMatch[1] : '';
    }).filter(Boolean) : [];

    // 提取返回类型
    const returnMatch = funcDecl.match(/\):\s*([^{]+)/);
    const returnType = returnMatch ? returnMatch[1].trim() : '';

    // 检查是否是 async
    const isAsync = funcDecl.includes('async');

    const parts: string[] = [];

    // 基于函数名推断职责
    const nameDesc = inferPurposeFromName(name);
    if (nameDesc) {
      parts.push(nameDesc);
    }

    if (type === 'component') {
      // 分析组件使用的 hooks
      let braceCount = 0;
      let started = false;
      const hooks: string[] = [];
      for (let i = funcStartLine; i < Math.min(funcStartLine + 100, lines.length); i++) {
        const line = lines[i];
        if (line.includes('{')) { braceCount++; started = true; }
        if (line.includes('}')) braceCount--;
        if (started && braceCount === 0) break;

        const hookMatch = line.match(/use(\w+)\s*\(/);
        if (hookMatch && !hooks.includes(hookMatch[1]) && hooks.length < 3) {
          hooks.push('use' + hookMatch[1]);
        }
      }

      if (hooks.length > 0) {
        parts.push(`使用 ${hooks.join(', ')}`);
      }
    }

    if (isAsync) {
      parts.push('异步执行');
    }
    if (params.length > 0) {
      parts.push(`接收参数: ${params.slice(0, 3).join(', ')}${params.length > 3 ? ' 等' : ''}`);
    }
    if (returnType && returnType !== 'void') {
      parts.push(`返回 ${returnType}`);
    }

    return parts.length > 0 ? parts.join('，') + '。' : `${type === 'component' ? '组件' : '函数'} ${name}`;
  }

  return `${name}`;
}

// ============================================================================
// 主分析函数
// ============================================================================

/**
 * 分析代码结构，生成 TourStep 数组
 * 用于语义地图和代码导游
 */
export function analyzeCodeStructure(content: string, filePath?: string): TourStep[] {
  const steps: TourStep[] = [];
  const lines = content.split('\n');

  // 解析导入区域（合并为一个区块）
  let importStartLine = 0;
  let importEndLine = 0;
  const importSources: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const importMatch = lines[i].match(/^import\s.*from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      if (importStartLine === 0) importStartLine = i + 1;
      importEndLine = i + 1;
      const source = importMatch[1];
      if (!source.startsWith('.') && !source.startsWith('@/') && importSources.length < 5) {
        importSources.push(source.split('/')[0]);
      }
    }
  }
  if (importStartLine > 0) {
    const uniqueSources = [...new Set(importSources)];
    steps.push({
      type: 'block',
      name: '导入声明',
      line: importStartLine,
      endLine: importEndLine,
      description: uniqueSources.length > 0
        ? `引入 ${uniqueSources.join(', ')} 等外部依赖。`
        : '引入本地模块依赖。',
      importance: 'medium',
    });
  }

  // 解析类型定义区域（interface 和 type，合并连续的）
  const typeDefinitions: Array<{ line: number; endLine: number; name: string }> = [];
  
  // 识别 interface
  const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)/g);
  for (const match of interfaceMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    // 计算结束行（简化：找到对应的 }）
    let endLine = lineNum;
    let braceCount = 0;
    let started = false;
    for (let i = lineNum - 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('{')) { braceCount++; started = true; }
      if (line.includes('}')) braceCount--;
      if (started && braceCount === 0) {
        endLine = i + 1;
        break;
      }
    }
    typeDefinitions.push({ line: lineNum, endLine, name: match[1] });
    steps.push({
      type: 'block',
      name: match[1],
      line: lineNum,
      endLine,
      description: generateSmartDescription('interface', match[1], lineNum, content, filePath),
      importance: 'medium',
    });
  }

  // 识别 type
  const typeMatches = content.matchAll(/(?:export\s+)?type\s+(\w+)\s*=/g);
  for (const match of typeMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    // type 通常是单行或用 { } 包裹
    let endLine = lineNum;
    const lineContent = lines[lineNum - 1];
    if (lineContent.includes('{')) {
      let braceCount = 0;
      let started = false;
      for (let i = lineNum - 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('{')) { braceCount++; started = true; }
        if (line.includes('}')) braceCount--;
        if (started && braceCount === 0) {
          endLine = i + 1;
          break;
        }
      }
    }
    typeDefinitions.push({ line: lineNum, endLine, name: match[1] });
    steps.push({
      type: 'block',
      name: match[1],
      line: lineNum,
      endLine,
      description: generateSmartDescription('type', match[1], lineNum, content, filePath),
      importance: 'medium',
    });
  }

  // 解析类定义
  const classMatches = content.matchAll(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g);
  for (const match of classMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    steps.push({
      type: 'class',
      name: match[1],
      line: lineNum,
      description: generateSmartDescription('class', match[1], lineNum, content, filePath),
      importance: 'high',
    });
  }

  // 解析函数定义
  const funcMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
  for (const match of funcMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    steps.push({
      type: 'function',
      name: match[1],
      line: lineNum,
      description: generateSmartDescription('function', match[1], lineNum, content, filePath),
      importance: 'high',
    });
  }

  // 解析 React 组件（const xxx: React.FC）
  const componentMatches = content.matchAll(/(?:export\s+)?const\s+(\w+):\s*React\.FC/g);
  for (const match of componentMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    steps.push({
      type: 'function',
      name: match[1],
      line: lineNum,
      description: generateSmartDescription('component', match[1], lineNum, content, filePath),
      importance: 'high',
    });
  }

  // 解析箭头函数组件（export const xxx = () => { ... }）
  const arrowComponentMatches = content.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:React\.memo\s*)?\([^)]*\)\s*(?::|=>)/g);
  for (const match of arrowComponentMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const name = match[1];
    // 判断是否是组件（首字母大写）
    if (/^[A-Z]/.test(name)) {
      // 避免重复（如果已经被 React.FC 匹配了）
      if (!steps.find(s => s.name === name && s.line === lineNum)) {
        steps.push({
          type: 'function',
          name,
          line: lineNum,
          description: generateSmartDescription('component', name, lineNum, content, filePath),
          importance: 'high',
        });
      }
    }
  }

  // 解析导出常量（export const xxx = ...）
  const exportConstMatches = content.matchAll(/export\s+const\s+(\w+)\s*=/g);
  for (const match of exportConstMatches) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const name = match[1];
    // 避免重复（组件已经被上面识别了）
    if (!/^[A-Z]/.test(name) && !steps.find(s => s.name === name && s.line === lineNum)) {
      const nameDesc = inferPurposeFromName(name);
      steps.push({
        type: 'block',
        name,
        line: lineNum,
        description: nameDesc || `导出常量 ${name}`,
        importance: 'medium',
      });
    }
  }

  // 按行号排序
  steps.sort((a, b) => a.line - b.line);
  return steps;
}
