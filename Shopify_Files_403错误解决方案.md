# Shopify Files 403 错误解决方案

## 🔍 问题分析

### 403 错误原因

**错误信息**：`403 Forbidden: SignatureDoesNotMatch`

**根本原因**：
- Shopify Staged Upload 返回的签名参数必须**严格按照特定顺序**添加到 FormData
- 文件必须是**最后一个字段**
- FormData 的边界（boundary）格式必须正确
- `form-data` 包在 Node.js 中的实现可能与 Shopify 要求的格式不完全匹配

---

## 🔧 解决方案

### 方案 1: 检查 FormData 参数顺序（推荐）

确保签名参数按 Shopify 返回的顺序添加，文件必须是最后一个。

```javascript
// api/store-file-real.js
// 步骤 2: 上传文件到临时地址
const formData = new FormDataClass();

// ✅ 正确：先添加所有签名参数
stagedTarget.parameters.forEach(param => {
  formData.append(param.name, param.value);
});

// ✅ 正确：文件必须是最后一个字段
formData.append('file', fileBuffer, {
  filename: fileName,
  contentType: fileType || 'application/octet-stream'
});

// ❌ 错误：如果文件不是最后一个，签名验证会失败
```

### 方案 2: 使用正确的 FormData 包版本

确保使用最新版本的 `form-data` 包：

```bash
npm install form-data@latest
```

检查 `package.json`：
```json
{
  "dependencies": {
    "form-data": "^4.0.0"  // 确保是最新版本
  }
}
```

### 方案 3: 检查请求头

**不要手动设置 Content-Type**，让 `form-data` 包自动设置：

```javascript
// ✅ 正确：不设置 Content-Type，让 form-data 自动设置
const uploadResponse = await fetch(stagedTarget.url, {
  method: 'POST',
  body: formData  // form-data 会自动设置 Content-Type 和 boundary
});

// ❌ 错误：手动设置 Content-Type 会导致签名验证失败
const uploadResponse = await fetch(stagedTarget.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data'  // 不要这样做！
  },
  body: formData
});
```

### 方案 4: 使用原生 FormData（如果 Node.js 18+）

如果 Railway 使用 Node.js 18+，可以尝试使用原生 FormData：

```javascript
// api/store-file-real.js
// 尝试使用原生 FormData
let FormDataClass;
try {
  // Node.js 18+ 有原生 FormData
  if (global.FormData) {
    FormDataClass = global.FormData;
    console.log('✅ 使用原生 FormData');
  } else {
    FormDataClass = require('form-data');
    console.log('✅ 使用 form-data 包');
  }
} catch (e) {
  FormDataClass = require('form-data');
}

// 使用原生 FormData 时
if (FormDataClass.name === 'FormData') {
  const blob = new Blob([fileBuffer], { type: fileType || 'application/octet-stream' });
  formData.append('file', blob, fileName);
} else {
  // 使用 form-data 包
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: fileType || 'application/octet-stream'
  });
}
```

### 方案 5: 添加详细的调试日志

添加日志来诊断问题：

```javascript
// api/store-file-real.js
console.log('🔍 Staged Upload 参数:');
stagedTarget.parameters.forEach((param, index) => {
  console.log(`  ${index + 1}. ${param.name} = ${param.value.substring(0, 50)}...`);
});

console.log('📤 准备上传文件:');
console.log(`  - URL: ${stagedTarget.url}`);
console.log(`  - 文件名: ${fileName}`);
console.log(`  - 文件大小: ${fileSize} 字节`);
console.log(`  - FormData 类型: ${FormDataClass.name}`);

// 上传后检查响应
if (!uploadResponse.ok) {
  const errorText = await uploadResponse.text();
  console.error('❌ 上传失败详情:');
  console.error(`  - 状态码: ${uploadResponse.status}`);
  console.error(`  - 状态文本: ${uploadResponse.statusText}`);
  console.error(`  - 错误信息: ${errorText}`);
  
  // 检查是否是签名问题
  if (errorText.includes('SignatureDoesNotMatch')) {
    console.error('⚠️ 签名验证失败，可能的原因:');
    console.error('  1. 参数顺序不正确');
    console.error('  2. 文件不是最后一个字段');
    console.error('  3. FormData 边界格式不正确');
  }
}
```

