# AI助手交接文档 - 静态资源404问题排查

## 📋 问题概述

**问题描述**：Next.js应用在宝塔服务器上部署后，所有静态资源（CSS、JS文件）返回404错误。

**错误信息**：
```
GET https://wsxy.dauteenvoice.com/_next/static/css/796f3fc8d681f1a0.css net::ERR_ABORTED 404
GET https://wsxy.dauteenvoice.com/_next/static/chunks/webpack-616e068a201ad621.js net::ERR_ABORTED 404
```

**应用信息**：
- 域名：`wsxy.dauteenvoice.com`
- 项目路径：`/www/wwwroot/dtwsxy`
- PM2进程名：`dtwsxy`
- 运行端口：`5288`
- 框架：Next.js 14.2.0

---

## 🔍 需要检查的关键点

### 1. 检查PM2进程状态

```bash
# 查看进程列表
pm2 list

# 查看进程详细信息
pm2 info dtwsxy

# 查看实时日志
pm2 logs dtwsxy --lines 50

# 检查进程是否在运行
pm2 status dtwsxy
```

**预期结果**：进程状态应为 `online`，端口5288应该被监听。

---

### 2. 检查构建文件是否存在

```bash
cd /www/wwwroot/dtwsxy

# 检查.next目录是否存在
ls -la .next/

# 检查CSS文件
ls -la .next/static/css/

# 检查JS文件
ls -la .next/static/chunks/

# 检查构建时间
stat .next/static/css/ | grep Modify
```

**预期结果**：
- `.next/` 目录应该存在
- `.next/static/css/` 应该包含CSS文件
- `.next/static/chunks/` 应该包含JS文件
- 文件应该是最近构建的

---

### 3. 检查Next.js配置

```bash
cd /www/wwwroot/dtwsxy

# 查看next.config.mjs
cat next.config.mjs

# 检查是否有 output: 'standalone'（这个会导致问题）
grep -i "standalone" next.config.mjs
```

**预期结果**：
- 不应该有 `output: 'standalone'`（除非使用Docker部署）
- 配置文件应该存在且格式正确

---

### 4. 检查依赖是否安装

```bash
cd /www/wwwroot/dtwsxy

# 检查关键依赖
npm list tailwindcss postcss autoprefixer

# 如果缺失，查看package.json
cat package.json | grep -A 5 "devDependencies"
```

**预期结果**：
- `tailwindcss`、`postcss`、`autoprefixer` 应该已安装
- 版本应该符合要求

---

### 5. 检查Nginx配置（最重要！）

```bash
# 查看Nginx配置文件
cat /www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf

# 或者通过宝塔面板查看：
# 网站 → wsxy.dauteenvoice.com → 设置 → 配置文件
```

**关键检查点**：

1. **`location /_next/` 必须在 `location /` 之前**
   ```nginx
   # 正确顺序：
   location /_next/ {
       ...
   }
   location / {
       ...
   }
   ```

2. **应该使用 `location /_next/` 而不是 `location /_next/static`**
   ```nginx
   # 正确：
   location /_next/ {
       proxy_pass http://127.0.0.1:5288;
       ...
   }
   
   # 错误：
   location /_next/static {
       ...
   }
   ```

3. **检查是否有JS/CSS缓存规则干扰**
   ```nginx
   # 应该注释掉或删除：
   # location ~ .*\.(js|css)?$ {
   #     expires 12h;
   # }
   ```

4. **检查proxy_pass是否正确**
   ```nginx
   location /_next/ {
       proxy_pass http://127.0.0.1:5288;  # 端口应该是5288
       proxy_set_header Host $host;
       ...
   }
   ```

---

### 6. 检查端口监听

```bash
# 检查5288端口是否被监听
netstat -tlnp | grep 5288
# 或
ss -tlnp | grep 5288
# 或
lsof -i :5288
```

**预期结果**：应该看到Node.js进程在监听5288端口。

---

### 7. 检查Nginx错误日志

```bash
# 查看Nginx错误日志
tail -50 /www/wwwroot/dtwsxy/logs/nginx-error.log

# 或者宝塔默认日志位置
tail -50 /www/wwwlogs/wsxy.dauteenvoice.com.error.log

# 实时监控
tail -f /www/wwwroot/dtwsxy/logs/nginx-error.log
```

