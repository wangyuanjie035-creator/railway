# 🚀 快速开始指南

## 📝 5 分钟快速部署

### 步骤 1: 部署到 Vercel (2 分钟)

```bash
# 1. 提交新文件到 Git
git add api/submit-quote.js api/update-quote.js api/get-draft-order.js
git commit -m "feat: 添加 Draft Order 报价 API"
git push

# 2. Vercel 自动部署（等待 1-2 分钟）
# 访问 https://vercel.com/dashboard 查看部署状态
```

✅ **完成后**: 获取你的 Vercel 域名（如 `https://shopify-13s4.vercel.app`）

---

### 步骤 2: 上传到 Shopify 主题 (2 分钟)

**方法 A: 使用主题编辑器** (推荐)

1. Shopify 后台 → 在线商店 → 主题
2. 点击"自定义" → 左侧菜单 → "添加"
3. 上传 `templates/page.quote-request.liquid`
4. 上传 `templates/page.my-quotes.liquid`

**方法 B: 使用 Shopify CLI**

```bash
shopify theme push --path templates/page.quote-request.liquid
shopify theme push --path templates/page.my-quotes.liquid
```

---

### 步骤 3: 配置 API URL (1 分钟)

修改以下文件中的 `API_BASE`：

#### 文件 1: `templates/page.my-quotes.liquid` (第 245 行)

```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';  // ← 改为你的域名
```

#### 文件 2: `templates/page.quote-request.liquid` (第 348 行)

```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';  // ← 改为你的域名
```

重新上传这两个文件。

---

### 步骤 4: 创建 Shopify 页面 (1 分钟)

#### 页面 1: 询价请求

1. Shopify 后台 → 在线商店 → 页面 → 添加页面
2. 填写:
   - **标题**: `询价请求`
   - **内容**: (留空)
   - **模板**: 选择 `page.quote-request`
3. 点击"保存"
4. 记住 URL: `https://your-store.myshopify.com/pages/quote-request`

#### 页面 2: 我的询价

1. Shopify 后台 → 在线商店 → 页面 → 添加页面
2. 填写:
   - **标题**: `我的询价`
   - **内容**: (留空)
   - **模板**: 选择 `page.my-quotes`
3. 点击"保存"
4. 记住 URL: `https://your-store.myshopify.com/pages/my-quotes`

---

### 步骤 5: 测试 (5 分钟)

#### 测试 1: 提交询价

1. 访问 `https://your-store.myshopify.com/pages/quote-request`
2. 上传一个测试文件 (如 `test.step`)
3. 填写参数:
   - 数量: 100
   - 材质: ABS
   - 邮箱: your-email@example.com
4. 点击"提交询价"
5. ✅ 应该看到成功消息和询价单号 (如 #D1001)
6. ✅ 自动跳转到查看页面

#### 测试 2: 查看询价

1. 在查看页面，应该看到:
   - 🟡 待报价
   - 文件名、数量、材质
   - "客服正在为您报价"
2. ✅ 状态显示正确

#### 测试 3: 后台查看 Draft Order

1. Shopify 后台 → 订单 → 草稿订单
2. ✅ 应该看到刚创建的订单 #D1001
3. ✅ 价格显示 ¥0.01
4. ✅ Tags 包含 "quote", "pending"

#### 测试 4: 添加报价

**使用 API 测试**:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/update-quote \
  -H "Content-Type: application/json" \
  -d '{
    "draftOrderId": "gid://shopify/DraftOrder/YOUR_ORDER_ID",
    "amount": 1500,
    "note": "测试报价"
  }'
```

**或在 Shopify 后台手动修改**:
1. 打开 Draft Order
2. 编辑 Line Item 价格为 1500
3. 保存

#### 测试 5: 客户下单

1. 刷新客户查看页面
2. ✅ 应该显示 🟢 已报价
3. ✅ 显示金额 ¥1,500
4. 点击"立即下单"
5. ✅ 跳转到 Shopify 结账页面
6. ✅ 价格正确

---

## ✅ 完成！

你的 Draft Order 报价系统已经部署完成！

---

## 📋 检查清单

- [ ] Vercel 部署成功
- [ ] Shopify 主题文件已上传
- [ ] API URL 已配置
- [ ] Shopify 页面已创建
- [ ] 测试流程全部通过
- [ ] Shopify API 权限已添加 (`write_draft_orders`, `read_draft_orders`)

---

## 🆘 遇到问题？

### 问题 1: API 返回 401 错误

**解决方案**:
1. 检查 Vercel 环境变量
2. 确认 `SHOPIFY_ACCESS_TOKEN` 正确
3. 确认已添加 `write_draft_orders` 权限

### 问题 2: 文件上传失败

**解决方案**:
1. 检查文件大小（建议 < 100MB）
2. 检查文件格式
3. 查看 Vercel 日志

### 问题 3: 页面显示空白

**解决方案**:
1. 检查浏览器控制台错误
2. 确认 `API_BASE` URL 正确
3. 确认 Shopify 页面模板选择正确

### 问题 4: Draft Order 价格没有更新

**解决方案**:
1. 检查 `update-quote` API 日志
2. 确认 `draftOrderId` 格式正确（`gid://shopify/DraftOrder/...`）
3. 在 Shopify 后台手动查看 Draft Order

---

## 📚 更多信息

- **完整文档**: 查看 `IMPLEMENTATION_GUIDE.md`
- **方案说明**: 查看 `FINAL_DRAFT_ORDER_SOLUTION.md`
- **测试指南**: 查看 `IMPLEMENTATION_GUIDE.md` 的测试部分

---

## 🎯 下一步

1. **培训客服**: 教客服如何使用 Draft Order 系统
2. **监控运行**: 观察第一批订单的运行情况
3. **收集反馈**: 听取客户和客服的反馈
4. **优化系统**: 根据反馈进行优化

---

**祝您使用愉快！** 🎉

