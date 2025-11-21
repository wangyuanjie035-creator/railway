# API 文件整合方案

## 🎯 整合目标

- ✅ 减少文件数量（从 14 个减少到 8-10 个）
- ✅ 按功能分组，便于查找和修改
- ✅ 保持代码清晰，易于维护

---

## 📊 当前文件列表（14个）

```
api/
├── index.js                    # 路由注册
├── cors-config.js              # CORS 配置
├── health.js                   # 健康检查
│
├── submit-quote-real.js        # 提交询价
├── get-draft-orders.js         # 获取订单列表
├── get-draft-order-simple.js   # 获取单个订单
├── update-quote.js             # 更新报价
├── delete-draft-order.js       # 删除订单
├── complete-draft-order.js     # 完成订单
│
├── store-file-real.js          # 上传到 Shopify Files
├── store-file-data.js          # 存储到服务器内存
├── download-file.js            # 下载文件
│
├── send-invoice-email.js       # 发送邮件
└── get-or-create-product.js    # 获取/创建产品
```

---

## ✨ 整合后的文件结构（8个）

```
api/
├── index.js                    # 路由注册中心
├── utils.js                    # 工具函数（CORS、健康检查等）
│
├── quote-handler.js            # 询价相关（提交、查询）
├── draft-order-handler.js      # Draft Order 操作（查询、更新、删除、完成）
├── file-handler.js             # 文件操作（上传、下载、存储）
│
├── invoice-handler.js          # 发票邮件相关
└── product-handler.js          # 产品相关
```

---

## 🔄 整合方案详解

### 方案 1: 文件操作整合 ⭐⭐⭐（推荐）

#### 整合文件

**合并为**: `file-handler.js`

**包含功能**:
1. ✅ 上传文件到 Shopify Files (`store-file-real.js`)
2. ✅ 存储文件到服务器内存 (`store-file-data.js`)
3. ✅ 下载文件 (`download-file.js`)

**整合理由**:
- 都是文件相关的操作
- 相互关联（上传后需要下载）
- 逻辑清晰（一个文件处理所有文件操作）

**文件结构**:
```javascript
// file-handler.js
const FormData = require('form-data');
const setCorsHeaders = require('./cors-config.js');

// ========== 1. 上传文件到 Shopify Files ==========
async function uploadToShopifyFiles(req, res) { ... }

// ========== 2. 存储文件到服务器内存 ==========
async function storeToServerMemory(req, res) { ... }

// ========== 3. 下载文件 ==========
async function downloadFile(req, res) { ... }

// ========== 统一入口 ==========
module.exports = async function handler(req, res) {
  const { action } = req.query; // 或 req.body.action
  
  switch (action) {
    case 'upload-shopify':
      return await uploadToShopifyFiles(req, res);
    case 'upload-memory':
      return await storeToServerMemory(req, res);
    case 'download':
    default:
      return await downloadFile(req, res);
  }
};
```

**路由注册**:
```javascript
// index.js
// 旧方式
router.post('/store-file-real', storeFileReal);
router.post('/store-file-data', storeFileData);
router.get('/download-file', downloadFile);

// 新方式（向后兼容）
router.post('/store-file-real', fileHandler);
router.post('/store-file-data', fileHandler);
router.get('/download-file', fileHandler);
// 或统一接口
router.post('/file', fileHandler); // action 在 body 中
router.get('/file', fileHandler);  // action 在 query 中
```

---

### 方案 2: Draft Order 操作整合 ⭐⭐⭐（推荐）

#### 整合文件

**合并为**: `draft-order-handler.js`

**包含功能**:
1. ✅ 获取订单列表 (`get-draft-orders.js`)
2. ✅ 获取单个订单 (`get-draft-order-simple.js`)
3. ✅ 更新订单 (`update-quote.js`)
4. ✅ 删除订单 (`delete-draft-order.js`)
5. ✅ 完成订单 (`complete-draft-order.js`)

**整合理由**:
- 都是 Draft Order 的操作
- 逻辑相似（都是查询/修改 Draft Order）
- 便于统一管理

