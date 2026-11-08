// @ts-nocheck
interface DiagramEngineDeps {
  getRenderOpts: () => { strict: boolean; trust: string; textSafety?: number };
  getRenderCtx: () => any;
  deckDiagram: (c: any, box?: any) => string;
  XBDiag: {
    report: (code: string, severity: string, message: string, details?: any) => void;
  };
  renderStandardWhiteHeader: (sectionTag: string, slideNumberStr: string) => string;
  renderStandardWhiteFooter: (slideNumberStr: string, showAwsCoBrand?: boolean) => string;
  escapedContent: (value: any) => any;
  xbTrustedHtml: (src: any, context?: string) => string;
}

export function createDiagramEngine(deps: DiagramEngineDeps) {
  const { XBDiag, renderStandardWhiteHeader, renderStandardWhiteFooter, escapedContent, xbTrustedHtml, deckDiagram } = deps;
  const XB_RENDER_OPTS = new Proxy({} as any, {
    get(_, prop) {
      return deps.getRenderOpts()[prop as string];
    }
  });

    const DG_COLORS=['#F97C00','#25AC9D','#007BC1','#85439A','#F6AF2F','#425453'];
    const dgN=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
    const dgClamp=(v,min,max)=>Math.max(min,Math.min(max,dgN(v)));
    function dgLines(s,max=25,count=3){let words=String(s??'').split(/\s+/),out=[],cur='';for(let w of words){if(cur&&(cur+' '+w).length>max){out.push(cur);cur=w;}else cur=cur?cur+' '+w:w;}if(cur)out.push(cur);if(out.length>count){XBDiag.report('text.truncated','warning',`"${String(s).slice(0,60)}" needs ${out.length} lines of ≈${max} characters; the layout shows ${count}`,{text:String(s)});out=out.slice(0,count);out[count-1]=out[count-1].slice(0,max-1)+'…';}return out;}
    function dgT(x,y,s,size=23,color='#425453',anchor='start',max=26,count=2,weight=700){return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="Manrope,Arial,sans-serif" font-size="${size}" font-weight="${weight}">${dgLines(s,max,count).map((l,i)=>`<tspan x="${x}" dy="${i?size*1.26:0}">${l}</tspan>`).join('')}</text>`;}
    function dgR(x,y,w,h,fill='#fff',stroke='#DEE8E2',radius=18){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;}
    function dgA(x1,y1,x2,y2,col='#F97C00'){return `<path d="M${x1} ${y1} L${x2-12} ${y2}" stroke="${col}" stroke-width="4" fill="none"/><path d="M${x2-13} ${y2-9} L${x2} ${y2} L${x2-13} ${y2+9}Z" fill="${col}"/>`;}
    function dgPage(c,index,graphic){let num=String(index+1).padStart(2,'0');return `<div class="diagram-page w-[1920px] h-[1080px] relative bg-white overflow-hidden">${renderStandardWhiteHeader(c.sectionTag||'DIAGRAMS',num)}<div class="dg-head"><div class="dg-eyebrow">${c.kicker||'PROPOSED VISUAL FRAMEWORK'}</div><h1>${c.title||'Diagram'}</h1><p>${c.subtitle||''}</p></div><div class="dg-graphic"><svg class="dg-svg" viewBox="0 0 1728 600" role="img" aria-label="${c.title||'Diagram'}">${graphic}</svg></div><div class="dg-note">${c.note||'Proposed diagram · dữ liệu chỉ minh họa trừ khi có ghi chú nguồn xác thực'}</div>${renderStandardWhiteFooter(num)}</div>`;}
    function dgProcess(c){let s=(c.steps||[]).slice(0,5),o='';s.forEach((t,i)=>{let x=14+i*341,y=154+(i%2)*35,k=DG_COLORS[i%5];o+=dgR(x,y,315,298,i===0?'#FFF5ED':'#FFFFFF',i===0?'#F97C00':'#DCE7E0',23)+`<rect x="${x+22}" y="${y+23}" width="65" height="65" rx="16" fill="${k}"/>`+dgT(x+55,y+65,String(i+1).padStart(2,'0'),26,'white','middle')+dgT(x+23,y+141,t.title,27,'#425453','start',21,2)+dgT(x+23,y+215,t.desc,20,'#657772','start',27,4,500);if(i<s.length-1)o+=dgA(x+321,y+158,x+341,y+158);});return o;}
    function dgFunnel(c){let s=(c.stages||[]).slice(0,5),o='',cx=864;s.forEach((t,i)=>{let w=1500-i*172,b=w-130,y=18+i*111,k=DG_COLORS[i%5],fg=i===4?'#425453':'white';o+=`<path d="M${cx-w/2} ${y}H${cx+w/2}L${cx+b/2} ${y+99}H${cx-b/2}Z" fill="${k}"/>`+dgT(cx,y+42,t.title,27,fg,'middle',45,1)+dgT(cx,y+79,(t.value||'')+' · '+(t.desc||''),19,fg,'middle',55,1,600);});return o;}
    function dgCycle(c){let a=(c.nodes||[]).slice(0,6),n=a.length||1,cx=864,cy=298,o=`<ellipse cx="${cx}" cy="${cy}" rx="555" ry="212" fill="none" stroke="#DAE8E1" stroke-width="5" stroke-dasharray="10 11"/>`+dgR(cx-158,cy-116,316,225,'#FFF5ED','#FBCAAB',110)+dgT(cx,cy-16,c.center||'BUILD → LEARN',33,'#425453','middle',19,2)+dgT(cx,cy+35,c.centerSub||'→ IMPROVE',26,'#F97C00','middle',18,1);a.forEach((t,i)=>{let ang=-Math.PI/2+i*2*Math.PI/n,x=cx+555*Math.cos(ang),y=cy+212*Math.sin(ang),k=DG_COLORS[i%5];o+=dgR(x-145,y-70,290,144,'white','#DBE6E0',20)+`<circle cx="${x-106}" cy="${y-34}" r="20" fill="${k}"/>`+dgT(x-106,y-27,i+1,20,'white','middle')+dgT(x,y,t.title,22,'#425453','middle',23,2)+dgT(x,y+46,t.desc,17,'#6F817D','middle',28,2,500);});return o;}
    function dgPyramid(c){let s=(c.levels||[]).slice(0,5),cx=666,o='';s.forEach((t,i)=>{let y=33+i*109,w=320+i*180,b=w+160,k=DG_COLORS[(s.length-i-1)%5];o+=`<path d="M${cx-w/2} ${y}H${cx+w/2}L${cx+b/2} ${y+98}H${cx-b/2}Z" fill="${k}"/>`+dgT(cx,y+43,t.title,26,'white','middle',35,1)+dgT(cx,y+76,t.short||t.desc,18,'white','middle',42,1,500)+`<circle cx="1190" cy="${y+49}" r="9" fill="${k}"/>`+dgT(1220,y+44,t.callout||t.title,24,'#425453','start',23,2);});return o;}
    function dgMatrix(c){let cols=(c.columns||[]).slice(0,5),rows=(c.rows||[]).slice(0,6),x0=285,y0=65,w=254,rh=79,o=dgR(46,51,1635,rows.length*rh+98);cols.forEach((v,j)=>{let x=x0+j*w;o+=dgR(x,y0,w-8,67,j%2?'#425453':'#F97C00','none',10)+dgT(x+w/2-4,y0+43,v,20,'white','middle',21,1);});rows.forEach((r,i)=>{let y=y0+84+i*rh;o+=dgR(68,y,1580,74,i%2?'#F6F9F7':'#FFFFFF','none',10)+dgT(90,y+45,r.label,21,'#425453','start',19,1);cols.forEach((_,j)=>{let text=(r.values||[])[j]||'—',hi=/high|strong|yes|✓/i.test(String(text)),x=x0+j*w+111,k=hi?'#25AC9D':'#647C76';o+=`<circle cx="${x-7}" cy="${y+37}" r="20" fill="${hi?'#E4F4ED':'#ECF1EE'}"/>`+dgT(x+19,y+44,text,18,k,'start',11,1);});});return o;}
    function dgOrg(c){let a=(c.teams||[]).slice(0,4),o=dgR(630,8,468,112,'#F97C00','#F97C00',20)+dgT(864,55,c.rootTitle||'Program Steering',31,'white','middle',25,1)+dgT(864,91,c.rootDesc||'Accountability',18,'white','middle',29,1,500)+`<path d="M864 120V192 M269 192H1461" fill="none" stroke="#B6C9BF" stroke-width="4"/>`;a.forEach((t,i)=>{let x=74+i*405,cx=x+182,k=DG_COLORS[i%5];o+=`<path d="M${cx} 192V221" stroke="#B6C9BF" stroke-width="4"/>`+dgR(x,221,366,152,'white','#DCE6E0',19)+`<rect x="${x}" y="221" width="366" height="10" rx="5" fill="${k}"/>`+dgT(cx,278,t.title,26,'#425453','middle',26,2)+dgT(cx,341,t.desc,19,'#6C8079','middle',30,2,500)+`<path d="M${cx} 373V403" stroke="#B6C9BF" stroke-width="3"/>`+dgR(x+23,403,320,119,'#F7FAF8','#DFE8E2',13)+dgT(cx,452,t.output,22,'#425453','middle',25,2)+dgT(cx,496,t.metric,17,k,'middle',32,1,600);});return o;}
    function dgSwim(c){let phases=(c.phases||[]).slice(0,4),lanes=(c.lanes||[]).slice(0,3),o='',x0=271,cw=344,y0=43;phases.forEach((p,j)=>{let x=x0+j*cw;o+=dgR(x+6,y0,cw-15,70,j?'#425453':'#F97C00','none',13)+dgT(x+cw/2,y0+46,p,24,'white','middle',21,1);});lanes.forEach((l,i)=>{let y=y0+87+i*152,k=DG_COLORS[i%5];o+=dgR(20,y,1688,136,i%2?'#F7FAF9':'#FFF8F1','#E3EAE5',17)+dgR(35,y+16,188,105,k,'none',13)+dgT(129,y+62,l.name,22,'white','middle',12,2);(l.tasks||[]).slice(0,4).forEach((t,j)=>{let x=x0+j*cw;o+=dgR(x+7,y+19,cw-22,95,'white','#DBE4DE',12)+dgT(x+26,y+60,t,20,'#425453','start',25,2);});});return o;}
    function dgHub(c){let a=(c.nodes||[]).slice(0,6),n=a.length||1,cx=864,cy=298,o=`<circle cx="${cx}" cy="${cy}" r="172" fill="#FFF5ED" stroke="#FBCAAB" stroke-width="4"/>`+dgT(cx,cy-17,c.center||'XBrain',42,'#425453','middle',18,1)+dgT(cx,cy+40,c.centerSub||'LEARNING ENGINE',22,'#F97C00','middle',23,1);a.forEach((t,i)=>{let ang=-Math.PI/2+i*2*Math.PI/n,x=cx+575*Math.cos(ang),y=cy+192*Math.sin(ang),k=DG_COLORS[i%5];o+=`<path d="M${cx+Math.cos(ang)*182} ${cy+Math.sin(ang)*182}L${x-Math.cos(ang)*147} ${y-Math.sin(ang)*75}" stroke="${k}" stroke-width="4" fill="none"/>`+dgR(x-159,y-72,318,147,'white','#DBE6E0',19)+`<circle cx="${x-122}" cy="${y-33}" r="11" fill="${k}"/>`+dgT(x,y,t.title,24,'#425453','middle',25,2)+dgT(x,y+46,t.desc,18,'#6B7B77','middle',29,2,500);});return o;}
    function dgJourney(c){let a=(c.stages||[]).slice(0,5),w=316,gap=26,o='<path d="M85 206H1650" stroke="#CBD9D2" stroke-width="7"/>';a.forEach((t,i)=>{let x=30+i*(w+gap),cx=x+w/2,k=DG_COLORS[i%5];o+=`<circle cx="${cx}" cy="206" r="29" fill="${k}" stroke="white" stroke-width="5"/>`+dgT(cx,215,i+1,23,'white','middle')+dgT(cx,103,t.channel,20,k,'middle',26,1)+dgR(x,259,w,256,'white','#DEE8E2',18)+dgT(x+20,305,t.title,27,'#425453','start',21,2)+dgT(x+20,377,t.action,20,'#647873','start',26,3,500)+dgR(x+18,449,w-36,48,i?'#E8F6F1':'#FFF1E5','none',10)+dgT(cx,478,t.metric,17,i?'#168D7D':'#E77800','middle',28,1,700);});return o;}
    function dgLayers(c){let a=(c.tiers||[]).slice(0,5),o='';a.forEach((t,i)=>{let y=30+i*112,k=DG_COLORS[i%5];o+=dgR(110,y,1500,103,i%2?'#F8FAF9':'#FFF8F1','#DEE8E2',18)+`<rect x="110" y="${y}" width="15" height="103" rx="7" fill="${k}"/>`+dgT(177,y+44,t.title,27,'#425453','start',46,1)+dgT(179,y+78,t.desc,20,'#667875','start',89,1,500)+dgR(1370,y+28,201,46,k,'none',23)+dgT(1470,y+59,t.tag,19,'white','middle',16,1);});return o;}
    function dgSankey(c){if(XB_RENDER_OPTS.strict){
      const raw=deps.getRenderCtx()?.slide?.content||c,left=raw.sources||[],right=raw.targets||[];
      const nodes=[...left.map((n,i)=>({id:'v1-source-'+i,label:n.label})),...right.map((n,i)=>({id:'v1-target-'+i,label:n.label}))];
      const edges=(raw.links||[]).map(e=>({from:Number.isInteger(e.from)&&e.from>=0&&e.from<left.length?'v1-source-'+e.from:'v1-missing-source',to:Number.isInteger(e.to)&&e.to>=0&&e.to<right.length?'v1-target-'+e.to:'v1-missing-target',value:e.value}));
      return deckDiagram({type:'diagram',variant:'sankey',nodes,edges,maxNodes:30},{width:1728,height:600}).replace('<svg ','<svg width="1728" height="600" ');
    }let left=(c.sources||[]).slice(0,4),right=(c.targets||[]).slice(0,4),links=(c.links||[]).slice(0,15),o='',Y=(i,n)=>56+i*(474/Math.max(1,n-1));links.forEach((l,i)=>{let a=Math.trunc(dgN(l.from,-1)),b=Math.trunc(dgN(l.to,-1));if(a<0||b<0||a>=left.length||b>=right.length)return;let y1=Y(a,left.length),y2=Y(b,right.length),width=Math.max(10,dgClamp(l.value,2,70)*1.4);o+=`<path d="M330 ${y1} C650 ${y1},1050 ${y2},1370 ${y2}" stroke="${DG_COLORS[a%5]}" stroke-width="${width}" stroke-opacity=".27" stroke-linecap="round" fill="none"/>`;});left.forEach((t,i)=>{let y=Y(i,left.length),k=DG_COLORS[i%5];o+=dgR(24,y-47,306,95,k,'none',16)+dgT(177,y+7,t.label,23,'white','middle',24,2);});right.forEach((t,i)=>{let y=Y(i,right.length);o+=dgR(1370,y-47,326,95,'white','#D6E3DC',16)+dgT(1533,y+7,t.label,22,'#425453','middle',26,2);});return o;}
    function dgHeat(c){let cols=(c.columns||[]).slice(0,7),rows=(c.rows||[]).slice(0,6),x0=318,y0=102,cw=182,ch=72,colors=['#F1F4F2','#DFEEE8','#B4E6D5','#7FD7BB','#25AC9D','#166C62'],o='';cols.forEach((t,j)=>{o+=dgT(x0+j*cw+cw/2,y0-26,t,20,'#566B65','middle',14,1);});rows.forEach((t,i)=>{let y=y0+i*84;o+=dgT(56,y+46,t.label,23,'#425453','start',20,1);(t.values||[]).slice(0,cols.length).forEach((v,j)=>{let n=Math.round(dgClamp(v,0,5)),x=x0+j*cw;o+=dgR(x+4,y,cw-11,ch,colors[n],'none',12)+dgT(x+cw/2,y+46,n,24,n>3?'white':'#425453','middle');});});o+=dgT(1180,577,'0 = Not ready      5 = Advanced',20,'#70827D','start',43,1,500);return o;}
    /* Diagram library mở rộng (17 diagram/biểu đồ SVG): dùng chung khung dgPage và bảng màu thương hiệu. */
    const XB_THEME = Object.freeze({"colors": {"primary": "#F97C00", "primaryMid": "#FF8B2C", "primaryBright": "#FF991D", "peach": "#FBCAAB", "peachSoft": "#FFF5ED", "peachSurface": "#FDECE1", "darkTeal": "#425453", "heading": "#2B3736", "gray": "#B6B7B7", "grayLight": "#D3D1CF", "white": "#FFFFFF", "line": "#DEE8E2", "muted": "#5E6E6D", "teal": "#25AC9D", "mint": "#7FD7BB", "mintSoft": "#E5F4EF", "purple": "#85439A", "indigo": "#24338A", "blue": "#007BC1", "cyan": "#00B3D8", "redOrange": "#FE4A0B", "amber": "#F6AF2F", "yellow": "#FFD54C"}, "chartSeries": ["#F97C00", "#25AC9D", "#425453", "#007BC1", "#85439A", "#F6AF2F"], "diagramSeries": ["#F97C00", "#25AC9D", "#007BC1", "#85439A", "#F6AF2F", "#425453"]});
    const XO = XB_THEME.colors.primary, XT = XB_THEME.colors.darkTeal, XTEAL = XB_THEME.colors.teal, XMINT = XB_THEME.colors.mint, XMINTS = XB_THEME.colors.mintSoft, XPEACH = XB_THEME.colors.peachSoft, XPEACH2 = XB_THEME.colors.peach, XGRAY = XB_THEME.colors.gray, XLINE = XB_THEME.colors.line, XMUTED = XB_THEME.colors.muted, XRED = XB_THEME.colors.redOrange, XB_SERIES = XB_THEME.chartSeries;
    const fit = (w, size) => Math.max(4, Math.floor(w / (size * 0.55)));
    function ink(hex) {
      const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return '#FFFFFF';
      const n = parseInt(m[1], 16), ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
      return (.2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2]) > .45 ? XT : '#FFFFFF';
    }
    function xT(x, y, s, o = {}) {
      const size = o.size || 22, lh = size * (o.lh || 1.26), lines = dgLines(s, o.max || fit(o.w || 400, size), o.count || 1);
      const fam = o.font === 'b' ? 'Nunito,Arial,sans-serif' : 'Manrope,Arial,sans-serif';
      const y0 = o.valign === 'middle' ? y - (lines.length - 1) * lh / 2 + size * 0.35 : y;
      return `<text x="${x}" y="${y0}" text-anchor="${o.anchor || 'start'}" fill="${o.color || XT}" font-family="${fam}" font-size="${size}" font-weight="${o.weight || 700}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${l}</tspan>`).join('')}</text>`;
    }
    const xTC = (x, y, s, o = {}) => xT(x, y, s, { anchor: 'middle', valign: 'middle', ...o });
    const xRect = (x, y, w, h, fill, r = 16, op = 1) => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${r}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>`;
    function xArrow(x1, y1, x2, y2, col = XO, w = 4) {
      const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - Math.cos(a) * 15, hy = y2 - Math.sin(a) * 15, px = Math.sin(a) * 9, py = -Math.cos(a) * 9;
      return `<path d="M${x1} ${y1}L${hx} ${hy}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="M${hx + px} ${hy + py}L${x2} ${y2}L${hx - px} ${hy - py}Z" fill="${col}"/>`;
    }
    const xNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
    const xFmt = v => { const n = xNum(v); return (Math.round(n * 10) / 10).toLocaleString('vi-VN'); };
    function xNice(lo, hi, ticks = 5) {
      if (hi === lo) hi = lo + 1;
      const raw = (hi - lo) / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
      const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
      return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step, step };
    }
    function dgVenn(c) { /* 29. Venn Diagram */
      const s = (c.sets || []).slice(0, 3), three = s.length >= 3, cols = [XO, XTEAL, XT];
      const P = three ? { r: 195, c: [[505, 212], [745, 212], [625, 392]], lab: [[430, 170], [820, 170], [625, 488]], mid: [625, 272] }
        : { r: 230, c: [[420, 300], [700, 300]], lab: [[320, 300], [800, 300]], mid: [560, 300] };
      let o = '';
      s.forEach((t, i) => { const [x, y] = P.c[i]; o += `<circle cx="${x}" cy="${y}" r="${P.r}" fill="${cols[i]}" fill-opacity=".13" stroke="${cols[i]}" stroke-width="4"/>`; });
      s.forEach((t, i) => { const [x, y] = P.lab[i]; o += xTC(x, y, t.title, { size: 27, color: cols[i], max: 12, count: 2, weight: 800 }); });
      const [mx, my] = P.mid;
      o += `<rect x="${mx - 100}" y="${my - 40}" width="200" height="80" rx="40" fill="#FFFFFF" stroke="${XO}" stroke-width="3"/>`
        + xTC(mx, my - (c.centerSub ? 11 : 0), c.center || '', { size: 23, color: XO, max: 15, weight: 800 })
        + (c.centerSub ? xTC(mx, my + 17, c.centerSub, { size: 16, color: XT, max: 20, font: 'b' }) : '');
      const n = s.length || 1, x0 = 1000, w = 728, h = Math.min(220, (600 - (n - 1) * 18) / n), top = (600 - (n * h + (n - 1) * 18)) / 2;
      s.forEach((t, i) => {
        const y = top + i * (h + 18);
        o += dgR(x0, y, w, h, '#FFFFFF', XLINE, 20) + xRect(x0, y, 12, h, cols[i], 6)
          + xT(x0 + 44, y + 54, t.title, { size: 27, color: XT, max: fit(w - 80, 27), weight: 800 })
          + xT(x0 + 44, y + 98, t.desc, { size: 20, color: XMUTED, max: fit(w - 80, 20), count: h > 200 ? 4 : 3, font: 'b', weight: 600 });
      });
      return o;
    }
    function dgSwot(c) { /* 30. SWOT Analysis */
      const q = (c.quadrants || []).slice(0, 4), cols = [XTEAL, XT, XO, XRED], tints = [XMINTS, '#EEF2F1', XPEACH, '#FFF0EA'];
      const w = 852, h = 288; let o = '';
      q.forEach((t, i) => {
        const x = (i % 2) * (w + 24), y = Math.floor(i / 2) * (h + 24), k = cols[i];
        o += dgR(x, y, w, h, tints[i], 'none', 22)
          + `<path d="M${x + 22} ${y}H${x + 150}V${y + h}H${x + 22}A22 22 0 0 1 ${x} ${y + h - 22}V${y + 22}A22 22 0 0 1 ${x + 22} ${y}Z" fill="${k}"/>`
          + xTC(x + 75, y + h / 2, t.letter || 'SWOT'[i], { size: 118, color: '#FFFFFF', max: 3, weight: 800 })
          + xT(x + 186, y + 60, t.title, { size: 29, color: k, max: fit(w - 210, 29), weight: 800 });
        (t.items || []).slice(0, 4).forEach((it, j) => {
          const yy = y + 116 + j * 44;
          o += `<circle cx="${x + 196}" cy="${yy - 7}" r="6" fill="${k}"/>` + xT(x + 216, yy, it, { size: 21, color: XT, max: fit(w - 240, 21), font: 'b', weight: 600 });
        });
      });
      return o;
    }
    function dgPriority(c) { /* 31. Priority Matrix */
      const px = 120, py = 8, pw = 980, ph = 520, L = c.quadrantLabels || [];
      const qf = [XPEACH, '#F2F7F5', '#F6F8F7', '#F8F9FA'];
      let o = xRect(px, py, pw / 2, ph / 2, qf[0], 0) + xRect(px + pw / 2, py, pw / 2, ph / 2, qf[1], 0) + xRect(px, py + ph / 2, pw / 2, ph / 2, qf[2], 0) + xRect(px + pw / 2, py + ph / 2, pw / 2, ph / 2, qf[3], 0)
        + `<path d="M${px + pw / 2} ${py}V${py + ph}M${px} ${py + ph / 2}H${px + pw}" stroke="#FFFFFF" stroke-width="6"/>`
        + xT(px + 26, py + 46, L[0] || 'Quick wins', { size: 24, color: XO, max: 26, weight: 800 })
        + xT(px + pw - 26, py + 46, L[1] || 'Major projects', { size: 24, color: XTEAL, max: 26, weight: 800, anchor: 'end' })
        + xT(px + 26, py + ph - 24, L[2] || 'Fill-ins', { size: 24, color: '#7C8B88', max: 26, weight: 800 })
        + xT(px + pw - 26, py + ph - 24, L[3] || 'Thankless', { size: 24, color: '#7C8B88', max: 26, weight: 800, anchor: 'end' })
        + xArrow(px - 26, py + ph, px - 26, py + 4, XT, 3) + xArrow(px, py + ph + 26, px + pw - 4, py + ph + 26, XT, 3)
        + `<text transform="rotate(-90 ${px - 56} ${py + ph / 2})" x="${px - 56}" y="${py + ph / 2}" text-anchor="middle" fill="${XT}" font-family="Manrope,Arial,sans-serif" font-size="20" font-weight="800">${dgLines(c.yLabel || 'Impact', 30, 1)[0] || ''}</text>`
        + xT(px + pw / 2, 590, c.xLabel || 'Effort', { size: 20, color: XT, max: 40, weight: 800, anchor: 'middle' });
      const items = (c.items || []).slice(0, 8), n = items.length || 1, rh = Math.min(68, 560 / n);
      items.forEach((t, i) => {
        const x = dgClamp(t.x, 0, 100), y = dgClamp(t.y, 0, 100), cx = px + x / 100 * pw, cy = py + (1 - y / 100) * ph;
        const k = y >= 50 ? (x < 50 ? XO : XTEAL) : (x < 50 ? XGRAY : XT);
        o += `<circle cx="${cx}" cy="${cy}" r="27" fill="${k}" stroke="#FFFFFF" stroke-width="4"/>` + xTC(cx, cy, i + 1, { size: 21, color: ink(k), weight: 800 });
        const ly = 20 + i * rh + rh / 2;
        o += `<circle cx="1190" cy="${ly}" r="19" fill="${k}"/>` + xTC(1190, ly, i + 1, { size: 17, color: ink(k), weight: 800 })
          + xTC(1224, ly, t.label, { size: 20, color: XT, max: fit(490, 20), count: 2, anchor: 'start', font: 'b', weight: 700 });
      });
      return o;
    }
    function dgMindMap(c) { /* 32. Mind Map */
      const cx = 864, cy = 300, b = (c.branches || []).slice(0, 6), nR = Math.ceil(b.length / 2);
      const ys = k => k === 1 ? [300] : k === 2 ? [160, 440] : [88, 300, 512];
      let links = '', nodes = '';
      const side = (arr, dir, off) => arr.forEach((t, i) => {
        const by = ys(arr.length)[i], bx = cx + dir * 420, k = XB_SERIES[(off + i) % 6];
        const sx = cx + dir * 165, ex = bx - dir * 135;
        links += `<path d="M${sx} ${cy}C${sx + dir * 120} ${cy},${ex - dir * 120} ${by},${ex} ${by}" stroke="${k}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
        nodes += dgR(bx - 135, by - 38, 270, 76, k, 'none', 38) + xTC(bx, by, t.title, { size: 22, color: ink(k), max: 19, count: 2, weight: 800 });
        const lv = (t.leaves || []).slice(0, 3), offs = lv.length === 1 ? [0] : lv.length === 2 ? [-32, 32] : [-62, 0, 62];
        lv.forEach((leaf, j) => {
          const ly = by + offs[j], edge = dir > 0 ? bx + 195 : bx - 195, boxX = dir > 0 ? edge : edge - 245;
          links += `<path d="M${bx + dir * 135} ${by}C${bx + dir * 165} ${by},${edge - dir * 30} ${ly},${edge} ${ly}" stroke="${k}" stroke-width="2.5" fill="none" stroke-opacity=".7"/>`;
          nodes += dgR(boxX, ly - 23, 245, 46, '#FFFFFF', XLINE, 23) + `<circle cx="${boxX + 22}" cy="${ly}" r="6" fill="${k}"/>`
            + xTC(boxX + 38, ly, leaf, { size: 17, color: XT, max: 22, anchor: 'start', font: 'b', weight: 700 });
        });
      });
      side(b.slice(0, nR), 1, 0); side(b.slice(nR), -1, nR);
      return links + nodes + dgR(cx - 165, cy - 72, 330, 144, XO, 'none', 72)
        + xTC(cx, cy - (c.centerSub ? 14 : 0), c.center || 'Ý tưởng', { size: 32, color: '#FFFFFF', max: 16, weight: 800 })
        + (c.centerSub ? xTC(cx, cy + 28, c.centerSub, { size: 18, color: '#FFF5ED', max: 26, font: 'b' }) : '');
    }
    function dgFishbone(c) { /* 33. Fishbone / Root Cause */
      const cats = (c.categories || []).slice(0, 6), xs = [430, 800, 1170];
      let o = `<path d="M30 300H1350" stroke="${XT}" stroke-width="7" stroke-linecap="round"/><path d="M1338 280L1378 300L1338 320Z" fill="${XT}"/>`
        + dgR(1386, 200, 342, 200, XO, 'none', 26)
        + xTC(1557, 286, c.problem || 'Vấn đề', { size: 28, color: '#FFFFFF', max: fit(300, 28), count: 3, weight: 800 })
        + (c.problemSub ? xTC(1557, 370, c.problemSub, { size: 16, color: '#FFF5ED', max: 34, font: 'b' }) : '');
      cats.forEach((t, i) => {
        const top = i % 2 === 0, xj = xs[Math.floor(i / 2)], ex = xj - 200, ey = top ? 78 : 522, k = XB_SERIES[i % 6];
        o += `<path d="M${ex} ${ey}L${xj} 300" stroke="${k}" stroke-width="5" stroke-linecap="round"/>`
          + dgR(ex - 125, top ? 18 : 530, 250, 52, k, 'none', 14) + xTC(ex, top ? 44 : 556, t.title, { size: 20, color: ink(k), max: 20, weight: 800 });
        (t.causes || []).slice(0, 3).forEach((cause, j) => {
          const f = [.3, .55, .8][j], px = ex + f * 200, py = ey + f * (300 - ey);
          o += `<path d="M${px} ${py}H${px - 24}" stroke="${k}" stroke-width="2.5"/>` + xTC(px - 32, py, cause, { size: 16, color: XT, max: 22, count: 2, anchor: 'end', font: 'b', weight: 700 });
        });
      });
      return o;
    }
    function dgStaircase(c) { /* 34. Maturity Staircase */
      const L = (c.levels || []).slice(0, 5), n = L.length || 1, gap = 14, w = (1728 - (n - 1) * gap) / n;
      const fills = [XMINTS, XMINT, XTEAL, XT, XO].slice(5 - n);
      let o = '';
      L.forEach((t, i) => {
        const x = i * (w + gap), top = 470 - i * (n > 1 ? 330 / (n - 1) : 0), k = fills[i], tc = ink(k);
        o += xT(x + 6, top - 66, t.desc, { size: 18, color: XMUTED, max: fit(w - 12, 18), count: 3, font: 'b', weight: 600 })
          + dgR(x, top, w, 600 - top, k, k === XMINTS ? XMINT : 'none', 18)
          + xRect(x + 22, top + 22, 112, 34, tc === '#FFFFFF' ? '#FFFFFF' : XT, 17, .18)
          + xTC(x + 78, top + 39, t.tag || ('LEVEL 0' + (i + 1)), { size: 14, color: tc, max: 12, weight: 800, ls: '.06em' })
          + xT(x + 22, top + 94, t.title, { size: 26, color: tc, max: fit(w - 44, 26), count: 2, weight: 800 });
      });
      return o;
    }
    function dgConcentric(c) { /* 35. Concentric Circles */
      const L = (c.layers || []).slice(0, 5), n = L.length || 1, cx = 320, cy = 300, R = 290, r0 = n === 1 ? R : 80;
      const base = [XO, '#FF8B2C', '#FF991D', XPEACH2, XPEACH], rad = i => n === 1 ? R : r0 + i * (R - r0) / (n - 1);
      const col = i => base[n === 1 ? 0 : Math.round(i * 4 / (n - 1))];
      let o = '';
      for (let i = n - 1; i >= 0; i--) o += `<circle cx="${cx}" cy="${cy}" r="${rad(i)}" fill="${col(i)}" stroke="${i === n - 1 ? XPEACH2 : '#FFFFFF'}" stroke-width="${i === n - 1 ? 2 : 4}"/>`;
      L.forEach((t, i) => {
        const y = i === 0 ? cy : cy - (rad(i) + rad(i - 1)) / 2;
        o += xTC(cx, y, `${i + 1} · ${t.title}`, { size: i === 0 ? 21 : 19, color: ink(col(i)), max: i === 0 ? 12 : 26, count: i === 0 ? 2 : 1, weight: 800 });
      });
      const x0 = 700, w = 1028, gap = 14, h = (600 - (n - 1) * gap) / n;
      L.slice().reverse().forEach((t, r) => {
        const i = n - 1 - r, y = r * (h + gap), k = col(i);
        o += dgR(x0, y, w, h, '#FFFFFF', XLINE, 18) + `<circle cx="${x0 + 46}" cy="${y + h / 2}" r="24" fill="${k}" stroke="${XPEACH2}" stroke-width="2"/>`
          + xTC(x0 + 46, y + h / 2, i + 1, { size: 20, color: ink(k), weight: 800 })
          + xT(x0 + 90, y + h / 2 - (h > 110 ? 14 : 4), t.title, { size: 25, color: XT, max: fit(w - 130, 25), weight: 800 })
          + xT(x0 + 90, y + h / 2 + (h > 110 ? 22 : 26), t.desc, { size: 19, color: XMUTED, max: fit(w - 130, 19), count: h > 110 ? 2 : 1, font: 'b', weight: 600 });
      });
      return o;
    }
    function dgValueChain(c) { /* 36. Value Chain (Chevron) */
      const S = (c.stages || []).slice(0, 6), n = S.length || 1, step = 1728 / n, d = 34, ch = 108;
      let o = '';
      S.forEach((t, i) => {
        const x = i * step, last = i === n - 1, W = last ? step : step + d - 8, k = last && n > 2 ? XTEAL : (i % 2 ? XT : XO);
        const pts = [[x, 0], [x + W - d, 0], [x + W, ch / 2], [x + W - d, ch], [x, ch]];
        if (i) pts.push([x + d, ch / 2]);
        o += `<path d="M${pts.map(p => p.join(' ')).join('L')}Z" fill="${k}"/>`
          + xTC(x + (i ? d : 0) / 2 + (W - d / 2) / 2 + (i ? 0 : -4), ch / 2, t.title, { size: 24, color: '#FFFFFF', max: fit(step - 80, 24), count: 2, weight: 800 });
        const cxp = x + 6, w = step - 12, most = Math.max(1, ...S.map(st => (st.items || []).slice(0, 3).length)), chH = S.some(st => !(st.items || []).length) ? 464 : Math.min(464, 150 + most * 104);
        o += dgR(cxp, 136, w, chH, '#FFFFFF', XLINE, 20) + xRect(cxp, 136, w, 8, k, 4)
          + xT(cxp + 24, 196, String(i + 1).padStart(2, '0'), { size: 34, color: k, weight: 800 });
        const items = (t.items || []).slice(0, 3);
        if (items.length) items.forEach((it, j) => {
          const y = 252 + j * 104;
          o += `<circle cx="${cxp + 30}" cy="${y - 7}" r="6" fill="${k}"/>` + xT(cxp + 46, y, it, { size: 21, color: XT, max: fit(w - 70, 20), count: 3, font: 'b', weight: 600 });
        });
        else o += xT(cxp + 24, 252, t.desc, { size: 20, color: XT, max: fit(w - 48, 20), count: 8, font: 'b', weight: 600 });
      });
      return o;
    }
    function dgDecisionTree(c) { /* 37. Decision Tree */
      const B = (c.branches || []).slice(0, 3), root = c.root || {}, cols = [XO, XTEAL, '#007BC1'];
      const leaves = []; B.forEach((b, bi) => (b.children || []).slice(0, 2).forEach(ch => leaves.push({ ...ch, bi })));
      const L = leaves.length || 1, slot = 600 / L, lh = Math.min(112, slot - 16);
      leaves.forEach((l, i) => l.y = slot * i + slot / 2);
      const by = B.map((b, bi) => { const ys = leaves.filter(l => l.bi === bi).map(l => l.y); return ys.length ? ys.reduce((a, v) => a + v, 0) / ys.length : 300; });
      const ry = by.length ? by.reduce((a, v) => a + v, 0) / by.length : 300;
      let edges = '', nodes = '';
      const pill = (x, y, txt, k) => dgR(x - 50, y - 19, 100, 38, '#FFFFFF', k, 19) + xTC(x, y, txt, { size: 17, color: k, max: 10, weight: 800 });
      B.forEach((b, bi) => {
        const y = by[bi], k = cols[bi];
        edges += `<path d="M330 ${ry}C435 ${ry},435 ${y},540 ${y}" stroke="${XT}" stroke-width="4" fill="none"/>`;
        nodes += pill(435, (ry + y) / 2, b.label || '', XO) + dgR(540, y - 48, 340, 96, '#FFFFFF', k, 20) + xRect(540, y - 48, 10, 96, k, 5)
          + xTC(718, y, b.title, { size: 21, color: XT, max: 25, count: 2, weight: 800 });
      });
      leaves.forEach((l, i) => {
        const k = cols[l.bi];
        edges += `<path d="M880 ${by[l.bi]}C990 ${by[l.bi]},990 ${l.y},1100 ${l.y}" stroke="${k}" stroke-width="3.5" fill="none"/>`;
        nodes += pill(990, (by[l.bi] + l.y) / 2, l.label || '', k) + dgR(1100, l.y - lh / 2, 628, lh, l.bi % 2 ? XMINTS : XPEACH, 'none', 18) + xRect(1100, l.y - lh / 2, 10, lh, k, 5)
          + xT(1134, l.y - (l.desc && lh > 70 ? 6 : -8), l.title, { size: 23, color: XT, max: fit(560, 23), weight: 800 })
          + (l.desc && lh > 70 ? xT(1134, l.y + 26, l.desc, { size: 18, color: XMUTED, max: fit(560, 18), font: 'b', weight: 600 }) : '');
      });
      nodes += dgR(0, ry - 80, 330, 160, XT, 'none', 22) + xTC(165, ry - 12, root.title, { size: 25, color: '#FFFFFF', max: 20, count: 3, weight: 800 })
        + (root.desc ? xTC(165, ry + 54, root.desc, { size: 16, color: '#D3D1CF', max: 30, font: 'b' }) : '');
      return edges + nodes;
    }
    function dgSystemArch(c) { /* 38. System Architecture */
      const Z = (c.zones || []).slice(0, 5), n = Z.length || 1, gap = 64, w = (1728 - (n - 1) * gap) / n, cols = [XT, XO, XTEAL, '#007BC1', '#85439A'];
      const most = Math.max(1, ...Z.map(z => (z.items || []).slice(0, 4).length)), ih = Math.min(112, (496 - (most - 1) * 14) / most), zh = Math.min(600, 88 + most * (ih + 14) + 6), top0 = (600 - zh) / 2;
      let o = '';
      Z.forEach((z, i) => {
        const x = i * (w + gap), k = cols[i % 5], items = (z.items || []).slice(0, 4), top = top0 + 88;
        o += `<rect x="${x}" y="${top0}" width="${w}" height="${zh}" rx="22" fill="#F8FAF9" stroke="#CBD9D2" stroke-width="2" stroke-dasharray="9 8"/>`
          + dgR(x + 16, top0 + 16, w - 32, 52, k, 'none', 26) + xTC(x + w / 2, top0 + 42, z.title, { size: 20, color: ink(k), max: fit(w - 60, 20), weight: 800 });
        items.forEach((it, j) => {
          const y = top + j * (ih + 14), first = (String(it.title || '?').trim()[0] || '•').replace('&', '•');
          o += dgR(x + 16, y, w - 32, ih, '#FFFFFF', '#DCE6E0', 16) + xRect(x + 30, y + ih / 2 - 22, 44, 44, k, 12, .14)
            + xTC(x + 52, y + ih / 2, first.toUpperCase(), { size: 20, color: k, weight: 800 })
            + xT(x + 88, y + ih / 2 - (it.desc ? 4 : -7), it.title, { size: 19, color: XT, max: fit(w - 120, 19), weight: 800 })
            + (it.desc ? xT(x + 88, y + ih / 2 + 22, it.desc, { size: 16, color: XMUTED, max: fit(w - 120, 16), font: 'b', weight: 600 }) : '');
        });
        if (i < n - 1) o += xArrow(x + w + 8, 300, x + w + gap - 8, 300, XO, 4);
      });
      return o;
    }
    function dgKanban(c) { /* 39. Kanban Board */
      const C = (c.columns || []).slice(0, 5), n = C.length || 1, gap = 20, w = (1728 - (n - 1) * gap) / n, cols = [XGRAY, '#007BC1', XO, '#85439A', XTEAL];
      let o = '';
      C.forEach((col, i) => {
        const x = i * (w + gap), k = cols[i % 5], cards = (col.cards || []).slice(0, 4);
        o += dgR(x, 0, w, 600, '#F4F7F5', 'none', 20) + xRect(x, 0, w, 8, k, 4)
          + xT(x + 22, 52, col.title, { size: 22, color: XT, max: fit(w - 90, 22), weight: 800 })
          + `<circle cx="${x + w - 34}" cy="${44}" r="18" fill="${k}"/>` + xTC(x + w - 34, 44, (col.cards || []).length, { size: 17, color: ink(k), weight: 800 });
        cards.forEach((cd, j) => {
          const y = 78 + j * 130, tag = String(cd.tag || ''), tw = Math.min(w - 60, tag.length * 9 + 30);
          o += dgR(x + 14, y, w - 28, 118, '#FFFFFF', '#DCE6E0', 14) + xRect(x + 14, y + 14, 6, 90, k, 3)
            + xT(x + 34, y + 38, cd.title, { size: 19, color: XT, max: fit(w - 70, 19), count: 2, weight: 800 })
            + (tag ? xRect(x + 34, y + 78, tw, 28, k, 14, .14) + xTC(x + 34 + tw / 2, y + 92, tag, { size: 14, color: k === XGRAY ? XT : k, max: 22, weight: 800 }) : '')
            + xT(x + w - 28, y + 98, cd.owner, { size: 14, color: XMUTED, max: 18, anchor: 'end', font: 'b', weight: 700 });
        });
      });
      return o;
    }
    function dgGantt(c) { /* 40. Gantt Roadmap */
      const P = (c.periods || []).slice(0, 12), np = P.length || 1, T = (c.tasks || []).slice(0, 8), M = (c.milestones || []).slice(0, 4);
      const tx = 350, tw = 1378, cw = tw / np, hh = 48, rowTop = 64, msH = M.length ? 64 : 0, rh = Math.min(66, (600 - rowTop - msH - 8) / Math.max(1, T.length));
      const X = v => tx + dgClamp(v, 0, np) * cw, bottom = rowTop + rh * T.length;
      let o = '';
      P.forEach((p, j) => { o += xRect(tx + j * cw, hh + 8, cw, bottom - hh - 8, j % 2 ? '#F8FAF9' : '#FFFFFF', 0) + dgR(tx + j * cw + 4, 0, cw - 8, hh, '#F1F4F2', 'none', 12) + xTC(tx + j * cw + cw / 2, hh / 2, p, { size: 18, color: XT, max: fit(cw - 12, 18), weight: 800 }); });
      T.forEach((t, i) => {
        const y = rowTop + i * rh, my = y + rh / 2, k = XB_SERIES[i % 5], x1 = X(t.start), x2 = Math.max(x1 + 14, X(t.end));
        o += `<path d="M0 ${y + rh}H1728" stroke="#EEF2F0" stroke-width="1.5"/>` + xTC(4, my, t.title, { size: 19, color: XT, max: fit(320, 19), anchor: 'start', weight: 800 })
          + dgR(x1, my - 16, x2 - x1, 32, k, 'none', 16);
        const own = String(t.owner || '');
        if (own) o += (x2 - x1 > own.length * 8.5 + 30) ? xTC(x1 + 14, my, own, { size: 15, color: ink(k), max: 30, anchor: 'start', font: 'b', weight: 800 })
          : xTC(x2 + 10, my, own, { size: 15, color: XMUTED, max: 22, anchor: 'start', font: 'b', weight: 700 });
      });
      if (M.length) {
        const my = 600 - msH / 2;
        o += `<path d="M${tx} ${my}H${tx + tw}" stroke="#DCE6E0" stroke-width="2"/>`;
        M.forEach(m => {
          const x = X(m.at);
          o += `<path d="M${x} ${rowTop}V${my - 14}" stroke="${XO}" stroke-width="2" stroke-dasharray="4 6" stroke-opacity=".55"/><path d="M${x} ${my - 13}L${x + 13} ${my}L${x} ${my + 13}L${x - 13} ${my}Z" fill="${XO}" stroke="#FFFFFF" stroke-width="2"/>`
            + xTC(x + 20, my, m.label, { size: 16, color: XT, max: 20, anchor: 'start', weight: 800 });
        });
      }
      if (c.today !== undefined && c.today !== '' && Number.isFinite(Number(c.today))) {
        const x = X(c.today);
        o += `<path d="M${x} ${hh + 4}V${bottom}" stroke="${XRED}" stroke-width="3" stroke-dasharray="8 6"/>` + dgR(x - 46, hh + 6, 92, 30, XRED, 'none', 15) + xTC(x, hh + 21, c.todayLabel || 'Hôm nay', { size: 14, color: '#FFFFFF', max: 12, weight: 800 });
      }
      return o;
    }
    function dgLineChart(c) { /* 41. Line Trend Chart */
      const labels = (c.labels || []).slice(0, 12), S = (c.series || []).slice(0, 3), nL = labels.length || 1, cols = [XO, XTEAL, XT];
      const vals = S.flatMap(s => (s.values || []).slice(0, nL).map(Number).filter(Number.isFinite));
      const lo0 = c.yMin !== undefined && c.yMin !== '' ? xNum(c.yMin) : Math.min(0, ...vals), hi0 = c.yMax !== undefined && c.yMax !== '' ? xNum(c.yMax) : Math.max(1, ...vals);
      const sc = xNice(lo0, hi0), x0 = 110, x1 = 1080, y0 = 20, y1 = 500;
      const X = i => nL === 1 ? (x0 + x1) / 2 : x0 + i * (x1 - x0) / (nL - 1), Y = v => y1 - (v - sc.lo) / (sc.hi - sc.lo) * (y1 - y0);
      let o = '';
      for (let v = sc.lo; v <= sc.hi + 1e-9; v += sc.step) o += `<path d="M${x0 - 20} ${Y(v)}H${x1 + 20}" stroke="#E3EAE6" stroke-width="1.5"/>` + xT(x0 - 34, Y(v) + 6, xFmt(v), { size: 16, color: '#6B7D7A', anchor: 'end', font: 'b' });
      labels.forEach((l, i) => { o += xTC(X(i), y1 + 36, l, { size: 17, color: XT, max: 10, weight: 700, font: 'b' }); });
      S.forEach((s, si) => {
        const pts = (s.values || []).slice(0, nL).map((v, i) => [X(i), Y(xNum(v))]), k = cols[si];
        if (!pts.length) return;
        if (si === 0) o += `<path d="M${pts[0][0]} ${y1}L${pts.map(p => p.join(' ')).join('L')}L${pts.at(-1)[0]} ${y1}Z" fill="${k}" fill-opacity=".09"/>`;
        o += `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="${k}" stroke-width="${si ? 4 : 5}" stroke-linejoin="round" stroke-linecap="round"${si === 2 ? ' stroke-dasharray="10 8"' : ''}/>`;
        pts.forEach(p => { o += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#FFFFFF" stroke="${k}" stroke-width="4"/>`; });
        const lp = pts.at(-1), lv = (s.values || [])[pts.length - 1], ly = Math.max(y0 + 17, Math.min(y1 - 17, lp[1])) + (si - (S.length - 1) / 2) * 40;
        o += dgR(lp[0] + 18, ly - 17, 70, 34, k, 'none', 17) + xTC(lp[0] + 53, ly, xFmt(lv), { size: 16, color: ink(k), weight: 800 });
      });
      let lx = x0 - 20;
      S.forEach((s, si) => { o += xRect(lx, 576, 30, 6, cols[si], 3) + xT(lx + 40, 586, s.name, { size: 17, color: XT, max: 26, weight: 700 }); lx += 70 + Math.min(26, String(s.name || '').length) * 10; });
      o += dgR(1220, 10, 508, 580, XPEACH, XPEACH2, 26)
        + xT(1258, 70, c.insightLabel || 'Insight', { size: 16, color: XO, max: 40, weight: 800, ls: '.08em' })
        + xT(1258, 176, c.insightValue || '', { size: 92, color: XO, max: 9, weight: 800 })
        + xT(1258, 246, c.insightText || '', { size: 21, color: XT, max: fit(430, 21), count: 9, font: 'b', weight: 600 })
        + (c.unit ? xT(1258, 560, 'Đơn vị: ' + c.unit, { size: 15, color: XMUTED, max: 40, font: 'b' }) : '');
      return o;
    }
    function dgWaterfall(c) { /* 42. Waterfall Chart */
      const I = (c.items || []).slice(0, 8), n = I.length || 1; let run = 0;
      const bars = I.map(t => {
        const v = xNum(t.value); let base, top, end;
        if (t.kind === 'start') { base = 0; top = v; run = v; } else if (t.kind === 'total') { base = 0; top = run; } else { base = run; top = run + v; run += v; }
        end = run; return { ...t, v, base, top, end };
      });
      const all = bars.flatMap(b => [b.base, b.top]), sc = xNice(Math.min(0, ...all), Math.max(1, ...all));
      const x0 = 90, x1 = 1728, y0 = 30, y1 = 470, slot = (x1 - x0) / n, bw = Math.min(150, slot * .58), Y = v => y1 - (v - sc.lo) / (sc.hi - sc.lo) * (y1 - y0);
      let o = '';
      for (let v = sc.lo; v <= sc.hi + 1e-9; v += sc.step) o += `<path d="M${x0 - 10} ${Y(v)}H${x1}" stroke="${v === 0 ? '#9FB1AD' : '#E3EAE6'}" stroke-width="${v === 0 ? 2 : 1.5}"/>` + xT(x0 - 22, Y(v) + 6, xFmt(v), { size: 16, color: '#6B7D7A', anchor: 'end', font: 'b' });
      bars.forEach((b, i) => {
        const cx = x0 + i * slot + slot / 2, k = b.kind === 'start' ? XT : b.kind === 'total' ? XO : (b.v >= 0 ? XTEAL : XRED);
        const yt = Y(Math.max(b.base, b.top)), yb = Y(Math.min(b.base, b.top));
        o += dgR(cx - bw / 2, yt, bw, Math.max(3, yb - yt), k, 'none', 8)
          + xTC(cx, yt - 20, b.kind === 'delta' ? (b.v >= 0 ? '+' : '−') + xFmt(Math.abs(b.v)) : xFmt(b.top), { size: 20, color: k === XT ? XT : k, weight: 800 })
          + xTC(cx, y1 + 44, b.label, { size: 17, color: XT, max: fit(slot - 14, 17), count: 2, weight: 700, font: 'b' });
        if (i < n - 1) o += `<path d="M${cx + bw / 2} ${Y(b.end)}H${cx + slot - bw / 2}" stroke="#9FB1AD" stroke-width="2" stroke-dasharray="5 5"/>`;
      });
      const lg = [[XT, c.legendStart || 'Đầu kỳ'], [XTEAL, c.legendUp || 'Tăng'], [XRED, c.legendDown || 'Giảm'], [XO, c.legendTotal || 'Tổng cuối kỳ']];
      let lx = x0; lg.forEach(([k, t]) => { o += xRect(lx, 574, 18, 18, k, 5) + xT(lx + 28, 589, t, { size: 16, color: XT, max: 20, font: 'b', weight: 700 }); lx += 60 + String(t).length * 9; });
      if (c.unit) o += xT(x1, 589, 'Đơn vị: ' + c.unit, { size: 15, color: XMUTED, max: 30, anchor: 'end', font: 'b' });
      return o;
    }
    function dgBarRanking(c) { /* 43. Bar Ranking */
      const I = (c.items || []).slice(0, 8), n = I.length || 1, hl = Math.trunc(xNum(c.highlight)), target = c.target === '' || c.target === undefined ? null : xNum(c.target);
      const max = Math.max(1, ...I.map(t => xNum(t.value)), target || 0) * 1.08, rh = Math.min(76, 540 / n), bx = 390, bw = 1150;
      let o = '';
      I.forEach((t, i) => {
        const y = 10 + i * rh + rh / 2, v = xNum(t.value), w = Math.max(6, v / max * bw), on = i === hl;
        o += `<circle cx="22" cy="${y}" r="19" fill="${on ? XO : '#EEF2F1'}"/>` + xTC(22, y, i + 1, { size: 17, color: on ? '#FFFFFF' : XT, weight: 800 })
          + xTC(56, y, t.label, { size: 20, color: XT, max: fit(320, 20), count: rh > 60 ? 2 : 1, anchor: 'start', weight: on ? 800 : 700 })
          + dgR(bx, y - 18, bw, 36, '#F1F4F2', 'none', 18) + dgR(bx, y - 18, w, 36, on ? XO : XGRAY, 'none', 18)
          + xTC(bx + w + 14, y, xFmt(v) + (c.unit ? ' ' + c.unit : ''), { size: 21, color: on ? XO : XT, anchor: 'start', weight: 800 });
      });
      if (target !== null) {
        const x = bx + target / max * bw, yb = 10 + n * rh;
        o += `<path d="M${x} 0V${yb}" stroke="${XTEAL}" stroke-width="3" stroke-dasharray="8 6"/>` + dgR(x - 110, yb + 12, 220, 38, XTEAL, 'none', 19)
          + xTC(x, yb + 31, `${c.targetLabel || 'Mục tiêu'}: ${xFmt(target)}`, { size: 16, color: '#FFFFFF', max: 28, weight: 800 });
      }
      return o;
    }
    function dgRadar(c) { /* 44. Radar Chart */
      const A = (c.axes || []).slice(0, 8), n = Math.max(3, A.length), S = (c.series || []).slice(0, 2), max = xNum(c.max) || 5, cols = [XO, XTEAL];
      const cx = 400, cy = 300, R = 236, ang = i => -Math.PI / 2 + i * 2 * Math.PI / n, pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
      const levels = max <= 10 && Number.isInteger(max) ? max : 5;
      let o = `<polygon points="${[...Array(n)].map((_, i) => pt(i, R).join(',')).join(' ')}" fill="#F8FAF9"/>`;
      for (let l = 1; l <= levels; l++) o += `<polygon points="${[...Array(n)].map((_, i) => pt(i, R * l / levels).join(',')).join(' ')}" fill="none" stroke="#DCE6E0" stroke-width="${l === levels ? 2.5 : 1.5}"/>`;
      for (let i = 0; i < n; i++) {
        const [x, y] = pt(i, R), [lx, ly] = pt(i, R + 34), co = Math.cos(ang(i));
        o += `<path d="M${cx} ${cy}L${x} ${y}" stroke="#DCE6E0" stroke-width="1.5"/>` + xTC(lx, ly, A[i] || '', { size: 19, color: XT, max: 14, count: 2, weight: 800, anchor: co > .3 ? 'start' : co < -.3 ? 'end' : 'middle' });
      }
      S.forEach((s, si) => {
        const P = [...Array(n)].map((_, i) => pt(i, dgClamp((s.values || [])[i], 0, max) / max * R)), k = cols[si];
        o += `<polygon points="${P.map(p => p.join(',')).join(' ')}" fill="${k}" fill-opacity="${si ? .12 : .2}" stroke="${k}" stroke-width="${si ? 3.5 : 4}"${si ? ' stroke-dasharray="10 7"' : ''} stroke-linejoin="round"/>`
          + P.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#FFFFFF" stroke="${k}" stroke-width="3.5"/>`).join('');
      });
      const tx = 880, cw = [290, 190, 180, 170], rows = A.length, rh = Math.min(58, 460 / Math.max(1, rows));
      let lx = tx; S.forEach((s, si) => { o += xRect(lx, 16, 30, 8, cols[si], 4) + xT(lx + 40, 28, s.name, { size: 18, color: XT, max: 24, weight: 800 }); lx += 90 + Math.min(24, String(s.name || '').length) * 10; });
      const hy = 80, heads = [c.axisHeader || 'Năng lực', ...S.map(s => s.name), S.length > 1 ? (c.deltaHeader || 'Chênh lệch') : null].filter(v => v !== null);
      let hx = tx; heads.forEach((h, j) => { o += xT(j ? hx + cw[j] / 2 : hx + 16, hy, h, { size: 15, color: XMUTED, max: j ? fit(cw[j] - 8, 15) : 30, anchor: j ? 'middle' : 'start', weight: 800, ls: '.04em' }); hx += cw[j]; });
      A.forEach((a, i) => {
        const y = hy + 22 + i * rh, v0 = xNum((S[0]?.values || [])[i]), v1 = xNum((S[1]?.values || [])[i]);
        o += xRect(tx, y, 830, rh - 8, i % 2 ? '#FFFFFF' : '#F6F9F7', 12) + xTC(tx + 16, y + (rh - 8) / 2, a, { size: 19, color: XT, max: 30, anchor: 'start', weight: 800 });
        let cx2 = tx + cw[0];
        S.forEach((s, si) => { o += xTC(cx2 + cw[si + 1] / 2, y + (rh - 8) / 2, xFmt((s.values || [])[i]), { size: 20, color: cols[si], weight: 800 }); cx2 += cw[si + 1]; });
        if (S.length > 1) { const d = v0 - v1; o += xTC(cx2 + cw[3] / 2, y + (rh - 8) / 2, (d >= 0 ? '+' : '−') + xFmt(Math.abs(d)), { size: 20, color: d >= 0 ? XTEAL : XRED, weight: 800 }); }
      });
      return o;
    }
    function dgProgressRings(c) { /* 45. Progress Rings */
      const Rg = (c.rings || []).slice(0, 5), n = Rg.length || 1, slot = 1728 / n, cols = [XO, XTEAL, XT, '#007BC1', '#85439A'];
      let o = '';
      Rg.forEach((t, i) => {
        const cx = slot * i + slot / 2, cy = 170, r = 124, C = 2 * Math.PI * r, p = dgClamp(t.value, 0, 100) / 100, k = cols[i % 5];
        o += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EEF2F0" stroke-width="30"/>`
          + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${k}" stroke-width="30" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
          + xTC(cx, cy - 4, Math.round(p * 100) + '%', { size: 56, color: XT, weight: 800 })
          + xTC(cx, 360, t.title, { size: 27, color: XT, max: fit(slot - 40, 27), count: 2, weight: 800 })
          + xTC(cx, 440, t.desc, { size: 19, color: XMUTED, max: fit(slot - 60, 19), count: 3, font: 'b', weight: 600 });
      });
      return o;
    }
    const DIAGRAM_RENDERERS = Object.freeze({'process-flow':dgProcess, 'conversion-funnel':dgFunnel, 'cycle-loop':dgCycle, 'strategy-pyramid':dgPyramid, 'decision-matrix':dgMatrix, 'org-chart':dgOrg, 'swimlane':dgSwim, 'hub-spoke':dgHub, 'learner-journey':dgJourney, 'layered-architecture':dgLayers, 'sankey-flow':dgSankey, 'heatmap':dgHeat, 'venn-diagram':dgVenn, 'swot-analysis':dgSwot, 'priority-matrix':dgPriority, 'mind-map':dgMindMap, 'fishbone':dgFishbone, 'staircase':dgStaircase, 'concentric-circles':dgConcentric, 'value-chain':dgValueChain, 'decision-tree':dgDecisionTree, 'system-architecture':dgSystemArch, 'kanban-board':dgKanban, 'gantt-roadmap':dgGantt, 'line-chart':dgLineChart, 'waterfall-chart':dgWaterfall, 'bar-ranking':dgBarRanking, 'radar-chart':dgRadar, 'progress-rings':dgProgressRings, 'custom-diagram':c=>''});
    const DIAGRAM_TYPES = new Set(Object.keys(DIAGRAM_RENDERERS));
    function renderDiagramSlide(slide,index){
      const content=escapedContent(slide.content||{});
      // custom-diagram: content.svg is trusted author SVG placed as-is in the 1728×600 drawing area.
      if(slide.type==='custom-diagram') return dgPage(content,index,xbTrustedHtml(slide.content?.svg??'','custom-diagram content.svg'));
      return dgPage(content,index,DIAGRAM_RENDERERS[slide.type](content));
    }

  return {
    DG_COLORS, dgN, dgClamp, dgLines, dgT, dgR, dgA, dgPage,
    XB_THEME, XO, XT, XTEAL, XMINT, XMINTS, XPEACH, XPEACH2, XGRAY, XLINE, XMUTED, XRED, XB_SERIES,
    fit, ink, xT, xTC, xRect, xArrow, xNum, xFmt, xNice,
    DIAGRAM_RENDERERS, DIAGRAM_TYPES, renderDiagramSlide
  };
}
