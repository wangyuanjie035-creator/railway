const express = require('express');
const cors = require('cors');
const path = require('path');

const router = express.Router();

// 导入所有 API 路由
const downloadFile = require('./download-file-express.js');
const submitQuoteReal = require('./submit-quote-real.js');
const getDraftOrders = require('./get-draft-orders.js');
const updateQuote = require('./update-quote.js');
const deleteDraftOrder = require('./delete-draft-order.js');
const sendInvoiceEmail = require('./send-invoice-email.js');
const storeFileReal = require('./store-file-real.js');
const completeDraftOrder = require('./complete-draft-order.js');
const getDraftOrderSimple = require('./get-draft-order-simple.js');
const corsConfig = require('./cors-config.js');

// 应用 CORS 配置
router.use(corsConfig);

// 注册所有路由
router.get('/download-file', downloadFile);
router.post('/submit-quote-real', submitQuoteReal);
router.get('/get-draft-orders', getDraftOrders);
router.post('/update-quote', updateQuote);
router.delete('/delete-draft-order', deleteDraftOrder);
router.post('/send-invoice-email', sendInvoiceEmail);
router.post('/store-file-real', storeFileReal);
router.post('/complete-draft-order', completeDraftOrder);
router.get('/get-draft-order-simple', getDraftOrderSimple);

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
