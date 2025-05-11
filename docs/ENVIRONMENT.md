# 环境配置说明

## 环境配置文件

项目支持多环境配置，主要通过 `config.{env}.env` 文件来管理不同环境的配置。

### 配置文件说明

- `config.dev.env`: 开发环境配置
- `config.prod.env`: 生产环境配置

配置文件包含以下配置项：

```bash
# 服务器配置
SERVER_HOST=47.121.24.132  # 服务器地址
BACKEND_PORT=8009          # 后端服务端口
FRONTEND_PORT=8010         # 前端服务端口

# 数据库配置
DATABASE_URL=sqlite:///data/dev.db

# JWT配置
JWT_SECRET=your-secret-key-change-this-in-production

# 环境配置
NODE_ENV=production        # 可选值: development, production
FLASK_ENV=production       # 可选值: development, production
```

## 环境切换

### 1. 开发环境

```bash
# 方式1：直接指定环境变量
ENV=dev docker compose up

# 方式2：先设置环境变量，再启动
export ENV=dev
docker compose up
```

### 2. 生产环境

```bash
# 方式1：直接指定环境变量
ENV=prod docker compose up

# 方式2：先设置环境变量，再启动
export ENV=prod
docker compose up
```

### 3. 默认环境（生产环境）

```bash
docker compose up
```

## 注意事项

1. 首次部署时，需要复制配置文件：
   ```bash
   cp config.env config.dev.env  # 开发环境
   cp config.env config.prod.env # 生产环境
   ```

2. 修改配置后需要重启服务：
   ```bash
   docker compose down
   ENV=dev docker compose up  # 开发环境
   # 或
   ENV=prod docker compose up # 生产环境
   ```

3. 生产环境部署时，请确保：
   - 修改 `JWT_SECRET` 为安全的随机字符串
   - 设置 `NODE_ENV` 和 `FLASK_ENV` 为 `production`
   - 配置正确的服务器地址 `SERVER_HOST` 