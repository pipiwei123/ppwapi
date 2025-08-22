# 可灵 (Kling) 视频生成 API 文档

可灵 AI 是一个强大的视频生成服务，支持文本生成视频和图片生成视频功能。

## 📋 目录

- [支持的接口](#支持的接口)
- [模型列表](#模型列表)
- [接口详情](#接口详情)
  - [通用视频生成接口](#通用视频生成接口)
  - [可灵专用接口](#可灵专用接口)
- [渠道配置](#渠道配置)
- [错误码说明](#错误码说明)

## 🔌 支持的接口

### 1. 通用视频生成接口
- **POST** `/v1/video/generations` - 创建视频生成任务
- **GET** `/v1/video/generations/{task_id}` - 查询任务状态

### 2. 可灵专用接口
- **POST** `/kling/v1/videos/text2video` - 文本生成视频
- **POST** `/kling/v1/videos/image2video` - 图片生成视频

### 3. 特殊功能
- **虚拟试衣 (Virtual Try-on)** - 支持服装、配饰等虚拟换装

## 🎯 模型列表

| 模型名称 | 描述 | 特点 |
|---------|------|------|
| `kling-v1` | 可灵 V1 基础版本 | 标准质量，快速生成 |
| `kling-v1-6` | 可灵 V1.6 版本 | 改进的质量和稳定性 |
| `kling-v2-master` | 可灵 V2 主版本 | 最新技术，最高质量 |

## 📖 接口详情

### 通用视频生成接口

#### 创建视频生成任务

**请求地址：** `POST /v1/video/generations`

**请求头：**
```http
Authorization: sk-xxxxxxxxxxxxxx
Content-Type: application/json
```

**请求参数：**

| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|-------|------|------|------|-------|
| `model` | string | 否 | 模型名称 | `"kling-v1"` |
| `prompt` | string | 是 | 文本描述 | `"一只小猫在花园里玩耍"` |
| `image` | string | 否 | 参考图片URL或Base64 | `"https://example.com/image.jpg"` |
| `duration` | float64 | 是 | 视频时长（秒） | `5.0` |
| `width` | int | 否 | 视频宽度 | `1280` |
| `height` | int | 否 | 视频高度 | `720` |
| `fps` | int | 否 | 帧率 | `30` |
| `seed` | int | 否 | 随机种子 | `12345` |
| `n` | int | 否 | 生成数量 | `1` |
| `response_format` | string | 否 | 响应格式 | `"url"` |
| `metadata` | object | 否 | 扩展参数 | 见下方说明 |

**metadata 扩展参数：**

| 参数名 | 类型 | 描述 | 示例值 |
|-------|------|------|-------|
| `negative_prompt` | string | 负面提示词 | `"模糊，低质量"` |
| `cfg_scale` | float64 | 生成遵循度 (0-1) | `0.7` |
| `mode` | string | 生成模式 (`std`/`pro`) | `"std"` |
| `aspect_ratio` | string | 宽高比 | `"16:9"` |
| `callback_url` | string | 回调地址 | `"https://example.com/callback"` |
| `external_task_id` | string | 自定义任务ID | `"my-task-001"` |

**请求示例：**

```json
{
  "model": "kling-v1-6",
  "prompt": "一只可爱的小猫在阳光明媚的花园里追逐蝴蝶，画面温馨美好",
  "duration": 5.0,
  "width": 1280,
  "height": 720,
  "metadata": {
    "negative_prompt": "模糊，低质量，扭曲",
    "cfg_scale": 0.7,
    "mode": "pro",
    "aspect_ratio": "16:9"
  }
}
```

**响应示例：**

```json
{
  "task_id": "cls2a3b4c5d6e7f8g9h0i1j2"
}
```

#### 查询任务状态

**请求地址：** `GET /v1/video/generations/{task_id}`

**请求头：**
```http
Authorization: sk-xxxxxxxxxxxxxx
```

**响应示例：**

```json
{
  "task_id": "cls2a3b4c5d6e7f8g9h0i1j2",
  "status": "succeeded",
  "url": "https://storage.klingai.com/videos/example.mp4",
  "format": "mp4",
  "metadata": {
    "duration": 5.0,
    "fps": 30,
    "width": 1280,
    "height": 720,
    "seed": 12345
  }
}
```

**任务状态说明：**

| 状态 | 描述 |
|-----|------|
| `submitted` | 已提交 |
| `processing` | 处理中 |
| `succeeded` | 成功 |
| `failed` | 失败 |

### 可灵专用接口

#### 文本生成视频

**请求地址：** `POST /kling/v1/videos/text2video`

**请求参数：**

```json
{
  "model_name": "kling-v1-6",
  "prompt": "一只小猫在月光下奔跑",
  "negative_prompt": "黑暗的场景",
  "cfg_scale": 0.7,
  "mode": "pro",
  "aspect_ratio": "16:9",
  "duration": "5",
  "camera_control": {
    "type": "simple",
    "config": {
      "horizontal": 2.5,
      "vertical": 0,
      "pan": 0,
      "tilt": 0,
      "roll": 0,
      "zoom": 0
    }
  },
  "callback_url": "https://your.domain/callback",
  "external_task_id": "custom-task-001"
}
```

#### 图片生成视频

**请求地址：** `POST /kling/v1/videos/image2video`

**请求参数：**

```json
{
  "model_name": "kling-v2-master",
  "image": "https://example.com/image.jpg",
  "prompt": "让图中的小猫动起来，在花园里玩耍",
  "negative_prompt": "模糊，低质量",
  "cfg_scale": 0.7,
  "mode": "std",
  "aspect_ratio": "16:9",
  "duration": "5",
  "callback_url": "https://your.domain/callback",
  "external_task_id": "custom-task-002"
}
```

**响应格式：**

```json
{
  "code": 0,
  "message": "成功",
  "request_id": "Cl6Mq2bftxoAAAAAAA_SxQ",
  "data": {
    "task_id": "Cl6Mq2bftxoAAAAAAA_SxQ",
    "task_status": "submitted",
    "created_at": 1725974776706,
    "updated_at": 1725974776706
  }
}
```

#### 虚拟试衣 (Virtual Try-on)

虚拟试衣是可灵 AI 的特色功能，可以让人物换装、试穿不同的服饰。

**使用方式：** 通过 `/kling/v1/videos/image2video` 接口实现

**请求示例：**

```json
{
  "model_name": "kling-v2-master",
  "image": "https://example.com/person-image.jpg",
  "prompt": "这个人穿上一件红色的连衣裙，保持原有的姿势和表情",
  "negative_prompt": "模糊，变形，不自然",
  "cfg_scale": 0.8,
  "mode": "pro",
  "aspect_ratio": "9:16",
  "duration": "3",
  "metadata": {
    "style": "fashion",
    "quality": "high",
    "try_on": true
  }
}
```

**虚拟试衣提示词建议：**

1. **服装替换：**
   - `"将图中人物的衣服换成蓝色牛仔裤和白色T恤"`
   - `"让这个人穿上正式的西装，保持原有姿势"`
   - `"为图中的女性换上优雅的晚礼服"`

2. **配饰添加：**
   - `"为这个人戴上时尚的太阳镜"`
   - `"给图中人物加上一顶帽子"`
   - `"为她戴上精美的项链和耳环"`

3. **风格变换：**
   - `"将图中人物的造型改为韩式风格"`
   - `"让这个人的穿搭变成复古风格"`
   - `"改为商务正装的造型"`

**注意事项：**
- 原始图片中的人物姿势要清晰
- 建议使用高分辨率的人物图片
- 避免过于复杂的背景
- 提示词要具体描述想要的服装风格

## ⚙️ 渠道配置

### 渠道类型
- **渠道类型：** `50` (Kling)

### 配置方式

#### 1. 官方可灵 API 配置

**密钥格式：**
```
access_key|secret_key
```

**配置示例：**
- **渠道名称：** 可灵AI官方
- **Base URL：** `https://api.klingai.com`
- **密钥：** `your_access_key|your_secret_key`
- **模型：** `kling-v1,kling-v1-6,kling-v2-master`

#### 2. 第三方代理配置

**密钥格式：**
```
sk-xxxxxxxxxxxxxx
```

**配置示例：**
- **渠道名称：** rix_kling (第三方代理)
- **Base URL：** `https://api.ephone.chat/kling`
- **密钥：** `sk-Z4hKBYAEcL9IkaypMi3mlawoMvzXWtQLgA997La5uGNniPza`
- **模型：** `kling_image,kling_video,kling_extend,kling_effects,kling_lip_sync,kling_virtual_try_on,kling_image_expand`

### 自动检测机制

系统会根据 Base URL 自动检测使用哪种认证方式：

- **官方域名** (`api.klingai.com`, `klingai.com`, `kling.kuaishou.com`)：使用 JWT 认证
- **第三方域名**：直接使用 Bearer Token 认证

### JWT 认证

可灵 API 使用 JWT 认证方式：

```javascript
// JWT Token 结构
{
  "iss": "access_key",     // 签发者（access_key）
  "exp": now + 1800,       // 过期时间（30分钟）
  "nbf": now - 5,          // 生效时间
  "typ": "JWT"             // 令牌类型
}
```

## 🔄 宽高比映射

| 输入尺寸 | 宽高比 |
|---------|-------|
| `1024x1024`, `512x512` | `1:1` |
| `1280x720`, `1920x1080` | `16:9` |
| `720x1280`, `1080x1920` | `9:16` |
| 其他 | `1:1` (默认) |

## ❌ 错误码说明

### 常见错误

| 错误码 | 描述 | 解决方案 |
|-------|------|----------|
| `400` | 请求参数错误 | 检查必填参数和参数格式 |
| `401` | 认证失败 | 检查 API 密钥格式和有效性 |
| `403` | 无权限 | 检查账户余额和权限设置 |
| `429` | 请求过于频繁 | 降低请求频率 |
| `500` | 服务器内部错误 | 稍后重试或联系技术支持 |

### 任务状态错误

```json
{
  "task_id": "cls2a3b4c5d6e7f8g9h0i1j2",
  "status": "failed",
  "error": {
    "code": 4001,
    "message": "视频生成失败：提示词包含不当内容"
  }
}
```

## 📝 使用建议

### 1. 提示词优化
- 使用具体、详细的描述
- 避免模糊或矛盾的表达
- 添加风格、情感等修饰词

### 2. 参数调优
- `cfg_scale`: 0.5-0.8 通常效果较好
- `mode`: `pro` 模式质量更高但耗时更长
- `duration`: 建议 3-10 秒，避免过长

### 3. 性能优化
- 合理设置视频分辨率
- 使用回调 URL 避免轮询
- 批量提交时控制并发数

### 4. 错误处理
- 实现重试机制
- 监控任务状态变化
- 及时处理失败任务

## 🔗 相关链接

- [可灵AI官网](https://klingai.com)
- [API文档](https://app.klingai.com/cn/dev/document-api)
- [控制台](https://app.klingai.com/cn/dev/key)

## 📞 技术支持

如有问题，请联系：
- 官方文档：[API参考](https://app.klingai.com/cn/dev/document-api/apiReference/commonInfo)
- 技术交流：查看官方开发者社区
