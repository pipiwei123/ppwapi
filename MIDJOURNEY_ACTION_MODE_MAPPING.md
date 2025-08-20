# Midjourney 动作和模式映射关系

## 概述

本文档说明了 Midjourney API 中动作和模式之间的映射关系，支持快速、慢速和超快速模式与各种动作的组合。

## 映射规则

### 1. 标准动作模型
```
mj_imagine      -> IMAGINE
mj_upscale      -> UPSCALE
mj_variation    -> VARIATION
mj_describe     -> DESCRIBE
mj_blend        -> BLEND
mj_reroll       -> REROLL
... 等等
```

### 2. 快速模式动作模型
```
mj_fast_imagine     -> IMAGINE (fast模式)
mj_fast_upscale     -> UPSCALE (fast模式) 
mj_fast_variation   -> VARIATION (fast模式)
mj_fast_describe    -> DESCRIBE (fast模式)
mj_fast_blend       -> BLEND (fast模式)
mj_fast_reroll      -> REROLL (fast模式)
... 等等
```

### 3. 慢速模式动作模型
```
mj_relax_imagine    -> IMAGINE (relax模式)
mj_relax_upscale    -> UPSCALE (relax模式)
mj_relax_variation  -> VARIATION (relax模式)
mj_relax_describe   -> DESCRIBE (relax模式)
mj_relax_blend      -> BLEND (relax模式)
mj_relax_reroll     -> REROLL (relax模式)
... 等等
```

### 4. 超快模式动作模型
```
mj_turbo_imagine    -> IMAGINE (turbo模式)
mj_turbo_upscale    -> UPSCALE (turbo模式)
mj_turbo_variation  -> VARIATION (turbo模式)
mj_turbo_describe   -> DESCRIBE (turbo模式)
mj_turbo_blend      -> BLEND (turbo模式)
mj_turbo_reroll     -> REROLL (turbo模式)
... 等等
```

## 支持的所有动作

系统支持以下所有动作的模式组合：

- `imagine` - 生成图像
- `describe` - 描述图像
- `blend` - 混合图像
- `upscale` - 放大图像
- `variation` - 变体生成
- `reroll` - 重新生成
- `modal` - 模态操作
- `inpaint` - 图像修复
- `zoom` - 缩放操作
- `custom_zoom` - 自定义缩放
- `shorten` - 缩短提示词
- `high_variation` - 高变体
- `low_variation` - 低变体
- `pan` - 平移操作
- `swap_face` - 换脸
- `upload` - 上传
- `video` - 视频生成
- `edits` - 编辑操作

## 使用示例

### API 调用示例

#### 1. 标准速度放大
```bash
curl -X POST /mj/submit/upscale \
  -H "Content-Type: application/json" \
  -d '{"model": "mj_upscale", "prompt": "..."}'
```

#### 2. 快速模式放大
```bash
curl -X POST /mj/submit/upscale \
  -H "Content-Type: application/json" \
  -d '{"model": "mj_fast_upscale", "prompt": "..."}'
```

#### 3. 慢速模式放大（更便宜）
```bash
curl -X POST /mj/submit/upscale \
  -H "Content-Type: application/json" \
  -d '{"model": "mj_relax_upscale", "prompt": "..."}'
```

#### 4. 超快模式生成（最快最贵）
```bash
curl -X POST /mj/submit/imagine \
  -H "Content-Type: application/json" \
  -d '{"model": "mj_turbo_imagine", "prompt": "cute cat"}'
```

## 兼容性

### 向后兼容
系统仍然支持旧版本的模式映射：
- `mj-relax` -> `mj_imagine` (relax模式)
- `mj-fast` -> `mj_imagine` (fast模式)  
- `mj-turbo` -> `mj_imagine` (turbo模式)

### 自动转换
系统会自动处理模型名称转换：
- `mj_fast_upscale` -> 基础动作：`mj_upscale`，模式：`fast`
- `mj_relax_variation` -> 基础动作：`mj_variation`，模式：`relax`
- `mj_turbo_describe` -> 基础动作：`mj_describe`，模式：`turbo`

## 辅助函数

系统提供了以下辅助函数来处理模型映射：

### ExtractModeFromModel(model string) string
从模型名称提取模式。

### ConvertModeModelToStandard(model string) string  
将带模式的模型名称转换为标准模型名称。

### ParseModelNameAndMode(model string) (baseAction string, mode string)
解析模型名称，返回基础动作和模式。

### IsModelSupportMode(model string) bool
检查模型是否支持指定模式。

### GenerateModeModel(baseAction string, mode string) string
生成带模式的模型名称。

## 价格和速度对比

| 模式 | 速度 | 价格 | 适用场景 |
|------|------|------|----------|
| 标准 | 中等 | 中等 | 日常使用 |
| relax | 慢 | 便宜 | 大批量处理，不急 |
| fast | 快 | 贵 | 需要快速结果 |
| turbo | 最快 | 最贵 | 紧急任务，实时预览 |

## 注意事项

1. **模式参数注入**：系统会自动在prompt中注入对应的模式参数（如 `--fast`、`--relax`、`--turbo`）
2. **成本控制**：建议优先使用 relax 模式来降低成本
3. **兼容性**：新版本完全兼容旧版本的调用方式
4. **错误处理**：不支持的模型组合会返回相应的错误信息