---

## 🛠️ 具体修复步骤

### 步骤 1: 检查当前代码

查看 `api/store-file-real.js` 中的 FormData 使用：

```javascript
// 确保参数顺序正确
stagedTarget.parameters.forEach(param => {
  formData.append(param.name, param.value);
});

// 确保文件是最后一个
formData.append('file', fileBuffer, {
  filename: fileName,
  contentType: fileType || 'application/octet-stream'
});
```

### 步骤 2: 更新 form-data 包

```bash
npm install form-data@latest
npm update form-data
```

### 步骤 3: 测试上传

1. 设置环境变量：
   ```env
   SKIP_SHOPIFY_FILES=false
   ```

2. 重新部署 Railway

3. 尝试上传文件

4. 查看 Railway 日志：
   - 如果成功：`✅ 文件上传到临时地址成功`
   - 如果失败：查看详细的错误信息

### 步骤 4: 根据错误信息调整

**如果仍然是 403 错误**：

1. **检查参数顺序**：
   - 确保按照 Shopify 返回的顺序添加参数
   - 文件必须是最后一个字段

2. **检查 FormData 实现**：
   - 尝试使用原生 FormData（Node.js 18+）
   - 或确保 `form-data` 包是最新版本

3. **检查请求头**：
   - 不要手动设置 `Content-Type`
   - 让 `form-data` 包自动设置

---

## 🔍 调试技巧

### 1. 启用详细日志

在 `api/store-file-real.js` 中添加：

```javascript
console.log('🔍 调试信息:');
console.log('  - FormData 类型:', FormDataClass.name);
console.log('  - 参数数量:', stagedTarget.parameters.length);
console.log('  - 参数名称:', stagedTarget.parameters.map(p => p.name));
console.log('  - 上传 URL:', stagedTarget.url);
console.log('  - 文件大小:', fileSize);
```

### 2. 检查 FormData 内容

```javascript
// 检查 FormData 是否正确构建
if (formData.getHeaders) {
  const headers = formData.getHeaders();
  console.log('📋 FormData Headers:', headers);
}

// 检查参数是否正确添加
console.log('📋 添加的参数:');
stagedTarget.parameters.forEach(param => {
  console.log(`  - ${param.name}: ${param.value.substring(0, 30)}...`);
});
```

### 3. 测试不同的 FormData 实现

```javascript
// 尝试 1: 使用 form-data 包
const FormData1 = require('form-data');
const formData1 = new FormData1();
// ... 测试上传

// 尝试 2: 使用原生 FormData（如果可用）
if (global.FormData) {
  const formData2 = new global.FormData();
  // ... 测试上传
}
```

---

## 📝 常见问题

### Q1: 为什么参数顺序很重要？

**A**: Shopify 的签名验证依赖于参数的**精确顺序**。如果顺序不对，签名验证会失败。

### Q2: 为什么文件必须是最后一个？

**A**: Shopify 的签名算法假设文件是最后一个字段。如果文件不是最后一个，签名验证会失败。

### Q3: 为什么不能手动设置 Content-Type？

**A**: `multipart/form-data` 需要包含 `boundary` 参数，格式如：`Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...`。`form-data` 包会自动生成正确的 boundary，手动设置会导致格式错误。

### Q4: 原生 FormData 和 form-data 包有什么区别？

**A**: 
- **原生 FormData**（Node.js 18+）：浏览器 API 的实现，可能与 Shopify 的要求更匹配
- **form-data 包**：Node.js 的 polyfill，可能在边界格式上有细微差异

---

