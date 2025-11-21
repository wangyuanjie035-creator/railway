# API 文件索引 - 快速查找和修改指南

## 📋 目录结构

```
api/
├── index.js                    # API 路由注册中心
├── cors-config.js              # CORS 跨域配置
├── health.js                   # 健康检查
│
├── submit-quote-real.js        # 【核心】提交询价请求
├── get-draft-orders.js         # 获取订单列表（管理端）
├── get-draft-order-simple.js   # 获取单个订单详情
├── update-quote.js             # 更新报价（客服）
├── delete-draft-order.js       # 删除订单
├── complete-draft-order.js     # 完成订单
│
├── store-file-real.js          # 上传文件到 Shopify Files
├── store-file-data.js          # 存储文件到服务器内存
├── download-file.js            # 下载文件
│
├── send-invoice-email.js       # 发送发票邮件
└── get-or-create-product.js    # 获取或创建产品
```

---

## 🔑 核心业务 API

### 1. `submit-quote-real.js` ⭐⭐⭐
**路由**: `POST /api/submit-quote-real`

**作用**: 提交询价请求，创建 Shopify Draft Order

**主要功能**:
- ✅ 接收客户询价信息（邮箱、姓名、文件、参数等）
- ✅ 处理文件上传（调用 `store-file-real.js` 或 `store-file-data.js`）
- ✅ 创建 Shopify Draft Order
- ✅ 返回询价单号和 Draft Order ID

**使用场景**:
- 客户在询价页面提交询价请求

**关键代码位置**:
- 文件上传逻辑: 第 142-180 行
- Draft Order 创建: 第 230-287 行
- 文件存储处理: 第 291-313 行

**修改建议**:
- 修改询价流程 → 修改此文件
- 添加新字段 → 在第 192-204 行的 `baseAttributes` 中添加
- 修改文件上传逻辑 → 查看第 142-180 行

---

### 2. `get-draft-orders.js` ⭐⭐
**路由**: `GET /api/get-draft-orders`

**作用**: 获取所有 Draft Orders 列表（管理端使用）

**主要功能**:
- ✅ 查询所有 Draft Orders
- ✅ 支持状态过滤
- ✅ 返回订单详情（ID、状态、价格、文件信息等）

**使用场景**:
- 管理后台显示所有询价单列表

**关键代码位置**:
- GraphQL 查询: 第 60-120 行
- 数据解析: 第 130-200 行

**修改建议**:
- 修改订单列表显示 → 修改此文件
- 添加过滤条件 → 修改 GraphQL 查询
- 添加统计信息 → 在第 200-230 行添加

---

### 3. `get-draft-order-simple.js` ⭐⭐
**路由**: `GET /api/get-draft-order-simple`

**作用**: 获取单个 Draft Order 详情（简化版，避免权限问题）

**主要功能**:
- ✅ 查询单个 Draft Order 详情
- ✅ 返回完整的订单信息
- ✅ 包含文件信息、客户信息等

**使用场景**:
- 客户在"我的询价"页面查看订单详情
- 管理端查看单个订单详情

**修改建议**:
- 修改订单详情显示 → 修改此文件
- 添加新字段 → 修改 GraphQL 查询

---

### 4. `update-quote.js` ⭐⭐
**路由**: `POST /api/update-quote`

**作用**: 客服更新报价（修改价格和状态）

**主要功能**:
- ✅ 查询现有 Draft Order
- ✅ 更新价格
- ✅ 更新状态（待报价 → 已报价）
- ✅ 添加报价备注

**使用场景**:
- 客服在管理后台更新报价

**关键代码位置**:
- 查询订单: 第 105-138 行
- 更新订单: 第 147-201 行

**修改建议**:
- 修改报价流程 → 修改此文件
- 添加新状态 → 在第 172-175 行修改

---

### 5. `delete-draft-order.js` ⭐
**路由**: `DELETE /api/delete-draft-order`

**作用**: 删除 Draft Order

**主要功能**:
- ✅ 删除指定的 Draft Order
- ✅ 返回删除结果

**使用场景**:
- 客户删除自己的询价单
- 管理端删除不需要的订单

**修改建议**:
- 修改删除逻辑 → 修改此文件

---

### 6. `complete-draft-order.js` ⭐
**路由**: `POST /api/complete-draft-order`

**作用**: 完成 Draft Order（转换为正式订单）

**主要功能**:
- ✅ 将 Draft Order 转换为正式订单
- ✅ 生成订单号

**使用场景**:
- 客户付款后完成订单

**修改建议**:
- 修改订单完成逻辑 → 修改此文件

---

## 📁 文件存储 API

### 7. `store-file-real.js` ⭐⭐⭐
**路由**: `POST /api/store-file-real`

**作用**: **上传文件到 Shopify Files**（使用 Shopify Staged Upload API）

**存储位置**: Shopify 管理的 Google Cloud Storage（永久存储）

