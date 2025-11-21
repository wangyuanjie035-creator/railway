# Staged Upload API 详细说明

## 🤔 你的疑问

> 创建 Staged Upload 的 API 接口，那不是有文件上传存储功能吗？

**答案**：Staged Upload API 只是一个**接口**，用来获取上传所需的参数，但**不提供文件处理环境**。

---

## 🔍 Staged Upload API 实际做了什么？

### Staged Upload API 的作用

```javascript
// 步骤 1: 调用 Shopify Staged Upload API
const stagedUploadMutation = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url              // 临时上传 URL（Google Cloud Storage）
        resourceUrl      // 资源 URL
        parameters {     // 签名参数
          name
          value
        }
      }
    }
  }
`;

const response = await fetch(`https://${storeDomain}/admin/api/2024-01/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken
  },
  body: JSON.stringify({
    query: stagedUploadMutation,
    variables: {
      input: [{
        filename: fileName,
        mimeType: 'application/step',
        resource: 'FILE'
      }]
    }
  })
});
```

**返回结果**：
```json
{
  "data": {
    "stagedUploadsCreate": {
      "stagedTargets": [{
        "url": "https://storage.googleapis.com/...",  // Google Cloud Storage URL
        "resourceUrl": "gid://shopify/StagedUploadTarget/...",
        "parameters": [
          { "name": "key", "value": "..." },
          { "name": "policy", "value": "..." },
          { "name": "x-goog-algorithm", "value": "..." },
          { "name": "x-goog-credential", "value": "..." },
          { "name": "x-goog-date", "value": "..." },
          { "name": "x-goog-signature", "value": "..." }
        ]
      }]
    }
  }
}
```

### 关键点

**Staged Upload API 只是返回了**：
- ✅ 临时上传 URL（Google Cloud Storage 的 URL）
- ✅ 签名参数（用于验证身份）
- ✅ 资源 URL（用于后续创建文件记录）

**Staged Upload API 不能做**：
- ❌ 不能接收文件数据
- ❌ 不能处理文件上传
- ❌ 不能存储文件（它只是返回存储位置的 URL）

---

## 🔄 完整的文件上传流程

### 流程分析

```
┌─────────────────────────────────────────────────────────────┐
│  步骤 1: 调用 Staged Upload API（Shopify 提供）              │
├─────────────────────────────────────────────────────────────┤
│  ❓ 问题：这是"文件上传存储功能"吗？                          │
│                                                              │
│  答案：❌ 不是                                                │
│  - 它只是返回"上传到哪里"和"如何签名"的信息                   │
│  - 它不接收文件，不处理文件，不存储文件                       │
│  - 就像给你一张"快递单"，但你不能把包裹寄给这张单子         │
└─────────────────────────────────────────────────────────────┘
         ↓ 返回临时 URL 和签名参数

┌─────────────────────────────────────────────────────────────┐
│  步骤 2: 上传文件到 Google Cloud Storage（外部服务器处理）   │
├─────────────────────────────────────────────────────────────┤
│  ✅ 这里才是真正的"文件上传存储"                              │
│  - 外部服务器接收文件数据                                     │
│  - 外部服务器构建 FormData（包含签名参数和文件）              │
│  - 外部服务器上传到 Google Cloud Storage                     │
│  - 这一步 Shopify 完全不参与                                 │
└─────────────────────────────────────────────────────────────┘
         ↓ 上传成功

┌─────────────────────────────────────────────────────────────┐
│  步骤 3: 创建永久文件记录（Shopify 提供接口）                │
├─────────────────────────────────────────────────────────────┤
│  ✅ 这里只是"创建记录"，不是"存储文件"                        │
│  - 文件已经在 Google Cloud Storage 存储好了                  │
│  - Shopify 只是创建一个"文件记录"，指向这个文件               │
│  - 就像创建一个"快捷方式"，指向已经存在的文件                │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 关键区别

### "接口" vs "功能"

| 项目 | Staged Upload API | 文件上传存储功能 |
|------|------------------|----------------|
| **作用** | 返回上传参数 | 实际上传文件 |
| **接收文件** | ❌ 不接收 | ✅ 接收 |
| **处理文件** | ❌ 不处理 | ✅ 处理 |
| **存储文件** | ❌ 不存储 | ✅ 存储 |
| **类比** | 快递单 | 实际寄快递 |

### 类比说明

**Staged Upload API 就像"快递单"**：

```
1. 你告诉 Shopify："我要寄一个包裹"
   ↓
2. Shopify 给你一张"快递单"（Staged Upload API 返回）
   - 上面有：寄件地址（Google Cloud Storage URL）
   - 上面有：签名（签名参数）
   ↓
3. 你拿着快递单去邮局寄包裹（外部服务器上传）
   - 这一步 Shopify 不参与
   ↓
4. 寄件成功后，你告诉 Shopify："包裹已寄出"（创建文件记录）
```

**关键点**：
- ✅ Shopify 提供"快递单"（Staged Upload API）
- ❌ Shopify **不提供**"邮局"（文件上传环境）
- ✅ 你需要自己的"邮局"（Railway 服务器）来实际寄包裹（上传文件）

---

## 🔍 代码证明

让我们看看实际代码：

### 步骤 1: Staged Upload API（Shopify）

```javascript
// api/store-file-real.js
// 这一步只是"获取上传参数"，不涉及文件上传

const stagedUploadResponse = await fetch(`https://${storeDomain}/admin/api/2024-01/graphql.json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',  // 只是 JSON，没有文件
    'X-Shopify-Access-Token': accessToken
  },
  body: JSON.stringify({  // 只发送 JSON 元数据，不发送文件
    query: stagedUploadMutation,
    variables: {
      input: [{
        filename: fileName,  // 只是文件名
        mimeType: fileType,  // 只是文件类型
        resource: 'FILE'
      }]
    }
  })
});
```

**注意**：
- ✅ 只发送 JSON 数据（文件名、类型等）
- ❌ **不发送文件内容**
- ✅ 只返回参数，不处理文件

### 步骤 2: 实际上传文件（外部服务器）

```javascript
// api/store-file-real.js
// 这一步才是真正的"文件上传存储"

// 1. 外部服务器接收文件（已经在 req.body 中）
const { fileData, fileName } = req.body;
const fileBuffer = Buffer.from(base64Data, 'base64');

// 2. 外部服务器构建 FormData（包含签名参数和文件）
const formData = new FormDataClass();
stagedTarget.parameters.forEach(param => {
  formData.append(param.name, param.value);  // 添加签名参数
});
formData.append('file', fileBuffer, {  // 添加文件（这才是文件上传）
  filename: fileName,
  contentType: fileType
});

// 3. 外部服务器上传到 Google Cloud Storage
const uploadResponse = await fetch(stagedTarget.url, {  // 直接上传到 GCS
  method: 'POST',
  body: formData  // 包含文件数据
});
```

**注意**：
- ✅ 这一步在 **Railway 服务器**上执行
- ✅ 文件数据在 Railway 服务器处理
- ✅ 从 Railway 服务器上传到 Google Cloud Storage
- ❌ Shopify 完全不参与这一步

---

## 📊 对比分析

### Shopify Files API 的能力

| API | 作用 | 是否处理文件 | 是否存储文件 |
|-----|------|------------|------------|
| **Staged Upload API** | 返回上传参数 | ❌ | ❌ |
| **File Create API** | 创建文件记录 | ❌ | ❌ |
| **File Query API** | 查询文件信息 | ❌ | ❌ |

**结论**：Shopify Files API **只有接口，没有文件处理功能**。

### 文件处理功能在哪里？

| 功能 | 位置 | 说明 |
|------|------|------|
| **接收文件** | Railway 服务器 | `req.body.fileData` |
| **处理文件** | Railway 服务器 | `Buffer.from(base64Data, 'base64')` |
| **构建上传请求** | Railway 服务器 | `new FormDataClass()` |
| **实际上传文件** | Railway → Google Cloud Storage | `fetch(stagedTarget.url, { body: formData })` |

**结论**：文件处理功能**全部在外部服务器（Railway）**。

---

## ✅ 总结

### 你的疑问

> 创建 Staged Upload 的 API 接口，那不是有文件上传存储功能吗？

### 答案

**Staged Upload API 不是文件上传存储功能**，它只是：

1. **提供接口** ✅
   - 返回临时上传 URL
   - 返回签名参数

2. **不提供功能** ❌
   - ❌ 不接收文件
   - ❌ 不处理文件
   - ❌ 不存储文件
   - ❌ 不提供文件处理环境

### 真正的文件上传存储功能

**在外部服务器（Railway）**：
- ✅ 接收文件数据
- ✅ 处理文件数据（Base64 转换、验证等）
- ✅ 构建上传请求（FormData）
- ✅ 实际上传到 Google Cloud Storage

### 类比

- **Staged Upload API** = "快递单"（告诉你寄到哪里，如何签名）
- **文件上传存储功能** = "邮局"（实际接收和处理包裹的地方）

**Shopify 提供"快递单"，但不提供"邮局"**。

这就是为什么需要 Railway 等外部服务器的原因。

