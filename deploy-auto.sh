#!/bin/bash

# COC React项目完整自动化部署脚本
# 服务器IP: 47.104.133.111
# 使用方法：./deploy-auto.sh

set -e  # 遇到错误立即退出

# 配置变量
SERVER_IP="47.104.133.111"
SERVER_USER="root"
PROJECT_DIR="/home/admin/coc-react"
LOCAL_DIST_DIR="./dist"
BACKUP_DIR="/home/admin/coc-react-backup"
NGINX_CONF="/etc/nginx/conf.d/coc-react.conf"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "🚀 开始自动化部署 COC React 项目到服务器 $SERVER_IP..."

# 1. 本地构建
log_step "步骤1: 构建项目..."
if [ ! -f "package.json" ]; then
    log_error "未找到package.json文件，请在项目根目录运行此脚本"
    exit 1
fi

log_info "运行 npm run build..."
npm run build

if [ ! -d "$LOCAL_DIST_DIR" ]; then
    log_error "构建失败，dist目录不存在"
    exit 1
fi

log_info "项目构建成功"

# 2. 压缩文件
log_step "步骤2: 压缩文件..."
log_info "创建压缩包..."
tar -czf dist.tar.gz -C dist .
log_info "压缩完成"

# 3. 上传文件到服务器
log_step "步骤3: 上传文件到服务器..."
log_info "上传文件到 $SERVER_IP:/tmp/"
scp dist.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
log_info "文件上传完成"

# 4. 在服务器上执行部署命令
log_step "步骤4: 在服务器上部署..."
log_info "连接服务器执行部署脚本..."

ssh $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'

# 设置变量
PROJECT_DIR="/home/admin/coc-react"
BACKUP_DIR="/home/admin/coc-react-backup"
NGINX_CONF="/etc/nginx/conf.d/coc-react.conf"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_remote() {
    echo -e "${GREEN}[REMOTE]${NC} $1"
}

log_remote "开始服务器端部署..."

# 检查系统类型
if [ -f /etc/redhat-release ]; then
    OS="centos"
    WEB_USER="nginx"
elif [ -f /etc/debian_version ]; then
    OS="ubuntu" 
    WEB_USER="www-data"
else
    OS="unknown"
    WEB_USER="nginx"
fi

log_remote "检测到系统: $OS"

# 安装Nginx (如果没有安装)
if ! command -v nginx &> /dev/null; then
    log_remote "安装Nginx..."
    if [ "$OS" = "centos" ]; then
        yum install -y epel-release
        yum install -y nginx
    elif [ "$OS" = "ubuntu" ]; then
        apt update
        apt install -y nginx
    fi
fi

# 创建备份
if [ -d "$PROJECT_DIR" ] && [ "$(ls -A $PROJECT_DIR)" ]; then
    log_remote "创建备份..."
    mkdir -p $BACKUP_DIR
    cp -r $PROJECT_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)
    log_remote "备份完成"
fi

# 创建项目目录
log_remote "创建项目目录..."
mkdir -p $PROJECT_DIR
chown -R $WEB_USER:$WEB_USER $PROJECT_DIR

# 解压文件
log_remote "解压文件..."
cd $PROJECT_DIR
rm -rf ./*  # 清空目录
tar -xzf /tmp/dist.tar.gz
chown -R $WEB_USER:$WEB_USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 配置Nginx
log_remote "配置Nginx..."
mkdir -p /etc/nginx/conf.d

cat > $NGINX_CONF << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 47.104.133.111;
    root /home/admin/coc-react;
    index index.html;

    # 处理React Router的历史模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理到Java后端
    location /api/ {
        proxy_pass http://localhost:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 处理跨域
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Credentials true;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

cat > $NGINX_CONF << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 47.104.133.111;
    root /home/admin/coc-react;
    index index.html index.htm;

    # 日志文件
    access_log /var/log/nginx/coc-react-access.log;
    error_log /var/log/nginx/coc-react-error.log;

    # 处理React Router的历史模式
    location / {
        try_files $uri $uri/ /index.html;
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # API代理到Java后端
    location /api/ {
        proxy_pass http://127.0.0.1:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 处理跨域
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization' always;
        
        # 处理OPTIONS请求
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Credentials true;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE';
            add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问备份文件
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX_CONFIG

# 测试Nginx配置
log_remote "测试Nginx配置..."
if nginx -t; then
    log_remote "Nginx配置测试通过"
else
    log_remote "Nginx配置测试失败"
    exit 1
fi

# 启动并重载Nginx
log_remote "启动Nginx服务..."
systemctl enable nginx
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    log_remote "Nginx服务启动成功"
else
    log_remote "Nginx服务启动失败"
    systemctl status nginx
    exit 1
fi

# 配置防火墙
log_remote "配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
    log_remote "Firewalld规则已添加"
elif command -v ufw &> /dev/null; then
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    log_remote "UFW规则已添加"
fi

# 清理临时文件
rm -f /tmp/dist.tar.gz

log_remote "服务器端部署完成!"

REMOTE_SCRIPT

# 5. 清理本地临时文件
log_step "步骤5: 清理临时文件..."
rm -f dist.tar.gz
log_info "本地临时文件清理完成"

# 6. 显示部署结果
log_step "部署完成!"
echo ""
echo "=================================="
echo -e "${GREEN}🎉 部署成功!${NC}"
echo "=================================="
echo "项目地址: http://47.104.133.111"
echo "项目目录: /home/admin/coc-react"
echo "Nginx配置: /etc/nginx/conf.d/coc-react.conf"
echo "日志文件: /var/log/nginx/coc-react-*.log"
echo ""
echo "后续操作:"
echo "1. 确保Java后端运行在8082端口"
echo "2. 检查防火墙设置"
echo "3. 配置域名解析(可选)"
echo "4. 配置SSL证书(可选)"
echo "=================================="
    add_header X-XSS-Protection "1; mode=block";
}
NGINX_CONFIG

echo "🔄 重载Nginx配置..."
sudo nginx -t && sudo nginx -s reload

echo "🔄 清理临时文件..."
rm -f /tmp/dist.tar.gz

echo "✅ 服务器部署完成！"
REMOTE_SCRIPT

# 5. 清理本地临时文件
echo "🧹 步骤5: 清理本地临时文件..."
rm -f dist.tar.gz

# 6. 测试部署
echo "🔍 步骤6: 测试部署..."
echo "正在测试网站访问..."
if curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP | grep -q "200"; then
    echo "✅ 网站访问正常！"
else
    echo "⚠️  网站可能需要几分钟才能正常访问"
fi

echo ""
echo "🎉 部署完成！"
echo "🌐 访问地址: http://$SERVER_IP"
echo "📁 服务器路径: $PROJECT_DIR"
echo "💡 如需回滚，备份文件在: $BACKUP_DIR-[时间戳]"
echo ""