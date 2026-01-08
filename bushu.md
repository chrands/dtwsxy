# 宝塔 Ubuntu 服务器部署指南

本文档详细说明如何将"稻田蛙声学院" Next.js 项目通过 Git 迁移到宝塔 Ubuntu 服务器。

## 目录

- [准备工作](#准备工作)
- [服务器环境配置](#服务器环境配置)
- [项目部署步骤](#项目部署步骤)
- [构建和启动](#构建和启动)
- [Nginx 反向代理配置](#nginx-反向代理配置)
- [SSL 证书配置（可选）](#ssl-证书配置可选)
- [后续维护](#后续维护)
- [常见问题排查](#常见问题排查)

---

## 准备工作

### 1. Git 仓库准备

确保项目已推送到 Git 仓库（GitHub、GitLab、Gitee 等），并记录仓库地址：

```bash
# 示例仓库地址格式
https://github.com/username/dtwsxy.git
# 或
git@github.com:username/dtwsxy.git
```

### 2. 服务器环境要求

- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **内存**: 至少 2GB RAM（推荐 4GB+）
- **磁盘空间**: 至少 10GB 可用空间
- **网络**: 已配置公网 IP 或域名

### 3. 宝塔面板安装确认

确保服务器已安装宝塔面板（BT Panel），如未安装，请访问 [宝塔官网](https://www.bt.cn/) 获取安装命令。

---

## 服务器环境配置

### 1. 登录服务器

使用 SSH 工具（如 PuTTY、Xshell、Terminal）连接到服务器：

```bash
ssh root@your-server-ip
```

### 2. 安装 Node.js（版本 >= 18.0.0）

#### 方法一：通过宝塔面板安装（推荐）

1. 登录宝塔面板
2. 进入 **软件商店** → **运行环境**
3. 搜索并安装 **Node.js 版本管理器**
4. 在 **Node.js 版本管理器** 中安装 Node.js 18.x 或更高版本

#### 方法二：通过命令行安装

```bash
# 使用 NodeSource 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x 或更高
npm -v   # 应显示 9.x.x 或更高
```

### 3. 安装 MySQL 数据库

#### 通过宝塔面板安装（推荐）

1. 进入 **软件商店** → **数据库**
2. 安装 **MySQL 5.7** 或 **MySQL 8.0**
3. 记录数据库 root 密码

#### 通过命令行安装

```bash
# 安装 MySQL
sudo apt update
sudo apt install mysql-server -y

# 安全配置（可选）
sudo mysql_secure_installation
```

### 4. 创建项目数据库

#### 通过宝塔面板创建

1. 进入 **数据库** → **添加数据库**
2. 数据库名：`dauteenvoice_college`（或自定义）
3. 用户名：`dauteenvoice_user`（或自定义）
4. 密码：设置强密码并记录
5. 访问权限：本地服务器

#### 通过命令行创建

```bash
# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE dauteenvoice_college CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dauteenvoice_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON dauteenvoice_college.* TO 'dauteenvoice_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. 安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v

# 设置 PM2 开机自启
pm2 startup
# 执行上一条命令输出的命令（通常类似：sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root）
```

### 6. 确认 Git 已安装

```bash
# 检查 Git 版本
git --version

# 如未安装，执行：
sudo apt install git -y
```

---

## 项目部署步骤

### 1. 创建项目目录

```bash
# 创建网站根目录（建议放在 /www/wwwroot/ 下，与宝塔默认目录一致）
sudo mkdir -p /www/wwwroot/dtwsxy
sudo chown -R $USER:$USER /www/wwwroot/dtwsxy
cd /www/wwwroot/dtwsxy
```

### 2. 从 Git 仓库克隆项目

```bash
# 使用 HTTPS 方式克隆（推荐）
git clone https://github.com/chrands/dtwsxy.git

# 或使用 SSH 方式（需要配置 SSH 密钥）
# git clone git@github.com:username/dtwsxy.git .

# 如果仓库是私有仓库，需要配置认证
# 对于 HTTPS：使用用户名和访问令牌
# 对于 SSH：需要配置 SSH 密钥到服务器
```

### 3. 安装项目依赖

```bash
# 进入项目目录（如果不在的话）
cd /www/wwwroot/dtwsxy

# 安装依赖
npm install

# 如果安装速度慢，可以使用国内镜像
# npm install --registry=https://registry.npmmirror.com
```

### 4. 配置环境变量

```bash
# 创建 .env 文件
nano .env
```

在 `.env` 文件中添加以下配置：

```env
# 应用环境
NODE_ENV=production

# 应用 URL（替换为您的域名或 IP）
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# 数据库连接（替换为实际数据库信息）
DATABASE_URL="mysql://dauteenvoice_user:your_strong_password@localhost:3306/dauteenvoice_college?connection_limit=10"

# JWT 密钥（必须修改为强随机字符串，建议使用 openssl rand -base64 32 生成）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT 过期时间
JWT_EXPIRES_IN=7d

# 允许的跨域来源（生产环境使用具体域名）
ALLOWED_ORIGINS=https://your-domain.com

# 日志级别
LOG_LEVEL=info

# 分页配置（可选）
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

**重要提示**：
- `JWT_SECRET` 必须使用强随机字符串，可以使用以下命令生成：
  ```bash
  openssl rand -base64 32
  ```
- `DATABASE_URL` 格式：`mysql://用户名:密码@主机:端口/数据库名?参数`
- 保存文件：按 `Ctrl + O`，然后按 `Enter`，最后按 `Ctrl + X` 退出

### 5. 生成 Prisma 客户端

```bash
# 生成 Prisma 客户端
npm run prisma:generate
```

### 6. 数据库迁移和初始化

```bash
# 执行数据库迁移（推荐生产环境使用）
npx prisma migrate deploy

# 或者使用 db push（开发环境，不推荐生产环境）
# npm run db:push

# 可选：导入种子数据（如果需要初始数据）
# npm run prisma:seed
```

### 7. 验证数据库连接

```bash
# 测试数据库连接
npx prisma studio
# 如果能够打开 Prisma Studio，说明数据库连接正常
# 按 Ctrl+C 退出
```

---

## 构建和启动

### 1. 生产环境构建

```bash
# 确保在项目根目录


# 构建生产版本


# 构建成功后，会生成 .next 目录
```

### 2. 创建 PM2 配置文件

```bash
# 创建 PM2 配置文件
nano ecosystem.config.js
```

添加以下内容：

```javascript
module.exports = {
  apps: [{
    name: 'dtwsxy',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/dtwsxy',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5288
    },
    error_file: '/www/wwwroot/dtwsxy/logs/pm2-error.log',
    out_file: '/www/wwwroot/dtwsxy/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

保存文件后，创建日志目录：

```bash
mkdir -p /www/wwwroot/dtwsxy/logs
```

### 3. 启动应用

```bash
# 使用 PM2 启动应用
pm2 start ecosystem.config.js

# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs dtwsxy

# 查看实时日志
pm2 logs dtwsxy --lines 50
```

### 4. 验证服务运行

```bash
# 检查端口是否监听
netstat -tlnp | grep 5288
# 或
ss -tlnp | grep 5288

# 测试本地访问
curl http://localhost:5288
# 应该返回 HTML 内容或 200 状态码
```

### 5. 设置 PM2 开机自启

```bash
# 保存当前 PM2 进程列表
pm2 save

# 如果之前没有设置开机自启，执行：
pm2 startup
# 然后执行输出的命令
```

---

## Nginx 反向代理配置

### 1. 在宝塔面板中创建网站

1. 登录宝塔面板
2. 进入 **网站** → **添加站点**
3. 填写信息：
   - **域名**：`your-domain.com`（或使用 IP 地址）
   - **备注**：稻田蛙声学院
   - **根目录**：`/www/wwwroot/dtwsxy`（注意：这里指向项目根目录，但实际静态文件在 `.next` 目录）
   - **FTP**：不创建
   - **数据库**：不创建（已单独创建）
   - **PHP 版本**：纯静态（因为 Next.js 是 Node.js 应用）

### 2. 配置 Nginx 反向代理

1. 在宝塔面板中，点击网站右侧的 **设置**
2. 进入 **配置文件** 标签
3. 将配置替换为以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    # 日志配置
    access_log /www/wwwroot/dtwsxy/logs/nginx-access.log;
    error_log /www/wwwroot/dtwsxy/logs/nginx-error.log;

    # 客户端最大上传大小
    client_max_body_size 50M;

    # 代理到 Next.js 应用
    location / {
        proxy_pass http://127.0.0.1:5288;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存（Next.js 生成的静态资源）
    location /_next/static {
        proxy_pass http://127.0.0.1:5288;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

4. 点击 **保存**

### 3. 测试 Nginx 配置

```bash
# 测试 Nginx 配置是否正确
sudo nginx -t

# 如果测试通过，重载 Nginx
sudo systemctl reload nginx
# 或通过宝塔面板：网站 → 设置 → 重载配置
```

### 4. 配置防火墙

#### 通过宝塔面板配置

1. 进入 **安全** → **防火墙**
2. 确保以下端口已开放：
   - **80**（HTTP）
   - **443**（HTTPS，如果使用 SSL）
   - **22**（SSH）
3. **不要开放 5288 端口**（仅本地访问）

#### 通过命令行配置

```bash
# Ubuntu 使用 ufw
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 5. 验证网站访问

在浏览器中访问：
- `http://your-domain.com` 或 `http://your-server-ip`

应该能看到网站首页。

---

## SSL 证书配置（可选）

### 1. 使用宝塔面板申请免费 SSL

1. 在宝塔面板中，进入网站 **设置** → **SSL**
2. 选择 **Let's Encrypt** 免费证书
3. 填写信息：
   - **域名**：`your-domain.com`
   - **邮箱**：您的邮箱地址
4. 点击 **申请**
5. 申请成功后，开启 **强制 HTTPS**

### 2. 自动续期配置

宝塔面板会自动处理 Let's Encrypt 证书的续期，无需手动操作。

### 3. 更新 Nginx 配置（HTTPS）

如果使用 SSL，Nginx 配置会自动更新。如果需要手动调整，确保包含以下内容：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /www/server/panel/vhost/cert/your-domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your-domain.com/privkey.pem;
    
    # SSL 配置优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... 其他配置同 HTTP 配置 ...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. 更新环境变量

如果启用了 HTTPS，需要更新 `.env` 文件：

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
ALLOWED_ORIGINS=https://your-domain.com
```

然后重启应用：

```bash
pm2 restart dtwsxy
```

---

## 后续维护

### 1. 代码更新流程

```bash
# 进入项目目录
cd /www/wwwroot/dtwsxy

# 拉取最新代码
git pull origin main  # 或 master，根据您的分支名

# 安装新依赖（如果有）
npm install

# 如果有数据库迁移
npx prisma migrate deploy
npm run prisma:generate

# 重新构建
npm run build

# 重启应用
pm2 restart dtwsxy

# 查看日志确认无错误
pm2 logs dtwsxy --lines 50
```

### 2. 查看日志

#### PM2 日志

```bash
# 查看实时日志
pm2 logs dtwsxy

# 查看最近 100 行日志
pm2 logs dtwsxy --lines 100

# 清空日志
pm2 flush dtwsxy
```

#### Nginx 日志

```bash
# 访问日志
tail -f /www/wwwroot/dtwsxy/logs/nginx-access.log

# 错误日志
tail -f /www/wwwroot/dtwsxy/logs/nginx-error.log
```

#### 应用日志

应用日志位置：
- PM2 输出日志：`/www/wwwroot/dtwsxy/logs/pm2-out.log`
- PM2 错误日志：`/www/wwwroot/dtwsxy/logs/pm2-error.log`

### 3. PM2 常用命令

```bash
# 查看所有进程
pm2 list

# 查看进程详情
pm2 show dtwsxy

# 重启应用
pm2 restart dtwsxy

# 停止应用
pm2 stop dtwsxy

# 删除应用（从 PM2 列表中移除）
pm2 delete dtwsxy

# 查看资源使用情况
pm2 monit

# 保存当前进程列表
pm2 save
```

### 4. 数据库备份

#### 通过宝塔面板备份

1. 进入 **数据库** → 选择数据库 → **备份**
2. 可以设置自动备份计划

#### 通过命令行备份

```bash
# 创建备份目录
mkdir -p /www/backup/database

# 备份数据库
mysqldump -u dauteenvoice_user -p dauteenvoice_college > /www/backup/database/dauteenvoice_college_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
# mysql -u dauteenvoice_user -p dauteenvoice_college < /www/backup/database/dauteenvoice_college_20240101_120000.sql
```

### 5. 性能监控

```bash
# 查看系统资源使用
htop
# 或
top

# 查看 Node.js 进程资源使用
pm2 monit

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 常见问题排查

### 1. 应用无法启动

**问题**：PM2 显示应用状态为 `errored` 或 `stopped`

**排查步骤**：

```bash
# 查看详细错误日志
pm2 logs dtwsxy --err

# 检查环境变量是否正确
cat .env

# 检查端口是否被占用
netstat -tlnp | grep 5288

# 手动测试启动
cd /www/wwwroot/dtwsxy
npm start
```

**常见原因**：
- 环境变量配置错误（特别是 `DATABASE_URL` 和 `JWT_SECRET`）
- 端口 5288 已被占用
- 数据库连接失败
- Node.js 版本不兼容

### 2. 数据库连接失败

**问题**：应用启动后无法连接数据库

**排查步骤**：

```bash
# 测试数据库连接
mysql -u dauteenvoice_user -p -h localhost dauteenvoice_college

# 检查数据库服务状态
sudo systemctl status mysql

# 检查 DATABASE_URL 格式
echo $DATABASE_URL
```

**解决方案**：
- 确认数据库用户名、密码、数据库名正确
- 确认数据库服务正在运行
- 检查 `DATABASE_URL` 格式是否正确
- 确认数据库用户有足够权限

### 3. 网站无法访问

**问题**：浏览器无法访问网站

**排查步骤**：

```bash
# 检查 Nginx 服务状态
sudo systemctl status nginx

# 检查 Nginx 配置
sudo nginx -t

# 检查应用是否运行
pm2 status

# 检查端口监听
netstat -tlnp | grep 5288

# 检查防火墙
sudo ufw status
```

**解决方案**：
- 确认 Nginx 服务正在运行
- 确认应用正在运行（PM2 status）
- 确认防火墙规则正确
- 检查 Nginx 配置文件语法

### 4. 静态资源加载失败

**问题**：页面可以访问，但 CSS、JS 等静态资源无法加载

**解决方案**：
- 检查 `.next` 目录是否存在且包含构建文件
- 确认 Nginx 配置中的静态文件路径正确
- 检查文件权限：`chmod -R 755 /www/wwwroot/dtwsxy/.next`

### 5. 内存不足

**问题**：应用频繁重启或服务器响应缓慢

**排查步骤**：

```bash
# 查看内存使用
free -h

# 查看 PM2 内存使用
pm2 monit
```

**解决方案**：
- 增加服务器内存
- 调整 PM2 的 `max_memory_restart` 参数
- 优化应用代码，减少内存占用

### 6. 构建失败

**问题**：`npm run build` 执行失败

**排查步骤**：

```bash
# 查看详细错误信息
npm run build --verbose

# 检查 Node.js 版本
node -v  # 应该是 18.x 或更高

# 清理缓存重新安装
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

**常见原因**：
- Node.js 版本过低
- 依赖安装不完整
- 环境变量缺失
- 磁盘空间不足

### 7. Git 拉取失败

**问题**：`git pull` 时提示认证失败

**解决方案**：

**HTTPS 方式**：
```bash
# 使用访问令牌（Token）代替密码
git config --global credential.helper store
# 然后再次 pull，输入用户名和 token
```

**SSH 方式**：
```bash
# 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_rsa.pub

# 将公钥添加到 Git 仓库的 SSH Keys 设置中
```

### 8. Prisma 迁移失败

**问题**：执行 `prisma migrate deploy` 失败

**排查步骤**：

```bash
# 检查数据库连接
npx prisma db pull

# 查看迁移状态
npx prisma migrate status

# 检查 schema.prisma 文件
cat prisma/schema.prisma
```

**解决方案**：
- 确认数据库连接字符串正确
- 确认数据库用户有足够权限
- 检查是否有未应用的迁移
- 必要时手动修复数据库结构

---

## 快速参考命令

### 日常维护命令

```bash
# 进入项目目录
cd /www/wwwroot/dtwsxy

# 更新代码并重启
git pull && npm install && npm run build && pm2 restart dtwsxy

# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs dtwsxy

# 重启应用
pm2 restart dtwsxy

# 重载 Nginx
sudo systemctl reload nginx
```

### 紧急情况处理

```bash
# 快速重启所有服务
pm2 restart all && sudo systemctl restart nginx

# 查看系统资源
htop

# 查看磁盘空间
df -h

# 查看最近错误
pm2 logs dtwsxy --err --lines 50
```

---

## 安全建议

1. **定期更新系统和软件**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **使用强密码**
   - 数据库密码
   - JWT_SECRET
   - 服务器 root 密码

3. **配置防火墙**
   - 只开放必要端口（80, 443, 22）
   - 不要开放应用端口（5288）到公网

4. **定期备份**
   - 数据库备份
   - 代码备份
   - 配置文件备份

5. **监控日志**
   - 定期检查错误日志
   - 关注异常访问

6. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 定期更新 SSL 证书

---

## 技术支持

如遇到问题，请检查：

1. 本文档的 [常见问题排查](#常见问题排查) 部分
2. 项目 README.md 文件
3. Next.js 官方文档：https://nextjs.org/docs
4. Prisma 官方文档：https://www.prisma.io/docs
5. PM2 官方文档：https://pm2.keymetrics.io/docs/

---

**文档版本**: 1.0  
**最后更新**: 2024年1月  
**适用项目**: 稻田蛙声学院 (Dauteenvoice College)
