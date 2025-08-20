# Midjourney 模式映射功能

## 📋 功能说明

支持通过模型名称自动映射到对应的Midjourney模式，无需手动设置路径参数。

## 🗺️ 模型映射关系

| 模型名称 | 对应模式 | 效果 |
|----------|----------|------|
| `mj-relax` | `relax` | 慢速模式 (10-15分钟，便宜) |
| `mj-fast` | `fast` | 快速模式 (2-5分钟，标准价格) |
| `mj-turbo` | `turbo` | 超快模式 (1-2分钟，昂贵) |

## 🚀 使用方法

### 方法一：使用新的模型名称 (推荐)
```bash
curl --request POST \
  --url https://api.apicore.ai/mj/submit/imagine \
  --header 'Authorization: Bearer sk-your-token' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "mj-relax",
    "prompt": "Cat sitting on a rainbow"
  }'
```

### 方法二：传统路径模式
```bash
curl --request POST \
  --url https://api.apicore.ai/relax/mj/submit/imagine \
  --header 'Authorization: Bearer sk-your-token' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "mj_imagine",
    "prompt": "Cat sitting on a rainbow"
  }'
```

### 方法三：Prompt参数模式
```bash
curl --request POST \
  --url https://api.apicore.ai/mj/submit/imagine \
  --header 'Authorization: Bearer sk-your-token' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "mj_imagine",
    "prompt": "Cat sitting on a rainbow --relax"
  }'
```

## 🔧 技术实现

### 1. 模型映射 (`constant/midjourney.go`)
```go
// 模型名称到模式的映射
var MidjourneyModel2Mode = map[string]string{
    "mj-relax": "relax",
    "mj-fast":  "fast", 
    "mj-turbo": "turbo",
}
```

### 2. 中间件处理 (`middleware/distributor.go`)
- 提取路径中的 `:mode` 参数
- 从模型名称中提取模式信息
- 设置 `mj_mode` 上下文变量

### 3. 服务层处理 (`service/midjourney.go`)
- 根据模式自动添加对应的prompt参数
- 支持模式清理和注入逻辑

## 💡 优势

1. **向后兼容**：所有现有的调用方式仍然有效
2. **简化调用**：客户端只需改变模型名称，无需修改URL
3. **统一接口**：所有模式都使用相同的API端点
4. **灵活配置**：支持多种模式设置方式

## 📝 注意事项

1. 模型映射优先级：模型名称 > 路径参数 > prompt参数
2. 如果同时设置多个模式，以模型名称为准
3. 系统会自动清理冲突的模式参数
4. 建议使用新的模型名称方式，更简洁易用

## 🧪 测试用例

### 测试慢速模式
```json
{
  "model": "mj-relax",
  "prompt": "beautiful sunset"
}
```
预期：prompt会自动添加 `--relax` 参数

### 测试快速模式  
```json
{
  "model": "mj-fast", 
  "prompt": "cute cat"
}
```
预期：prompt会自动添加 `--fast` 参数

### 测试超快模式
```json
{
  "model": "mj-turbo",
  "prompt": "amazing landscape"
}
```
预期：prompt会自动添加 `--turbo` 参数