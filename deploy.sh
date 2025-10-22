#!/bin/bash

# 3D Printing Service 部署脚本
# 支持 Docker 和 Railway 部署

set -e

echo "🚀 3D Printing Service 部署脚本"
echo "=================================="

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 [docker|railway|help]"
    echo ""
    echo "选项:"
    echo "  docker  - 使用 Docker 部署"
    echo "  railway - 使用 Railway 部署"
    echo "  help    - 显示帮助信息"
    exit 1
fi

DEPLOY_TYPE=$1

case $DEPLOY_TYPE in
    "docker")
        echo "🐳 开始 Docker 部署..."
        
        # 检查 Docker 是否安装
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker 未安装，请先安装 Docker"
            exit 1
        fi
        
        # 检查环境变量文件
        if [ ! -f ".env" ]; then
            echo "⚠️  未找到 .env 文件，从 env.example 复制..."
            cp env.example .env
            echo "📝 请编辑 .env 文件设置正确的环境变量"
            echo "   特别是 SHOPIFY_STORE_DOMAIN 和 SHOPIFY_ACCESS_TOKEN"
            read -p "按回车键继续..."
        fi
        
        # 构建 Docker 镜像
        echo "🔨 构建 Docker 镜像..."
        docker build -t shopify-3d-service .
        
        # 停止现有容器（如果存在）
        echo "🛑 停止现有容器..."
        docker stop shopify-3d-service 2>/dev/null || true
        docker rm shopify-3d-service 2>/dev/null || true
        
        # 运行新容器
        echo "🚀 启动新容器..."
        docker run -d \
            --name shopify-3d-service \
            -p 3000:3000 \
            --env-file .env \
            --restart unless-stopped \
            shopify-3d-service
        
        echo "✅ Docker 部署完成！"
        echo "🌐 访问地址: http://localhost:3000"
        echo "📊 查看日志: docker logs -f shopify-3d-service"
        ;;
        
    "railway")
        echo "🚂 开始 Railway 部署..."
        
        # 检查 Railway CLI 是否安装
        if ! command -v railway &> /dev/null; then
            echo "📦 安装 Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # 检查是否已登录
        if ! railway whoami &> /dev/null; then
            echo "🔐 请先登录 Railway..."
            railway login
        fi
        
        # 部署到 Railway
        echo "🚀 部署到 Railway..."
        railway up
        
        echo "✅ Railway 部署完成！"
        echo "🌐 查看部署状态: railway status"
        echo "📊 查看日志: railway logs"
        ;;
        
    "help")
        echo "📖 部署帮助"
        echo ""
        echo "Docker 部署:"
        echo "  1. 确保已安装 Docker"
        echo "  2. 复制 env.example 为 .env 并配置环境变量"
        echo "  3. 运行: $0 docker"
        echo ""
        echo "Railway 部署:"
        echo "  1. 注册 Railway 账号"
        echo "  2. 安装 Railway CLI: npm install -g @railway/cli"
        echo "  3. 登录: railway login"
        echo "  4. 运行: $0 railway"
        echo ""
        echo "环境变量配置:"
        echo "  SHOPIFY_STORE_DOMAIN=your-store.myshopify.com"
        echo "  SHOPIFY_ACCESS_TOKEN=your_admin_access_token"
        echo "  NODE_ENV=production"
        echo "  PORT=3000"
        ;;
        
    *)
        echo "❌ 未知的部署类型: $DEPLOY_TYPE"
        echo "请使用: docker, railway, 或 help"
        exit 1
        ;;
esac
