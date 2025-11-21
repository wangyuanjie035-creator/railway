# 文件上传和下载存储指南

## 📍 文件存储位置

根据环境变量 `SKIP_SHOPIFY_FILES` 的设置，文件会存储在不同的位置：

### 方案 1: Shopify Files（默认，当 `SKIP_SHOPIFY_FILES=false` 或未设置）

**存储位置**: Shopify Files API（Shopify CDN）

**优点**:
- ✅ 文件永久存储（不会因服务器重启丢失）
- ✅ 使用 Shopify CDN，下载速度快
- ✅ 不占用服务器内存
- ✅ 支持大文件（最大 100MB）

**缺点**:
- ❌ 需要 Shopify Files API 权限
- ❌ 可能遇到上传限制或错误（如 403 错误）

**存储流程**:
```
1. 客户端上传文件 → 转换为 Base64
2. 调用 /api/submit-quote-real
3. 后端调用 /api/store-file-real
4. 使用 Shopify Staged Upload API 上传到 Google Cloud Storage
5. Shopify Files API 创建永久文件记录
6. 返回 shopifyFileId（如 gid://shopify/File/123456）
7. shopifyFileId 保存到 Draft Order 的 customAttributes
```

### 方案 2: 服务器内存存储（当 `SKIP_SHOPIFY_FILES=true`）

**存储位置**: Railway 服务器内存（`global.fileStorage` - Map 数据结构）

**优点**:
- ✅ 简单直接，无需 Shopify Files API
- ✅ 不依赖外部服务
- ✅ 上传速度快（无网络传输）

**缺点**:
- ❌ 服务器重启后文件会丢失
- ❌ 占用服务器内存
- ❌ 不适合大量文件或大文件

**存储流程**:
```
1. 客户端上传文件 → 转换为 Base64
2. 调用 /api/submit-quote-real
3. 创建 Draft Order 后，调用 /api/store-file-data
4. Base64 数据存储到 global.fileStorage（Map）
5. 生成 fileId（如 file_1763691162599_y1g8zog7n）
6. fileId 保存到 Draft Order 的 customAttributes
```

---

## 📥 文件下载位置

### 从 Shopify Files 下载（当文件存储方式为 "Shopify Files"）

**下载方式**: 通过 Shopify CDN URL 直接下载

**流程**:
```
1. 从 Draft Order 的 customAttributes 读取 shopifyFileId
2. 调用 /api/download-file?shopifyFileId=xxx
3. 后端使用 GraphQL 查询 Shopify Files API
4. 获取文件 CDN URL
5. 302 重定向到 Shopify CDN URL
6. 浏览器直接下载文件
```

**下载 URL 示例**:
```
https://your-railway-app.railway.app/api/download-file?shopifyFileId=gid://shopify/File/123456
```

### 从服务器内存下载（当文件存储方式为 "Server Local Storage"）

**下载方式**: 从服务器内存（`global.fileStorage`）直接返回文件

**流程**:
```
1. 从 Draft Order 的 customAttributes 读取 fileId
2. 调用 /api/download-file?id=file_xxx
3. 后端检查 global.fileStorage.has(fileId)
4. 从 Map 中获取 Base64 数据
5. 转换为 Buffer
6. 直接返回文件内容给浏览器
```

**下载 URL 示例**:
```
https://your-railway-app.railway.app/api/download-file?id=file_1763691162599_y1g8zog7n
```

---

## 🔍 如何判断文件存储位置？

查看 Draft Order 的 `customAttributes` 中的以下字段：

```javascript
{
  "文件存储方式": "Shopify Files",  // 或 "Base64"
  "文件数据位置": "Shopify Files", // 或 "Server Local Storage"
  "Shopify文件ID": "gid://shopify/File/123456", // 或 "未上传"
  "文件ID": "file_1763691162599_y1g8zog7n"
}
```

**判断规则**:
- 如果 `文件存储方式` = `"Shopify Files"` → 从 Shopify CDN 下载
- 如果 `文件存储方式` = `"Base64"` → 从服务器内存下载

---

## 🔧 环境变量配置

### Railway 环境变量设置

在 Railway 项目设置中配置：

```env
# Shopify 配置（必需）
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_admin_token

# 文件存储方式（可选）
SKIP_SHOPIFY_FILES=true  # true = 服务器内存，false 或未设置 = Shopify Files

# Railway 部署后的 URL（必需，用于 API 调用）
PUBLIC_BASE_URL=https://your-app.railway.app
```

### 推荐配置

**生产环境**（如果 Shopify Files 可用）:
```env
SKIP_SHOPIFY_FILES=false  # 或删除此变量
```

**开发/测试环境**（如果 Shopify Files 有问题）:
```env
SKIP_SHOPIFY_FILES=true
```

---

## 📊 存储数据结构

### Shopify Files 存储

在 Draft Order 的 `customAttributes` 中：
```json
{
  "key": "Shopify文件ID",
  "value": "gid://shopify/File/123456789"
}
```

