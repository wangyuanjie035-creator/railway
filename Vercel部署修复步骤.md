# 🚨 Vercel部署修复步骤

## 🔍 问题确认
- **API端点**: `https://shopify-13s4.vercel.app/api/test` 返回404
- **根本原因**: Vercel没有正确识别API文件

## 🛠️ 立即修复步骤

### 步骤1: 推送代码到GitHub
```bash
git add .
git commit -m "Fix Vercel API deployment - add vercel.json config"
git push origin main
```

### 步骤2: 等待Vercel重新部署
1. 访问Vercel控制台
2. 等待自动重新部署完成
3. 检查部署日志

### 步骤3: 测试API端点
重新访问以下URL：
```
https://shopify-13s4.vercel.app/api/hello
```

如果返回JSON响应，说明API正常工作。

## 🔧 已添加的修复文件

### 1. vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

### 2. api/hello.js
简单的测试API端点，用于验证部署是否正常。

## 📋 测试清单

### 基础测试
- [ ] 访问 `https://shopify-13s4.vercel.app/api/hello`
- [ ] 应该返回JSON响应
- [ ] 不应该返回404错误

### 询价API测试
- [ ] 访问 `https://shopify-13s4.vercel.app/api/submit-quote`
- [ ] 应该返回API响应（可能是错误，但不应该是404）

## 🚨 如果仍然404

### 检查Vercel项目设置
1. **项目根目录**: 确保设置为包含`api`文件夹的目录
2. **构建命令**: 留空（Vercel会自动检测）
3. **输出目录**: 留空
4. **安装命令**: `npm install`

### 检查GitHub连接
1. 确保Vercel连接到正确的GitHub仓库
2. 确保仓库包含最新的代码
3. 检查分支设置（应该是`main`）

### 手动重新部署
在Vercel控制台：
1. 点击"Deployments"标签
2. 点击"Redeploy"按钮
3. 等待部署完成

## 📞 下一步

1. **推送代码**: 执行上面的git命令
2. **等待部署**: 等待Vercel自动重新部署
3. **测试API**: 访问 `https://shopify-13s4.vercel.app/api/hello`
4. **告诉我结果**: 返回什么内容？

---

**请立即推送代码并测试API端点，然后告诉我结果！**
