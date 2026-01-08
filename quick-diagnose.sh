#!/bin/bash

# 快速诊断脚本 - 静态资源404问题
# 使用方法：bash quick-diagnose.sh

echo "=========================================="
echo "静态资源404问题 - 快速诊断"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/www/wwwroot/dtwsxy"
PM2_NAME="dtwsxy"
PORT="5288"

# 1. PM2进程状态
echo "【1】PM2进程状态"
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list | grep "$PM2_NAME" | awk '{print $10}')
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "${GREEN}✅ PM2进程状态: $PM2_STATUS${NC}"
    else
        echo -e "${RED}❌ PM2进程状态: $PM2_STATUS (应该是 online)${NC}"
    fi
    pm2 list | grep "$PM2_NAME"
else
    echo -e "${RED}❌ PM2未安装${NC}"
fi
echo ""

# 2. 端口监听
echo "【2】端口监听检查"
echo "----------------------------------------"
if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo -e "${GREEN}✅ 端口 $PORT 正在监听${NC}"
    netstat -tlnp | grep ":$PORT "
else
    echo -e "${RED}❌ 端口 $PORT 未监听${NC}"
fi
echo ""

# 3. 构建文件检查
echo "【3】构建文件检查"
echo "----------------------------------------"
if [ -d "$PROJECT_DIR/.next" ]; then
    echo -e "${GREEN}✅ .next 目录存在${NC}"
    
    if [ -d "$PROJECT_DIR/.next/static/css" ]; then
        CSS_COUNT=$(ls -1 "$PROJECT_DIR/.next/static/css"/*.css 2>/dev/null | wc -l)
        if [ "$CSS_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ CSS文件数量: $CSS_COUNT${NC}"
            ls -lh "$PROJECT_DIR/.next/static/css"/*.css 2>/dev/null | head -3
        else
            echo -e "${RED}❌ CSS文件不存在${NC}"
        fi
    else
        echo -e "${RED}❌ .next/static/css 目录不存在${NC}"
    fi
    
    if [ -d "$PROJECT_DIR/.next/static/chunks" ]; then
        JS_COUNT=$(ls -1 "$PROJECT_DIR/.next/static/chunks"/*.js 2>/dev/null | wc -l)
        if [ "$JS_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ JS文件数量: $JS_COUNT${NC}"
        else
            echo -e "${RED}❌ JS文件不存在${NC}"
        fi
    else
        echo -e "${RED}❌ .next/static/chunks 目录不存在${NC}"
    fi
else
    echo -e "${RED}❌ .next 目录不存在（需要重新构建）${NC}"
fi
echo ""

# 4. Next.js配置检查
echo "【4】Next.js配置检查"
echo "----------------------------------------"
if [ -f "$PROJECT_DIR/next.config.mjs" ]; then
    if grep -qi "output.*standalone" "$PROJECT_DIR/next.config.mjs"; then
        echo -e "${YELLOW}⚠️  发现 output: 'standalone' 配置（可能导致问题）${NC}"
        grep -i "standalone" "$PROJECT_DIR/next.config.mjs"
    else
        echo -e "${GREEN}✅ 无 standalone 配置${NC}"
    fi
else
    echo -e "${RED}❌ next.config.mjs 文件不存在${NC}"
fi
echo ""

# 5. 依赖检查
echo "【5】依赖检查"
echo "----------------------------------------"
cd "$PROJECT_DIR" 2>/dev/null || { echo -e "${RED}❌ 无法进入项目目录${NC}"; exit 1; }

if npm list tailwindcss &>/dev/null; then
    echo -e "${GREEN}✅ tailwindcss 已安装${NC}"
else
    echo -e "${RED}❌ tailwindcss 未安装${NC}"
fi

if npm list postcss &>/dev/null; then
    echo -e "${GREEN}✅ postcss 已安装${NC}"
else
    echo -e "${RED}❌ postcss 未安装${NC}"
fi

if npm list autoprefixer &>/dev/null; then
    echo -e "${GREEN}✅ autoprefixer 已安装${NC}"
else
    echo -e "${RED}❌ autoprefixer 未安装${NC}"
fi
echo ""

# 6. Nginx配置检查
echo "【6】Nginx配置检查"
echo "----------------------------------------"
NGINX_CONF="/www/server/panel/vhost/nginx/www.wsxy.dauteenvoice.com.conf"

if [ -f "$NGINX_CONF" ]; then
    if grep -q "location /_next/" "$NGINX_CONF"; then
        echo -e "${GREEN}✅ 找到 location /_next/ 配置${NC}"
        
        # 检查顺序
        NEXT_LINE=$(grep -n "location /_next/" "$NGINX_CONF" | head -1 | cut -d: -f1)
        ROOT_LINE=$(grep -n "location / {" "$NGINX_CONF" | head -1 | cut -d: -f1)
        
        if [ -n "$NEXT_LINE" ] && [ -n "$ROOT_LINE" ]; then
            if [ "$NEXT_LINE" -lt "$ROOT_LINE" ]; then
                echo -e "${GREEN}✅ location /_next/ 在 location / 之前（正确）${NC}"
            else
                echo -e "${RED}❌ location /_next/ 在 location / 之后（错误！需要调整顺序）${NC}"
            fi
        fi
        
        # 检查proxy_pass
        if grep -A 5 "location /_next/" "$NGINX_CONF" | grep -q "proxy_pass.*5288"; then
            echo -e "${GREEN}✅ proxy_pass 指向正确端口 5288${NC}"
        else
            echo -e "${RED}❌ proxy_pass 配置可能有问题${NC}"
        fi
    else
        echo -e "${RED}❌ 未找到 location /_next/ 配置${NC}"
    fi
    
    # 检查是否有干扰的JS/CSS缓存规则
    if grep -q "location ~ .*\.(js|css)" "$NGINX_CONF"; then
        echo -e "${YELLOW}⚠️  发现JS/CSS缓存规则（可能干扰Next.js静态资源）${NC}"
    fi
else
    echo -e "${RED}❌ Nginx配置文件不存在: $NGINX_CONF${NC}"
fi
echo ""

# 7. 本地访问测试
echo "【7】本地访问测试"
echo "----------------------------------------"
if [ -f "$PROJECT_DIR/.next/static/css"/*.css 2>/dev/null ]; then
    CSS_FILE=$(ls "$PROJECT_DIR/.next/static/css"/*.css 2>/dev/null | head -1 | xargs basename)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/_next/static/css/$CSS_FILE" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ 本地访问CSS文件: HTTP $HTTP_CODE${NC}"
    else
        echo -e "${RED}❌ 本地访问CSS文件失败: HTTP $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  无法测试（CSS文件不存在）${NC}"
fi
echo ""

# 8. Nginx错误日志
echo "【8】最近Nginx错误日志"
echo "----------------------------------------"
ERROR_LOG="/www/wwwroot/dtwsxy/logs/nginx-error.log"
if [ ! -f "$ERROR_LOG" ]; then
    ERROR_LOG="/www/wwwlogs/wsxy.dauteenvoice.com.error.log"
fi

if [ -f "$ERROR_LOG" ]; then
    ERROR_COUNT=$(tail -50 "$ERROR_LOG" | grep -c "404\|upstream\|connect() failed" 2>/dev/null || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  发现 $ERROR_COUNT 个相关错误${NC}"
        tail -10 "$ERROR_LOG" | grep -E "404|upstream|connect" || echo "无相关错误"
    else
        echo -e "${GREEN}✅ 最近无相关错误${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  错误日志文件不存在${NC}"
fi
echo ""

# 9. PM2日志检查
echo "【9】PM2最近日志"
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    echo "最近10行日志："
    pm2 logs "$PM2_NAME" --lines 10 --nostream 2>/dev/null || echo "无法获取日志"
else
    echo "PM2未安装"
fi
echo ""

# 总结
echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "如果发现问题，请参考 AI_HANDOVER.md 文档进行修复"
echo ""
