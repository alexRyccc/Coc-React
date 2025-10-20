// Node helper to exercise the parser and exporter without running UI
const fs = require('fs');
const path = require('path');

// Minimal copies of functions from jahua.js needed for test
function toCnDateHeader(d){
  const cnWeek = ['日','一','二','三','四','五','六'];
  const dt=new Date(d.replace(/-/g,'/')); const m=dt.getMonth()+1; const dd=dt.getDate();
  return `${m}月${dd}日周${cnWeek[dt.getDay()]}`;
}
function toCnTime(t){ const m=t.match(/^(\d{1,2}):(\d{2})$/); if(!m) return t; return `${parseInt(m[1],10)}点${m[2]}`; }

function parseChineseItinerary(text){
  const linesSrc = String(text||'').split(/\r?\n/);
  const lines = [];
  for (let s of linesSrc){ s = s.trim(); if (!s) { lines.push(''); continue; } lines.push(s); }
  const entries = [];
  const dayHeaderRe = /^(?:\d{1,2})月(?:\d{1,2})日(?:周[一二三四五六日天])?$/;
  const datePickRe = /(\d{1,2})月(\d{1,2})日/;
  const timeLineRe = /^时间[:：]\s*(.+)$/;
  const numberedRe = /^(\d{1,2})[，,、.]+\s*(.+)$/;
  const to24h = (s)=>{
    if (!s) return '';
    const m = s.match(/(上|下|中)?午?\s*(\d{1,2})\s*点(?:\s*(\d{1,2}))?(?:\s*半)?/);
    if (m){ let h=parseInt(m[2],10)||0; let mm=parseInt(m[3]||'0',10)||0; if(/下/.test(m[1]||'') && h<12) h+=12; const p=(n)=>n<10?'0'+n:''+n; return `${p(h)}:${p(mm)}`; }
    const m2 = s.match(/(\d{1,2})[:：](\d{2})/); if (m2){ const p=(n)=>n<10?'0'+n:''+n; return `${p(parseInt(m2[1],10))}:${p(parseInt(m2[2],10))}`; }
    return '';
  };
  let currentDateStr = '';
  let pending = null;
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
      const body = tline[1];
      const t = to24h(body);
      const nameMatch = body.match(/到达\s*([^，。,\s]+)/) || body.match(/到\s*([^，。,\s]+)/);
      const place = nameMatch ? nameMatch[1] : '';
      pushPending();
      pending = { name: place || '行程事件', time: t||'', notes: raw, dateStr: currentDateStr||'' };
      continue;
    }
    const num = raw.match(numberedRe);
    if (num){ pushPending(); pending = { name: (num[2]||'').trim(), time:'', notes:'', dateStr: currentDateStr||'' }; continue; }
    if (!pending){ pending = { name:'未命名', time:'', notes:'', dateStr: currentDateStr||'' }; }
    pending.notes = (pending.notes? pending.notes+'\n' : '') + raw;
  }
  pushPending();
  return entries.filter(e=> (e.name && e.name.trim())).map(e=> ({...e, name: e.name.replace(/^(周[一二三四五六日天])?/, '').trim()}));
}

function exportNarrative(name, list){
  const groups = list.reduce((m,it)=>{ const d=it.date||''; (m[d]=m[d]||[]).push(it); return m; },{});
  const lines = [];
  if (name) lines.push(name);
  Object.keys(groups).sort().forEach((d)=>{
    lines.push(''); lines.push(toCnDateHeader(d));
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
  return lines.join('\n');
}

function main(){
  const txt = fs.readFileSync(path.join(__dirname,'itinerary_sample.txt'),'utf8');
  const parsed = parseChineseItinerary(txt);
  let lastDate = '';
  const items = parsed.map((e)=>{
    const date = e.dateStr || lastDate || '2025-09-21';
    lastDate = date;
    return { name:e.name||'', date, time:e.time||'', notes:e.notes||'', _type: e._type||'poi' };
  });
  const out = exportNarrative('长沙到岳阳旅行计划', items);
  const outPath = path.join(__dirname,'..','preview','narrative_preview.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Written to', outPath);
}

main();
