# 🔧 Vercel环境变量配置指南

## 🚨 问题确认
诊断结果显示：
- ❌ **环境变量缺失**: `hasStoreDomain: false`, `hasAccessToken: false`
- ❌ **配置问题**: Vercel中没有配置Shopify API密钥

## 🎯 解决方案：配置Vercel环境变量

### 步骤1: 获取Shopify API密钥

#### 1.1 登录Shopify管理后台
1. 访问你的Shopify商店管理后台
2. 登录管理员账户

#### 1.2 创建私有应用
1. 进入 **设置** → **应用和销售渠道**
2. 点击 **开发应用**
3. 点击 **创建应用**
4. 填写应用信息：
   - **应用名称**: `询价系统API`
   - **应用URL**: `https://shopify-13s4.vercel.app`

#### 1.3 配置API权限
在 **配置** 选项卡中，启用以下权限：
- ✅ **Draft orders**: `read_orders`, `write_orders`
- ✅ **Customers**: `read_customers`
- ✅ **Products**: `read_products`
- ✅ **GraphQL Admin API**: `read_orders`, `write_orders`

#### 1.4 获取API密钥
1. 在 **API凭据** 选项卡中
2. 复制 **Admin API访问令牌**
3. 记录你的 **商店域名** (例如: `your-store.myshopify.com`)

### 步骤2: 配置Vercel环境变量

#### 2.1 登录Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 登录你的账户

#### 2.2 进入项目设置
1. 选择你的项目 `shopify-13s4`
2. 点击 **Settings** 选项卡
3. 点击左侧菜单的 **Environment Variables**

#### 2.3 添加环境变量
添加以下两个环境变量：

**变量1: SHOPIFY_STORE_DOMAIN**
- **Name**: `SHOPIFY_STORE_DOMAIN`
- **Value**: `sain-pdc-test.myshopify.com` (你的实际商店域名)
- **Environment**: `Production`, `Preview`, `Development`

**变量2: SHOPIFY_ACCESS_TOKEN**
- **Name**: `SHOPIFY_ACCESS_TOKEN`
- **Value**: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (你的API访问令牌)
- **Environment**: `Production`, `Preview`, `Development`

#### 2.4 重新部署
1. 添加环境变量后
2. 点击 **Redeploy** 按钮
3. 等待部署完成

### 步骤3: 验证配置

#### 3.1 测试诊断API
部署完成后，访问：
```
https://shopify-13s4.vercel.app/api/diagnose-submit
```

**期望结果**:
```json
{
  "success": true,
  "message": "诊断信息",
  "diagnostics": {
    "environment": {
      "hasStoreDomain": true,
      "hasAccessToken": true,
      "storeDomain": "sain-pdc-test.myshopify.com",
      "accessTokenLength": 32
    },
    "testDraftOrderCreation": {
      "success": true,
      "status": 200,
      "hasErrors": false
    }
  }
}
```

#### 3.2 测试询价提交
1. 访问model-uploader页面
2. 提交一个新的询价
3. 检查是否创建了真实的Shopify Draft Order

#### 3.3 验证管理端同步
1. 访问管理端页面
2. 检查是否能看到新创建的询价单

## 🎯 配置完成后的效果

### 客户端功能
- ✅ 询价提交创建真实的Shopify Draft Order
- ✅ 询价详情从真实数据获取
- ✅ 状态更新实时同步

### 管理端功能
- ✅ 能看到客户端提交的询价单
- ✅ 可以修改价格和状态
- ✅ 数据与客户端同步

### 完整交互流程
1. **客户提交询价** → 创建真实Draft Order
2. **管理端查看** → 显示真实询价单
3. **管理员报价** → 更新Draft Order价格
4. **客户查看更新** → 显示最新价格和状态
5. **客户下单** → 转换为真实订单

## 📝 重要说明

- **安全性**: API访问令牌是敏感信息，不要分享给他人
- **权限**: 确保API权限足够，但不要过度授权
- **域名**: 确保商店域名格式正确（包含.myshopify.com）
- **重新部署**: 添加环境变量后必须重新部署

---

**请按照上述步骤配置Vercel环境变量，这将解决真实API无法工作的问题！**
