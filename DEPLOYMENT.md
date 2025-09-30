# COC React项目部署说明

## 部署步骤

### 1. 本地构建
在Windows本地执行：
```bash
npm run build
```

### 2. 上传文件到服务器
将 `dist` 文件夹中的所有内容上传到服务器的 `/www/wwwroot/coc-react/` 目录

### 3. 宝塔面板配置

#### 3.1 创建网站
- 登录宝塔面板
- 点击"网站" → "添加站点"
- 域名：你的域名或IP
- 根目录：`/www/wwwroot/coc-react`
- PHP版本：纯静态

#### 3.2 配置Nginx
在网站设置 → 配置文件中添加以下配置：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;
    root /www/wwwroot/coc-react;
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
        
        # 处理OPTIONS请求
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
}
```

### 4. 防火墙设置
确保以下端口已开放：
- 80 (HTTP)
- 443 (HTTPS，如果使用SSL)
- 8082 (Java后端，内网访问)

### 5. SSL证书配置（可选）
如果有域名，建议配置SSL证书：
- 在宝塔面板的网站设置中点击"SSL"
- 选择"Let's Encrypt"或上传自己的证书

### 6. 性能优化建议

#### 6.1 开启Gzip压缩
已在Nginx配置中包含

#### 6.2 配置CDN（可选）
可以将静态资源上传到阿里云OSS，并配置CDN加速

#### 6.3 配置缓存
静态资源已设置1年缓存，确保更新时修改文件名

### 7. 监控和日志
- 在宝塔面板中查看网站访问日志
- 监控服务器资源使用情况
- 设置网站监控告警

### 8. 常见问题

#### Q: 页面刷新后404
A: 确保Nginx配置了 `try_files $uri $uri/ /index.html;`

#### Q: API请求失败
A: 检查Java后端是否正常运行在8082端口，检查防火墙设置

#### Q: 静态资源加载失败
A: 检查文件路径和权限设置

### 9. 部署脚本
可以使用提供的 `deploy.sh` 脚本简化部署过程

### 10. 回滚操作
建议每次部署前备份上一版本：
```bash
sudo cp -r /www/wwwroot/coc-react /www/wwwroot/coc-react-backup-$(date +%Y%m%d)
```