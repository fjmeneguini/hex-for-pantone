// Pequeno app para encontrar Pantone mais próximo de um HEX usando CIEDE2000
let pantoneLib = [];

async function init(){
  // carregar sample JSON embutido
  try{
    // tentar carregar a biblioteca completa primeiro
    let res = await fetch('pantone_full.json');
    if(!res.ok){
      res = await fetch('pantone_sample.json');
    }
    pantoneLib = await res.json();
  }catch(e){
    console.warn('Não foi possível carregar o sample pantone.json', e);
    pantoneLib = [];
  }

  document.getElementById('findBtn').addEventListener('click', onFind);
  document.getElementById('fileInput').addEventListener('change', onFile);
  document.getElementById('copyBest').addEventListener('click', copyBest);
  document.getElementById('exportCSV').addEventListener('click', exportCSV);
  document.getElementById('hexInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter') onFind(); });
}

function onFile(e){
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const text = reader.result;
    if(f.name.toLowerCase().endsWith('.json')){
      try{ pantoneLib = JSON.parse(text); showMessage('Biblioteca carregada: ' + pantoneLib.length + ' cores'); }
      catch(err){ showMessage('JSON inválido'); }
    }else if(f.name.toLowerCase().endsWith('.csv')){
      pantoneLib = parseCSV(text);
      showMessage('CSV carregado: ' + pantoneLib.length + ' cores');
    }else{
      showMessage('Formato não suportado');
    }
  };
  reader.readAsText(f);
}

