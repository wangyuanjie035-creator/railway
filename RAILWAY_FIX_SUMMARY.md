# Railway 部署修复总结

## 当前问题

1. **文件上传失败（500错误）**：`api/store-file-real.js` 无法将文件上传到 Shopify Files
2. **文件下载失败（404错误）**：因为上传失败，`shopifyFileId` 为 "未上传"，导致下载也失败

## 修复方案

### 1. 添加 form-data 依赖

已在 `package.json` 中添加：
```json
"form-data": "^4.0.0"
```

### 2. 修复 store-file-real.js

已修改 `api/store-file-real.js` 使用 Node.js 兼容的 FormData API：
- 导入 `const FormData = require('form-data');`
- 使用 `formData.append('file', fileBuffer, {filename, contentType})`
- 添加 `headers: formData.getHeaders()`

### 3. 修复 download-order-file 逻辑

已修改 `templates/page.admin-draft-orders.liquid` 的 `downloadOrderFile` 函数：
- 优先使用 `shopifyFileId` 通过 API 下载
- 如果 `shopifyFileId` 存在，构造正确的下载 URL

## 验证步骤

1. **等待 Railway 重新部署**（2-3 分钟）
2. **上传新文件**测试：
   - 访问询价页面
   - 上传一个 3D 模型文件
   - 检查 Railway Logs 中是否不再出现 500 错误
   - 检查 Shopify Draft Order 的 customAttributes 中 `Shopify文件ID` 是否有值
3. **测试下载**：
   - 在草稿订单管理页面
   - 点击下载按钮
   - 应该可以成功下载

## 如果仍然失败

检查 Railway 部署日志，确认：
- `form-data` 是否已正确安装（查看 npm install 日志）
- `store-file-real` API 是否成功（查看是否有 "Staged Upload创建成功" 日志）
- Shopify Files API 返回了什么错误（查看详细的错误信息）

