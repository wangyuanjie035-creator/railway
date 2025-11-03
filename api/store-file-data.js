// 文件存储函数 - 使用全局Map存储Base64文件
async function storeFileData({ draftOrderId, fileData, fileName }) {
  try {
    // 使用全局变量存储文件数据
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

    console.log('✅ 文件数据存储成功:', { fileId, fileName, draftOrderId });
    console.log('📊 当前存储数量:', global.fileStorage.size);

    return {
      success: true,
      message: '文件数据存储成功',
      fileId,
      fileName,
      draftOrderId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ 文件存储失败:', error);
    return {
      success: false,
      message: '文件存储失败',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', 'https://sain-pdc-test.myshopify.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { draftOrderId, fileData, fileName } = req.body;

    console.log('📥 store-file-data 收到请求:', { draftOrderId, fileName, fileDataLength: fileData?.length || 0 });

    if (!draftOrderId || !fileData || !fileName) {
      console.error('❌ 缺少必要参数:', { draftOrderId: !!draftOrderId, fileData: !!fileData, fileName: !!fileName });
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: draftOrderId, fileData, fileName'
      });
    }

    // 调用存储函数
    const result = await storeFileData({ draftOrderId, fileData, fileName });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ 文件存储失败:', error);
    return res.status(500).json({
      success: false,
      message: '文件存储失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 导出存储函数供其他API使用
module.exports.storeFileData = storeFileData;
