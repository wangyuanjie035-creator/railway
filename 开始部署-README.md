# 🚀 开始部署 - 快速指南

## 👋 欢迎！

您已选择使用 **Docker + Railway** 部署方案。这是一个完美的选择！

### ✅ 为什么选择这个方案？

- 🆓 **免费开始**（$5/月免费额度）
- 🚫 **无文件限制**（解决 Vercel 问题）
- ⚡ **自动部署**（Git push 即部署）
- 📈 **易于扩展**（添加新功能很简单）

---

## 🎯 您需要做什么？

### 第一步：准备信息（2 分钟）

准备以下信息：

1. **Shopify Store Domain**
   - 格式：`your-store.myshopify.com`
   - 在哪里找？Shopify 管理后台的 URL

2. **Shopify Access Token**
   - 格式：`shpat_xxxxxxxxxx`
   - 如何获取？参见下方说明

---

## 📖 三个关键文档

### 1️⃣ 部署操作指南 ⭐️⭐️⭐️

**文件**：`RAILWAY_部署操作指南.md`

**包含**：
- 详细的步骤说明
- 每个步骤的预期结果
- 完整的命令示例
- 故障排除方法

**👉 从这里开始！**

---

### 2️⃣ 部署检查清单

**文件**：`部署检查清单.md`

**包含**：
- 可打勾的检查项
- 确保不遗漏任何步骤
- 功能测试清单

**👉 边部署边检查！**

---

### 3️⃣ 费用说明

**文件**：`DOCKER_DEPLOYMENT_COST_GUIDE.md`

**包含**：
- 详细的费用分析
- 免费方案说明
- 成本优化建议

**👉 了解费用情况！**

---

## ⚡ 快速开始（30 分钟）

### 超简化版本

如果您想快速开始，只需运行以下命令：

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录 Railway（会打开浏览器）
railway login

# 3. 初始化项目
railway init

# 4. 设置环境变量（替换为您的实际值）
railway variables set SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
railway variables set SHOPIFY_ACCESS_TOKEN=your_token_here
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 5. 部署！
railway up

# 6. 查看部署 URL
railway status
```

**完成！** 🎉

---

## 🔑 如何获取 Shopify Access Token？

### 详细步骤：

1. **登录 Shopify 管理后台**
   ```
   https://your-store.myshopify.com/admin
   ```

2. **进入应用设置**
   - 点击左侧菜单 **"设置"**
   - 选择 **"应用和销售渠道"**

3. **开发应用**
   - 点击 **"开发应用"**
   - 点击 **"创建应用"** 或选择现有应用

4. **配置 API 权限**
   需要的权限：
   - `read_draft_orders`
   - `write_draft_orders`
   - `read_files`
   - `write_files`
   - `read_products`
   - `write_products`

5. **安装应用**
   - 点击 **"安装应用"**
   - 确认权限

6. **获取 Access Token**
   - 复制 **"Admin API 访问令牌"**
   - 格式：`shpat_xxxxxxxxxxxxxxxxxxxxxxxx`

**⚠️ 重要**：妥善保管此令牌，不要分享给他人！

---

## 📁 项目文件说明

### Docker 相关
- `Dockerfile` - Docker 镜像配置
- `server.js` - Express 服务器
- `package.json` - Node.js 依赖

### Railway 相关
- `railway.json` - Railway 配置
- `env.example` - 环境变量模板

### 部署脚本
- `deploy.bat` - Windows 部署脚本
- `deploy.sh` - Linux/Mac 部署脚本

### 文档
- `RAILWAY_部署操作指南.md` - 详细操作指南 ⭐️
- `部署检查清单.md` - 检查清单
- `DOCKER_DEPLOYMENT_COST_GUIDE.md` - 费用说明
- `DOCKER_RAILWAY_DEPLOYMENT_GUIDE.md` - 技术指南

---

## 🎯 部署流程图

```
准备 Shopify 信息
       ↓
注册 Railway 账号
       ↓
安装 Railway CLI
       ↓
登录 Railway
       ↓
初始化项目
       ↓
设置环境变量
       ↓
部署应用
       ↓
获取 URL
       ↓
更新前端 API 地址
       ↓
测试功能
       ↓
✅ 完成！
```

---

## 💡 重要提示

### 部署前
- ✅ 确保有 Shopify 商店和 Access Token
- ✅ 确保安装了 Node.js（v18+）
- ✅ 确保有稳定的网络连接

### 部署时
- ⏱️ 首次部署需要 3-5 分钟
- 📊 随时查看日志：`railway logs`
- 🔄 如果失败，可以重试：`railway up`

### 部署后
- 📝 记录您的 Railway URL
- 🔧 更新前端 API 地址
- 🧪 测试所有功能
- 📊 监控资源使用

---

## 🆘 遇到问题？

### 常见问题

**Q: Railway CLI 安装失败？**
```bash
# 尝试使用管理员权限
sudo npm install -g @railway/cli  # Mac/Linux
# 或以管理员身份运行 PowerShell（Windows）
```

**Q: railway login 没有打开浏览器？**
```bash
# 手动访问登录页面
railway login --browserless
# 按照提示操作
```

**Q: 部署失败怎么办？**
```bash
# 查看详细错误
railway logs

# 检查环境变量
railway variables

# 重新部署
railway up
```

**Q: 如何查看实时日志？**
```bash
railway logs --tail
```

### 获取帮助

1. 查看详细文档：`RAILWAY_部署操作指南.md`
2. 查看 Railway 文档：https://docs.railway.app
3. 加入 Railway Discord 社区

---

## ✅ 部署成功标志

部署成功后，您应该能够：

- ✅ 访问 Railway 生成的 URL
- ✅ 看到应用主页
- ✅ API 健康检查返回正常
- ✅ 管理员页面可以登录
- ✅ 所有功能正常工作

---

## 🎉 准备好了吗？

### 立即开始部署！

**推荐路径**：

1. **第一步**：阅读 `RAILWAY_部署操作指南.md`
2. **第二步**：准备 Shopify 信息
3. **第三步**：按照指南逐步操作
4. **第四步**：使用检查清单确认

**预计时间**：30 分钟  
**难度等级**：⭐⭐（简单）  
**成功率**：95%+

---

## 📞 支持

### 文档资源
- 📖 详细操作指南：`RAILWAY_部署操作指南.md`
- ✅ 检查清单：`部署检查清单.md`
- 💰 费用说明：`DOCKER_DEPLOYMENT_COST_GUIDE.md`

### 在线资源
- Railway 文档：https://docs.railway.app
- Railway 状态：https://status.railway.app
- Railway 社区：https://railway.app/discord

---

## 🚀 开始部署

现在打开 **`RAILWAY_部署操作指南.md`**，开始您的部署之旅！

**祝您部署顺利！** 🎊

---

**最后更新**：2025-10-21  
**版本**：1.0.0  
**状态**：✅ 生产就绪
