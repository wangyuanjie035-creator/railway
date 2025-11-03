// Express 版本的文件下载 API
const FILE_METAOBJECT_TYPE = 'uploaded_file';

// Shopify GraphQL 查询函数
async function shopGql(query, variables) {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || process.env.ADMIN_TOKEN;

  if (!storeDomain || !accessToken) {
    return { errors: [{ message: 'Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ACCESS_TOKEN' }] };
  }

  const endpoint = `https://${storeDomain}/admin/api/2024-01/graphql.json`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await resp.json();
  return json;
}

// 设置 CORS 头
function setCorsHeaders(req, res) {
  const allowedOrigins = [
    'https://sain-pdc-test.myshopify.com',
    'http://localhost:3000',
    'https://localhost:3000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://sain-pdc-test.myshopify.com');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

// 处理 Shopify 文件下载
async function handleShopifyFileDownload(req, res, shopifyFileId, requestedFileName) {
  try {
    console.log('开始从Shopify Files下载:', shopifyFileId);

    // 查询文件信息 - 使用 files 查询
    const fileQuery = `
      query($id: ID!) {
        files(first: 1, query: $id) {
          edges {
            node {
              id
              ... on File {
                url
                alt
              }
            }
          }
        }
      }
    `;

    const fileResult = await shopGql(fileQuery, { id: `"${shopifyFileId}"` });

    if (fileResult.errors || !fileResult.data?.files?.edges?.[0]?.node) {
      console.error('查询Shopify文件失败:', fileResult.errors);
      return res.status(404).json({ 
        success: false, 
        message: '文件未找到或查询失败' 
      });
    }

    const file = fileResult.data.files.edges[0].node;
    console.log('Shopify文件信息:', file);

    // 如果文件有URL，重定向到 Shopify 文件 URL
    if (file.url) {
      return res.redirect(file.url);
    }

    // 如果文件没有URL，返回错误
    return res.status(404).json({
      success: false,
      message: '文件没有可用的URL'
    });
    
  } catch (error) {
    console.error('Shopify文件下载失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '下载失败: ' + error.message 
    });
  }
}

// Express 路由处理函数
async function downloadFileHandler(req, res) {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, shopifyFileId, fileName: requestedFileName } = req.query;
    
    // 如果提供了shopifyFileId，则通过Shopify Files下载
    if (shopifyFileId) {
      return await handleShopifyFileDownload(req, res, shopifyFileId, requestedFileName);
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Missing file ID' });
    }

    // 如果是本地存储（内存Map），优先尝试直接返回
    console.log('🔍 检查本地存储:', { id, hasStorage: !!global.fileStorage, storageSize: global.fileStorage?.size || 0 });
    if (global.fileStorage && global.fileStorage.has(id)) {
      console.log('✅ 找到本地存储文件:', id);
      try {
        const record = global.fileStorage.get(id);
        const base64 = record.fileData || '';
        const buffer = Buffer.from(base64, 'base64');
        console.log('📦 准备返回文件:', { fileName: record.fileName, bufferSize: buffer.length });
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${record.fileName || 'download.bin'}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.status(200).send(buffer);
      } catch (e) {
        console.error('从本地存储返回文件失败:', e);
      }
    } else {
      console.log('❌ 本地存储中未找到文件:', id);
    }

    console.log('查询Metaobject文件:', id);

    // 查询存储在 Metaobject 中的文件记录
    const query = `
      query($type: String!, $first: Int!) {
        metaobjects(type: $type, first: $first) {
          nodes {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    `;

    const result = await shopGql(query, { 
      type: FILE_METAOBJECT_TYPE, 
      first: 250 
    });

    if (result.errors) {
      console.error('GraphQL查询错误:', result.errors);
      return res.status(500).json({ 
        success: false, 
        message: '查询失败: ' + result.errors[0].message 
      });
    }

    const metaobjects = result.data?.metaobjects?.nodes || [];
    const targetMetaobject = metaobjects.find(obj => 
      obj.id === id || obj.handle === id
    );

    if (!targetMetaobject) {
      console.error('未找到Metaobject:', id);
      return res.status(404).json({ 
        success: false, 
        message: '文件记录未找到' 
      });
    }

    // 查找文件数据字段
    const fileDataField = targetMetaobject.fields.find(field => field.key === 'fileData');
    const fileNameField = targetMetaobject.fields.find(field => field.key === 'fileName');

    if (!fileDataField || !fileDataField.value) {
      console.error('Metaobject中未找到文件数据');
      return res.status(404).json({ 
        success: false, 
        message: '文件中没有数据' 
      });
    }

    const fileData = fileDataField.value;
    const fileName = fileNameField?.value || requestedFileName || 'database-file';

    console.log('找到文件数据，大小:', fileData.length, '字符');

    // 检查是否是Base64数据
    if (fileData.startsWith('data:')) {
      // 直接返回Base64数据
      const base64Data = fileData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      
      return res.send(buffer);
    } else {
      // 假设是纯Base64数据（没有data:前缀）
      try {
        const buffer = Buffer.from(fileData, 'base64');
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        
        return res.send(buffer);
      } catch (error) {
        console.error('Base64解码失败:', error);
        return res.status(500).json({ 
          success: false, 
          message: '文件数据格式错误' 
        });
      }
    }

  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '下载失败: ' + error.message 
    });
  }
}

module.exports = downloadFileHandler;
