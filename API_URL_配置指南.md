# 🔧 API URL 配置指南

## 📝 需要修改的文件

你需要在以下 **3 个文件**中修改 `API_BASE` 为你的实际 Vercel 域名：

1. ✅ `templates/page.my-quotes.liquid` (第 308 行)
2. ✅ `templates/page.quote-request.liquid` (第 408 行)
3. ✅ `templates/page.admin-draft-orders.liquid` (第 637 行)

---

## 🎯 如何获取你的 Vercel 域名

### 方法 1: 从 Vercel 控制台获取

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 在项目页面顶部，你会看到域名，例如：
   ```
   https://shopify-13s4.vercel.app
   ```
4. 复制这个域名（不包括最后的 `/`）

### 方法 2: 从部署日志获取

部署完成后，Vercel 会显示：
```
✅ Deployed to https://your-project-name.vercel.app
```

---

## ✏️ 如何修改

### 步骤 1: 打开文件

使用文本编辑器打开以下文件：

#### 文件 1: `templates/page.my-quotes.liquid`

找到第 308 行左右：
```javascript
const API_BASE = 'https://YOUR_VERCEL_DOMAIN.vercel.app/api';  // ← 请修改为你的实际 Vercel 域名
```

**修改为**（替换 `YOUR_VERCEL_DOMAIN` 为你的实际域名）:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';  // ← 你的实际域名
```

---

#### 文件 2: `templates/page.quote-request.liquid`

找到第 408 行左右：
```javascript
const API_BASE = 'https://YOUR_VERCEL_DOMAIN.vercel.app/api';  // ← 请修改为你的实际 Vercel 域名
```

**修改为**:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';  // ← 你的实际域名
```

---

#### 文件 3: `templates/page.admin-draft-orders.liquid`

找到第 637 行左右：
```javascript
const API_BASE = 'https://YOUR_VERCEL_DOMAIN.vercel.app/api';  // ← 请修改为你的实际 Vercel 域名
```

**修改为**:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';  // ← 你的实际域名
```

---

## 📋 完整示例

假设你的 Vercel 域名是 `https://my-shopify-app.vercel.app`

### 修改前
```javascript
const API_BASE = 'https://YOUR_VERCEL_DOMAIN.vercel.app/api';
```

### 修改后
```javascript
const API_BASE = 'https://my-shopify-app.vercel.app/api';
```

---

## ⚠️ 注意事项

### 1. 保留 `/api` 后缀

✅ **正确**:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';
```

❌ **错误**（缺少 `/api`）:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app';
```

❌ **错误**（多了 `/`）:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api/';
```

---

### 2. 不要包含协议以外的内容

✅ **正确**:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';
```

❌ **错误**（包含了具体的 API 路径）:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api/submit-quote';
```

---

### 3. 使用 HTTPS 而不是 HTTP

✅ **正确**:
```javascript
const API_BASE = 'https://shopify-13s4.vercel.app/api';
```

❌ **错误**（使用了 HTTP）:
```javascript
const API_BASE = 'http://shopify-13s4.vercel.app/api';
```

---

## 🧪 如何验证配置是否正确

### 方法 1: 浏览器控制台测试

1. 上传修改后的文件到 Shopify
2. 访问 `/pages/quote-request`
3. 按 F12 打开浏览器控制台
4. 在 Console 标签中输入：
   ```javascript
   console.log(API_BASE);
   ```
5. 应该显示你的 Vercel 域名，例如：
   ```
   https://shopify-13s4.vercel.app/api
   ```

---

### 方法 2: 测试 API 连接

1. 在浏览器控制台中输入：
   ```javascript
   fetch(API_BASE + '/get-draft-order?id=test')
     .then(r => r.json())
     .then(data => console.log('API 连接成功:', data))
     .catch(err => console.error('API 连接失败:', err));
   ```

2. 如果看到 `API 连接成功` 或者返回数据，说明配置正确
3. 如果看到 `API 连接失败` 或者 CORS 错误，检查：
   - Vercel 域名是否正确
   - API 是否已部署
   - CORS 设置是否正确

---

## 🔄 修改后的步骤

### 1. 保存文件

修改完成后，保存所有 3 个文件。

---

### 2. 重新上传到 Shopify

**方法 A: 使用主题编辑器**

1. Shopify 后台 → 在线商店 → 主题
2. 点击"自定义" → 左侧菜单
3. 找到对应的文件并替换

**方法 B: 使用 Shopify CLI**

```bash
shopify theme push --path templates/page.my-quotes.liquid
shopify theme push --path templates/page.quote-request.liquid
shopify theme push --path templates/page.admin-draft-orders.liquid
```

---

### 3. 清除浏览器缓存

修改后，建议清除浏览器缓存或使用无痕模式测试。

---

### 4. 测试功能

1. 访问 `/pages/quote-request`
2. 尝试提交询价
3. 检查浏览器控制台是否有错误

---

## 🆘 常见问题

### Q1: 修改后仍然连接失败

**解决方案**:
1. 检查 Vercel 是否已部署成功
2. 检查域名拼写是否正确
3. 清除浏览器缓存
4. 使用无痕模式测试

---

### Q2: 显示 CORS 错误

**原因**: API 的 CORS 设置中没有包含你的 Shopify 域名

**解决方案**:
在 API 文件中添加你的 Shopify 域名：

```javascript
// api/submit-quote.js, api/update-quote.js, api/get-draft-order.js
res.setHeader('Access-Control-Allow-Origin', 'https://your-store.myshopify.com');
```

或者使用通配符（不推荐生产环境）:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

---

### Q3: 如何使用自定义域名

如果你在 Vercel 配置了自定义域名（如 `api.yourcompany.com`），使用自定义域名：

```javascript
const API_BASE = 'https://api.yourcompany.com/api';
```

---

## ✅ 检查清单

修改完成后，确认以下事项：

- [ ] 已获取 Vercel 域名
- [ ] 已修改 `page.my-quotes.liquid` 中的 `API_BASE`
- [ ] 已修改 `page.quote-request.liquid` 中的 `API_BASE`
- [ ] 已修改 `page.admin-draft-orders.liquid` 中的 `API_BASE`
- [ ] 域名格式正确（包含 `https://` 和 `/api`）
- [ ] 已重新上传到 Shopify
- [ ] 已清除浏览器缓存
- [ ] 已测试功能正常

---

## 📚 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速开始指南
- [IMPLEMENTATION_GUIDE.md](./草稿订单的完整部署指南.md) - 完整部署指南

---

**配置完成！** 🎉

如有任何问题，请参考上述文档或检查浏览器控制台的错误信息。

