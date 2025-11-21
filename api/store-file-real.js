const setCorsHeaders = require('./cors-config.js');

// 优先使用 form-data 包，确保兼容性
let FormDataClass;
try {
  FormDataClass = require('form-data');
} catch (e) {
  console.error('⚠️ 无法加载 form-data 包，尝试使用原生 FormData:', e);
  FormDataClass = global.FormData;
}

console.log('🔧 使用的 FormData 类型:', FormDataClass.name || '未知');

/**
 * ═══════════════════════════════════════════════════════════════
 * 真实文件存储API - 使用Shopify Staged Upload
 * ═══════════════════════════════════════════════════════════════
 * 
 * 功能：将Base64文件数据上传到Shopify Files
 * 
 * 用途：
 * - 确保文件大小与原始上传一致
 * - 使用Shopify CDN存储，提供更好的性能
 * - 支持大文件上传（最大100MB）
 * 
 * 请求示例：
 * POST /api/store-file-real
 * {
 *   "fileData": "data:application/step;base64,U1RFUCBGSUxF...",
 *   "fileName": "model.STEP",
 *   "fileType": "application/step"
 * }
 */

module.exports = async function handler(req, res) {
  // 使用 CORS 中间件
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
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

      console.log(`📁 开始上传文件: ${fileName}, 大小: ${fileSize} 字节`);
      console.log(`🔧 SKIP_SHOPIFY_FILES 环境变量值: ${process.env.SKIP_SHOPIFY_FILES}`);
      
      // 临时跳过 Shopify Files，直接使用 Base64 存储（调试用）
      if (process.env.SKIP_SHOPIFY_FILES === 'true') {
        console.log('🔄 跳过 Shopify Files，直接使用 Base64 存储');
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return res.status(200).json({
          success: true,
          message: '文件上传成功（Base64存储）',
          fileId: fileId,
          fileName: fileName,
          fileData: fileData, // 返回原始 Base64 数据
          uploadedFileSize: fileSize,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('⚠️ SKIP_SHOPIFY_FILES 未设置，将尝试上传到 Shopify Files');

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
        console.error('❌ Staged Upload创建失败:', stagedUploadData);
        return res.status(500).json({
          success: false,
          message: 'Staged Upload创建失败',
          error: stagedUploadData.errors || stagedUploadData.data.stagedUploadsCreate.userErrors
        });
      }

      const stagedTarget = stagedUploadData.data.stagedUploadsCreate.stagedTargets[0];
      console.log('✅ Staged Upload创建成功');
      console.log('🔍 完整的 stagedTarget:', JSON.stringify(stagedTarget, null, 2));
      
      // 检查参数是否完整
      if (!stagedTarget.parameters || stagedTarget.parameters.length < 5) {
        console.error('⚠️ 参数数量异常，预期至少5个参数，实际:', stagedTarget.parameters?.length || 0);
        console.error('🔍 完整响应:', JSON.stringify(stagedUploadData, null, 2));
      }

      // 步骤2: 上传文件到临时地址
      const formData = new FormDataClass();
      
      console.log('🧾 Staged params (name only):', stagedTarget.parameters.map(p => p.name));
      console.log('🧾 Staged params (full):', stagedTarget.parameters.map(p => `${p.name}: ${p.value}`));
      console.log('🔍 stagedTarget.url:', stagedTarget.url);
      console.log('🔍 stagedTarget.resourceUrl:', stagedTarget.resourceUrl);
      
      // 添加参数（严格按照 Shopify 返回的顺序，文件必须是最后一个）
      // 重要：参数顺序和文件位置对签名验证至关重要
      stagedTarget.parameters.forEach((param, index) => {
        formData.append(param.name, param.value);
        console.log(`✅ [${index + 1}] 添加参数: ${param.name} = ${param.value.substring(0, 50)}${param.value.length > 50 ? '...' : ''}`);
      });
      
      // 添加文件（必须是最后一个字段，否则签名验证会失败）
      if (FormDataClass.name === 'FormData') {
        // 原生 FormData (Node.js 18+)
        const blob = new Blob([fileBuffer], { type: fileType || 'application/octet-stream' });
        formData.append('file', blob, fileName);
        console.log(`📎 [最后] 添加文件 (原生): ${fileName}, 大小: ${fileSize} 字节`);
      } else {
        // form-data 包
        formData.append('file', fileBuffer, {
          filename: fileName,
          contentType: fileType || 'application/octet-stream'
        });
        console.log(`📎 [最后] 添加文件 (form-data): ${fileName}, 大小: ${fileSize} 字节`);
      }
      
      // 验证：确保文件是最后一个字段
      console.log(`📊 FormData 字段总数: ${stagedTarget.parameters.length + 1} (${stagedTarget.parameters.length} 个参数 + 1 个文件)`);

      console.log('📤 上传文件到:', stagedTarget.url);
      console.log('📊 FormData参数数量:', stagedTarget.parameters.length);

      // 上传文件（关键：不要设置任何 headers，让 form-data 自动处理）
      // 如果使用 form-data 包，需要获取 headers（但 fetch 会自动处理）
      let uploadOptions = {
        method: 'POST',
        body: formData
      };
      
      // 如果使用 form-data 包，可能需要设置 headers（但通常不需要）
      if (formData.getHeaders && typeof formData.getHeaders === 'function') {
        const headers = formData.getHeaders();
        console.log('📋 FormData Headers:', Object.keys(headers));
        // 注意：fetch API 会自动处理 multipart/form-data 的 headers
        // 不要手动设置，否则可能导致签名验证失败
      }
      
      const uploadResponse = await fetch(stagedTarget.url, uploadOptions);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ 文件上传失败:', uploadResponse.status, uploadResponse.statusText);
        console.error('错误详情:', errorText);
        console.error('🔍 上传URL:', stagedTarget.url);
        
        // 检查是否是签名验证错误
        if (uploadResponse.status === 403 || errorText.includes('SignatureDoesNotMatch') || errorText.includes('Signature')) {
          console.error('⚠️ 签名验证失败！可能的原因:');
          console.error('  1. 参数顺序不正确（必须按照 Shopify 返回的顺序）');
          console.error('  2. 文件不是最后一个字段（文件必须是最后一个）');
          console.error('  3. FormData 边界格式不正确');
          console.error('  4. 参数值被修改或截断');
          console.error('  5. 使用了错误的 FormData 实现');
          
          // 输出调试信息
          console.error('🔍 调试信息:');
          console.error('  - FormData 类型:', FormDataClass.name || '未知');
          console.error('  - 参数数量:', stagedTarget.parameters.length);
          console.error('  - 参数名称列表:', stagedTarget.parameters.map(p => p.name).join(', '));
          console.error('  - 文件字段名: file');
          console.error('  - 文件大小:', fileSize, '字节');
          
          if (formData.getHeaders && typeof formData.getHeaders === 'function') {
            const headers = formData.getHeaders();
            console.error('  - FormData Headers:', headers);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: '文件上传到临时地址失败',
          error: `${uploadResponse.status} - ${uploadResponse.statusText}`,
          details: errorText,
          isSignatureError: uploadResponse.status === 403 || errorText.includes('Signature')
        });
      }

      console.log('✅ 文件上传到临时地址成功');

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
        console.error('❌ 文件记录创建失败:', fileCreateData);
        return res.status(500).json({
          success: false,
          message: '文件记录创建失败',
          error: fileCreateData.errors || fileCreateData.data.fileCreate.userErrors
        });
      }

      const fileRecord = fileCreateData.data.fileCreate.files[0];
      console.log('✅ 文件记录创建成功:', fileRecord.id);

      // 生成文件ID
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
      console.error('❌ 文件存储失败:', error);
      return res.status(500).json({
        success: false,
        message: '文件存储失败',
        error: error.message
      });
    }
  }

  res.status(405).json({
    error: 'Method not allowed',
    allowed: ['POST', 'OPTIONS']
  });
}
