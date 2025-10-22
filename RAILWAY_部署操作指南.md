# 🚂 Railway 部署操作指南

## 📋 部署前准备清单

在开始之前，请确认：

- [x] 项目代码已准备好
- [ ] 已注册 Railway 账号
- [ ] 已安装 Node.js（v18 或更高版本）
- [ ] 已准备好 Shopify 配置信息
  - [ ] Shopify Store Domain
  - [ ] Shopify Access Token

---

## 🚀 完整部署步骤

### 步骤 1: 注册 Railway 账号（2 分钟）

1. 访问 [Railway.app](https://railway.app)
2. 点击右上角 **"Login"**
3. 选择 **"Login with GitHub"**（推荐）
   - 或使用邮箱注册
4. 授权 GitHub 访问
5. 完成注册

**✅ 完成后**：您会看到 Railway 控制台

---

### 步骤 2: 安装 Railway CLI（3 分钟）

打开命令行（Windows 用户使用 PowerShell 或 CMD）：

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 验证安装
railway --version
```

**预期输出**：
```
Railway CLI version x.x.x
```

---

### 步骤 3: 登录 Railway（1 分钟）

```bash
# 登录 Railway
railway login
```

**会发生什么**：
1. 浏览器自动打开
2. 显示授权页面
3. 点击 **"Authorize"**
4. 返回命令行，显示 "Logged in as [您的用户名]"

---

### 步骤 4: 准备项目（5 分钟）

#### 4.1 配置环境变量

```bash
# 复制环境变量示例文件
copy env.example .env
```

#### 4.2 编辑 `.env` 文件

打开 `.env` 文件，填入您的 Shopify 配置：

```bash
# Shopify 配置（必填）
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxx

# 服务器配置（保持不变）
NODE_ENV=production
PORT=3000
```

**⚠️ 重要**：
- 替换 `your-store.myshopify.com` 为您的实际商店域名
- 替换 `shpat_xxx...` 为您的实际访问令牌

#### 4.3 获取 Shopify Access Token

如果您还没有 Access Token：

1. 登录 Shopify 管理后台
2. 进入 **设置 → 应用和销售渠道**
3. 点击 **开发应用**
4. 创建新应用或选择现有应用
5. 配置 **Admin API 访问权限**
6. 安装应用并获取 **Admin API 访问令牌**

---

### 步骤 5: 初始化 Railway 项目（2 分钟）

在项目根目录运行：

```bash
# 初始化 Railway 项目
railway init
```

**会发生什么**：
1. 提示选择项目名称（按回车使用默认名称）
2. 在 Railway 云端创建新项目
3. 本地项目关联到云端项目

**预期输出**：
```
✅ Created project "shopify-3d-service"
✅ Linked to project
```

---

### 步骤 6: 设置环境变量（3 分钟）

#### 方法 A: 使用命令行（推荐）

```bash
# 设置 Shopify Store Domain
railway variables set SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# 设置 Shopify Access Token
railway variables set SHOPIFY_ACCESS_TOKEN=shpat_your_token_here

# 设置 Node 环境
railway variables set NODE_ENV=production

# 设置端口
railway variables set PORT=3000
```

#### 方法 B: 使用 Railway 控制台

1. 访问 [Railway Dashboard](https://railway.app/dashboard)
2. 选择您的项目
3. 点击 **"Variables"** 标签
4. 添加以下变量：
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_ACCESS_TOKEN`
   - `NODE_ENV`
   - `PORT`

---

### 步骤 7: 部署到 Railway（5 分钟）

```bash
# 部署项目
railway up
```

**部署过程**：
```
🚀 Deploying...
📦 Uploading files...
🔨 Building Docker image...
⚙️  Starting container...
✅ Deployment successful!
```

**这个过程中会**：
1. 上传您的代码到 Railway
2. 使用 Dockerfile 构建 Docker 镜像
3. 在云端启动容器
4. 分配公网 URL

**⏱️ 预计时间**：3-5 分钟

---

### 步骤 8: 获取部署 URL（1 分钟）

#### 方法 A: 命令行

```bash
# 查看部署状态和 URL
railway status
```

#### 方法 B: Railway 控制台

1. 访问 [Railway Dashboard](https://railway.app/dashboard)
2. 选择您的项目
3. 点击 **"Settings"** → **"Domains"**
4. 复制自动生成的 URL（如：`your-app.up.railway.app`）

---

### 步骤 9: 测试部署（2 分钟）

访问以下 URL 测试部署：

```bash
# 主页
https://your-app.up.railway.app/

# API 健康检查
https://your-app.up.railway.app/api/health

# 管理员页面
https://your-app.up.railway.app/pages/admin-draft-orders
```

**✅ 预期结果**：
- 主页显示欢迎信息
- API 健康检查返回 JSON
- 管理员页面可以正常访问

---

### 步骤 10: 更新前端 API 地址（3 分钟）

#### 10.1 记录您的 Railway URL

```
https://your-app.up.railway.app
```

#### 10.2 更新模板文件

编辑以下文件，更新 API 基础 URL：

**文件 1**: `templates/page.admin-draft-orders.liquid`

找到这一行：
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';
```

改为：
```javascript
const API_BASE = 'https://your-app.up.railway.app/api';
```

**文件 2**: `templates/page.my-quotes.liquid`

找到并更新相同的行。

**文件 3**: `templates/page.quote-request.liquid`

找到并更新相同的行。

#### 10.3 重新部署

```bash
# 保存更改后，重新部署
railway up
```

---

### 步骤 11: 配置自定义域名（可选，5 分钟）

如果您有自己的域名：

1. 在 Railway 控制台选择项目
2. 进入 **"Settings"** → **"Domains"**
3. 点击 **"Custom Domain"**
4. 输入您的域名（如：`api.yourdomain.com`）
5. 按照提示配置 DNS 记录：
   - 类型：CNAME
   - 名称：api（或您选择的子域名）
   - 值：Railway 提供的目标地址

---

## 📊 部署后监控

### 查看日志

```bash
# 实时查看日志
railway logs

# 查看最近的日志
railway logs --tail 100
```

### 查看资源使用

1. 访问 Railway 控制台
2. 选择您的项目
3. 查看 **"Metrics"** 标签
   - CPU 使用率
   - 内存使用量
   - 网络流量

### 查看部署历史

1. 在 Railway 控制台
2. 查看 **"Deployments"** 标签
3. 可以回滚到之前的版本

---

## 🔧 常用管理命令

```bash
# 查看项目状态
railway status

# 查看环境变量
railway variables

# 查看日志
railway logs

# 重新部署
railway up

# 重启服务
railway restart

# 查看项目信息
railway whoami

# 打开 Railway 控制台
railway open
```

---

## 🐛 故障排除

### 问题 1: 部署失败

**症状**：`railway up` 失败

**解决方案**：
```bash
# 查看详细错误
railway logs

# 检查 Dockerfile 是否存在
ls Dockerfile

# 检查 package.json 是否正确
cat package.json
```

### 问题 2: 环境变量未生效

**症状**：应用显示 "Missing SHOPIFY_STORE_DOMAIN"

**解决方案**：
```bash
# 检查环境变量
railway variables

# 重新设置
railway variables set SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

# 重启服务
railway restart
```

### 问题 3: 无法访问部署的应用

**症状**：URL 返回 502 或 503 错误

**解决方案**：
```bash
# 查看日志
railway logs

# 检查服务状态
railway status

# 重启服务
railway restart
```

### 问题 4: 文件下载 404 错误

**症状**：点击下载按钮返回 404

**解决方案**：
1. 确认前端 API 地址已更新
2. 检查 Railway URL 是否正确
3. 查看服务器日志

---

## 💰 费用监控

### 查看当前使用量

1. 访问 [Railway Dashboard](https://railway.app/dashboard)
2. 点击右上角头像
3. 选择 **"Usage"**
4. 查看当月使用情况

### 设置预算提醒

1. 在 Railway 控制台
2. 进入 **"Account Settings"**
3. 设置月度预算限制

---

## 🎯 最佳实践

### 1. 定期查看日志

```bash
# 每天查看一次
railway logs --tail 100
```

### 2. 监控资源使用

- 每周检查一次 CPU 和内存使用情况
- 确保在免费额度内

### 3. 保持代码更新

```bash
# 有更新时重新部署
git add .
git commit -m "更新说明"
git push
railway up
```

### 4. 备份环境变量

将环境变量保存到安全的地方，以防需要重新部署。

---

## 🎉 部署成功检查清单

完成部署后，请确认：

- [ ] Railway 项目创建成功
- [ ] 环境变量已正确设置
- [ ] 应用成功部署并运行
- [ ] 获得了公网访问 URL
- [ ] 主页可以正常访问
- [ ] API 健康检查正常
- [ ] 管理员页面可以登录
- [ ] 前端 API 地址已更新
- [ ] 文件下载功能正常
- [ ] 所有核心功能测试通过

---

## 📞 获取帮助

### Railway 官方资源

- 文档：https://docs.railway.app
- 社区：https://railway.app/discord
- 状态：https://status.railway.app

### 项目相关

- 查看项目文档：`DOCKER_RAILWAY_DEPLOYMENT_GUIDE.md`
- 查看费用说明：`DOCKER_DEPLOYMENT_COST_GUIDE.md`

---

## 🚀 快速命令参考

```bash
# 完整部署流程（新项目）
npm install -g @railway/cli
railway login
railway init
railway variables set SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
railway variables set SHOPIFY_ACCESS_TOKEN=your_token
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway up

# 日常更新流程
railway up
railway logs

# 查看状态
railway status
railway open
```

---

## 🎊 恭喜！

您已成功使用 Docker + Railway 部署了 Shopify 3D 打印定制服务！

**下一步**：
1. 测试所有功能
2. 邀请用户使用
3. 监控运行状态
4. 根据需要添加新功能

**需要帮助？** 随时查看文档或运行 `railway --help`

---

**部署完成时间**：约 25-30 分钟  
**预计费用**：$0/月（免费额度内）  
**状态**：✅ 生产就绪
