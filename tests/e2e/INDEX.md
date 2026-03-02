# E2E 测试框架文件索引

## 文件结构

```
tests/e2e/
│
├── 📋 核心框架 (Framework Core)
│   ├── setup.ts              - 测试环境设置 (250行)
│   ├── cli-runner.ts         - CLI 执行器 (350行)
│   └── mock-server.ts        - Mock API 服务器 (380行)
│
├── 🧪 测试套件 (Test Suites)
│   ├── cli-basic.test.ts     - 基础功能测试 (12个测试, 270行)
│   ├── cli-session.test.ts   - 会话测试 (8个测试, 320行)
│   └── cli-tools.test.ts     - 工具测试 (11个测试, 380行)
│
├── 🔧 辅助工具 (Utilities)
│   ├── run-all.ts           - 测试运行器 (100行)
│   └── example.test.ts      - 测试示例 (5个示例, 240行)
│
└── 📖 文档 (Documentation)
    ├── README.md            - 完整文档 (650行)
    ├── QUICK_START.md       - 快速开始 (150行)
    ├── IMPLEMENTATION.md    - 实现报告 (400行)
    └── INDEX.md            - 本文件 (文件索引)
```

## 快速导航

### 🚀 我想开始使用
- [快速开始](./QUICK_START.md) - 5分钟入门
- [测试示例](./example.test.ts) - 实际代码示例

### 📚 我想深入了解
- [完整文档](./README.md) - 详细使用指南
- [实现报告](./IMPLEMENTATION.md) - 技术细节

### 🔨 我想编写测试
- [setup.ts](./setup.ts) - 测试工具 API
- [cli-runner.ts](./cli-runner.ts) - CLI 运行器 API
- [mock-server.ts](./mock-server.ts) - Mock 服务器 API

### 🎯 我想参考现有测试
- [基础测试](./cli-basic.test.ts) - CLI 参数和选项
- [会话测试](./cli-session.test.ts) - 会话管理
- [工具测试](./cli-tools.test.ts) - 工具调用

## 文件详情

### 核心框架

#### setup.ts
**用途**: 提供测试环境初始化、清理和断言工具

**主要导出**:
```typescript
// 环境管理
setupE2ETest(testName: string): Promise<E2ETestContext>
teardownE2ETest(context: E2ETestContext): Promise<void>

// 文件操作
createTestFile(), readTestFile(), fileExists(), listFiles()

// 断言
assert(), assertEqual(), assertContains(), assertMatch()

// 工具
sleep(), waitFor(), runTestSuite()
```

**适用场景**:
- 需要隔离的测试环境
- 需要创建临时文件
- 需要断言测试结果

#### cli-runner.ts
**用途**: 编程方式运行 CLI 并捕获输出

**主要导出**:
```typescript
// 基础运行
runCLI(args, options): Promise<CLIRunResult>
runSimpleCommand(command, options): Promise<string>

// 交互式
class InteractiveCLISession { ... }

// 模拟
simulateInteraction(inputs, options): Promise<CLIRunResult>
```

**适用场景**:
- 测试 CLI 命令输出
- 需要捕获 stdout/stderr
- 需要交互式测试

#### mock-server.ts
**用途**: 模拟 Anthropic API 服务器

**主要导出**:
```typescript
class MockApiServer {
  start(), stop()
  setTextResponse(), setToolUseResponse()
  setResponseHandler()
  getRequests(), getLastRequest()
}
```

**适用场景**:
- 测试 API 集成
- 不需要真实 API 密钥
- 需要可预测的响应
- 需要验证请求内容

### 测试套件

#### cli-basic.test.ts (12 个测试)
测试基础 CLI 功能：
1. ✅ 版本信息 (--version, -v)
2. ✅ 帮助信息 (--help, -h)
3. ✅ 打印模式 (-p)
4. ✅ 模型选择 (-m)
5. ✅ 详细模式 (--verbose)
6. ✅ JSON 输出
7. ✅ API 密钥验证
8. ✅ 调试模式 (-d)
9. ✅ 工作目录
10. ✅ 无效参数
11. ✅ 短标志
12. ✅ 参数组合

**运行**: `npm run test:e2e:basic`

#### cli-session.test.ts (8 个测试)
测试会话管理功能：
1. ✅ 创建新会话
2. ✅ 保存历史
3. ✅ 恢复会话 (--resume)
4. ✅ 列表会话
5. ✅ 指定 ID 恢复
6. ✅ 过期处理
7. ✅ 工作目录保存
8. ✅ 成本统计

