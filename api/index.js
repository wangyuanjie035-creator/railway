const express = require('express');
const cors = require('cors');
const path = require('path');

const router = express.Router();

// 安全导入 API 路由
let fileHandler, draftOrderHandler, submitQuoteReal;
let sendInvoiceEmail, getOrCreateProduct, corsConfig;

try {
  // 整合后的处理器
  fileHandler = require('./file-handler.js');
  draftOrderHandler = require('./draft-order-handler.js');
  
  // 核心功能（保持独立）
  submitQuoteReal = require('./submit-quote-real.js');
  sendInvoiceEmail = require('./send-invoice-email.js');
  getOrCreateProduct = require('./get-or-create-product.js');
  corsConfig = require('./cors-config.js');
  
  // 兼容性：保留旧文件导入（如果存在）
  let downloadFile, getDraftOrders, updateQuote, deleteDraftOrder;
  let storeFileReal, storeFileData, completeDraftOrder, getDraftOrderSimple;
  
  try {
    downloadFile = require('./download-file.js');
    getDraftOrders = require('./get-draft-orders.js');
    updateQuote = require('./update-quote.js');
    deleteDraftOrder = require('./delete-draft-order.js');
    storeFileReal = require('./store-file-real.js');
    storeFileData = require('./store-file-data.js');
    completeDraftOrder = require('./complete-draft-order.js');
    getDraftOrderSimple = require('./get-draft-order-simple.js');
    console.log('⚠️ 检测到旧文件，建议迁移到整合后的处理器');
  } catch (e) {
    // 旧文件不存在，使用整合后的处理器
  }
} catch (error) {
  console.error('Error importing API routes:', error.message);
}

// 应用 CORS 配置
if (corsConfig) {
  router.use(corsConfig);
} else {
  router.use(cors());
}

// 注册所有路由（优先使用整合后的处理器，向后兼容旧文件）
// 文件操作（整合后）
if (fileHandler) {
  // 使用独立函数注册路由（如果存在）
  if (fileHandler.uploadToShopifyFiles) {
    router.post('/store-file-real', fileHandler.uploadToShopifyFiles);
  } else {
    router.post('/store-file-real', fileHandler);
  }
  
  if (fileHandler.storeToServerMemory) {
    router.post('/store-file-data', fileHandler.storeToServerMemory);
  } else {
    router.post('/store-file-data', fileHandler);
  }
  
  if (fileHandler.downloadFile) {
    router.get('/download-file', fileHandler.downloadFile);
  } else {
    router.get('/download-file', fileHandler);
  }
}

// Draft Order 操作（整合后）
if (draftOrderHandler) {
  router.get('/get-draft-orders', draftOrderHandler);
  router.get('/get-draft-order-simple', draftOrderHandler);
  router.post('/update-quote', draftOrderHandler);
  router.delete('/delete-draft-order', draftOrderHandler);
  router.post('/complete-draft-order', draftOrderHandler);
}

// 向后兼容：如果旧文件存在，也注册（确保功能正常）
// 注意：如果同时存在，整合后的处理器会优先处理请求
// 建议在确认整合后的处理器工作正常后，删除旧文件

// 核心功能（保持独立）
if (submitQuoteReal) router.post('/submit-quote-real', submitQuoteReal);
if (sendInvoiceEmail) router.post('/send-invoice-email', sendInvoiceEmail);
if (getOrCreateProduct) router.post('/get-or-create-product', getOrCreateProduct);

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
