# Nginx配置修复指南 - 解决静态资源404问题

## 🔴 当前配置的问题

您的Nginx配置存在以下问题：

1. **`location /_next/static` 位置错误**：应该在 `location /` **之前**
2. **匹配路径不完整**：应该用 `location /_next/` 匹配所有 `/_next/` 开头的路径
3. **缺少必要的proxy headers**
4. **JS/CSS缓存规则干扰**：`location ~ .*\.(js|css)?$` 会干扰Next.js的静态资源

## ✅ 修复步骤

### 方法一：使用完整配置（推荐）

1. 在宝塔面板中：**网站** → **wsxy.dauteenvoice.com** → **设置** → **配置文件**
2. 将整个配置文件替换为 `nginx-config-fix.conf` 文件中的内容
3. 保存并重载配置

### 方法二：手动修改（如果不想替换整个配置）

在您当前的配置中，找到以下部分并修改：

#### 1. 删除或注释掉旧的 `location /_next/static` 配置

找到这段并删除：
```nginx
    # 静态文件缓存（Next.js 生成的静态资源）
    location /_next/static {
        proxy_pass http://127.0.0.1:5288;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
```

#### 2. 在 `location /` **之前**添加新的配置

在 `location / {` 之前添加：

```nginx
    # 重要：Next.js静态资源路径（必须在location /之前）
    # 匹配所有 /_next/ 开头的路径（包括 /_next/static, /_next/webpack等）
    location /_next/ {
        proxy_pass http://127.0.0.1:5288;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
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
```

#### 3. 注释掉JS/CSS缓存规则

找到这段并注释掉：
```nginx
    # 注释掉，因为Next.js已经处理了静态资源缓存
    # location ~ .*\.(js|css)?$
    # {
    #     expires      12h;
    #     error_log /dev/null;
    #     access_log /dev/null;
    # }
```

#### 4. 注释掉PHP和rewrite规则（可选，但推荐）

```nginx
    #PHP-INFO-START  PHP引用配置（Next.js不需要PHP）
    #include enable-php-00.conf;
    #PHP-INFO-END

    #REWRITE-START URL重写规则（Next.js自己处理路由）
    #include /www/server/panel/vhost/rewrite/www.wsxy.dauteenvoice.com.conf;
    #REWRITE-END
```

#### 5. 注释掉404错误页（可选）

```nginx
    #ERROR-PAGE-START  错误页配置
    #error_page 404 /404.html;
    #ERROR-PAGE-END
```

## 📋 配置顺序很重要！

Nginx按照以下顺序匹配location：

1. **精确匹配** `=`
2. **前缀匹配**（最长匹配优先）
3. **正则匹配** `~` `~*`
4. **通用匹配** `/`

所以 `location /_next/` 必须在 `location /` **之前**，否则所有 `/_next/` 的请求都会被 `location /` 先匹配到。

## ✅ 修复后的配置顺序

正确的顺序应该是：

```nginx
# 1. Next.js静态资源（最具体，最先匹配）
location /_next/ {
    ...
}

# 2. API路由
location /api {
    ...
}

# 3. 其他所有请求（最通用，最后匹配）
location / {
    ...
}
```

## 🔍 验证修复

修复后执行：

```bash
# 1. 测试Nginx配置
nginx -t

# 2. 如果测试通过，重载Nginx
systemctl reload nginx
# 或在宝塔面板：网站 → 设置 → 重载配置

# 3. 检查PM2进程
pm2 logs dtwsxy --lines 20

# 4. 查看Nginx错误日志
tail -f /www/wwwroot/dtwsxy/logs/nginx-error.log
```

然后访问网站，打开浏览器开发者工具（F12），检查：
- Network标签页中所有 `/_next/static/` 下的文件应该返回 **200** 状态码
- 不应该再有404错误

## 🚨 如果仍然404

1. **检查PM2进程是否运行**：
   ```bash
   pm2 list
   pm2 logs dtwsxy
   ```

2. **检查端口是否正确**：
   ```bash
   netstat -tlnp | grep 5288
   ```

3. **检查构建文件是否存在**：
   ```bash
   ls -la /www/wwwroot/dtwsxy/.next/static/css/
   ls -la /www/wwwroot/dtwsxy/.next/static/chunks/
   ```

4. **检查Nginx错误日志**：
   ```bash
   tail -50 /www/wwwroot/dtwsxy/logs/nginx-error.log
   ```

5. **清除浏览器缓存**：Ctrl+Shift+R 强制刷新

## 📝 完整配置示例

参考 `nginx-config-fix.conf` 文件，这是完整的、经过测试的配置。
