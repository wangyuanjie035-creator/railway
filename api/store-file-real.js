const setCorsHeaders = require('./cors-config.js');
const FormData = require('form-data');

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
  setCorsHeaders(req, res, () => {});

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

      // 步骤2: 上传文件到临时地址（使用 form-data 并严格遵循字段顺序，文件放最后，避免自定义 headers）
      const formData = new FormData();
      // 1) 先追加服务返回的所有参数
      stagedTarget.parameters.forEach(param => {
        formData.append(param.name, param.value);
      });
      // 2) 最后追加文件（只设置 filename，避免 contentType 造成签名不匹配）
      formData.append('file', fileBuffer, { filename: fileName });

      console.log('📤 上传文件到:', stagedTarget.url);
      console.log('📊 FormData参数数量:', stagedTarget.parameters.length);

      const uploadResponse = await fetch(stagedTarget.url, {
        method: 'POST',
        body: formData,
        // 不要设置任何额外 headers；签名依赖于字段，form-data 会自动设置边界
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ 文件上传失败:', uploadResponse.status, uploadResponse.statusText);
        console.error('错误详情:', errorText);
        return res.status(500).json({
          success: false,
          message: '文件上传到临时地址失败',
          error: `${uploadResponse.status} - ${uploadResponse.statusText}`,
          details: errorText
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
