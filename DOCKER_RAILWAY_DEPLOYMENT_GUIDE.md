# 🐳 Docker & Railway 部署指南

## 📋 概述

由于 Vercel 有文件数量和 API 函数数量的限制，我们提供了 Docker 和 Railway 两种替代部署方案。这两种方案都没有文件数量限制，更适合复杂的项目。

## 🐳 Docker 部署方案

### 优势
- ✅ 无文件数量限制
- ✅ 完全控制运行环境
- ✅ 支持所有 Node.js 功能
- ✅ 可以在任何支持 Docker 的平台部署
- ✅ 本地开发和测试环境一致

### 部署步骤

#### 1. 本地 Docker 部署

```bash
# 1. 构建 Docker 镜像
docker build -t shopify-3d-service .

# 2. 运行容器
docker run -p 3000:3000 \
  -e SHOPIFY_STORE_DOMAIN=your-store.myshopify.com \
  -e SHOPIFY_ACCESS_TOKEN=your_token \
  -e NODE_ENV=production \
  shopify-3d-service

# 3. 访问应用
open http://localhost:3000
```

#### 2. 使用 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SHOPIFY_STORE_DOMAIN=${SHOPIFY_STORE_DOMAIN}
      - SHOPIFY_ACCESS_TOKEN=${SHOPIFY_ACCESS_TOKEN}
      - NODE_ENV=production
    restart: unless-stopped
```

运行：
```bash
docker-compose up -d
```

#### 3. 云平台 Docker 部署

**AWS ECS / Google Cloud Run / Azure Container Instances**

1. 推送镜像到容器注册表
2. 配置环境变量
3. 部署服务

## 🚂 Railway 部署方案

### 优势
- ✅ 无文件数量限制
- ✅ 简单的 Git 集成
- ✅ 自动部署
- ✅ 内置数据库支持
- ✅ 免费额度充足

### 部署步骤

#### 1. 准备项目

确保项目根目录包含以下文件：
- `railway.json` ✅
- `package.json` ✅
- `Dockerfile` ✅
- `server.js` ✅

#### 2. 创建 Railway 项目

1. 访问 [Railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的项目仓库

#### 3. 配置环境变量

在 Railway 控制台中设置以下环境变量：

```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_access_token
NODE_ENV=production
PORT=3000
```

#### 4. 部署

Railway 会自动：
- 检测到 `railway.json` 配置文件
- 使用 Dockerfile 构建镜像
- 部署应用
- 提供公网访问 URL

#### 5. 自定义域名（可选）

1. 在 Railway 控制台选择 "Settings"
2. 添加自定义域名
3. 配置 DNS 记录

## 🔧 环境变量配置

### 必需的环境变量

```bash
# Shopify 配置
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_access_token

# 服务器配置
NODE_ENV=production
PORT=3000
```

### 可选的环境变量

```bash
# API 基础 URL（用于前端调用）
API_BASE_URL=https://your-domain.com/api

# 安全配置
ADMIN_PASSWORD=your_admin_password
```

## 📁 项目结构

```
项目根目录/
├── Dockerfile                 # Docker 配置
├── docker-compose.yml         # Docker Compose 配置（可选）
├── railway.json              # Railway 配置
├── package.json              # Node.js 依赖
├── server.js                 # Express 服务器
├── env.example               # 环境变量示例
├── api/                      # API 路由
│   ├── index.js             # API 入口
│   ├── download-file-express.js
│   └── ...
├── templates/                # Liquid 模板
├── assets/                   # 静态资源
└── ...
```

## 🚀 部署后配置

### 1. 更新前端 API 地址

在 `templates/page.admin-draft-orders.liquid` 中更新 API 地址：

```javascript
// 修改这行
const API_BASE = 'https://your-railway-domain.com/api';
// 或
const API_BASE = 'https://your-docker-domain.com/api';
```

### 2. 测试部署

访问以下 URL 测试部署：

- 主页：`https://your-domain.com/`
- 管理员页面：`https://your-domain.com/pages/admin-draft-orders`
- API 健康检查：`https://your-domain.com/api/health`

### 3. 监控和日志

**Railway:**
- 在控制台查看实时日志
- 监控资源使用情况

**Docker:**
```bash
# 查看容器日志
docker logs container_name

# 监控资源使用
docker stats container_name
```

## 🔍 故障排除

### 常见问题

#### 1. 环境变量未设置

**错误信息：** `Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ACCESS_TOKEN`

**解决方案：**
- 检查环境变量是否正确设置
- 确保变量名称拼写正确
- 重启服务

#### 2. 端口冲突

**错误信息：** `EADDRINUSE: address already in use :::3000`

**解决方案：**
- 更改 `PORT` 环境变量
- 或停止占用端口的其他服务

#### 3. 文件下载失败

**错误信息：** 404 或文件未找到

**解决方案：**
- 检查 Shopify 访问令牌权限
- 验证文件 ID 是否正确
- 查看服务器日志

### 调试命令

```bash
# 检查容器状态
docker ps

# 查看容器日志
docker logs -f container_name

# 进入容器调试
docker exec -it container_name /bin/sh

# 检查环境变量
docker exec container_name env
```

## 📊 性能优化

### 1. Docker 优化

```dockerfile
# 使用多阶段构建减小镜像大小
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Railway 优化

- 启用自动缩放
- 配置健康检查
- 使用缓存策略

### 3. 应用优化

- 启用 gzip 压缩
- 设置适当的缓存头
- 优化静态资源加载

## 💰 成本对比

| 方案 | 免费额度 | 付费计划 | 推荐场景 |
|-----|---------|---------|----------|
| **Vercel** | 有限制 | $20/月起 | 简单项目 |
| **Railway** | $5/月额度 | $5/月起 | 中小型项目 |
| **Docker** | 自托管免费 | 云服务费用 | 大型项目 |

## 🎯 推荐方案

### 小型项目
- **推荐：Railway**
- 简单易用，自动部署
- 免费额度充足

### 中型项目
- **推荐：Railway + 自定义域名**
- 更好的性能和可靠性
- 支持数据库集成

### 大型项目
- **推荐：Docker + 云服务**
- 完全控制
- 更好的扩展性

## 🚀 快速开始

### Railway 一键部署

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Docker 快速启动

```bash
# 克隆项目
git clone your-repo-url
cd your-project

# 设置环境变量
cp env.example .env
# 编辑 .env 文件

# 构建并运行
docker-compose up -d

# 访问应用
open http://localhost:3000
```

---

**部署完成后，您的 3D 打印服务就可以正常运行了！** 🎉

如有问题，请查看日志或联系技术支持。
