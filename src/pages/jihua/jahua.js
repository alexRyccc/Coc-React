import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import './jihua.css';

// ------ Helpers: Leaflet loaders ------
let leafletLoaderPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoaderPromise) return leafletLoaderPromise;
  leafletLoaderPromise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true; script.defer = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.body.appendChild(script);
  });
  return leafletLoaderPromise;
}

let markerClusterLoaderPromise = null;
function loadMarkerCluster() {
  if (window.L && window.L.markerClusterGroup) return Promise.resolve(true);
  if (markerClusterLoaderPromise) return markerClusterLoaderPromise;
  markerClusterLoaderPromise = new Promise((resolve, reject) => {
    const link1 = document.createElement('link'); link1.rel = 'stylesheet'; link1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'; document.head.appendChild(link1);
    const link2 = document.createElement('link'); link2.rel = 'stylesheet'; link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'; document.head.appendChild(link2);
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'; script.async = true; script.defer = true; script.onload = () => resolve(true); script.onerror = () => reject(new Error('Failed to load MarkerCluster')); document.body.appendChild(script);
  });
  return markerClusterLoaderPromise;
}

// ------ Helper: html2canvas loader ------
let html2canvasLoaderPromise = null;
function loadHtml2Canvas(){
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2canvasLoaderPromise) return html2canvasLoaderPromise;
  html2canvasLoaderPromise = new Promise((resolve, reject)=>{
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true; script.defer = true;
    script.onload = ()=> resolve(window.html2canvas);
    script.onerror = ()=> reject(new Error('Failed to load html2canvas'));
    document.body.appendChild(script);
  });
  return html2canvasLoaderPromise;
}

function uid() { return Math.random().toString(36).slice(2, 9); }
const DEFAULT_CENTER = { lat: 39.9042, lng: 116.4074 };
function hasTdtToken() { return !!(typeof window !== 'undefined' && window.CONFIG && window.CONFIG.TIANDITU_TOKEN); }
function getNowDateTime(){ const now=new Date(); const p=(n)=>n<10?'0'+n:''+n; return { date:`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`, time:`${p(now.getHours())}:${p(now.getMinutes())}`}; }
function getRuntimeMapConfig(){ const c=(typeof window!=='undefined'&&window.CONFIG)?window.CONFIG:{}; return { initialZoom: typeof c.MAP_INITIAL_ZOOM==='number'?c.MAP_INITIAL_ZOOM:11, customTile:{ url:c.MAP_TILE_URL||'', attribution:c.MAP_ATTRIBUTION||'', subdomains:c.MAP_SUBDOMAINS||undefined } }; }

// distance helpers
function toRad(v){ return v*Math.PI/180; }
function haversineKm(aLat,aLng,bLat,bLng){
  const R=6371; const dLat=toRad(bLat-aLat); const dLng=toRad(bLng-aLng);
  const la1=toRad(aLat), la2=toRad(bLat);
  const h=Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(h)));
}
function formatCnDate(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return (m?String(parseInt(m,10)):'')+'月'+(d?String(parseInt(d,10)):'')+'日'; }
function sameCityOrProvince(a,b){
  if (!a || !b) return false;
  const ac=a.city||a.county||a.district||a.province||a.state; const bc=b.city||b.county||b.district||b.province||b.state;
  if (ac && bc && ac===bc) return true;
  const ap=a.province||a.state; const bp=b.province||b.state; if (ap && bp && ap===bp) return true;
  return false;
}
function recommendTransport(km, fromItem=null, toItem=null){
  if (!isFinite(km)) return '步行';
  const intraCity = sameCityOrProvince(fromItem, toItem);
  if (intraCity){
    if (km < 1.2) return '步行';
    if (km < 8) return '地铁/公交';
    if (km < 25) return '打车/网约车';
    if (km < 60) return '城际快线/高铁';
    return '高铁/飞机';
  } else {
    if (km < 3) return '打车/公交';
    if (km < 50) return '大巴/自驾';
    if (km < 300) return '高铁/动车';
    if (km < 800) return '高铁/飞机';
    return '飞机';
  }
}
function formatCnAddress(addr, displayName){
  if (!addr) return displayName||'';
  const p = [];
  const province = addr.state || addr.province || '';
  const city = addr.city || addr.town || addr.village || '';
  const district = addr.city_district || addr.district || addr.county || '';
  const road = addr.road || addr.residential || addr.neighbourhood || '';
  const house = addr.house_number || '';
  const poi = addr.amenity || addr.tourism || addr.building || addr.hotel || addr.shop || '';
  if (province) p.push(province);
  if (city && !p.includes(city)) p.push(city);
  if (district) p.push(district);
  if (road) p.push(road + (house?house:''));
  if (poi) p.push(poi);
  const s = p.join('');
  return s || (displayName||'');
}

// ------ China coordinate conversions (GCJ-02 <-> WGS84) for AMap/Tencent results ------
const PI = Math.PI;
function outOfChina(lng, lat){ return (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271); }
function transformLat(x, y){
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y*y + 0.1 * x*y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}
function transformLon(x, y){
  let ret = 300.0 + x + 2.0 * y + 0.1 * x*x + 0.1 * x*y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}
function wgs84ToGcj02(lng, lat){
  if (outOfChina(lng, lat)) return [lng, lat];
  const a = 6378245.0; const ee = 0.00669342162296594323;
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLon = transformLon(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  const mgLat = lat + dLat; const mgLon = lng + dLon;
  return [mgLon, mgLat];
}
function gcj02ToWgs84(lng, lat){
  if (outOfChina(lng, lat)) return [lng, lat];
  const [mgLng, mgLat] = wgs84ToGcj02(lng, lat);
  const dLng = mgLng - lng; const dLat = mgLat - lat;
  return [lng - dLng, lat - dLat];
}

function getAmapKey(){ try{ return (window && window.CONFIG && window.CONFIG.AMAP_KEY) ? String(window.CONFIG.AMAP_KEY) : ''; }catch(_){ return ''; } }

// ------ Fallback helpers: extract city token and find city center ------
function extractCityFromQuery(q){
  const s = String(q||'');
  const common = ['北京','上海','广州','深圳','武汉','杭州','南京','成都','重庆','西安','苏州','天津','郑州','青岛','长沙','合肥','福州','厦门','无锡','宁波','沈阳','大连','济南','南昌','昆明'];
  for (const w of common){ if (s.includes(w)) return w; }
  const m = s.match(/([\u4e00-\u9fa5]{2,9})(?:市|州|盟|区|县)/);
  if (m) return m[1];
  return '';
}
async function geocodeCityCenter(name){
  if (!name) return null;
  try{
    const om = await axios.get('https://geocoding-api.open-meteo.com/v1/search', { params:{ name, count:1, language:'zh', format:'json' }, timeout:5000 });
    const r = om.data && om.data.results && om.data.results[0];
    if (r) return { lat: r.latitude, lng: r.longitude };
  }catch(_){ /* try nominatim below */ }
  try{
    const res = await axios.get('https://nominatim.openstreetmap.org/search', { params:{ format:'jsonv2', q: name, limit:1, addressdetails:0, 'accept-language':'zh-CN' }, timeout:4000 });
    const arr = Array.isArray(res.data)? res.data : [];
    if (arr[0]) return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  }catch(_){ }
  return null;
}

// ------ Address-like handling: prioritize road match + nearby POI ------
function parseAddressLikeQuery(q){
  const s = String(q||'').trim();
  if (!s) return null;
  // Heuristics: must contain a road token and/or a house number token
  const roadRe = /([\u4e00-\u9fa5A-Za-z0-9·\-]{2,20})(大道|大街|路|街|巷|弄|环路|快速路|高架|公路)/;
  const numRe = /(\d+|[Xx]{1,3})\s*号?/; // allow xx/XX placeholders commonly used
  const hasRoad = roadRe.test(s);
  const hasNum = numRe.test(s);
  if (!hasRoad && !hasNum) return null;
  const roadM = s.match(roadRe);
  const street = roadM ? (roadM[1] + roadM[2]) : '';
  // Try to extract poi keyword after street/number tokens
  let poiKeyword = '';
  if (roadM){
    const after = s.slice(roadM.index + roadM[0].length).replace(/[，,。\s]+/g,' ').trim();
    // common poi type words to keep
    const keepTokens = ['酒店','宾馆','广场','中心','大厦','公寓','写字楼','商场','购物中心','地铁站','火车站'];
    if (after){
      // If includes known type words, keep full; else if long, take last token
      if (keepTokens.some(k=> after.includes(k))) poiKeyword = after;
      else {
        const parts = after.split(/\s+/);
        poiKeyword = parts[parts.length-1] || '';
      }
    }
  }
  const cityToken = extractCityFromQuery(s);
  return { street, hasNum, poiKeyword, cityToken };
}

async function searchAddressAssist(query, mapRef, useMapBounds, cancelToken){
  const parsed = parseAddressLikeQuery(query);
  if (!parsed) return [];
  const { street, poiKeyword, cityToken } = parsed;
  const escapeRegex = (t)=> String(t||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  // Determine bbox or fallback center
  let overpassBBox = '';
  let center = null;
  try{
    if (useMapBounds && mapRef.current){
      const b = mapRef.current.getBounds();
      const west=b.getWest().toFixed(3), east=b.getEast().toFixed(3), north=b.getNorth().toFixed(3), south=b.getSouth().toFixed(3);
      overpassBBox = `${south},${west},${north},${east}`;
    }
    if (mapRef.current) center = mapRef.current.getCenter();
  }catch(_){ }
  if (!center && cityToken){
    try{ const c = await geocodeCityCenter(cityToken); if (c) center = { lat:c.lat, lng:c.lng }; }catch(_){ }
  }
  // Step 1: find the road line near bbox/city using Overpass
  let roadPoint = null;
  try{
    const roadQL = overpassBBox ?
      `[out:json][timeout:10];\n( way["highway"]["name:zh"~"${escapeRegex(street)}",i](${overpassBBox});\n  way["highway"]["name"~"${escapeRegex(street)}",i](${overpassBBox});\n  relation["route"="road"]["name"~"${escapeRegex(street)}",i](${overpassBBox});\n); out center 10;` :
      (center ? `[out:json][timeout:10];\n( way(around:4000,${center.lat},${center.lng})["highway"]["name:zh"~"${escapeRegex(street)}",i];\n  way(around:4000,${center.lat},${center.lng})["highway"]["name"~"${escapeRegex(street)}",i];\n); out center 10;` : '');
    if (roadQL){
      const res = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(roadQL)}`, { headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, timeout:7000, cancelToken });
      const els = (res.data && res.data.elements) || [];
      if (els[0]){
        const el = els[0]; const lat = (el.center && el.center.lat) || el.lat; const lon = (el.center && el.center.lon) || el.lon;
        if (isFinite(lat) && isFinite(lon)) roadPoint = { lat, lon };
      }
    }
  }catch(_){ /* ignore, try next */ }
  if (!roadPoint && center){ roadPoint = { lat:center.lat, lon:center.lng }; }
  if (!roadPoint) return [];
  // If we have a poi keyword, try to find nearby POIs first (AMap preferred)
  let nearby = [];
  if (poiKeyword){
    const key = getAmapKey();
    if (key){
      try{
        const resp = await axios.get('https://restapi.amap.com/v5/place/text', { params:{ key, keywords: poiKeyword, page_size: 6, page_num: 1, location: `${roadPoint.lon},${roadPoint.lat}` }, timeout:5000, cancelToken });
        const pois = (resp.data && resp.data.pois) || [];
        nearby = pois.map(p=>{
          let lat=0, lon=0; if (p.location){ const [x,y]=String(p.location).split(','); lon=parseFloat(x); lat=parseFloat(y); const [wgsLon,wgsLat]=gcj02ToWgs84(lon,lat); lon=wgsLon; lat=wgsLat; }
          const title = p.name || poiKeyword;
          const ad = [p.cityname||'', p.adname||'', p.address||''].filter(Boolean).join(' ');
          return { place_id: String(p.id||''), osm_id:null, display_name: ad? `${title} · ${ad}` : title, lat:String(lat), lon:String(lon) };
        }).filter(d=> d.lat && d.lon);
      }catch(_){ /* fall back to Overpass */ }
    }
    if (!nearby.length){
      try{
        const around = 1800;
        const q = escapeRegex(poiKeyword);
        const ov = `[out:json][timeout:12];\n( node(around:${around},${roadPoint.lat},${roadPoint.lon})["name:zh"~"${q}",i];\n  way(around:${around},${roadPoint.lat},${roadPoint.lon})["name:zh"~"${q}",i];\n  relation(around:${around},${roadPoint.lat},${roadPoint.lon})["name:zh"~"${q}",i];\n  node(around:${around},${roadPoint.lat},${roadPoint.lon})["name"~"${q}",i];\n  way(around:${around},${roadPoint.lat},${roadPoint.lon})["name"~"${q}",i];\n  relation(around:${around},${roadPoint.lat},${roadPoint.lon})["name"~"${q}",i];\n); out center 20;`;
        const r = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(ov)}`, { headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, timeout:9000, cancelToken });
        const els = (r.data && r.data.elements) || [];
        nearby = els.slice(0,12).map(el=>{
          const tags = el.tags||{}; const nameZh = tags['name:zh']; const name = tags.name || nameZh || poiKeyword;
          const lat = el.lat!=null ? el.lat : (el.center && el.center.lat);
          const lon = el.lon!=null ? el.lon : (el.center && el.center.lon);
          return { place_id: String(el.id), osm_id: el.id, display_name: name, lat:String(lat||''), lon:String(lon||'') };
        }).filter(d=> d.lat && d.lon);
      }catch(_){ }
    }
  }
  if (nearby.length) return nearby;
  // No specific POI found; return the road center as an approximate location so user can refine
  return [{ place_id:null, osm_id:null, display_name: `${street} 附近（按道路定位）`, lat:String(roadPoint.lat), lon:String(roadPoint.lon), __approx:true }];
}

// ------ Concurrency & retry helpers ------
function makeGate(max=2){
  const queue=[]; let running=0;
  const next = ()=>{ const r = queue.shift(); if (r) r(); };
  return async function run(fn){
    if (running >= max){ await new Promise(res=> queue.push(res)); }
    running++;
    try{ return await fn(); }
    finally { running--; next(); }
  };
}
async function withRetry(task, { retries=2, baseDelay=500 }={}){
  let attempt=0;
  // eslint-disable-next-line no-constant-condition
  while (true){
    try{ return await task(); }
    catch(e){
      attempt++;
      const status = e && e.response && e.response.status;
      // 对 429/5xx/网络错误进行重试；其它 4xx 不重试
      const retriable = !status || status>=500 || status===429;
      if (attempt>retries || !retriable) throw e;
      const jitter = 1 + Math.random()*0.2;
      const delay = Math.round(baseDelay * Math.pow(2, attempt-1) * jitter);
      await new Promise(r=> setTimeout(r, delay));
    }
  }
}
const gateNominatim = makeGate(2);   // 搜索
const gateReverse = makeGate(2);     // 逆地理

const searchCache = new Map();
const reverseCache = new Map();
const reverseCacheEn = new Map();
const MAX_SEARCH_CACHE = 200;
function lruSet(map, key, val, max=MAX_SEARCH_CACHE){
  if (map.has(key)) map.delete(key);
  map.set(key, val);
  if (map.size > max){ const firstKey = map.keys().next().value; map.delete(firstKey); }
}

