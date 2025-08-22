# Flux 模型调用方式文档

Flux 是由 Black Forest Labs 开发的强大图像生成模型，支持多种版本和调用方式。

## 📋 目录

- [支持的模型](#支持的模型)
- [调用接口](#调用接口)
- [渠道配置](#渠道配置)
- [请求示例](#请求示例)
- [参数说明](#参数说明)
- [最佳实践](#最佳实践)

## 🎯 支持的模型

### Flux 模型版本

| 模型名称 | 描述 | 特点 | 渠道支持 |
|---------|------|------|----------|
| `flux-kontext-pro` | Flux Pro 版本 | 高质量图像生成，支持复杂提示词 | 渠道 4, 8 |
| `flux-kontext-max` | Flux Max 版本 | 最高质量，最佳细节表现 | 渠道 8 |
| `flux-1-schnell` | Flux Schnell 版本 | 快速生成，适合实时应用 | 渠道 8 |
| `black-forest-labs/FLUX.1-schnell` | 官方 Schnell 版本 | SiliconFlow 渠道支持 | SiliconFlow |

## 🔌 调用接口

### 标准图像生成接口

使用 OpenAI 兼容的图像生成接口：

**端点：** `POST /v1/images/generations`

## ⚙️ 渠道配置

根据数据库查询结果，系统中配置了以下 Flux 渠道：

### 渠道 4 (gptgod.cloud)
- **渠道名称：** "1"
- **渠道类型：** 1 (OpenAI 兼容)
- **Base URL：** `https://gptgod.cloud`
- **支持模型：** `flux-kontext-pro`

### 渠道 8 (gptgod.cloud - Flux 专用)
- **渠道名称：** "flux"
- **渠道类型：** 1 (OpenAI 兼容)
- **Base URL：** `https://gptgod.cloud`
- **支持模型：** `flux-kontext-max`, `flux-kontext-pro`, `flux-1-schnell`

### SiliconFlow 渠道
- **渠道类型：** SiliconFlow
- **支持模型：** `black-forest-labs/FLUX.1-schnell`

## 📖 请求示例

### 1. 基础文本生成图像

```bash
curl -X POST "https://your-api-endpoint/v1/images/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-kontext-pro",
    "prompt": "A beautiful sunset over mountains, highly detailed, photorealistic",
    "aspect_ratio": "16:9",
    "output_format": "jpeg"
  }'
```

### 2. 高质量图像生成（Max 版本）

```bash
curl -X POST "https://your-api-endpoint/v1/images/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-kontext-max",
    "prompt": "Professional portrait of a young woman, studio lighting, 8K resolution",
    "aspect_ratio": "1:1",
    "seed": 42,
    "safety_tolerance": 2,
    "prompt_upsampling": true
  }'
```

### 3. 快速生成（Schnell 版本）

```bash
curl -X POST "https://your-api-endpoint/v1/images/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-1-schnell",
    "prompt": "Simple cartoon cat, minimalist style",
    "aspect_ratio": "1:1",
    "output_format": "png"
  }'
```

### 4. 带 Webhook 的异步生成

```bash
curl -X POST "https://your-api-endpoint/v1/images/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-kontext-pro",
    "prompt": "Futuristic cityscape at night, neon lights, cyberpunk style",
    "aspect_ratio": "21:9",
    "seed": 12345,
    "webhook_url": "https://your-server.com/webhook/image-complete",
    "webhook_secret": "your_secret_key"
  }'
```

### 5. 图像风格变换

```bash
curl -X POST "https://your-api-endpoint/v1/images/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-kontext-pro",
    "prompt": "https://example.com/image.jpg Transform this person into a renaissance painting style",
    "aspect_ratio": "4:3",
    "prompt_upsampling": false,
    "safety_tolerance": 1
  }'
```

## 🎛️ 参数说明

### 核心参数

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|-------|------|------|------|-------|
| `model` | string | 是 | Flux 模型名称 | `"flux-kontext-pro"` |
| `prompt` | string | 是 | 图像描述文本 | `"A cat sitting on a rainbow"` |

### Flux 专用参数

| 参数名 | 类型 | 描述 | 默认值 | 示例值 |
|-------|------|------|-------|-------|
| `aspect_ratio` | string | 图像宽高比 | `"1:1"` | `"16:9"`, `"3:4"`, `"21:9"` |
| `seed` | integer | 随机种子 (0-4294967295) | 随机 | `42` |
| `output_format` | string | 输出格式 | `"jpeg"` | `"png"`, `"webp"` |
| `safety_tolerance` | integer | 安全容忍度 (0-6) | `2` | `0` (严格) - `6` (宽松) |
| `prompt_upsampling` | boolean | AI 提示词优化 | `false` | `true` |
| `webhook_url` | string | 回调地址 | 无 | `"https://example.com/hook"` |
| `webhook_secret` | string | 回调密钥 | 无 | `"secret123"` |

### 支持的宽高比

| 宽高比 | 描述 | 适用场景 |
|-------|------|----------|
| `"1:1"` | 正方形 | 头像、图标 |
| `"4:3"` | 标准横屏 | 传统照片 |
| `"3:4"` | 标准竖屏 | 肖像照片 |
| `"16:9"` | 宽屏横屏 | 桌面壁纸、横幅 |
| `"9:16"` | 宽屏竖屏 | 手机壁纸、Stories |
| `"21:9"` | 超宽屏 | 影院级横幅 |
| `"2:3"` | 竖向海报 | 书籍封面 |
| `"3:2"` | 横向照片 | 风景照片 |

## 📊 模型特性对比

| 特性 | flux-1-schnell | flux-kontext-pro | flux-kontext-max |
|------|----------------|------------------|------------------|
| **生成速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **图像质量** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **细节表现** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **提示词理解** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **成本** | 💰 | 💰💰 | 💰💰💰 |

## 🎨 最佳实践

### 1. 模型选择建议

- **实时应用**：使用 `flux-1-schnell`
- **常规需求**：使用 `flux-kontext-pro`
- **高质量需求**：使用 `flux-kontext-max`

### 2. 提示词优化

```bash
# ✅ 良好的提示词
"Professional portrait of a young woman, studio lighting, shallow depth of field, 8K resolution, highly detailed"

# ❌ 避免的提示词
"girl pic"
```

### 3. 参数组合建议

**高质量肖像：**
```json
{
  "model": "flux-kontext-max",
  "aspect_ratio": "3:4",
  "safety_tolerance": 1,
  "prompt_upsampling": true
}
```

**快速原型：**
```json
{
  "model": "flux-1-schnell",
  "aspect_ratio": "1:1",
  "prompt_upsampling": false
}
```

**商业用途：**
```json
{
  "model": "flux-kontext-pro",
  "safety_tolerance": 0,
  "seed": 42,
  "webhook_url": "https://your-api.com/webhook"
}
```

### 4. 性能优化

- **并发控制**：避免同时发起过多请求
- **缓存策略**：相同 seed + prompt 会生成相似结果
- **异步处理**：大图像使用 webhook 避免超时
- **格式选择**：JPEG 适合照片，PNG 适合插图

### 5. 错误处理

```javascript
// 处理 Flux API 响应
async function generateFluxImage(prompt, model = 'flux-kontext-pro') {
  try {
    const response = await fetch('/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': 'sk-your-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        aspect_ratio: '16:9',
        safety_tolerance: 2
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Flux API Error: ${error.error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Flux generation failed:', error);
    throw error;
  }
}
```

## 🔍 故障排除

### 常见问题

1. **模型价格未配置**
   ```
   模型 flux-kontext-pro 倍率或价格未配置
   ```
   **解决：** 在管理后台设置模型价格

2. **宽高比格式错误**
   ```
   aspect_ratio must be in format like '1:1', '16:9'
   ```
   **解决：** 使用正确的宽高比格式

3. **种子值超出范围**
   ```
   seed must be between 0 and 4294967295
   ```
   **解决：** 使用有效的种子值范围

### 调试建议

1. **检查渠道状态**：确保 Flux 渠道启用且配置正确
2. **验证 API 密钥**：确保令牌有效且有足够额度
3. **测试简单请求**：从基础参数开始测试
4. **查看错误日志**：检查系统日志了解详细错误信息

## 📞 技术支持

如需帮助，请：
1. 检查 [图像生成新参数文档](../IMAGES_GENERATIONS_NEW_PARAMS.md)
2. 查看系统日志获取详细错误信息
3. 确认渠道配置和模型价格设置
4. 联系系统管理员获取技术支持

---

**注意：** Flux 模型需要相应的渠道配置和模型价格设置才能正常使用。请确保在管理后台正确配置相关参数。
