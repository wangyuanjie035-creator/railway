# 3D模型定制报价系统

基于 Shopify + Railway 的 3D 打印服务定制报价系统，支持客户上传 3D 模型文件（STEP、STL 等），配置加工参数，提交询价请求，客服审核并提供报价。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Shopify Store（已配置 Admin API 访问权限）
- Railway 账号（用于部署）

### 安装依赖

```bash
npm install
```

### 环境变量配置

在 Railway 项目设置中配置以下环境变量：

```env
# Shopify 配置
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_token

# 可选：文件存储方式
SKIP_SHOPIFY_FILES=true  # 如果设为 true，文件存储在服务器内存中
PUBLIC_BASE_URL=https://your-railway-app.railway.app  # Railway 部署后的 URL
```

### 本地开发

```bash
npm start
```

服务器将在 `http://localhost:8080` 启动。

### 部署到 Railway

1. 将代码推送到 GitHub
2. 在 Railway 中创建新项目，连接 GitHub 仓库
3. 配置环境变量
4. Railway 会自动部署

## 📁 项目结构

```
.
├── api/                    # 后端 API 路由
│   ├── submit-quote-real.js    # 提交询价请求
│   ├── get-draft-orders.js     # 获取订单列表
│   ├── store-file-data.js      # 存储文件到服务器内存
│   ├── download-file.js        # 下载文件
│   └── ...
├── assets/                 # 静态资源（JS、CSS、图片）
├── blocks/                 # Shopify 主题块
├── sections/               # Shopify 主题区块
├── snippets/               # Shopify 模板片段
├── templates/              # Shopify 页面模板
│   ├── page.quote-request.liquid      # 询价页面
│   ├── page.my-quotes.liquid          # 我的询价页面
│   └── page.admin-draft-orders.liquid # 管理后台
├── server.js               # Express 服务器入口
└── package.json            # 项目依赖
```

## 🔑 核心功能

### 1. 询价提交 (`/pages/quote-request`)
- 客户上传 3D 模型文件
- 配置加工参数（材料、颜色、精度等）
- 提交询价请求，创建 Shopify Draft Order

### 2. 我的询价 (`/pages/my-quotes`)
- 查看已提交的询价列表
- 查看询价详情和状态
- 删除询价

### 3. 管理后台 (`/pages/admin-draft-orders`)
- 查看所有询价订单
- 下载客户上传的文件
- 更新报价状态

## 🔧 技术栈

- **前端**: Shopify Liquid 模板 + JavaScript
- **后端**: Express.js (Node.js)
- **部署**: Railway
- **数据存储**: Shopify Draft Orders (GraphQL API)
- **文件存储**: 
  - Shopify Files API（默认）
  - 服务器内存存储（当 `SKIP_SHOPIFY_FILES=true` 时）

## 📚 文档

- [QUICK_START.md](QUICK_START.md) - 快速开始指南
- [RAILWAY_VS_VERCEL.md](RAILWAY_VS_VERCEL.md) - Railway 与 Vercel 对比说明
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 详细部署指南

## 🔍 关键 API

### POST `/api/submit-quote-real`
提交询价请求，创建 Draft Order。

**请求体**:
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "张三",
  "fileUrl": "data:application/step;base64,...",
  "fileName": "model.STEP",
  "material": "PLA",
  "color": "白色",
  "precision": "0.2mm"
}
```

### GET `/api/get-draft-orders`
获取所有 Draft Orders 列表（管理后台使用）。

### GET `/api/download-file?id=file_xxx`
下载存储在服务器上的文件。

## 🛠️ 开发说明

### 文件上传流程

1. 客户端将文件转换为 Base64
2. 调用 `/api/submit-quote-real` 提交询价
3. 后端根据 `SKIP_SHOPIFY_FILES` 决定存储方式：
   - `false` 或未设置：上传到 Shopify Files
   - `true`：存储到服务器内存（`global.fileStorage`）
4. 返回 `fileId`，保存到 Draft Order 的 `customAttributes` 中

### 文件下载流程

1. 从 Draft Order 的 `customAttributes` 读取 `fileId`
2. 调用 `/api/download-file?id=file_xxx`
3. 后端检查 `global.fileStorage` 或 Shopify Files
4. 返回文件数据

## ❓ 常见问题

### 为什么选择 Railway 而不是 Vercel？

详见 [RAILWAY_VS_VERCEL.md](RAILWAY_VS_VERCEL.md)。

主要原因为：
- 无部署数量限制
- 更好的文件处理支持（`form-data` 包）
- 完整的 Node.js 环境

### 文件存储在哪里？

根据 `SKIP_SHOPIFY_FILES` 环境变量：
- `false`：文件存储在 Shopify Files（Shopify CDN）
- `true`：文件存储在服务器内存中（重启后会丢失）

### 如何更新报价？

在管理后台点击订单，可以更新报价金额和状态。

## 📝 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

