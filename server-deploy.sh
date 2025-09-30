# 服务器端一键部署脚本
# 在SSH连接到服务器后执行

set -e

echo "🚀 开始服务器端部署..."

# 检测系统类型
if [ -f /etc/redhat-release ]; then
    OS="centos"
    WEB_USER="nginx"
    PKG_MANAGER="yum"
elif [ -f /etc/debian_version ]; then
    OS="ubuntu"
    WEB_USER="www-data"
    PKG_MANAGER="apt"
else
    echo "不支持的系统"
    exit 1
fi

echo "检测到系统: $OS"

# 安装nginx
if ! command -v nginx &> /dev/null; then
    echo "安装nginx..."
    if [ "$OS" = "centos" ]; then
        $PKG_MANAGER install -y epel-release
        $PKG_MANAGER install -y nginx
    else
        $PKG_MANAGER update -y
        $PKG_MANAGER install -y nginx
    fi
fi



# 设置权限
chown -R $WEB_USER:$WEB_USER /home/admin/coc-react
chmod -R 755 /home/admin/coc-react

# 配置nginx
echo "配置nginx..."
cat > /etc/nginx/conf.d/coc-react.conf << 'EOF'
server {
    listen 80;
    server_name 47.104.133.111;
    root /home/admin/coc-react;
    index index.html index.htm;

    access_log /var/log/nginx/coc-react-access.log;
    error_log /var/log/nginx/coc-react-error.log;

    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF

# 测试nginx配置
nginx -t

# 启动nginx
systemctl enable nginx
systemctl restart nginx

# 配置防火墙
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
    firewall-cmd --reload >/dev/null 2>&1 || true
elif command -v ufw &> /dev/null; then
    ufw allow 80/tcp >/dev/null 2>&1 || true
fi

# 清理
rm -f /tmp/dist.zip

echo "================================"
echo "🎉 部署完成!"
echo "访问地址: http://47.104.133.111"
echo "项目目录: /home/admin/coc-react"
echo "================================"

# 显示状态
echo "Nginx状态:"
systemctl status nginx --no-pager -l

echo "项目文件:"
ls -la /home/admin/coc-react/