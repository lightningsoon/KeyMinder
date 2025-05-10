# 使用 Debian 基础镜像而不是 Alpine
FROM node:18

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 暴露端口
EXPOSE 8009

# 启动命令
CMD ["npm", "run", "dev"]