**查找关键词**：
- `404`
- `upstream`
- `connect() failed`
- `Connection refused`

---

### 8. 测试静态资源访问

```bash
# 在服务器上测试本地访问
curl -I http://127.0.0.1:5288/_next/static/css/

# 测试具体文件（需要先找到实际文件名）
cd /www/wwwroot/dtwsxy
CSS_FILE=$(ls .next/static/css/*.css | head -1 | xargs basename)
curl -I http://127.0.0.1:5288/_next/static/css/$CSS_FILE

# 测试通过Nginx访问
curl -I https://wsxy.dauteenvoice.com/_next/static/css/$CSS_FILE
```

**预期结果**：
- 本地访问应该返回200
- 通过Nginx访问也应该返回200

---

## 🔧 常见问题及修复方法

### 问题1：构建文件不存在或过时

**症状**：`.next/static/` 目录为空或文件很旧

**修复**：
```bash
cd /www/wwwroot/dtwsxy

# 清理旧文件
rm -rf .next
rm -rf node_modules/.cache

# 重新构建
npm run build

# 验证
ls -la .next/static/css/
ls -la .next/static/chunks/
```

---

### 问题2：Nginx配置错误

**症状**：Nginx日志显示404或upstream错误

**修复步骤**：

1. **备份当前配置**：
   ```bash
   cp /www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf \
      /www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf.backup
   ```

2. **查看修复后的配置**：
   ```bash
   # 在项目目录中
   cd /www/wwwroot/dtwsxy
   cat nginx-config-fix.conf
   ```

3. **在宝塔面板中更新配置**：
   - 网站 → wsxy.dauteenvoice.com → 设置 → 配置文件
   - 参考 `nginx-config-fix.conf` 或 `NGINX_FIX.md` 进行修改
   - **关键**：确保 `location /_next/` 在 `location /` 之前

4. **测试并重载**：
   ```bash
   nginx -t
   systemctl reload nginx
   ```

---

### 问题3：PM2进程未运行或崩溃

**症状**：`pm2 list` 显示进程状态不是 `online`

**修复**：
```bash
cd /www/wwwroot/dtwsxy

# 查看日志找出问题
pm2 logs dtwsxy --err --lines 100

# 重启进程
pm2 restart dtwsxy

# 如果重启失败，删除后重新启动
pm2 delete dtwsxy
pm2 start npm --name "dtwsxy" -- start

# 或使用ecosystem配置
pm2 start ecosystem.config.js
```

---

### 问题4：依赖缺失

**症状**：构建失败或运行时错误

**修复**：
```bash
cd /www/wwwroot/dtwsxy

# 安装依赖
npm install

# 特别检查Tailwind相关依赖
npm install -D tailwindcss postcss autoprefixer

# 验证
npm list tailwindcss postcss autoprefixer
```

---

### 问题5：端口被占用

**症状**：PM2启动失败，端口已被占用

**修复**：
```bash
# 查找占用端口的进程
lsof -i :5288
# 或
netstat -tlnp | grep 5288

# 杀死占用进程（谨慎操作）
kill -9 <PID>

# 或修改端口（需要同时修改Nginx配置）
# 编辑 package.json 中的 start 脚本
```

---

## 📝 完整修复流程（如果问题仍然存在）

```bash
# 1. 进入项目目录
cd /www/wwwroot/dtwsxy

# 2. 检查并安装依赖
npm install
npm list tailwindcss postcss autoprefixer || npm install -D tailwindcss postcss autoprefixer

# 3. 检查Next.js配置
cat next.config.mjs | grep -i standalone
# 如果有 output: 'standalone'，需要注释掉（除非使用Docker）

# 4. 清理并重新构建
rm -rf .next node_modules/.cache
npm run build

# 5. 验证构建结果
ls -la .next/static/css/
ls -la .next/static/chunks/

# 6. 检查PM2进程
pm2 list
pm2 logs dtwsxy --lines 20

# 7. 如果进程未运行，启动它
pm2 restart dtwsxy || pm2 start npm --name "dtwsxy" -- start

# 8. 检查Nginx配置
nginx -t
# 如果配置有问题，参考 nginx-config-fix.conf 修复

# 9. 重载Nginx
systemctl reload nginx

# 10. 测试访问
curl -I http://127.0.0.1:5288/_next/static/css/
```

---

## 🎯 快速诊断命令

