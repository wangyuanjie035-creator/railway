/**
 * ═══════════════════════════════════════════════════════════════
 * 文件操作处理 API - 统一处理所有文件相关操作
 * ═══════════════════════════════════════════════════════════════
 * 
 * 功能：
 * 1. 上传文件到 Shopify Files（永久存储）
 * 2. 存储文件到服务器内存（临时存储）
 * 3. 下载文件（支持两种存储方式）
 * 
 * 路由：
 * - POST /api/store-file-real → 上传到 Shopify Files
 * - POST /api/store-file-data → 存储到服务器内存
 * - GET /api/download-file → 下载文件
 */

const setCorsHeaders = require('./cors-config.js');

// ========== 导入依赖 ==========
// 优先使用 form-data 包，确保兼容性
let FormDataClass;
try {
  FormDataClass = require('form-data');
} catch (e) {
  console.error('⚠️ 无法加载 form-data 包，尝试使用原生 FormData:', e);
  FormDataClass = global.FormData;
}
console.log('🔧 使用的 FormData 类型:', FormDataClass.name || '未知');

// ========== 辅助函数：Shopify GraphQL API ==========
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

// ========== 功能 1: 上传文件到 Shopify Files ==========
async function uploadToShopifyFiles(req, res) {
  try {
    const { fileData, fileName, fileType } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：fileData 和 fileName'
      });
    }

    // 解析Base64数据
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSize = fileBuffer.length;

    console.log(`📁 [Shopify Files] 开始上传文件: ${fileName}, 大小: ${fileSize} 字节`);

    // 获取环境变量
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || process.env.ADMIN_TOKEN;

    if (!storeDomain || !accessToken) {
      return res.status(500).json({
        success: false,
        message: '环境变量未配置：SHOP/SHOPIFY_STORE_DOMAIN 和 ADMIN_TOKEN/SHOPIFY_ACCESS_TOKEN'
      });
    }

    // 步骤1: 创建Staged Upload
    const stagedUploadMutation = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const stagedUploadResponse = await fetch(`https://${storeDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: stagedUploadMutation,
        variables: {
          input: [{
            filename: fileName,
            mimeType: fileType || 'application/octet-stream',
            resource: 'FILE'
          }]
        }
      })
    });

    const stagedUploadData = await stagedUploadResponse.json();
    
    if (stagedUploadData.errors || stagedUploadData.data.stagedUploadsCreate.userErrors.length > 0) {
      console.error('❌ [Shopify Files] Staged Upload创建失败:', stagedUploadData);
      return res.status(500).json({
        success: false,
        message: 'Staged Upload创建失败',
        error: stagedUploadData.errors || stagedUploadData.data.stagedUploadsCreate.userErrors
      });
    }

    const stagedTarget = stagedUploadData.data.stagedUploadsCreate.stagedTargets[0];
    console.log('✅ [Shopify Files] Staged Upload创建成功');

    // 步骤2: 上传文件到临时地址
    // 优先使用 form-data 包（确保兼容性），如果不存在则使用原生 FormData
    const formData = new FormDataClass();
    
    // 添加签名参数（严格按照 Shopify 返回的顺序，不要修改）
    console.log(`📋 [Shopify Files] 准备添加 ${stagedTarget.parameters.length} 个签名参数`);
    stagedTarget.parameters.forEach((param, index) => {
      formData.append(param.name, param.value);
      console.log(`✅ [Shopify Files] [${index + 1}/${stagedTarget.parameters.length}] 添加参数: ${param.name} = ${param.value.substring(0, 50)}${param.value.length > 50 ? '...' : ''}`);
    });
    
    // 添加文件（必须是最后一个字段，这是 Google Cloud Storage 的要求）
    // 检测是否为 form-data 包（通过检查是否有 getHeaders 方法）
    const isFormDataPackage = typeof formData.getHeaders === 'function';
    
    if (isFormDataPackage) {
      // form-data 包 (Node.js 环境)
      // 注意：form-data 包的 append 方法第三个参数是选项对象
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: fileType || 'application/octet-stream',
        knownLength: fileSize // 指定文件大小，有助于计算正确的 Content-Length
      });
      console.log(`📎 [Shopify Files] [最后] 添加文件 (form-data包): ${fileName}, 大小: ${fileSize} 字节`);
    } else {
      // 原生 FormData (浏览器环境，Node.js 18+ 可能也支持)
      try {
        // 在 Node.js 中，尝试使用 Blob（如果可用）
        if (typeof Blob !== 'undefined') {
          const blob = new Blob([fileBuffer], { type: fileType || 'application/octet-stream' });
          formData.append('file', blob, fileName);
          console.log(`📎 [Shopify Files] [最后] 添加文件 (原生FormData+Blob): ${fileName}, 大小: ${fileSize} 字节`);
        } else {
          // 如果没有 Blob，直接使用 Buffer（Node.js 原生 FormData 可能支持）
          formData.append('file', fileBuffer, fileName);
          console.log(`📎 [Shopify Files] [最后] 添加文件 (原生FormData+Buffer): ${fileName}, 大小: ${fileSize} 字节`);
        }
      } catch (e) {
        console.error('❌ 无法添加文件到 FormData:', e);
        throw new Error(`无法添加文件到 FormData: ${e.message}`);
      }
    }

    // 发送请求
    // form-data 包需要手动设置 headers（包括 boundary）
    // 原生 FormData 会自动设置，不需要手动设置
    let headers = {};
    if (isFormDataPackage) {
      // form-data 包需要调用 getHeaders() 获取正确的 Content-Type（包括 boundary）
      try {
        headers = formData.getHeaders();
        console.log(`📋 [Shopify Files] 使用 form-data 包的 headers:`, Object.keys(headers).join(', '));
      } catch (e) {
        console.warn('⚠️ 无法获取 form-data headers:', e);
        // 如果获取失败，不设置 headers，让 fetch 自动处理
      }
    } else {
      // 原生 FormData 会自动设置 Content-Type，不需要手动设置
      console.log(`📋 [Shopify Files] 使用原生 FormData，自动设置 headers`);
    }
    
    console.log(`📤 [Shopify Files] 发送上传请求到: ${stagedTarget.url.substring(0, 100)}...`);
    
    const uploadResponse = await fetch(stagedTarget.url, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ [Shopify Files] 文件上传失败:', uploadResponse.status, uploadResponse.statusText);
      console.error('错误详情:', errorText);
      
      if (uploadResponse.status === 403 || errorText.includes('SignatureDoesNotMatch')) {
        console.error('⚠️ [Shopify Files] 签名验证失败（403 Forbidden: SignatureDoesNotMatch）！');
        console.error('可能的原因:');
        console.error('  1. FormData 参数顺序不正确（必须严格按照 Shopify 返回的顺序）');
        console.error('  2. 文件不是最后一个字段（文件必须是最后一个）');
        console.error('  3. FormData 边界格式不正确');
        console.error('  4. 参数值被修改或截断');
        console.error('  5. Content-Type 头设置不正确');
        
        // 记录详细的诊断信息
        console.error('📋 诊断信息:');
        console.error('  - 参数数量:', stagedTarget.parameters.length);
        console.error('  - 参数列表:', stagedTarget.parameters.map(p => p.name).join(', '));
        console.error('  - FormData 类型:', FormDataClass.name);
        console.error('  - 文件大小:', fileSize, '字节');
        console.error('  - 文件名:', fileName);
      }
      
      return res.status(500).json({
        success: false,
        message: '文件上传到 Shopify Files 失败',
        error: `${uploadResponse.status} - ${uploadResponse.statusText}`,
        details: errorText,
        isSignatureError: uploadResponse.status === 403,
        suggestion: uploadResponse.status === 403 ? '签名验证失败，请检查 FormData 参数顺序和文件位置' : '请检查文件大小和格式'
      });
    }

    console.log('✅ [Shopify Files] 文件上传到临时地址成功');

    // 步骤3: 创建永久文件记录
    const fileCreateMutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            fileStatus
            originalFileSize
            url
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const fileCreateResponse = await fetch(`https://${storeDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: fileCreateMutation,
        variables: {
          files: [{
            originalSource: stagedTarget.resourceUrl,
            contentType: fileType || 'application/octet-stream',
            alt: fileName
          }]
        }
      })
    });

    const fileCreateData = await fileCreateResponse.json();

    if (fileCreateData.errors || fileCreateData.data.fileCreate.userErrors.length > 0) {
      console.error('❌ [Shopify Files] 文件记录创建失败:', fileCreateData);
      return res.status(500).json({
        success: false,
        message: '文件记录创建失败',
        error: fileCreateData.errors || fileCreateData.data.fileCreate.userErrors
      });
    }

    const fileRecord = fileCreateData.data.fileCreate.files[0];
    console.log('✅ [Shopify Files] 文件记录创建成功:', fileRecord.id);

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return res.status(200).json({
      success: true,
      message: '文件上传成功（Shopify Files完整存储）',
      fileId: fileId,
      fileName: fileName,
      fileUrl: fileRecord.url,
      shopifyFileId: fileRecord.id,
      originalFileSize: fileRecord.originalFileSize,
      uploadedFileSize: fileSize,
      sizeMatch: fileRecord.originalFileSize === fileSize,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Shopify Files] 文件存储失败:', error);
    return res.status(500).json({
      success: false,
      message: '文件存储失败',
      error: error.message
    });
  }
}

