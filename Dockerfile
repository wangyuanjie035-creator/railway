# 使用 Node.js 18 LTS 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
# 如果 package-lock.json 存在，使用 npm ci（更快、更可靠）
# 否则使用 npm install
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production; \
    else \
      npm install --only=production; \
    fi

# 复制所有文件到容器（排除 .dockerignore 中的文件）
COPY . .

# 暴露端口（Railway 会自动设置 PORT 环境变量）
EXPOSE 8080

# 启动服务器
CMD ["node", "server.js"]

