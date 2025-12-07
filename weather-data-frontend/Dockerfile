# --- 第一阶段：构建 ---
FROM node:18-alpine as builder

WORKDIR /app

# 1. 复制依赖文件 (利用缓存)
COPY package.json package-lock.json ./
# 注意：看你截图里有 package-lock.json，最好也复制进去

# 2. 安装依赖
RUN npm install

# 3. 复制源代码
COPY . .

# 4. 执行构建 (Vite 项目通常是 npm run build)
RUN npm run build
# 这里的产物通常会生成在 /app/dist 目录下

# --- 第二阶段：运行 ---
FROM nginx:alpine

# 5. 复制构建好的静态文件到 Nginx
# 确保这里是 /app/dist，因为 Vite 默认输出到 dist
COPY --from=builder /app/dist /usr/share/nginx/html

# 6. 复制你项目里的 nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]