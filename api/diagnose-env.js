module.exports = async function handler(req, res) {
  try {
    const envInfo = {
      timestamp: new Date().toISOString(),
      shopify: {
        hasStoreDomain: !!(process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP),
        hasAccessToken: !!(process.env.SHOPIFY_ACCESS_TOKEN || process.env.ADMIN_TOKEN),
        storeDomain: process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOP || 'NOT SET',
        accessTokenLength: (process.env.SHOPIFY_ACCESS_TOKEN || process.env.ADMIN_TOKEN || '').length,
      },
      publicUrl: {
        hasPublicBaseUrl: !!process.env.PUBLIC_BASE_URL,
        publicBaseUrl: process.env.PUBLIC_BASE_URL || 'NOT SET',
      },
      allEnvVars: Object.keys(process.env).filter(k => 
        k.includes('SHOPIFY') || 
        k.includes('SHOP') || 
        k.includes('ADMIN') || 
        k.includes('PUBLIC')
      ).map(k => ({ key: k, hasValue: !!process.env[k] })),
    };

    return res.status(200).json({
      success: true,
      message: '环境变量诊断信息',
      environment: envInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

