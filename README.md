# 气象数据查询平台

## 服务
### 前端：weather-data-frontend
### 后端：weather-data-backend

## 本地部署运行
1. 修改`docker-compose.yaml`文件中nc文件存储、挂载路径
```yaml
    environment:
      # 数据挂载路径/数据文件名
      - WEATHER_DATA_PATH=/data/2025-06-01T00_00_00_cn_flatted.nc
    volumes:
      # 运行环境 .nc 文件的路径
      - /Users/hqw/code/weather-explorer/weather-data-backend/data:/data
```
2. 构建镜像并启动容器：`docker-compose up -d --build`

## 云上部署运行
1. 构建后端镜像： `docker build -t weather-backend:v1.0 -f weather-data-backend/Dockerfile ./weather-data-backend`
2. 构建前端镜像：`docker build -t weather-frontend:v1.0 -f weather-data-frontend/Dockerfile ./weather-data-frontend`
3. 挂载数据文件+装配文件：
```txt
weather-deploy/
├── data/
│   └── 2025-06-01T00_00_00_cn_flatted.nc  # 数据文件
└── docker-compose.yml                     # 专门用于部署的配置
```
4. 装配文件内容：
```yaml
version: '3.8'

services:
  # 后端服务
  weather-backend:
    # 镜像名
    image: weather-backend:v1.0
    container_name: weather_backend
    restart: always
    expose:
      - "8000"
    environment:
      # 必须与挂载后的文件名一致
      - WEATHER_DATA_PATH=/data/2025-06-01T00_00_00_cn_flatted.nc
    volumes:
      # 左边：宿主机存放数据的真实路径
      # 右边：容器内的固定挂载点
      - ./data:/data

  # 前端服务
  weather-frontend:
    # 镜像名
    image: weather-frontend:v1.0
    container_name: weather_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - weather-backend
```
5. 启动服务: `docker-compose up -d`