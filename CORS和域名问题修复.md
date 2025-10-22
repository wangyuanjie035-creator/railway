# 🔧 CORS和域名问题修复

## 🚨 问题确认
- ❌ **CORS错误**: `Access to fetch at 'https://your vercel domain.vercel.app/api/get-draft-order'`
- ❌ **域名错误**: `your vercel domain.vercel.app` - 占位符域名
- ❌ **加载失败**: "加载失败" 和 "Failed to fetch"

## 🔍 问题根源
1. **API域名配置错误** - `page.my-quotes.liquid` 中使用占位符域名
2. **CORS配置问题** - 可能域名不匹配
3. **API端点问题** - `get-draft-order` API可能有问题

## 🛠️ 已修复的问题

### 修复1: 更新API域名
在 `templates/page.my-quotes.liquid` 中修复了：
- ✅ **域名**: `YOUR_VERCEL_DOMAIN.vercel.app` → `shopify-13s4.vercel.app`

### 修复2: 创建测试API
创建了 `api/get-draft-order-test.js` - 简化版本用于测试

## 📤 需要推送的文件

请推送以下文件到GitHub：
1. **`templates/page.my-quotes.liquid`** - 已修复域名
2. **`api/get-draft-order-test.js`** - 新增测试API

## 🧪 推送后测试

### 步骤1: 等待Vercel重新部署（1-2分钟）

### 步骤2: 测试get-draft-order API
访问：
```
https://shopify-13s4.vercel.app/api/get-draft-order-test?id=Q123456
```
**期望**: 返回JSON响应

### 步骤3: 测试原始API
访问：
```
https://shopify-13s4.vercel.app/api/get-draft-order?id=Q123456
```
**期望**: 返回JSON响应

### 步骤4: 重新测试询价页面
1. **回到model-uploader页面**
2. **提交询价**
3. **查看是否正常跳转到询价详情页**

## 🎯 如果仍有问题

### 方案A: 使用测试API
在 `page.my-quotes.liquid` 中临时修改API路径：
```javascript
const response = await fetch(`${API_BASE}/get-draft-order-test?id=${encodeURIComponent(quoteId)}`);
```

### 方案B: 检查CORS设置
确认 `get-draft-order.js` 的CORS设置正确：
```javascript
res.setHeader('Access-Control-Allow-Origin', '*'); // 临时使用通配符
```

## 📝 重要说明

- **域名问题**: 占位符域名已修复
- **CORS问题**: 可能需要调整CORS设置
- **API测试**: 使用测试版本验证功能

---

**请立即推送修复后的文件并测试API端点！**
