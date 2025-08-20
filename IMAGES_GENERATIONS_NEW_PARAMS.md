# 图像生成API新参数支持

## 概述

`/v1/images/generations` 端点现已支持更多图像生成参数，以兼容更多的图像生成模型（如 flux-kontext-pro 等）。

## 新增参数

### 1. **aspect_ratio** (长宽比)
- **类型**: string
- **描述**: 指定生成图像的长宽比
- **支持格式**:
  - 常见比例: `"1:1"`, `"4:3"`, `"3:4"`, `"16:9"`, `"9:16"`, `"21:9"`, `"9:21"`
  - 扩展比例: `"2:3"`, `"3:2"`, `"5:4"`, `"4:5"`, `"3:1"`, `"1:3"`, `"2:1"`, `"1:2"`
  - 自定义比例: 数字:数字格式，如 `"1024:768"`
- **示例**: `"aspect_ratio": "1:1"`

### 2. **seed** (随机种子)
- **类型**: integer (可选)
- **范围**: 0 - 4294967295
- **描述**: 用于生成可重现的图像结果
- **示例**: `"seed": 1234567`

### 3. **webhook_url** (Webhook回调地址)
- **类型**: string
- **格式**: 有效的HTTP/HTTPS URL 或 "null"
- **描述**: 图像生成完成后的回调地址
- **示例**: `"webhook_url": "https://your-server.com/webhook"`

### 4. **webhook_secret** (Webhook密钥)
- **类型**: string
- **描述**: 用于验证Webhook回调的密钥
- **示例**: `"webhook_secret": "your_secret_key"`

### 5. **prompt_upsampling** (提示词优化)
- **类型**: boolean
- **描述**: 是否启用AI提示词优化
- **默认值**: false
- **示例**: `"prompt_upsampling": true`

### 6. **safety_tolerance** (安全容忍度)
- **类型**: integer
- **范围**: 0 - 6
- **描述**: 内容安全检查的容忍度，数值越高越宽松
- **示例**: `"safety_tolerance": 2`

## 完整请求示例

### 基础请求（使用新参数）
```json
{
    "model": "flux-kontext-pro",
    "prompt": "A beautiful sunset over mountains",
    "aspect_ratio": "16:9",
    "seed": 42,
    "output_format": "jpeg",
    "prompt_upsampling": true,
    "safety_tolerance": 2
}
```

### 带Webhook的请求
```json
{
    "model": "flux-kontext-pro", 
    "prompt": "https://oss.ffire.cc/files/kling_watermark.png 让这个女人带上墨镜，衣服换个颜色",
    "seed": 0,
    "aspect_ratio": "1:1",
    "output_format": "jpeg",
    "webhook_url": "https://your-api.com/webhook/image-complete",
    "webhook_secret": "your_webhook_secret_key",
    "prompt_upsampling": false,
    "safety_tolerance": 2
}
```

### 传统OpenAI格式（兼容）
```json
{
    "model": "dall-e-3",
    "prompt": "A futuristic cityscape",
    "size": "1024x1024", 
    "quality": "hd",
    "n": 1
}
```

## 参数验证规则

### aspect_ratio 验证
- 必须是 `width:height` 格式
- 支持预定义的常见比例
- 自定义比例的数字部分不能超过4位
- 不能包含非数字字符（除了冒号）

### seed 验证
- 必须是0到4294967295之间的整数
- 超出范围将返回错误

### safety_tolerance 验证  
- 必须是0到6之间的整数
- 0表示最严格，6表示最宽松

### webhook_url 验证
- 必须是有效的HTTP或HTTPS URL
- 特殊值 "null" 表示不使用webhook

## 向后兼容性

所有原有参数继续支持：
- `model`, `prompt`, `n`, `size`, `quality`
- `response_format`, `style`, `user`
- `background`, `moderation`, `output_format`
- `watermark` (特定渠道)

## 错误响应

### 参数验证错误示例

#### 无效的长宽比
```json
{
    "error": {
        "message": "aspect_ratio must be in format like '1:1', '16:9', '4:3', '3:4', '9:16'",
        "type": "invalid_request_error"
    }
}
```

#### 种子值超出范围
```json
{
    "error": {
        "message": "seed must be between 0 and 4294967295", 
        "type": "invalid_request_error"
    }
}
```

#### 安全容忍度超出范围
```json
{
    "error": {
        "message": "safety_tolerance must be between 0 and 6",
        "type": "invalid_request_error"
    }
}
```

#### 无效的Webhook URL
```json
{
    "error": {
        "message": "webhook_url must be a valid HTTP or HTTPS URL",
        "type": "invalid_request_error"
    }
}
```

## 渠道适配

不同的图像生成渠道可能支持不同的参数子集：

- **OpenAI DALL-E**: 主要支持传统参数 (size, quality, style)
- **Flux系列**: 支持 aspect_ratio, seed, safety_tolerance 等
- **其他渠道**: 根据具体API支持相应参数

系统会自动将请求参数转换为目标渠道支持的格式。

## 使用建议

1. **长宽比优先**: 对于新模型，推荐使用 `aspect_ratio` 而不是 `size`
2. **种子复用**: 使用相同的 `seed` 和 `prompt` 可以生成相似的图像
3. **异步处理**: 对于大型模型，建议使用 `webhook_url` 进行异步处理
4. **安全策略**: 根据应用场景调整 `safety_tolerance` 级别
5. **提示词优化**: 对于复杂提示词，可以启用 `prompt_upsampling`

## 注意事项

- 新参数为可选参数，不影响现有API调用
- 部分参数可能仅在特定渠道生效
- Webhook功能需要确保回调URL的可访问性
- 种子值相同不能保证在不同渠道间产生相同图像
