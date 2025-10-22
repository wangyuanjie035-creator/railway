# API 故障排除指南

## 🚨 当前问题分析

从您提供的截图可以看到，API测试页面显示以下错误：

### 主要错误
1. **GET请求错误**：`Unexpected token '<', "<!doctype" ... is not valid JSON`
2. **POST请求错误**：`HTTP error! status: 404`
3. **API状态检查错误**：`Expected JSON but got text/html; charset utf-8`

### 问题根源
API端点返回HTML页面而不是JSON数据，这是因为：
1. Shopify页面模板系统默认返回完整的HTML页面
2. 缺少App Proxy配置
3. 请求头设置不正确

## 🛠️ 解决方案

### 方案一：使用App Proxy（推荐）

#### 1. 创建App Proxy配置
在Shopify后台设置App Proxy：

1. 进入 **设置 > 应用和销售渠道**
2. 点击 **开发应用**
3. 创建新应用或编辑现有应用
4. 在 **App Proxy** 部分添加：
   - **Subpath prefix**: `quotes-api`
   - **Subpath**: `quotes-api`
   - **URL**: `https://your-domain.com/apps/quotes-api`

#### 2. 验证App Proxy
访问：`https://your-store.myshopify.com/apps/quotes-api`

应该返回纯JSON数据而不是HTML页面。

### 方案二：修复页面模板

#### 1. 确保正确的请求头
API客户端必须设置正确的请求头：

```javascript
const response = await fetch('/pages/quotes-api', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

#### 2. 检查页面模板
确保 `templates/page.quotes-api.liquid` 包含正确的条件判断：

```liquid
{% if request.headers['Accept'] contains 'application/json' %}
  {"records": [], "status": "success"}
{% else %}
  <!DOCTYPE html>...
{% endif %}
```

### 方案三：使用新的测试工具

我已经创建了一个专门的API测试工具：

#### 1. 创建测试页面
在Shopify后台创建页面：
- **页面标题**: `api-test`
- **页面模板**: `page.api-test`

#### 2. 访问测试工具
访问：`https://your-store.myshopify.com/pages/api-test`

这个工具会：
- 自动检测API状态
- 测试所有端点
- 提供详细的错误信息
- 显示调试信息

## 🔍 详细诊断步骤

### 步骤1：检查页面创建
确保以下页面已正确创建：
- [ ] `/pages/quotes-api` - API端点页面
- [ ] `/pages/quotes-test` - 原始测试页面
- [ ] `/pages/api-test` - 新的测试工具
- [ ] `/pages/quotes-management` - 后台管理页面

### 步骤2：验证模板配置
检查每个页面的模板设置：
- [ ] `quotes-api` 使用 `page.quotes-api` 模板
- [ ] `quotes-test` 使用 `page.quotes-test` 模板
- [ ] `api-test` 使用 `page.api-test` 模板

### 步骤3：测试端点连接
使用浏览器直接访问：
- [ ] `https://your-store.myshopify.com/pages/quotes-api`
- [ ] `https://your-store.myshopify.com/apps/quotes-api`（如果配置了App Proxy）

### 步骤4：检查请求头
确保JavaScript请求包含正确的头：
```javascript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

## 🚀 快速修复

### 立即解决方案

1. **访问新的测试工具**：
   ```
   https://your-store.myshopify.com/pages/api-test
   ```

2. **检查API状态**：
   点击"检查 API 状态"按钮

3. **如果App Proxy不可用**：
   使用备用端点 `/pages/quotes-api`

### 临时解决方案

如果App Proxy配置复杂，可以临时使用购物车API：

```javascript
// 临时解决方案：使用购物车存储报价数据
async function createQuoteViaCart(quoteData) {
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'your-quote-product-id',
      properties: {
        'Order Type': '3D Model Quote',
        'Quote Data': JSON.stringify(quoteData),
        'Quote Status': 'Pending'
      }
    })
  });
  
  return response.json();
}
```

## 📋 检查清单

### 部署前检查
- [ ] 所有页面已创建
- [ ] 模板配置正确
- [ ] App Proxy已配置（可选）
- [ ] 测试工具可访问

### 功能测试
- [ ] API状态检查通过
- [ ] GET请求返回JSON
- [ ] POST请求正常工作
- [ ] 错误处理正确

### 集成测试
- [ ] 3D上传器可添加报价订单
- [ ] 购物车显示"报价中"状态
- [ ] 后台管理系统可查看订单
- [ ] 报价发送功能正常

## 🆘 紧急修复

如果系统完全无法工作，可以使用以下紧急方案：

### 1. 简化API
创建一个最简单的API端点：

```liquid
{% comment %} 文件: templates/page.simple-api.liquid {% endcomment %}
{"status": "success", "message": "API is working", "timestamp": "{{ 'now' | date: '%Y-%m-%d %H:%M:%S' }}"}
```

### 2. 使用静态数据
在JavaScript中硬编码测试数据：

```javascript
// 临时测试数据
const testQuotes = [
  { id: '1', text: '测试报价1', author: '系统' },
  { id: '2', text: '测试报价2', author: '系统' }
];

// 模拟API响应
function mockAPI() {
  return Promise.resolve({
    records: testQuotes,
    status: 'success',
    count: testQuotes.length
  });
}
```

### 3. 联系支持
如果问题持续存在：
1. 收集错误日志
2. 记录复现步骤
3. 联系技术支持团队

## 📞 技术支持

### 调试信息收集
在浏览器控制台中运行：

```javascript
// 收集调试信息
console.log('URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('Shopify Domain:', window.location.hostname);

// 测试端点
fetch('/pages/quotes-api', {
  headers: { 'Accept': 'application/json' }
}).then(r => {
  console.log('Response Status:', r.status);
  console.log('Content Type:', r.headers.get('content-type'));
  return r.text();
}).then(text => {
  console.log('Response Text:', text.substring(0, 200));
});
```

### 常见错误代码
- **404**: 页面不存在或模板配置错误
- **500**: 服务器内部错误，检查Liquid语法
- **HTML响应**: 请求头设置错误或模板逻辑问题

---

**注意**: 请按照上述步骤逐一检查，大多数问题都可以通过这些解决方案得到解决。如果问题持续存在，请提供详细的错误信息和调试日志。
