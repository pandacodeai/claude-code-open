# 计划：将 GenerateDesign 重构为通用图片生成工具 GenerateImage

## 目标
将限死于"UI 设计图"场景的 GenerateDesign 工具重构为通用的 GenerateImage 工具，支持在任何场景下生成任何类型的图片。

## 改动范围（7 个文件）

### 1. `src/tools/generate-design.ts` → 重命名类为 GenerateImageTool

**改动**：
- 类名 `GenerateDesignTool` → `GenerateImageTool`
- 工具名 `'GenerateDesign'` → `'GenerateImage'`
- 接口 `GenerateDesignInput` → `GenerateImageInput`
- 参数从 UI 设计专用（projectName/projectDescription/requirements/constraints/techStack/style）改为通用：
  - `prompt` (string, required) — 图片描述/指令
  - `style` (string, optional) — 风格提示
  - `size` (string, optional) — 尺寸提示（如 'landscape', 'portrait', 'square'）
- description 改为通用图片生成描述
- fallback 消息更新

### 2. `src/web/server/services/gemini-image-service.ts` — 泛化服务

**改动**：
- 新增 `generateImage(prompt: string, style?: string)` 方法（通用入口）
- 保留 `generateDesign()` 作为向后兼容，内部调用 `generateImage()`
- `buildPrompt()` 改为直接使用用户的 prompt，不再硬编码 UI 设计模板
- 缓存 key 改为基于 prompt 的 hash
- 接口类型更新

### 3. `src/web/server/conversation.ts` — 更新工具拦截

**改动**：
- 拦截名从 `'GenerateDesign'` → `'GenerateImage'`
- 读取新参数 `prompt`，传给 `geminiImageService.generateImage()`
- WebSocket 消息 payload 适配新字段（用 prompt 代替 projectName）
- `buildWebuiToolGuidance()` 中的提示词从"UI 设计图"改为"通用图片生成"

### 4. `src/tools/index.ts` — 重新注册工具

**改动**：
- 恢复 import `GenerateImageTool`（之前 GenerateDesignTool 被移除了）
- 在 `registerBlueprintTools()` 中重新注册

### 5. `src/web/client/src/types.ts` — 更新前端类型

**改动**：
- `design_image` 类型中 `projectName` → `title`（通用标题，可选）
- 保持 `imageUrl`, `generatedText` 不变
- `style` 保持

### 6. `src/web/client/src/hooks/useMessageHandler.ts` — 更新消息处理

**改动**：
- `design_image_generated` case 中 payload 读取 `title` 替代 `projectName`

### 7. `src/web/client/src/components/Message.tsx` — 更新渲染

**改动**：
- `design_image` 渲染部分使用 `title` 替代 `projectName`
- 标题文案从 "UI Design" 改为 "Generated Image" 或使用 title
- i18n key `message.designImage` 更新

### 不改动的文件
- `CompactMessage.tsx` — 只显示简短文字，改动最小，跟着 type 字段走
- `BlueprintDetailPanel` — 蓝图面板的 designImages 是独立的数据结构，不受影响

## 新工具 Schema

```typescript
interface GenerateImageInput {
  prompt: string;        // 图片描述（必需）
  style?: string;        // 风格提示（可选，自由文本）
  size?: 'landscape' | 'portrait' | 'square';  // 尺寸方向（可选）
}
```

## 新工具 Description

```
Generate images using Gemini AI. Can create any type of image including:
- UI designs and mockups
- Diagrams and flowcharts
- Illustrations and icons
- Data visualizations
- Any visual content described in the prompt

Requires GEMINI_API_KEY or GOOGLE_API_KEY environment variable.
```

## 执行策略
使用 StartLeadAgent(taskPlan) 一次性改完所有文件。
