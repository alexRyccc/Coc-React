// 生产环境配置文件
// 将此文件放在服务器的 /www/wwwroot/coc-react/config.js

window.CONFIG = {
  API_BASE_URL: '/api',
  APP_NAME: 'COC角色创建系统',
  VERSION: '1.0.0',
  // 可以根据需要添加其他配置
  FEATURES: {
    REGISTRATION: true,
    SOCIAL_LOGIN: false,
    ANALYTICS: false
  }
};