// ========== 功能 2: 存储文件到服务器内存 ==========
async function storeFileDataFunction({ draftOrderId, fileData, fileName }) {
  try {
    if (!global.fileStorage) {
      global.fileStorage = new Map();
    }

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    global.fileStorage.set(fileId, {
      draftOrderId,
      fileName,
      fileData,
      uploadTime: new Date().toISOString()
    });

    console.log('✅ [内存存储] 文件数据存储成功:', { fileId, fileName, draftOrderId });
    console.log('📊 [内存存储] 当前存储数量:', global.fileStorage.size);

    return {
      success: true,
      message: '文件数据存储成功',
      fileId,
      fileName,
      draftOrderId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [内存存储] 文件存储失败:', error);
    return {
      success: false,
      message: '文件存储失败',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function storeToServerMemory(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { draftOrderId, fileData, fileName } = req.body;

    console.log('📥 [内存存储] store-file-data 收到请求:', { 
      draftOrderId, 
      fileName, 
      fileDataLength: fileData?.length || 0 
    });

    if (!draftOrderId || !fileData || !fileName) {
      console.error('❌ [内存存储] 缺少必要参数:', { 
        draftOrderId: !!draftOrderId, 
        fileData: !!fileData, 
        fileName: !!fileName 
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: draftOrderId, fileData, fileName'
      });
    }

    const result = await storeFileDataFunction({ draftOrderId, fileData, fileName });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ [内存存储] 文件存储失败:', error);
    return res.status(500).json({
      success: false,
      message: '文件存储失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ========== 功能 3: 下载文件 ==========
async function handleShopifyFileDownload(req, res, shopifyFileId, fileName) {
  try {
    console.log('📥 [下载] 开始下载Shopify文件:', { shopifyFileId, fileName });

    const query = `
      query($id: ID!) {
        file(id: $id) {
          ... on GenericFile {
            url
            originalFileSize
            contentType
          }
          ... on MediaImage {
            image {
              url
            }
          }
        }
      }
    `;

    const result = await shopGql(query, { id: shopifyFileId });

    if (!result.data.file) {
      return res.status(404).json({ error: '文件未找到' });
    }

    const file = result.data.file;
    let fileUrl = null;

    if (file.url) {
      fileUrl = file.url;
    } else if (file.image && file.image.url) {
      fileUrl = file.image.url;
    }

    if (!fileUrl) {
      return res.status(404).json({ error: '文件URL不可用' });
    }

    console.log('✅ [下载] 文件URL获取成功:', fileUrl);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'download'}"`);
    return res.redirect(302, fileUrl);

  } catch (error) {
    console.error('❌ [下载] Shopify文件下载失败:', error);
    return res.status(500).json({
      error: '文件下载失败',
      message: error.message
    });
  }
}

async function downloadFile(req, res) {
  const { id, shopifyFileId, fileName: requestedFileName } = req.query;
  
  // 如果提供了shopifyFileId，则通过Shopify Files下载
  if (shopifyFileId) {
    return await handleShopifyFileDownload(req, res, shopifyFileId, requestedFileName);
  }
  
  if (!id) {
    return res.status(400).json({ error: 'Missing file ID' });
  }

  // 检查本地存储（内存Map）
  console.log('🔍 [下载] 检查本地存储:', { 
    id, 
    hasStorage: !!global.fileStorage, 
    storageSize: global.fileStorage?.size || 0 
  });
  
  if (global.fileStorage && global.fileStorage.has(id)) {
    console.log('✅ [下载] 找到本地存储文件:', id);
    try {
      const record = global.fileStorage.get(id);
      const base64 = record.fileData || '';
      const buffer = Buffer.from(base64, 'base64');
      console.log('📦 [下载] 准备返回文件:', { 
        fileName: record.fileName, 
        bufferSize: buffer.length 
      });
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${record.fileName || 'download.bin'}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    } catch (e) {
      console.error('❌ [下载] 从本地存储返回文件失败:', e);
    }
  } else {
    console.log('❌ [下载] 本地存储中未找到文件:', id);
  }

  // 查询存储在 Metaobject 中的文件记录（旧逻辑，保留兼容性）
  const FILE_METAOBJECT_TYPE = 'uploaded_file';
  const query = `
    query($type: String!, $first: Int!) {
      metaobjects(type: $type, first: $first) {
        nodes {
          id
          handle
          fields { key value }
        }
      }
    }
  `;

  let nodes = [];
  try {
    const result = await shopGql(query, { type: FILE_METAOBJECT_TYPE, first: 100 });
    if (result?.errors) {
      console.error('❌ [下载] GraphQL errors:', result.errors);
    }
    nodes = result?.data?.metaobjects?.nodes || [];
  } catch (gqlErr) {
    console.error('❌ [下载] GraphQL request failed:', gqlErr);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>文件服务暂不可用</title></head><body>文件服务暂不可用</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(503).send(html);
  }

  const fileRecord = nodes.find(node => {
    const f = node.fields.find(x => x.key === 'file_id');
    return f && f.value === id;
  });

  if (!fileRecord) {
    if (id.startsWith('file_')) {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>文件不存在</title></head><body>文件不存在：${id}</body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(html);
    }
    return res.status(404).json({ error: '文件不存在' });
  }

  const getField = (key) => {
    const f = fileRecord.fields.find(x => x.key === key);
    return f ? f.value : '';
  };

  const fileName = getField('file_name') || 'download.bin';
  const fileType = getField('file_type') || 'application/octet-stream';
  const fileData = getField('file_data');
  const fileUrlCdn = getField('file_url');
  
  if (fileUrlCdn && (fileUrlCdn.startsWith('http://') || fileUrlCdn.startsWith('https://'))) {
    console.log('✅ [下载] 重定向到 Shopify CDN:', fileUrlCdn);
    res.writeHead(302, { Location: fileUrlCdn });
    return res.end();
  }

  if (!fileData) {
    return res.status(500).json({ error: '文件数据缺失' });
  }

  const buffer = Buffer.from(fileData, 'base64');
  res.setHeader('Content-Type', fileType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);
  return res.status(200).send(buffer);
}

// ========== 统一入口 ==========
// 导出独立函数供路由注册使用
async function uploadToShopifyFilesHandler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  // 检查环境变量（用于诊断）
  console.log('🔧 [文件处理] SKIP_SHOPIFY_FILES 环境变量值:', process.env.SKIP_SHOPIFY_FILES);
  
  // 只有在明确设置了 SKIP_SHOPIFY_FILES=true 时才跳过（用于紧急回退）
  if (process.env.SKIP_SHOPIFY_FILES === 'true') {
    console.log('⚠️ [文件处理] SKIP_SHOPIFY_FILES=true，跳过 Shopify Files，使用本地存储');
    console.log('💡 [文件处理] 提示：要使用 Shopify Files，请在 Railway 环境变量中删除 SKIP_SHOPIFY_FILES 或设置为 false');
    const { fileName, fileData } = req.body;
    const fileSize = fileData ? (fileData.includes(',') ? Buffer.from(fileData.split(',')[1], 'base64').length : Buffer.from(fileData, 'base64').length) : 0;
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return res.status(200).json({
      success: true,
      message: '文件上传成功（本地存储，因为 SKIP_SHOPIFY_FILES=true）',
      fileId: fileId,
      fileName: fileName,
      uploadedFileSize: fileSize,
      storageType: 'local',
      skipReason: 'SKIP_SHOPIFY_FILES=true',
      timestamp: new Date().toISOString()
    });
  }
  
  // 默认上传到 Shopify Files
  console.log('📁 [文件处理] 开始上传到 Shopify Files...');
  try {
    return await uploadToShopifyFiles(req, res);
  } catch (error) {
    console.error('❌ [文件处理] Shopify Files 上传异常:', error);
    // 上传失败时不自动回退，让调用方处理
    throw error;
  }
}

async function storeToServerMemoryHandler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  return await storeToServerMemory(req, res);
}

async function downloadFileHandler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  return await downloadFile(req, res);
}

// 默认导出（向后兼容）
module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 根据路由路径分发请求
  const url = req.url || req.path || req.originalUrl || '';
  
  if (url.includes('/store-file-real') && req.method === 'POST') {
    return await uploadToShopifyFilesHandler(req, res);
  }
  
  if (url.includes('/store-file-data') && req.method === 'POST') {
    return await storeToServerMemoryHandler(req, res);
  }
  
  if (url.includes('/download-file') && req.method === 'GET') {
    return await downloadFileHandler(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

// 导出独立函数供路由注册使用
module.exports.uploadToShopifyFiles = uploadToShopifyFilesHandler;
module.exports.storeToServerMemory = storeToServerMemoryHandler;
module.exports.downloadFile = downloadFileHandler;
// 导出存储函数供其他API使用
module.exports.storeFileData = storeFileDataFunction;

