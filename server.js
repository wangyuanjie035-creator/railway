const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// API 路由
app.use('/api', require('./api/index.js'));

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Access: http://localhost:${PORT}`);
});
