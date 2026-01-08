#!/bin/bash

# 静态资源404错误修复脚本
# 使用方法：bash fix-static-assets.sh

set -e

echo "=========================================="
echo "开始修复静态资源404错误"
echo "=========================================="

# 项目路径（请根据实际情况修改）
PROJECT_DIR="/www/wwwroot/dtwsxy"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "错误：项目目录不存在: $PROJECT_DIR"
    echo "请修改脚本中的 PROJECT_DIR 变量"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "步骤1: 检查Next.js配置..."
if grep -q "output: 'standalone'" next.config.mjs 2>/dev/null || grep -q 'output: "standalone"' next.config.mjs 2>/dev/null; then
    echo "⚠️  发现 output: 'standalone'，需要移除（仅用于Docker部署）"
    echo "请手动编辑 next.config.mjs 文件，注释掉或删除 output: 'standalone' 这一行"
    read -p "按回车继续（请确保已修复配置）..."
else
    echo "✅ Next.js配置正常"
fi

echo ""
echo "步骤2: 检查依赖..."
if ! npm list tailwindcss >/dev/null 2>&1; then
    echo "⚠️  缺少 tailwindcss，正在安装..."
    npm install -D tailwindcss postcss autoprefixer
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "步骤3: 清理旧的构建文件..."
rm -rf .next
rm -rf node_modules/.cache
echo "✅ 清理完成"

echo ""
echo "步骤4: 重新构建项目..."
npm run build

echo ""
echo "步骤5: 验证构建结果..."
if [ -d ".next/static/css" ] && [ "$(ls -A .next/static/css 2>/dev/null)" ]; then
    echo "✅ CSS文件已生成"
    ls -lh .next/static/css/ | head -5
else
    echo "❌ CSS文件未生成，请检查构建日志"
    exit 1
fi

if [ -d ".next/static/chunks" ] && [ "$(ls -A .next/static/chunks 2>/dev/null)" ]; then
    echo "✅ JS文件已生成"
    ls -lh .next/static/chunks/ | head -5
else
    echo "❌ JS文件未生成，请检查构建日志"
    exit 1
fi

echo ""
echo "步骤6: 重启PM2进程..."
if command -v pm2 &> /dev/null; then
    pm2 restart dtwsxy || echo "⚠️  PM2进程 dtwsxy 不存在或启动失败"
    echo "✅ PM2已重启"
    echo ""
    echo "查看PM2日志（最近20行）："
    pm2 logs dtwsxy --lines 20 --nostream
else
    echo "⚠️  PM2未安装，请手动重启应用"
fi

echo ""
echo "=========================================="
echo "修复完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 检查Nginx配置，确保 location /_next/ 在 location / 之前"
echo "2. 重载Nginx: systemctl reload nginx"
echo "3. 访问网站验证静态资源是否正常加载"
echo ""
echo "如果仍有问题，请检查："
echo "- Nginx错误日志: tail -f /www/wwwlogs/wsxy.dauteenvoice.com.error.log"
echo "- PM2日志: pm2 logs dtwsxy"
echo ""
