#!/bin/bash

# React项目部署脚本
# 使用方法：在你的阿里云服务器上运行此脚本

echo "开始部署COC React项目..."

# 1. 安装Node.js和npm（如果还没有安装）
# 检查是否已安装Node.js
if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
    sudo yum install -y nodejs
fi

# 2. 创建项目目录
PROJECT_DIR="/www/wwwroot/coc-react"
sudo mkdir -p $PROJECT_DIR

# 3. 设置权限
sudo chown -R www:www $PROJECT_DIR

echo "部署目录已创建: $PROJECT_DIR"
echo "请上传你的dist文件夹内容到: $PROJECT_DIR"
echo "然后配置Nginx..."