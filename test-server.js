const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 简单的中间件
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, HOST, () => {
  console.log(`🚀 Test server running on ${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