**文件结构**:
```javascript
// draft-order-handler.js
const setCorsHeaders = require('./cors-config.js');

// ========== 1. 获取订单列表 ==========
async function getDraftOrdersList(req, res) { ... }

// ========== 2. 获取单个订单 ==========
async function getDraftOrderDetail(req, res) { ... }

// ========== 3. 更新订单 ==========
async function updateDraftOrder(req, res) { ... }

// ========== 4. 删除订单 ==========
async function deleteDraftOrder(req, res) { ... }

// ========== 5. 完成订单 ==========
async function completeDraftOrder(req, res) { ... }

// ========== 统一入口 ==========
module.exports = async function handler(req, res) {
  const method = req.method;
  const { action } = req.query;
  
  if (method === 'GET') {
    if (action === 'list' || !action) {
      return await getDraftOrdersList(req, res);
    } else if (action === 'detail') {
      return await getDraftOrderDetail(req, res);
    }
  } else if (method === 'POST') {
    if (action === 'update') {
      return await updateDraftOrder(req, res);
    } else if (action === 'complete') {
      return await completeDraftOrder(req, res);
    }
  } else if (method === 'DELETE') {
    return await deleteDraftOrder(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
```

**路由注册**:
```javascript
// index.js
// 旧方式
router.get('/get-draft-orders', getDraftOrders);
router.get('/get-draft-order-simple', getDraftOrderSimple);
router.post('/update-quote', updateQuote);
router.delete('/delete-draft-order', deleteDraftOrder);
router.post('/complete-draft-order', completeDraftOrder);

// 新方式（向后兼容）
router.get('/get-draft-orders', draftOrderHandler);
router.get('/get-draft-order-simple', draftOrderHandler);
router.post('/update-quote', draftOrderHandler);
router.delete('/delete-draft-order', draftOrderHandler);
router.post('/complete-draft-order', draftOrderHandler);

// 或统一接口
router.get('/draft-orders', draftOrderHandler);
router.post('/draft-orders', draftOrderHandler);
router.delete('/draft-orders', draftOrderHandler);
```

---

### 方案 3: 工具函数整合 ⭐⭐（可选）

#### 整合文件

**合并为**: `utils.js`

**包含功能**:
1. ✅ CORS 配置 (`cors-config.js`)
2. ✅ 健康检查 (`health.js`)
3. ✅ 通用工具函数

**整合理由**:
- 都是基础设施代码
- 使用频率高
- 便于统一管理

**文件结构**:
```javascript
// utils.js
const express = require('express');

// ========== CORS 配置 ==========
function corsMiddleware(req, res, next) {
  // ... CORS 配置代码
}
module.exports.corsMiddleware = corsMiddleware;

// ========== 健康检查 ==========
function healthCheck(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Shopify 3D Printing Service'
  });
}
module.exports.healthCheck = healthCheck;

// ========== Shopify GraphQL 辅助函数 ==========
async function shopGql(query, variables) {
  // ... GraphQL 调用代码
}
module.exports.shopGql = shopGql;

// ========== 通用错误处理 ==========
function handleError(res, error, statusCode = 500) {
  console.error('Error:', error);
  res.status(statusCode).json({
    success: false,
    error: error.message
  });
}
module.exports.handleError = handleError;
```

---

## 📋 推荐整合方案

### 优先级 1: 必须整合 ⭐⭐⭐

#### 1. 文件操作整合
- `store-file-real.js` + `store-file-data.js` + `download-file.js` → `file-handler.js`
- **优势**: 减少 3 个文件，逻辑清晰

#### 2. Draft Order 查询整合
- `get-draft-orders.js` + `get-draft-order-simple.js` → `draft-order-handler.js` (查询部分)
- **优势**: 两个查询功能整合

### 优先级 2: 建议整合 ⭐⭐

#### 3. Draft Order 操作整合
- `update-quote.js` + `delete-draft-order.js` + `complete-draft-order.js` → `draft-order-handler.js` (操作部分)
- **优势**: 所有 Draft Order 操作在一个文件

### 优先级 3: 可选整合 ⭐

#### 4. 工具函数整合
- `cors-config.js` + `health.js` → `utils.js`
- **优势**: 基础设施代码统一管理

---

## 🎯 整合后的最终结构（推荐）

```
api/
├── index.js                    # 路由注册中心
├── utils.js                    # 工具函数（CORS、健康检查、GraphQL辅助）
│
├── submit-quote-real.js        # 提交询价（保持独立，核心功能）
├── draft-order-handler.js      # Draft Order 操作（查询、更新、删除、完成）
├── file-handler.js             # 文件操作（上传到Shopify、存储到内存、下载）
│
├── send-invoice-email.js       # 发送邮件（保持独立，单一功能）
└── get-or-create-product.js    # 产品操作（保持独立，单一功能）
```

**文件数量**: 7 个（从 14 个减少到 7 个，减少 50%）

---

## 🔧 实施步骤

### 步骤 1: 创建整合后的文件