## ✅ 推荐修复方案

### 方案 A: 优化 FormData 使用（最简单）

```javascript
// api/store-file-real.js
// 确保使用最新版本的 form-data
const FormData = require('form-data');

// 严格按照 Shopify 返回的顺序添加参数
const formData = new FormData();

// 1. 先添加所有签名参数（按 Shopify 返回的顺序）
stagedTarget.parameters.forEach(param => {
  formData.append(param.name, param.value);
  console.log(`✅ 添加参数: ${param.name}`);
});

// 2. 最后添加文件（必须是最后一个）
formData.append('file', fileBuffer, {
  filename: fileName,
  contentType: fileType || 'application/octet-stream'
});
console.log(`✅ 添加文件: ${fileName}`);

// 3. 上传（不设置任何 headers）
const uploadResponse = await fetch(stagedTarget.url, {
  method: 'POST',
  body: formData  // form-data 会自动设置正确的 headers
});
```

### 方案 B: 使用原生 FormData（如果 Node.js 18+）

```javascript
// api/store-file-real.js
// 优先使用原生 FormData
let FormDataClass;
let BlobClass;

if (global.FormData && global.Blob) {
  FormDataClass = global.FormData;
  BlobClass = global.Blob;
  console.log('✅ 使用原生 FormData 和 Blob');
} else {
  FormDataClass = require('form-data');
  console.log('✅ 使用 form-data 包');
}

const formData = new FormDataClass();

// 添加签名参数
stagedTarget.parameters.forEach(param => {
  formData.append(param.name, param.value);
});

// 添加文件
if (BlobClass) {
  // 使用原生 Blob
  const blob = new BlobClass([fileBuffer], { type: fileType || 'application/octet-stream' });
  formData.append('file', blob, fileName);
} else {
  // 使用 form-data 包的方式
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: fileType || 'application/octet-stream'
  });
}
```

---

## 🎯 测试步骤

1. **更新代码**（使用上面的推荐方案）

2. **更新依赖**：
   ```bash
   npm install form-data@latest
   ```

3. **设置环境变量**：
   ```env
   SKIP_SHOPIFY_FILES=false
   ```

4. **重新部署 Railway**

5. **测试上传**：
   - 上传一个小文件（< 1MB）测试
   - 查看 Railway 日志
   - 如果成功，尝试上传大文件

6. **如果仍然失败**：
   - 查看详细的错误信息
   - 检查参数顺序
   - 尝试使用原生 FormData

---

## 📊 成功标志

如果修复成功，日志应该显示：

```
✅ Staged Upload创建成功
✅ 添加参数: key
✅ 添加参数: policy
✅ 添加参数: x-goog-algorithm
✅ 添加参数: x-goog-credential
✅ 添加参数: x-goog-date
✅ 添加参数: x-goog-signature
✅ 添加文件: model.STEP
✅ 文件上传到临时地址成功
✅ 文件记录创建成功: gid://shopify/File/123456
```

---

## ⚠️ 如果仍然失败

如果尝试了所有方案仍然遇到 403 错误：

1. **临时方案**：继续使用 `SKIP_SHOPIFY_FILES=true`（Railway 内存存储）
2. **长期方案**：考虑使用其他云存储服务（AWS S3、Google Cloud Storage）直接上传，然后保存 URL 到 Draft Order

---

## 📝 总结

**403 错误的主要原因**：
- FormData 参数顺序不正确
- 文件不是最后一个字段
- FormData 边界格式不正确

**推荐解决方案**：
1. 确保参数按 Shopify 返回的顺序添加
2. 确保文件是最后一个字段
3. 不要手动设置 Content-Type
4. 使用最新版本的 form-data 包
5. 如果 Node.js 18+，尝试使用原生 FormData

**测试步骤**：
1. 更新代码
2. 更新依赖
3. 设置 `SKIP_SHOPIFY_FILES=false`
4. 重新部署
5. 测试上传

