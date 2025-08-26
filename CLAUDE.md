# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Go 和 React 的多平台 AI API 代理服务，类似于 OneAPI，支持多种 AI 服务提供商的统一接口管理。

## 开发命令

### 后端开发
```bash
# 运行后端开发服务器
go run main.go

# 或使用 Makefile
make start-backend
```

### 前端开发
```bash
# 进入前端目录
cd web

# 安装依赖 (使用 bun)
bun install

# 开发模式
bun run dev

# 构建前端
bun run build

# 代码格式化
bun run lint:fix

# 或使用 Makefile 构建前端
make build-frontend
```

### 完整构建
```bash
# 构建前端并启动后端
make all
```

### Docker 部署
```bash
# 使用 docker-compose 部署完整环境
docker-compose up -d
```

## 项目架构

### 后端架构 (Go)

- **入口**: `main.go` - 应用程序主入口，初始化资源和路由
- **路由层**: `router/` - API 路由定义，分为 API、Dashboard、Relay、Video、Web 路由
- **控制器层**: `controller/` - 处理 HTTP 请求和响应
- **模型层**: `model/` - 数据库模型定义和操作
- **中间件**: `middleware/` - 认证、CORS、限流、日志等中间件
- **服务层**: `service/` - 业务逻辑处理
- **数据传输**: `dto/` - 数据传输对象定义

### 核心功能模块

1. **多平台 AI 接入**: `relay/channel/` - 支持 OpenAI、Claude、Gemini、百度、智谱等 30+ AI 平台
2. **代理转发**: `relay/` - 请求转发和响应处理
3. **用户管理**: 用户认证、权限控制、配额管理
4. **渠道管理**: AI 服务商渠道配置和监控
5. **计费系统**: 使用量统计和计费
6. **任务系统**: 异步任务处理，支持文生图、视频生成等

### 前端架构 (React)

- **框架**: React 18 + Vite
- **UI 组件库**: Semi UI (@douyinfe/semi-ui)
- **状态管理**: React Context API
- **路由**: React Router DOM
- **图表**: VChart (@visactor/react-vchart)
- **国际化**: i18next
- **构建工具**: Vite + TypeScript

### 数据库支持

- SQLite (默认开发环境)
- MySQL (生产环境推荐)
- PostgreSQL
- Redis (缓存和会话存储)

## 重要配置

### 环境变量
- `GIN_MODE`: Gin 框架模式 (debug/release)
- `SQL_DSN`: 数据库连接字符串
- `REDIS_CONN_STRING`: Redis 连接字符串
- `SESSION_SECRET`: 会话密钥
- `NODE_TYPE`: 节点类型 (master/slave)
- `FRONTEND_BASE_URL`: 前端基础URL

### 开发注意事项

1. **模块路径**: 所有 Go 导入使用 `one-api/` 前缀
2. **前端代理**: web/package.json 中配置了代理到 localhost:3000
3. **数据库迁移**: 程序启动时自动处理数据库初始化
4. **日志**: 使用内置日志系统，支持文件和控制台输出
5. **API 版本**: 支持 v1 API，兼容 OpenAI API 格式

### 测试
- 项目中没有标准的单元测试框架
- 主要通过 `controller/channel-test.go` 和 `controller/misc.go` 中的 TestStatus 等函数进行功能测试