1. 创建 `file-handler.js`（整合文件操作）
2. 创建 `draft-order-handler.js`（整合 Draft Order 操作）
3. 创建 `utils.js`（整合工具函数，可选）

### 步骤 2: 迁移代码

1. 将相关代码复制到新文件
2. 调整函数命名和结构
3. 添加统一的入口处理

### 步骤 3: 更新路由注册

1. 在 `index.js` 中更新路由注册
2. 保持向后兼容（旧的路径仍然可用）

### 步骤 4: 测试

1. 测试所有功能是否正常
2. 检查日志输出
3. 验证文件上传/下载

### 步骤 5: 清理旧文件

1. 确认新文件工作正常后
2. 删除旧文件
3. 更新文档

---

## ⚠️ 注意事项

### 向后兼容

**重要**: 为了不影响现有功能，建议保持向后兼容：

```javascript
// index.js
// 旧路径仍然可用
router.post('/store-file-real', fileHandler);
router.post('/store-file-data', fileHandler);
router.get('/download-file', fileHandler);

// 新路径（可选）
router.post('/file', fileHandler);
router.get('/file', fileHandler);
```

### 代码组织

**建议**: 使用清晰的函数分组和注释：

```javascript
// file-handler.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 文件操作处理 API
 * ═══════════════════════════════════════════════════════════════
 * 
 * 功能：
 * 1. 上传文件到 Shopify Files
 * 2. 存储文件到服务器内存
 * 3. 下载文件
 */

// ========== 1. 上传到 Shopify Files ==========
async function uploadToShopifyFiles(req, res) { ... }

// ========== 2. 存储到服务器内存 ==========
async function storeToServerMemory(req, res) { ... }

// ========== 3. 下载文件 ==========
async function downloadFile(req, res) { ... }

// ========== 统一入口 ==========
module.exports = async function handler(req, res) { ... };
```

### 测试建议

1. **逐一测试**: 整合一个模块后测试一个
2. **保持旧文件**: 整合完成前不要删除旧文件
3. **对比测试**: 新旧实现对比测试，确保功能一致

---

## ✅ 推荐实施顺序

### 阶段 1: 文件操作整合（最简单）

1. ✅ 创建 `file-handler.js`
2. ✅ 整合三个文件操作
3. ✅ 更新路由注册
4. ✅ 测试功能
5. ✅ 删除旧文件

### 阶段 2: Draft Order 查询整合

1. ✅ 创建 `draft-order-handler.js`（先整合查询部分）
2. ✅ 整合两个查询功能
3. ✅ 更新路由注册
4. ✅ 测试功能
5. ✅ 删除旧文件

### 阶段 3: Draft Order 操作整合

1. ✅ 在 `draft-order-handler.js` 中添加操作部分
2. ✅ 整合三个操作功能
3. ✅ 更新路由注册
4. ✅ 测试功能
5. ✅ 删除旧文件

### 阶段 4: 工具函数整合（可选）

1. ✅ 创建 `utils.js`
2. ✅ 整合 CORS 和健康检查
3. ✅ 更新引用
4. ✅ 测试功能
5. ✅ 删除旧文件

---

## 📊 整合效果

### 整合前
- **文件数量**: 14 个
- **文件组织**: 分散，难以查找
- **维护成本**: 高（需要记住多个文件位置）

### 整合后
- **文件数量**: 7 个（减少 50%）
- **文件组织**: 按功能分组，清晰明了
- **维护成本**: 低（相关功能在一个文件中）

### 优势

1. ✅ **易于查找**: 按功能分组，快速定位
2. ✅ **易于修改**: 相关功能在一起，修改更方便
3. ✅ **易于测试**: 相关功能一起测试
4. ✅ **代码复用**: 减少重复代码
5. ✅ **统一管理**: 相关功能统一管理

---

## 🎯 总结

**推荐整合**:
1. ⭐⭐⭐ **文件操作** → `file-handler.js`（3个文件合并）
2. ⭐⭐⭐ **Draft Order 查询** → `draft-order-handler.js`（2个文件合并）
3. ⭐⭐ **Draft Order 操作** → `draft-order-handler.js`（3个文件合并）
4. ⭐ **工具函数** → `utils.js`（2个文件合并，可选）

**保持独立**:
- `submit-quote-real.js` - 核心功能，保持独立
- `send-invoice-email.js` - 单一功能，保持独立
- `get-or-create-product.js` - 单一功能，保持独立

**预期效果**:
- 文件数量: 14 个 → 7 个（减少 50%）
- 维护成本: 降低
- 代码清晰度: 提高