**主要功能**:
- ✅ 使用 Shopify Staged Upload API 获取上传参数
- ✅ 上传文件到 Google Cloud Storage
- ✅ 创建 Shopify Files 记录
- ✅ 返回 Shopify File ID 和 CDN URL

**流程**:
```
1. 调用 Shopify Staged Upload API → 获取上传 URL 和签名参数
2. 构建 FormData（包含签名参数和文件）
3. 上传到 Google Cloud Storage（Shopify 管理的存储桶）
4. 调用 Shopify File Create API → 创建永久文件记录
5. 返回 Shopify File ID
```

**使用场景**:
- 当 `SKIP_SHOPIFY_FILES=false` 时使用
- 文件永久存储在 Shopify 服务器

**关键代码位置**:
- FormData 构建: 第 158-177 行
- 文件上传: 第 182-200 行
- 创建文件记录: 第 204-268 行

**常见问题**:
- 403 错误（签名验证失败）→ 检查参数顺序和文件位置
- 修改上传逻辑 → 修改第 158-200 行

**修改建议**:
- 修复 403 错误 → 检查 FormData 构建逻辑
- 添加调试日志 → 在第 153-180 行添加
- 修改文件处理 → 修改第 55-58 行

---

### 8. `store-file-data.js` ⭐⭐⭐
**路由**: `POST /api/store-file-data`

**作用**: **存储文件到服务器内存**（临时存储）

**存储位置**: Railway 服务器内存（`global.fileStorage` Map）

**主要功能**:
- ✅ 接收 Base64 文件数据
- ✅ 存储到服务器内存（Map）
- ✅ 返回文件 ID（用于后续下载）

**流程**:
```
1. 接收 Base64 文件数据
2. 生成文件 ID（file_xxx）
3. 存储到 global.fileStorage Map
4. 返回文件 ID
```

**使用场景**:
- 当 `SKIP_SHOPIFY_FILES=true` 时使用
- Shopify Files 上传失败时的备用方案
- 临时存储（服务器重启后会丢失）

**关键代码位置**:
- 存储逻辑: 第 2-38 行
- API 处理: 第 40-86 行

**修改建议**:
- 修改存储方式 → 修改第 2-38 行
- 添加文件验证 → 在第 56-66 行添加

---

### 9. `download-file.js` ⭐⭐⭐
**路由**: `GET /api/download-file`

**作用**: 下载已上传的文件

**主要功能**:
- ✅ 支持从 Shopify Files 下载（通过 shopifyFileId）
- ✅ 支持从服务器内存下载（通过 fileId）
- ✅ 返回文件数据或重定向到 CDN URL

**下载逻辑**:
```
1. 如果提供了 shopifyFileId → 查询 Shopify Files → 重定向到 CDN
2. 如果提供了 fileId → 从 global.fileStorage 读取 → 返回文件数据
3. 否则返回 404
```

**使用场景**:
- 管理端下载客户上传的文件
- 客户下载自己的文件

**关键代码位置**:
- Shopify 文件下载: 第 165-221 行
- 本地存储下载: 第 54-71 行

**修改建议**:
- 修改下载逻辑 → 修改此文件
- 添加文件验证 → 在第 42-52 行添加

---

## 🔄 关键区别：store-file-real vs store-file-data

### `store-file-real.js` vs `store-file-data.js`

