旅行计划（jihua/jahua.js）前后端对接说明

一、Google Maps
- 前端使用 Google Maps JavaScript API（浏览器端），需提供 API Key。
- 推荐把 API Key 写入生产配置：config.js（服务器上的 /www/wwwroot/coc-react/config.js），例如：

window.CONFIG = {
  API_BASE_URL: '/api',
  GMAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY'
};

- 若不配置，也可在页面顶部输入框临时填写（会保存到 localStorage）。

二、后端 API 约定（适配你的 Java JAR + MySQL）
- 统一前缀：/api，可在 config.js 的 API_BASE_URL 修改。
- JSON 数据结构：
  TravelPlan {
    id: number,
    name: string,
    items: TravelPlanItem[]
  }
  TravelPlanItem {
    id?: number,
    placeId?: string,
    name: string,
    lat: number,
    lng: number,
    date?: string,  // YYYY-MM-DD
    time?: string,  // HH:mm
    notes?: string
  }

- 接口列表：
  GET    /api/travel-plans                -> TravelPlan[]（只需 id、name 即可）
  GET    /api/travel-plans/{id}           -> TravelPlan（含 items[]）
  POST   /api/travel-plans                -> 创建，body: { name, items }
  PUT    /api/travel-plans/{id}           -> 更新，body: { id, name, items }
  DELETE /api/travel-plans/{id}           -> 删除

- 跨域：请确保允许前端域名的 CORS 或与前端同域部署。

三、MySQL 表结构参考

-- 旅行计划表
CREATE TABLE travel_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 旅行计划条目表
CREATE TABLE travel_plan_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plan_id INT NOT NULL,
  place_id VARCHAR(128) NULL,
  name VARCHAR(255) NOT NULL,
  lat DOUBLE NOT NULL,
  lng DOUBLE NOT NULL,
  date DATE NULL,
  time TIME NULL,
  notes TEXT NULL,
  sort_no INT DEFAULT 0,
  FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
);

-- 查询：根据 plan_id 返回 items，按 sort_no ASC
-- 更新时建议先删再插或全量对比更新 sort_no 顺序。

四、使用说明（前端）
- 路由：/#/jihua
- 顶部输入 Google Maps API Key，启用地图。
- 搜索栏搜索地点或在地图上点击添加标记；可拖拽标记调整经纬度。
- 底部列表可编辑名称/时间/备注；可拖拽列表项（桌面）或用上下按钮（移动）调整顺序。
- 点击“保存”走后端接口；“刷新计划/选择已有计划”加载后端数据。