运行以下命令快速获取所有关键信息：

```bash
#!/bin/bash
echo "=== PM2进程状态 ==="
pm2 list | grep dtwsxy

echo -e "\n=== 端口监听 ==="
netstat -tlnp | grep 5288

echo -e "\n=== 构建文件检查 ==="
cd /www/wwwroot/dtwsxy
echo "CSS文件数量: $(ls -1 .next/static/css/*.css 2>/dev/null | wc -l)"
echo "JS文件数量: $(ls -1 .next/static/chunks/*.js 2>/dev/null | wc -l)"

echo -e "\n=== Next.js配置检查 ==="
grep -i "standalone" next.config.mjs && echo "⚠️  发现standalone配置" || echo "✅ 无standalone配置"

echo -e "\n=== 依赖检查 ==="
npm list tailwindcss postcss autoprefixer 2>/dev/null | grep -E "(tailwindcss|postcss|autoprefixer)" || echo "⚠️  依赖缺失"

echo -e "\n=== Nginx配置检查 ==="
if grep -q "location /_next/" /www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf; then
    echo "✅ 找到 location /_next/ 配置"
    # 检查顺序
    NEXT_LINE=$(grep -n "location /_next/" /www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf | head -1 | cut -d: -f1)
    ROOT_LINE=$(grep -n "location / {" /www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf | head -1 | cut -d: -f1)
    if [ "$NEXT_LINE" -lt "$ROOT_LINE" ]; then
        echo "✅ location /_next/ 在 location / 之前（正确）"
    else
        echo "❌ location /_next/ 在 location / 之后（错误！）"
    fi
else
    echo "❌ 未找到 location /_next/ 配置"
fi

echo -e "\n=== 最近Nginx错误 ==="
tail -10 /www/wwwroot/dtwsxy/logs/nginx-error.log 2>/dev/null || tail -10 /www/wwwlogs/wsxy.dauteenvoice.com.error.log 2>/dev/null
```

---

## 📚 相关文件位置

- **项目目录**：`/www/wwwroot/dtwsxy`
- **Nginx配置**：`/www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf`
- **Nginx日志**：`/www/wwwroot/dtwsxy/logs/nginx-error.log` 或 `/www/wwwlogs/wsxy.dauteenvoice.com.error.log`
- **PM2日志**：`pm2 logs dtwsxy` 或 `/www/wwwroot/dtwsxy/logs/pm2-*.log`
- **修复配置参考**：`/www/wwwroot/dtwsxy/nginx-config-fix.conf`
- **修复指南**：`/www/wwwroot/dtwsxy/NGINX_FIX.md`

---

## ✅ 验证修复成功的标准

修复后，以下检查应该全部通过：

1. ✅ `pm2 list` 显示 `dtwsxy` 状态为 `online`
2. ✅ `netstat -tlnp | grep 5288` 显示端口被监听
3. ✅ `ls -la .next/static/css/` 显示CSS文件存在
4. ✅ `ls -la .next/static/chunks/` 显示JS文件存在
5. ✅ `curl -I http://127.0.0.1:5288/_next/static/css/` 返回200
6. ✅ `curl -I https://wsxy.dauteenvoice.com/_next/static/css/` 返回200
7. ✅ 浏览器访问网站，开发者工具Network标签页中所有 `/_next/static/` 文件返回200
8. ✅ 页面样式正常显示

---

## 🆘 如果仍然无法解决

1. **收集完整日志**：
   ```bash
   # PM2日志
   pm2 logs dtwsxy --lines 100 > /tmp/pm2-logs.txt
   
   # Nginx错误日志
   tail -100 /www/wwwroot/dtwsxy/logs/nginx-error.log > /tmp/nginx-errors.txt
   
   # 系统信息
   node -v > /tmp/system-info.txt
   npm -v >> /tmp/system-info.txt
   pm2 -v >> /tmp/system-info.txt
   nginx -v >> /tmp/system-info.txt
   ```

2. **检查文件权限**：
   ```bash
   ls -la /www/wwwroot/dtwsxy/.next/
   # 确保nginx用户有读取权限
   ```

3. **检查防火墙**：
   ```bash
   # 确保5288端口在本地可访问（不需要对外开放）
   ```

---

**最后更新**：2025-01-07  
**问题状态**：待解决 - 静态资源404错误
