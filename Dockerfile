# 使用 Node.js 18 LTS 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
# 使用 npm install 而不是 npm ci，避免 package-lock.json 不同步的问题
# Railway 构建时可能 package-lock.json 与 package.json 不完全同步
# 如果 package-lock.json 存在但不匹配，npm install 会自动更新它
RUN if [ -f package-lock.json ]; then \
      npm install --omit=dev --prefer-offline --no-audit || npm install --omit=dev --no-audit; \
    else \
      npm install --omit=dev --no-audit; \
    fi

# 复制所有文件到容器（排除 .dockerignore 中的文件）
COPY . .

# 暴露端口（Railway 会自动设置 PORT 环境变量）
EXPOSE 8080

# 启动服务器
CMD ["node", "server.js"]

