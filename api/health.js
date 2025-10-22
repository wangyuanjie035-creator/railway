module.exports = function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 返回健康状态
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Shopify 3D Printing Service',
    version: '1.0.0'
  });
}