export default function JihuaPlanner(){
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const polylineGroupRef = useRef(null);
  const markersRef = useRef({});

  const locTopCountRef = useRef(10);
  const adjustLocCount = (latencyMs, failCount)=>{
    if (latencyMs > 1200 || failCount > 3) locTopCountRef.current = 5;
    else if (latencyMs < 500 && failCount === 0) locTopCountRef.current = 10;
  };
  const [mapReady,setMapReady]=useState(false);
  const [planName,setPlanName]=useState('我的旅行计划');
  const [planId,setPlanId]=useState(null);
  const [items,setItems]=useState([]);
  const [error,setError]=useState('');
  const [dragIndex,setDragIndex]=useState(null);
  const [searchQuery,setSearchQuery]=useState('');
  const [useMapBounds, setUseMapBounds] = useState(true);
  const [viewMode,setViewMode]=useState('list');
  const [showExtra,setShowExtra]=useState(()=>{ try{ const v=localStorage.getItem('jihua_show_extra'); return v==='1'; }catch(_){ return false; } });
  const [mapHeight,setMapHeight]=useState( Math.round(window.innerHeight*0.46) );
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHRef = useRef(0);
  const [timelineManualOrder,setTimelineManualOrder]=useState(false);
  const [timelineDragIndex,setTimelineDragIndex]=useState(null);
  const tileErrorCountRef = useRef(0);
  const fallbackAppliedRef = useRef(false);
  // Supplies: my templates (local)
  const revDelayRef = useRef(140);
  const suggestionsRef = useRef([]);
  useEffect(()=>{ suggestionsRef.current = suggestions; }, [suggestions]);
  const lastAdminRef = useRef({ tag:'', lat:null, lng:null, t:0 });
  const sleep = (ms)=> new Promise(r=> setTimeout(r, ms));
  const [myTemplates, setMyTemplates] = useState(()=>{
    try {
      const s = localStorage.getItem('jihua_supplies_templates');
      const arr = s ? JSON.parse(s) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  });
  const [selectedTplName, setSelectedTplName] = useState('');
  // Suggestions UI state
  const [suggestions, setSuggestions] = useState([]);
  // Suggestions visible count (user configurable)
  const [suggMax, setSuggMax] = useState(()=>{
    try{ const n = parseInt(localStorage.getItem('jihua_sugg_max')||'5', 10); return [3,5,8].includes(n)? n : 5; }catch(_){ return 5; }
  });
  useEffect(()=>{ try{ localStorage.setItem('jihua_sugg_max', String(suggMax)); }catch(_){ } }, [suggMax]);
  // Context menu state/refs
  const [menu, setMenu] = useState({ show:false, x:0, y:0, itemId:null });
  const lpTimerRef = useRef(null);
  const chipLpTimerRef = useRef(null);
  // Map tiles state/refs
  const [tileKey, setTileKey] = useState('amap');
  const fallbackStageRef = useRef(0);
  // Supplies modal state
  const [showSupplies, setShowSupplies] = useState(false);
  const [suppliesText, setSuppliesText] = useState('');
  const suppliesDebounceRef = useRef(null);
  // Fill geo names state
  const [fillGeoBusy, setFillGeoBusy] = useState(false);
  const [fillProgress, setFillProgress] = useState({ done:0, total:0 });
  // Routing distance state/refs
  const [useRouteDistance, setUseRouteDistance] = useState(false);
  const [routeDistances, setRouteDistances] = useState([]);
  const routeCacheRef = useRef(new Map());
  const [osrmWarn, setOsrmWarn] = useState('');
  const [showActionMore, setShowActionMore] = useState(false);
  // Import-from-text (Beta)
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importDay1Date, setImportDay1Date] = useState(()=> getNowDateTime().date);
  const [importPreview, setImportPreview] = useState([]); // { name, time, notes, dayIndex, candidates?, selectedIdx? }
  const [importParsing, setImportParsing] = useState(false);
  const [importGeocoding, setImportGeocoding] = useState(false);
  // Place-on-map mode for unlocated items: holds itemId to place on next map click
  const placingRef = useRef(null);
  // Circuit breaker: temporarily disable Nominatim after repeated timeouts
  const nomiBlockedUntilRef = useRef(0);

  // Geocoding mode: 'stable' (Photon + BigDataCloud only), 'auto' (Nominatim + Photon; reverse prefers Nominatim), 'nominatim'
  const getGeoMode = useCallback(()=>{
    try{
      const cfg = (window && window.CONFIG) ? window.CONFIG : {};
      const ls = localStorage.getItem('jihua_geo_mode') || '';
      const v = String(ls || cfg.GEO_MODE || 'stable').toLowerCase(); // default to 'stable' to avoid frequent timeouts
      if (v==='stable' || v==='auto' || v==='nominatim') return v;
      return 'stable';
    }catch(_){ return 'stable'; }
  }, []);

  const dispatch = useDispatch();
  const { travelPlans, travelPlansLoading, travelPlansError, currentPlan, planSaving, planSaveError, planDeleting, planDeleteError, currentPlanError } = useSelector((state)=>({
    travelPlans: state.travelPlans,
    travelPlansLoading: state.travelPlansLoading,
    travelPlansError: state.travelPlansError,
    currentPlan: state.currentPlan,
    planSaving: state.planSaving,
    planSaveError: state.planSaveError,
    planDeleting: state.planDeleting,
    planDeleteError: state.planDeleteError,
    currentPlanError: state.currentPlanError,
  }));

  // ---- Map init ----
  useEffect(()=>{
    let canceled = false;
    loadLeaflet().then(()=>{
      if (canceled) return;
      const initialZoom = getRuntimeMapConfig().initialZoom;
      const L = window.L;
      const map = L.map(containerRef.current, { zoomAnimation:false, markerZoomAnimation:false, scrollWheelZoom:true })
        .setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], initialZoom);

      const applyTile = (key)=>{
        const defaultTile = { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution:'&copy; OpenStreetMap contributors', subdomains:['a','b','c'] };
        const builtInTiles = {
          default: defaultTile,
          amap: { url:'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}', attribution:'© 高德地图(仅供开发调试)', subdomains:['1','2','3','4'] },
          geoqBlue: { url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}', attribution:'© GeoQ' },
          geoqGray: { url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}', attribution:'© GeoQ' },
          geoqWarm: { url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetWarm/MapServer/tile/{z}/{y}/{x}', attribution:'© GeoQ' },
          esriStreet: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', attribution:'© Esri' },
          esriImagery: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution:'© Esri' },
          tdtVec: hasTdtToken()?{ compose:[
            { url:'https://t{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=vec&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
            { url:'https://t{s}.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=cva&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
          ], attribution:'© 天地图' } : undefined,
          tdtImg: hasTdtToken()?{ compose:[
            { url:'https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=img&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
            { url:'https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=cia&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
          ], attribution:'© 天地图' } : undefined,
        };
        const chooseFallback = ()=>{
          const stage = fallbackStageRef.current;
          fallbackStageRef.current = stage + 1;
          if (stage === 0) return 'amap';
          if (stage === 1 && hasTdtToken()) return 'tdtVec';
          if (stage === 1 && !hasTdtToken()) return 'esriStreet';
          if (stage === 2) return 'esriStreet';
          if (stage === 3) return 'esriImagery';
          return 'default';
        };
        const { customTile } = getRuntimeMapConfig();
        let conf = defaultTile;
        if (key in builtInTiles && builtInTiles[key]) conf = builtInTiles[key];
        else if (key==='custom' && customTile.url){ conf = { url:customTile.url, attribution:customTile.attribution||defaultTile.attribution, subdomains:customTile.subdomains||defaultTile.subdomains }; }
        if (tileLayerRef.current) { try{ tileLayerRef.current.remove(); }catch(e){} tileLayerRef.current=null; }
        // 切换源时重置计数与回退阶段
        tileErrorCountRef.current = 0; fallbackAppliedRef.current = false; fallbackStageRef.current = 0;
        if (conf && conf.compose && Array.isArray(conf.compose)){
          const layers = conf.compose.map((c)=>{
            const opts = { attribution: conf.attribution||c.attribution, maxZoom:19, crossOrigin:true, updateWhenIdle:true };
            if (c.subdomains) opts.subdomains = c.subdomains;
            const lyr = L.tileLayer(c.url, opts);
            lyr.on('tileerror', ()=>{
              if (fallbackAppliedRef.current) return;
              if (++tileErrorCountRef.current >= 2){
                fallbackAppliedRef.current = true;
                setTileKey(chooseFallback());
              }
            });
            return lyr;
          });
          tileLayerRef.current = L.layerGroup(layers).addTo(map);
        } else {
          const opts = { attribution: conf.attribution, maxZoom:19, crossOrigin:true, updateWhenIdle:true };
          if (conf.subdomains) opts.subdomains = conf.subdomains;
          const layer = L.tileLayer(conf.url, opts);
          layer.on('tileerror', ()=>{
            if (fallbackAppliedRef.current) return;
            if (++tileErrorCountRef.current >= 2){
              fallbackAppliedRef.current = true;
              setTileKey(chooseFallback());
            }
          });
          tileLayerRef.current = layer.addTo(map);
        }
      };
      applyTile(tileKey);

      mapRef.current = map;
      setMapReady(true);

      map.on('click', async (e)=>{
        const lat = e.latlng.lat; const lng = e.latlng.lng; const now = getNowDateTime();
        // If we're placing an existing unlocated item, consume this click
        if (placingRef.current){
          const targetId = placingRef.current; placingRef.current = null;
          // ensure marker added and coords set for that item
          let base = null;
          setItems((prev)=>{
            const next = prev.map((it)=>{
              if (it.id===targetId){ base = { ...it, lat, lng, unlocated: false }; return base; }
              return it;
            });
            return next;
          });
          if (base){
            try { addMarkerForItem(base); } catch(_){ }
            try{
              const info = await reverseGeocodeMultiDetailed(lat,lng);
              setItems((prev)=> prev.map((it)=> it.id===base.id?{...it, name: info.cn||it.name, nameLocal: info.local||'', city: info.city||'', province: info.province||'', country: info.country||'' }:it));
            }catch(_){ }
          }
          return;
        }
        // Default: quick add marker
        if (!window.confirm('在此位置添加标记点并加入行程？')) return;
        const tempItem = { id: uid(), placeId:'', name:'标记点', lat, lng, date: now.date, time: now.time, notes:'', nameLocal:'', city:'', province:'', country:'' };
        addMarkerForItem(tempItem);
        setItems((prev)=>[...prev, tempItem]);
        try{
          const info = await reverseGeocodeMultiDetailed(lat,lng);
          setItems((prev)=> prev.map((it)=> it.id===tempItem.id?{...it, name: info.cn||it.name, nameLocal: info.local||'', city: info.city||'', province: info.province||'', country: info.country||'' }:it));
        }catch(_){ }
      });

      // lazy cluster
      loadMarkerCluster().then(()=>{
        if (!window.L || !mapRef.current) return;
        const group = window.L.markerClusterGroup({ showCoverageOnHover:false, spiderfyOnMaxZoom:true, chunkedLoading:true, removeOutsideVisibleBounds:true });
        clusterGroupRef.current = group; map.addLayer(group);
        Object.values(markersRef.current).forEach((m)=>{ try{ group.addLayer(m); }catch(_){ } });
      }).catch(()=>{});

      // polylines group
      try{
        polylineGroupRef.current = window.L.layerGroup().addTo(map);
      }catch(_){ polylineGroupRef.current = null; }
    }).catch((e)=> setError(e.message));
    return ()=>{ canceled=true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tiles at runtime
  useEffect(()=>{
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    const defaultTile = { url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution:'&copy; OpenStreetMap contributors', subdomains:['a','b','c'] };
    const builtInTiles = {
      default: defaultTile,
      amap: { url:'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}', attribution:'© 高德地图(仅供开发调试)', subdomains:['1','2','3','4'] },
      geoqBlue: { url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}', attribution:'© GeoQ' },
      geoqGray: { url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}', attribution:'© GeoQ' },
      geoqWarm: { url:'https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetWarm/MapServer/tile/{z}/{y}/{x}', attribution:'© GeoQ' },
      esriStreet: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', attribution:'© Esri' },
      esriImagery: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution:'© Esri' },
      tdtVec: hasTdtToken()?{ compose:[
        { url:'https://t{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=vec&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
        { url:'https://t{s}.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=cva&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
      ], attribution:'© 天地图' } : undefined,
      tdtImg: hasTdtToken()?{ compose:[
        { url:'https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=img&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
        { url:'https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=cia&tilematrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles&tk='+window.CONFIG.TIANDITU_TOKEN, subdomains:['0','1','2','3','4','5','6','7'] },
      ], attribution:'© 天地图' } : undefined,
    };
    const { customTile } = getRuntimeMapConfig();
    let conf = defaultTile;
    if (tileKey in builtInTiles && builtInTiles[tileKey]) conf = builtInTiles[tileKey];
    else if (tileKey==='custom' && customTile.url){ conf = { url:customTile.url, attribution:customTile.attribution||defaultTile.attribution, subdomains:customTile.subdomains||defaultTile.subdomains }; }
    if (tileLayerRef.current){ try{ tileLayerRef.current.remove(); }catch(_){ } tileLayerRef.current=null; }
    // 切换源时重置计数与回退阶段
    tileErrorCountRef.current = 0; fallbackAppliedRef.current = false; fallbackStageRef.current = 0;
    const chooseFallback = ()=>{
      const stage = fallbackStageRef.current;
      fallbackStageRef.current = stage + 1;
      if (stage === 0) return 'amap';
      if (stage === 1 && hasTdtToken()) return 'tdtVec';
      if (stage === 1 && !hasTdtToken()) return 'esriStreet';
      if (stage === 2) return 'esriStreet';
      if (stage === 3) return 'esriImagery';
      return 'default';
    };
    if (conf && conf.compose && Array.isArray(conf.compose)){
      const layers = conf.compose.map((c)=>{
        const opts = { attribution: conf.attribution||c.attribution, maxZoom:19, crossOrigin:true, updateWhenIdle:true };
        if (c.subdomains) opts.subdomains = c.subdomains;
        const lyr = L.tileLayer(c.url, opts);
        lyr.on('tileerror', ()=>{
          if (fallbackAppliedRef.current) return;
          if (++tileErrorCountRef.current >= 2){ fallbackAppliedRef.current = true; setTileKey(chooseFallback()); }
        });
        return lyr;
      });
      tileLayerRef.current = L.layerGroup(layers).addTo(mapRef.current);
    } else {
      const opts = { attribution: conf.attribution, maxZoom:19, crossOrigin:true, updateWhenIdle:true };
      if (conf.subdomains) opts.subdomains = conf.subdomains;
      const layer = L.tileLayer(conf.url, opts);
      layer.on('tileerror', ()=>{
        if (fallbackAppliedRef.current) return;
        if (++tileErrorCountRef.current >= 2){ fallbackAppliedRef.current = true; setTileKey(chooseFallback()); }
      });
      tileLayerRef.current = layer.addTo(mapRef.current);
    }
  }, [tileKey]);

  const addMarkerForItem = useCallback((item)=>{
    if (!mapRef.current || !window.L) return;
    const marker = window.L.marker([item.lat, item.lng], { draggable:true });
    if (clusterGroupRef.current && clusterGroupRef.current.addLayer){ try{ clusterGroupRef.current.addLayer(marker);}catch(_){ marker.addTo(mapRef.current);} }
    else { marker.addTo(mapRef.current); }
    marker.on('dragend', async (e)=>{
      const latlng = e.target.getLatLng();
      setItems((prev)=> prev.map((it)=> it.id===item.id?{...it, lat:latlng.lat, lng:latlng.lng}:it));
      try{
        const info = await reverseGeocodeMultiDetailed(latlng.lat, latlng.lng);
        setItems((prev)=> prev.map((it)=> it.id===item.id?{...it, name: info.cn||it.name, nameLocal: info.local||'', city: info.city||'', province: info.province||'', country: info.country||'' }:it));
      }catch(_){ }
    });
    markersRef.current[item.id]=marker;
  }, []);

  useEffect(()=>{
    if (!window.L) return;
    items.forEach((it, idx)=>{
      const m = markersRef.current[it.id]; if (!m) return;
      const icon = window.L && window.L.divIcon ? window.L.divIcon({ className:'marker-index-icon', html:`<div>${idx+1}</div>`, iconSize:[24,24], iconAnchor:[12,12] }) : undefined;
      if (icon) m.setIcon(icon);
    });
  }, [items]);

  const removeItem = (id)=>{
    setItems((prev)=> prev.filter((it)=> it.id!==id));
    const m = markersRef.current[id];
    if (m){
      if (clusterGroupRef.current && clusterGroupRef.current.removeLayer){ try{ clusterGroupRef.current.removeLayer(m);}catch(_){ try{ m.remove(); }catch(_){ } } }
      else { try{ m.remove(); }catch(_){ } }
      delete markersRef.current[id];
    }
  };

  const moveItem = (index, dir)=>{
    setItems((prev)=>{
      const next = prev.slice(); const ni = index+dir; if (ni<0 || ni>=next.length) return prev; const [moved]=next.splice(index,1); next.splice(ni,0,moved); return next;
    });
  };
  const reorder = (from,to)=>{ if (from==null || to==null || from===to) return; setItems((prev)=>{ const next=prev.slice(); if(from<0||from>=next.length||to<0||to>=next.length) return prev; const [m]=next.splice(from,1); next.splice(to,0,m); return next; }); };
  const updateItemField = (id, field, value)=>{ setItems((prev)=> prev.map((it)=> it.id===id?{...it,[field]:value}:it)); };

  // quick set transport mode into notes
  const applyTransportMode = useCallback((id, mode)=>{
    setItems(prev=>{
      const idx = prev.findIndex(it=>it.id===id); if (idx<0) return prev;
      const it = prev[idx];
      let notes = String(it.notes||'');
      const re = /(交通：)([^。；;，,\n]*)/;
      if (re.test(notes)){
        notes = notes.replace(re, (_, p1)=> `${p1}${mode}`);
      } else if (notes.trim()) {
        notes = notes + ` · 交通：${mode}`;
      } else {
        notes = `交通：${mode}`;
      }
      const next = prev.slice(); next[idx] = { ...it, notes };
      return next;
    });
  }, []);

  const reverseGeocode = async (lat,lng)=>{
    const key = lat.toFixed(5)+','+lng.toFixed(5);
    if (reverseCache.has(key)) return reverseCache.get(key);
    const mode = getGeoMode();
    if (mode==='stable'){
      // Use BigDataCloud only to avoid timeouts and console errors
      try{
        const bdc = await gateReverse(()=> withRetry(()=> axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
          params:{ latitude: lat, longitude: lng, localityLanguage:'zh' }, timeout:5000
        }), { retries:1, baseDelay:500 }));
        const d = bdc.data||{};
        const city = d.locality || d.city || '';
        const province = d.principalSubdivision || '';
        const country = d.countryName || '';
        const name = [city, province, country].filter(Boolean).join(' · ') || country || province || city || '';
        if (name){ reverseCache.set(key, name); return name; }
        return '';
      }catch(_){ return ''; }
    }
    // Use Nominatim reverse geocoding primarily (Photon reverse has CORS/404 issues); fallback to BigDataCloud
    const nomi = gateReverse(()=> withRetry(()=> axios.get('https://nominatim.openstreetmap.org/reverse', {
      params:{ format:'jsonv2', lat, lon:lng, addressdetails:1 },
      headers:{ 'Accept':'application/json','Accept-Language':'zh-CN' }, timeout:6000
    }), { retries:1, baseDelay:600 })).then(res=>{ const d=res.data||{}; const addr = d.address||null; const disp=d.display_name||''; return formatCnAddress(addr, disp); });
    try{
      const name = await nomi; reverseCache.set(key, name); return name;
    }catch(_){
      // Fallback: BigDataCloud (no key, CORS-friendly)
      try{
        const bdc = await gateReverse(()=> withRetry(()=> axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
          params:{ latitude: lat, longitude: lng, localityLanguage:'zh' }, timeout:5000
        }), { retries:1, baseDelay:500 }));
        const d = bdc.data||{};
        const city = d.locality || d.city || '';
        const province = d.principalSubdivision || '';
        const country = d.countryName || '';
        const name = [city, province, country].filter(Boolean).join(' · ') || country || province || city || '';
        if (name){ reverseCache.set(key, name); return name; }
      }catch(__){ }
      return '';
    }
  };

  // Enhanced reverse geocode with bilingual details and city/province
  const reverseGeocodeMultiDetailed = async (lat,lng)=>{
    const key = lat.toFixed(5)+','+lng.toFixed(5);
    if (reverseCache.has('cn:'+key) && reverseCacheEn.has('en:'+key)){
      const cn = reverseCache.get('cn:'+key); const en = reverseCacheEn.get('en:'+key);
      const meta = reverseCache.get('meta:'+key) || {};
      return { cn, local: en, ...meta };
    }
    const mode = getGeoMode();
    if (mode==='stable'){
      try{
        const bdc = await gateReverse(()=> withRetry(()=> axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
          params:{ latitude: lat, longitude: lng, localityLanguage:'zh' }, timeout:6000
        }), { retries:1, baseDelay:600 }));
        const d = bdc.data || {};
        const city = d.locality || d.city || (d.localityInfo && d.localityInfo.locality && d.localityInfo.locality.name) || '';
        const province = d.principalSubdivision || '';
        const country = d.countryName || '';
        const cn = [city, province, country].filter(Boolean).join(' · ') || country || province || city || '';
        const local = cn;
        const meta = { city: city || '', province: province || '', country: country || '' };
        reverseCache.set('cn:'+key, cn); reverseCacheEn.set('en:'+key, local); reverseCache.set('meta:'+key, meta);
        return { cn, local, ...meta };
      }catch(_){ return { cn:'', local:'', city:'', province:'', country:'' }; }
    }
    const nomi = gateReverse(()=> withRetry(()=> axios.get('https://nominatim.openstreetmap.org/reverse', {
      params:{ format:'jsonv2', lat, lon:lng, addressdetails:1, namedetails:1 },
      headers:{ 'Accept':'application/json', 'Accept-Language':'zh-CN' }, timeout:7000
    }), { retries:1, baseDelay:700 })).then(res=>{
      const d=res.data||{}; const addr=d.address||{}; const cn=formatCnAddress(addr,d.display_name||'');
      const named = (d.namedetails||{});
      // prefer local/native name from namedetails
      const local = named['name:zh'] || named['name:zh-CN'] || named['name:en'] || named.name || d.display_name || '';
      const meta = {
        city: addr.city || addr.town || addr.village || addr.county || addr.city_district || '',
        province: addr.state || addr.province || '',
        country: addr.country || ''
      };
      reverseCache.set('cn:'+key, cn); reverseCacheEn.set('en:'+key, local); reverseCache.set('meta:'+key, meta);
      return { cn, local, ...meta };
    });
    try{ return await nomi; }catch(_){
      // Fallback: BigDataCloud (no key)
      try{
        const bdc = await gateReverse(()=> withRetry(()=> axios.get('https://api.bigdatacloud.net/data/reverse-geocode-client', {
          params:{ latitude: lat, longitude: lng, localityLanguage:'zh' }, timeout:6000
        }), { retries:1, baseDelay:600 }));
        const d = bdc.data || {};
        const city = d.locality || d.city || (d.localityInfo && d.localityInfo.locality && d.localityInfo.locality.name) || '';
        const province = d.principalSubdivision || '';
        const country = d.countryName || '';
        const cn = [city, province, country].filter(Boolean).join(' · ') || country || province || city || '';
        const local = cn; // 没有英文名时，退化为中文
        const meta = { city: city || '', province: province || '', country: country || '' };
        reverseCache.set('cn:'+key, cn); reverseCacheEn.set('en:'+key, local); reverseCache.set('meta:'+key, meta);
        return { cn, local, ...meta };
      }catch(__){ return { cn:'', local:'', city:'', province:'', country:'' }; }
    }
  };

  // ---- Sagas integration ----
  const loadPlans = useCallback(()=>{ dispatch({ type:'TRAVEL_PLANS_FETCH_REQUEST' }); }, [dispatch]);
  const loadPlanDetail = useCallback((id)=>{ if(!id) return; dispatch({ type:'TRAVEL_PLAN_FETCH_REQUEST', payload:id }); }, [dispatch]);
  const savePlan = useCallback(()=>{ if(!planName.trim()){ setError('请输入计划名称'); return; } setError(''); dispatch({ type:'TRAVEL_PLAN_SAVE_REQUEST', payload:{ id:planId, name:planName.trim(), items } }); }, [dispatch, planId, planName, items]);
  const newPlan = ()=>{ setPlanId(null); setPlanName('我的旅行计划'); setItems([]); if (clusterGroupRef.current && clusterGroupRef.current.clearLayers){ try{ clusterGroupRef.current.clearLayers(); }catch(_){ } } Object.values(markersRef.current).forEach((m)=>{ try{ m.remove(); }catch(_){ } }); markersRef.current = {}; };
  const deletePlan = useCallback(()=>{ if(!planId) return newPlan(); dispatch({ type:'TRAVEL_PLAN_DELETE_REQUEST', payload:planId }); }, [dispatch, planId]);
  const confirmDeletePlan = useCallback(()=>{
    if (!planId) return newPlan();
    if (!window.confirm('确认删除该计划？')) return;
    if (!window.confirm('再次确认：删除后无法恢复，确定吗？')) return;
    dispatch({ type:'TRAVEL_PLAN_DELETE_REQUEST', payload:planId });
  }, [dispatch, planId]);
  const confirmDeleteItem = (id)=>{
    if (!window.confirm('确认删除该地点？')) return;
    if (!window.confirm('再次确认：删除后无法恢复，确定吗？')) return;
    removeItem(id);
  };
  const confirmNewPlan = ()=>{
    if (!items.length) { newPlan(); return; }
    if (!window.confirm('确认新建并清空当前编辑内容？')) return;
    newPlan();
  };

  // long-press context menu helpers
  const openContextMenu = useCallback((x, y, itemId)=>{
    setMenu({ show:true, x, y, itemId });
  }, []);
  const closeContextMenu = useCallback(()=>{
    setMenu({ show:false, x:0, y:0, itemId:null });
  }, []);
  const bindLongPress = (itemId)=>({
    onMouseDown: (e)=>{
      if (lpTimerRef.current) clearTimeout(lpTimerRef.current);
      const { clientX, clientY } = e;
      lpTimerRef.current = setTimeout(()=> openContextMenu(clientX, clientY, itemId), 550);
    },
    onMouseUp: ()=>{ if (lpTimerRef.current) clearTimeout(lpTimerRef.current); },
    onMouseLeave: ()=>{ if (lpTimerRef.current) clearTimeout(lpTimerRef.current); },
    onTouchStart: (e)=>{
      if (lpTimerRef.current) clearTimeout(lpTimerRef.current);
      const t = e.touches && e.touches[0];
      const cx = t ? t.clientX : 0; const cy = t ? t.clientY : 0;
      lpTimerRef.current = setTimeout(()=> openContextMenu(cx, cy, itemId), 550);
    },
    onTouchEnd: ()=>{ if (lpTimerRef.current) clearTimeout(lpTimerRef.current); },
    onTouchMove: ()=>{ if (lpTimerRef.current) clearTimeout(lpTimerRef.current); },
  });

  useEffect(()=>{
    if (!currentPlan) return;
    if (clusterGroupRef.current && clusterGroupRef.current.clearLayers){ try{ clusterGroupRef.current.clearLayers(); }catch(_){ } }
    Object.values(markersRef.current).forEach((m)=>{ try{ m.remove(); }catch(_){ } }); markersRef.current={};
    setPlanId(currentPlan.id||null); setPlanName(currentPlan.name||'未命名计划');
    const list = Array.isArray(currentPlan.items)? currentPlan.items : [];
    setItems(list);
    setTimeout(()=>{ list.forEach((it)=> addMarkerForItem(it)); if (list[0] && mapRef.current) mapRef.current.setView([list[0].lat, list[0].lng], getRuntimeMapConfig().initialZoom); },0);
  }, [currentPlan, addMarkerForItem]);

  // remember showExtra preference
  useEffect(()=>{ try{ localStorage.setItem('jihua_show_extra', showExtra?'1':'0'); }catch(_){ } }, [showExtra]);

  // supplies memo: load/save from localStorage per plan
  useEffect(()=>{
    const key = 'jihua_supplies_'+(planId||'__temp');
    const saved = localStorage.getItem(key);
    if (saved!=null){ setSuppliesText(saved); }
    else { setSuppliesText(defaultSuppliesTemplate()); }
    return ()=>{};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);
  useEffect(()=>{
    if (!showSupplies) return; // save on typing when modal open
    if (suppliesDebounceRef.current) clearTimeout(suppliesDebounceRef.current);
    suppliesDebounceRef.current = setTimeout(()=>{
      try{ localStorage.setItem('jihua_supplies_'+(planId||'__temp'), suppliesText); }catch(_){ }
    }, 400);
  }, [suppliesText, showSupplies, planId]);
  // persist my templates
  useEffect(()=>{
    try { localStorage.setItem('jihua_supplies_templates', JSON.stringify(myTemplates.slice(0, 100))); } catch(_){}
  }, [myTemplates]);

  function defaultSuppliesTemplate(){
    return ['证件：身份证/护照/签证','电子：手机/充电宝/充电器/数据线','衣物：外套/换洗衣物/雨具','洗护：牙刷牙膏/洗面奶/毛巾','药品：感冒药/肠胃药/创可贴','其他：水杯/太阳镜/防晒/伞'].map(s=>'- '+s).join('\n');
  }
  function getSuppliesTemplate(type){
    switch(type){
      case 'domestic':
        return ['证件：身份证/驾驶证','交通：机票/火车票/公交卡','支付：现金/银行卡/移动支付','衣物：换洗衣物/外套/雨具','洗护：牙刷牙膏/洗面奶/毛巾/护肤','药品：感冒药/肠胃药/晕车药/创可贴','电子：手机/充电宝/充电器/耳机','其他：水杯/太阳镜/防晒/伞/口罩'].map(s=>'- '+s).join('\n');
      case 'abroad':
        return ['证件：护照/签证/行程单/保险','支付：双币信用卡/部分现金','通讯：境外流量卡/随身WiFi','电源：万能转换插头/排插','语言：常用语/离线地图','衣物：换洗衣物/外套/雨具','洗护：牙刷牙膏/洗面奶/毛巾','药品：感冒药/肠胃药/创可贴/常备药','其他：水杯/太阳镜/防晒/伞'].map(s=>'- '+s).join('\n');
      case 'hiking':
        return ['背包/登山杖/头灯','保暖：速干衣/抓绒/冲锋衣','鞋袜：登山鞋/备用袜子/护膝','饮食：水/能量棒/压缩饼干','导航：离线地图/GPS/指南针','防晒/防蚊','简易医药包','应急：太空毯/哨子/打火机'].map(s=>'- '+s).join('\n');
      case 'camp':
        return ['帐篷/防潮垫/睡袋','照明：营灯/头灯','炊具：炉头/气罐/打火机/锅具','食品：即食/调料/水','工具：小刀/胶带/绳子','卫生：纸巾/湿巾/垃圾袋','保暖：外套/毛毯','其他：驱蚊/防晒/药品'].map(s=>'- '+s).join('\n');
      default:
        return defaultSuppliesTemplate();
    }
  }

  // Supplies: my templates actions
  const saveSuppliesAsTemplate = useCallback(()=>{
    let name = window.prompt('输入模板名称', selectedTplName || planName || '我的模板');
    if (!name) return; name = name.trim(); if (!name) return;
    if (myTemplates.some(t=>t.name===name)){
      if (!window.confirm('同名模板已存在，是否覆盖？')) return;
    }
    const payload = { name, text: suppliesText };
    setMyTemplates(prev=>{
      const filtered = prev.filter(t=> t.name!==name);
      const next = [...filtered, payload].sort((a,b)=> a.name.localeCompare(b.name));
      return next;
    });
    setSelectedTplName(name);
  }, [myTemplates, suppliesText, selectedTplName, planName]);

  const deleteSelectedTemplate = useCallback(()=>{
    if (!selectedTplName) return;
    if (!window.confirm(`删除模板 "${selectedTplName}"？`)) return;
    setMyTemplates(prev=> prev.filter(t=> t.name!==selectedTplName));
    setSelectedTplName('');
  }, [selectedTplName]);

  // per-day exports
  const exportDayGeoJSON = useCallback((day)=>{
    const group = items.filter(it=> (it.date||'')===day);
    const features = group.map((it,idx)=>({ type:'Feature', properties:{ index: idx+1, name: it.name, nameLocal: it.nameLocal||'', time: (it.date||'')+' '+(it.time||'') }, geometry:{ type:'Point', coordinates:[it.lng, it.lat] } }));
    // line
    if (group.length>=2){ features.push({ type:'Feature', properties:{ name:'Path' }, geometry:{ type:'LineString', coordinates: group.map(it=>[it.lng,it.lat]) } }); }
    const geo = { type:'FeatureCollection', features };
    const blob=new Blob([JSON.stringify(geo,null,2)],{type:'application/geo+json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${(planName||'计划').replace(/[\\/:*?"<>|]/g,'_')}-${day}.geojson`; a.click(); URL.revokeObjectURL(url);
  }, [items, planName]);
  const exportDayGPX = useCallback((day)=>{
    const group = items.filter(it=> (it.date||'')===day);
    const nameSafe = (planName||'计划').replace(/[\\/:*?"<>|]/g,'_');
    const header = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="JihuaPlanner" xmlns="http://www.topografix.com/GPX/1/1">`;
    const wpts = group.map((it,idx)=> `<wpt lat="${it.lat}" lon="${it.lng}"><name>${idx+1}. ${escapeXml(it.name||'')}</name><desc>${escapeXml(((it.date||'')+' '+(it.time||'')).trim())}</desc></wpt>`).join('');
    const trk = group.length? `<trk><name>${escapeXml(nameSafe+' '+day)}</name><trkseg>${group.map(it=>`<trkpt lat="${it.lat}" lon="${it.lng}"></trkpt>`).join('')}</trkseg></trk>` : '';
    const xml = header + wpts + trk + '</gpx>';
    const blob=new Blob([xml],{type:'application/gpx+xml'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${nameSafe}-${day}.gpx`; a.click(); URL.revokeObjectURL(url);
  }, [items, planName]);
  function escapeXml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }

  const exportDayPNG = useCallback(async (day)=>{
    try{
      const h2c = await loadHtml2Canvas();
      const el = document.getElementById('day-'+day);
      if (!el) { setError('未找到该天内容'); return; }
      const canvas = await h2c(el, { backgroundColor: null, scale: Math.min(2, window.devicePixelRatio||1), useCORS:true });
      const blob = await new Promise((res)=> canvas.toBlob((b)=> res(b), 'image/png'));
      const url = URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=`${(planName||'计划').replace(/[\/:*?"<>|]/g,'_')}-${day}.png`; a.click(); URL.revokeObjectURL(url);
    }catch(e){ setError('导出图片失败：'+(e && e.message || e)); }
  }, [planName]);

  const addQuickDayNote = useCallback((day)=>{
    const last = items[items.length-1];
    const lat = last? last.lat : (mapRef.current? mapRef.current.getCenter().lat : DEFAULT_CENTER.lat);
    const lng = last? last.lng : (mapRef.current? mapRef.current.getCenter().lng : DEFAULT_CENTER.lng);
    const now = getNowDateTime();
    const item = { id:uid(), placeId:'', name:'当天备注', nameLocal:'', lat, lng, date: day, time: now.time, notes:'当天备注：' };
    setItems(prev=> [...prev, item]);
  }, [items]);

  // ---- Search ----
  const searchCancelRef = useRef(null);
  const searchReqIdRef = useRef(0);
  const [searching,setSearching]=useState(false);
  const [suggIndex, setSuggIndex] = useState(-1);
  const doSearch = useCallback(async(q)=>{
    const query=(q||'').trim(); if(!query || query.length<2){ setSuggestions([]); return; }
    const hasCJK = /[\u4e00-\u9fff\u3040-\u30ff]/.test(query); // 中文/日文字符
    const qLower = query.toLowerCase();
    // 常见中文地名的外文别名（用于排序加权）
    const aliasMap = {
      '大阪': ['osaka'],
      '东京': ['tokyo'],
      '京都': ['kyoto'],
      '名古屋': ['nagoya'],
      '札幌': ['sapporo'],
      '福冈': ['fukuoka'],
      '横滨': ['yokohama'],
      '神户': ['kobe'],
      '冲绳': ['okinawa'],
    };
    const aliases = aliasMap[query] || [];
    // cache key includes bounds mode
    let boundsKey='global'; let viewboxParam=''; let photonBBoxParam=''; let overpassBBoxParam='';
    let zoomNow = null;
    if (useMapBounds && mapRef.current){
      const b = mapRef.current.getBounds(); const west=b.getWest().toFixed(3), east=b.getEast().toFixed(3), north=b.getNorth().toFixed(3), south=b.getSouth().toFixed(3);
      // 使用 viewbox：仅在放大很深且中文/日文查询时才带 bounded=1；否则不附带 viewbox，避免 Nominatim 连接重置或误判
      const z = mapRef.current.getZoom ? mapRef.current.getZoom() : 0; zoomNow = z;
      const shouldBound = hasCJK && (query.length>=3) && z>=12;
      viewboxParam = shouldBound ? `&viewbox=${west},${north},${east},${south}&bounded=1` : '';
  // Photon bbox uses left,bottom,right,top
  photonBBoxParam = `${west},${south},${east},${north}`;
      // Overpass 需要 south,west,north,east
      overpassBBoxParam = `${south},${west},${north},${east}`;
      const c = mapRef.current.getCenter();
      const latGrid = (Math.round(c.lat*2)/2).toFixed(1);
      const lngGrid = (Math.round(c.lng*2)/2).toFixed(1);
      const zoomQ = Math.round(z);
      const adminTag = lastAdminRef.current && lastAdminRef.current.tag ? `|adm:${lastAdminRef.current.tag}` : '';
      boundsKey = `${latGrid},${lngGrid},z${zoomQ}${adminTag}`;
      // 异步刷新 adminTag（2 分钟或位移>0.5° 刷新一次）
      const needAdmin = (!lastAdminRef.current.tag) || (Math.abs((lastAdminRef.current.lat||0)-c.lat)>0.5) || (Math.abs((lastAdminRef.current.lng||0)-c.lng)>0.5) || (Date.now() - (lastAdminRef.current.t||0) > 120000);
      if (needAdmin){
        reverseGeocodeMultiDetailed(c.lat, c.lng).then(info=>{
          const tag = `${info.city||''}_${info.province||''}`.replace(/\s+/g,'');
          lastAdminRef.current = { tag, lat:c.lat, lng:c.lng, t: Date.now() };
        }).catch(()=>{});
      }
    }
    const cacheKey=query+'|'+boundsKey;
    if (searchCache.has(cacheKey)){ setSuggestions(searchCache.get(cacheKey)); return; }
    if (searchCancelRef.current) searchCancelRef.current.cancel('cancelled');
    const source = axios.CancelToken.source(); searchCancelRef.current=source; setSearching(true);
    const reqId = ++searchReqIdRef.current;
    const t0 = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
    // providers in parallel; first fulfilled wins, others merge later
    const mode = getGeoMode();
    const nomiEnabled = (mode !== 'stable') && (Date.now() > (nomiBlockedUntilRef.current||0));
  const promises = [];
    // Nominatim for search (shorter timeout). Disabled in stable mode or when circuit breaker is active.
  // 对部分常见日文地名（如“大阪”）提示国家为日本，减少误命中
  const jpHint = hasCJK && /大阪|东京|京都|名古屋|札幌|福冈|冲绳|神户|横滨/.test(query) ? '&countrycodes=jp' : '';
    const nomiBase = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=zh-CN${jpHint}&q=${encodeURIComponent(query)}`;
    const p1 = nomiEnabled
      ? gateNominatim(()=> withRetry(()=> axios.get(nomiBase + viewboxParam,{ headers:{'Accept':'application/json'}, timeout:1500, cancelToken:source.token })
        .catch(()=> axios.get(nomiBase, { headers:{'Accept':'application/json'}, timeout:1500, cancelToken:source.token })), { retries:1, baseDelay:500 }))
        .then(res=> Array.isArray(res.data)?res.data:[])
        .catch((e)=>{ nomiBlockedUntilRef.current = Date.now() + 3*60*1000; return []; })
      : Promise.resolve([]);
    // Address-like prioritized search (street + nearby POI) — run in parallel and may return early
    const pAddr = searchAddressAssist(query, mapRef, useMapBounds, source.token).catch(()=>[]);
    // Overpass API 作为无钥匙回退（基于当前视图），匹配 name:zh 或 name，返回节点/道路/关系的中心点
    const escapeRegex = (s)=> String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    // 仅在放大足够且查询较具体时才启用 Overpass，避免拖慢首屏
    const overpassQL = (useMapBounds && overpassBBoxParam && zoomNow!=null && zoomNow>=12 && (hasCJK || query.length>=3)) ?
      `[out:json][timeout:12];\n(
        node["name:zh"~"${escapeRegex(query)}",i](${overpassBBoxParam});\n
        way["name:zh"~"${escapeRegex(query)}",i](${overpassBBoxParam});\n
        relation["name:zh"~"${escapeRegex(query)}",i](${overpassBBoxParam});\n
        node["name"~"${escapeRegex(query)}",i](${overpassBBoxParam});\n
        way["name"~"${escapeRegex(query)}",i](${overpassBBoxParam});\n
        relation["name"~"${escapeRegex(query)}",i](${overpassBBoxParam});\n
      );\nout center 30;` : '';
    const p2 = overpassQL ? axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(overpassQL)}`, {
        headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, timeout:8000, cancelToken:source.token
      }).catch(()=> axios.post('https://overpass.kumi.systems/api/interpreter', `data=${encodeURIComponent(overpassQL)}`, { headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, timeout:8000, cancelToken:source.token }))
      .then(res=>{
        const els = (res.data && res.data.elements) || [];
        return els.slice(0, 30).map(el=>{
          const tags = el.tags||{}; const nameZh = tags['name:zh']; const name = tags.name || nameZh || '';
          const lat = el.lat!=null ? el.lat : (el.center && el.center.lat);
          const lon = el.lon!=null ? el.lon : (el.center && el.center.lon);
          return { place_id: null, osm_id: el.id, display_name: nameZh || name || '未命名', lat: String(lat||'0'), lon: String(lon||'0') };
        }).filter(d=> d.lat!=='0' && d.lon!=='0');
      }).catch(()=>[]) : Promise.resolve([]);
    // Photon provider disabled due to frequent 400 Bad Request for Chinese queries; relying on Nominatim + Open-Meteo
    // Open-Meteo Geocoding as a no-key fallback (best for cities)
    const p3 = axios.get('https://geocoding-api.open-meteo.com/v1/search',{
        params:{ name:query, count:8, language:'zh', format:'json' },
        timeout:5000, cancelToken:source.token
      })
      .then(res=>{ const arr=(res.data&&res.data.results)||[]; return arr.map(r=>({ place_id:null, osm_id:null, display_name:[r.name, r.admin1, r.country].filter(Boolean).join(' · '), lat:String(r.latitude), lon:String(r.longitude) })); });
    // AMap (Gaode) Place Text API — requires window.CONFIG.AMAP_KEY; returns GCJ-02 which we convert to WGS84
    const amapKey = getAmapKey();
    const pAmap = amapKey ? axios.get('https://restapi.amap.com/v5/place/text', {
        params: {
          key: amapKey,
          keywords: query,
          types: '', // allow all
          city: '',  // nationwide
          page_size: 10,
          page_num: 1,
          // output defaults to JSON
        },
        timeout: 5000, cancelToken: source.token
      }).then(res=>{
        const pois = (res.data && res.data.pois) || [];
        return pois.map(p=>{
          let lat = 0, lon = 0;
          if (p.location){
            const [x, y] = String(p.location).split(',');
            lon = parseFloat(x); lat = parseFloat(y);
            // Convert GCJ-02 -> WGS84 for map alignment
            const [wgsLon, wgsLat] = gcj02ToWgs84(lon, lat);
            lon = wgsLon; lat = wgsLat;
          }
          const name = p.name || '';
          const ad = [p.cityname||'', p.adname||'', p.address||''].filter(Boolean).join(' ');
          return { place_id: p.id||null, osm_id: null, display_name: ad ? `${name} · ${ad}` : name, lat: String(lat), lon: String(lon) };
        }).filter(d=> isFinite(parseFloat(d.lat)) && isFinite(parseFloat(d.lon)));
      }).catch(()=>[]) : Promise.resolve([]);
    // 若命中别名（如“大阪”→ osaka），追加一次别名查询提升召回
    const aliasQuery = aliases.length? aliases[0] : '';
    const pAlias = aliasQuery ? gateNominatim(()=> withRetry(()=> axios.get(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&accept-language=zh-CN&q=${encodeURIComponent(aliasQuery)}`, { headers:{'Accept':'application/json'}, timeout:3500, cancelToken:source.token }), { retries:1, baseDelay:400 }))
      .then(res=> Array.isArray(res.data)?res.data:[]).catch(()=>[]) : Promise.resolve([]);
    const pAliasOM = aliasQuery ? axios.get('https://geocoding-api.open-meteo.com/v1/search',{ params:{ name: aliasQuery, count:6, language:'zh', format:'json' }, timeout:4500, cancelToken:source.token })
      .then(res=>{ const arr=(res.data&&res.data.results)||[]; return arr.map(r=>({ place_id:null, osm_id:null, display_name:[r.name, r.admin1, r.country].filter(Boolean).join(' · '), lat:String(r.latitude), lon:String(r.longitude) })); }).catch(()=>[]) : Promise.resolve([]);
    // Use Nominatim + Overpass(若有边界) + Open-Meteo + Alias 扩展（均无需 API Key）
  promises.push(pAddr, p1, p2, p3, pAlias, pAliasOM, pAmap);
    try{
      const safe = (p)=> p.then(v=>v).catch(()=>[]);
      let first = await Promise.race(promises.map(safe));
      // 立即显示首批结果，不阻塞于反向地理中文本地化
      const center = mapRef.current? mapRef.current.getCenter(): null;
      if (center && first.length){
        first = first.map((d,i)=>{
          const name = String(d.display_name||''); const nameL = name.toLowerCase();
          const matched = name.includes(query) || nameL.includes(qLower) || aliases.some(a=> nameL.includes(a));
          const dist = Math.hypot((parseFloat(d.lat)-center.lat), (parseFloat(d.lon)-center.lng));
          return { ...d, __m: matched?1:0, __dist: dist, __rank:i };
        }).sort((a,b)=> (b.__m - a.__m) || ((a.__dist||0)-(b.__dist||0)));
        first = first.map((d,i)=> ({...d, __rank:i}));
      }
      if (!first || first.length===0){
        // No direct hits: try address-like assist (street+nearby) without relying on GPS/map center
        try{
          const addrCandidates = await searchAddressAssist(query, { current: null }, false, source.token);
          if (Array.isArray(addrCandidates) && addrCandidates.length){
            first = addrCandidates.slice(0,1).map(d=> ({ ...d, __approx: true, display_name: d.display_name || `${query}（附近位置）` }));
          }
        }catch(_){ /* ignore */ }
        // If still nothing, approximate to detected city center only (do not use map/GPS center)
        if (!first || first.length===0){
          const cityToken = extractCityFromQuery(query);
          if (cityToken){
            const approx = await geocodeCityCenter(cityToken).catch(()=>null);
            if (approx){ first = [{ place_id:null, osm_id:null, display_name: `${query}（附近位置）`, lat: String(approx.lat), lon: String(approx.lng), __approx: true }]; }
          }
        }
      }
      if (reqId===searchReqIdRef.current){ lruSet(searchCache, cacheKey, first); setSuggestions(first); }
      // 在后台对首批少量结果做中文本地化，然后平滑更新
      (async ()=>{
        const tStart = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
        const topN = Math.min(locTopCountRef.current, 6, first.length);
        const copy = first.slice();
        for (let i=0;i<topN;i++){
          try{ const info = await reverseGeocodeMultiDetailed(parseFloat(copy[i].lat), parseFloat(copy[i].lon)); copy[i] = { ...copy[i], display_name: info.cn || copy[i].display_name }; }
          catch(_){ /* ignore */ }
          await sleep(revDelayRef.current);
        }
        const tEnd = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
        // 动态调整 localize 数量（使用者已有函数，但未被调用）
        try { adjustLocCount(tEnd - tStart, 0); } catch(_){ }
        if (reqId===searchReqIdRef.current){ lruSet(searchCache, cacheKey, copy); setSuggestions(copy); }
      })();
      // try merge the other quietly (no flicker)
      Promise.allSettled(promises).then(async (results)=>{
        if (reqId!==searchReqIdRef.current) return;
        const arr = results.reduce((acc,r)=>{ if (r.status==='fulfilled' && Array.isArray(r.value)) acc=acc.concat(r.value); return acc; }, []);
        // dedupe by lat/lon/name
        const seen=new Set(); const merged=[]; for(const d of arr){ const k=`${d.lat}|${d.lon}|${d.display_name}`; if(seen.has(k)) continue; seen.add(k); merged.push(d); }
        const center2 = mapRef.current? mapRef.current.getCenter(): null;
        let enriched = merged.map(d=>{
          const name = String(d.display_name||''); const nameL = name.toLowerCase();
          const matched = name.includes(query) || nameL.includes(qLower) || aliases.some(a=> nameL.includes(a));
          return { ...d, __dist: center2? Math.hypot((parseFloat(d.lat)-center2.lat), (parseFloat(d.lon)-center2.lng)) : 0, __m: matched?1:0 };
        });
        // 稳定排序：以现有 suggestions 的顺序为主，新项追加到末尾
        const rankMap = new Map();
        (suggestionsRef.current||[]).forEach((s,idx)=>{ const k=`${s.lat}|${s.lon}`; if(!rankMap.has(k)) rankMap.set(k, idx); });
        let nextRank = rankMap.size;
        enriched = enriched.map(d=>{ const k=`${d.lat}|${d.lon}`; const r = rankMap.has(k)? rankMap.get(k) : (nextRank++); return { ...d, __rank: r }; });
  enriched.sort((a,b)=> (b.__m - a.__m) || (a.__rank - b.__rank));
        // 后台中文本地化前 N 条（顺序保持不变）
        (async ()=>{
          const topN = Math.min(locTopCountRef.current, 10, enriched.length);
          for (let i=0;i<topN;i++){
            try{ const info = await reverseGeocodeMultiDetailed(parseFloat(enriched[i].lat), parseFloat(enriched[i].lon)); enriched[i] = { ...enriched[i], display_name: info.cn || enriched[i].display_name }; }
            catch(_){ }
            await sleep(revDelayRef.current);
          }
          if (reqId===searchReqIdRef.current){ lruSet(searchCache, cacheKey, enriched); setSuggestions(enriched); }
        })();
        lruSet(searchCache, cacheKey, enriched); setSuggestions(enriched);
        // 调整中文化节奏
        const t1 = (typeof performance!=='undefined' && performance.now)? performance.now() : Date.now();
        const fails = 0; // 后台阶段不统计失败数量，使用首阶段延时经验
        if ((t1 - t0) > 1500 || fails>2) revDelayRef.current = Math.min(500, Math.round(revDelayRef.current * 1.5));
        else revDelayRef.current = Math.max(100, Math.round(revDelayRef.current * 0.9));
      });
    }catch(e){ if(!axios.isCancel(e)){ setError('地点搜索失败'); setSuggestions([]);} }
    finally{ setSearching(false); }
  }, [useMapBounds]);
  const debounceTimer = useRef(null);
  const onSearchInputChange = (val)=>{ setSearchQuery(val); setSuggIndex(-1); if (debounceTimer.current) clearTimeout(debounceTimer.current); debounceTimer.current=setTimeout(()=>doSearch(val),280); };

  const chooseSuggestion = useCallback(async (s)=>{
    if (!s) return;
    const lat=parseFloat(s.lat), lng=parseFloat(s.lon); const now=getNowDateTime();
    const prev = items[items.length-1];
    const seg = prev? haversineKm(prev.lat, prev.lng, lat, lng) : 0;
    const baseInfo = await reverseGeocodeMultiDetailed(lat,lng).catch(()=>({ cn:s.display_name||'未命名', local:s.display_name||'未命名' }));
    const mode = prev? recommendTransport(seg, prev, baseInfo) : '';
    const approxNote = s.__approx ? '（按附近位置定位，建议在地图上精确放置）' : '';
    const defaultNotes = prev? `与上个地点直线距离约 ${seg.toFixed(1)} km · 交通：建议${mode}${approxNote?(' · '+approxNote):''}` : approxNote;
    const item={ id:uid(), placeId:String(s.place_id||s.osm_id||''), name:baseInfo.cn||s.display_name||'未命名地点', nameLocal: baseInfo.local||'', city: baseInfo.city||'', province: baseInfo.province||'', country: baseInfo.country||'', lat, lng, date:now.date, time:now.time, notes: defaultNotes, unlocated: !!s.__approx };
    addMarkerForItem(item); setItems((prev)=>[...prev,item]); setSuggestions([]); setSearchQuery(''); setSuggIndex(-1); if(mapRef.current) mapRef.current.setView([lat,lng], 14);
  }, [items]);

  const exportTxt = (name,list)=>{ const lines=[]; lines.push('计划名称: '+(name||'未命名')); lines.push(''); list.forEach((it,idx)=>{ lines.push((idx+1)+'. '+(it.name||'未命名地点')); lines.push(('   时间: '+(it.date||'')+' '+(it.time||'')).trim()); lines.push('   坐标: '+it.lat+', '+it.lng); if(it.notes) lines.push('   备注: '+it.notes); }); const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=((name||'旅行计划').replace(/[\\/:*?"<>|]/g,'_'))+'.txt'; a.click(); URL.revokeObjectURL(url); };
  const exportTxtWithDistances = (name, list, distances)=>{
    const lines=[]; lines.push('计划名称: '+(name||'未命名')); lines.push('');
    for(let i=0;i<list.length;i++){
      const it=list[i]; lines.push((i+1)+'. '+(it.name||'未命名地点'));
      lines.push(('   时间: '+(it.date||'')+' '+(it.time||'')).trim());
      lines.push('   坐标: '+it.lat+', '+it.lng);
      if (i>=1){ const d=distances && distances[i]; if (d) lines.push('   与上个地点距离: '+d.toFixed(1)+' km'); }
      if (it.notes) lines.push('   备注: '+it.notes);
    }
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=((name||'旅行计划').replace(/[\\/:*?"<>|]/g,'_'))+'.txt'; a.click(); URL.revokeObjectURL(url);
  };
  const exportMarkdown = (name, groups, distances)=>{
    const lines=[]; lines.push(`# ${(name||'旅行计划')}`); lines.push('');
    groups.forEach(g=>{
      lines.push(`## ${g.day||'未设日期'}  · 当天总距离 ${g.totalKm.toFixed(1)} km · 起止 ${g.start||''}${g.end?(' - '+g.end):''}`);
      g.entries.forEach(({item, index})=>{
        const d = distances && distances[index];
        lines.push(`- ${index+1}. ${item.date||''} ${item.time||''} · ${item.name||''}${d?` · 距上个 ${d.toFixed(1)} km`:''}`);
        lines.push(`  - 坐标: ${item.lat}, ${item.lng}`);
        if (item.notes) lines.push(`  - 备注: ${item.notes}`);
      });
      lines.push('');
    });
    const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=((name||'旅行计划').replace(/[\\/:*?"<>|]/g,'_'))+'.md'; a.click(); URL.revokeObjectURL(url);
  };
  const exportCSV = (name, list, distances)=>{
    const rows = [['序号','日期','时间','名称','纬度','经度','距上个(km)','备注']];
    for(let i=0;i<list.length;i++){
      const it=list[i]; const d = distances && distances[i];
      rows.push([String(i+1), it.date||'', it.time||'', (it.name||'').replace(/\n/g,' '), String(it.lat), String(it.lng), d?d.toFixed(1):'', (it.notes||'').replace(/\n/g,' ') ]);
    }
    const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=((name||'旅行计划').replace(/[\\/:*?"<>|]/g,'_'))+'.csv'; a.click(); URL.revokeObjectURL(url);
  };

  // Narrative export similar to Chinese itinerary text
  const exportNarrative = (name, list)=>{
    if (!Array.isArray(list) || !list.length){ alert('没有内容可导出'); return; }
    const groups = list.slice().sort((a,b)=>{
      const ad=(a.date||''); const bd=(b.date||''); if(ad!==bd) return ad<bd?-1:1; const at=(a.time||''); const bt=(b.time||''); return at<bt?-1:1; }).reduce((m,it)=>{ const d=it.date||''; (m[d]=m[d]||[]).push(it); return m; },{});
    const cnWeek = ['日','一','二','三','四','五','六'];
    const fmtHeader = (d)=>{ if(!d) return ''; try{ const dt=new Date(d.replace(/-/g,'/')); const m=dt.getMonth()+1; const dd=dt.getDate(); return `${m}月${dd}日周${cnWeek[dt.getDay()]}`; }catch(_){ return d; } };
    const toCnTime = (t)=>{ if(!t) return ''; const m=t.match(/^(\d{1,2}):(\d{2})$/); if(!m) return t; return `${parseInt(m[1],10)}点${m[2]}`; };
    const lines = [];
    if (name) lines.push(name);
    Object.keys(groups).sort().forEach((d)=>{
      lines.push('');
      lines.push(fmtHeader(d));
      let idx=1;
      for (const it of groups[d]){
        const type = it._type || 'poi';
        if (type === 'timeEvent'){
          if (it.notes && /^时间[:：]/.test(String(it.notes))){ lines.push(String(it.notes)); }
          else if (it.time && it.name){ lines.push(`时间：${toCnTime(it.time)}到达${it.name}`); }
          else if (it.time){ lines.push(`时间：${toCnTime(it.time)}`); }
          if (it.notes && !/^时间[:：]/.test(String(it.notes))){ lines.push(String(it.notes).trim()); }
          continue;
        }
        if (!it.name) continue;
        lines.push(`${idx++}，${it.name}`);
        if (it.notes){ lines.push(String(it.notes).trim()); }
      }
    });
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=((name||'旅行计划')+'-行程文案.txt').replace(/[\\/:*?\"<>|]/g,'_'); a.click(); URL.revokeObjectURL(url);
  };

  // Heuristic plan name from text and items
  const derivePlanName = async (rawText, items)=>{
    const text = String(rawText||'');
    const hasChangsha = /长沙/.test(text) || items.some(it=> /长沙/.test(it.name||''));
    const hasYueyang = /岳阳/.test(text) || items.some(it=> /岳阳|君山|洞庭/.test(it.name||''));
    if (hasChangsha && hasYueyang) return '长沙到岳阳旅行计划';
    // fallback: use first item city
    try{
      const first = items[0]; if (first){ const info = await reverseGeocodeMultiDetailed(first.lat, first.lng); if (info && info.city){ return `${info.city}旅行计划`; } }
    }catch(_){ }
    return '我的旅行计划';
  };

  // Parse Chinese itinerary text into entries: { name, time, notes, dateStr | dayIndex }
  const parseChineseItinerary = (text)=>{
    const linesSrc = String(text||'').split(/\r?\n/);
    const lines = [];
    for (let s of linesSrc){
      s = s.trim();
      if (!s) { lines.push(''); continue; }
      if (s === '↓') { lines.push(''); continue; } // treat arrow as separator
      lines.push(s);
    }
    const entries = [];
    const dayHeaderRe = /^(?:\d{1,2})月(?:\d{1,2})日(?:周[一二三四五六日天])?$/;
    const datePickRe = /(\d{1,2})月(\d{1,2})日/;
    const timeLineRe = /^时间[:：]\s*(.+)$/;
    const numberedRe = /^(\d{1,2})[，,、.]+\s*(.+)$/;
    const to24h = (s)=>{
      if (!s) return '';
      const m = s.match(/(上|下|中)?午?\s*(\d{1,2})\s*点(?:\s*(\d{1,2}))?(?:\s*半)?/);
      if (m){ let h=parseInt(m[2],10)||0; let mm=parseInt(m[3]||'0',10)||0; if(/下/.test(m[1]||'') && h<12) h+=12; /* '中午' 不强制调整 */ const p=(n)=>n<10?'0'+n:''+n; return `${p(h)}:${p(mm)}`; }
      const m2 = s.match(/(\d{1,2})[:：](\d{2})/); if (m2){ const p=(n)=>n<10?'0'+n:''+n; return `${p(parseInt(m2[1],10))}:${p(parseInt(m2[2],10))}`; }
      return '';
    };
    let currentDateStr = '';
    let pending = null; // {name,time,notes,dateStr,_type}
    let stashNotes = '';
    const pushPending = ()=>{ if(pending && pending.name){ entries.push({...pending}); } pending=null; };
    for (const raw of lines){
      if (!raw){ pushPending(); continue; }
      if (dayHeaderRe.test(raw)){
        pushPending();
        const m = raw.match(datePickRe); if (m){ const Y = new Date().getFullYear(); const mm=('0'+parseInt(m[1],10)).slice(-2); const dd=('0'+parseInt(m[2],10)).slice(-2); currentDateStr = `${Y}-${mm}-${dd}`; } else { currentDateStr=''; }
        continue;
      }
      const tline = raw.match(timeLineRe);
      if (tline){
        // e.g. 时间：13点40到达岳阳楼附近
        const body = tline[1];
        const t = to24h(body);
        const nameMatch = body.match(/到达\s*([^，。,\s]+)/) || body.match(/到\s*([^，。,\s]+)/);
        let place = nameMatch ? nameMatch[1] : '';
        if (/^\d/.test(place)) place = ''; // ignore pure time as place, e.g., 到12点
        pushPending();
        pending = { name: place || '', time: t||'', notes: raw, dateStr: currentDateStr||'', _type:'timeEvent' };
        continue;
      }
      const num = raw.match(numberedRe);
      if (num){
        pushPending();
        pending = { name: (num[2]||'').trim(), time:'', notes: stashNotes||'', dateStr: currentDateStr||'', _type:'poi' };
        stashNotes='';
        continue;
      }
      // other lines are notes for current item; if no pending, stash for next poi
      if (!pending){ stashNotes = (stashNotes? stashNotes+'\n' : '') + raw; continue; }
      pending.notes = (pending.notes? pending.notes+'\n' : '') + raw;
    }
    pushPending();
    // remove empty
    return entries.filter(e=> (e.name && e.name.trim()) || e._type==='timeEvent')
      .map(e=> ({...e, name: (e.name||'').replace(/^(周[一二三四五六日天])?/, '').trim()}));
  };

  // Sanitize name for geocoding
  const sanitizePlaceName = (s)=>{
    if (!s) return '';
    let t = String(s).trim();
    t = t.replace(/[，。、“”‘’\(\)（）]/g,' ');
    t = t.replace(/附近|周边|左右|大约|约/g,'').trim();
    if (/^行程事件$/.test(t)) return '';
    return t;
  };

  // Search places with Nominatim first; fall back to Overpass (within bounds) and Open-Meteo (cities); bias to map bounds; no custom headers to avoid preflight
  const searchPlaces = async (q)=>{
    const name = sanitizePlaceName(q);
    if (!name) return [];
    const params = { format:'jsonv2', q: name, limit: 5, addressdetails: 1, namedetails: 1, 'accept-language':'zh-CN', countrycodes:'cn' };
    // bias by current bounds if available
    let overpassBBox = '';
    if (mapRef.current){
      try{
        const z = mapRef.current.getZoom ? mapRef.current.getZoom() : 0;
        if (z>=9){
          const b = mapRef.current.getBounds();
          const west=b.getWest().toFixed(3), east=b.getEast().toFixed(3), north=b.getNorth().toFixed(3), south=b.getSouth().toFixed(3);
          params.viewbox = `${west},${north},${east},${south}`;
          params.bounded = 1;
          // overpass bbox: south,west,north,east
          overpassBBox = `${south},${west},${north},${east}`;
        }
      }catch(_){ }
    }
    // try Nominatim (skip in stable mode or when blocked)
    try{
      const mode = getGeoMode();
      const nomiEnabled = (mode !== 'stable') && (Date.now() > (nomiBlockedUntilRef.current||0));
      if (nomiEnabled){
        const res = await gateNominatim(()=> withRetry(()=> axios.get('https://nominatim.openstreetmap.org/search', { params, timeout:1500 }), { retries:1, baseDelay:600 }));
        const arr = Array.isArray(res && res.data) ? res.data : [];
        if (arr.length){
          const out = arr.slice(0,5).map(d=> ({ source:'nominatim', place_id:String(d.place_id||''), display_name: d.display_name||name, lat: d.lat, lon: d.lon }));
          return out;
        }
      }
    }catch(_){ nomiBlockedUntilRef.current = Date.now() + 10*60*1000; /* fallback below */ }
    // Fallback 1: Overpass (if we have bounds)
    if (overpassBBox){
      try{
        const escapeRegex = (s)=> String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const qstr = escapeRegex(name);
        const overpassQL = ` [out:json][timeout:12];\n( node[\"name:zh\"~\"${qstr}\",i](${overpassBBox});\n  way[\"name:zh\"~\"${qstr}\",i](${overpassBBox});\n  relation[\"name:zh\"~\"${qstr}\",i](${overpassBBox});\n  node[\"name\"~\"${qstr}\",i](${overpassBBox});\n  way[\"name\"~\"${qstr}\",i](${overpassBBox});\n  relation[\"name\"~\"${qstr}\",i](${overpassBBox});\n); out center 20;`;
        const resp = await axios.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(overpassQL)}`, { headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8' }, timeout:8000 });
        const els = (resp.data && resp.data.elements) || [];
        const out = els.slice(0,10).map(el=>{
          const tags = el.tags||{}; const nameZh = tags['name:zh']; const nameN = tags.name || nameZh || '未命名';
          const lat = el.lat!=null ? el.lat : (el.center && el.center.lat);
          const lon = el.lon!=null ? el.lon : (el.center && el.center.lon);
          return { source:'overpass', place_id: String(el.id), display_name: nameZh || nameN, lat: String(lat||''), lon: String(lon||'') };
        }).filter(d=> d.lat && d.lon);
        if (out.length) return out;
      }catch(_){ /* continue */ }
    }
    // Fallback 2: Open-Meteo Geocoding (city-level)
    try{
      const om = await axios.get('https://geocoding-api.open-meteo.com/v1/search', { params:{ name, count:6, language:'zh', format:'json' }, timeout:5000 });
      const arr = (om.data && om.data.results) || [];
      const out = arr.slice(0,6).map(r=> ({ source:'openmeteo', place_id: String(r.id||''), display_name:[r.name, r.admin1, r.country].filter(Boolean).join(' · '), lat:String(r.latitude), lon:String(r.longitude) }));
      if (out.length) return out;
      // fall through to AMap when Open-Meteo returns nothing
    }catch(_){ /* try AMap below */ }
    // Fallback 3: AMap POI (if key available)
    try {
      const key = getAmapKey();
      if (key){
        const resp = await axios.get('https://restapi.amap.com/v5/place/text', { params:{ key, keywords: name, page_size: 8, page_num: 1 }, timeout:5000 });
        const pois = (resp.data && resp.data.pois) || [];
        const mapped = pois.map(p=>{
          let lat=0, lon=0; if (p.location){ const [x,y]=String(p.location).split(','); lon=parseFloat(x); lat=parseFloat(y); const [wgsLon,wgsLat]=gcj02ToWgs84(lon,lat); lon=wgsLon; lat=wgsLat; }
          const title = p.name || '';
          const ad = [p.cityname||'', p.adname||'', p.address||''].filter(Boolean).join(' ');
          return { source:'amap', place_id: String(p.id||''), display_name: ad? `${title} · ${ad}` : title, lat:String(lat), lon:String(lon) };
        }).filter(d=> d.lat && d.lon);
        if (mapped.length) return mapped;
      }
    } catch(_){ /* ignore and return [] */ }
    return [];
  };

  const parseTimeVal = useCallback((it)=>{ const d=it.date||''; const t=it.time||''; const ts=(d+' '+t).trim(); return ts? (Date.parse(ts.replace(/-/g,'/'))||Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER; }, []);
  const sortItemsForTimeline = useCallback((list)=>{ if (timelineManualOrder) return list.slice(); const withIndex=list.map((it,i)=>({...it,__idx:i})); return withIndex.slice().sort((a,b)=>{ const av=parseTimeVal(a), bv=parseTimeVal(b); if (av===bv) return a.__idx-b.__idx; return av-bv; }); }, [timelineManualOrder, parseTimeVal]);
  const timelineItems = useMemo(()=> sortItemsForTimeline(items), [items, sortItemsForTimeline]);
  const resetTimelineAuto = ()=>{ setItems((prev)=> sortItemsForTimeline(prev)); setTimelineManualOrder(false); };

  // compute segment distances and update polylines
  const segmentDistances = useMemo(()=>{
    const arr = items.map(()=> null);
    for (let i=1;i<items.length;i++){
      const a=items[i-1], b=items[i];
      if (!a || !b || a.unlocated || b.unlocated) { arr[i]=null; continue; }
      if (!isFinite(a.lat)||!isFinite(a.lng)||!isFinite(b.lat)||!isFinite(b.lng)) { arr[i]=null; continue; }
      arr[i] = haversineKm(a.lat, a.lng, b.lat, b.lng);
    }
    return arr; // index i: distance from i-1 to i
  }, [items]);

  const distanceStats = useMemo(()=>{
    let total=0; const perDay={};
    for (let i=1;i<items.length;i++){
      const d = segmentDistances[i]; if (!d) continue; total += d;
      const day = items[i].date || '';
      if (!perDay[day]) perDay[day]=0; perDay[day]+=d;
    }
    return { total, perDay };
  }, [items, segmentDistances]);

  // OSRM 路线型距离（可选）
  useEffect(()=>{
    let canceled = false;
    if (!useRouteDistance){ setRouteDistances([]); return; }
    const run = async ()=>{
      setOsrmWarn('');
      const results = new Array(items.length).fill(null);
      const tasks = [];
      let fail = 0; let totalReq = 0;
      for (let i=1;i<items.length;i++){
        const a=items[i-1], b=items[i];
  if (a.unlocated || b.unlocated) continue;
  if (!isFinite(a.lat)||!isFinite(a.lng)||!isFinite(b.lat)||!isFinite(b.lng)) continue;
        const key = `${a.lat.toFixed(5)},${a.lng.toFixed(5)}|${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
        const cached = routeCacheRef.current.get(key);
        if (cached){ results[i]=cached; continue; }
        const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false&alternatives=false&steps=false`;
        totalReq++;
        tasks.push(
          axios.get(url, { timeout: 8000 }).then(res=>{
            const routes = res.data && res.data.routes; const meters = routes && routes[0] && routes[0].distance; const km = meters? (meters/1000) : null;
            if (km){ routeCacheRef.current.set(key, km); results[i]=km; }
          }).catch(()=>{ fail++; })
        );
      }
      await Promise.allSettled(tasks);
      if (!canceled){
        setRouteDistances(results);
        if (totalReq>0 && fail/totalReq>=0.5){
          setOsrmWarn('OSRM 路线服务当前不可用，已自动降级为直线距离');
          setUseRouteDistance(false);
        } else if (fail>0) {
          setOsrmWarn('部分路线计算失败，已使用直线距离降级');
        }
      }
    };
    run();
    return ()=>{ canceled=true; };
  }, [items, useRouteDistance]);

  // 根据路线/直线选择最终展示距离
  const finalDistances = useMemo(()=>{
    const arr = items.map(()=> null);
    for (let i=1;i<items.length;i++){
      const r = routeDistances[i]; const s = segmentDistances[i];
      arr[i] = (useRouteDistance && isFinite(r) && r>0) ? r : s;
    }
    return arr;
  }, [items, routeDistances, segmentDistances, useRouteDistance]);

  const distanceStatsFinal = useMemo(()=>{
    let total=0; const perDay={};
    for (let i=1;i<items.length;i++){
      const d = finalDistances[i]; if (!d) continue; total += d;
      const day = items[i].date || '';
      if (!perDay[day]) perDay[day]=0; perDay[day]+=d;
    }
    return { total, perDay };
  }, [items, finalDistances]);

  // 分天分组
  const dayGroups = useMemo(()=>{
    const map = new Map();
    items.forEach((it, index)=>{
      const day = it.date || '未设日期';
      if (!map.has(day)) map.set(day, []);
      map.get(day).push({ item: it, index });
    });
    const res = [];
    for (const [day, entries] of map.entries()){
      let total = 0;
      entries.forEach(({index})=>{ if (index>=1 && (items[index].date === day)){ const d = finalDistances[index]; if (d) total += d; } });
      const times = entries.map(({item})=> item.time).filter(Boolean).sort();
      const start = times[0] || '';
      const end = times[times.length-1] || '';
      res.push({ day, entries, totalKm: total, start, end });
    }
    res.sort((a,b)=> (a.day||'').localeCompare(b.day||''));
    return res;
  }, [items, finalDistances]);

  // 工具：按日期时间排序
  const sortByDateTime = useCallback(()=>{
    setItems(prev=> prev.slice().sort((a,b)=>{
      const av = parseTimeVal(a); const bv = parseTimeVal(b); return av-bv;
    }));
    setViewMode('day');
  }, [parseTimeVal]);

  // 备注增强：快速设置耗时
  const applyDuration = useCallback((id, duration)=>{
    setItems(prev=>{
      const idx = prev.findIndex(it=>it.id===id); if (idx<0) return prev;
      const it = prev[idx];
      let notes = String(it.notes||'');
      const re = /(耗时：)([^。；;，,\n]*)/;
      if (re.test(notes)){
        notes = notes.replace(re, (_, p1)=> `${p1}${duration}`);
      } else if (notes.trim()) {
        notes = notes + ` · 耗时：${duration}`;
      } else {
        notes = `耗时：${duration}`;
      }
      const next = prev.slice(); next[idx] = { ...it, notes };
      return next;
    });
  }, []);

  // 起点/终点标记
  const setStartOfDay = useCallback((day, id)=>{
    setItems(prev=> prev.map(it=> it.date===day ? ({ ...it, startOfDay: it.id===id }) : it));
  }, []);
  const setEndOfDay = useCallback((day, id)=>{
    setItems(prev=> prev.map(it=> it.date===day ? ({ ...it, endOfDay: it.id===id }) : it));
  }, []);

  useEffect(()=>{
    if (!mapRef.current || !window.L) return; if (!polylineGroupRef.current) return;
    try{ polylineGroupRef.current.clearLayers(); }catch(_){ }
    for (let i=1;i<items.length;i++){
      const a=items[i-1], b=items[i];
      if (a && b && !a.unlocated && !b.unlocated && isFinite(a.lat) && isFinite(a.lng) && isFinite(b.lat) && isFinite(b.lng)){
        try{ const pl = window.L.polyline([[a.lat,a.lng],[b.lat,b.lng]], { color:'#2952ff', weight:2, opacity:0.9, dashArray:'6,6' }); polylineGroupRef.current.addLayer(pl); }catch(_){ }
      }
    }
  }, [items]);

  // templates for notes
  const applyNoteTemplate = useCallback((id, type)=>{
    setItems(prev=>{
      const idx = prev.findIndex(it=>it.id===id); if (idx<0) return prev;
      const it = prev[idx]; const prevIt = idx>0? prev[idx-1] : null; const dt = formatCnDate(it.date||'');
      const dist = prevIt? haversineKm(prevIt.lat, prevIt.lng, it.lat, it.lng) : 0;
      let text = it.notes || '';
      const distStr = prevIt? `与上个地点直线距离约 ${dist.toFixed(1)} km。` : '';
      if (type==='play'){
        text = `${dt} 在「${it.name||'此地'}」玩什么项目，预计消费 XXX 元。`;
      } else if (type==='move'){
        text = `${dt} 从「${(prevIt&&prevIt.name)||'上个地点'}」到「${it.name||'此地'}」，直线距离约 ${dist.toFixed(1)} km。交通： ，耗时： ，预计消费 XXX 元。`;
      } else if (type==='stay'){
        text = `${dt} 在「${it.name||'此地'}」入住酒店（名称： ），预计消费 XXX 元。`;
      }
      // write back
      const next = prev.slice(); next[idx] = { ...it, notes: text };
      return next;
    });
  }, []);

  return (
    <div className="jihua-page">
      <header className="jihua-header">
          <div className="controls-primary">
          <div className="brand">旅行计划</div>
          <button className={`icon-btn ${useMapBounds?'active':''}`} title="就近优先（按当前地图范围搜索）" onClick={()=> setUseMapBounds(v=>!v)}>{useMapBounds?'就近':'全局'}</button>
          <select className="tile-select" aria-label="瓦片源" value={tileKey} onChange={(e)=> setTileKey(e.target.value)} disabled={!mapReady}>
            <option value="amap">高德(道路-深色)</option>
            <option value="esriStreet">Esri街道</option>
            <option value="esriImagery">Esri影像</option>
            <option value="default">OSM</option>
            {hasTdtToken()? <option value="tdtVec">天地图-矢量</option> : null}
            {hasTdtToken()? <option value="tdtImg">天地图-影像</option> : null}
            {getRuntimeMapConfig().customTile.url? <option value="custom">自定义瓦片</option> : null}
          </select>
          {/* Always-visible search input with local dropdown */}
          <div className="search-wrap" style={{position:'relative', minWidth:220, flex:'0 1 340px'}}>
            <input
              disabled={!mapReady}
              className="search-input"
              style={{width:'100%'}}
              placeholder="搜索地点（输入≥2个字）回车或停顿触发"
              aria-label="搜索地点"
              value={searchQuery}
              onChange={(e)=> onSearchInputChange(e.target.value)}
              onKeyDown={(e)=>{
                const visLen = Math.min(suggestions.length, suggMax);
                if (e.key==='ArrowDown') { e.preventDefault(); if (visLen){ setSuggIndex(i=> Math.min(i+1, visLen-1)); } return; }
                if (e.key==='ArrowUp') { e.preventDefault(); if (visLen){ setSuggIndex(i=> Math.max(i-1, 0)); } return; }
                if (e.key==='Enter') {
                  e.preventDefault();
                  if (suggIndex>=0 && suggIndex<visLen) { chooseSuggestion(suggestions[suggIndex]); }
                  else { doSearch(searchQuery); }
                  return;
                }
                if (e.key==='Escape') { setSuggestions([]); setSuggIndex(-1); return; }
              }}
            />
            {(String(searchQuery||'').trim().length>=2) && (
              <div className="suggestions" role="listbox" aria-label="搜索建议列表" style={{position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex: 4000, maxHeight:'40vh', overflowY:'auto'}}>
                {searching && <div className="suggestion-item">搜索中…</div>}
                {suggestions.slice(0, suggMax).map((s, idx)=>(
                  <div key={(s.place_id || s.osm_id || `${s.lat},${s.lon},${s.display_name||''}`)+`#${idx}`}
                       className={`suggestion-item ${idx===suggIndex?'selected':''}`}
                       role="option" aria-selected={idx===suggIndex}
                       onClick={async ()=>{ await chooseSuggestion(s); }}>
                    <div className="sugg-title">{s.display_name}</div>
                    {mapRef.current ? (
                      <div className="sugg-meta">
                        {(()=>{ try{ const c=mapRef.current.getCenter(); const dy=(parseFloat(s.lat)-c.lat); const dx=(parseFloat(s.lon)-c.lng); const dist = Math.sqrt(dx*dx+dy*dy)*111; return `${dist.toFixed(1)} km`; }catch(_){ return '';} })()}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!searching && suggestions.length===0 && <div className="suggestion-item">无搜索结果</div>}
              </div>
            )}
          </div>
          <button
            className="icon-btn"
            style={{ position:'relative', zIndex:5001 }}
            title="定位当前位置"
            onClick={()=>{
              // 关闭下拉建议，避免遮挡点击
              setSuggestions([]);
              if (!navigator.geolocation) { setError('当前浏览器不支持定位'); return; }
              navigator.geolocation.getCurrentPosition((pos)=>{
                const { latitude, longitude } = pos.coords;
                if (mapRef.current) mapRef.current.setView([latitude, longitude], 14);
              }, ()=> setError('定位失败，请检查权限'));
            }}
          >定位当前位置</button>
          <span className="spacer" />
          <button aria-label="更多" className="icon-btn" onClick={()=> setShowExtra(v=>!v)}>{showExtra?'收起':'更多'}</button>
        </div>
        {showExtra && (
          <div className="controls-more">
            <div className="controls-col">
              <div className="view-toggle">
                <button className={`icon-btn ${viewMode==='list'?'active':''}`} onClick={()=> setViewMode('list')}>列表</button>
                <button className={`icon-btn ${viewMode==='timeline'?'active':''}`} onClick={()=> setViewMode('timeline')}>时间轴</button>
                <button className={`icon-btn ${viewMode==='day'?'active':''}`} onClick={()=> setViewMode('day')}>按天</button>
                {viewMode==='timeline'? <button className="icon-btn" onClick={resetTimelineAuto} title="按时间排序">按时间排序</button> : null}
                <button className="icon-btn" onClick={sortByDateTime} title="按日期时间排序并切换按天视图">按日期排序</button>
                <button className={`icon-btn ${useRouteDistance?'active':''}`} onClick={()=> setUseRouteDistance(v=>!v)} title="路线型距离（OSRM）">路线距离</button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:'#6b7280'}}>地图高度</span>
                <input type="range" min={200} max={Math.round(window.innerHeight*0.8)} value={mapHeight} onChange={(e)=> setMapHeight(parseInt(e.target.value||'0',10)||mapHeight)} />
                <span style={{minWidth:36,textAlign:'right'}}>{Math.round(mapHeight)}px</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:'#6b7280'}}>建议条数</span>
                <select value={suggMax} onChange={(e)=>{ const v=parseInt(e.target.value||'5',10); setSuggMax([3,5,8].includes(v)?v:5); }}>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="map-container" ref={containerRef} aria-label="地图" />
      {/* drag splitter */}
      <div
        className="splitter"
        onPointerDown={(e)=>{
          draggingRef.current=true; startYRef.current = e.clientY||0; startHRef.current = mapHeight; document.body.style.userSelect='none';
          try{ e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); }catch(_){ }
          const onMove = (ev)=>{
            if(!draggingRef.current) return; const dy = (ev.clientY||0) - startYRef.current; let h = startHRef.current + dy;
            const minH = 120; const minSheet = 220; const maxH = Math.max(minH, window.innerHeight - minSheet);
            if (h<minH) h=minH; if(h>maxH) h=maxH; setMapHeight(h); if(mapRef.current) mapRef.current.invalidateSize();
          };
          const onUp = ()=>{
            draggingRef.current=false; document.body.style.userSelect='';
            window.removeEventListener('pointermove', onMove, true);
            window.removeEventListener('pointerup', onUp, true);
            if(mapRef.current) setTimeout(()=> mapRef.current.invalidateSize(), 50);
          };
          window.addEventListener('pointermove', onMove, true);
          window.addEventListener('pointerup', onUp, true);
        }}
        title="拖动调整地图高度"
      />

      {/* moved suggestions into search-wrap to appear just under the input */}

  <section className="sheet paper">
        <div className="sheet-header">
          <input className="plan-name" value={planName} onChange={(e)=> setPlanName(e.target.value)} placeholder="计划名称" />
          <div className="actions" style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button className="btn" onClick={confirmNewPlan}>新建</button>
            <button className="btn" onClick={savePlan} disabled={planSaving}>{planSaving?'保存中…':'保存'}</button>
            <button className="btn" onClick={()=> setShowSupplies(true)}>物资清单</button>
            <button className="icon-btn" onClick={()=> setShowActionMore(v=>!v)} aria-expanded={showActionMore}>{showActionMore?'收起':'更多'}</button>
            {showActionMore && (
              <>
                <button className="btn danger" onClick={confirmDeletePlan} disabled={planDeleting}>{planDeleting?'删除中…':'删除'}</button>
                <button className="btn" onClick={()=> exportTxtWithDistances(planName, items, finalDistances)}>导出TXT</button>
                <button className="btn" onClick={()=> exportMarkdown(planName, dayGroups, finalDistances)}>导出MD</button>
                <button className="btn" onClick={()=> exportCSV(planName, items, finalDistances)}>导出CSV</button>
                <button className="btn" onClick={()=> exportNarrative(planName, items)}>导出行程文案</button>
                <button className="btn" onClick={()=> setShowImport(true)}>从文本导入(Beta)</button>
              </>
            )}
          </div>
        </div>

        <div className="plans-bar" style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn" onClick={loadPlans} disabled={travelPlansLoading}>{travelPlansLoading?'加载中…':'刷新计划'}</button>
          <select className="plan-select" onChange={(e)=> loadPlanDetail(e.target.value)} value={planId || ''}>
            <option value="" disabled>选择已有计划</option>
            {(travelPlans||[]).map((p)=> (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button className="btn" disabled={fillGeoBusy} onClick={async()=>{
              setFillGeoBusy(true); setFillProgress({done:0,total: items.length});
              try{
                for (let i=0;i<items.length;i++){
                  const it = items[i];
                  if (it && (!it.city || !it.province || !it.nameLocal)){
                    try{ const info = await reverseGeocodeMultiDetailed(it.lat, it.lng); setItems(prev=> prev.map(p=> p.id===it.id?{...p, name: info.cn||p.name, nameLocal: info.local||p.nameLocal||'', city: info.city||p.city||'', province: info.province||p.province||'', country: info.country||p.country||'' }:p)); }catch(_){ }
                    await new Promise(r=> setTimeout(r, 380));
                  }
                  setFillProgress({done:i+1,total:items.length});
                }
              } finally { setFillGeoBusy(false); }
            }}>{fillGeoBusy?`补全中 ${fillProgress.done}/${fillProgress.total}`:'一键补全地名'}</button>
          </div>
        </div>

        {showExtra && (
          <div className="plans-bar">
            <div style={{display:'flex',gap:8,flexWrap:'wrap',width:'100%'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:'#6b7280'}}>地图高度</span>
                <input type="range" min={200} max={Math.round(window.innerHeight*0.8)} value={mapHeight} onChange={(e)=> setMapHeight(parseInt(e.target.value||'0',10)||mapHeight)} />
                <span style={{minWidth:36,textAlign:'right'}}>{Math.round(mapHeight)}px</span>
              </div>
              <div style={{marginLeft:'auto'}}>
                <button className={`icon-btn ${useMapBounds?'active':''}`} title="就近优先（按当前地图范围搜索）" onClick={()=> setUseMapBounds(v=>!v)}>{useMapBounds?'就近':'全局'}</button>
                <button className={`icon-btn ${useRouteDistance?'active':''}`} onClick={()=> setUseRouteDistance(v=>!v)} title="路线型距离（OSRM）">路线距离</button>
              </div>
            </div>
          </div>
        )}

        {error? <div className="error">{error}</div> : null}
        {travelPlansError? <div className="error">{travelPlansError}</div> : null}
        {currentPlanError? <div className="error">{currentPlanError}</div> : null}
        {planSaveError? <div className="error">{planSaveError}</div> : null}
        {planDeleteError? <div className="error">{planDeleteError}</div> : null}

        {viewMode==='list' ? (
          <ul className="item-list">
            {items.map((it,idx)=>(
              <li className="item" key={it.id} draggable onDragStart={()=> setDragIndex(idx)} onDragOver={(e)=> e.preventDefault()} onDrop={()=>{ reorder(dragIndex, idx); setDragIndex(null); }}>
                <div className="item-line">
                  <div className="index">{idx+1}</div>
                  <button className="icon-btn" title={it.fav?'取消收藏':'收藏'} onClick={()=> updateItemField(it.id,'fav', !it.fav)}>{it.fav?'★':'☆'}</button>
                  <input className="item-name" value={it.name} onChange={(e)=> updateItemField(it.id,'name',e.target.value)} placeholder="地点名称/备注" />
                  {it.nameLocal && <span style={{color:'#6b7280',fontSize:12,marginLeft:6}}>({it.nameLocal})</span>}
                  <select className="icon-btn" onChange={(e)=> applyNoteTemplate(it.id, e.target.value)} defaultValue="">
                    <option value="" disabled>备注模板</option>
                    <option value="play">游玩</option>
                    <option value="move">移动</option>
                    <option value="stay">住宿</option>
                  </select>
                  <select className="icon-btn" onChange={(e)=> { const val=e.target.value; if(!val) return; applyDuration(it.id, val); e.target.value=''; }} defaultValue="">
                    <option value="" disabled>预计时长</option>
                    <option value="30分钟">30分钟</option>
                    <option value="1小时">1小时</option>
                    <option value="2小时">2小时</option>
                    <option value="半天">半天</option>
                    <option value="全天">全天</option>
                  </select>
                  <div className="move">
                    <button className="icon-btn" onClick={()=> moveItem(idx,-1)} disabled={idx===0}>↑</button>
                    <button className="icon-btn" onClick={()=> moveItem(idx,+1)} disabled={idx===items.length-1}>↓</button>
                  </div>
                  <button className="icon-btn danger" onClick={()=> confirmDeleteItem(it.id)}>✕</button>
                </div>
                <div className="item-line">
                  <input type="date" className="date-input" value={it.date||''} onChange={(e)=> updateItemField(it.id,'date',e.target.value)} />
                  <input type="time" className="time-input" value={it.time||''} onChange={(e)=> updateItemField(it.id,'time',e.target.value)} />
                  {it.unlocated ? (
                    <div className="coords" style={{color:'#ef4444'}}>
                      未定位
                      <button className="icon-btn" style={{marginLeft:8}} onClick={()=>{ placingRef.current = it.id; alert('请在地图上点选一个位置，来放置：'+(it.name||'此条目')); }}>在地图上放置</button>
                    </div>
                  ) : (
                    <div className="coords">{isFinite(it.lat)&&isFinite(it.lng)? `${it.lat.toFixed(5)}, ${it.lng.toFixed(5)}` : ''}{finalDistances[idx]? ` · 距上个 ${finalDistances[idx].toFixed(1)} km · 建议：${recommendTransport(finalDistances[idx], items[idx-1], it)}` : ''}</div>
                  )}
                </div>
                <textarea className="notes" rows={2} value={it.notes||''} onChange={(e)=> updateItemField(it.id,'notes',e.target.value)} placeholder="备注" {...bindLongPress(it.id)} />
              </li>
            ))}
          </ul>
        ) : viewMode==='timeline' ? (
          <div className="timeline">
            {timelineItems.map((it,idx)=>(
              <div key={it.id} className="timeline-item" draggable onDragStart={()=> setTimelineDragIndex(idx)} onDragOver={(e)=> e.preventDefault()} onDrop={()=>{
                if (timelineDragIndex==null) return;
                setItems((prev)=>{ const currentTimeline=sortItemsForTimeline(prev); const ids=currentTimeline.map((x)=>x.id); const from=timelineDragIndex; const to=idx; if(from<0||from>=ids.length||to<0||to>=ids.length) return prev; const [movedId]=ids.splice(from,1); ids.splice(to,0,movedId); const idToItem=new Map(prev.map((p)=>[p.id,p])); const next=ids.map((id)=> idToItem.get(id)).filter(Boolean); return next; }); setTimelineManualOrder(true); setTimelineDragIndex(null);
              }}>
                <div className="timeline-left"><div className="timeline-dot" /><div className="timeline-line" /></div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    <span className="index">{idx+1}</span>
                    <input className="item-name" value={it.name} onChange={(e)=> updateItemField(it.id,'name',e.target.value)} />{it.nameLocal && <span style={{color:'#6b7280',fontSize:12,marginLeft:6}}>({it.nameLocal})</span>}
                    <div className="move">
                      <button className="icon-btn" onClick={()=>{ setItems((prev)=>{ const currentTimeline=sortItemsForTimeline(prev); const ids=currentTimeline.map((x)=>x.id); const from=idx; const to=idx-1; if(from<=0) return prev; const [movedId]=ids.splice(from,1); ids.splice(to,0,movedId); const idToItem=new Map(prev.map((p)=>[p.id,p])); const next=ids.map((id)=> idToItem.get(id)).filter(Boolean); return next; }); setTimelineManualOrder(true); }} disabled={idx===0}>↑</button>
                      <button className="icon-btn" onClick={()=>{ setItems((prev)=>{ const currentTimeline=sortItemsForTimeline(prev); const ids=currentTimeline.map((x)=>x.id); const from=idx; const to=idx+1; if(from>=ids.length-1) return prev; const [movedId]=ids.splice(from,1); ids.splice(to,0,movedId); const idToItem=new Map(prev.map((p)=>[p.id,p])); const next=ids.map((id)=> idToItem.get(id)).filter(Boolean); return next; }); setTimelineManualOrder(true); }} disabled={idx===timelineItems.length-1}>↓</button>
                    </div>
                    <button className="icon-btn danger" onClick={()=> confirmDeleteItem(it.id)}>✕</button>
                  </div>
                  <div className="timeline-meta">
                    <input type="date" className="date-input" value={it.date||''} onChange={(e)=> updateItemField(it.id,'date',e.target.value)} />
                    <input type="time" className="time-input" value={it.time||''} onChange={(e)=> updateItemField(it.id,'time',e.target.value)} />
                    {it.unlocated ? (
                      <span className="coords" style={{color:'#ef4444'}}>
                        未定位
                        <button className="icon-btn" style={{marginLeft:8}} onClick={()=>{ placingRef.current = it.id; alert('请在地图上点选一个位置，来放置：'+(it.name||'此条目')); }}>在地图上放置</button>
                      </span>
                    ) : (
                      <span className="coords">{isFinite(it.lat)&&isFinite(it.lng)? `${it.lat.toFixed(5)}, ${it.lng.toFixed(5)}` : ''}{finalDistances[items.indexOf(it)]? ` · 距上个 ${finalDistances[items.indexOf(it)].toFixed(1)} km · 建议：${recommendTransport(finalDistances[items.indexOf(it)], items[items.indexOf(it)-1], it)}` : ''}</span>
                    )}
                  </div>
                  <textarea className="notes" rows={2} value={it.notes||''} onChange={(e)=> updateItemField(it.id,'notes',e.target.value)} placeholder="备注" {...bindLongPress(it.id)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="day-groups">
            {/* day picker bar */}
            <div className="day-picker">
              {dayGroups.map(g=> {
                const today = getNowDateTime().date;
                const isToday = (g.day===today);
                const hasFav = g.entries.some(({item})=> !!item.fav);
                return (
                  <button
                    key={g.day}
                    className={`day-chip ${isToday?'today':''} ${hasFav?'hasFav':''}`}
                    onClick={()=>{
                      const el = document.getElementById('day-'+g.day);
                      if (el) el.scrollIntoView({ behavior:'smooth', block:'start', inline:'nearest' });
                    }}
                    onMouseDown={()=>{
                      if (chipLpTimerRef.current) clearTimeout(chipLpTimerRef.current);
                      chipLpTimerRef.current = setTimeout(()=> addQuickDayNote(g.day), 600);
                    }}
                    onMouseUp={()=>{ if (chipLpTimerRef.current) clearTimeout(chipLpTimerRef.current); }}
                    onMouseLeave={()=>{ if (chipLpTimerRef.current) clearTimeout(chipLpTimerRef.current); }}
                    onTouchStart={()=>{
                      if (chipLpTimerRef.current) clearTimeout(chipLpTimerRef.current);
                      chipLpTimerRef.current = setTimeout(()=> addQuickDayNote(g.day), 600);
                    }}
                    onTouchEnd={()=>{ if (chipLpTimerRef.current) clearTimeout(chipLpTimerRef.current); }}
                    onTouchMove={()=>{ if (chipLpTimerRef.current) clearTimeout(chipLpTimerRef.current); }}
                  >
                    {g.day}
                    {hasFav? <span className="badge" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            {dayGroups.map(group=> (
              <div key={group.day} className="day-section" id={'day-'+group.day}>
                <div className="item-line" style={{fontWeight:600}}>
                  <div className="index">{group.day}</div>
                  <div style={{marginLeft:8}}>当天总距离：{group.totalKm.toFixed(1)} km</div>
                  <div style={{marginLeft:'auto'}}>起止：{group.start||'-'}{group.end?(' - '+group.end):''}</div>
                   <div style={{marginLeft:12,display:'flex',gap:6}}>
                    <button className="icon-btn" onClick={()=> exportDayGeoJSON(group.day)}>导出GeoJSON</button>
                    <button className="icon-btn" onClick={()=> exportDayGPX(group.day)}>导出GPX</button>
                     <button className="icon-btn" onClick={()=> exportDayPNG(group.day)}>导出图片</button>
                  </div>
                </div>
                <ul className="item-list">
                  {group.entries.map(({item, index})=> (
                    <li className="item" key={item.id} draggable onDragStart={()=> setDragIndex(index)} onDragOver={(e)=> e.preventDefault()} onDrop={()=>{ reorder(dragIndex, index); setDragIndex(null); }}>
                      <div className="item-line">
                        <div className="index">{index+1}{item.startOfDay? ' · 起点':''}{item.endOfDay? ' · 终点':''}</div>
                        <input className="item-name" value={item.name} onChange={(e)=> updateItemField(item.id,'name',e.target.value)} placeholder="地点名称/备注" />
                        {item.nameLocal && <span style={{color:'#6b7280',fontSize:12,marginLeft:6}}>({item.nameLocal})</span>}
                        <button className="icon-btn" onClick={()=> setStartOfDay(group.day, item.id)}>设为起点</button>
                        <button className="icon-btn" onClick={()=> setEndOfDay(group.day, item.id)}>设为终点</button>
                        <select className="icon-btn" onChange={(e)=> applyNoteTemplate(item.id, e.target.value)} defaultValue="">
                          <option value="" disabled>备注模板</option>
                          <option value="play">游玩</option>
                          <option value="move">移动</option>
                          <option value="stay">住宿</option>
                        </select>
                        <select className="icon-btn" onChange={(e)=> { const val=e.target.value; if(!val) return; applyDuration(item.id, val); e.target.value=''; }} defaultValue="">
                          <option value="" disabled>预计时长</option>
                          <option value="30分钟">30分钟</option>
                          <option value="1小时">1小时</option>
                          <option value="2小时">2小时</option>
                          <option value="半天">半天</option>
                          <option value="全天">全天</option>
                        </select>
                        <button className="icon-btn danger" onClick={()=> confirmDeleteItem(item.id)}>✕</button>
                      </div>
                      <div className="item-line">
                        <input type="date" className="date-input" value={item.date||''} onChange={(e)=> updateItemField(item.id,'date',e.target.value)} />
                        <input type="time" className="time-input" value={item.time||''} onChange={(e)=> updateItemField(item.id,'time',e.target.value)} />
                        {item.unlocated ? (
                          <div className="coords" style={{color:'#ef4444'}}>
                            未定位
                            <button className="icon-btn" style={{marginLeft:8}} onClick={()=>{ placingRef.current = item.id; alert('请在地图上点选一个位置，来放置：'+(item.name||'此条目')); }}>在地图上放置</button>
                          </div>
                        ) : (
                          <div className="coords">{isFinite(item.lat)&&isFinite(item.lng)? `${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}` : ''}{finalDistances[index]? ` · 距上个 ${finalDistances[index].toFixed(1)} km · 建议：${recommendTransport(finalDistances[index], items[index-1], item)}` : ''}</div>
                        )}
                      </div>
                      <textarea className="notes" rows={2} value={item.notes||''} onChange={(e)=> updateItemField(item.id,'notes',e.target.value)} placeholder="备注" {...bindLongPress(item.id)} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* distance stats */}
        <div className="stats-bar">
          <div>总距离：{distanceStatsFinal.total.toFixed(1)} km</div>
          {Object.keys(distanceStatsFinal.perDay).length>0 && (
            <div className="stats-days">
              {Object.entries(distanceStatsFinal.perDay).map(([d,val])=> (
                <span key={d} className="stats-day">{d||'未设日期'}：{val.toFixed(1)} km</span>
              ))}
            </div>
          )}
          {osrmWarn && <div className="warning-bar">{osrmWarn}</div>}
        </div>
      </section>

      {/* resizable map: apply mapHeight */}
      <style>{`.map-container{height:${mapHeight}px}`}</style>

      {/* supplies memo modal */}
      {showSupplies && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=> setShowSupplies(false)}>
          <div className="paper-card" style={{width:'min(720px,92vw)',maxHeight:'80vh',display:'flex',flexDirection:'column'}} onClick={(e)=> e.stopPropagation()}>
            <div className="paper-header" style={{display:'flex',alignItems:'center',padding:'12px 14px'}}>
              <div style={{fontWeight:700,letterSpacing:1}}>旅行备忘录</div>
              <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                <select className="icon-btn" aria-label="模板库" defaultValue="" onChange={(e)=>{ const v=e.target.value; if(!v) return; setSuppliesText(getSuppliesTemplate(v)); e.target.value=''; }}>
                  <option value="" disabled>模板库</option>
                  <option value="domestic">国内城市</option>
                  <option value="abroad">国外出行</option>
                  <option value="hiking">徒步/登山</option>
                  <option value="camp">露营/自驾</option>
                </select>
                <select className="icon-btn" aria-label="我的模板" value={selectedTplName} onChange={(e)=> setSelectedTplName(e.target.value)} style={{minWidth:120}}>
                  <option value="">我的模板</option>
                  {myTemplates.map(t=> (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <button className="icon-btn" disabled={!selectedTplName} onClick={()=>{ const t = myTemplates.find(x=>x.name===selectedTplName); if(t) setSuppliesText(t.text||''); }}>应用</button>
                <button className="icon-btn" onClick={saveSuppliesAsTemplate}>保存为模板</button>
                <button className="icon-btn danger" disabled={!selectedTplName} onClick={deleteSelectedTemplate}>删除模板</button>
                <button className="icon-btn" onClick={()=>{ setSuppliesText(defaultSuppliesTemplate()); }}>基础模板</button>
                <button className="icon-btn" onClick={()=> setShowSupplies(false)}>关闭</button>
              </div>
            </div>
            <textarea style={{flex:1,minHeight:240,border:'none',outline:'none',padding:14,background:'transparent',fontFamily:'"Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas', lineHeight:'1.6'}} value={suppliesText} onChange={(e)=> setSuppliesText(e.target.value)} placeholder={'出行备忘示例:\n- 证件：身份证/护照/签证\n- 电子：手机/充电宝/充电器/数据线\n- 衣物：外套/换洗衣物/雨具\n- 洗护：牙刷牙膏/洗面奶/毛巾\n- 药品：感冒药/肠胃药/创可贴\n- 其他：水杯/太阳镜/防晒/伞'} />
          </div>
        </div>
      )}
      {/* Import from text (Beta) modal */}
      {showImport && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=> setShowImport(false)}>
          <div className="paper-card" style={{width:'min(860px,94vw)',maxHeight:'84vh',display:'flex',flexDirection:'column'}} onClick={(e)=> e.stopPropagation()}>
            <div className="paper-header" style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px'}}>
              <div style={{fontWeight:700}}>从文本导入（Beta）</div>
              <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
                <label style={{color:'#6b7280'}}>Day1日期</label>
                <input type="date" value={importDay1Date} onChange={(e)=> setImportDay1Date(e.target.value)} />
                <button className="icon-btn" disabled={importParsing||!importText.trim()} onClick={async ()=>{
                  setImportParsing(true);
                  try{
                    // 使用中文行程解析器
                    const parsed = parseChineseItinerary(importText);
                    // 如果用户选择了 Day1 日期，则填充 dateStr，否则留空，后续导入时按 Day 偏移
                    const baseDate = importDay1Date || '';
                    let dayIndex = 0;
                    const entries = parsed.map(e=>{
                      if (!e.dateStr && baseDate){ const dt = new Date(baseDate.replace(/-/g,'/')); const tag = `D${dayIndex+1}`; dayIndex++; return { ...e, dayIndex: (dayIndex-1), dateStr:'', tag };
                      } else { return { ...e, dayIndex: 0 } }
                    });
                    setImportPreview(entries.map(e=>({ name:e.name, time:e.time||'', notes:e.notes||'', dayIndex:e.dayIndex||0, _type:e._type||'poi', candidates: [], selectedIdx: -1 })));
                    setImportGeocoding(true);
                    const tasks = entries.map(async (e, idx)=>{
                      try{
                        if ((e._type||'poi') === 'timeEvent') return; // 时间事件不做地理编码
                        const q = sanitizePlaceName(e.name||''); if (!q) return;
                        const found = await searchPlaces(q);
                        const localized = [];
                        for (const c of found){
                          let label = c.display_name || '';
                          try { const info = await reverseGeocodeMultiDetailed(parseFloat(c.lat), parseFloat(c.lon)); label = info.cn || label; } catch(_){ }
                          localized.push({ ...c, display_name: label });
                        }
                        setImportPreview(prev=>{
                          const next = prev.slice();
                          if (next[idx]) next[idx] = { ...next[idx], candidates: localized, selectedIdx: localized.length?0:-1 };
                          return next;
                        });
                      }catch(_){ /* ignore single entry errors */ }
                    });
                    await Promise.allSettled(tasks);
                  } finally { setImportParsing(false); setImportGeocoding(false); }
                }}>解析</button>
                <button className="icon-btn" disabled={!importPreview.length || importGeocoding} onClick={async ()=>{
                  // 将已选择/或第一个候选转为条目；对没有候选的 POI 也导入为“未定位”，方便稍后在地图上放置
                  const baseDate = importDay1Date || getNowDateTime().date;
                  const addDays = (d, k)=>{ const dt = new Date(d.replace(/-/g,'/')); dt.setDate(dt.getDate()+k); const p=(n)=> n<10?('0'+n):String(n); return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}`; };
                  const toAdd = [];
                  for (const e of importPreview){
                    const date = addDays(baseDate, e.dayIndex||0);
                    const c = (e.candidates && e.candidates.length) ? (e.selectedIdx>=0? e.candidates[e.selectedIdx] : e.candidates[0]) : null;
                    if (c){
                      const item = { id: uid(), placeId: String(c.place_id||''), name: c.display_name || e.name || '未命名', nameLocal:'', city:'', province:'', country:'', lat: parseFloat(c.lat), lng: parseFloat(c.lon), date, time: e.time||'', notes: e.notes||'' };
                      toAdd.push(item);
                    } else if ((e._type||'poi')==='poi' && e.name){
                      const center = mapRef.current? mapRef.current.getCenter() : { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng };
                      const item = { id: uid(), placeId: '', name: e.name, nameLocal:'', city:'', province:'', country:'', lat: center.lat, lng: center.lng, date, time: e.time||'', notes: (e.notes? e.notes+"\n":"")+"（未定位：请点击‘在地图上放置’）", unlocated: true };
                      toAdd.push(item);
                    }
                  }
                  if (!toAdd.length){ alert('没有可导入的条目'); return; }
                  // 从文本导入创建一个全新计划，并推测计划名
                  const newName = await derivePlanName(importText, toAdd);
                  setPlanId(null);
                  setPlanName(newName);
                  if (clusterGroupRef.current && clusterGroupRef.current.clearLayers){ try{ clusterGroupRef.current.clearLayers(); }catch(_){ } }
                  Object.values(markersRef.current).forEach((m)=>{ try{ m.remove(); }catch(_){ } }); markersRef.current={};
                  toAdd.filter(it=> !it.unlocated).forEach(addMarkerForItem);
                  setItems(toAdd);
                  setShowImport(false);
                }}>导入到行程</button>
                <button className="icon-btn" onClick={()=> setShowImport(false)}>关闭</button>
              </div>
            </div>
            <div style={{display:'flex',gap:12,padding:'10px 14px',alignItems:'stretch'}}>
              <textarea style={{flex:1,minHeight:240,border:'none',outline:'none',padding:12,background:'transparent'}} placeholder={'粘贴行程文本，如：\nDay1：10:00 八一广场（游玩半小时）\n11:00 江西省美术馆（半小时到1.5小时）\n13:00 羊子街（午餐）\n14:30 八一起义纪念馆（约2小时）...\nDay2：...'} value={importText} onChange={(e)=> setImportText(e.target.value)} />
              <div style={{flex:1,overflow:'auto',maxHeight:'52vh'}}>
                {(!importPreview || importPreview.length===0) ? (
                  <div style={{color:'#6b7280'}}>解析结果将在此显示；解析后可以为每一条选择候选地点。</div>
                ) : (
                  <div>
                    {importPreview.map((e, idx)=> (
                      <div key={idx} className="paper-card" style={{padding:10,marginBottom:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span className="badge" aria-hidden="true" />
                          <div>Day{(e.dayIndex||0)+1} · {e.time||'--:--'} · {e.name}</div>
                        </div>
                        {e.notes ? <div style={{color:'#6b7280',marginTop:6}}>备注：{e.notes}</div> : null}
                        <div style={{marginTop:8}}>
                          {(!e.candidates || e.candidates.length===0) ? (
                            (e._type==='timeEvent' || !e.name) ? null : (
                              <div style={{color:'#ef4444'}}>未找到候选地点（也可直接导入为未定位，稍后到地图上放置）</div>
                            )
                          ) : (
                            <div>
                              <div style={{color:'#6b7280',marginBottom:6}}>候选地点（优先显示中文名称）：</div>
                              {e.candidates.map((c, i)=> (
                                <label key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:6}}>
                                  <input type="radio" name={'cand-'+idx} checked={e.selectedIdx===i} onChange={()=> setImportPreview(prev=>{ const next=prev.slice(); next[idx].selectedIdx=i; return next; })} />
                                  <div>
                                    <div style={{fontWeight:600}}>{c.display_name}</div>
                                    <div style={{color:'#6b7280',fontSize:12}}>({parseFloat(c.lat).toFixed(5)}, {parseFloat(c.lon).toFixed(5)})</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* context menu overlay */}
      {menu.show && (
        <div style={{position:'fixed',inset:0,zIndex:10001}} onClick={closeContextMenu}>
          <div
            className="context-menu paper-card"
            style={{ position:'absolute', left: Math.min(menu.x, window.innerWidth-220), top: Math.min(menu.y, window.innerHeight-220), width: 200, padding:8 }}
            onClick={(e)=> e.stopPropagation()}
          >
            <div className="context-item" onClick={()=>{ const idx = items.findIndex(it=>it.id===menu.itemId); if (idx>0) moveItem(idx,-1); closeContextMenu(); }}>上移</div>
            <div className="context-item" onClick={()=>{ const idx = items.findIndex(it=>it.id===menu.itemId); if (idx>=0 && idx<items.length-1) moveItem(idx,+1); closeContextMenu(); }}>下移</div>
            <div className="context-sep" />
            <div className="context-item" onClick={()=>{ applyNoteTemplate(menu.itemId,'play'); closeContextMenu(); }}>备注·游玩</div>
            <div className="context-item" onClick={()=>{ applyNoteTemplate(menu.itemId,'move'); closeContextMenu(); }}>备注·移动</div>
            <div className="context-item" onClick={()=>{ applyNoteTemplate(menu.itemId,'stay'); closeContextMenu(); }}>备注·住宿</div>
            <div className="context-sep" />
            <div className="context-item" onClick={()=>{ const it = items.find(x=>x.id===menu.itemId); if (!it) return; updateItemField(menu.itemId, 'fav', !it.fav); closeContextMenu(); }}>{(()=>{ const it = items.find(x=>x.id===menu.itemId); return it && it.fav ? '取消收藏' : '设为收藏'; })()}</div>
            <div className="context-item danger" onClick={()=>{ confirmDeleteItem(menu.itemId); closeContextMenu(); }}>删除</div>
            <div className="context-sep" />
            <div className="context-item" onClick={closeContextMenu}>关闭</div>
          </div>
        </div>
      )}
    </div>
  );
}
