# SKIP_SHOPIFY_FILES=true 的原因说明

## ❌ 不是权限问题

**重要说明**：`SKIP_SHOPIFY_FILES=true` **不是**因为 Shopify 权限不足或测试环境限制。

实际上：
- ✅ Shopify Admin API 权限是正常的（可以创建 Draft Order、查询订单等）
- ✅ Shopify GraphQL API 调用正常
- ✅ 可以正常使用 Shopify 的其他功能

## 🔍 真正的问题原因

### 问题：403 Forbidden (SignatureDoesNotMatch)

在从 **Vercel 迁移到 Railway** 后，文件上传到 Shopify Files 时遇到了 **403 Forbidden** 错误，错误信息通常是 `SignatureDoesNotMatch`。

### 为什么会出现这个问题？

Shopify Files 上传流程包含 3 个步骤：

```
1. 创建 Staged Upload (调用 Shopify GraphQL API)
   ↓ 获得签名参数和临时上传 URL
   
2. 上传文件到 Google Cloud Storage (GCS)
   ↓ 使用 FormData 包含签名参数和文件
   ↓ ⚠️ 这里出现 403 错误
   
3. 创建永久文件记录 (调用 Shopify GraphQL API)
```

**问题根源**：

在步骤 2 中，上传文件到 Google Cloud Storage 时，需要：
1. 使用 `multipart/form-data` 格式
2. 按照 Shopify 提供的**特定顺序**和**格式**添加签名参数
3. 文件必须作为最后一个字段
4. 签名验证依赖于 FormData 的边界（boundary）和字段顺序

**为什么在 Railway 会失败**：

- **Vercel Edge Runtime**：使用浏览器原生 `FormData` 和 `Blob`，格式完全符合 Shopify 要求
- **Railway Node.js**：使用 `form-data` npm 包，虽然功能类似，但在构建 multipart 请求时：
  - 字段顺序可能不同
  - 边界格式可能有细微差异
  - 签名参数格式可能不完全匹配 Shopify 的要求

**技术细节**：

```javascript
// Shopify 要求的签名参数格式（来自 Staged Upload）
stagedTarget.parameters = [
  { name: 'key', value: '...' },
  { name: 'policy', value: '...' },
  { name: 'x-goog-algorithm', value: '...' },
  { name: 'x-goog-credential', value: '...' },
  { name: 'x-goog-date', value: '...' },
  { name: 'x-goog-signature', value: '...' },
  // ... 还有其他参数
]

// 必须按照这个顺序，并且文件必须是最后一个字段
formData.append('key', '...');
formData.append('policy', '...');
// ... 其他参数
formData.append('file', fileBuffer); // 文件必须是最后
```

如果 `form-data` 包在处理时改变了顺序或格式，Google Cloud Storage 的签名验证就会失败，返回 403。

## 🔧 尝试过的解决方案

1. ✅ **使用 `form-data` 包**：替换原生 FormData
2. ✅ **调整 FormData 参数顺序**：确保签名参数在前，文件在后
3. ✅ **添加正确的 headers**：使用 `formData.getHeaders()`
4. ✅ **更新 Shopify API 版本**：从 2024-01 到 2024-10
5. ✅ **使用原生 FormData 和 Blob**：Node.js 18+ 原生支持
6. ❌ **仍然遇到 403 错误**

## ✅ 当前解决方案

由于 Shopify Files 上传持续遇到 403 错误，添加了 `SKIP_SHOPIFY_FILES=true` 作为**备用方案**：

### 方案 1: Shopify Files（默认，推荐）

```env
SKIP_SHOPIFY_FILES=false  # 或删除此变量
```

- 文件上传到 Shopify Files（Shopify CDN）
- 永久存储，不会丢失
- 使用 CDN，下载速度快

**问题**：在 Railway 环境中可能遇到 403 错误（FormData 签名验证问题）

### 方案 2: 服务器内存存储（备用）

```env
SKIP_SHOPIFY_FILES=true
```

- 文件存储在 Railway 服务器内存（`global.fileStorage`）
- 简单直接，无需 Shopify Files API
- 避免 403 错误

**缺点**：
- 服务器重启后文件会丢失
- 占用服务器内存
- 不适合生产环境长期使用

## 🎯 当前推荐配置

### 开发/测试环境

```env
SKIP_SHOPIFY_FILES=true  # 使用服务器内存存储，避免 403 错误
```

**原因**：
- 开发测试时，文件丢失影响不大
- 可以快速验证功能
- 避免调试 Shopify Files 上传问题

### 生产环境（建议）

**选项 A：如果 Shopify Files 可以正常工作**

```env
SKIP_SHOPIFY_FILES=false  # 或删除此变量
```

**选项 B：如果仍然遇到 403 错误**

```env
SKIP_SHOPIFY_FILES=true  # 临时使用服务器内存存储
```

**⚠️ 注意**：使用服务器内存存储时：
- 定期备份重要文件
- 考虑使用其他云存储服务（如 AWS S3、Google Cloud Storage）
- 监控服务器内存使用情况

## 🔄 未来改进方向

### 方案 1: 修复 FormData 签名问题

深入研究 `form-data` 包的实现，确保：
- 字段顺序完全符合 Shopify 要求
- 边界格式正确
- 签名参数格式匹配

### 方案 2: 使用其他云存储

替换 Shopify Files，直接使用：
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### 方案 3: 客户端直接上传

修改流程，让客户端直接上传到云存储：
- 客户端获得签名 URL
- 直接上传到云存储
- 后端只保存文件 URL

## 📝 总结

| 问题 | 说明 |
|------|------|
| **是否权限问题** | ❌ 不是，Shopify API 权限正常 |
| **是否测试环境限制** | ❌ 不是，这是技术实现问题 |
| **真正原因** | FormData 签名验证失败（403 Forbidden） |
| **为什么只在 Railway 出现** | Node.js FormData 实现与 Vercel Edge Runtime 不同 |
| **当前解决方案** | 使用 `SKIP_SHOPIFY_FILES=true` 作为备用方案 |
| **推荐配置** | 开发环境用 `true`，生产环境尝试 `false` |

## ❓ 如何验证 Shopify Files 是否可用？

1. **设置环境变量**：
   ```env
   SKIP_SHOPIFY_FILES=false
   ```

2. **重新部署应用**

3. **尝试上传文件**

4. **查看 Railway 日志**：
   - 如果成功：会看到 `✅ 文件上传到临时地址成功`
   - 如果失败：会看到 `❌ 文件上传失败: 403 Forbidden`

5. **根据结果决定**：
   - ✅ 成功 → 保持 `SKIP_SHOPIFY_FILES=false`
   - ❌ 失败 → 使用 `SKIP_SHOPIFY_FILES=true`

