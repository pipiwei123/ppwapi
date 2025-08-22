# 可灵 API 快速参考

## `/v1/video/generations` 接口

### ✅ **是的，有这个接口！**

可灵支持标准的 `/v1/video/generations` 接口，这是一个通用的视频生成接口。

## 🚀 快速开始

### 基本请求

```bash
curl -X POST "https://your-api-endpoint/v1/video/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-v1-6",
    "prompt": "一只小猫在花园里玩耍",
    "duration": 5.0,
    "width": 1280,
    "height": 720
  }'
```

### 图生视频请求

```bash
curl -X POST "https://your-api-endpoint/v1/video/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-v2-master",
    "prompt": "让图中的人物动起来",
    "image": "https://example.com/image.jpg",
    "duration": 5.0,
    "metadata": {
      "mode": "pro",
      "cfg_scale": 0.7
    }
  }'
```

### 虚拟试衣请求

```bash
curl -X POST "https://your-api-endpoint/v1/video/generations" \
  -H "Authorization: sk-xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-v2-master",
    "prompt": "这个人穿上一件红色连衣裙，保持原有姿势",
    "image": "https://example.com/person.jpg",
    "duration": 3.0,
    "metadata": {
      "mode": "pro",
      "cfg_scale": 0.8,
      "aspect_ratio": "9:16"
    }
  }'
```

## 📋 参数说明

| 参数 | 类型 | 必填 | 描述 |
|-----|------|------|------|
| `model` | string | 否 | 模型名称：`kling-v1`, `kling-v1-6`, `kling-v2-master` |
| `prompt` | string | 是 | 文本描述 |
| `image` | string | 否 | 图片URL或Base64（图生视频时使用） |
| `duration` | float64 | 是 | 视频时长（秒） |
| `width` | int | 否 | 宽度（像素） |
| `height` | int | 否 | 高度（像素） |
| `metadata` | object | 否 | 扩展参数 |

### metadata 参数

| 参数 | 类型 | 描述 |
|-----|------|------|
| `mode` | string | 生成模式：`std`（标准）, `pro`（高品质） |
| `cfg_scale` | float64 | 遵循度：0-1，越高越严格遵循提示词 |
| `aspect_ratio` | string | 宽高比：`16:9`, `9:16`, `1:1` |
| `negative_prompt` | string | 负面提示词 |

## 📤 响应格式

### 成功响应
```json
{
  "task_id": "cls2a3b4c5d6e7f8g9h0i1j2"
}
```

### 查询任务状态
```bash
curl -X GET "https://your-api-endpoint/v1/video/generations/cls2a3b4c5d6e7f8g9h0i1j2" \
  -H "Authorization: sk-xxxxxxxxxxxxxx"
```

### 状态响应
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
    "height": 720
  }
}
```

## 🎯 使用场景

1. **文本生成视频**：只需提供 `prompt`
2. **图片生成视频**：提供 `prompt` + `image`
3. **虚拟试衣**：使用人物图片 + 换装描述

## ⚡ 其他可灵接口

如果需要更多功能，还可以使用：

- `/kling/v1/videos/text2video` - 可灵专用文生视频接口
- `/kling/v1/videos/image2video` - 可灵专用图生视频接口

这些接口支持更多可灵特有的参数，如相机控制等。

## 🔧 渠道配置

- **渠道类型**：50 (Kling)
- **密钥格式**：`access_key|secret_key`
- **Base URL**：`https://api.klingai.com`

## 📞 需要帮助？

查看完整文档：[docs/models/Kling.md](./models/Kling.md)
