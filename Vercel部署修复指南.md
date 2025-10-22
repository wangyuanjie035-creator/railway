# 🔧 Vercel部署修复指南

## 🔍 问题诊断

### 当前状态
- ✅ **Vercel项目**: `shopify-13s4` 已成功部署
- ✅ **域名**: `shopify-13s4.vercel.app` 正确
- ❌ **主页面**: 显示404错误
- ❌ **API调用**: "Failed to fetch" 错误
- ❌ **运行时日志**: 无API调用记录

### 根本原因
Vercel部署成功，但API路由可能没有正确配置或存在语法错误。

---

## 🛠️ 立即修复步骤

### 步骤1: 测试API端点
访问以下URL测试API是否工作：

```
https://shopify-13s4.vercel.app/api/test
```

如果返回JSON响应，说明API路由正常。

### 步骤2: 测试询价API
```
https://shopify-13s4.vercel.app/api/submit-quote
```

如果返回错误信息，说明API存在但有问题。

### 步骤3: 检查环境变量
在Vercel控制台中检查环境变量：
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_ACCESS_TOKEN`

---

## 🔧 可能的修复方案

### 方案1: 重新部署
1. **推送代码到GitHub**:
   ```bash
   git add .
   git commit -m "Fix API deployment"
   git push origin main
   ```

2. **等待Vercel自动重新部署**

### 方案2: 检查API文件语法
确保所有API文件没有语法错误：

```javascript
// 检查文件是否有语法错误
node -c api/submit-quote.js
node -c api/get-draft-order.js
node -c api/update-quote.js
```

### 方案3: 添加错误处理
在API文件中添加更好的错误处理：

```javascript
export default async function handler(req, res) {
  try {
    // API逻辑
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

---

## 🧪 测试步骤

### 测试1: 基础API测试
```javascript
// 在浏览器控制台运行
fetch('https://shopify-13s4.vercel.app/api/test')
  .then(response => response.json())
  .then(data => console.log('测试结果:', data))
  .catch(error => console.error('测试失败:', error));
```

### 测试2: 询价API测试
```javascript
fetch('https://shopify-13s4.vercel.app/api/submit-quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'test.step',
    customerEmail: 'test@example.com',
    customerName: '测试用户',
    quantity: 1,
    material: 'ABS'
  })
})
.then(response => response.json())
.then(data => console.log('询价测试结果:', data))
.catch(error => console.error('询价测试失败:', error));
```

---

## 📋 检查清单

### Vercel配置检查
- [ ] 项目已连接到正确的GitHub仓库
- [ ] 环境变量已正确设置
- [ ] 部署日志没有错误
- [ ] API文件在正确的位置 (`api/` 目录)

### API文件检查
- [ ] `api/submit-quote.js` 存在且语法正确
- [ ] `api/get-draft-order.js` 存在且语法正确
- [ ] `api/update-quote.js` 存在且语法正确
- [ ] 所有API文件都有正确的 `export default` 导出

### 环境变量检查
- [ ] `SHOPIFY_STORE_DOMAIN` 已设置
- [ ] `SHOPIFY_ACCESS_TOKEN` 已设置且有效

---

## 🚨 紧急修复

如果API仍然无法工作，可以临时使用备用方案：

### 临时方案1: 使用原来的购物车API
修改 `assets/model-uploader.js`，临时回退到原来的功能：

```javascript
// 临时注释掉新的API调用
// await submitQuoteToDraftOrder();

// 使用原来的购物车功能
for (const id of selectedFileIds) {
  const fd = fileManager.files.get(id);
  if (!fd) continue;
  await addFileToCart(id, fd);
}
```

### 临时方案2: 使用其他API服务
如果有其他可用的API服务，可以临时修改API URL。

---

## 📞 下一步行动

1. **立即测试**: 访问 `https://shopify-13s4.vercel.app/api/test`
2. **检查结果**: 告诉我测试结果
3. **查看日志**: 如果测试失败，检查Vercel部署日志
4. **重新部署**: 如果需要，重新推送代码

---

**请先测试API端点，然后告诉我结果，我会根据具体情况提供进一步的解决方案！**
