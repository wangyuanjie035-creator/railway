# 使用 Node.js 18 LTS 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制所有文件到容器
COPY . .

# 暴露端口（Railway 会自动设置 PORT 环境变量）
EXPOSE 8080

# 启动服务器
CMD ["node", "server.js"]

