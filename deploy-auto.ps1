# COC React项目自动化部署脚本 (Windows PowerShell)
# 使用方法：.\deploy-auto.ps1

param(
    [string]$ServerIP = "47.104.133.111",
    [string]$ServerUser = "root",
    [string]$ProjectDir = "/home/admin/coc-react"
)

Write-Host "🚀 开始自动化部署 COC React 项目..." -ForegroundColor Green

try {
    # 1. 本地构建
    Write-Host "📦 步骤1: 构建项目..." -ForegroundColor Yellow
    npm run build
    
    if (-not (Test-Path "dist")) {
        throw "构建失败，dist目录不存在"
    }
    Write-Host "✅ 项目构建成功" -ForegroundColor Green

    # 2. 创建压缩包
    Write-Host "📦 步骤2: 创建压缩包..." -ForegroundColor Yellow
    if (Test-Path "dist.zip") {
        Remove-Item "dist.zip" -Force
    }
    
    # 使用PowerShell的压缩功能
    Compress-Archive -Path "dist\*" -DestinationPath "dist.zip" -Force
    Write-Host "✅ 压缩包创建成功" -ForegroundColor Green

    # 3. 上传文件（需要安装 pscp 或使用 SCP）
    Write-Host "🔄 步骤3: 上传文件到服务器..." -ForegroundColor Yellow
    
    # 方法1: 使用pscp (需要安装PuTTY)
    if (Get-Command pscp -ErrorAction SilentlyContinue) {
        pscp -scp dist.zip "$ServerUser@$ServerIP":/tmp/
        Write-Host "✅ 文件上传成功" -ForegroundColor Green
    }
    # 方法2: 使用WinSCP命令行
    elseif (Get-Command winscp -ErrorAction SilentlyContinue) {
        winscp /command "open sftp://$ServerUser@$ServerIP" "put dist.zip /tmp/" "exit"
        Write-Host "✅ 文件上传成功" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  请手动上传 dist.zip 到服务器 /tmp/ 目录" -ForegroundColor Red
        Write-Host "或安装 PuTTY 或 WinSCP 命令行工具" -ForegroundColor Red
        Read-Host "上传完成后按回车继续..."
    }

    # 4. 生成服务器部署脚本
    Write-Host "🔧 步骤4: 生成服务器部署脚本..." -ForegroundColor Yellow
    
    $serverScript = @"
#!/bin/bash
set -e

PROJECT_DIR="$ProjectDir"
BACKUP_DIR="/home/admin/coc-react-backup"

echo "🔄 创建备份..."
if [ -d "`$PROJECT_DIR" ]; then
    sudo cp -r `$PROJECT_DIR `$BACKUP_DIR-`$(date +%Y%m%d-%H%M%S)
    echo "✅ 备份完成"
fi

echo "🔄 创建项目目录..."
sudo mkdir -p `$PROJECT_DIR
sudo chown -R www:www `$PROJECT_DIR

echo "🔄 解压文件..."
cd `$PROJECT_DIR
sudo unzip -o /tmp/dist.zip
sudo chown -R www:www `$PROJECT_DIR
sudo chmod -R 755 `$PROJECT_DIR

echo "🔄 配置Nginx..."
sudo tee /www/server/panel/vhost/nginx/coc-react.conf > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name $ServerIP;
    root $ProjectDir;
    index index.html;

    location / {
        try_files `$uri `$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)`$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://localhost:8082/;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        
        add_header Access-Control-Allow-Origin `$http_origin;
        add_header Access-Control-Allow-Credentials true;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
        
        if (`$request_method = 'OPTIONS') {
            return 204;
        }
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX_CONFIG

echo "🔄 重载Nginx配置..."
sudo nginx -t && sudo nginx -s reload

echo "🔄 清理临时文件..."
rm -f /tmp/dist.zip

echo "✅ 服务器部署完成！"
"@

    # 保存服务器脚本
    $serverScript | Out-File -FilePath "server-deploy.sh" -Encoding UTF8
    Write-Host "✅ 服务器部署脚本已生成" -ForegroundColor Green

    # 5. 执行服务器脚本（需要SSH）
    Write-Host "🔧 步骤5: 执行服务器部署..." -ForegroundColor Yellow
    
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        # 上传脚本并执行
        pscp -scp server-deploy.sh "$ServerUser@$ServerIP":/tmp/
        ssh "$ServerUser@$ServerIP" "chmod +x /tmp/server-deploy.sh && /tmp/server-deploy.sh"
        Write-Host "✅ 服务器部署完成" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  请手动执行以下步骤：" -ForegroundColor Red
        Write-Host "1. 上传 server-deploy.sh 到服务器" -ForegroundColor Yellow
        Write-Host "2. 在服务器上执行：chmod +x server-deploy.sh && ./server-deploy.sh" -ForegroundColor Yellow
    }

    # 6. 清理本地临时文件
    Write-Host "🧹 步骤6: 清理临时文件..." -ForegroundColor Yellow
    Remove-Item "dist.zip" -Force -ErrorAction SilentlyContinue
    Remove-Item "server-deploy.sh" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 清理完成" -ForegroundColor Green

    # 7. 测试部署
    Write-Host "🔍 步骤7: 测试部署..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://$ServerIP" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 网站访问正常！" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️  网站可能需要几分钟才能正常访问" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🎉 部署完成！" -ForegroundColor Green
    Write-Host "🌐 访问地址: http://$ServerIP" -ForegroundColor Cyan
    Write-Host "📁 服务器路径: $ProjectDir" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host "❌ 部署失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}