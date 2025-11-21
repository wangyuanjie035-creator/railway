# 解决 SKIP_SHOPIFY_FILES=true 问题

## 🔍 问题诊断

从日志中看到：
```
⚠️ SKIP_SHOPIFY_FILES=true, 跳过 Shopify Files, 使用本地存储
```

这说明 Railway 环境变量中设置了 `SKIP_SHOPIFY_FILES=true`，导致文件上传到 Shopify Files 被跳过。

---

## ✅ 解决方案

### 方法 1: 删除环境变量（推荐）

1. **打开 Railway 项目**
   - 登录 Railway
   - 打开你的项目

2. **打开环境变量设置**
   - 点击 "Variables" 标签
   - 找到 `SKIP_SHOPIFY_FILES` 变量

3. **删除变量**
   - 点击变量右侧的删除按钮（垃圾桶图标）
   - 确认删除

4. **重新部署**
   - 保存后，Railway 会自动重新部署
   - 或手动点击 "Redeploy"

### 方法 2: 设置为 false

如果不想删除，可以设置为 `false`：

1. **编辑环境变量**
   - 找到 `SKIP_SHOPIFY_FILES` 变量
   - 点击编辑

2. **设置值**
   ```
   SKIP_SHOPIFY_FILES=false
   ```

3. **保存并重新部署**

---

## 🔍 验证修复

重新部署后，查看日志，应该看到：

### ✅ 正确的日志（上传到 Shopify Files）

```
📁 开始上传文件到 Shopify Files...
📁 [Shopify Files] 开始上传文件: [文件名], 大小: [大小] 字节
✅ [Shopify Files] Staged Upload创建成功
✅ [Shopify Files] 文件上传到临时地址成功
✅ [Shopify Files] 文件记录创建成功
✅ 文件上传到 Shopify Files 成功
```

### ❌ 错误的日志（跳过 Shopify Files）

```
⚠️ SKIP_SHOPIFY_FILES=true，跳过 Shopify Files，使用本地存储
```

如果看到这个警告，说明环境变量仍然设置为 `true`。

---

## 📋 检查清单

在 Railway 环境变量中确认：

- [ ] `SKIP_SHOPIFY_FILES` 变量**不存在**，或
- [ ] `SKIP_SHOPIFY_FILES` 变量值为 `false`

---

## 💡 注意事项

1. **默认行为**：
   - 如果 `SKIP_SHOPIFY_FILES` **不存在** → 会上传到 Shopify Files ✅
   - 如果 `SKIP_SHOPIFY_FILES=false` → 会上传到 Shopify Files ✅
   - 如果 `SKIP_SHOPIFY_FILES=true` → 会跳过，使用本地存储 ⚠️

2. **使用场景**：
   - **生产环境**：不要设置此变量（使用 Shopify Files）✅
   - **紧急回退**：如果 Shopify Files 上传遇到问题，可以临时设置为 `true` ⚠️

3. **本地存储限制**：
   - 文件存储在 Railway 服务器内存中
   - 服务器重启后文件会丢失
   - 不适合生产环境使用

---

## 🎯 预期结果

修复后，文件应该：
- ✅ 上传到 Shopify Files（永久存储）
- ✅ 获得 Shopify CDN URL
- ✅ 可以随时下载
- ✅ 不依赖于服务器重启

---

**最后更新**: 2025-01-21

