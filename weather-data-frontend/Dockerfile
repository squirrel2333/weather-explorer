# --- 第一阶段：构建 ---
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# 执行构建 (npm run build)
RUN npm run build
# 产物生成在 /app/dist 目录下

# --- 第二阶段：运行 ---
FROM nginx:alpine

# 构建产物静态文件到 Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]