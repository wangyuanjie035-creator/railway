# Shopify 权限和参数问题诊断

## 🔍 问题确认

从日志看到：**Shopify Staged Upload 只返回了 2 个参数**（`content_type`, `acl`），但正常应该返回 **5-7 个参数**（包括签名参数）。

### 正常应该返回的参数

1. `key` - 文件键名（必须）
2. `policy` - 上传策略（必须）
3. `x-goog-algorithm` - 签名算法（必须）
4. `x-goog-credential` - 凭证信息（必须）
5. `x-goog-date` - 日期时间（必须）
6. `x-goog-signature` - 签名（必须）
7. `x-goog-expires` - 过期时间（可选）
8. `content_type` - 内容类型（可选）
9. `acl` - 访问控制列表（可选）

### 当前返回的参数（异常）

- ✅ `content_type`
- ✅ `acl`
- ❌ **缺少所有签名参数**（`key`, `policy`, `x-goog-*` 等）

**这就是为什么会出现 `403 SignatureDoesNotMatch` 错误！**

---

## 🔍 可能的原因

### 1. Shopify 应用权限不足 ⚠️（最可能）

**问题**：如果 Shopify 应用没有 `write_files` 权限，API 可能只返回基本参数，不返回签名参数。

**解决方法**：

1. **登录 Shopify 后台**
   - 访问：`https://your-store.myshopify.com/admin`

2. **进入应用设置**
   - **设置** (Settings) → **应用和销售渠道** (Apps and sales channels)
   - **开发应用** (Develop apps)

3. **找到你的应用**
   - 查找用于访问 Admin API 的应用

4. **配置权限**
   - 点击 **配置 Admin API 范围** (Configure Admin API scopes)
   - **必须勾选**：
     - ✅ `write_files` - **写入文件**（关键！）
     - ✅ `read_files` - 读取文件（建议）

5. **保存并重新安装**
   - 点击 **保存**
   - 如果提示，点击 **安装应用** (Install app)

6. **更新访问令牌**
   - 获取新的 **Admin API 访问令牌**
   - 在 Railway 环境变量中更新 `SHOPIFY_ACCESS_TOKEN`

---

### 2. 开发商店/测试商店限制

**可能的情况**：
- Shopify 开发商店可能限制某些功能
- 某些测试环境可能不完整支持 Staged Upload

**检查方法**：
- 查看 Shopify 商店类型
- 尝试在生产商店中测试

---

### 3. API 版本问题

**当前使用**：`2024-01`

**尝试**：
- 更新到最新版本 `2024-10`
- 或回退到 `2023-10`

---

## ✅ 验证修复

部署后，查看日志应该看到：

### ✅ 正常情况（有完整权限）

```
🔍 [Shopify Files] Staged Upload 完整响应:
  - 参数数量: 7
  - 参数列表:
    [1] key: ...
    [2] policy: ...
    [3] x-goog-algorithm: ...
    [4] x-goog-credential: ...
    [5] x-goog-date: ...
    [6] x-goog-signature: ...
    [7] content_type: ...
```

### ❌ 异常情况（权限不足）

```
🔍 [Shopify Files] Staged Upload 完整响应:
  - 参数数量: 2
  - 参数列表:
    [1] content_type: ...
    [2] acl: ...
❌ [Shopify Files] 严重警告：返回的参数数量不足！
```

---

## 📋 检查清单

### Shopify 应用权限

- [ ] 已创建 Shopify 应用
- [ ] 已进入 **配置 Admin API 范围**
- [ ] **已勾选 `write_files` 权限**（关键！）
- [ ] 已勾选 `read_files` 权限（建议）
- [ ] 已保存权限设置
- [ ] 应用已重新安装
- [ ] 已获取新的 Admin API 访问令牌
- [ ] 已在 Railway 中更新 `SHOPIFY_ACCESS_TOKEN` 环境变量

---

## 💡 总结

### 问题根源

**这是 Shopify 权限问题，不是代码问题**。

如果 Shopify 只返回 2 个参数：
- ✅ 代码正常（Staged Upload API 调用成功）
- ❌ 但缺少签名参数（权限不足）
- ❌ 导致无法上传到 Google Cloud Storage

### 解决方法

**最重要的是检查并配置 Shopify 应用权限**：

1. ✅ 确保已勾选 `write_files` 权限
2. ✅ 重新安装应用
3. ✅ 更新访问令牌
4. ✅ 重新部署测试

---

**最后更新**: 2025-01-21

