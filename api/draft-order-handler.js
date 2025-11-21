/**
 * ═══════════════════════════════════════════════════════════════
 * Draft Order 操作处理 API - 统一处理所有 Draft Order 相关操作
 * ═══════════════════════════════════════════════════════════════
 * 
 * 功能：
 * 1. 获取订单列表（管理端）
 * 2. 获取单个订单详情
 * 3. 更新订单（报价）
 * 4. 删除订单
 * 5. 完成订单
 * 
 * 路由：
 * - GET /api/get-draft-orders → 获取订单列表
 * - GET /api/get-draft-order-simple → 获取单个订单详情
 * - POST /api/update-quote → 更新报价
 * - DELETE /api/delete-draft-order → 删除订单
 * - POST /api/complete-draft-order → 完成订单
 */

const setCorsHeaders = require('./cors-config.js');

// ========== 辅助函数：Shopify GraphQL API ==========
async function shopGql(query, variables) {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || process.env.ADMIN_TOKEN;
  
  if (!storeDomain || !accessToken) {
    throw new Error('缺少 Shopify 配置');
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

  if (!resp.ok) {
    throw new Error(`Shopify API 请求失败: ${resp.status}`);
  }

  const json = await resp.json();
  
  if (json.errors) {
    throw new Error(`GraphQL 错误: ${json.errors[0].message}`);
  }
  
  return json;
}

// ========== 功能 1: 获取订单列表 ==========
async function getDraftOrdersList(req, res) {
  try {
    const { status, limit = 50 } = req.query;
    
    console.log('📋 [订单列表] 开始获取Draft Orders列表...', { status, limit });

    const query = `
      query($first: Int!) {
        draftOrders(first: $first, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              email
              createdAt
              updatedAt
              totalPrice
              subtotalPrice
              invoiceUrl
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPrice
                    customAttributes {
                      key
                      value
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const result = await shopGql(query, { first: parseInt(limit) });
    
    if (!result.data || !result.data.draftOrders) {
      console.warn('⚠️ [订单列表] Shopify API返回空数据');
      return res.status(200).json({
        success: true,
        draftOrders: [],
        total: 0,
        pending: 0,
        quoted: 0
      });
    }

    const edges = result.data.draftOrders.edges || [];
    const draftOrders = edges.map(edge => {
      const node = edge.node;
      const lineItem = node.lineItems.edges[0]?.node;
      const customAttributes = lineItem?.customAttributes || [];
      
      // 从 customAttributes 中提取信息
      const getAttribute = (key) => {
        const attr = customAttributes.find(a => a.key === key);
        return attr ? attr.value : null;
      };

      return {
        id: node.id,
        name: node.name,
        email: node.email,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        totalPrice: node.totalPrice,
        subtotalPrice: node.subtotalPrice,
        invoiceUrl: node.invoiceUrl,
        // 提取自定义属性
        quoteId: getAttribute('询价单号'),
        fileName: getAttribute('文件') || getAttribute('文件名称'),
        fileId: getAttribute('文件ID'),
        shopifyFileId: getAttribute('Shopify文件ID'),
        status: getAttribute('状态') || '待报价',
        material: getAttribute('材料'),
        color: getAttribute('颜色'),
        precision: getAttribute('精度'),
        fileStorageType: getAttribute('文件存储方式'),
        lineItems: node.lineItems.edges.map(e => ({
          id: e.node.id,
          title: e.node.title,
          quantity: e.node.quantity,
          originalUnitPrice: e.node.originalUnitPrice,
          customAttributes: e.node.customAttributes
        }))
      };
    });

    // 过滤状态
    let filteredOrders = draftOrders;
    if (status) {
      filteredOrders = draftOrders.filter(order => {
        const orderStatus = order.status || '待报价';
        return orderStatus === status;
      });
    }

    // 统计
    const pending = draftOrders.filter(o => (o.status || '待报价') === '待报价').length;
    const quoted = draftOrders.filter(o => (o.status || '待报价') === '已报价').length;

    console.log('✅ [订单列表] 获取成功:', { total: draftOrders.length, pending, quoted });

    return res.status(200).json({
      success: true,
      draftOrders: filteredOrders,
      total: draftOrders.length,
      pending,
      quoted
    });

  } catch (error) {
    console.error('❌ [订单列表] 获取失败:', error);
    return res.status(200).json({
      success: true,
      draftOrders: [],
      total: 0,
      pending: 0,
      quoted: 0,
      error: error.message
    });
  }
}

// ========== 功能 2: 获取单个订单详情 ==========
async function getDraftOrderDetail(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing draftOrderId parameter'
      });
    }

    console.log('📋 [订单详情] 查询询价单:', id);

    const query = `
      query($id: ID!) {
        draftOrder(id: $id) {
          id
          name
          email
          createdAt
          updatedAt
          totalPrice
          subtotalPrice
          invoiceUrl
          lineItems(first: 10) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPrice
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
      }
    `;

    const result = await shopGql(query, { id });

    if (!result.data || !result.data.draftOrder) {
      return res.status(404).json({
        success: false,
        error: '未找到草稿订单'
      });
    }

    const draftOrder = result.data.draftOrder;
    const lineItem = draftOrder.lineItems.edges[0]?.node;
    const customAttributes = lineItem?.customAttributes || [];
    
    // 从 customAttributes 中提取信息
    const getAttribute = (key) => {
      const attr = customAttributes.find(a => a.key === key);
      return attr ? attr.value : null;
    };

    const orderDetail = {
      id: draftOrder.id,
      name: draftOrder.name,
      email: draftOrder.email,
      createdAt: draftOrder.createdAt,
      updatedAt: draftOrder.updatedAt,
      totalPrice: draftOrder.totalPrice,
      subtotalPrice: draftOrder.subtotalPrice,
      invoiceUrl: draftOrder.invoiceUrl,
      quoteId: getAttribute('询价单号'),
      fileName: getAttribute('文件') || getAttribute('文件名称'),
      fileId: getAttribute('文件ID'),
      shopifyFileId: getAttribute('Shopify文件ID'),
      status: getAttribute('状态') || '待报价',
      material: getAttribute('材料'),
      color: getAttribute('颜色'),
      precision: getAttribute('精度'),
      fileStorageType: getAttribute('文件存储方式'),
      lineItems: draftOrder.lineItems.edges.map(e => ({
        id: e.node.id,
        title: e.node.title,
        quantity: e.node.quantity,
        originalUnitPrice: e.node.originalUnitPrice,
        customAttributes: e.node.customAttributes
      }))
    };

    console.log('✅ [订单详情] 获取成功:', orderDetail.id);

    return res.status(200).json({
      success: true,
      draftOrder: orderDetail
    });

  } catch (error) {
    console.error('❌ [订单详情] 获取失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========== 功能 3: 更新订单（报价） ==========
async function updateDraftOrder(req, res) {
  try {
    const { draftOrderId, amount, note, senderEmail } = req.body;

    if (!draftOrderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: draftOrderId, amount'
      });
    }

    console.log('📋 [更新订单] 开始更新报价:', { draftOrderId, amount });

    // 步骤 1: 查询现有 Draft Order
    const getQuery = `
      query($id: ID!) {
        draftOrder(id: $id) {
          id
          name
          email
          invoiceUrl
          lineItems(first: 10) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPrice
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
      }
    `;
    
    const currentResult = await shopGql(getQuery, { id: draftOrderId });
    
    if (!currentResult.data.draftOrder) {
      return res.status(404).json({ error: '未找到草稿订单' });
    }
    
    const currentDraftOrder = currentResult.data.draftOrder;
    const currentLineItem = currentDraftOrder.lineItems.edges[0].node;
    
    // 步骤 2: 更新 Draft Order
    const updatedAttributes = [
      ...currentLineItem.customAttributes.filter(attr => 
        !['状态', '报价金额', '报价时间', '备注', '客服邮箱'].includes(attr.key)
      ),
      { key: "状态", value: "已报价" },
      { key: "报价金额", value: `¥${amount}` },
      { key: "报价时间", value: new Date().toISOString() }
    ];
    
    if (note) {
      updatedAttributes.push({ key: "备注", value: note });
    }
    
    if (senderEmail) {
      updatedAttributes.push({ key: "客服邮箱", value: senderEmail });
    }
    
    const updateMutation = `
      mutation($id: ID!, $input: DraftOrderInput!) {
        draftOrderUpdate(id: $id, input: $input) {
          draftOrder {
            id
            name
            invoiceUrl
            totalPrice
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const updateInput = {
      taxExempt: true,
      lineItems: [{
        title: currentLineItem.title,
        quantity: currentLineItem.quantity,
        originalUnitPrice: amount.toString(),
        customAttributes: updatedAttributes
      }],
      note: `已报价: ¥${amount}\n报价时间: ${new Date().toLocaleString('zh-CN')}\n${note || ''}`
    };
    
    const updateResult = await shopGql(updateMutation, {
      id: draftOrderId,
      input: updateInput
    });
    
    if (updateResult.data.draftOrderUpdate.userErrors.length > 0) {
      throw new Error('更新草稿订单失败: ' + updateResult.data.draftOrderUpdate.userErrors[0].message);
    }
    
    const updatedDraftOrder = updateResult.data.draftOrderUpdate.draftOrder;
    console.log('✅ [更新订单] Draft Order 更新成功，新价格:', updatedDraftOrder.totalPrice);
    
    return res.status(200).json({
      success: true,
      draftOrderId: updatedDraftOrder.id,
      draftOrderName: updatedDraftOrder.name,
      invoiceUrl: updatedDraftOrder.invoiceUrl,
      totalPrice: updatedDraftOrder.totalPrice,
      message: '报价更新成功'
    });

  } catch (error) {
    console.error('❌ [更新订单] 更新失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========== 功能 4: 删除订单 ==========
async function deleteDraftOrder(req, res) {
  try {
    const { draftOrderId } = req.body;

    if (!draftOrderId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing draftOrderId parameter' 
      });
    }

    console.log('🗑️ [删除订单] 开始删除Draft Order:', draftOrderId);

    const deleteMutation = `
      mutation($input: DraftOrderDeleteInput!) {
        draftOrderDelete(input: $input) {
          deletedId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await shopGql(deleteMutation, { 
      input: { id: draftOrderId }
    });

    if (result.data.draftOrderDelete.userErrors.length > 0) {
      throw new Error(`删除失败: ${result.data.draftOrderDelete.userErrors[0].message}`);
    }

    console.log('✅ [删除订单] Draft Order删除成功:', draftOrderId);

    return res.status(200).json({
      success: true,
      message: 'Draft Order删除成功',
      deletedId: result.data.draftOrderDelete.deletedId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [删除订单] 删除失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: '删除Draft Order失败',
      timestamp: new Date().toISOString()
    });
  }
}

// ========== 功能 5: 完成订单 ==========
async function completeDraftOrder(req, res) {
  try {
    const { draftOrderId } = req.body;
    
    if (!draftOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Draft Order ID is required'
      });
    }

    console.log('✅ [完成订单] 开始完成草稿订单:', draftOrderId);

    const completeMutation = `
      mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
        draftOrderComplete(id: $id, paymentPending: $paymentPending) {
          draftOrder {
            id
            name
            email
            totalPrice
            status
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await shopGql(completeMutation, {
      id: draftOrderId,
      paymentPending: true
    });

    if (result.data?.draftOrderComplete?.userErrors?.length > 0) {
      throw new Error(`完成草稿订单失败: ${result.data.draftOrderComplete.userErrors.map(e => e.message).join(', ')}`);
    }

    const completedDraftOrder = result.data.draftOrderComplete.draftOrder;
    console.log('✅ [完成订单] 草稿订单已完成:', completedDraftOrder.id);

    return res.status(200).json({
      success: true,
      draftOrder: {
        id: completedDraftOrder.id,
        name: completedDraftOrder.name,
        email: completedDraftOrder.email,
        totalPrice: completedDraftOrder.totalPrice,
        status: completedDraftOrder.status,
        invoiceUrl: completedDraftOrder.invoiceUrl
      },
      message: '草稿订单已完成，可以付款'
    });

  } catch (error) {
    console.error('❌ [完成订单] 完成失败:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: '完成草稿订单失败'
    });
  }
}

// ========== 统一入口 ==========
module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 根据路由路径和 HTTP 方法分发请求
  const url = req.url || req.path || '';
  const method = req.method;

  // GET 请求
  if (method === 'GET') {
    if (url.includes('/get-draft-orders')) {
      return await getDraftOrdersList(req, res);
    }
    if (url.includes('/get-draft-order-simple')) {
      return await getDraftOrderDetail(req, res);
    }
  }

  // POST 请求
  if (method === 'POST') {
    if (url.includes('/update-quote')) {
      return await updateDraftOrder(req, res);
    }
    if (url.includes('/complete-draft-order')) {
      return await completeDraftOrder(req, res);
    }
  }

  // DELETE 请求
  if (method === 'DELETE') {
    if (url.includes('/delete-draft-order')) {
      return await deleteDraftOrder(req, res);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