| 项目 | store-file-real.js | store-file-data.js |
|------|-------------------|-------------------|
| **路由** | `POST /api/store-file-real` | `POST /api/store-file-data` |
| **存储位置** | Shopify 服务器（Google Cloud Storage） | Railway 服务器内存 |
| **持久性** | ✅ 永久存储 | ❌ 服务器重启后丢失 |
| **存储方式** | Shopify Files API | `global.fileStorage` Map |
| **文件大小限制** | 100MB | 受服务器内存限制 |
| **CDN 访问** | ✅ 通过 Shopify CDN | ❌ 只能通过 Railway API |
| **使用条件** | `SKIP_SHOPIFY_FILES=false` | `SKIP_SHOPIFY_FILES=true` |
| **返回 ID** | `shopifyFileId` (gid://shopify/File/xxx) | `fileId` (file_xxx) |
| **优势** | 永久存储，CDN 加速 | 简单直接，避免 403 错误 |
| **劣势** | 可能遇到 403 错误 | 服务器重启后丢失 |

### 何时使用哪个？

**使用 `store-file-real.js`**（首选）:
- ✅ `SKIP_SHOPIFY_FILES=false`
- ✅ 需要永久存储
- ✅ 需要 CDN 加速
- ✅ Shopify Files API 正常工作

**使用 `store-file-data.js`**（备用）:
- ✅ `SKIP_SHOPIFY_FILES=true`
- ✅ Shopify Files 上传失败
- ✅ 临时测试
- ⚠️ 服务器重启后文件会丢失

---

## 📧 其他功能 API

### 10. `send-invoice-email.js` ⭐
**路由**: `POST /api/send-invoice-email`

**作用**: 发送发票邮件给客户

**主要功能**:
- ✅ 调用 Shopify 的发票发送功能
- ✅ 发送包含结账链接的邮件

**使用场景**:
- 客服在报价完成后发送发票邮件

---

### 11. `get-or-create-product.js` ⭐
**路由**: `POST /api/get-or-create-product`

**作用**: 获取或创建产品（用于关联订单）

**主要功能**:
- ✅ 查询现有产品
- ✅ 如果不存在则创建产品
- ✅ 返回产品 ID

**使用场景**:
- 需要关联产品到订单时

---

## 🔧 基础设施 API

### 12. `index.js` ⭐⭐⭐
**作用**: API 路由注册中心

**主要功能**:
- ✅ 导入所有 API 路由
- ✅ 注册路由到 Express Router
- ✅ 统一处理 CORS

**修改建议**:
- 添加新 API → 在此文件注册
- 修改路由路径 → 修改路由注册部分

---

### 13. `cors-config.js` ⭐⭐
**作用**: CORS 跨域配置

**主要功能**:
- ✅ 设置允许的来源（Shopify 店铺域名）
- ✅ 处理 OPTIONS 预检请求
- ✅ 统一 CORS 配置

**修改建议**:
- 添加新的允许来源 → 修改 `allowedOrigins` 数组

---

### 14. `health.js` ⭐
**路由**: `GET /api/health`

**作用**: 健康检查端点

**主要功能**:
- ✅ 返回服务状态
- ✅ 用于监控和调试

**使用场景**:
- Railway 健康检查
- 服务监控

---

## 🎯 快速查找指南

### 根据功能查找

| 功能 | 文件 |
|------|------|
| **提交询价** | `submit-quote-real.js` |
| **查看订单列表** | `get-draft-orders.js` |
| **查看订单详情** | `get-draft-order-simple.js` |
| **更新报价** | `update-quote.js` |
| **删除订单** | `delete-draft-order.js` |
| **上传文件（Shopify）** | `store-file-real.js` |
| **上传文件（内存）** | `store-file-data.js` |
| **下载文件** | `download-file.js` |
| **发送邮件** | `send-invoice-email.js` |

### 根据问题查找

| 问题 | 检查文件 |
|------|---------|
| **文件上传失败（403）** | `store-file-real.js` 第 158-200 行 |
| **订单创建失败** | `submit-quote-real.js` 第 230-287 行 |
| **订单列表不显示** | `get-draft-orders.js` 第 60-120 行 |
| **文件下载失败** | `download-file.js` 第 54-221 行 |
| **CORS 错误** | `cors-config.js` |
| **添加新 API** | `index.js` 添加路由注册 |

---

## 📝 修改和测试建议

### 修改前

1. **确定要修改的功能** → 查找对应的 API 文件
2. **查看文件顶部注释** → 了解文件作用和使用示例
3. **查看关键代码位置** → 根据上面的指南定位代码

### 修改时

1. **添加日志** → 方便调试和追踪问题
2. **保持代码风格** → 参考现有代码格式
3. **处理错误** → 添加适当的错误处理

### 测试时

1. **本地测试** → 使用 `npm start` 启动服务器
2. **查看日志** → 检查 Railway 日志
3. **测试相关功能** → 测试整个流程

---

## 🔍 常见修改场景

### 场景 1: 修改询价流程

**相关文件**:
- `submit-quote-real.js` - 主要逻辑
- `store-file-real.js` 或 `store-file-data.js` - 文件存储

**修改步骤**:
1. 打开 `submit-quote-real.js`
2. 查看第 192-204 行（customAttributes）
3. 添加或修改字段
4. 测试提交询价

### 场景 2: 修复文件上传 403 错误

**相关文件**:
- `store-file-real.js` - 上传逻辑

**修改步骤**:
1. 打开 `store-file-real.js`
2. 查看第 158-200 行（FormData 构建和上传）
3. 检查参数顺序和文件位置
4. 添加调试日志
5. 测试上传

### 场景 3: 修改订单列表显示

**相关文件**:
- `get-draft-orders.js` - 查询逻辑
- `templates/page.admin-draft-orders.liquid` - 前端显示

**修改步骤**:
1. 打开 `get-draft-orders.js`
2. 查看第 60-120 行（GraphQL 查询）
3. 添加或修改查询字段
4. 修改前端模板显示新字段

---

## ✅ 总结

**核心文件**（最常修改）:
- `submit-quote-real.js` - 询价提交
- `store-file-real.js` / `store-file-data.js` - 文件存储
- `download-file.js` - 文件下载
- `get-draft-orders.js` - 订单列表
- `update-quote.js` - 更新报价

**基础设施**（很少修改）:
- `index.js` - 路由注册
- `cors-config.js` - CORS 配置
- `health.js` - 健康检查

**关键区别**:
- `store-file-real.js` = 上传到 Shopify Files（永久存储）
- `store-file-data.js` = 存储到服务器内存（临时存储）

使用此索引可以快速找到需要修改的文件！