**运行**: `npm run test:e2e:session`

#### cli-tools.test.ts (11 个测试)
测试工具调用：
1. ✅ Read 工具
2. ✅ Write 工具
3. ✅ Edit 工具
4. ✅ Bash 工具
5. ✅ Glob 工具
6. ✅ Grep 工具
7. ✅ TodoWrite 工具
8. ✅ 工具过滤
9. ✅ 工具黑名单
10. ✅ 多轮调用
11. ✅ WebFetch 工具

**运行**: `npm run test:e2e:tools`

### 辅助工具

#### run-all.ts
**用途**: 运行所有测试套件并生成报告

**功能**:
- 串行运行所有测试
- 统计通过/失败
- 计算耗时
- 生成总结报告

**运行**: `npm run test:e2e`

#### example.test.ts (5 个示例)
**用途**: 演示如何编写测试

**包含示例**:
1. 简单文本响应测试
2. 文件操作测试
3. 交互式会话测试
4. 自定义响应处理器
5. 请求内容验证

**运行**: `tsx tests/e2e/example.test.ts`

### 文档

#### README.md (650 行)
**最全面的文档**

包含内容:
- 目录结构
- 快速开始
- 框架组件详解
- 测试文件说明
- 编写新测试教程
- 断言函数参考
- Mock 服务器配置
- 测试最佳实践
- 调试指南
- CI/CD 集成
- 故障排除
- 扩展框架

**适合**: 深入学习和参考

#### QUICK_START.md (150 行)
**5 分钟快速入门**

包含内容:
- 运行测试
- 编写第一个测试
- 常用模式
- 断言函数
- Mock 服务器
- 调试技巧
- 常见问题

**适合**: 快速上手

#### IMPLEMENTATION.md (400 行)
**技术实现报告**

包含内容:
- 任务概述
- 实现内容
- 核心 API
- 统计数据
- 使用方法
- 技术特点
- 集成指南
- 最佳实践
- 扩展指南
- 已知限制
- 未来改进

**适合**: 了解技术细节和架构

## 统计数据

### 代码量
- **总行数**: ~2,940 行
- **核心框架**: ~980 行
- **测试代码**: ~1,210 行
- **文档**: ~1,200 行

### 测试覆盖
- **测试套件**: 3 个
- **测试用例**: 31 个
- **示例**: 5 个
- **总计**: 36 个测试

### 文件数量
- **框架文件**: 3 个
- **测试文件**: 4 个
- **工具文件**: 2 个
- **文档文件**: 4 个
- **总计**: 13 个文件

## 使用流程

### 1️⃣ 新手入门
```
QUICK_START.md → example.test.ts → 编写第一个测试
```

### 2️⃣ 深入学习
```
README.md → 各个核心文件 → 编写复杂测试
```

### 3️⃣ 参考实现
```
cli-*.test.ts → 学习测试模式 → 应用到自己的测试
```

### 4️⃣ 扩展框架
```
IMPLEMENTATION.md → 了解架构 → 添加新功能
```

## 快速命令参考

```bash
# 运行所有测试
npm run test:e2e

# 运行特定测试
npm run test:e2e:basic
npm run test:e2e:session
npm run test:e2e:tools

# 手动运行
tsx tests/e2e/cli-basic.test.ts
tsx tests/e2e/run-all.ts
tsx tests/e2e/example.test.ts

# 构建项目
npm run build

# 开发模式
npm run dev
```

## 依赖关系

```
package.json
  └── scripts
      ├── test:e2e → run-all.ts
      ├── test:e2e:basic → cli-basic.test.ts
      ├── test:e2e:session → cli-session.test.ts
      └── test:e2e:tools → cli-tools.test.ts

run-all.ts
  ├── cli-basic.test.ts
  ├── cli-session.test.ts
  └── cli-tools.test.ts

*.test.ts
  ├── setup.ts
  ├── cli-runner.ts
  └── mock-server.ts
```

## 最后更新

- **日期**: 2025-12-25
- **版本**: 1.0.0
- **状态**: ✅ 生产就绪

## 相关链接

- [主项目文档](../../README.md)
- [AXON.md](../../AXON.md)
- [单元测试](../config.test.ts)

---

**Happy Testing! 🎉**
