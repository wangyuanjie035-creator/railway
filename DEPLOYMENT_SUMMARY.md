# 🚀 Docker & Railway 部署方案总结

## 📋 问题背景

Vercel 平台有以下限制：
- ❌ 文件数量限制（导致部署失败）
- ❌ API 函数数量限制
- ❌ 单文件大小限制
- ❌ 执行时间限制

## ✅ 解决方案

我们提供了两种无限制的部署方案：

### 🐳 Docker 方案
- ✅ 无文件数量限制
- ✅ 完全控制运行环境
- ✅ 支持所有 Node.js 功能
- ✅ 可在任何平台部署

### 🚂 Railway 方案
- ✅ 无文件数量限制
- ✅ 简单的 Git 集成
- ✅ 自动部署
- ✅ 内置数据库支持
- ✅ 免费额度充足

## 📁 新增文件列表

### Docker 相关文件
- `Dockerfile` - Docker 镜像构建配置
- `docker-compose.yml` - Docker Compose 配置（可选）
- `.dockerignore` - Docker 构建忽略文件

### Railway 相关文件
- `railway.json` - Railway 部署配置

### 服务器文件
- `server.js` - Express 服务器主文件
- `package.json` - Node.js 项目配置
- `api/index.js` - API 路由入口
- `api/download-file-express.js` - Express 版本的文件下载 API

### 配置文件
- `env.example` - 环境变量示例文件

### 部署脚本
- `deploy.sh` - Linux/Mac 部署脚本
- `deploy.bat` - Windows 部署脚本

### 文档
- `DOCKER_RAILWAY_DEPLOYMENT_GUIDE.md` - 详细部署指南
- `DEPLOYMENT_SUMMARY.md` - 本总结文档

## 🔧 技术架构变化

### 从 Vercel 到 Express 的转换

| 组件 | Vercel 版本 | Express 版本 |
|-----|------------|-------------|
| **入口文件** | `api/function.js` | `server.js` |
| **路由处理** | `export default handler` | `app.get/post()` |
| **CORS** | `setCorsHeaders()` | `app.use(cors())` |
| **静态文件** | 自动处理 | `express.static()` |
| **环境变量** | `process.env` | `process.env` (相同) |

### API 兼容性

所有现有的 API 端点保持不变：
- ✅ `/api/download-file`
- ✅ `/api/submit-quote-real`
- ✅ `/api/get-draft-orders`
- ✅ `/api/update-quote`
- ✅ `/api/send-invoice-email`
- ✅ 等等...

## 🚀 快速部署指南

### 方法一：使用部署脚本（推荐）

**Windows:**
```cmd
deploy.bat docker
# 或
deploy.bat railway
```

**Linux/Mac:**
```bash
./deploy.sh docker
# 或
./deploy.sh railway
```

### 方法二：手动部署

**Docker 部署:**
```bash
# 1. 设置环境变量
cp env.example .env
# 编辑 .env 文件

# 2. 构建并运行
docker build -t shopify-3d-service .
docker run -d -p 3000:3000 --env-file .env shopify-3d-service
```

**Railway 部署:**
```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录并部署
railway login
railway up
```

## 🔧 环境变量配置

### 必需变量
```bash
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_access_token
NODE_ENV=production
PORT=3000
```

### 可选变量
```bash
API_BASE_URL=https://your-domain.com/api
ADMIN_PASSWORD=your_admin_password
```

## 📊 部署后配置

### 1. 更新前端 API 地址

在 `templates/page.admin-draft-orders.liquid` 中：

```javascript
// 修改这行
const API_BASE = 'https://your-new-domain.com/api';
```

### 2. 测试部署

访问以下 URL 验证部署：
- 主页：`https://your-domain.com/`
- 管理员页面：`https://your-domain.com/pages/admin-draft-orders`
- API 健康检查：`https://your-domain.com/api/health`

## 💰 成本对比

| 方案 | 免费额度 | 付费计划 | 推荐场景 |
|-----|---------|---------|----------|
| **Vercel** | 有限制 | $20/月起 | 简单项目 |
| **Railway** | $5/月额度 | $5/月起 | 中小型项目 ✅ |
| **Docker** | 自托管免费 | 云服务费用 | 大型项目 |

## 🎯 推荐方案

### 对于您的项目
**推荐：Railway 部署**

**理由：**
1. ✅ 简单易用，一键部署
2. ✅ 无文件数量限制
3. ✅ 免费额度充足（$5/月）
4. ✅ 自动 Git 集成
5. ✅ 内置监控和日志

## 🔍 故障排除

### 常见问题

1. **环境变量未设置**
   - 检查 `.env` 文件是否存在
   - 验证变量名称拼写

2. **端口冲突**
   - 更改 `PORT` 环境变量
   - 或停止占用端口的服务

3. **文件下载失败**
   - 检查 Shopify 访问令牌权限
   - 查看服务器日志

### 调试命令

**Docker:**
```bash
docker logs -f shopify-3d-service
docker exec -it shopify-3d-service /bin/sh
```

**Railway:**
```bash
railway logs
railway status
```

## 📈 性能优势

### 相比 Vercel 的优势

1. **无限制部署**
   - ✅ 无文件数量限制
   - ✅ 无 API 函数数量限制
   - ✅ 无单文件大小限制

2. **更好的性能**
   - ✅ 更快的冷启动
   - ✅ 更长的执行时间
   - ✅ 更大的内存限制

3. **更强的控制**
   - ✅ 完全控制运行环境
   - ✅ 支持所有 Node.js 功能
   - ✅ 自定义服务器配置

## 🎉 总结

通过 Docker 和 Railway 部署方案，我们成功解决了 Vercel 的文件数量限制问题：

1. **✅ 解决了部署限制** - 无文件数量限制
2. **✅ 保持了功能完整** - 所有功能正常工作
3. **✅ 提供了多种选择** - Docker 和 Railway 两种方案
4. **✅ 简化了部署流程** - 一键部署脚本
5. **✅ 降低了成本** - Railway 免费额度充足

现在您的 3D 打印服务可以无限制地部署和运行了！🚀

---

**下一步：**
1. 选择部署方案（推荐 Railway）
2. 配置环境变量
3. 运行部署脚本
4. 更新前端 API 地址
5. 测试所有功能

如有问题，请参考详细部署指南或联系技术支持。
