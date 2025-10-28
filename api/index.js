const express = require('express');
const cors = require('cors');
const path = require('path');

const router = express.Router();

// 安全导入 API 路由
let downloadFile, submitQuoteReal, getDraftOrders, updateQuote, deleteDraftOrder;
let sendInvoiceEmail, storeFileReal, completeDraftOrder, getDraftOrderSimple, corsConfig, diagnoseEnv;

try {
  downloadFile = require('./download-file-express.js');
  submitQuoteReal = require('./submit-quote-real.js');
  getDraftOrders = require('./get-draft-orders.js');
  updateQuote = require('./update-quote.js');
  deleteDraftOrder = require('./delete-draft-order.js');
  sendInvoiceEmail = require('./send-invoice-email.js');
  storeFileReal = require('./store-file-real.js');
  completeDraftOrder = require('./complete-draft-order.js');
  getDraftOrderSimple = require('./get-draft-order-simple.js');
  corsConfig = require('./cors-config.js');
  diagnoseEnv = require('./diagnose-env.js');
} catch (error) {
  console.error('Error importing API routes:', error.message);
}

// 应用 CORS 配置
if (corsConfig) {
  router.use(corsConfig);
} else {
  router.use(cors());
}

// 注册所有路由（只注册成功导入的）
if (downloadFile) router.get('/download-file', downloadFile);
if (submitQuoteReal) router.post('/submit-quote-real', submitQuoteReal);
if (getDraftOrders) router.get('/get-draft-orders', getDraftOrders);
if (updateQuote) router.post('/update-quote', updateQuote);
if (deleteDraftOrder) router.delete('/delete-draft-order', deleteDraftOrder);
if (sendInvoiceEmail) router.post('/send-invoice-email', sendInvoiceEmail);
if (storeFileReal) router.post('/store-file-real', storeFileReal);
if (completeDraftOrder) router.post('/complete-draft-order', completeDraftOrder);
if (getDraftOrderSimple) router.get('/get-draft-order-simple', getDraftOrderSimple);
if (diagnoseEnv) router.get('/diagnose-env', diagnoseEnv);

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