在 Shopify Files 中：
- 文件存储在 Shopify CDN
- 可通过 Shopify Admin API 查询
- URL 格式：`https://cdn.shopify.com/s/files/...`

### 服务器内存存储

在服务器内存中（`global.fileStorage` Map）：
```javascript
global.fileStorage = new Map([
  ['file_1763691162599_y1g8zog7n', {
    draftOrderId: 'gid://shopify/DraftOrder/1226306617631',
    fileName: 'model.STEP',
    fileData: 'U1RFUCBGSUxF...', // Base64 数据
    uploadTime: '2025-01-21T10:12:47.000Z'
  }]
]);
```

在 Draft Order 的 `customAttributes` 中：
```json
{
  "key": "文件ID",
  "value": "file_1763691162599_y1g8zog7n"
}
```

---

## 🔄 完整文件流转图

### 上传流程

```
┌─────────────┐
│   客户端    │
│  (浏览器)   │
└──────┬──────┘
       │ 1. 上传文件 (Base64)
       ▼
┌─────────────────────┐
│ /api/submit-quote-  │
│      real           │
└──────┬──────────────┘
       │
       ├─ SKIP_SHOPIFY_FILES=false?
       │  ├─ 是 → 调用 /api/store-file-real
       │  │         ↓
       │  │      Shopify Files API
       │  │         ↓
       │  │      Google Cloud Storage
       │  │         ↓
       │  │      返回 shopifyFileId
       │  │
       │  └─ 否 → 调用 /api/store-file-data
       │         ↓
       │      global.fileStorage (内存)
       │         ↓
       │      返回 fileId
       │
       ▼
┌─────────────────────┐
│  Draft Order        │
│  customAttributes   │
│  - 文件ID           │
│  - Shopify文件ID    │
│  - 文件存储方式     │
└─────────────────────┘
```

### 下载流程

```
┌─────────────┐
│   客户端    │
│  (管理员)   │
└──────┬──────┘
       │ 1. 点击下载
       ▼
┌─────────────────────┐
│  Draft Order        │
│  customAttributes   │
└──────┬──────────────┘
       │ 2. 读取文件ID
       ▼
┌─────────────────────┐
│ /api/download-file  │
└──────┬──────────────┘
       │
       ├─ shopifyFileId 存在?
       │  ├─ 是 → 查询 Shopify Files API
       │  │         ↓
       │  │      获取 CDN URL
       │  │         ↓
       │  │      302 重定向下载
       │  │
       │  └─ 否 → 检查 global.fileStorage
       │         ↓
       │      从内存读取 Base64
       │         ↓
       │      转换为 Buffer
       │         ↓
       │      直接返回文件
       │
       ▼
┌─────────────┐
│  下载完成   │
└─────────────┘
```

---

## ⚠️ 注意事项

### 服务器内存存储限制

1. **服务器重启**: 所有存储在内存中的文件会丢失
2. **内存限制**: Railway 免费版有内存限制，不适合存储大量文件
3. **临时性**: 这是临时存储方案，不适合生产环境长期使用

### Shopify Files 限制

1. **文件大小**: 最大 100MB
2. **API 配额**: 可能有 API 调用频率限制
3. **权限要求**: 需要 Shopify Admin API 权限

### 最佳实践

1. **生产环境**: 使用 Shopify Files（`SKIP_SHOPIFY_FILES=false`）
2. **开发环境**: 可以使用服务器内存存储（`SKIP_SHOPIFY_FILES=true`）
3. **备份**: 重要文件建议备份到其他存储服务

---

## 🐛 常见问题

### Q: 为什么下载文件时显示"未找到"？

**A**: 可能的原因：
1. 服务器重启导致内存存储的文件丢失（如果使用 `SKIP_SHOPIFY_FILES=true`）
2. `fileId` 与存储时不一致（已修复，现在会自动更新）
3. Shopify Files API 权限问题

### Q: 如何切换存储方式？

**A**: 
1. 修改 Railway 环境变量 `SKIP_SHOPIFY_FILES`
2. 重新部署应用
3. 新上传的文件会使用新的存储方式
4. 旧文件仍需要从原存储位置下载

### Q: 文件会在服务器上保存多久？

**A**: 
- **Shopify Files**: 永久保存（除非手动删除）
- **服务器内存**: 直到服务器重启（通常几小时到几天）

### Q: 可以同时支持两种存储方式吗？

**A**: 可以，系统会自动根据 `SKIP_SHOPIFY_FILES` 环境变量选择存储方式。但同一文件只会使用一种方式。

---

## 📝 总结

- **上传到**: Shopify Files API（CDN）或 Railway 服务器内存
- **下载自**: Shopify CDN 或 Railway 服务器内存
- **控制方式**: 环境变量 `SKIP_SHOPIFY_FILES`
- **推荐方案**: 生产环境使用 Shopify Files

