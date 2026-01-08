# 宝塔部署完整流程 - 稻田蛙声学院

## ⚠️ 紧急修复：静态资源404错误

如果遇到所有CSS/JS文件404错误，按以下步骤修复：

### 第一步：修复Next.js配置

确保 `next.config.mjs` 中**没有** `output: 'standalone'`（这个配置仅用于Docker部署）

```bash
cd /www/wwwroot/dtwsxy
# 检查配置文件
cat next.config.mjs | grep -i standalone
# 如果看到 output: 'standalone'，需要注释掉或删除
```

### 第二步：更新Nginx配置（关键！）

在宝塔面板：**网站** → 您的站点 → **设置** → **配置文件**

**重要**：确保 `location /_next/` 配置在 `location /` **之前**，参考下面的完整配置。

### 第三步：确保依赖已安装

```bash
cd /www/wwwroot/dtwsxy
npm install

# 验证依赖
npm list tailwindcss postcss autoprefixer
# 如果缺失，手动安装：
npm install -D tailwindcss postcss autoprefixer
```

### 第四步：清理并重新构建

```bash
# 删除旧的构建文件
rm -rf .next
rm -rf node_modules/.cache

# 重新构建项目
npm run build

# 验证构建是否成功
ls -la .next/static/css/  # 应该能看到CSS文件
ls -la .next/static/chunks/  # 应该能看到JS文件
```

### 第五步：重启所有服务

```bash
# 重启PM2进程
pm2 restart dtwsxy

# 重载Nginx配置
systemctl reload nginx
# 或在宝塔面板：网站 → 设置 → 重载配置

# 查看日志确认无错误
pm2 logs dtwsxy --lines 50
```

### 第六步：验证修复

1. 访问网站：`https://wsxy.dauteenvoice.com/login`
2. 打开浏览器开发者工具（F12）
3. **Network** 标签页，刷新页面
4. 检查所有 `/_next/static/` 下的文件是否返回 **200** 状态码
5. 如果仍有404，检查Nginx错误日志：
   ```bash
   tail -f /www/wwwlogs/wsxy.dauteenvoice.com.error.log
   ```

---

## 📋 完整部署流程

### 一、服务器环境准备

#### 1.1 安装 Node.js（通过宝塔面板）

1. 登录宝塔面板
2. **软件商店** → **运行环境** → 搜索 **Node.js版本管理器**
3. 安装 Node.js 18.x 或更高版本
4. 验证安装：
   ```bash
   node -v  # 应显示 v18.x.x 或更高
   npm -v   # 应显示 9.x.x 或更高
   ```

#### 1.2 安装 MySQL（通过宝塔面板）

1. **软件商店** → **数据库** → 安装 **MySQL 8.0**
2. 记录数据库 root 密码

#### 1.3 安装 PM2（通过宝塔面板）

1. **软件商店** → **运行环境** → 搜索 **PM2管理器**
2. 安装 PM2 管理器

或通过命令行安装：
```bash
npm install -g pm2
```

---

### 二、项目部署

#### 2.1 通过宝塔面板创建网站

1. **网站** → **添加站点**
2. 域名：`wsxy.dauteenvoice.com`（或您的域名）
3. 根目录：`/www/wwwroot/dtwsxy`
4. PHP版本：**纯静态**（Next.js不需要PHP）

#### 2.2 克隆项目代码

通过宝塔终端或SSH执行：

```bash
cd /www/wwwroot
git clone https://your-repo-url/dtwsxy.git
# 或
git clone git@github.com:username/dtwsxy.git

cd dtwsxy
```

#### 2.3 安装项目依赖

```bash
npm install
```

**重要**：确保以下依赖已安装：
- `tailwindcss@^3.4.0`
- `postcss@^8.4.0`
- `autoprefixer@^10.4.0`

如果缺少，手动安装：
```bash
npm install -D tailwindcss postcss autoprefixer
```

#### 2.4 配置环境变量

创建 `.env.production` 文件：

```bash
cd /www/wwwroot/dtwsxy
nano .env.production
```

内容如下：

```env
# 数据库配置
DATABASE_URL="mysql://用户名:密码@localhost:3306/数据库名"

# JWT密钥（请使用强随机字符串）
JWT_SECRET="your-very-long-random-secret-key-here"

# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://wsxy.dauteenvoice.com
NEXT_PUBLIC_API_URL=https://wsxy.dauteenvoice.com/api
ALLOWED_ORIGINS=https://wsxy.dauteenvoice.com

# 其他配置（根据实际需要）
PORT=5288
```

保存后：
```bash
# 确保.env.production文件权限正确
chmod 600 .env.production
```