function parseCSV(text){
  // csv parser simples: aceita , or ; as separator and finds header containing hex/pantone/name
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length===0) return [];
  // detect separator by checking first line
  const sep = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const header = lines.shift().split(sep).map(h=>h.trim().toLowerCase());
  const idx = { hex: header.findIndex(h=>/hex|#|color|cor/.test(h)), pantone: header.findIndex(h=>/pantone|pantone name|name/.test(h)), name: header.findIndex(h=>/name|descricao/.test(h)) };
  return lines.map(l=>{
    const cols = l.split(sep).map(c=>c.trim());
    const hex = (idx.hex>=0?cols[idx.hex]:cols[0]) || cols.find(c=>/^#?[0-9a-f]{6}$/i.test(c));
    const pantone = (idx.pantone>=0?cols[idx.pantone]:(idx.name>=0?cols[idx.name]:undefined));
    return { pantone: pantone, name: pantone, hex: hex };
  }).filter(o=>o.hex);
}

function showMessage(msg){
  const el = document.getElementById('result');
  el.innerHTML = '<div class="small-muted">'+escapeHtml(msg)+'</div>';
}

function escapeHtml(s){return (s+'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function onFind(){
  const hex = document.getElementById('hexInput').value.trim();
  if(!/^#?[0-9a-f]{6}$/i.test(hex)) return showMessage('Digite um HEX válido, ex: #1E90FF');
  const hx = hex.startsWith('#')?hex:'#'+hex;
  if(!pantoneLib.length) return showMessage('Biblioteca Pantone vazia. Carregue um arquivo ou garanta que o sample JSON exista.');

  const rgb = hexToRgb(hx);
  const lab = rgb2lab(rgb);
  const maxDist = parseFloat(document.getElementById('threshold').value) || 100;
  const method = document.getElementById('method')?.value || 'ciede2000';

  // calcular distancia para cada pantone
  const scored = pantoneLib.map(p=>{
    const phex = (p.hex||p.color||'').replace(/^\s+|\s+$/g,'');
    const valid = /^#?[0-9a-f]{6}$/i.test(phex);
    if(!valid) return null;
    const phx = phex.startsWith('#')?phex:'#'+phex.replace('#','');
    const prgb = hexToRgb(phx);
    const plab = rgb2lab(prgb);
    const d = method === 'deltae76' ? deltaE76(lab,plab) : deltaE00(lab,plab);
    return {p, hex:phx, distance:d};
  }).filter(Boolean).sort((a,b)=>a.distance-b.distance);

  const filtered = scored.filter(s=>s.distance <= maxDist);
  renderResult(hx, filtered.slice(0,10));
  document.getElementById('statusHint').textContent = filtered.length + ' correspondências dentro do limite (mostrando até 10)';
}

function renderResult(inputHex, nearest){
  const r = document.getElementById('result');
  r.innerHTML = '';
  const s = document.createElement('div'); s.className='swatch';
  const box = document.createElement('div'); box.className='box'; box.style.background = inputHex;
  const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = '<div>Entrada: <strong>'+inputHex+'</strong></div>';
  s.appendChild(box); s.appendChild(meta); r.appendChild(s);

  const list = document.getElementById('nearestList'); list.innerHTML = '';
  nearest.forEach((item,i)=>{
    const el = document.createElement('div'); el.className='nearest-item'+(i===0?' best':'');
    const b = document.createElement('div'); b.className='box'; b.style.background = item.hex;
    const txt = document.createElement('div'); txt.innerHTML = '<div><strong>'+(item.p.pantone||item.p.name||'') + '</strong> <span class="small-muted">'+(item.hex)+'</span></div><div class="small-muted">'+escapeHtml(item.p.name||'')+'</div>';
    const dist = document.createElement('div'); dist.className='distance'; dist.textContent = item.distance.toFixed(2);
    el.appendChild(b); el.appendChild(txt); el.appendChild(dist);
    list.appendChild(el);
  });
}

function getCurrentNearest(){
  const items = Array.from(document.querySelectorAll('#nearestList .nearest-item'));
  if(!items.length) return null;
  const first = items[0];
  const hex = first.querySelector('.box').style.background || null;
  const title = first.querySelector('strong')?.textContent || '';
  const dist = first.querySelector('.distance')?.textContent || '';
  return {hex,title,dist};
}

async function copyBest(){
  const best = getCurrentNearest();
  if(!best) return showMessage('Nenhum resultado para copiar');
  const txt = `Pantone: ${best.title} - HEX: ${best.hex} - DeltaE: ${best.dist}`;
  try{ await navigator.clipboard.writeText(txt); showMessage('Melhor resultado copiado para área de transferência'); }
  catch(e){ showMessage('Falha ao copiar: ' + e.message); }
}

function exportCSV(){
  const rows = [];
  const items = Array.from(document.querySelectorAll('#nearestList .nearest-item'));
  if(!items.length) return showMessage('Nenhum resultado para exportar');
  items.forEach(it=>{
    const hex = it.querySelector('.box').style.background || '';
    const pant = it.querySelector('strong')?.textContent || '';
    const dist = it.querySelector('.distance')?.textContent || '';
    rows.push([pant,hex,dist]);
  });
  const csv = ['pantone,hex,deltaE', ...rows.map(r=>r.map(c=>`"${(c+'').replace(/"/g,'""')}"`).join(','))].join('\r\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'pantone_nearest.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ---------- color utils ----------
function hexToRgb(hex){
  const h = hex.replace('#','');
  return {r:parseInt(h.substring(0,2),16), g:parseInt(h.substring(2,4),16), b:parseInt(h.substring(4,6),16)};
}

function rgb2lab({r,g,b}){
  // sRGB (0..255) -> XYZ -> CIE-Lab
  let [R,G,B] = [r/255,g/255,b/255].map(v=>{
    return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  // Observer= 2°, Illuminant= D65
  const X = (R*0.4124564 + G*0.3575761 + B*0.1804375) / 0.95047;
  const Y = (R*0.2126729 + G*0.7151522 + B*0.0721750) / 1.00000;
  const Z = (R*0.0193339 + G*0.1191920 + B*0.9503041) / 1.08883;

  const fx = X > 0.008856 ? Math.cbrt(X) : (7.787*X) + 16/116;
  const fy = Y > 0.008856 ? Math.cbrt(Y) : (7.787*Y) + 16/116;
  const fz = Z > 0.008856 ? Math.cbrt(Z) : (7.787*Z) + 16/116;

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const b2 = 200 * (fy - fz);
  return {L,a,b:b2};
}

// Implementation of CIEDE2000 — returns deltaE
function deltaE00(lab1, lab2){
  // from Sharma et al.
  const L1 = lab1.L, a1 = lab1.a, b1 = lab1.b;
  const L2 = lab2.L, a2 = lab2.a, b2 = lab2.b;
  const avgLp = (L1 + L2) / 2.0;
  const C1 = Math.sqrt(a1*a1 + b1*b1);
  const C2 = Math.sqrt(a2*a2 + b2*b2);
  const avgC = (C1 + C2) / 2.0;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC,7) / (Math.pow(avgC,7) + Math.pow(25,7))));
  const a1p = (1+G) * a1;
  const a2p = (1+G) * a2;
  const C1p = Math.sqrt(a1p*a1p + b1*b1);
  const C2p = Math.sqrt(a2p*a2p + b2*b2);
  const avgCp = (C1p + C2p) / 2.0;
  function hp(a,b){
    if(a === 0 && b === 0) return 0;
    const t = Math.atan2(b,a);
    return t >= 0 ? t : t + 2*Math.PI;
  }
  const h1p = hp(a1p,b1);
  const h2p = hp(a2p,b2);
  let dLp = L2 - L1;
  let dCp = C2p - C1p;
  let dhp = 0;
  if(C1p*C2p === 0) dhp = 0;
  else{
    const diff = h2p - h1p;
    if(Math.abs(diff) <= Math.PI) dhp = diff;
    else if(diff > Math.PI) dhp = diff - 2*Math.PI;
    else dhp = diff + 2*Math.PI;
  }
  const dHp = 2 * Math.sqrt(C1p*C2p) * Math.sin(dhp/2.0);
  const avgLp_rad = (avgLp + 0) / 1.0;
  const avgHp = (C1p*C2p === 0) ? h1p + h2p : (Math.abs(h1p - h2p) > Math.PI ? (h1p + h2p + 2*Math.PI)/2.0 : (h1p + h2p)/2.0);
  const T = 1 - 0.17*Math.cos(avgHp - Math.PI/6) + 0.24*Math.cos(2*avgHp) + 0.32*Math.cos(3*avgHp + Math.PI/30) - 0.20*Math.cos(4*avgHp - 63 * Math.PI/180);
  const deltaRo = 30 * Math.exp(- (( (avgHp*180/Math.PI - 275)/25) ** 2)) ;
  const Rc = 2 * Math.sqrt(Math.pow(avgCp,7) / (Math.pow(avgCp,7) + Math.pow(25,7)));
  const Sl = 1 + (0.015 * Math.pow(avgLp - 50,2)) / Math.sqrt(20 + Math.pow(avgLp - 50,2));
  const Sc = 1 + 0.045 * avgCp;
  const Sh = 1 + 0.015 * avgCp * T;
  const Rt = -Math.sin(2 * deltaRo * Math.PI/180) * Rc;

  const dE = Math.sqrt(
    Math.pow(dLp / Sl,2) +
    Math.pow(dCp / Sc,2) +
    Math.pow(dHp / Sh,2) +
    Rt * (dCp / Sc) * (dHp / Sh)
  );
  return dE;
}

// Simples Delta E 1976 (Euclidean in Lab)
function deltaE76(lab1, lab2){
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL*dL + da*da + db*db);
}

window.addEventListener('DOMContentLoaded', init);
