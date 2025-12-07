FROM python:3.10-slim

# 安装基础库 (NetCDF需要)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnetcdf-dev libhdf5-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源码
COPY app/ ./app/

# 启动命令
# 注意：这里不需要 Nginx 了，直接启动 uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]