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
function recommendTransport(km){
  if (!isFinite(km)) return '步行';
  if (km < 1.5) return '步行';
  if (km < 15) return '地铁';
  if (km < 80) return '大巴';
  return '高铁';
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

const searchCache = new Map();
const reverseCache = new Map();

export default function JihuaPlanner(){
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const polylineGroupRef = useRef(null);
  const markersRef = useRef({});

  const [mapReady,setMapReady]=useState(false);
  const [planName,setPlanName]=useState('我的旅行计划');
  const [planId,setPlanId]=useState(null);
  const [items,setItems]=useState([]);
  const [error,setError]=useState('');
  const [dragIndex,setDragIndex]=useState(null);
  const [searchQuery,setSearchQuery]=useState('');
  const [useMapBounds, setUseMapBounds] = useState(true);
  const [suggestions,setSuggestions]=useState([]);
  const [tileKey,setTileKey]=useState(()=> {
    const cfg=(typeof window!=='undefined'&&window.CONFIG)?window.CONFIG:{};
    if (cfg.DEFAULT_TILE_KEY) return cfg.DEFAULT_TILE_KEY;
    if (getRuntimeMapConfig().customTile.url) return 'custom';
    return 'amap';
  });
  const [viewMode,setViewMode]=useState('list');
  const [timelineManualOrder,setTimelineManualOrder]=useState(false);
  const [timelineDragIndex,setTimelineDragIndex]=useState(null);
  const tileErrorCountRef = useRef(0);
  const fallbackAppliedRef = useRef(false);
  const fallbackStageRef = useRef(0);
  const [useRouteDistance, setUseRouteDistance] = useState(false);
  const routeCacheRef = useRef(new Map());
  const [routeDistances, setRouteDistances] = useState([]);

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
    let canceled=false;
    loadLeaflet().then((L)=>{
      if (canceled || !containerRef.current) return;
      const { initialZoom } = getRuntimeMapConfig();
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
        const tempItem = { id: uid(), placeId:'', name:'标记点', lat, lng, date: now.date, time: now.time, notes:'' };
        addMarkerForItem(tempItem);
        setItems((prev)=>[...prev, tempItem]);
        try{ const name = await reverseGeocode(lat,lng); setItems((prev)=> prev.map((it)=> it.id===tempItem.id?{...it, name: name||it.name}:it)); }catch(_){ }
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
      try{ const name = await reverseGeocode(latlng.lat, latlng.lng); setItems((prev)=> prev.map((it)=> it.id===item.id?{...it, name: name||it.name}:it)); }catch(_){ }
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
    // race two providers for speed
    const nomi = axios.get('https://nominatim.openstreetmap.org/reverse', {
      params:{ format:'jsonv2', lat, lon:lng, addressdetails:1 },
      headers:{ 'Accept':'application/json','Accept-Language':'zh-CN' }, timeout:6000
    }).then(res=>{ const d=res.data||{}; const addr = d.address||null; const disp=d.display_name||''; return formatCnAddress(addr, disp); });
    const photon = axios.get('https://photon.komoot.io/reverse', {
      params:{ lat, lon:lng }, timeout:6000
    }).then(res=>{ const f=res.data&&res.data.features&&res.data.features[0]; return (f&&f.properties&&(f.properties.name||f.properties.city||f.properties.street)) || ''; });
    try{
      const name = await Promise.race([nomi, photon]); reverseCache.set(key, name); return name;
    }catch(_){
      try{ const name = await Promise.any([nomi, photon]); reverseCache.set(key, name); return name; }catch(__){ return ''; }
    }
  };

  // ---- Sagas integration ----
  const loadPlans = useCallback(()=>{ dispatch({ type:'TRAVEL_PLANS_FETCH_REQUEST' }); }, [dispatch]);
  const loadPlanDetail = useCallback((id)=>{ if(!id) return; dispatch({ type:'TRAVEL_PLAN_FETCH_REQUEST', payload:id }); }, [dispatch]);
  const savePlan = useCallback(()=>{ if(!planName.trim()){ setError('请输入计划名称'); return; } setError(''); dispatch({ type:'TRAVEL_PLAN_SAVE_REQUEST', payload:{ id:planId, name:planName.trim(), items } }); }, [dispatch, planId, planName, items]);
  const newPlan = ()=>{ setPlanId(null); setPlanName('我的旅行计划'); setItems([]); if (clusterGroupRef.current && clusterGroupRef.current.clearLayers){ try{ clusterGroupRef.current.clearLayers(); }catch(_){ } } Object.values(markersRef.current).forEach((m)=>{ try{ m.remove(); }catch(_){ } }); markersRef.current = {}; };
  const deletePlan = useCallback(()=>{ if(!planId) return newPlan(); dispatch({ type:'TRAVEL_PLAN_DELETE_REQUEST', payload:planId }); }, [dispatch, planId]);

  useEffect(()=>{
    if (!currentPlan) return;
    if (clusterGroupRef.current && clusterGroupRef.current.clearLayers){ try{ clusterGroupRef.current.clearLayers(); }catch(_){ } }
    Object.values(markersRef.current).forEach((m)=>{ try{ m.remove(); }catch(_){ } }); markersRef.current={};
    setPlanId(currentPlan.id||null); setPlanName(currentPlan.name||'未命名计划');
    const list = Array.isArray(currentPlan.items)? currentPlan.items : [];
    setItems(list);
    setTimeout(()=>{ list.forEach((it)=> addMarkerForItem(it)); if (list[0] && mapRef.current) mapRef.current.setView([list[0].lat, list[0].lng], getRuntimeMapConfig().initialZoom); },0);
  }, [currentPlan, addMarkerForItem]);

  // ---- Search ----
  const searchCancelRef = useRef(null);
  const searchReqIdRef = useRef(0);
  const [searching,setSearching]=useState(false);
  const doSearch = useCallback(async(q)=>{
    const query=(q||'').trim(); if(!query || query.length<2){ setSuggestions([]); return; }
    // cache key includes bounds mode
    let boundsKey='global'; let viewboxParam='';
    if (useMapBounds && mapRef.current){
      const b = mapRef.current.getBounds(); const west=b.getWest().toFixed(3), east=b.getEast().toFixed(3), north=b.getNorth().toFixed(3), south=b.getSouth().toFixed(3);
      boundsKey = `${west},${north},${east},${south}`; viewboxParam = `&viewbox=${west},${north},${east},${south}&bounded=1`;
    }
    const cacheKey=query+'|'+boundsKey;
    if (searchCache.has(cacheKey)){ setSuggestions(searchCache.get(cacheKey)); return; }
    if (searchCancelRef.current) searchCancelRef.current.cancel('cancelled');
    const source = axios.CancelToken.source(); searchCancelRef.current=source; setSearching(true);
    const reqId = ++searchReqIdRef.current;
    // two providers in parallel; first response wins
    const nomiUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&accept-language=zh-CN&q=${encodeURIComponent(query)}${viewboxParam}`;
    const p1 = axios.get(nomiUrl,{ headers:{'Accept':'application/json'}, timeout:7000, cancelToken:source.token })
      .then(res=> Array.isArray(res.data)?res.data:[]);
    const p2 = axios.get('https://photon.komoot.io/api/',{ params:{ q:query, limit:8 }, timeout:7000, cancelToken:source.token })
      .then(res=>{ const feats=(res.data&&res.data.features)||[]; return feats.map((f)=>({ place_id:f.properties&&f.properties.osm_id, osm_id:f.properties&&f.properties.osm_id, display_name:f.properties&&(f.properties.name||f.properties.street||f.properties.city||f.properties.country), lat:f.geometry&&f.geometry.coordinates?String(f.geometry.coordinates[1]):'0', lon:f.geometry&&f.geometry.coordinates?String(f.geometry.coordinates[0]):'0' })); });
    try{
      let first = await Promise.race([p1, p2]);
      const center = mapRef.current? mapRef.current.getCenter(): null;
      if (center && first.length){ first = first.map(d=>({ ...d, __dist: Math.hypot((parseFloat(d.lat)-center.lat), (parseFloat(d.lon)-center.lng)) })).sort((a,b)=> (a.__dist||0)-(b.__dist||0)); }
      if (reqId===searchReqIdRef.current){ searchCache.set(cacheKey, first); setSuggestions(first); }
      // try merge the other quietly (no flicker)
      Promise.allSettled([p1,p2]).then(([a,b])=>{
        if (reqId!==searchReqIdRef.current) return;
        const arr = (a.status==='fulfilled'?a.value:[]).concat(b.status==='fulfilled'?b.value:[]);
        // dedupe by lat/lon/name
        const seen=new Set(); const merged=[]; for(const d of arr){ const k=`${d.lat}|${d.lon}|${d.display_name}`; if(seen.has(k)) continue; seen.add(k); merged.push(d); }
        const center2 = mapRef.current? mapRef.current.getCenter(): null; let sorted=merged;
        if (center2 && merged.length){ sorted = merged.map(d=>({ ...d, __dist: Math.hypot((parseFloat(d.lat)-center2.lat), (parseFloat(d.lon)-center2.lng)) })).sort((a,b)=> (a.__dist||0)-(b.__dist||0)); }
        searchCache.set(cacheKey, sorted); setSuggestions(sorted);
      });
    }catch(e){ if(!axios.isCancel(e)){ setError('地点搜索失败'); setSuggestions([]);} }
    finally{ setSearching(false); }
  }, [useMapBounds]);
  const debounceTimer = useRef(null);
  const onSearchInputChange = (val)=>{ setSearchQuery(val); if (debounceTimer.current) clearTimeout(debounceTimer.current); debounceTimer.current=setTimeout(()=>doSearch(val),250); };

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

  const parseTimeVal = useCallback((it)=>{ const d=it.date||''; const t=it.time||''; const ts=(d+' '+t).trim(); return ts? (Date.parse(ts.replace(/-/g,'/'))||Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER; }, []);
  const sortItemsForTimeline = useCallback((list)=>{ if (timelineManualOrder) return list.slice(); const withIndex=list.map((it,i)=>({...it,__idx:i})); return withIndex.slice().sort((a,b)=>{ const av=parseTimeVal(a), bv=parseTimeVal(b); if (av===bv) return a.__idx-b.__idx; return av-bv; }); }, [timelineManualOrder, parseTimeVal]);
  const timelineItems = useMemo(()=> sortItemsForTimeline(items), [items, sortItemsForTimeline]);
  const resetTimelineAuto = ()=>{ setItems((prev)=> sortItemsForTimeline(prev)); setTimelineManualOrder(false); };

  // compute segment distances and update polylines
  const segmentDistances = useMemo(()=>{
    const arr = items.map(()=> null);
    for (let i=1;i<items.length;i++){
      const a=items[i-1], b=items[i];
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
      const results = new Array(items.length).fill(null);
      const tasks = [];
      for (let i=1;i<items.length;i++){
        const a=items[i-1], b=items[i];
        if (!isFinite(a.lat)||!isFinite(a.lng)||!isFinite(b.lat)||!isFinite(b.lng)) continue;
        const key = `${a.lat.toFixed(5)},${a.lng.toFixed(5)}|${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
        const cached = routeCacheRef.current.get(key);
        if (cached){ results[i]=cached; continue; }
        const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false&alternatives=false&steps=false`;
        tasks.push(
          axios.get(url, { timeout: 8000 }).then(res=>{
            const routes = res.data && res.data.routes; const meters = routes && routes[0] && routes[0].distance; const km = meters? (meters/1000) : null;
            if (km){ routeCacheRef.current.set(key, km); results[i]=km; }
          }).catch(()=>{})
        );
      }
      await Promise.allSettled(tasks);
      if (!canceled) setRouteDistances(results);
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
      if (isFinite(a.lat) && isFinite(a.lng) && isFinite(b.lat) && isFinite(b.lng)){
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
        <div className="brand">旅行计划</div>
        <div className="controls">
          <input disabled={!mapReady} className="search-input" placeholder="搜索地点（输入≥2个字）回车或停顿触发" aria-label="搜索地点" value={searchQuery} onChange={(e)=> onSearchInputChange(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); doSearch(searchQuery); } }} />
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
          <button
            className="icon-btn"
            title="定位到当前位置"
            onClick={()=>{
              if (!navigator.geolocation) { setError('当前浏览器不支持定位'); return; }
              navigator.geolocation.getCurrentPosition((pos)=>{
                const { latitude, longitude } = pos.coords;
                if (mapRef.current) mapRef.current.setView([latitude, longitude], 14);
              }, ()=> setError('定位失败，请检查权限'));
            }}
          >定位</button>
          <div className="view-toggle">
            <button className={`icon-btn ${viewMode==='list'?'active':''}`} onClick={()=> setViewMode('list')}>列表</button>
            <button className={`icon-btn ${viewMode==='timeline'?'active':''}`} onClick={()=> setViewMode('timeline')}>时间轴</button>
            <button className={`icon-btn ${viewMode==='day'?'active':''}`} onClick={()=> setViewMode('day')}>按天</button>
            {viewMode==='timeline'? <button className="icon-btn" onClick={resetTimelineAuto} title="按时间排序">按时间排序</button> : null}
            <button className="icon-btn" onClick={sortByDateTime} title="按日期时间排序并切换按天视图">按天排序</button>
            <button className={`icon-btn ${useRouteDistance?'active':''}`} onClick={()=> setUseRouteDistance(v=>!v)} title="路线型距离（OSRM）">路线距离</button>
          </div>
        </div>
      </header>

      <div className="map-container" ref={containerRef} aria-label="地图" />

      {(searching || suggestions.length>0) && (
        <div className="suggestions">
          {searching && <div className="suggestion-item">搜索中…</div>}
          {suggestions.map((s)=>(
            <div key={s.place_id || s.osm_id} className="suggestion-item" onClick={()=>{
              const lat=parseFloat(s.lat), lng=parseFloat(s.lon); const now=getNowDateTime();
              const prev = items[items.length-1];
              const seg = prev? haversineKm(prev.lat, prev.lng, lat, lng) : 0;
              const mode = prev? recommendTransport(seg) : '';
              const defaultNotes = prev? `与上个地点直线距离约 ${seg.toFixed(1)} km · 交通：建议${mode}` : '';
              const item={ id:uid(), placeId:String(s.place_id||s.osm_id||''), name:s.display_name||'未命名地点', lat, lng, date:now.date, time:now.time, notes: defaultNotes };
              addMarkerForItem(item); setItems((prev)=>[...prev,item]); setSuggestions([]); setSearchQuery(''); if(mapRef.current) mapRef.current.setView([lat,lng], 14);
            }}>
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

      <section className="sheet">
        <div className="sheet-header">
          <input className="plan-name" value={planName} onChange={(e)=> setPlanName(e.target.value)} placeholder="计划名称" />
          <div className="actions">
            <button className="btn" onClick={newPlan}>新建</button>
            <button className="btn" onClick={savePlan} disabled={planSaving}>{planSaving?'保存中…':'保存'}</button>
            <button className="btn danger" onClick={deletePlan} disabled={planDeleting}>{planDeleting?'删除中…':'删除'}</button>
            <button className="btn" onClick={()=> exportTxtWithDistances(planName, items, finalDistances)}>导出TXT</button>
            <button className="btn" onClick={()=> exportMarkdown(planName, dayGroups, finalDistances)}>导出MD</button>
            <button className="btn" onClick={()=> exportCSV(planName, items, finalDistances)}>导出CSV</button>
          </div>
        </div>

        <div className="plans-bar">
          <button className="btn" onClick={loadPlans} disabled={travelPlansLoading}>{travelPlansLoading?'加载中…':'刷新计划'}</button>
          <select className="plan-select" onChange={(e)=> loadPlanDetail(e.target.value)} value={planId || ''}>
            <option value="" disabled>选择已有计划</option>
            {(travelPlans||[]).map((p)=> (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>

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
                  <input className="item-name" value={it.name} onChange={(e)=> updateItemField(it.id,'name',e.target.value)} placeholder="地点名称/备注" />
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
                  <button className="icon-btn danger" onClick={()=> removeItem(it.id)}>✕</button>
                </div>
                <div className="item-line">
                  <input type="date" className="date-input" value={it.date||''} onChange={(e)=> updateItemField(it.id,'date',e.target.value)} />
                  <input type="time" className="time-input" value={it.time||''} onChange={(e)=> updateItemField(it.id,'time',e.target.value)} />
                  <div className="coords">{it.lat.toFixed(5)}, {it.lng.toFixed(5)}{finalDistances[idx]? ` · 距上个 ${finalDistances[idx].toFixed(1)} km · 建议：${recommendTransport(finalDistances[idx])}` : ''}</div>
                </div>
                <textarea className="notes" rows={2} value={it.notes||''} onChange={(e)=> updateItemField(it.id,'notes',e.target.value)} placeholder="备注" />
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
                    <input className="item-name" value={it.name} onChange={(e)=> updateItemField(it.id,'name',e.target.value)} />
                    <div className="move">
                      <button className="icon-btn" onClick={()=>{ setItems((prev)=>{ const currentTimeline=sortItemsForTimeline(prev); const ids=currentTimeline.map((x)=>x.id); const from=idx; const to=idx-1; if(from<=0) return prev; const [movedId]=ids.splice(from,1); ids.splice(to,0,movedId); const idToItem=new Map(prev.map((p)=>[p.id,p])); const next=ids.map((id)=> idToItem.get(id)).filter(Boolean); return next; }); setTimelineManualOrder(true); }} disabled={idx===0}>↑</button>
                      <button className="icon-btn" onClick={()=>{ setItems((prev)=>{ const currentTimeline=sortItemsForTimeline(prev); const ids=currentTimeline.map((x)=>x.id); const from=idx; const to=idx+1; if(from>=ids.length-1) return prev; const [movedId]=ids.splice(from,1); ids.splice(to,0,movedId); const idToItem=new Map(prev.map((p)=>[p.id,p])); const next=ids.map((id)=> idToItem.get(id)).filter(Boolean); return next; }); setTimelineManualOrder(true); }} disabled={idx===timelineItems.length-1}>↓</button>
                    </div>
                    <button className="icon-btn danger" onClick={()=> removeItem(it.id)}>✕</button>
                  </div>
                  <div className="timeline-meta">
                    <input type="date" className="date-input" value={it.date||''} onChange={(e)=> updateItemField(it.id,'date',e.target.value)} />
                    <input type="time" className="time-input" value={it.time||''} onChange={(e)=> updateItemField(it.id,'time',e.target.value)} />
                    <span className="coords">{it.lat.toFixed(5)}, {it.lng.toFixed(5)}{finalDistances[items.indexOf(it)]? ` · 距上个 ${finalDistances[items.indexOf(it)].toFixed(1)} km · 建议：${recommendTransport(finalDistances[items.indexOf(it)])}` : ''}</span>
                  </div>
                  <textarea className="notes" rows={2} value={it.notes||''} onChange={(e)=> updateItemField(it.id,'notes',e.target.value)} placeholder="备注" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="day-groups">
            {dayGroups.map(group=> (
              <div key={group.day} className="day-section">
                <div className="item-line" style={{fontWeight:600}}>
                  <div className="index">{group.day}</div>
                  <div style={{marginLeft:8}}>当天总距离：{group.totalKm.toFixed(1)} km</div>
                  <div style={{marginLeft:'auto'}}>起止：{group.start||'-'}{group.end?(' - '+group.end):''}</div>
                </div>
                <ul className="item-list">
                  {group.entries.map(({item, index})=> (
                    <li className="item" key={item.id} draggable onDragStart={()=> setDragIndex(index)} onDragOver={(e)=> e.preventDefault()} onDrop={()=>{ reorder(dragIndex, index); setDragIndex(null); }}>
                      <div className="item-line">
                        <div className="index">{index+1}{item.startOfDay? ' · 起点':''}{item.endOfDay? ' · 终点':''}</div>
                        <input className="item-name" value={item.name} onChange={(e)=> updateItemField(item.id,'name',e.target.value)} placeholder="地点名称/备注" />
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
                        <button className="icon-btn danger" onClick={()=> removeItem(item.id)}>✕</button>
                      </div>
                      <div className="item-line">
                        <input type="date" className="date-input" value={item.date||''} onChange={(e)=> updateItemField(item.id,'date',e.target.value)} />
                        <input type="time" className="time-input" value={item.time||''} onChange={(e)=> updateItemField(item.id,'time',e.target.value)} />
                        <div className="coords">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}{finalDistances[index]? ` · 距上个 ${finalDistances[index].toFixed(1)} km · 建议：${recommendTransport(finalDistances[index])}` : ''}</div>
                      </div>
                      <textarea className="notes" rows={2} value={item.notes||''} onChange={(e)=> updateItemField(item.id,'notes',e.target.value)} placeholder="备注" />
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
        </div>
      </section>
    </div>
  );
}
