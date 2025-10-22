# 🔧 API错误修复指南

## 🚨 问题诊断

### 当前错误
- **错误信息**: "询价失败: Failed to fetch"
- **错误类型**: 网络连接失败
- **可能原因**: API服务未部署、域名配置错误、网络问题

---

## 🔍 诊断步骤

### 步骤1: 检查API服务状态
打开浏览器控制台 (F12)，查看详细错误信息：

```javascript
// 在控制台中测试API连接
fetch('https://shopify-13s4.vercel.app/api/submit-quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
.then(r => console.log('API连接成功:', r.status))
.catch(e => console.error('API连接失败:', e));
```

### 步骤2: 检查Vercel部署状态
1. 访问你的Vercel控制台
2. 确认项目已成功部署
3. 检查部署日志是否有错误

### 步骤3: 验证API端点
访问以下URL检查API是否可访问：
- `https://shopify-13s4.vercel.app/api/submit-quote`
- `https://shopify-13s4.vercel.app/api/get-draft-order`

---

## 🛠️ 解决方案

### 方案1: 更新API URL
如果Vercel域名不正确，修改API配置：

```javascript
// 在 assets/model-uploader.js 第1081行
const API_BASE = 'https://你的实际域名.vercel.app/api';
```

### 方案2: 重新部署API
如果API服务有问题：

1. **检查Vercel项目**:
   ```bash
   # 确保以下文件存在
   api/submit-quote.js
   api/update-quote.js
   api/get-draft-order.js
   ```

2. **重新部署**:
   - 推送代码到GitHub
   - Vercel会自动重新部署

### 方案3: 临时使用备用API
如果Vercel有问题，可以临时使用其他API服务：

```javascript
// 临时配置
const API_BASE = 'https://备用域名.com/api';
```

---

## 🧪 测试方法

### 测试1: 基础连接测试
```javascript
// 在浏览器控制台运行
fetch('https://shopify-13s4.vercel.app/api/submit-quote')
  .then(response => {
    console.log('状态:', response.status);
    return response.text();
  })
  .then(data => console.log('响应:', data))
  .catch(error => console.error('错误:', error));
```

### 测试2: 完整API测试
```javascript
// 测试完整的询价API
fetch('https://shopify-13s4.vercel.app/api/submit-quote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: 'test.step',
    customerEmail: 'test@example.com',
    customerName: '测试用户',
    quantity: 1,
    material: 'ABS'
  })
})
.then(response => response.json())
.then(data => console.log('API测试结果:', data))
.catch(error => console.error('API测试失败:', error));
```

---

## 📋 常见问题解决

### 问题1: CORS错误
如果出现跨域错误，检查API的CORS配置：

```javascript
// 在API文件中添加CORS头
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 问题2: 404错误
如果API返回404，检查：
1. 文件路径是否正确
2. Vercel部署是否成功
3. 文件名是否正确

### 问题3: 500错误
如果API返回500，检查：
1. 环境变量是否正确配置
2. Shopify API权限是否正确
3. 代码是否有语法错误

---

## 🔄 临时解决方案

如果API暂时无法修复，可以临时回退到原来的购物车系统：

```javascript
// 临时注释掉新的API调用，使用原来的购物车API
// await submitQuoteToDraftOrder();
await addFileToCart(id, fd); // 使用原来的函数
```

---

## 📞 需要的信息

为了进一步诊断问题，请提供：

1. **浏览器控制台错误信息**（完整截图）
2. **Vercel部署状态**（是否成功部署）
3. **实际的Vercel域名**（如果不是shopify-13s4.vercel.app）
4. **网络连接状态**（是否能访问其他网站）

---

## 🎯 快速修复步骤

1. **打开浏览器控制台** (F12)
2. **查看详细错误信息**
3. **测试API连接**（使用上面的测试代码）
4. **检查Vercel部署状态**
5. **更新API URL**（如果需要）
6. **重新测试功能**

---

**请先运行测试代码，然后告诉我具体的错误信息，我会帮你进一步解决问题！**
