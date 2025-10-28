# Railway 环境变量检查清单

## 必需的环境变量

在 Railway 的 **Settings → Variables** 中，为 **production** 环境添加以下三个变量：

### 1. SHOPIFY_STORE_DOMAIN
- **Key:** `SHOPIFY_STORE_DOMAIN`
- **Value:** `sain-pdc-test.myshopify.com`
- **Environment:** production

### 2. SHOPIFY_ACCESS_TOKEN
- **Key:** `SHOPIFY_ACCESS_TOKEN`
- **Value:** 从 Shopify 后台的 "API 凭据" 页面复制的 Admin API 访问令牌（格式：`shpat_...`）
- **Environment:** production

### 3. PUBLIC_BASE_URL
- **Key:** `PUBLIC_BASE_URL`
- **Value:** `https://railway-production-c1a1.up.railway.app`
- **Environment:** production

## 验证步骤

1. 添加完所有变量后，确保已点击 **Save** 保存
2. Railway 会自动触发重新部署
3. 等待 2-3 分钟让部署完成
4. 访问诊断 API：`https://railway-production-c1a1.up.railway.app/api/diagnose-env`
5. 检查返回的 JSON 中的 `hasStoreDomain` 和 `hasAccessToken` 是否为 `true`

## 如何获取 Shopify Access Token

1. 登录 Shopify 管理后台
2. 进入 **Settings → Apps and sales channels**
3. 找到 "Quotes Backend" 应用
4. 点击进入
5. 切换到 **API 凭据** 标签
6. 复制 **Admin API 访问令牌**

## 常见问题

### Q: 为什么还是显示"环境变量未配置"？
A: 需要确保：
1. 变量已添加到 **production** 环境（不是 development）
2. 点击了 **Save** 保存
3. 等待 Railway 完成重新部署（查看 Logs 确认）

### Q: 如何确认变量已保存？
A: 访问 `https://railway-production-c1a1.up.railway.app/api/diagnose-env` 查看实际值

