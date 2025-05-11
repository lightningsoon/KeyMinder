FROM python:3.11-slim

WORKDIR /app

# 使用阿里云镜像源安装系统依赖
RUN echo "deb http://mirrors.aliyun.com/debian/ bookworm main non-free contrib" > /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian/ bookworm-updates main non-free contrib" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security bookworm-security main non-free contrib" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 使用阿里云镜像源安装 Python 依赖
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8009

# 使用 Gunicorn 启动应用
CMD ["gunicorn", "--bind", "0.0.0.0:8009", "--workers", "4", "--timeout", "120", "app:create_app()"] 