#### 2.5 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npx prisma migrate deploy

# （可选）导入初始数据
npm run prisma:seed
```

#### 2.6 构建项目

```bash
# 清理旧的构建文件
rm -rf .next
rm -rf node_modules/.cache

# 构建生产版本
npm run build

# 验证构建结果
ls -la .next/static/css/  # 应该能看到CSS文件
```

**关键检查点**：
- 确认 `.next/static/css/` 目录存在且包含CSS文件
- 检查构建日志是否有错误

---

### 三、PM2 进程管理

#### 3.1 创建 PM2 启动脚本

创建 `ecosystem.config.js` 文件：

```bash
cd /www/wwwroot/dtwsxy
nano ecosystem.config.js
```

内容：

```javascript
module.exports = {
  apps: [{
    name: 'dtwsxy',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 5288',
    cwd: '/www/wwwroot/dtwsxy',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5288
    },
    error_file: '/www/wwwroot/dtwsxy/logs/pm2-error.log',
    out_file: '/www/wwwroot/dtwsxy/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

创建日志目录：
```bash
mkdir -p /www/wwwroot/dtwsxy/logs
```

#### 3.2 启动 PM2 进程

```bash
cd /www/wwwroot/dtwsxy

# 如果进程已存在，先删除
pm2 delete dtwsxy

# 启动新进程
pm2 start ecosystem.config.js

# 或直接启动
pm2 start npm --name "dtwsxy" -- start

# 保存PM2配置（开机自启）
pm2 save
pm2 startup
```

#### 3.3 PM2 常用命令

```bash
# 查看进程状态
pm2 list

# 查看日志
pm2 logs dtwsxy

# 重启进程
pm2 restart dtwsxy

# 停止进程
pm2 stop dtwsxy

# 删除进程
pm2 delete dtwsxy

# 查看详细信息
pm2 info dtwsxy
```

---

### 四、Nginx 反向代理配置

#### 4.1 在宝塔面板配置 Nginx

1. **网站** → 找到您的站点 → **设置**
2. **配置文件** 标签页
3. 替换为以下配置：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name wsxy.dauteenvoice.com;
    
    # 重定向到HTTPS（如果已配置SSL）
    # return 301 https://$server_name$request_uri;
    
    # 重要：Next.js静态资源路径（必须在location /之前）
    location /_next/ {
        proxy_pass http://127.0.0.1:5288;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 静态资源缓存
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API路由
    location /api {
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
    
    # 所有其他请求（包括页面路由）
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
    
    # 日志
    access_log /www/wwwlogs/wsxy.dauteenvoice.com.log;
    error_log /www/wwwlogs/wsxy.dauteenvoice.com.error.log;
}
```

#### 4.2 测试 Nginx 配置

```bash
# 测试配置是否正确
nginx -t

# 如果测试通过，重载Nginx
systemctl reload nginx
# 或在宝塔面板：网站 → 设置 → 重载配置
```

#### 4.3 配置防火墙

在宝塔面板：
1. **安全** → **防火墙**
2. 确保以下端口已开放：
   - **80**（HTTP）
   - **443**（HTTPS，如果使用SSL）
   - **5288**（Next.js应用端口，仅本地访问）

---

### 五、SSL 证书配置（推荐）

#### 5.1 通过宝塔面板申请SSL

1. **网站** → 您的站点 → **设置** → **SSL**
2. 选择 **Let's Encrypt** → **申请**
3. 勾选 **强制HTTPS**

#### 5.2 更新 Nginx 配置支持HTTPS

在SSL配置后，Nginx配置会自动更新，确保包含：

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wsxy.dauteenvoice.com;
    
    ssl_certificate /www/server/panel/vhost/cert/wsxy.dauteenvoice.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/wsxy.dauteenvoice.com/privkey.pem;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 其他配置同HTTP配置...
}
```

---

### 六、验证部署

#### 6.1 检查服务状态

```bash
# 检查PM2进程
pm2 list
pm2 logs dtwsxy --lines 20

# 检查端口是否监听
netstat -tlnp | grep 5288
# 或
ss -tlnp | grep 5288

# 检查Nginx状态
systemctl status nginx
```

#### 6.2 测试访问

1. 访问 `https://wsxy.dauteenvoice.com/login`
2. 打开浏览器开发者工具（F12）
3. **Network** 标签页，检查：
   - CSS文件是否正常加载（`/_next/static/css/`）
   - 状态码应为 200
   - 没有404错误

#### 6.3 检查样式是否正常

在浏览器控制台执行：
```javascript
// 检查CSS是否加载
document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    console.log(link.href, link.sheet ? '已加载' : '未加载');
});
```

---

### 七、常见问题排查

#### 问题1：样式完全丢失 / 静态资源404错误

**错误示例**：
```
796f3fc8d681f1a0.css:1 Failed to load resource: 404
webpack-616e068a201ad621.js:1 Failed to load resource: 404
```

**原因**：
- `next.config.mjs` 中使用了 `output: 'standalone'`（仅用于Docker）
- Nginx配置未正确代理 `/_next/*` 路径
- 静态资源文件未正确构建

**解决步骤**：

1. **修复Next.js配置**（已修复）：
   ```bash
   cd /www/wwwroot/dtwsxy
   # 确保 next.config.mjs 中没有 output: 'standalone'
   ```

2. **检查依赖是否安装**：
   ```bash
   npm list tailwindcss postcss autoprefixer
   # 如果缺失，安装：
   npm install -D tailwindcss postcss autoprefixer
   ```

3. **清理并重新构建**：
   ```bash
   # 删除旧的构建文件
   rm -rf .next
   rm -rf node_modules/.cache
   
   # 重新构建
   npm run build
   
   # 验证构建结果
   ls -la .next/static/css/  # 应该能看到CSS文件
   ls -la .next/static/chunks/  # 应该能看到JS文件
   ```

4. **更新Nginx配置**（关键步骤）：
   - 在宝塔面板：**网站** → 您的站点 → **设置** → **配置文件**
   - 确保 `location /_next/` 配置在 `location /` 之前
   - 参考上面的完整Nginx配置

5. **重启所有服务**：
   ```bash
   # 重启PM2
   pm2 restart dtwsxy
   
   # 重载Nginx
   systemctl reload nginx
   # 或在宝塔面板：网站 → 设置 → 重载配置
   ```

6. **验证修复**：
   - 访问网站，打开浏览器开发者工具（F12）
   - **Network** 标签页，刷新页面
   - 检查 `/_next/static/` 下的文件是否返回200状态码

#### 问题2：CSS文件404

**检查**：
```bash
# 检查文件是否存在
ls -la /www/wwwroot/dtwsxy/.next/static/css/

# 检查PM2进程是否正常运行
pm2 logs dtwsxy | grep -i error

# 检查Nginx错误日志
tail -f /www/wwwlogs/wsxy.dauteenvoice.com.error.log
```

#### 问题3：页面空白或500错误

**检查**：
```bash
# 查看PM2日志
pm2 logs dtwsxy --err

# 检查环境变量
pm2 env dtwsxy

# 检查数据库连接
cd /www/wwwroot/dtwsxy
npx prisma db pull
```

#### 问题4：端口被占用

```bash
# 查找占用5288端口的进程
lsof -i :5288
# 或
netstat -tlnp | grep 5288

# 杀死进程（如果需要）
kill -9 <PID>
```

---

### 八、后续维护

#### 8.1 代码更新流程

```bash
cd /www/wwwroot/dtwsxy

# 拉取最新代码
git pull origin main  # 或 master

# 安装新依赖（如果有）
npm install

# 如果有数据库迁移
npx prisma migrate deploy
npm run prisma:generate

# 重新构建
rm -rf .next node_modules/.cache
npm run build

# 重启服务
pm2 restart dtwsxy
```

#### 8.2 备份策略

**数据库备份**（通过宝塔面板）：
1. **数据库** → 选择数据库 → **备份**
2. 设置自动备份计划

**代码备份**：
```bash
# 创建备份脚本
cd /www/wwwroot/dtwsxy
tar -czf ../backup-$(date +%Y%m%d).tar.gz .
```

#### 8.3 监控和日志

**查看实时日志**：
```bash
# PM2日志
pm2 logs dtwsxy

# Nginx访问日志
tail -f /www/wwwlogs/wsxy.dauteenvoice.com.log

# Nginx错误日志
tail -f /www/wwwlogs/wsxy.dauteenvoice.com.error.log
```

**设置日志轮转**（宝塔面板自动处理）

---

### 九、性能优化建议

1. **启用Gzip压缩**（Nginx配置中已包含）
2. **配置CDN**（可选，用于静态资源加速）
3. **数据库索引优化**
4. **启用Redis缓存**（如需要）

---

## 📞 技术支持

如遇到问题，请检查：
1. PM2进程日志：`pm2 logs dtwsxy`
2. Nginx错误日志：`/www/wwwlogs/wsxy.dauteenvoice.com.error.log`
3. 浏览器控制台错误信息
4. 网络请求状态（F12 → Network）

---

**最后更新**：2025-01-07
