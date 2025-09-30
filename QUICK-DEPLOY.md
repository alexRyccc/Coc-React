# React项目快速部署指南
服务器: 47.104.133.111

## 🚀 一键自动部署（推荐）

### 在本地项目根目录运行：
```bash
chmod +x deploy-auto.sh
./deploy-auto.sh
```

## 📋 手动部署步骤

### 步骤1: 本地构建
```bash
npm run build
tar -czf react-dist.tar.gz -C dist .
```

### 步骤2: 上传文件
```bash
scp react-dist.tar.gz root@47.104.133.111:/tmp/
```

### 步骤3: SSH连接服务器
```bash
ssh root@47.104.133.111
```

### 步骤4: 服务器端部署
复制粘贴以下整个代码块一次性执行：

```bash
# 一键部署脚本
set -e

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

# 创建项目目录
echo "创建项目目录..."
mkdir -p /home/admin/coc-react
cd /home/admin/coc-react

# 备份旧文件
if [ "$(ls -A .)" ]; then
    echo "备份旧文件..."
    mkdir -p /home/admin/backup
    mv ./* /home/admin/backup/ 2>/dev/null || true
fi

# 解压新文件
echo "解压项目文件..."
tar -xzf /tmp/react-dist.tar.gz

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
    firewall-cmd --permanent --add-service=http
    firewall-cmd --reload
elif command -v ufw &> /dev/null; then
    ufw allow 80/tcp
fi

# 清理
rm -f /tmp/react-dist.tar.gz

echo "================================"
echo "🎉 部署完成!"
echo "访问地址: http://47.104.133.111"
echo "项目目录: /home/admin/coc-react"
echo "================================"
```

## 🔍 验证部署

### 检查文件
```bash
ls -la /home/admin/coc-react/
```

### 检查nginx状态
```bash
systemctl status nginx
nginx -t
```

### 检查端口
```bash
netstat -tlnp | grep :80
```

### 访问测试
在浏览器打开: http://47.104.133.111

## 🛠️ 常见问题

### 问题1: 403 Forbidden
```bash
chown -R nginx:nginx /home/admin/coc-react/  # CentOS
# 或
chown -R www-data:www-data /home/admin/coc-react/  # Ubuntu
chmod -R 755 /home/admin/coc-react/
```

### 问题2: 502 Bad Gateway
```bash
# 检查Java后端是否运行
netstat -tlnp | grep 8082
systemctl status your-java-service
```

### 问题3: 页面刷新404
确保nginx配置有: `try_files $uri $uri/ /index.html;`

### 问题4: API调用失败
```bash
# 检查后端连通性
curl http://localhost:8082/health
# 查看nginx错误日志
tail -f /var/log/nginx/coc-react-error.log
```

## 📝 后续操作

1. **确保Java后端运行**: 检查8082端口服务
2. **配置域名**: 修改nginx配置中的server_name
3. **SSL证书**: 使用certbot配置HTTPS
4. **监控**: 设置日志轮转和监控告警

## 🔄 更新部署

重复步骤1-4即可更新项目，系统会自动备份旧版本。