const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080; // Railway 默认端口

// 确保服务器监听所有接口
const HOST = '0.0.0.0';

console.log('🔧 Initializing Express server...');
console.log('🔧 PORT:', PORT);
console.log('🔧 HOST:', HOST);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));
app.use('/snippets', express.static(path.join(__dirname, 'snippets')));
app.use('/sections', express.static(path.join(__dirname, 'sections')));
app.use('/locales', express.static(path.join(__dirname, 'locales')));
app.use('/blocks', express.static(path.join(__dirname, 'blocks')));
app.use('/layout', express.static(path.join(__dirname, 'layout')));
app.use('/config', express.static(path.join(__dirname, 'config')));

// 健康检查端点
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Shopify 3D Printing Service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    host: HOST
  });
});

// 简单的根路径健康检查
app.get('/health', (req, res) => {
  console.log('🏥 Simple health check requested');
  res.status(200).json({ status: 'ok' });
});

// API 路由
try {
  console.log('📦 加载 API 路由...');
  const apiRouter = require('./api/index.js');
  app.use('/api', apiRouter);
  console.log('✅ API 路由加载成功');
} catch (error) {
  console.error('❌ 加载 API 路由失败:', error.message);
  console.error('❌ 错误堆栈:', error.stack);
  // 提供基本的错误响应
  app.use('/api', (req, res) => {
    res.status(500).json({ 
      error: 'API routes failed to load',
      message: error.message 
    });
  });
}

// 主页路由
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>3D Printing Service</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1>3D Printing Customization Service</h1>
      <p>Service is running successfully!</p>
      <ul>
        <li><a href="/pages/admin-draft-orders">Admin Dashboard</a></li>
        <li><a href="/pages/quote-request">Quote Request</a></li>
        <li><a href="/pages/my-quotes">My Quotes</a></li>
      </ul>
    </body>
    </html>
  `);
});

// 处理 Liquid 模板文件
app.get('/pages/:page', (req, res) => {
  const pageName = req.params.page;
  const filePath = path.join(__dirname, 'templates', `page.${pageName}.liquid`);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found' 
  });
});

// 启动服务器
app.listen(PORT, HOST, (err) => {
  if (err) {
    console.error('❌ 服务器启动失败:', err);
    process.exit(1);
  }
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Access: http://${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🏥 API Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`✅ 服务器已成功启动，准备接收请求`);
});

// 处理服务器启动错误
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  console.error('💥 错误堆栈:', err.stack);
  // 给 Railway 时间记录错误，然后退出
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason instanceof Error) {
    console.error('💥 错误堆栈:', reason.stack);
  }
  // 给 Railway 时间记录错误，然后退出
  setTimeout(() => process.exit(1), 1000);
});

// 处理 SIGTERM 信号（Railway 发送的停止信号）
process.on('SIGTERM', () => {
  console.log('⚠️ 收到 SIGTERM 信号，正在优雅关闭服务器...');
  // 给 Railway 时间记录日志
  setTimeout(() => process.exit(0), 1000);
});
