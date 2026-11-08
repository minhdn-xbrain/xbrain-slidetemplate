// @ts-nocheck
import { BRAND_PHOTOS, XBRAIN_EMBEDDED_CSS, XBRAIN_SVG_SPRITE } from "../lib/xbrainAssets";
import { INITIAL_LAYOUT_CATALOG, XB_LAYOUT_SAMPLES, DECK_DEFAULT_CONFIG } from "../constants/layoutCatalog";
import { INITIAL_TEMPLATE_SLIDES } from "../constants/defaultSlides";
import XB_SCHEMA_BASE from "../../contracts/xbrain-deck-v1.schema.json";
import { renderInlineIcons } from "../components/ui/Icon";
import { createDiagramEngine } from "../core/diagramRenderers";
import { createSlideRenderers } from "../core/slideRenderers";
import {
  escapeHtml,
  escapedContent,
  deckSafe,
  deckNum,
  deckClamp,
  r1,
  deckFmt,
  deckShow,
  DECK_FIELD_ALIASES,
  deckToNumber,
  deckField,
  deckSeriesKeys,
  DECK_COLORS,
  DECK_INK,
  DECK_MUTED,
  DECK_GRID,
  DECK_AXIS,
  DECK_NEG,
  DECK_POS,
  XBDiag,
  XBText,
} from "../utils/textAndFormat";
import { createDataResolver } from "../core/dataResolver";
import { DeckModel } from "../core/deckModel";
import {
  UNGROUPED_FILTER_KEY,
  BUILTIN_GROUP_META,
  normalizeSlideGroup,
  formatGroupBadge,
  getGroupBadgeClass,
  getDeckGroupsForSlides,
  matchesGroupFilter,
} from "../utils/slideGroup";
import { EnhancedRenderers } from "../lib/enhancedRenderers";
import {
  createDeckHistory,
  createDraftRepository,
  createHeaderStatus,
  createHeaderMenus,
  createSchemaViewer,
} from "./studioControllers";

const LAYOUT_CATALOG = INITIAL_LAYOUT_CATALOG.map(item => ({ ...item }));
let slides = JSON.parse(JSON.stringify(INITIAL_TEMPLATE_SLIDES));
let DECK_CONFIG = JSON.parse(JSON.stringify(DECK_DEFAULT_CONFIG));

const engineListeners = new Set<() => void>();
let cachedSnapshot: any = null;
export function subscribeEngine(listener: () => void): () => void {
  engineListeners.add(listener);
  return () => engineListeners.delete(listener);
}
function notifyEngine(): void {
  cachedSnapshot = null;
  for (const listener of engineListeners) {
    try { listener(); } catch (_) {}
  }
}

    function renderStandardWhiteHeader(sectionTag, slideNumberStr) {
      return `
        <div class="relative z-20 px-[96px] pt-[46px]">
          <div class="flex items-center justify-between pb-[22px]">
            <div class="flex items-center gap-6">
              <svg class="w-[220px] h-[67px]" role="img" aria-label="Xbrain logo"><use href="#xbrain-logo-primary"></use></svg>
              <span class="h-6 w-[1.5px] bg-[#D3D1CF]"></span>
              <span class="font-heading font-bold text-[18px] tracking-[0.12em] uppercase text-[#425453]/75" ${xbChromeAttr('sectionTag')}>${sectionTag || 'BRAND GUIDELINE'}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-body text-[20px] text-[#425453] font-medium" ${xbChromeAttr('headerLabel')}>${escapeHtml(xbChrome('headerLabel'))}</span>
            </div>
          </div>
          <div class="slide-header-line"></div>
        </div>
      `;
    }

    function renderStandardWhiteFooter(slideNumberStr, showAwsCoBrand = false) {
      return `
        <div class="absolute bottom-[36px] left-[96px] right-[96px] z-20 flex items-center justify-between pointer-events-none">
          <div class="flex items-center gap-4 text-[17px] text-[#425453]/70 font-body">
            <span class="font-semibold text-[#F97C00]" style="pointer-events:auto" ${xbChromeAttr('website')}>${escapeHtml(xbChrome('website'))}</span>
            <span>•</span>
            <span style="pointer-events:auto" ${xbChromeAttr('address')}>${escapeHtml(xbChrome('address'))}</span>
          </div>
          <div class="flex items-center gap-6">
            ${showAwsCoBrand ? renderAwsPartnerBadge('light') : ''}
            <span class="font-heading font-bold text-[22px] text-[#425453]">${slideNumberStr}</span>
          </div>
        </div>
      `;
    }

    function renderAwsPartnerBadge(theme = 'light') {
      // No AWS certification or co-brand badge is fabricated. Add an officially approved
      // badge only if the rights holder provides an authorized source asset.
      return ''; // No unapproved AWS badge or certification claim.
    }

    /* Crisp, editable, print-safe native SVG charts (no Chart.js dependency). */
    function renderBarChart(c) {
      if(XB_RENDER_OPTS.strict){const raw=XB_RENDER_CTX?.slide?.content||c;
        if(!Array.isArray(raw.barData))XBDiag.report('data.missing','error','charts.barData is required in strict mode');
        return deckChart({type:'chart',variant:'grouped-bar',data:(raw.barData||[]).map(r=>({label:r.label,Pre:r.pre,Post:r.post}))},{width:910,height:410});}

      const data = Array.isArray(c.barData) ? c.barData.slice(0,7) : [];
      const width = 910, height = 410, left = 60, top = 24, bottom = 75, plotW = 820, plotH = height - top - bottom;
      const safeNumber = (n) => Math.max(0, Math.min(100, Number(n) || 0));
      const grid = [0,25,50,75,100].map(n=>{
        const y=top+plotH*(1-n/100);
        return `<line x1="${left}" x2="${left+plotW}" y1="${y}" y2="${y}" stroke="#D7DEDB" stroke-width="1"/><text x="${left-13}" y="${y+5}" font-size="17" fill="#6B7D7A" text-anchor="end">${n}</text>`;
      }).join('');
      const stride = plotW/Math.max(1,data.length);
      const bars = data.map((d,i)=>{
        const mid = left + (i+.5)*stride;
        const b1 = safeNumber(d.pre), b2=safeNumber(d.post);
        const h1 = plotH*b1/100, h2 = plotH*b2/100;
        const label=escapeHtml(String(d.label||''));
        return `<rect x="${mid-39}" y="${top+plotH-h1}" width="34" height="${h1}" fill="#B6B7B7" rx="5"/><rect x="${mid+5}" y="${top+plotH-h2}" width="34" height="${h2}" fill="#F97C00" rx="5"/>
        <text x="${mid}" y="${top+plotH+26}" font-family="Nunito,Arial,sans-serif" font-size="18" text-anchor="middle" fill="#425453">${label}</text>
        <text x="${mid+22}" y="${Math.max(top+14,top+plotH-h2-10)}" font-family="Manrope,Arial,sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="#425453">${b2}</text>`;
      }).join('');
      return `<svg data-chart="bar" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Biểu đồ cột minh họa: điểm trước và sau đào tạo">${grid}${bars}</svg>`;
    }
    function renderDoughnutChart(c) {
      if(XB_RENDER_OPTS.strict){const raw=XB_RENDER_CTX?.slide?.content||c;
        if(!Array.isArray(raw.doughnutData))XBDiag.report('data.missing','error','charts.doughnutData is required in strict mode; no sample is inserted');
        return deckChart({type:'chart',variant:'donut',data:raw.doughnutData||[]},{width:760,height:300});}

      const fallback=[{label:'Labs',value:45,color:'#F97C00'},{label:'Capstone',value:25,color:'#25AC9D'},{label:'Mentorship',value:15,color:'#007BC1'},{label:'Theory',value:15,color:'#F6AF2F'}];
      const data = (Array.isArray(c.doughnutData) ? c.doughnutData : fallback).slice(0,6);
      const valid = data.map((d,i)=>({...d, v:Math.max(0,Number(d.value)||0),col:/^#[0-9a-fA-F]{6}$/.test(d.color||'')?d.color:['#F97C00','#25AC9D','#007BC1','#F6AF2F'][i%4]}));
      const total=valid.reduce((sum,d)=>sum+d.v,0) || 1;
      let offset=0;
      const circles=valid.map(d=>{const dash=d.v/total*100, out=`<circle cx="146" cy="150" r="92" fill="none" stroke="${d.col}" stroke-width="42" pathLength="100" stroke-dasharray="${dash} ${100-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 146 150)"/>`; offset+=dash;return out;}).join('');
      const legends=valid.map((d,i)=>`<rect x="310" y="${60+i*49}" width="17" height="17" rx="4" fill="${d.col}"/><text x="341" y="${74+i*49}" fill="#425453" font-family="Nunito,Arial,sans-serif" font-size="22">${escapeHtml(d.label||'')} · ${Math.round(d.v/total*100)}%</text>`).join('');
      return `<svg data-chart="donut" viewBox="0 0 760 300" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Biểu đồ vòng phân bổ thời lượng minh họa">${circles}<circle cx="146" cy="150" r="66" fill="#F8F9FA"/><text x="146" y="145" font-family="Manrope,Arial,sans-serif" font-size="36" text-anchor="middle" font-weight="800" fill="#425453">100%</text><text x="146" y="175" font-family="Nunito,Arial,sans-serif" font-size="16" text-anchor="middle" fill="#425453">Sample mix</text>${legends}</svg>`;
    }

    /* ==========================================================================
       MAIN SLIDE RENDERER (Dispatches across all 70 Template Types)
       ========================================================================== */

const {
  DG_COLORS, dgN, dgClamp, dgLines, dgT, dgR, dgA, dgPage,
  XB_THEME, XO, XT, XTEAL, XMINT, XMINTS, XPEACH, XPEACH2, XGRAY, XLINE, XMUTED, XRED, XB_SERIES,
  fit, ink, xT, xTC, xRect, xArrow, xNum, xFmt, xNice,
  DIAGRAM_RENDERERS, DIAGRAM_TYPES, renderDiagramSlide
} = createDiagramEngine({
  getRenderOpts: () => XB_RENDER_OPTS,
  getRenderCtx: () => XB_RENDER_CTX,
  deckDiagram: (c: any, box?: any) => deckDiagram(c, box),
  XBDiag: {
    report: (...args: any[]) => XBDiag.report(...args)
  },
  renderStandardWhiteHeader,
  renderStandardWhiteFooter,
  escapedContent,
  xbTrustedHtml: (src: any, ctx?: string) => xbTrustedHtml(src, ctx)
});

const XB_RENDER_DEFAULTS=Object.freeze({strict:false,trust:'trusted'});
let XB_RENDER_OPTS={...XB_RENDER_DEFAULTS};
function deckNiceScale(values,{zero=true,ticks=5}={}){
 const f=values.filter(Number.isFinite);let lo=f.length?Math.min(...f):0,hi=f.length?Math.max(...f):1;
 if(zero){lo=Math.min(lo,0);hi=Math.max(hi,0);}if(lo===hi)hi=lo+1;
 const n=xNice(lo,hi,ticks),list=[];for(let i=0;i<=40;i++){const v=+(n.lo+i*n.step).toFixed(10);if(v>n.hi+n.step*1e-9)break;list.push(v);}
 return {...n,ticks:list,map:(v,a,b)=>a+(v-n.lo)/(n.hi-n.lo)*(b-a)};
}
// Visual box → viewBox width: cartesian/linear renderers stretch to the component's aspect instead of letterboxing.
let DECK_VB={w:1000,h:480};
const DECK_FLUID=new Set(['bar','bar-horizontal','grouped-bar','stacked-bar','stacked-100','marimekko','line','area','step-line','sparkline','lollipop','dot-plot','histogram','waterfall','pareto','scatter','bubble','heatmap','bullet','range-bar','dumbbell','combo','diverging-bar','treemap','funnel-chart','flowchart','process-pipeline','chevrons','zigzag','value-chain','bpmn','critical-path','dependency','state-machine','release-train','customer-journey','learner-journey','roadmap','milestones','timeline','gantt','swimlane','service-blueprint','kanban','org-chart','tree','decision-tree','okrs','swot','pestel','bcg','ansoff','risk-matrix','priority','raci','decision-matrix','capability-map','balanced-scorecard','comparison-matrix','quadrant','portfolio','sequence','sankey','layered','architecture','cloud','c4','pyramid','funnel','vertical-timeline']);
// Charts may narrow to 640 units (text stays legible in small boxes); diagrams keep ≥1000 for node room.
function deckViewWidth(variant,box){return box&&box.width>0&&box.height>0&&DECK_FLUID.has(variant)?Math.round(deckClamp(480*box.width/box.height,CHART_VARIANTS[variant]?640:1000,2600)):1000;}
function deckWithBox(variant,box,fn){const prev=DECK_VB;DECK_VB={w:deckViewWidth(variant,box),h:480};try{return fn();}finally{DECK_VB=prev;}}
function deckSvgOpen(variant,title){return `<svg viewBox="0 0 ${DECK_VB.w} 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${deckSafe(title||variant)}" class="v1-svg" data-variant="${deckSafe(variant)}">`;}
// Fitted SVG text: shrinks, then wraps, and truncates only as a last resort (reported, full text kept in <title>).
function deckLabel(x,y,text,o={}){
 const s=String(text??'');if(!s)return'';
 const size=o.size||18,lines=o.lines||1,weight=o.weight||700,w=Math.max(8,o.w||200);
 const f=XBText.fit(s,{width:w,size,minSize:o.minSize,lines,weight});
 if(f.truncated)XBDiag.report('text.truncated','warning',`${o.what||'Label'} "${s.length>60?s.slice(0,57)+'…':s}" does not fit ${Math.round(w)}px × ${lines} line(s) at ${f.size}px; shown shortened`,{text:s});
 const lh=f.size*XBText.lineHeight(s),n=f.lines.length;
 const y0=o.valign==='middle'?y-(n-1)*lh/2+f.size*.35:o.valign==='top'?y+f.size*.82:o.valign==='bottom'?y-(n-1)*lh:y;
 const fam=o.font==='body'?'Nunito,Arial,sans-serif':'Manrope,Arial,sans-serif';
 const bb=deckLabelBox(x,y,s,o);
 return `<text data-v1-bbox="${[bb.x,bb.y,bb.width,bb.height].map(r1).join(',')}" x="${r1(x)}" y="${r1(y0)}" text-anchor="${o.anchor||'middle'}" fill="${o.color||DECK_INK}" font-size="${f.size}" font-family="${fam}" font-weight="${weight}">${f.truncated?`<title>${deckSafe(s)}</title>`:''}${f.lines.map((l,i)=>`<tspan x="${r1(x)}"${i?` dy="${r1(lh)}"`:''}>${deckSafe(l)}</tspan>`).join('')}</text>`;
}
function deckLabelBox(x,y,text,o={}){
 const f=XBText.fit(String(text??''),{width:Math.max(8,o.w||200),size:o.size||18,minSize:o.minSize,lines:o.lines||1,weight:o.weight||700}),lh=f.size*XBText.lineHeight(text),n=f.lines.length;
 const w=Math.max(0,...f.lines.map(l=>XBText.width(l,f.size,o.weight||700))),h=f.size+(Math.max(0,n-1))*lh,anchor=o.anchor||'middle';
 const baseline=o.valign==='middle'?y-(n-1)*lh/2+f.size*.35:o.valign==='top'?y+f.size*.82:o.valign==='bottom'?y-(n-1)*lh:y;
 return {x:x-(anchor==='end'?w:anchor==='middle'?w/2:0),y:baseline-f.size*.82,width:w,height:h};
}
function deckRepelLabels(labels,bounds,obstacles=[]){
 const placed=[],boxes=[...obstacles],overlap=(a,b)=>a.x<b.x+b.width+3&&a.x+a.width+3>b.x&&a.y<b.y+b.height+3&&a.y+a.height+3>b.y;
 return labels.map(label=>{
  let best={...label},bestBox=deckLabelBox(best.x,best.y,best.text,{...best,valign:'middle'}),found=false;
  for(let radius=0;radius<=180&&!found;radius+=12){for(const [dx,dy] of radius?[[0,-radius],[0,radius],[radius,0],[-radius,0],[radius,-radius],[-radius,radius]]:[[0,0]]){
   const candidate={...label,x:label.x+dx,y:label.y+dy},box=deckLabelBox(candidate.x,candidate.y,candidate.text,{...candidate,valign:'middle'});
   const shiftX=Math.max(0,bounds.left-box.x)-Math.max(0,box.x+box.width-bounds.right),shiftY=Math.max(0,bounds.top-box.y)-Math.max(0,box.y+box.height-bounds.bottom);
   candidate.x+=shiftX;candidate.y+=shiftY;box.x+=shiftX;box.y+=shiftY;
   if(!boxes.some(b=>overlap(box,b))){best=candidate;bestBox=box;found=true;break;}
  }}
  boxes.push(bestBox);placed.push(best);return best;
 });
}
function deckMark(kind,x,y,w,h,fill,v,extra=''){return `<rect data-mark="${kind}" data-v="${v}" x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0,w))}" height="${r1(Math.max(0,h))}" fill="${fill}"${extra}/>`;}
function deckEmpty(variant,message){const m=DECK_VB.w/2;return deckSvgOpen(variant)+deckRect(m-200,180,400,120,'#F6F9F7','#DCE6E0',16,2)+deckText(m,232,'No data',24,DECK_INK,'middle',800)+deckLabel(m,268,message,{w:370,size:15,color:DECK_MUTED,font:'body',what:'Empty-state note'})+'</svg>';}
function deckLegend(items,x,y,maxW=900){
 let g='',cx=x,cy=y;
 for(const it of items){const w=XBText.width(it.label,15)+40;if(cx+w>x+maxW&&cx>x){cx=x;cy+=24;}
  g+=it.kind==='line'?deckRect(cx,cy-6,24,5,it.color,'none',2):deckRect(cx,cy-12,16,16,it.color,'none',4);
  g+=deckText(cx+(it.kind==='line'?30:22),cy+1,it.label,15,DECK_INK,'start',700);cx+=w;}
 return g;
}
function deckYAxis(sc,x0,x1,Y,o={}){
 let g='';for(const t of sc.ticks){const y=Y(t);g+=deckLine(x0,r1(y),x1,r1(y),t===0?DECK_AXIS:DECK_GRID,t===0?2:1);g+=deckText(x0-10,r1(y+5),deckFmt(t,o.fmt),14,DECK_MUTED,'end',600);}
 return g;
}
function deckRowsFor(c,variant){
 const max=CHART_VARIANTS[variant]?.constraints.maxRows??Infinity;
 let rows=deckRows(deckData(c));
 if(!rows.length&&(c.dataRef||c.data||c.dataset))XBDiag.report('data.empty','warning',`${variant}: the data source has no rows`);
 if(rows.length>max){XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: showing the first ${max} of ${rows.length} rows; aggregate (transform.groupBy/limit) or split the chart`,{rows:rows.length,max});rows=rows.slice(0,max);}
 return rows;
}
function deckNumeric(rows,variant,get=r=>r.value,field='value'){
 const bad=rows.filter(r=>!Number.isFinite(get(r)));
 if(bad.length)XBDiag.report(bad.some(r=>get(r)===undefined)?'data.field-missing':'data.non-numeric','error',`${variant}: ${bad.length} row(s) without a numeric "${field}" (${bad.slice(0,4).map(r=>r.label).join(', ')}) are not drawn`,{field,rows:bad.map(r=>r.label)});
 return rows.filter(r=>Number.isFinite(get(r)));
}
function deckSelectSeries(rows,variant){
 const keys=deckSeriesKeys(rows),max=CHART_VARIANTS[variant]?.constraints.maxSeries;
 if(max&&keys.length>max)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: showing ${max} of ${keys.length} series; project or split the chart`,{series:keys,omitted:keys.slice(max),max});
 return max?keys.slice(0,max):keys;
}
function deckSeries(rows,variant,{min=2}={}){
 const keys=deckSelectSeries(rows,variant);
 if(keys.length<min){XBDiag.report('data.series-missing',XB_RENDER_OPTS.strict?'error':'warning',`${variant} needs ≥${min} numeric series fields per row (e.g. {label, A:1, B:2}); found ${keys.length ? keys.join(', ') : 'none'} — drawn as one series`,{found:keys});return null;}
 return keys;
}
const deckSeriesValue=(r,k)=>deckToNumber(r.raw?.[k]);
function deckCatLabel(cx,y,label,band){return deckLabel(cx,y,label,{w:Math.max(30,band-8),size:15,minSize:11,lines:2,valign:'top',what:'Category label'});}
// Categorical columns (bar, histogram, lollipop, dot-plot) on a zero-based linear scale; negatives go below zero.
function deckColumns(c,variant){
 const binned=variant==='histogram'&&Number(c.options?.bins)>0;let rows=binned?deckRows(deckData(c)):deckRowsFor(c,variant);
 if(binned){
  const vals=deckNumeric(rows,variant).map(r=>r.value),bins=deckClamp(Math.round(c.options.bins),1,30);
  if(!vals.length)return deckEmpty(variant,'Histogram needs numeric observations');
  const lo=Math.min(...vals),hi=Math.max(...vals),step=(hi-lo)/bins||1;
  rows=Array.from({length:bins},(_,i)=>({label:`${deckFmt(lo+i*step)}–${deckFmt(lo+(i+1)*step)}`,value:vals.filter(v=>i===bins-1?v>=lo+i*step:v>=lo+i*step&&v<lo+(i+1)*step).length}));
 }else rows=deckNumeric(rows,variant);
 if(!rows.length)return deckEmpty(variant,'No numeric rows to draw');
 const x0=90,x1=DECK_VB.w-30,y0=40,y1=380,sc=deckNiceScale(rows.map(r=>r.value)),Y=v=>sc.map(v,y1,y0),band=(x1-x0)/rows.length;
 const bw=variant==='histogram'?band-2:Math.min(band*.62,96),color=c.color||DECK_COLORS[0];
 let g=deckSvgOpen(variant,c.title)+deckYAxis(sc,x0,x1,Y);
 rows.forEach((r,i)=>{const cx=x0+band*(i+.5),ya=Y(Math.max(0,r.value)),yb=Y(Math.min(0,r.value)),fill=r.value<0?DECK_NEG:(c.options?.colorBy==='category'?DECK_COLORS[i%DECK_COLORS.length]:color);
  if(variant==='lollipop'||variant==='dot-plot'){const yv=Y(r.value);if(variant==='lollipop')g+=deckLine(r1(cx),r1(Y(0)),r1(cx),r1(yv),fill,5);else g+=deckLine(r1(cx),y0,r1(cx),y1,DECK_GRID,2,'4 6');g+=`<circle data-mark="point" data-v="${r.value}" cx="${r1(cx)}" cy="${r1(yv)}" r="${variant==='lollipop'?11:13}" fill="${fill}"/>`;}
  else g+=deckMark('bar',cx-bw/2,ya,bw,yb-ya,fill,r.value,variant==='histogram'?'':' rx="6"');
  if(band>=34)g+=deckText(r1(cx),r1(r.value<0?yb+20:ya-9),deckFmt(r.value,c.options?.format),15,DECK_INK,'middle',750);
  g+=deckCatLabel(cx,y1+12,r.label,band);});
 return g+'</svg>';
}
// Horizontal bars, bullet (value vs target), range-bar (start→end) and dumbbell (before→after).
function deckHBars(c,variant){
 let rows=deckRowsFor(c,variant);
 const two=variant==='range-bar'?['start','end']:variant==='dumbbell'?['before','after']:null;
 if(two)rows=deckNumeric(deckNumeric(rows,variant,r=>deckField(r,two[0]),two[0]),variant,r=>deckField(r,two[1]),two[1]);
 else rows=deckNumeric(rows,variant);
 if(!rows.length)return deckEmpty(variant,two?`Rows need numeric "${two[0]}" and "${two[1]}" fields`:'No numeric rows to draw');
 const target=r=>deckField(r,'target')??deckToNumber(c.options?.target);
 if(variant==='bullet'&&rows.some(r=>!Number.isFinite(target(r))))XBDiag.report('data.field-missing','warning','bullet: rows without "target" (or options.target) are drawn without a target marker',{field:'target'});
 const all=rows.flatMap(r=>two?[deckField(r,two[0]),deckField(r,two[1])]:[r.value,target(r)]);
 const x0=250,x1=DECK_VB.w-70,y0=34,y1=446,sc=deckNiceScale(all,{zero:!two}),X=v=>sc.map(v,x0,x1),slot=(y1-y0)/rows.length,h=Math.min(46,slot*.58);
 let g=deckSvgOpen(variant,c.title);
 for(const t of sc.ticks)g+=deckLine(r1(X(t)),y0-8,r1(X(t)),y1,t===0?DECK_AXIS:DECK_GRID,t===0?2:1)+deckText(r1(X(t)),y1+22,deckFmt(t),14,DECK_MUTED,'middle',600);
 rows.forEach((r,i)=>{const yc=y0+slot*(i+.5);g+=deckLabel(x0-14,yc,r.label,{w:x0-34,size:16,lines:2,anchor:'end',valign:'middle',what:'Row label'});
  if(two){const a=deckField(r,two[0]),b=deckField(r,two[1]);
   if(variant==='range-bar')g+=deckMark('range',X(Math.min(a,b)),yc-h/2,Math.abs(X(b)-X(a)),h,DECK_COLORS[0],`${a}..${b}`,' rx="7"');
   else g+=deckLine(r1(X(a)),r1(yc),r1(X(b)),r1(yc),'#C9D6D0',6)+`<circle data-mark="point" data-v="${a}" cx="${r1(X(a))}" cy="${r1(yc)}" r="11" fill="${DECK_INK}"/><circle data-mark="point" data-v="${b}" cx="${r1(X(b))}" cy="${r1(yc)}" r="11" fill="${DECK_COLORS[0]}"/>`;
   g+=deckText(r1(X(Math.max(a,b))+16),r1(yc+5),`${deckFmt(a)} → ${deckFmt(b)}`,14,DECK_INK,'start',700);
  }else{const v=r.value,xa=X(Math.min(0,v)),xb=X(Math.max(0,v));
   g+=deckMark('bar',xa,yc-h/2,xb-xa,h,v<0?DECK_NEG:DECK_COLORS[0],v,' rx="7"');
   const t=target(r);if(variant==='bullet'&&Number.isFinite(t))g+=`<line data-mark="target" data-v="${t}" x1="${r1(X(t))}" y1="${r1(yc-h/2-7)}" x2="${r1(X(t))}" y2="${r1(yc+h/2+7)}" stroke="${DECK_INK}" stroke-width="4"/>`;
   g+=deckText(r1(v<0?xa-8:xb+8),r1(yc+5),deckFmt(v,c.options?.format),15,DECK_INK,v<0?'end':'start',750);}
 });
 if(two&&c.options?.labels)g+=deckLegend([{label:c.options.labels[0]||two[0],color:variant==='dumbbell'?DECK_INK:DECK_COLORS[0]},{label:c.options.labels[1]||two[1],color:DECK_COLORS[0]}].slice(0,variant==='dumbbell'?2:0),x0,18);
 return g+'</svg>';
}
// Multi-series columns: grouped, stacked, 100% stacked and Mekko (width ∝ row total).
function deckMultiColumns(c,variant){
 let rows=deckRowsFor(c,variant);
 const keys=deckSeries(rows,variant);
 if(!keys)return XB_RENDER_OPTS.strict?deckEmpty(variant,'At least two numeric series are required'):deckColumns(c,'bar');
 const val=(r,k)=>deckSeriesValue(r,k);
 const missing=rows.filter(r=>keys.some(k=>!Number.isFinite(val(r,k))));
 if(missing.length){XBDiag.report('data.non-numeric','error',`${variant}: ${missing.length} incomplete row(s) are excluded; missing series are never zero`,{rows:missing.map(r=>r.label)});rows=rows.filter(r=>!missing.includes(r));}
 if(['stacked-100','marimekko'].includes(variant)&&rows.some(r=>keys.some(k=>val(r,k)<0))){XBDiag.report('data.negative','error',`${variant}: rows with negative shares are excluded`);rows=rows.filter(r=>keys.every(k=>val(r,k)>=0));}
 if(!rows.length)return deckEmpty(variant,'No complete rows to draw');
 const x0=90,x1=DECK_VB.w-30,y0=64,y1=380;let g=deckSvgOpen(variant,c.title)+deckLegend(keys.map((k,j)=>({label:k,color:DECK_COLORS[j%DECK_COLORS.length]})),x0,24,x1-x0);
 if(variant==='grouped-bar'||variant==='stacked-bar'){
  const tops=rows.map(r=>variant==='grouped-bar'?keys.map(k=>val(r,k)):[keys.reduce((s,k)=>s+Math.max(0,val(r,k)),0),keys.reduce((s,k)=>s+Math.min(0,val(r,k)),0)]).flat();
  const sc=deckNiceScale(tops),Y=v=>sc.map(v,y1,y0),band=(x1-x0)/rows.length;g+=deckYAxis(sc,x0,x1,Y);
  rows.forEach((r,i)=>{const bx=x0+band*i+band*.14,bw=band*.72;
   if(variant==='grouped-bar'){const w=bw/keys.length;keys.forEach((k,j)=>{const v=val(r,k),ya=Y(Math.max(0,v)),yb=Y(Math.min(0,v));g+=deckMark('bar',bx+j*w+1,ya,w-2,yb-ya,DECK_COLORS[j%DECK_COLORS.length],v,' rx="4"');});}
   else{let up=0,down=0;keys.forEach((k,j)=>{const v=val(r,k),from=v>=0?up:down,to=from+v;if(v>=0)up=to;else down=to;g+=deckMark('bar',bx,Y(Math.max(from,to)),bw,Math.abs(Y(from)-Y(to)),DECK_COLORS[j%DECK_COLORS.length],v);});
    if(band>=40)g+=deckText(r1(bx+bw/2),r1(Y(up)-9),deckFmt(up),15,DECK_INK,'middle',750);}
   g+=deckCatLabel(x0+band*(i+.5),y1+12,r.label,band);});
  return g+'</svg>';
 }
 const totals=rows.map(r=>keys.reduce((s,k)=>s+Math.max(0,val(r,k)),0)),grand=totals.reduce((a,b)=>a+b,0)||1;
 if(rows.some(r=>keys.some(k=>val(r,k)<0)))XBDiag.report('data.negative','warning',`${variant}: negative values cannot be shown as shares and are drawn as 0`);
 let x=x0;const gap=variant==='marimekko'?4:Math.min(28,(x1-x0)/rows.length*.25);
 rows.forEach((r,i)=>{const w=variant==='marimekko'?(x1-x0-gap*(rows.length-1))*totals[i]/grand:(x1-x0-gap*(rows.length-1))/rows.length,sum=totals[i]||1;let y=y1;
  keys.forEach((k,j)=>{const v=Math.max(0,val(r,k)),h=(y1-y0)*v/sum;y-=h;g+=deckMark('share',x,y,w,h,DECK_COLORS[j%DECK_COLORS.length],v);if(h>24&&w>44)g+=deckText(r1(x+w/2),r1(y+h/2+6),Math.round(v/sum*100)+'%',15,'#FFFFFF','middle',750);});
  g+=deckCatLabel(x+w/2,y1+12,variant==='marimekko'?`${r.label} (${Math.round(totals[i]/grand*100)}%)`:r.label,w+gap);x+=w+gap;});
 return g+'</svg>';
}
// Lines: one or more series on a categorical x axis; gaps where values are missing.
function deckLines(c,variant){
 const rows=deckRowsFor(c,variant);if(!rows.length)return deckEmpty(variant,'No rows to draw');
 const allKeys=variant==='sparkline'?[]:deckSelectSeries(rows,variant),keys=allKeys.length>=2?allKeys:null;
 const series=keys?keys.map((k,j)=>({name:k,color:DECK_COLORS[j%DECK_COLORS.length],get:r=>deckSeriesValue(r,k)})):[{name:'value',color:c.color||DECK_COLORS[0],get:r=>r.value}];
 const vals=rows.flatMap(r=>series.map(s=>s.get(r)));
 if(!vals.some(Number.isFinite))return deckEmpty(variant,'No numeric values to draw');
 const bad=rows.filter(r=>series.some(s=>!Number.isFinite(s.get(r))));
 if(bad.length)XBDiag.report('data.non-numeric','warning',`${variant}: ${bad.length} point(s) without a numeric value are left as gaps`,{rows:bad.map(r=>r.label)});
 const spark=variant==='sparkline',x0=spark?40:130,x1=DECK_VB.w-(spark?100:80),y0=spark?60:(keys?66:40),y1=spark?400:380;
 const sc=deckNiceScale(vals,{zero:!spark}),Y=v=>sc.map(v,y1,y0),X=i=>rows.length===1?(x0+x1)/2:x0+i*(x1-x0)/(rows.length-1);
 let g=deckSvgOpen(variant,c.title);if(!spark)g+=deckYAxis(sc,x0,x1,Y);
 if(keys)g+=deckLegend(series.map(s=>({label:s.name,color:s.color,kind:'line'})),x0,26);
 series.forEach(s=>{
  const segs=[];let cur=[];rows.forEach((r,i)=>{const v=s.get(r);if(Number.isFinite(v))cur.push([X(i),Y(v)]);else{if(cur.length)segs.push(cur);cur=[];}});if(cur.length)segs.push(cur);
  for(const seg of segs){
   const d=variant==='step-line'?seg.map((p,i)=>i?`H${r1(p[0])}V${r1(p[1])}`:`M${r1(p[0])} ${r1(p[1])}`).join(''):seg.map((p,i)=>(i?'L':'M')+r1(p[0])+' '+r1(p[1])).join('');
   if(variant==='area')g+=`<path d="${d}L${r1(seg.at(-1)[0])} ${r1(Y(Math.max(sc.lo,0)))}L${r1(seg[0][0])} ${r1(Y(Math.max(sc.lo,0)))}Z" fill="${s.color}" fill-opacity="${keys?.18:.22}"/>`;
   g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${spark?5:6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  rows.forEach((r,i)=>{const v=s.get(r);if(!Number.isFinite(v))return;if(spark&&i!==rows.length-1&&v!==Math.max(...rows.map(s.get).filter(Number.isFinite))&&v!==Math.min(...rows.map(s.get).filter(Number.isFinite)))return;
   g+=`<circle data-mark="point" data-v="${v}" cx="${r1(X(i))}" cy="${r1(Y(v))}" r="${spark?7:9}" fill="#FFFFFF" stroke="${s.color}" stroke-width="4"/>`;
   if(spark||(!keys&&rows.length<=12))g+=deckText(r1(X(i)),r1(Y(v)-16),deckFmt(v,c.options?.format),14,DECK_INK,'middle',750);});
 });
 if(!spark){const step=Math.ceil(rows.length/12),band=(x1-x0)/Math.max(1,rows.length-1)*step;rows.forEach((r,i)=>{if(i%step===0)g+=deckCatLabel(X(i),y1+12,r.label,Math.min(140,band));});}
 return g+'</svg>';
}
function deckCombo(c,variant){
 const rows=deckNumeric(deckRowsFor(c,variant),variant);if(!rows.length)return deckEmpty(variant,'No numeric rows to draw');
 const line=rows.map(r=>deckField(r,'target'));
 if(line.every(v=>v===undefined))XBDiag.report('data.field-missing','warning','combo: no "target" field; only bars are drawn',{field:'target'});
 const x0=90,x1=DECK_VB.w-30,y0=66,y1=380,sc=deckNiceScale([...rows.map(r=>r.value),...line.filter(Number.isFinite)]),Y=v=>sc.map(v,y1,y0),band=(x1-x0)/rows.length,bw=Math.min(band*.56,90),names=c.options?.labels||['Actual','Target'];
 let g=deckSvgOpen(variant,c.title)+deckYAxis(sc,x0,x1,Y)+deckLegend([{label:names[0],color:DECK_COLORS[0]},{label:names[1],color:DECK_POS,kind:'line'}],x0,26);
 const pts=[];rows.forEach((r,i)=>{const cx=x0+band*(i+.5),ya=Y(Math.max(0,r.value)),yb=Y(Math.min(0,r.value));g+=deckMark('bar',cx-bw/2,ya,bw,yb-ya,r.value<0?DECK_NEG:DECK_COLORS[0],r.value,' rx="6"');if(band>=34)g+=deckText(r1(cx),r1(ya-9),deckFmt(r.value),15,DECK_INK,'middle',750);g+=deckCatLabel(cx,y1+12,r.label,band);if(Number.isFinite(line[i]))pts.push([cx,Y(line[i]),line[i]]);});
 if(pts.length>1)g+=`<path d="${pts.map((p,i)=>(i?'L':'M')+r1(p[0])+' '+r1(p[1])).join('')}" fill="none" stroke="${DECK_POS}" stroke-width="5" stroke-linejoin="round"/>`;
 pts.forEach(([x,y,v])=>g+=`<circle data-mark="target" data-v="${v}" cx="${r1(x)}" cy="${r1(y)}" r="9" fill="#FFFFFF" stroke="${DECK_POS}" stroke-width="4"/>`);
 return g+'</svg>';
}
function deckWaterfall(c,variant){
 const rows=deckNumeric(deckRowsFor(c,variant),variant);if(!rows.length)return deckEmpty(variant,'No numeric rows to draw');
 let run=0;const bars=rows.map((r,i)=>{const isTotal=r.raw?.total===true||r.raw?.isTotal===true||r.raw?.kind==='total'||(i===0&&r.raw?.kind!=='delta');
  if(isTotal){if(i>0&&Math.abs(r.value-run)>1e-9*Math.max(1,Math.abs(run)))XBDiag.report('data.inconsistent','warning',`waterfall: total "${r.label}" = ${deckFmt(r.value)} but the running sum is ${deckFmt(run)}; drawn at the stated total`,{expected:run,actual:r.value});run=r.value;return {r,from:0,to:r.value,total:true};}
  const from=run;run+=r.value;return {r,from,to:run,total:false};});
 const x0=90,x1=DECK_VB.w-30,y0=40,y1=380,sc=deckNiceScale(bars.flatMap(b=>[b.from,b.to])),Y=v=>sc.map(v,y1,y0),band=(x1-x0)/bars.length,bw=Math.min(band*.6,90);
 let g=deckSvgOpen(variant,c.title)+deckYAxis(sc,x0,x1,Y);
 bars.forEach((b,i)=>{const cx=x0+band*(i+.5),top=Y(Math.max(b.from,b.to)),bot=Y(Math.min(b.from,b.to)),fill=b.total?DECK_INK:b.r.value<0?DECK_NEG:DECK_POS;
  g+=deckMark(b.total?'total':'delta',cx-bw/2,top,bw,Math.max(1,bot-top),fill,b.r.value,' rx="5"');
  if(i<bars.length-1)g+=deckLine(r1(cx+bw/2),r1(Y(b.to)),r1(cx+band-bw/2),r1(Y(b.to)),'#9AA9A4',2,'5 5');
  g+=deckText(r1(cx),r1(top-9),(b.total||b.r.value<0?'':'+')+deckFmt(b.r.value),15,DECK_INK,'middle',750)+deckCatLabel(cx,y1+12,b.r.label,band);});
 return g+'</svg>';
}
function deckPareto(c,variant){
 let rows=deckNumeric(deckRowsFor(c,variant),variant);
 if(rows.some(r=>r.value<0)){XBDiag.report('data.negative','error','pareto: negative values are excluded');rows=rows.filter(r=>r.value>=0);}
 rows=rows.map((r,i)=>({...r,i})).sort((a,b)=>b.value-a.value||a.i-b.i);
 const total=rows.reduce((s,r)=>s+r.value,0);if(!rows.length||!total)return deckEmpty(variant,'Pareto needs positive values');
 const x0=90,x1=DECK_VB.w-90,y0=40,y1=380,sc=deckNiceScale(rows.map(r=>r.value)),Y=v=>sc.map(v,y1,y0),P=p=>y1-(y1-y0)*p,band=(x1-x0)/rows.length,bw=Math.min(band*.62,90);
 let g=deckSvgOpen(variant,c.title)+deckYAxis(sc,x0,x1,Y);
 for(const p of [0,.25,.5,.75,1])g+=deckText(x1+12,r1(P(p)+5),Math.round(p*100)+'%',14,DECK_MUTED,'start',600);
 let cum=0;const pts=[];rows.forEach((r,i)=>{const cx=x0+band*(i+.5);cum+=r.value;g+=deckMark('bar',cx-bw/2,Y(r.value),bw,Y(0)-Y(r.value),DECK_COLORS[0],r.value,' rx="5"')+deckCatLabel(cx,y1+12,r.label,band);pts.push([cx,P(cum/total),cum/total]);});
 g+=`<path d="${pts.map((p,i)=>(i?'L':'M')+r1(p[0])+' '+r1(p[1])).join('')}" fill="none" stroke="${DECK_INK}" stroke-width="4"/>`;
 pts.forEach(([x,y,p])=>g+=`<circle data-mark="cumulative" data-v="${r1(p*100)}" cx="${r1(x)}" cy="${r1(y)}" r="6" fill="${DECK_INK}"/>`);
 return g+'</svg>';
}
function deckArc(cx,cy,r0,r1_,a0,a1){
 const p=(r,a)=>[r1(cx+r*Math.cos(a)),r1(cy+r*Math.sin(a))],large=a1-a0>Math.PI?1:0;
 if(a1-a0>=Math.PI*2-1e-9){const m=a0+Math.PI;return deckArc(cx,cy,r0,r1_,a0,m)+' '+deckArc(cx,cy,r0,r1_,m,a1);}
 const [ax,ay]=p(r1_,a0),[bx,by]=p(r1_,a1);
 if(r0<=0)return `M${cx} ${cy}L${ax} ${ay}A${r1_} ${r1_} 0 ${large} 1 ${bx} ${by}Z`;
 const [cx2,cy2]=p(r0,a1),[dx,dy]=p(r0,a0);return `M${ax} ${ay}A${r1_} ${r1_} 0 ${large} 1 ${bx} ${by}L${cx2} ${cy2}A${r0} ${r0} 0 ${large} 0 ${dx} ${dy}Z`;
}
// Part-to-whole: donut and pie. More than 7 categories are aggregated into "Other" (reported).
function deckPie(c,variant){
 let rows=deckNumeric(deckRows(deckData(c)),variant);
 if(rows.some(r=>r.value<0)){XBDiag.report('data.negative','error',`${variant}: negative values cannot be a share and are excluded`);rows=rows.filter(r=>r.value>=0);}
 if(rows.length>7){const rest=rows.slice(6);XBDiag.report('data.aggregated','info',`${variant}: ${rest.length} smallest-listed categories combined into "Other"`,{rows:rest.map(r=>r.label)});rows=[...rows.slice(0,6),{label:'Other',value:rest.reduce((s,r)=>s+r.value,0)}];}
 const total=rows.reduce((s,r)=>s+r.value,0);if(!total)return deckEmpty(variant,'Values sum to zero');
 const cx=300,cy=240,R=200,r0=variant==='pie'?0:118;let g=deckSvgOpen(variant,c.title),a=-Math.PI/2;
 rows.forEach((r,i)=>{const b=a+2*Math.PI*r.value/total;if(r.value>0)g+=`<path data-mark="slice" data-v="${r.value}" d="${deckArc(cx,cy,r0,R,a,b)}" fill="${DECK_COLORS[i%DECK_COLORS.length]}" stroke="#FFFFFF" stroke-width="3"/>`;a=b;});
 if(variant!=='pie')g+=deckText(cx,cy+8,deckFmt(total,c.options?.format),46,DECK_INK,'middle',800)+deckText(cx,cy+40,c.options?.centerLabel||'TOTAL',16,DECK_MUTED,'middle',700);
 rows.forEach((r,i)=>{const y=70+i*Math.min(52,340/rows.length);g+=deckRect(560,y-14,18,18,DECK_COLORS[i%DECK_COLORS.length],'none',4)+deckLabel(590,y,r.label,{w:250,size:17,anchor:'start',what:'Legend label'})+deckText(960,y,`${deckFmt(r.value)} · ${Math.round(r.value/total*100)}%`,16,DECK_INK,'end',750);});
 return g+'</svg>';
}
function deckRings(c,variant){
 const rows=deckNumeric(deckRowsFor(c,variant),variant);if(!rows.length)return deckEmpty(variant,'No numeric rows to draw');
 const maxOf=r=>deckField(r,'target')??deckToNumber(c.options?.max)??100;let g=deckSvgOpen(variant,c.title);
 const n=rows.length,slot=1000/n,R=variant==='gauge'?190:Math.min(150,slot/2-30),cy=variant==='gauge'?270:205;
 rows.forEach((r,i)=>{const max=Number.isFinite(maxOf(r))&&maxOf(r)>0?maxOf(r):100,p=r.value/max;
  if(p<0||p>1)XBDiag.report('data.out-of-range','warning',`${variant}: "${r.label}" = ${deckFmt(r.value)} is outside 0…${deckFmt(max)}; the arc is clamped`,{value:r.value,max});
  const cx=variant==='gauge'?500:slot*(i+.5),span=variant==='gauge'?Math.PI*1.4:Math.PI*2,a0=variant==='gauge'?Math.PI*.8:-Math.PI/2,w=variant==='gauge'?42:30;
  g+=`<path d="${deckArc(cx,cy,R-w,R,a0,a0+span)}" fill="#E7EEEA"/>`;
  if(p>0)g+=`<path data-mark="progress" data-v="${r.value}" data-max="${max}" d="${deckArc(cx,cy,R-w,R,a0,a0+span*deckClamp(p,0,1))}" fill="${DECK_COLORS[i%DECK_COLORS.length]}"/>`;
  g+=deckText(cx,cy+12,deckFmt(r.value,c.options?.format),variant==='gauge'?56:40,DECK_INK,'middle',800);
  g+=deckText(cx,cy+(variant==='gauge'?48:44),`of ${deckFmt(max)} · ${Math.round(p*100)}%`,15,DECK_MUTED,'middle',700);
  g+=deckLabel(cx,variant==='gauge'?cy+R*.62+46:cy+R+30,r.label,{w:Math.min(slot-20,380),size:18,lines:2,valign:'top',what:'Ring label'});});
 return g+'</svg>';
}
function deckRadar(c,variant){
 const rows=deckRowsFor(c,variant);if(rows.length<3)return deckEmpty(variant,'Radar needs at least 3 axes (rows)');
 const keys=deckSeriesKeys(rows).length>=2?deckSeriesKeys(rows):null;
 const series=keys?keys.map((k,j)=>({name:k,color:DECK_COLORS[j%DECK_COLORS.length],get:r=>deckSeriesValue(r,k)})):[{name:'value',color:DECK_COLORS[0],get:r=>r.value}];
 const vals=rows.flatMap(r=>series.map(s=>s.get(r)));if(vals.some(v=>Number.isFinite(v)&&v<0))XBDiag.report('data.negative','warning','radar: negative values are drawn at the centre');
 deckNumeric(rows,variant,r=>series.every(s=>Number.isFinite(s.get(r)))?0:NaN);
 const sc=deckNiceScale([...vals.filter(Number.isFinite),deckToNumber(c.options?.max)].filter(Number.isFinite)),max=sc.hi||1,n=rows.length,cx=keys?420:500,cy=250,R=180,ang=i=>-Math.PI/2+i*2*Math.PI/n,pt=(i,v)=>[r1(cx+R*v/max*Math.cos(ang(i))),r1(cy+R*v/max*Math.sin(ang(i)))];
 let g=deckSvgOpen(variant,c.title);
 for(const t of sc.ticks.filter(t=>t>0))g+=`<polygon points="${rows.map((_,i)=>pt(i,t).join(',')).join(' ')}" fill="none" stroke="${DECK_GRID}" stroke-width="2"/>`;
 const axisLabels=deckRepelLabels(rows.map((r,i)=>({x:cx+(R+46)*Math.cos(ang(i)),y:cy+(R+30)*Math.sin(ang(i)),text:r.label,w:150,size:15,lines:2,anchor:Math.abs(Math.cos(ang(i)))<.3?'middle':Math.cos(ang(i))>0?'start':'end'})),{left:12,top:8,right:keys?738:988,bottom:472});
 rows.forEach((r,i)=>{const [x,y]=pt(i,max),label=axisLabels[i];g+=deckLine(cx,cy,x,y,DECK_GRID,2)+deckLabel(label.x,label.y,label.text,{...label,valign:'middle',what:'Axis label'});});
 series.filter(s=>rows.every(r=>Number.isFinite(s.get(r)))).forEach(s=>{const pts=rows.map((r,i)=>pt(i,Math.max(0,s.get(r))));g+=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${s.color}" fill-opacity=".18" stroke="${s.color}" stroke-width="4"/>`;rows.forEach((r,i)=>{const v=s.get(r);if(Number.isFinite(v))g+=`<circle data-mark="point" data-v="${v}" cx="${pts[i][0]}" cy="${pts[i][1]}" r="6" fill="${s.color}"/>`;});});
 if(keys)g+=deckLegend(series.map(s=>({label:s.name,color:s.color})),760,90,220);
 return g+'</svg>';
}
function deckScatter(c,variant){
 let rows=deckRowsFor(c,variant);const xs=rows.map(r=>deckField(r,'x'));
 const hasX=xs.some(v=>v!==undefined);
 if(!hasX){XBDiag.report('data.field-missing',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: rows need numeric "x" and "y" (or value) fields`,{field:'x'});return deckEmpty(variant,'Scatter needs numeric x and y per row');}
 const X_=r=>deckField(r,'x'),Yv=r=>deckField(r,'y')??r.value,S=r=>deckField(r,'size')??r.value;
 rows=deckNumeric(deckNumeric(rows,variant,r=>X_(r,rows.indexOf(r)),'x'),variant,Yv,'y');if(!rows.length)return deckEmpty(variant,'No numeric points to draw');
 const x0=100,x1=DECK_VB.w-50,y0=40,y1=380,sx=deckNiceScale(rows.map((r,i)=>X_(r,i)),{zero:false}),sy=deckNiceScale(rows.map(Yv),{zero:false}),X=v=>sx.map(v,x0,x1),Y=v=>sy.map(v,y1,y0);
 const smax=Math.max(...rows.map(S).filter(Number.isFinite).map(Math.abs),1);
 let g=deckSvgOpen(variant,c.title)+deckYAxis(sy,x0,x1,Y);
 for(const t of sx.ticks)g+=deckLine(r1(X(t)),y0,r1(X(t)),y1,DECK_GRID,1)+deckText(r1(X(t)),y1+24,deckFmt(t),14,DECK_MUTED,'middle',600);
 if(c.options?.xLabel)g+=deckText((x0+x1)/2,y1+56,c.options.xLabel,16,DECK_INK,'middle',750);
 if(c.options?.yLabel)g+=`<text transform="translate(26 ${(y0+y1)/2}) rotate(-90)" text-anchor="middle" font-size="16" font-weight="750" fill="${DECK_INK}" font-family="Manrope,Arial,sans-serif">${deckSafe(c.options.yLabel)}</text>`;
 const points=rows.map((r,i)=>({x:X(X_(r,i)),y:Y(Yv(r)),r:variant==='bubble'?10+Math.sqrt(Math.abs(Number.isFinite(S(r))?S(r):0)/smax)*38:11}));
 const obstacles=points.map(p=>({x:p.x-p.r,y:p.y-p.r,width:2*p.r,height:2*p.r}));
 const labels=rows.length<=20?deckRepelLabels(rows.map((r,i)=>({x:points[i].x,y:points[i].y-points[i].r-14,text:r.label,w:150,size:13})),{left:x0,top:10,right:DECK_VB.w-20,bottom:y1-4},obstacles):[];
 rows.forEach((r,i)=>{const {x,y,r:rad}=points[i];
  g+=`<circle data-mark="point" data-v="${Yv(r)}" data-x="${X_(r,i)}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(rad)}" fill="${DECK_COLORS[(r.raw?.group?0:i)%DECK_COLORS.length]}" fill-opacity=".7" stroke="#FFFFFF" stroke-width="2"/>`;
  if(labels[i]){const label=labels[i];if(Math.abs(label.x-x)>16||Math.abs(label.y-y)>rad+32)g+=deckLine(x,y,label.x,label.y,'#AFC1BA',1);g+=deckLabel(label.x,label.y,label.text,{...label,valign:'middle',what:'Point label'});}});
 return g+'</svg>';
}
function deckHeatColor(t){const a=[255,245,237],b=[249,124,0],m=a.map((v,i)=>Math.round(v+(b[i]-v)*deckClamp(t,0,1)));return '#'+m.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();}
function deckHeatmap(c,variant){
 const rows=deckRowsFor(c,variant);let cols,cell;
 const coord=rows.every(r=>r.raw&&r.raw.row!=null&&(r.raw.col!=null||r.raw.column!=null));
 if(coord){const rk=[...new Set(rows.map(r=>String(r.raw.row)))],ck=[...new Set(rows.map(r=>String(r.raw.col??r.raw.column)))];cols=ck;cell=(ri,ci)=>{const r=rows.find(x=>String(x.raw.row)===rk[ri]&&String(x.raw.col??x.raw.column)===ck[ci]);return r?r.value:NaN;};return deckHeatGrid(c,variant,rk,cols,cell);}
 const keys=deckSelectSeries(rows,variant);cols=keys.length?keys:['value'];
 return deckHeatGrid(c,variant,rows.map(r=>r.label),cols,(ri,ci)=>keys.length?deckSeriesValue(rows[ri],cols[ci]):rows[ri].value);
}
function deckHeatGrid(c,variant,rowNames,cols,cell){
 const vals=[];rowNames.forEach((_,i)=>cols.forEach((_,j)=>vals.push(cell(i,j))));const f=vals.filter(Number.isFinite);
 if(!f.length)return deckEmpty(variant,'No numeric cells to draw');
 const lo=Math.min(...f),hi=Math.max(...f),x0=230,y0=56,w=(DECK_VB.w-40-x0)/cols.length,h=Math.min(64,(440-y0)/rowNames.length);
 let g=deckSvgOpen(variant,c.title);
 cols.forEach((k,j)=>g+=deckLabel(x0+w*(j+.5),y0-12,k,{w:w-6,size:15,anchor:'middle',what:'Column label'}));
 rowNames.forEach((name,i)=>{g+=deckLabel(x0-12,y0+h*(i+.5),name,{w:x0-24,size:15,lines:2,anchor:'end',valign:'middle',what:'Row label'});
  cols.forEach((_,j)=>{const v=cell(i,j),fill=Number.isFinite(v)?deckHeatColor(hi===lo?1:(v-lo)/(hi-lo)):'#F1F4F2';
   g+=deckMark('cell',x0+w*j+2,y0+h*i+2,w-4,h-4,fill,Number.isFinite(v)?v:'',' rx="6"');
   g+=deckText(r1(x0+w*(j+.5)),r1(y0+h*(i+.5)+6),Number.isFinite(v)?deckFmt(v,c.options?.format):'—',15,Number.isFinite(v)?ink(fill):DECK_MUTED,'middle',750);});});
 const ly=Math.min(458,y0+h*rowNames.length+24);g+=`<defs><linearGradient id="hm-${deckSafe(variant)}" x1="0" x2="1"><stop offset="0" stop-color="${deckHeatColor(0)}"/><stop offset="1" stop-color="${deckHeatColor(1)}"/></linearGradient></defs>`;
 g+=deckRect(x0,ly-10,200,12,`url(#hm-${deckSafe(variant)})`,'none',6)+deckText(x0-8,ly+2,deckFmt(lo),13,DECK_MUTED,'end',600)+deckText(x0+208,ly+2,deckFmt(hi),13,DECK_MUTED,'start',600);
 return g+'</svg>';
}
// Squarified treemap: rectangle areas are proportional to values.
function deckTreemap(c,variant){
 let rows=deckNumeric(deckRowsFor(c,variant),variant);
 if(rows.some(r=>r.value<=0)){XBDiag.report('data.negative','warning','treemap: zero or negative values have no area and are omitted');rows=rows.filter(r=>r.value>0);}
 if(!rows.length)return deckEmpty(variant,'Treemap needs positive values');
 const items=rows.map((r,i)=>({r,i,v:r.value})).sort((a,b)=>b.v-a.v||a.i-b.i),total=items.reduce((s,x)=>s+x.v,0),out=[];
 let box={x:20,y:20,w:DECK_VB.w-40,h:440},rest=items.slice(),scale=box.w*box.h/total;
 const worst=(row,side)=>{const s=row.reduce((a,x)=>a+x.v*scale,0),mx=Math.max(...row.map(x=>x.v*scale)),mn=Math.min(...row.map(x=>x.v*scale));return Math.max(side*side*mx/(s*s),s*s/(side*side*mn));};
 while(rest.length){const side=Math.min(box.w,box.h);let row=[rest[0]],k=1;while(k<rest.length&&worst([...row,rest[k]],side)<=worst(row,side))row.push(rest[k++]);
  const s=row.reduce((a,x)=>a+x.v*scale,0),horiz=box.w>=box.h,thick=s/side;let off=0;
  for(const x of row){const len=x.v*scale/thick;out.push(horiz?{...x,x:box.x,y:box.y+off,w:thick,h:len}:{...x,x:box.x+off,y:box.y,w:len,h:thick});off+=len;}
  box=horiz?{x:box.x+thick,y:box.y,w:box.w-thick,h:box.h}:{x:box.x,y:box.y+thick,w:box.w,h:box.h-thick};rest=rest.slice(k);}
 let g=deckSvgOpen(variant,c.title),hidden=0;
 out.forEach(t=>{const fill=DECK_COLORS[t.i%DECK_COLORS.length];g+=deckMark('area',t.x+2,t.y+2,t.w-4,t.h-4,fill,t.v,' rx="6"');
  if(t.w>70&&t.h>46){g+=deckLabel(t.x+t.w/2,t.y+t.h/2-6,t.r.label,{w:t.w-16,size:Math.min(22,Math.max(13,t.w/9)),lines:t.h>90?2:1,color:ink(fill),valign:'middle',what:'Treemap label'});g+=deckText(r1(t.x+t.w/2),r1(t.y+t.h/2+(t.h>90?34:18)),deckFmt(t.v),14,ink(fill),'middle',700);}else{hidden++;g+=`<title>${deckSafe(t.r.label)}: ${deckFmt(t.v)}</title>`;}});
 if(hidden)XBDiag.report('text.hidden','info',`treemap: ${hidden} small tile(s) have no visible label (value kept in tooltip)`);
 return g+'</svg>';
}
function deckFunnel(c,variant){
 const rows=deckNumeric(deckRowsFor(c,variant),variant);if(!rows.length)return deckEmpty(variant,'No numeric rows to draw');
 const max=Math.max(...rows.map(r=>r.value),1),n=rows.length,h=(440-(n-1)*6)/n,mid=DECK_VB.w/2,full=DECK_VB.w-140;let g=deckSvgOpen(variant,c.title);
 rows.forEach((r,i)=>{const w=Math.max(60,full*Math.max(0,r.value)/max),y=20+i*(h+6),next=rows[i+1]?Math.max(60,full*Math.max(0,rows[i+1].value)/max):w*.92;
  g+=`<polygon data-mark="stage" data-v="${r.value}" points="${r1(mid-w/2)},${r1(y)} ${r1(mid+w/2)},${r1(y)} ${r1(mid+next/2)},${r1(y+h)} ${r1(mid-next/2)},${r1(y+h)}" fill="${DECK_COLORS[i%DECK_COLORS.length]}"/>`;
  const conv=i&&rows[i-1].value?` · ${Math.round(r.value/rows[i-1].value*100)}% of previous`:'';
  g+=deckLabel(mid,y+h/2,`${r.label} · ${deckFmt(r.value)}${conv}`,{w:Math.max(160,Math.min(w,next)-24),size:18,minSize:12,color:'#FFFFFF',valign:'middle',what:'Stage label'});});
 return g+'</svg>';
}
function deckWaffle(c,variant){
 let rows=deckNumeric(deckRowsFor(c,variant),variant).filter(r=>r.value>0);const total=rows.reduce((s,r)=>s+r.value,0);
 if(!total)return deckEmpty(variant,'Waffle needs positive values');
 const exact=rows.map(r=>r.value/total*100),cells=exact.map(Math.floor);let left=100-cells.reduce((a,b)=>a+b,0);
 exact.map((v,i)=>({i,f:v-Math.floor(v)})).sort((a,b)=>b.f-a.f||a.i-b.i).slice(0,left).forEach(x=>cells[x.i]++); // largest remainder → exactly 100 cells
 let g=deckSvgOpen(variant,c.title),k=0;
 cells.forEach((n,j)=>{for(let m=0;m<n;m++,k++){const x=60+(k%10)*40,y=40+Math.floor(k/10)*40;g+=`<rect data-mark="cell" data-v="${j}" x="${x}" y="${y}" width="34" height="34" rx="6" fill="${DECK_COLORS[j%DECK_COLORS.length]}"/>`;}});
 rows.forEach((r,j)=>{const y=70+j*Math.min(50,380/rows.length);g+=deckRect(520,y-14,18,18,DECK_COLORS[j%DECK_COLORS.length],'none',4)+deckLabel(550,y,r.label,{w:270,size:17,anchor:'start',what:'Legend label'})+deckText(960,y,`${cells[j]}% · ${deckFmt(r.value)}`,16,DECK_INK,'end',750);});
 return g+'</svg>';
}
function deckSlope(c,variant){
 const rows=deckNumeric(deckNumeric(deckRowsFor(c,variant),variant,r=>deckField(r,'before'),'before'),variant,r=>deckField(r,'after'),'after');
 if(!rows.length)return deckEmpty(variant,'Slope needs numeric "before" and "after" per row');
 const sc=deckNiceScale(rows.flatMap(r=>[deckField(r,'before'),deckField(r,'after')]),{zero:false}),Y=v=>sc.map(v,420,60),xa=330,xb=670,names=c.options?.labels||['Before','After'];
 let g=deckSvgOpen(variant,c.title)+deckLine(xa,50,xa,430,DECK_AXIS,2)+deckLine(xb,50,xb,430,DECK_AXIS,2)+deckText(xa,32,names[0],17,DECK_INK,'middle',800)+deckText(xb,32,names[1],17,DECK_INK,'middle',800);
 const place=(ys)=>{const o=ys.map((y,i)=>({y,i})).sort((a,b)=>a.y-b.y);for(let k=1;k<o.length;k++)if(o[k].y-o[k-1].y<20)o[k].y=o[k-1].y+20;const r=[];o.forEach(p=>r[p.i]=p.y);return r;};
 const la=place(rows.map(r=>Y(deckField(r,'before')))),lb=place(rows.map(r=>Y(deckField(r,'after'))));
 rows.forEach((r,i)=>{const a=deckField(r,'before'),b=deckField(r,'after'),col=DECK_COLORS[i%DECK_COLORS.length];
  g+=`<line data-mark="slope" data-v="${a}..${b}" x1="${xa}" y1="${r1(Y(a))}" x2="${xb}" y2="${r1(Y(b))}" stroke="${col}" stroke-width="5"/>`+`<circle cx="${xa}" cy="${r1(Y(a))}" r="7" fill="${col}"/><circle cx="${xb}" cy="${r1(Y(b))}" r="7" fill="${col}"/>`;
  g+=deckLabel(xa-16,la[i]+5,`${r.label} ${deckFmt(a)}`,{w:290,size:15,anchor:'end',color:col,what:'Slope label'})+deckText(xb+16,r1(lb[i]+5),deckFmt(b),15,col,'start',750);});
 return g+'</svg>';
}
function deckDiverging(c,variant){
 const rows=deckNumeric(deckRowsFor(c,variant),variant);if(!rows.length)return deckEmpty(variant,'No numeric rows to draw');
 const max=Math.max(...rows.map(r=>Math.abs(r.value)),1),labelW=Math.max(170,Math.min(250,DECK_VB.w*.25)),half=Math.round((DECK_VB.w-labelW-120)/2),cx=Math.round(labelW+60+half),top=36,slot=(440-top)/rows.length,h=Math.min(40,slot*.62);
 let g=deckSvgOpen(variant,c.title)+deckLine(cx,top-10,cx,top+slot*rows.length,DECK_INK,2);
 rows.forEach((r,i)=>{const yc=top+slot*(i+.5),w=Math.abs(r.value)/max*half,neg=r.value<0;
  g+=deckLabel(24,yc,r.label,{w:cx-half-60,size:16,lines:2,anchor:'start',valign:'middle',what:'Row label'});
  g+=deckMark('bar',neg?cx-w:cx,yc-h/2,Math.max(1,w),h,neg?DECK_NEG:DECK_POS,r.value,' rx="6"');
  g+=deckText(r1(neg?cx-w-8:cx+w+8),r1(yc+5),(r.value>0?'+':'')+deckFmt(r.value,c.options?.format),16,DECK_INK,neg?'end':'start',750);});
 return g+'</svg>';
}
// Registry: label, data contract (fields the renderer reads) and renderer. DECK_DESCRIPTORS.chart derives from it.
const CHART_VARIANTS={
 'bar':{constraints:{"maxRows":12,"maxSeries":null},label:'Column chart',data:'rows: label + value (number); negatives drawn below zero',render:deckColumns},
 'bar-horizontal':{constraints:{"maxRows":10,"maxSeries":null},label:'Horizontal bar',data:'rows: label + value',render:deckHBars},
 'grouped-bar':{constraints:{"maxRows":10,"maxSeries":6},label:'Grouped columns',data:'rows: label + ≥2 numeric series fields',render:deckMultiColumns},
 'stacked-bar':{constraints:{"maxRows":10,"maxSeries":6},label:'Stacked columns',data:'rows: label + ≥2 numeric series fields',render:deckMultiColumns},
 'line':{constraints:{"maxRows":24,"maxSeries":5},label:'Line chart',data:'rows: label + value, or ≥2 numeric series fields',render:deckLines},
 'area':{constraints:{"maxRows":24,"maxSeries":5},label:'Area chart',data:'rows: label + value, or ≥2 numeric series fields',render:deckLines},
 'step-line':{constraints:{"maxRows":24,"maxSeries":5},label:'Step line',data:'rows: label + value, or ≥2 numeric series fields',render:deckLines},
 'lollipop':{constraints:{"maxRows":12,"maxSeries":null},label:'Lollipop',data:'rows: label + value',render:deckColumns},
 'dot-plot':{constraints:{"maxRows":12,"maxSeries":null},label:'Dot plot',data:'rows: label + value',render:deckColumns},
 'waterfall':{constraints:{"maxRows":12,"maxSeries":null},label:'Waterfall',data:'rows: label + value (delta); total:true rows show the running total',render:deckWaterfall},
 'donut':{constraints:{"maxRows":null,"maxSeries":null},label:'Donut',data:'rows: label + value ≥ 0; >7 rows aggregate into Other',render:deckPie},
 'pie':{constraints:{"maxRows":null,"maxSeries":null},label:'Pie',data:'rows: label + value ≥ 0; >7 rows aggregate into Other',render:deckPie},
 'radar':{constraints:{"maxRows":10,"maxSeries":null},label:'Radar',data:'rows = axes (≥3): label + value, or ≥2 numeric series fields',render:deckRadar},
 'scatter':{constraints:{"maxRows":60,"maxSeries":null},label:'Scatter',data:'rows: label + x + y (numbers)',render:deckScatter},
 'bubble':{constraints:{"maxRows":60,"maxSeries":null},label:'Bubble',data:'rows: label + x + y + size',render:deckScatter},
 'heatmap':{constraints:{"maxRows":12,"maxSeries":8},label:'Heatmap',data:'rows: label + numeric series fields (matrix), or row/col/value cells',render:deckHeatmap},
 'histogram':{constraints:{"maxRows":12,"maxSeries":null},label:'Histogram',data:'rows: pre-binned label + count, or observations with options.bins',render:deckColumns},
 'pareto':{constraints:{"maxRows":12,"maxSeries":null},label:'Pareto',data:'rows: label + value ≥ 0 (sorted, cumulative %)',render:deckPareto},
 'gauge':{constraints:{"maxRows":1,"maxSeries":null},label:'Gauge',data:'one row: value + target/max (options.max, default 100)',render:deckRings},
 'bullet':{constraints:{"maxRows":10,"maxSeries":null},label:'Bullet',data:'rows: label + value + target (or options.target)',render:deckHBars},
 'progress-ring':{constraints:{"maxRows":5,"maxSeries":null},label:'Progress ring',data:'rows (≤5): label + value + target/max (default 100)',render:deckRings},
 'sparkline':{constraints:{"maxRows":24,"maxSeries":null},label:'Sparkline',data:'rows: label + value (one series)',render:deckLines},
 'treemap':{constraints:{"maxRows":20,"maxSeries":null},label:'Treemap',data:'rows: label + value > 0 (area ∝ value)',render:deckTreemap},
 'funnel-chart':{constraints:{"maxRows":8,"maxSeries":null},label:'Funnel chart',data:'rows: stage label + value (width ∝ value)',render:deckFunnel},
 'slope':{constraints:{"maxRows":10,"maxSeries":null},label:'Slope chart',data:'rows: label + before + after',render:deckSlope},
 'waffle':{constraints:{"maxRows":8,"maxSeries":null},label:'Waffle chart',data:'rows: label + value > 0 (exactly 100 cells)',render:deckWaffle},
 'range-bar':{constraints:{"maxRows":10,"maxSeries":null},label:'Range bar',data:'rows: label + start + end (aliases low/high, min/max, from/to)',render:deckHBars},
 'dumbbell':{constraints:{"maxRows":10,"maxSeries":null},label:'Dumbbell',data:'rows: label + before + after',render:deckHBars},
 'marimekko':{constraints:{"maxRows":8,"maxSeries":6},label:'Mekko / composition',data:'rows: label + ≥2 numeric series (width ∝ row total)',render:deckMultiColumns},
 'combo':{constraints:{"maxRows":12,"maxSeries":null},label:'Combo · bar + line',data:'rows: label + value (bars) + target (line)',render:deckCombo},
 'stacked-100':{constraints:{"maxRows":10,"maxSeries":6},label:'100% stacked columns',data:'rows: label + ≥2 numeric series fields',render:deckMultiColumns},
 'diverging-bar':{constraints:{"maxRows":10,"maxSeries":null},label:'Diverging bar',data:'rows: label + value (negative left, positive right)',render:deckDiverging}
};
function deckChart(c,box){
 const variant=c.variant||'bar',entry=CHART_VARIANTS[variant];
 if(!entry){XBDiag.report('variant.unknown','error',`Unknown chart variant "${variant}"`);return deckEmpty(variant,'Unknown chart variant: '+variant);}
 return deckWithBox(variant,box,()=>entry.render(c,variant));
}
/* ---------------- Diagram engine: nodes + edges → layout, never invented relations ----------------
 Nodes come from component.nodes/steps or from data rows; edges reference node ids (or labels).
 Relations are drawn only from edges/parent/fields given in the data; array order is used only
 where the variant is defined as an ordered sequence (flows, cycles, timelines). */
function deckNodeList(c){return (Array.isArray(c.nodes)?c.nodes:Array.isArray(c.steps)?c.steps:[]).map((n,i)=>typeof n==='string'?{id:'n'+i,label:n}:({...n,id:String(n.id??'n'+i),label:String(n.label??n.name??n.title??''),desc:n.desc??n.subtitle??''}));}
function deckGraph(c,variant,{max=12}={}){
 let nodes=deckNodeList(c),source='nodes';
 if(!nodes.length){source='data';if(Array.isArray(c.nodes)&&!c.dataRef&&!c.data&&!c.dataset)XBDiag.report('data.empty','warning',`${variant}: nodes is an empty array`);nodes=deckRows(Array.isArray(c.nodes)&&!c.dataRef&&!c.data&&!c.dataset?[]:deckData(c)).map((r,i)=>({...(r.raw&&typeof r.raw==='object'?r.raw:{}),id:String(r.raw?.id??'n'+i),label:r.label,value:r.value}));}
 nodes.forEach((n,i)=>{if(!n.label)XBDiag.report('data.field-missing','warning',`${variant}: node ${i+1} has no label`,{at:[source==='nodes'?(c.nodes?'nodes':'steps'):'data',i],field:'label'});});
 const seen=new Set();for(const n of nodes){if(seen.has(n.id))XBDiag.report('graph.duplicate-id','error',`${variant}: duplicate node id "${n.id}"`,{id:n.id});seen.add(n.id);}
 const limit=deckClamp(deckNum(c.maxNodes,max),2,30);
 if(nodes.length>limit){XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: showing ${limit} of ${nodes.length} nodes; split the diagram or raise maxNodes (≤30) if the layout allows`,{nodes:nodes.length,max:limit});nodes=nodes.slice(0,limit);}
 const byKey=k=>nodes.find(n=>n.id===String(k))||nodes.find(n=>n.label===String(k));
 const edges=[];(Array.isArray(c.edges)?c.edges:[]).forEach((e,i)=>{const a=byKey(e?.from),b=byKey(e?.to);
  if(!a||!b){XBDiag.report('graph.dangling-edge','error',`${variant}: edge ${e?.from} → ${e?.to} references a missing node`,{at:['edges',i]});return;}
  edges.push({...e,a,b,i});});
 for(const n of nodes){if(n.parent==null)continue;const p=byKey(n.parent);if(p&&!edges.some(e=>e.a===p&&e.b===n))edges.push({a:p,b:n,from:p.id,to:n.id,implicit:true});else if(!p)XBDiag.report('graph.dangling-edge','error',`${variant}: node "${n.label}" has unknown parent "${n.parent}"`);}
 return {nodes,edges,source};
}
const deckBoxText=(x,y,w,h,text,o={})=>deckLabel(x+w/2,y+h/2,text,{w:w-(o.pad??24),size:o.size||19,minSize:o.minSize??12,lines:o.lines||Math.max(1,Math.min(4,Math.floor((h-12)/((o.size||19)*1.2)))),color:o.color||DECK_INK,valign:'middle',weight:o.weight||750,what:o.what||'Node label'});
function deckNodeBox(x,y,w,h,n,i,o={}){
 const col=n.color&&/^#[0-9a-f]{6}$/i.test(n.color)?n.color:DECK_COLORS[i%DECK_COLORS.length];
 if(n.kind==='decision'||n.kind==='gateway'||n.shape==='diamond')return `<polygon data-node="${deckSafe(n.id)}" points="${r1(x+w/2)},${r1(y)} ${r1(x+w)},${r1(y+h/2)} ${r1(x+w/2)},${r1(y+h)} ${r1(x)},${r1(y+h/2)}" fill="#FFFFFF" stroke="${col}" stroke-width="4"/>`+deckBoxText(x+w*.18,y+h*.18,w*.64,h*.64,n.label,{size:o.size||16,lines:2});
 return `<rect data-node="${deckSafe(n.id)}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="14" fill="${o.fill||(i%2?'#F5FAF7':'#FFF7EF')}" stroke="${o.stroke||'#DFE8E3'}" stroke-width="${o.sw||2}"/>`+deckRect(r1(x),r1(y),7,r1(h),col,'none',4)+deckBoxText(x+6,y,w-6,h,n.label,o);
}
function deckArrow(x1,y1,x2,y2,col='#9FB3AB',w=4,o={}){
 const dash=o.dash?` stroke-dasharray="${o.dash}"`:'';
 if(o.curve){const [cx,cy]=o.curve,a=Math.atan2(y2-cy,x2-cx),hx=x2-Math.cos(a)*14,hy=y2-Math.sin(a)*14,px=Math.sin(a)*8,py=-Math.cos(a)*8;
  return `<path data-edge="${deckSafe(o.id||'')}" d="M${r1(x1)} ${r1(y1)}Q${r1(cx)} ${r1(cy)} ${r1(hx)} ${r1(hy)}" fill="none" stroke="${col}" stroke-width="${w}"${dash}/><path d="M${r1(hx+px)} ${r1(hy+py)}L${r1(x2)} ${r1(y2)}L${r1(hx-px)} ${r1(hy-py)}Z" fill="${col}"/>`;}
 const a=Math.atan2(y2-y1,x2-x1),hx=x2-Math.cos(a)*14,hy=y2-Math.sin(a)*14,px=Math.sin(a)*8,py=-Math.cos(a)*8;
 return `<path data-edge="${deckSafe(o.id||'')}" d="M${r1(x1)} ${r1(y1)}L${r1(hx)} ${r1(hy)}" stroke="${col}" stroke-width="${w}" fill="none"${dash}/><path d="M${r1(hx+px)} ${r1(hy+py)}L${r1(x2)} ${r1(y2)}L${r1(hx-px)} ${r1(hy-py)}Z" fill="${col}"/>`;
}
// Stable topological order (Kahn, ties by original index); null when the edges contain a cycle.
function deckTopo(nodes,edges){
 const indeg=new Map(nodes.map(n=>[n,0]));edges.forEach(e=>indeg.set(e.b,indeg.get(e.b)+1));
 const out=[],ready=nodes.filter(n=>!indeg.get(n));
 while(ready.length){ready.sort((a,b)=>nodes.indexOf(a)-nodes.indexOf(b));const n=ready.shift();out.push(n);edges.filter(e=>e.a===n).forEach(e=>{indeg.set(e.b,indeg.get(e.b)-1);if(!indeg.get(e.b))ready.push(e.b);});}
 return out.length===nodes.length?out:null;
}
// Sugiyama layering: orient DFS feedback arcs for ranking, reserve dummy slots on long edges,
// then sweep barycentres. The original edge objects/directions remain unchanged for rendering.
function deckLayerGraph(nodes,edges,{weight=()=>1}={}){
 const state=new Map(),feedback=new Set();
 const visit=n=>{state.set(n,1);for(const e of edges.filter(e=>e.a===n)){if(state.get(e.b)===1)feedback.add(e);else if(!state.has(e.b))visit(e.b);}state.set(n,2);};
 nodes.forEach(n=>{if(!state.has(n))visit(n);});
 if(feedback.size)XBDiag.report('graph.cycle','info',`${feedback.size} feedback edge(s) routed outside the layered graph`,{edges:[...feedback].map(e=>({from:e.a.id,to:e.b.id}))});
 const ranked=edges.filter(e=>e.a!==e.b).map(e=>feedback.has(e)?{a:e.b,b:e.a}:e),order=deckTopo(nodes,ranked)||nodes;
 const rank=new Map();order.forEach(n=>rank.set(n,Math.max(0,...ranked.filter(e=>e.b===n).map(e=>(rank.get(e.a)??0)+1))));
 const layers=Array.from({length:Math.max(0,...rank.values())+1},(_,k)=>nodes.filter(n=>rank.get(n)===k)),routes=new Map(),segments=[];
 edges.forEach((e,i)=>{
  if(feedback.has(e)){routes.set(e,[e.a,e.b]);return;}
  const chain=[e.a];for(let k=rank.get(e.a)+1;k<rank.get(e.b);k++){const dummy={kind:'dummy',id:`v1-dummy-${i}-${k}`,flow:weight(e)};rank.set(dummy,k);layers[k].push(dummy);chain.push(dummy);}chain.push(e.b);routes.set(e,chain);
  for(let k=1;k<chain.length;k++)segments.push({a:chain[k-1],b:chain[k]});
 });
 const index=n=>layers[rank.get(n)].indexOf(n);
 for(let sweep=0;sweep<6;sweep++){
  const reverse=sweep%2===1,start=reverse?layers.length-2:1,end=reverse?-1:layers.length,step=reverse?-1:1;
  for(let k=start;k!==end;k+=step){const before=new Map(layers[k].map((n,i)=>[n,i]));
   const bary=n=>{const adjacent=segments.filter(e=>reverse?e.a===n:e.b===n).map(e=>index(reverse?e.b:e.a));return adjacent.length?adjacent.reduce((a,b)=>a+b,0)/adjacent.length:before.get(n);};
   layers[k].sort((a,b)=>bary(a)-bary(b)||before.get(a)-before.get(b));
  }
 }
 return {layers,rank,routes,feedback};
}
function deckGraphPath(points){
 let d=`M${r1(points[0].x)} ${r1(points[0].y)}`;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],mid=(a.x+b.x)/2;d+=`C${r1(mid)} ${r1(a.y)},${r1(mid)} ${r1(b.y)},${r1(b.x)} ${r1(b.y)}`;}return d;
}
// Explicit dependency graphs use layers; sequential process layouts retain their documented order.
function deckLayeredDiagram(c,variant,G,vertical=false){
 const L=deckLayerGraph(G.nodes,G.edges),levels=L.layers.length,breadth=vertical?DECK_VB.w-100:360,depth=vertical?360:DECK_VB.w-180;
 const band=depth/Math.max(1,levels),max=Math.max(1,...L.layers.map(x=>x.length)),slot=breadth/max;
 const bw=Math.max(20,vertical?Math.min(260,slot-18):Math.min(260,band*.66)),bh=Math.max(20,vertical?Math.min(90,band*.60):Math.min(100,slot-20)),pos=new Map();
 if(max*(vertical?bw+18:bh+20)>breadth+1)XBDiag.report('layout.overflow','error',`${variant}: layered nodes and routing slots exceed the available breadth; split the graph`);
 L.layers.forEach((list,k)=>list.forEach((n,j)=>{
  const cross=(breadth-list.length*slot)/2+(j+.5)*slot;
  pos.set(n,vertical?{x:50+cross,y:24+k*band+bh/2}:{x:70+k*band+bw/2,y:30+cross});
 }));
 // A shared child starts at its parents' barycentre, then row separation prevents node collisions.
 if(vertical)for(let k=1;k<levels;k++){
  const list=L.layers[k];for(const n of list){const parents=G.edges.filter(e=>e.b===n&&!L.feedback.has(e)).map(e=>pos.get(e.a));if(parents.length)pos.get(n).x=parents.reduce((a,p)=>a+p.x,0)/parents.length;}
  list.sort((a,b)=>pos.get(a).x-pos.get(b).x);
  let previous=50+bw/2- (bw+18);for(const n of list){pos.get(n).x=Math.max(pos.get(n).x,previous+bw+18);previous=pos.get(n).x;}
  const spill=Math.max(0,previous-(DECK_VB.w-50-bw/2));if(spill)for(const n of list)pos.get(n).x-=spill;
 }
 let g=deckSvgOpen(variant,c.title),links='';
 G.edges.forEach((e,i)=>{
  const a=pos.get(e.a),b=pos.get(e.b),id=`${e.a.id}->${e.b.id}`;let d;
  if(L.feedback.has(e)){
   const rail=vertical?DECK_VB.w-18-i*3:454+i*3;
   d=vertical?`M${r1(a.x+bw/2)} ${r1(a.y)}H${r1(rail)}V${r1(b.y)}H${r1(b.x+bw/2)}`:`M${r1(a.x)} ${r1(a.y+bh/2)}V${r1(rail)}H${r1(b.x)}V${r1(b.y+bh/2)}`;
  }else{
   const chain=L.routes.get(e),points=[];
   chain.forEach((n,j)=>{const p=pos.get(n);if(n.kind==='dummy')points.push(p);else if(vertical)points.push({x:p.x,y:p.y+(j? -bh/2:bh/2)});else points.push({x:p.x+(j?-bw/2:bw/2),y:p.y});});
   if(vertical){d=`M${r1(points[0].x)} ${r1(points[0].y)}`;for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],mid=(a.y+b.y)/2;d+=`C${r1(a.x)} ${r1(mid)},${r1(b.x)} ${r1(mid)},${r1(b.x)} ${r1(b.y)}`;}}
   else d=deckGraphPath(points);
  }
  links+=`<path data-edge="${deckSafe(id)}"${L.feedback.has(e)?' data-feedback="true"':''} d="${d}" fill="none" stroke="${e.critical?DECK_COLORS[0]:'#9FB3AB'}" stroke-width="3"/>`;
  const tip=L.feedback.has(e)?(vertical?{x:b.x+bw/2,y:b.y,dx:-1,dy:0}:{x:b.x,y:b.y+bh/2,dx:0,dy:-1}):(vertical?{x:b.x,y:b.y-bh/2,dx:0,dy:1}:{x:b.x-bw/2,y:b.y,dx:1,dy:0});
  links+=`<path d="M${r1(tip.x-tip.dx*11-tip.dy*5)} ${r1(tip.y-tip.dy*11+tip.dx*5)}L${r1(tip.x)} ${r1(tip.y)}L${r1(tip.x-tip.dx*11+tip.dy*5)} ${r1(tip.y-tip.dy*11-tip.dx*5)}Z" fill="#9FB3AB"/>`;
  if(e.label)links+=deckLabel((a.x+b.x)/2,(a.y+b.y)/2-12,e.label,{w:Math.max(60,vertical?slot-24:band-bw-12),size:13,what:'Edge label'});
 });
 g+=links;G.nodes.forEach((n,i)=>{const p=pos.get(n);g+=deckNodeBox(p.x-bw/2,p.y-bh/2,bw,bh,n,i,{size:vertical?16:18,lines:3});});
 return g+'</svg>';
}
function deckFlow(c,variant){
 const G=deckGraph(c,variant,{max:12});if(!G.nodes.length)return deckEmpty(variant,'Add nodes (or steps) to draw the flow');
 if(G.edges.length)return deckLayeredDiagram(c,variant,G);
 const needEdges=variant==='dependency'||variant==='critical-path';
 if(needEdges&&!G.edges.length)XBDiag.report('graph.edges-missing','warning',`${variant}: no edges given; nodes are drawn in array order without dependencies`);
 let order=G.nodes;if(G.edges.length){const t=deckTopo(G.nodes,G.edges);if(t)order=t;else if(variant!=='state-machine'&&variant!=='bpmn')XBDiag.report('graph.cycle','info',`${variant}: edges contain a cycle; nodes keep array order and back edges are drawn as arcs`);}
 const n=order.length,rows=n>6?2:1,perRow=Math.ceil(n/rows),cell=(DECK_VB.w-100)/perRow,w=Math.min(cell-30,300),h=rows===1?150:118;
 const wave=rows===1&&['zigzag','customer-journey','learner-journey'].includes(variant);
 const pos=new Map(order.map((nd,i)=>{const row=Math.floor(i/perRow),k=i%perRow;return [nd,{x:50+k*cell+(cell-w)/2,y:rows===1?(wave?110+(k%2)*90:150):48+row*220,row,k,i}];}));
 const crit=variant==='critical-path';if(crit&&!G.nodes.some(nd=>nd.critical)&&!G.edges.some(e=>e.critical))XBDiag.report('data.field-missing','warning','critical-path: mark nodes or edges with critical:true to highlight the path',{field:'critical'});
 let g=deckSvgOpen(variant,c.title),links='';
 const link=(a,b,label,o={})=>{const p=pos.get(a),q=pos.get(b);let s;
  if(p.row===q.row&&q.k===p.k+1)s=deckArrow(p.x+w,p.y+h/2,q.x,q.y+h/2,o.col,4,o);
  else if(p.row+1===q.row&&q.k===0&&p.k===perRow-1)s=`<path d="M${r1(p.x+w/2)} ${r1(p.y+h)}V${r1(p.y+h+40)}H${r1(q.x+w/2)}" fill="none" stroke="${o.col||'#9FB3AB'}" stroke-width="4"/>`+deckArrow(q.x+w/2,p.y+h+40,q.x+w/2,q.y,o.col,4,o);
  else{const up=q.i<p.i||p.row===q.row,sx=p.x+w/2,sy=up?p.y:p.y+h,tx=q.x+w/2,ty=up?q.y:q.y,cy=up?Math.min(sy,ty)-60-Math.abs(q.k-p.k)*8:(sy+ty)/2;s=deckArrow(sx,sy,tx,ty,o.col||'#B9C8C2',3,{...o,curve:[(sx+tx)/2,cy]});}
  if(label)s+=deckLabel((p.x+w+q.x)/2,Math.min(p.y,q.y)-10,label,{w:Math.max(60,cell-w+40),size:13,what:'Edge label'});
  return s;};
 if(G.edges.length)G.edges.forEach(e=>links+=link(e.a,e.b,e.label,{id:`${e.a.id}->${e.b.id}`,col:crit&&(e.critical||(e.a.critical&&e.b.critical))?DECK_COLORS[0]:undefined,dash:e.kind==='async'||e.kind==='return'?'8 6':''}));
 else order.slice(1).forEach((nd,i)=>links+=link(order[i],nd,'',{id:`${order[i].id}->${nd.id}`}));
 order.forEach((nd,i)=>{const p=pos.get(nd),hl=crit&&nd.critical;
  if(variant==='chevrons'){g+=`<polygon data-node="${deckSafe(nd.id)}" points="${r1(p.x)},${r1(p.y)} ${r1(p.x+w-26)},${r1(p.y)} ${r1(p.x+w)},${r1(p.y+h/2)} ${r1(p.x+w-26)},${r1(p.y+h)} ${r1(p.x)},${r1(p.y+h)} ${r1(p.x+24)},${r1(p.y+h/2)}" fill="${DECK_COLORS[i%DECK_COLORS.length]}"/>`+deckBoxText(p.x+22,p.y,w-50,h,nd.label,{color:'#FFFFFF',size:18});}
  else g+=deckNodeBox(p.x,p.y,w,h,nd,i,hl?{stroke:DECK_COLORS[0],sw:5}:{})+deckRect(r1(p.x+w/2-22),r1(p.y-22),44,40,hl||!crit?DECK_COLORS[i%DECK_COLORS.length]:'#9FB3AB','none',10)+deckText(r1(p.x+w/2),r1(p.y+6),String(i+1).padStart(2,'0'),17,'#FFFFFF','middle',800);
  if(nd.desc)g+=deckLabel(p.x+w/2,p.y+h+(rows===1?18:12),nd.desc,{w:cell-12,size:15,lines:rows===1?3:1,valign:'top',color:DECK_MUTED,font:'body',what:'Node description'});});
 return g+links+'</svg>';
}
const DECK_DATE_RE=/^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
function deckTime(v){
 if(typeof v==='number')return Number.isFinite(v)?v:NaN;
 const m=DECK_DATE_RE.exec(String(v??'').trim());if(!m)return deckToNumber(v);
 const year=+m[1],month=+m[2]-1,day=+(m[3]||1),date=new Date(0);date.setUTCFullYear(year,month,day);date.setUTCHours(0,0,0,0);
 return date.getUTCFullYear()===year&&date.getUTCMonth()===month&&date.getUTCDate()===day?date.getTime()/864e5:NaN;
}
function deckTimeLabel(t,dateMode){if(!dateMode)return deckFmt(t);const d=new Date(t*864e5);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
function deckTimeScale(times,x0,x1,dateMode){
 const lo=Math.min(...times),hi=Math.max(...times),span=hi-lo||1,X=t=>x0+(t-lo)/span*(x1-x0),ticks=[];
 if(dateMode){const a=new Date(lo*864e5),b=new Date(hi*864e5),months=(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth(),step=Math.max(1,Math.ceil(months/8));
  for(let k=0;k<=months+1;k+=step){const t=Date.UTC(a.getUTCFullYear(),a.getUTCMonth()+k,1)/864e5;if(t>=lo&&t<=hi)ticks.push(t);}}
 else{const sc=xNice(lo,hi,6);for(let v=sc.lo;v<=sc.hi+1e-9;v+=sc.step)if(v>=lo-1e-9&&v<=hi+1e-9)ticks.push(+v.toFixed(10));}
 return {X,ticks,lo,hi};
}
function deckTimeline(c,variant){
 const G=deckGraph(c,variant,{max:10});if(!G.nodes.length)return deckEmpty(variant,'Add milestones as nodes');
 const t=G.nodes.map(n=>deckTime(n.at??n.date??n.when??n.start)),dated=t.every(Number.isFinite)&&new Set(t).size>1,dateMode=dated&&G.nodes.every(n=>typeof (n.at??n.date??n.when??n.start)==='string');
 const n=G.nodes.length,x0=80,x1=DECK_VB.w-80,sc=dated?deckTimeScale(t,x0,x1,dateMode):null,X=i=>dated?sc.X(t[i]):n===1?(x0+x1)/2:x0+i*(x1-x0)/(n-1);
 if(!dated&&G.nodes.some(nd=>nd.date||nd.when))XBDiag.report('data.non-numeric','info',`${variant}: dates are not all ISO (YYYY-MM[-DD]) or numeric; milestones are evenly spaced`);
 let g=deckSvgOpen(variant,c.title)+deckLine(x0-30,260,x1+30,260,'#D0DDD7',8);const gap=n>1?(x1-x0)/(n-1):400;
 G.nodes.forEach((nd,i)=>{const x=X(i),up=i%2===0,col=DECK_COLORS[i%DECK_COLORS.length],when=nd.date??nd.when??nd.at??'';
  g+=`<circle data-node="${deckSafe(nd.id)}" data-t="${Number.isFinite(t[i])?t[i]:''}" cx="${r1(x)}" cy="260" r="19" fill="${col}" stroke="#FFFFFF" stroke-width="6"/>`;
  if(!when)g+=deckText(r1(x),266,String(i+1),15,'#FFFFFF','middle',800);
  else g+=deckText(r1(x),up?306:226,String(when),15,col,'middle',800);
  g+=deckLabel(x,up?216:302,nd.label,{w:Math.min(240,gap*1.6),size:17,lines:2,valign:up?'bottom':'top',what:'Milestone label'});
  if(nd.desc)g+=deckLabel(x,up?236-96:352,nd.desc,{w:Math.min(240,gap*1.6),size:14,lines:up?1:2,valign:'top',color:DECK_MUTED,font:'body',what:'Milestone description'});});
 return g+'</svg>';
}
function deckGantt(c,variant){
 const G=deckGraph(c,variant,{max:variant==='gantt'?10:16});if(!G.nodes.length)return deckEmpty(variant,'Add tasks as nodes with start/end');
 const S=n=>deckTime(n.start??n.from??n.begin),E=n=>deckTime(n.end??n.to??n.finish??n.start);
 const reversed=G.nodes.filter(n=>Number.isFinite(S(n))&&Number.isFinite(E(n))&&E(n)<S(n));
 if(reversed.length)XBDiag.report('data.inconsistent','error',`${variant}: end precedes start; no bar is drawn`,{rows:reversed.map(n=>n.label)});
 const timed=G.nodes.filter(n=>Number.isFinite(S(n))&&Number.isFinite(E(n))&&E(n)>=S(n));
 const lanesOf=variant!=='gantt';
 if(variant==='gantt'&&timed.length<G.nodes.length)XBDiag.report('data.field-missing','error',`gantt: ${G.nodes.length-timed.length} task(s) without numeric/ISO start and end are listed without bars`,{field:'start/end',rows:G.nodes.filter(n=>!timed.includes(n)).map(n=>n.label)});
 const lanes=lanesOf?(Array.isArray(c.options?.lanes)?c.options.lanes.map(String):[...new Set(G.nodes.map(n=>String(n.lane??n.group??'')))]):G.nodes.map(n=>n.label);
 if(lanesOf&&lanes.includes('')){XBDiag.report('data.field-missing','warning',`${variant}: nodes without "lane" (or group) are placed in an unnamed lane`,{field:'lane'});}
 const dateMode=timed.length>0&&timed.every(n=>typeof (n.start??n.from??n.begin)==='string');
 const useTime=timed.length>0&&(variant==='gantt'||timed.length===G.nodes.length);
 const x0=230,x1=DECK_VB.w-40,y0=50,rowH=Math.min(88,(440-y0)/Math.max(1,lanes.length)),bh=Math.min(52,rowH-16);
 let g=deckSvgOpen(variant,c.title);
 const sc=useTime?deckTimeScale(timed.flatMap(n=>[S(n),E(n)]),x0,x1,dateMode):null;
 if(sc)for(const t of sc.ticks)g+=deckLine(r1(sc.X(t)),y0-8,r1(sc.X(t)),y0+rowH*lanes.length,DECK_GRID,1)+deckText(r1(sc.X(t)),y0-16,deckTimeLabel(t,dateMode),13,DECK_MUTED,'middle',650);
 lanes.forEach((ln,i)=>{const y=y0+i*rowH;g+=deckRect(x0,r1(y+3),x1-x0,r1(rowH-6),i%2?'#F6FAF8':'#FBFCFB','none',6)+deckLabel(x0-14,y+rowH/2,ln||'(no lane)',{w:x0-30,size:15,lines:2,anchor:'end',valign:'middle',what:'Lane label'});});
 const laneIdx=n=>lanesOf?lanes.indexOf(String(n.lane??n.group??'')):G.nodes.indexOf(n);
 const seq=new Map();
 G.nodes.forEach((n,i)=>{const li=laneIdx(n);if(li<0)return;const y=y0+li*rowH+(rowH-bh)/2,col=DECK_COLORS[(lanesOf?li:i)%DECK_COLORS.length];
  if(useTime&&timed.includes(n)){const a=sc.X(S(n)),b=sc.X(E(n));
   if(S(n)===E(n)||n.kind==='milestone')g+=`<polygon data-mark="milestone" data-v="${S(n)}" points="${r1(a)},${r1(y-4)} ${r1(a+12)},${r1(y+bh/2)} ${r1(a)},${r1(y+bh+4)} ${r1(a-12)},${r1(y+bh/2)}" fill="${DECK_INK}"/>`+deckLabel(a+18,y+bh/2,n.label,{w:200,size:13,anchor:'start',valign:'middle',what:'Milestone label'});
   else g+=deckMark('task',a,y,Math.max(4,b-a),bh,col,`${S(n)}..${E(n)}`,' rx="6"')+(lanesOf?(XBText.width(n.label,13)<=b-a-10?deckLabel(a+(b-a)/2,y+bh/2,n.label,{w:b-a-10,size:13,color:ink(col),valign:'middle',what:'Task label'}):b+8+XBText.width(n.label,13)<=x1+40?deckLabel(b+8,y+bh/2,n.label,{w:x1+40-b-8,size:13,anchor:'start',valign:'middle',what:'Task label'}):deckLabel(a-8,y+bh/2,n.label,{w:Math.max(40,a-x0-8),size:13,anchor:'end',valign:'middle',what:'Task label'})):'');}
  else if(!useTime){const k=seq.get(li)||0;seq.set(li,k+1);const per=Math.max(1,Math.max(...lanes.map((_,j)=>G.nodes.filter(m=>laneIdx(m)===j).length))),w=(x1-x0-12)/per;
   g+=deckNodeBox(x0+6+k*w,y,w-10,bh,n,li,{size:14,lines:2});}
  else g+=deckText(x0+12,r1(y+bh/2+5),'no dates',13,DECK_NEG,'start',700);});
 if(sc&&c.options?.today!=null&&Number.isFinite(deckTime(c.options.today))){const x=sc.X(deckTime(c.options.today));g+=deckLine(r1(x),y0-6,r1(x),y0+rowH*lanes.length,DECK_NEG,3,'6 5')+deckText(r1(x),y0+rowH*lanes.length+18,c.options.todayLabel||'Today',13,DECK_NEG,'middle',800);}
 return g+'</svg>';
}
function deckKanban(c,variant){
 const G=deckGraph(c,variant,{max:24});const st=n=>String(n.status??n.group??'');
 let cols=Array.isArray(c.options?.columns)?c.options.columns.map(String):[...new Set(G.nodes.map(st).filter(Boolean))];
 if(!cols.length){XBDiag.report('data.field-missing','warning','kanban: give each node a "status" (or options.columns) to place cards in columns',{field:'status'});cols=['Items'];}
 const unplaced=G.nodes.filter(n=>!cols.includes(st(n))&&cols[0]!=='Items');
 if(unplaced.length)XBDiag.report('data.unmapped','warning',`kanban: ${unplaced.length} card(s) have a status not in options.columns`,{rows:unplaced.map(n=>n.label)});
 const n=Math.min(cols.length,6),cw=(DECK_VB.w-60-(n-1)*14)/n;let g=deckSvgOpen(variant,c.title);
 cols.slice(0,n).forEach((name,i)=>{const x=30+i*(cw+14),cards=G.nodes.filter(m=>cols[0]==='Items'?true:st(m)===name);
  g+=deckRect(r1(x),20,r1(cw),440,'#F3F8F5','#DCE8E0',12,2)+deckRect(r1(x),20,r1(cw),52,DECK_COLORS[i%DECK_COLORS.length],'none',11)+deckLabel(x+cw/2,46,`${name} · ${cards.length}`,{w:cw-16,size:17,color:'#FFFFFF',valign:'middle',what:'Column title'});
  cards.slice(0,5).forEach((m,j)=>g+=`<rect data-node="${deckSafe(m.id)}" x="${r1(x+10)}" y="${84+j*72}" width="${r1(cw-20)}" height="62" rx="9" fill="#FFFFFF" stroke="#DFE7E2" stroke-width="2"/>`+deckBoxText(x+10,84+j*72,cw-20,62,m.label,{size:15,lines:2}));
  if(cards.length>5){g+=deckText(r1(x+cw/2),448,`+${cards.length-5} more`,14,DECK_MUTED,'middle',750);XBDiag.report('data.truncated','info',`kanban: column "${name}" shows 5 of ${cards.length} cards`);}});
 if(cols.length>n)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`kanban: showing ${n} of ${cols.length} columns`);
 return g+'</svg>';
}
function deckTree(c,variant){
 const G=deckGraph(c,variant,{max:20});if(!G.nodes.length)return deckEmpty(variant,'Add nodes; use edges (parent → child) or node.parent');
 let edges=G.edges;
 if(!edges.length&&G.nodes.length>1){XBDiag.report('graph.implicit-hierarchy','info',`${variant}: no edges/parent given; the first node is drawn as the root of all others`);edges=G.nodes.slice(1).map(n=>({a:G.nodes[0],b:n}));}
 return deckLayeredDiagram(c,variant,{...G,edges},true);
}
function deckRadial(c,variant){
 const G=deckGraph(c,variant,{max:variant==='mindmap'||variant==='radial-tree'?24:10});if(!G.nodes.length)return deckEmpty(variant,'Add nodes to place around the centre');
 const ring=['cycle','lifecycle'].includes(variant);let center=c.center??null,nodes=G.nodes,children=new Map();
 if(variant==='concentric'||variant==='nested-circle'){const k=Math.min(5,G.nodes.length);let g=deckSvgOpen(variant,c.title);G.nodes.slice(0,k).forEach((nd,i)=>{const rr=225-i*(185/k);g+=`<circle data-node="${deckSafe(nd.id)}" cx="500" cy="240" r="${r1(rr)}" fill="${i%2?'#FFF1E4':'#E7F5EF'}" stroke="${DECK_COLORS[i%DECK_COLORS.length]}" stroke-width="3"/>`+deckLabel(500,240-rr+24,nd.label,{w:Math.max(80,rr*1.2),size:15,what:'Layer label'});});if(G.nodes.length>k)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: showing ${k} of ${G.nodes.length} layers`);return g+'</svg>';}
 if(variant==='stakeholder'&&nodes.every(n=>Number.isFinite(deckToNumber(n.x))&&Number.isFinite(deckToNumber(n.y))))return deckQuadrantPlot(c,variant,nodes,{xLabel:c.options?.xLabel||'Interest',yLabel:c.options?.yLabel||'Influence',names:c.options?.quadrants||['Keep satisfied','Manage closely','Monitor','Keep informed']});
 if(!ring){const roots=nodes.filter(n=>!G.edges.some(e=>e.b===n));
  if(center==null){const hub=G.edges.length&&roots.length===1?roots[0]:nodes[0];center=hub.label;nodes=nodes.filter(n=>n!==hub);if(!G.edges.length&&c.center==null)XBDiag.report('graph.implicit-hierarchy','info',`${variant}: no "center" given; the first node is used as the centre`);
   G.edges.filter(e=>e.a!==hub).forEach(e=>{children.set(e.a,[...(children.get(e.a)||[]),e.b]);});nodes=nodes.filter(n=>!G.edges.some(e=>e.b===n&&e.a!==hub));}
  else G.edges.forEach(e=>{children.set(e.a,[...(children.get(e.a)||[]),e.b]);nodes=nodes.filter(x=>x!==e.b);});}
 const n=Math.min(nodes.length,10),cx=500,cy=240,R=[300,180];let g=deckSvgOpen(variant,c.title),links='';
 if(center!=null)g+=`<circle cx="${cx}" cy="${cy}" r="96" fill="${DECK_COLORS[0]}"/>`+deckLabel(cx,cy,center,{w:160,size:20,lines:3,color:'#FFFFFF',valign:'middle',what:'Centre label'});
 nodes.slice(0,n).forEach((nd,i)=>{const a=2*Math.PI*i/n-Math.PI/2,x=cx+R[0]*Math.cos(a),y=cy+R[1]*Math.sin(a),col=DECK_COLORS[i%DECK_COLORS.length];
  if(center!=null&&!ring)links+=deckLine(r1(cx+96*Math.cos(a)),r1(cy+96*Math.sin(a)),r1(x),r1(y),col,3);
  if(ring){const b=2*Math.PI*(i+1)/n-Math.PI/2,mid=(a+b)/2;links+=deckArrow(cx+R[0]*Math.cos(a+.18),cy+R[1]*Math.sin(a+.18),cx+R[0]*Math.cos(b-.18),cy+R[1]*Math.sin(b-.18),'#C3D2CB',3,{curve:[cx+R[0]*1.12*Math.cos(mid),cy+R[1]*1.12*Math.sin(mid)]});}
  const ch=children.get(nd)||[];const h=ch.length?96:76;
  g+=`<rect data-node="${deckSafe(nd.id)}" x="${r1(x-82)}" y="${r1(y-h/2)}" width="164" height="${h}" rx="14" fill="#FFFFFF" stroke="${col}" stroke-width="3"/>`+deckBoxText(x-82,y-h/2,164,ch.length?46:h,nd.label,{size:16,lines:2});
  if(ch.length)g+=deckLabel(x,y+4,ch.map(k=>k.label).join(' · '),{w:150,size:12,lines:2,valign:'top',color:DECK_MUTED,font:'body',what:'Child labels'});});
 if(nodes.length>n)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: showing ${n} of ${nodes.length} nodes around the centre`);
 return g+links+'</svg>';
}
function deckLayers(c,variant){
 const G=deckGraph(c,variant,{max:7});if(!G.nodes.length)return deckEmpty(variant,'Add layers as nodes');
 if(G.edges.length)XBDiag.report('graph.edges-ignored','info',`${variant}: edges are not drawn in a layered view`);
 const n=G.nodes.length,h=(440-(n-1)*8)/n,vals=G.nodes.map(nd=>deckToNumber(nd.value)),byValue=variant==='funnel'&&vals.every(v=>Number.isFinite(v)&&v>=0),max=Math.max(...vals.filter(Number.isFinite),1);
 let g=deckSvgOpen(variant,c.title);
 const full=DECK_VB.w-100,mid=DECK_VB.w/2;
 G.nodes.forEach((nd,i)=>{const y=20+i*(h+8);let w=full,x=50;
  if(variant==='pyramid'){w=260+((full-260)*.72*(i+1)/n);x=mid-w/2;}else if(variant==='funnel'){w=byValue?Math.max(120,full*vals[i]/max):full-i*(full*.66/Math.max(1,n-1));x=mid-w/2;}
  const col=DECK_COLORS[i%DECK_COLORS.length];g+=`<rect data-node="${deckSafe(nd.id)}"${byValue?` data-mark="stage" data-v="${vals[i]}"`:''} x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${variant==='pyramid'?0:12}" fill="${col}"/>`;
  g+=deckBoxText(x,y,w,h,byValue?`${nd.label} · ${deckFmt(vals[i])}`:nd.label,{color:ink(col),size:22,lines:h>70?2:1,what:'Layer label'});
  if(nd.desc&&variant!=='pyramid'&&variant!=='funnel'&&w>600)g+=deckLabel(x+w-20,y+h/2,nd.desc,{w:300,size:14,anchor:'end',valign:'middle',color:ink(col),font:'body',what:'Layer description'});});
 return g+'</svg>';
}
// x/y plot on a 2×2 (or 5×5 risk) grid; quadrant names come from options.quadrants [TL,TR,BL,BR].
function deckQuadrantPlot(c,variant,nodes,o){
 const risk=variant==='risk-matrix',x0=130,x1=DECK_VB.w-40,y0=24,y1=410,xs=nodes.map(n=>deckToNumber(n.x)),ys=nodes.map(n=>deckToNumber(n.y));
 const pad=(lo,hi)=>{const p=(hi-lo)*.12||1;return [lo-p,hi+p];},[pxl,pxh]=pad(Math.min(0,...xs),Math.max(1,...xs)),[pyl,pyh]=pad(Math.min(0,...ys),Math.max(1,...ys));
 const dom=risk?{xl:.5,xh:5.5,yl:.5,yh:5.5}:{xl:pxl,xh:pxh,yl:pyl,yh:pyh}; // padded so edge labels stay inside
 const X=v=>x0+(v-dom.xl)/(dom.xh-dom.xl)*(x1-x0),Y=v=>y1-(v-dom.yl)/(dom.yh-dom.yl)*(y1-y0);let g=deckSvgOpen(variant,c.title);
 if(risk){for(let i=1;i<=5;i++)for(let j=1;j<=5;j++){const s=i*j;g+=deckRect(r1(X(i-.5)+2),r1(Y(j+.5)+2),r1((x1-x0)/5-4),r1((y1-y0)/5-4),s>=15?'#FBD3C4':s>=8?'#FDEBD3':'#E5F4EF','none',6);}
  for(let i=1;i<=5;i++)g+=deckText(r1(X(i)),y1+22,String(i),14,DECK_MUTED,'middle',700)+deckText(x0-12,r1(Y(i)+5),String(i),14,DECK_MUTED,'end',700);}
 else{const mx=(x0+x1)/2,my=(y0+y1)/2;[[x0,y0],[mx,y0],[x0,my],[mx,my]].forEach(([x,y],k)=>{g+=deckRect(x+2,y+2,(x1-x0)/2-4,(y1-y0)/2-4,['#FFF5ED','#F2F7F5','#F6F8F7','#FFF9F3'][k],'none',8);if(o.names?.[k])g+=deckLabel(x+14,y+26,o.names[k],{w:(x1-x0)/2-28,size:16,anchor:'start',color:DECK_MUTED,what:'Quadrant name'});});}
 g+=deckText((x0+x1)/2,y1+50,o.xLabel||'x',16,DECK_INK,'middle',800)+`<text transform="translate(40 ${(y0+y1)/2}) rotate(-90)" text-anchor="middle" font-size="16" font-weight="800" fill="${DECK_INK}" font-family="Manrope,Arial,sans-serif">${deckSafe(o.yLabel||'y')}</text>`;
 nodes.forEach((nd,i)=>{const x=X(xs[i]),y=Y(ys[i]);if(!Number.isFinite(x)||!Number.isFinite(y))return;g+=`<circle data-mark="point" data-node="${deckSafe(nd.id)}" data-v="${ys[i]}" data-x="${xs[i]}" cx="${r1(x)}" cy="${r1(y)}" r="12" fill="${DECK_COLORS[i%DECK_COLORS.length]}" stroke="#FFFFFF" stroke-width="3"/>`+deckLabel(x,y-20,nd.label,{w:170,size:14,what:'Point label'});});
 return g+'</svg>';
}
const DECK_FRAMEWORKS={
 swot:['Strengths','Weaknesses','Opportunities','Threats'],
 pestel:['Political','Economic','Social','Technological','Environmental','Legal'],
 'balanced-scorecard':['Financial','Customer','Internal process','Learning & growth'],
 ansoff:['Market penetration','Product development','Market development','Diversification']
};
const DECK_QUADRANT_DEFAULTS={bcg:{x:'Relative market share →',y:'Market growth →',names:['Question marks','Stars','Dogs','Cash cows']},priority:{x:'Effort →',y:'Impact →',names:['Quick wins','Major projects','Fill-ins','Thankless tasks']},'risk-matrix':{x:'Likelihood (1–5)',y:'Impact (1–5)'}};
function deckMatrix(c,variant){
 const G=deckGraph(c,variant,{max:24}),nodes=G.nodes;if(!nodes.length&&variant!=='raci')return deckEmpty(variant,'Add nodes (cells or items)');
 const xy=nodes.length&&nodes.every(n=>Number.isFinite(deckToNumber(n.x))&&Number.isFinite(deckToNumber(n.y)));
 if(['bcg','priority','quadrant','portfolio','risk-matrix'].includes(variant)&&xy){const d=DECK_QUADRANT_DEFAULTS[variant]||{};return deckQuadrantPlot(c,variant,nodes,{xLabel:c.options?.xLabel||d.x,yLabel:c.options?.yLabel||d.y,names:c.options?.quadrants||d.names});}
 if(variant==='risk-matrix'&&nodes.some(n=>n.x!=null||n.y!=null))XBDiag.report('data.non-numeric','warning','risk-matrix: every node needs numeric x (likelihood) and y (impact) to be plotted');
 if(variant==='raci')return deckRaci(c,variant,nodes);
 const frame=DECK_FRAMEWORKS[variant],cats=frame||(c.options?.quadrants&&['quadrant','portfolio','bcg','priority','risk-matrix'].includes(variant)?c.options.quadrants:null);
 const grouped=cats&&nodes.some(n=>n.group!=null);
 const cols=['pestel'].includes(variant)?3:['swot','bcg','ansoff','quadrant','risk-matrix','priority','portfolio','balanced-scorecard'].includes(variant)?2:Math.min(4,Math.max(2,Math.ceil(Math.sqrt(nodes.length))));
 const cells=grouped?cats.map((name,k)=>({title:name,items:nodes.filter(n=>{const gname=String(n.group).toLowerCase();return gname===name.toLowerCase()||gname===name[0].toLowerCase()||gname===String(k);})})):(cats||nodes.map(n=>n.label)).map((name,k)=>({title:cats?name:'',body:cats?nodes[k]:nodes[k],items:[]}));
 if(grouped){const lost=nodes.filter(n=>!cells.some(cl=>cl.items.includes(n)));if(lost.length)XBDiag.report('data.unmapped','warning',`${variant}: ${lost.length} node(s) have a group that matches no category (${cats.join(', ')})`,{rows:lost.map(n=>n.label)});}
 else if(cats&&nodes.length>cats.length)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: ${nodes.length-cats.length} node(s) beyond the ${cats.length} categories are not drawn; use node.group to list several items per category`);
 const rows=Math.ceil(cells.length/cols),cw=(DECK_VB.w-80)/cols,ch=440/rows;let g=deckSvgOpen(variant,c.title);
 cells.forEach((cl,k)=>{const x=40+(k%cols)*cw,y=20+Math.floor(k/cols)*ch,col=DECK_COLORS[k%DECK_COLORS.length];
  g+=deckRect(r1(x),r1(y),r1(cw-12),r1(ch-12),k%2?'#E9F6F0':'#FFF2E8','#DBE6E0',12,2)+deckRect(r1(x),r1(y),r1(cw-12),8,col,'none',3);
  if(grouped){g+=deckLabel(x+20,y+40,cl.title,{w:cw-50,size:21,anchor:'start',what:'Category title'});
   const lim=Math.max(1,Math.floor((ch-70)/30));cl.items.slice(0,lim).forEach((it,j)=>g+=`<circle cx="${r1(x+26)}" cy="${r1(y+68+j*30)}" r="4" fill="${col}"/>`+deckLabel(x+38,y+73+j*30,it.label,{w:cw-70,size:16,anchor:'start',what:'Item label'}));
   if(cl.items.length>lim){g+=deckText(r1(x+38),r1(y+73+lim*30),`+${cl.items.length-lim} more`,14,DECK_MUTED,'start',700);XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`${variant}: "${cl.title}" shows ${lim} of ${cl.items.length} items`);}}
  else{const body=cl.body,same=body&&cl.title&&body.label.toLowerCase()===cl.title.toLowerCase();
   if(cl.title)g+=deckLabel(x+20,y+40,cl.title,{w:cw-50,size:body&&!same?18:24,anchor:'start',color:body&&!same?DECK_MUTED:DECK_INK,what:'Category title'});
   if(body&&!same)g+=deckBoxText(x,y+(cl.title?24:0),cw-12,ch-12-(cl.title?24:0),body.label,{size:cols===2?24:19,lines:3});}});
 return g+'</svg>';
}
function deckRaci(c,variant,nodes){
 const roles=Array.isArray(c.options?.roles)?c.options.roles.map(String):[...new Set(nodes.flatMap(n=>n.raci&&typeof n.raci==='object'?Object.keys(n.raci):[]))];
 if(!roles.length||!nodes.length){XBDiag.report('data.field-missing','error','raci: give options.roles and, per task node, raci:{Role:"R|A|C|I"}',{field:'raci'});return deckEmpty(variant,'RACI needs tasks (nodes) and roles with R/A/C/I assignments');}
 const x0=250,cw=Math.min(220,(DECK_VB.w-40-x0)/roles.length),rh=Math.min(64,(430-70)/nodes.length);let g=deckSvgOpen(variant,c.title);
 roles.forEach((r,j)=>g+=deckLabel(x0+cw*(j+.5),50,r,{w:cw-8,size:15,lines:2,valign:'bottom',what:'Role label'}));
 nodes.forEach((n,i)=>{const y=70+i*rh;g+=deckLabel(x0-14,y+rh/2,n.label,{w:x0-30,size:16,lines:2,anchor:'end',valign:'middle',what:'Task label'});
  const accountable=roles.filter(r=>String(n.raci?.[r]??'').toUpperCase().includes('A')).length;if(accountable!==1)XBDiag.report('data.inconsistent','warning',`raci: task "${n.label}" has ${accountable} Accountable role(s); expected exactly 1`);
  roles.forEach((r,j)=>{const v=String(n.raci?.[r]??'').toUpperCase();if(v&&!/^[RACI]+$/.test(v))XBDiag.report('data.non-numeric','warning',`raci: "${v}" for ${n.label}/${r} is not R, A, C or I`);
   g+=deckRect(r1(x0+cw*j+3),r1(y+3),r1(cw-6),r1(rh-6),(i+j)%2?'#EFF6F1':'#FFF5EC','#E3EBE4',7,1)+(v?deckText(r1(x0+cw*(j+.5)),r1(y+rh/2+8),v,22,v.includes('A')?DECK_COLORS[0]:v.includes('R')?DECK_POS:DECK_INK,'middle',800):'');});});
 return g+'</svg>';
}
function deckNetwork(c,variant){
 const G=deckGraph(c,variant,{max:16});if(!G.nodes.length)return deckEmpty(variant,'Add nodes and edges');
 if(!G.edges.length)XBDiag.report('graph.edges-missing','warning','network: no edges given; nodes are drawn unconnected');
 const n=G.nodes.length,pos=new Map(G.nodes.map((nd,i)=>{const a=2*Math.PI*i/n-Math.PI/2;return [nd,{x:500+(n>1?340:0)*Math.cos(a),y:240+(n>1?170:0)*Math.sin(a)}];}));
 const vmax=Math.max(1,...G.edges.map(e=>deckToNumber(e.value)).filter(Number.isFinite));let g=deckSvgOpen(variant,c.title);
 G.edges.forEach(e=>{const p=pos.get(e.a),q=pos.get(e.b),v=deckToNumber(e.value),w=Number.isFinite(v)?2+6*v/vmax:3,a=Math.atan2(q.y-p.y,q.x-p.x);
  g+=c.options?.directed?deckArrow(p.x+46*Math.cos(a),p.y+46*Math.sin(a),q.x-50*Math.cos(a),q.y-50*Math.sin(a),'#AFC1BA',w,{id:`${e.a.id}->${e.b.id}`}):`<line data-edge="${deckSafe(e.a.id+'->'+e.b.id)}" x1="${r1(p.x)}" y1="${r1(p.y)}" x2="${r1(q.x)}" y2="${r1(q.y)}" stroke="#C3D2CB" stroke-width="${r1(w)}"/>`;
  if(e.label)g+=deckLabel((p.x+q.x)/2,(p.y+q.y)/2-6,e.label,{w:120,size:12,color:DECK_MUTED,what:'Edge label'});});
 G.nodes.forEach((nd,i)=>{const p=pos.get(nd);g+=`<circle data-node="${deckSafe(nd.id)}" cx="${r1(p.x)}" cy="${r1(p.y)}" r="46" fill="${DECK_COLORS[i%DECK_COLORS.length]}"/>`+deckLabel(p.x,p.y,nd.label,{w:84,size:14,lines:3,color:'#FFFFFF',valign:'middle',what:'Node label'});});
 return g+'</svg>';
}
function deckVenn(c,variant){
 const G=deckGraph(c,variant,{max:3}),sets=G.nodes;if(sets.length<2)return deckEmpty(variant,'Venn needs 2 or 3 sets (nodes)');
 const C=sets.length===2?[[400,240],[600,240]]:[[410,190],[590,190],[500,330]],cols=[DECK_COLORS[0],DECK_COLORS[1],DECK_COLORS[2]];let g=deckSvgOpen(variant,c.title);
 sets.forEach((s,i)=>{g+=`<circle data-node="${deckSafe(s.id)}" cx="${C[i][0]}" cy="${C[i][1]}" r="150" fill="${cols[i]}" fill-opacity=".3" stroke="${cols[i]}" stroke-width="4"/>`;const lx=C[i][0]+(sets.length===2?(i?80:-80):i===0?-70:i===1?70:0),ly=C[i][1]+(sets.length===3&&i===2?80:-30);g+=deckLabel(lx,ly,s.label,{w:150,size:18,lines:2,valign:'middle',what:'Set label'});if(s.desc)g+=deckLabel(lx,ly+40,s.desc,{w:140,size:13,lines:2,valign:'top',color:DECK_MUTED,font:'body',what:'Set description'});});
 if(c.center)g+=deckLabel(500,sets.length===2?240:250,c.center,{w:110,size:16,lines:3,valign:'middle',weight:800,what:'Intersection label'});
 return g+'</svg>';
}
function deckFishbone(c,variant){
 const G=deckGraph(c,variant,{max:30});const childOf=new Map();G.edges.forEach(e=>childOf.set(e.a,[...(childOf.get(e.a)||[]),e.b]));
 const cats=G.nodes.filter(n=>!G.edges.some(e=>e.b===n)).slice(0,8);if(!cats.length)return deckEmpty(variant,'Add cause categories as nodes');
 const causes=n=>[...(childOf.get(n)||[]).map(k=>k.label),...(Array.isArray(n.items)?n.items:Array.isArray(n.causes)?n.causes:[]).map(String)];
 let g=deckSvgOpen(variant,c.title)+deckLine(40,240,820,240,DECK_INK,6)+deckRect(826,190,150,100,DECK_COLORS[0],'none',14)+deckLabel(901,240,c.center||c.title||'Effect',{w:130,size:17,lines:3,color:'#FFFFFF',valign:'middle',what:'Effect label'});
 const half=Math.ceil(cats.length/2),step=740/Math.max(1,half);
 cats.forEach((cat,i)=>{const top=i%2===0,k=Math.floor(i/2),x=120+k*step,yEnd=top?60:420,col=DECK_COLORS[i%DECK_COLORS.length];
  g+=deckLine(r1(x),yEnd,r1(x+90),240,col,4)+deckLabel(x,top?yEnd-12:yEnd+26,cat.label,{w:step-10,size:17,what:'Category label'});
  const list=causes(cat);list.slice(0,3).forEach((t,j)=>{const yy=top?100+j*42:380-j*42,xx=x+90*((yy-yEnd)/(240-yEnd));g+=deckLine(r1(xx-70),yy,r1(xx),yy,'#C3D2CB',2)+deckLabel(xx-74,yy-4,t,{w:step-30,size:13,anchor:'end',color:DECK_MUTED,what:'Cause label'});});
  if(list.length>3)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`fishbone: "${cat.label}" shows 3 of ${list.length} causes`);});
 return g+'</svg>';
}
function deckSequence(c,variant){
 const G=deckGraph(c,variant,{max:6});if(!G.nodes.length)return deckEmpty(variant,'Add participants as nodes and messages as edges');
 if(!G.edges.length)XBDiag.report('graph.edges-missing','warning','sequence: add edges {from,to,label} as messages; only lifelines are drawn');
 const n=G.nodes.length,step=(DECK_VB.w-100)/n,X=nd=>50+step*(G.nodes.indexOf(nd)+.5),msgs=G.edges.slice(0,10),dy=Math.min(36,330/Math.max(1,msgs.length));let g=deckSvgOpen(variant,c.title);
 G.nodes.forEach((nd,i)=>g+=deckLine(r1(X(nd)),86,r1(X(nd)),460,'#C7D7CE',2,'7 7')+deckNodeBox(X(nd)-Math.min(170,step-14)/2,20,Math.min(170,step-14),62,nd,i,{size:16,lines:2}));
 msgs.forEach((e,i)=>{const y=118+i*dy,x1=X(e.a),x2=X(e.b);const col=DECK_COLORS[i%DECK_COLORS.length];
  g+=x1===x2?`<path d="M${r1(x1)} ${r1(y)}h40v${r1(dy*.6)}h-30" fill="none" stroke="${col}" stroke-width="3"/>`:deckArrow(x1,y,x2,y,col,3,{id:`${e.a.id}->${e.b.id}`,dash:e.kind==='return'||e.kind==='async'?'8 6':''});
  if(e.label)g+=deckLabel((x1+x2)/2+(x1===x2?60:0),y-7,`${i+1}. ${e.label}`,{w:Math.max(120,Math.abs(x2-x1)-16),size:13,what:'Message label'});});
 if(G.edges.length>10)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`sequence: showing 10 of ${G.edges.length} messages`);
 return g+'</svg>';
}
// Sankey: node columns from longest path, link widths ∝ edge.value, node height ∝ max(in, out).
function deckSankey(c,variant){
 const G=deckGraph(c,variant,{max:16});const links=G.edges.filter(e=>{const v=deckToNumber(e.value);if(!(v>0)){XBDiag.report('data.field-missing','error',`sankey: edge ${e.a.label} → ${e.b.label} needs a positive numeric value`,{at:['edges',e.i??0],field:'value'});return false;}return true;});
 if(!links.length)return deckEmpty(variant,'Sankey needs edges {from,to,value}');
 const used=G.nodes.filter(n=>links.some(e=>e.a===n||e.b===n)),L=deckLayerGraph(used,links,{weight:e=>deckToNumber(e.value)}),ncol=L.layers.length;
 const val=n=>n.kind==='dummy'?n.flow:Math.max(links.filter(e=>e.b===n).reduce((s,e)=>s+deckToNumber(e.value),0),links.filter(e=>e.a===n).reduce((s,e)=>s+deckToNumber(e.value),0));
 const gap=16,feedbackValue=[...L.feedback].reduce((sum,e)=>sum+deckToNumber(e.value),0),minSlot=n=>n.kind==='dummy'?0:36;
 const reserve=scale=>L.feedback.size?feedbackValue*scale+gap*(L.feedback.size+1):0;
 // Solve one common flow scale, reserving label room even for tiny real nodes.
 let lo=0,hi=420/Math.max(1,...used.map(val));
 for(let k=0;k<48;k++){const mid=(lo+hi)/2,fit=L.layers.every(list=>list.reduce((s,n)=>s+Math.max(minSlot(n),val(n)*mid),0)+gap*(list.length-1)<=420-reserve(mid));if(fit)lo=mid;else hi=mid;}
 if(lo<=1e-9)XBDiag.report('layout.overflow','error','sankey: too many labels/flows for 480px; split the graph or reduce maxNodes');
 const scale=lo,H=420-reserve(scale),nw=22,X=k=>ncol===1?DECK_VB.w/2-11:60+k*((DECK_VB.w-140)/(ncol-1)),pos=new Map();
 L.layers.forEach((list,k)=>{const total=list.reduce((s,n)=>s+Math.max(minSlot(n),val(n)*scale),0)+gap*(list.length-1);let y=30+(H-total)/2;
  list.forEach(n=>{const h=val(n)*scale,slot=Math.max(minSlot(n),h),top=y+(slot-h)/2;pos.set(n,{x:X(k),y:top,h,outY:top,inY:top});y+=slot+gap;});});
 let g=deckSvgOpen(variant,c.title),bands='',feedbackY=30+H+gap;
 links.forEach((e,i)=>{const p=pos.get(e.a),q=pos.get(e.b),w=deckToNumber(e.value)*scale,sy=p.outY+w/2,ty=q.inY+w/2;p.outY+=w;q.inY+=w;let d;
  if(L.feedback.has(e)){
   const rail=feedbackY+w/2;feedbackY+=w+gap;
   // Vertical legs lie in column gutters; the return arc stays below every real node.
   const sx=p.x+nw+Math.max(12,w/2+6),tx=q.x-Math.max(12,w/2+6);
   d=`M${r1(p.x+nw)} ${r1(sy)}H${r1(sx)}V${r1(rail)}H${r1(tx)}V${r1(ty)}H${r1(q.x)}`;
  }else{
   const chain=L.routes.get(e),points=[{x:p.x+nw,y:sy}];
   for(const n of chain.slice(1,-1)){const r=pos.get(n);points.push({x:r.x,y:r.y+r.h/2},{x:r.x+nw,y:r.y+r.h/2});}
   points.push({x:q.x,y:ty});d=deckGraphPath(points);
  }
  const width=+w.toFixed(4);
  bands+=`<path data-mark="flow" data-v="${deckToNumber(e.value)}" data-w="${width}" data-edge="${deckSafe(e.a.id+'->'+e.b.id)}"${L.feedback.has(e)?' data-feedback="true"':''} d="${d}" fill="none" stroke="${DECK_COLORS[G.nodes.indexOf(e.a)%DECK_COLORS.length]}" stroke-opacity=".35" stroke-width="${width}"/>`;
 });
 g+=bands;
 const labels=used.map(n=>{const p=pos.get(n),last=L.rank.get(n)===ncol-1;return {x:last?p.x-8:p.x+nw+8,y:p.y+p.h/2,text:`${n.label} · ${deckFmt(val(n))}`,anchor:last?'end':'start',w:Math.min(150,ncol>1?(DECK_VB.w-140)/(ncol-1)-nw-20:150),size:14,lines:2};});
 const placed=deckRepelLabels(labels,{left:20,top:10,right:DECK_VB.w-20,bottom:H+28});
 used.forEach((n,i)=>{const p=pos.get(n),label=placed[i];g+=`<rect data-node="${deckSafe(n.id)}" data-v="${val(n)}" x="${r1(p.x)}" y="${r1(p.y)}" width="${nw}" height="${r1(p.h)}" fill="${DECK_COLORS[G.nodes.indexOf(n)%DECK_COLORS.length]}"/>`+deckLabel(label.x,label.y,label.text,{...label,valign:'middle',what:'Node label'});});
 const unused=G.nodes.filter(n=>!used.includes(n));if(unused.length)XBDiag.report('graph.isolated','warning',`sankey: ${unused.length} node(s) have no flows and are not drawn`,{rows:unused.map(n=>n.label)});
 return g+'</svg>';
}
function deckBowtie(c,variant){
 const G=deckGraph(c,variant,{max:10}),side=n=>String(n.group??n.side??'').toLowerCase();
 let left=G.nodes.filter(n=>['cause','threat','left','causes','threats'].includes(side(n))),right=G.nodes.filter(n=>['consequence','impact','right','consequences','impacts'].includes(side(n)));
 if(!left.length&&!right.length){const h=Math.ceil(G.nodes.length/2);left=G.nodes.slice(0,h);right=G.nodes.slice(h);if(G.nodes.length)XBDiag.report('graph.implicit-hierarchy','info','bowtie: set node.group to "cause" or "consequence"; the list was split in half');}
 let g=deckSvgOpen(variant,c.title)+`<polygon points="60,60 470,240 60,420" fill="#FFF1E5" stroke="${DECK_COLORS[0]}" stroke-width="4"/><polygon points="940,60 530,240 940,420" fill="#E5F4EF" stroke="${DECK_COLORS[1]}" stroke-width="4"/>`+deckRect(400,195,200,90,DECK_INK,'none',14)+deckLabel(500,240,c.center||'Event',{w:180,size:18,lines:3,color:'#FFFFFF',valign:'middle',what:'Event label'});
 const list=(arr,x,anchor)=>arr.slice(0,5).forEach((n,i)=>g+=deckLabel(x,120+i*(260/Math.max(1,Math.min(5,arr.length)-1||1)),n.label,{w:260,size:16,lines:2,anchor,valign:'middle',what:'Bowtie item'}));
 list(left,80,'start');list(right,920,'end');if(left.length>5||right.length>5)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning','bowtie: showing 5 items per side');
 return g+'</svg>';
}
function deckVTimeline(c,variant){
 const G=deckGraph(c,variant,{max:6}),n=G.nodes.length;if(!n)return deckEmpty(variant,'Add milestones as nodes');
 const rowH=440/n,cw=DECK_VB.w-280;let g=deckSvgOpen(variant,c.title)+deckLine(200,24,200,24+rowH*n-14,'#D0DDD7',6);
 G.nodes.forEach((it,i)=>{const y=24+i*rowH+rowH/2-6,col=DECK_COLORS[i%DECK_COLORS.length];
  g+=deckRect(240,r1(y-rowH/2+8),cw,r1(rowH-14),i%2?'#F5FAF7':'#FFF7EF','#DFE8E3',12,2)+`<circle data-node="${deckSafe(it.id)}" cx="200" cy="${r1(y)}" r="15" fill="${col}" stroke="#FFFFFF" stroke-width="5"/>`;
  g+=deckLabel(170,y+6,String(it.date??it.when??String(i+1).padStart(2,'0')),{w:150,size:17,anchor:'end',color:col,weight:800,what:'Date label'});
  g+=deckLabel(262,y+(it.desc?-4:7),it.label,{w:cw-40,size:20,anchor:'start',weight:800,what:'Milestone label'});
  if(it.desc)g+=deckLabel(262,y+22,it.desc,{w:cw-40,size:15,anchor:'start',color:DECK_MUTED,font:'body',what:'Milestone description'});});
 return g+'</svg>';
}
function deckProsCons(c,variant){
 const G=deckGraph(c,variant,{max:12}),grouped=G.nodes.some(n=>n.group),half=Math.ceil(G.nodes.length/2);
 if(!grouped&&G.nodes.length)XBDiag.report('graph.implicit-hierarchy','info','pros-cons: mark cons with group:"con"; the list was split in half');
 const pros=grouped?G.nodes.filter(n=>n.group!=='con'):G.nodes.slice(0,half),cons=grouped?G.nodes.filter(n=>n.group==='con'):G.nodes.slice(half),heads=c.options?.labels||['PROS','CONS'];
 let g=deckSvgOpen(variant,c.title);
 [[pros,heads[0],DECK_POS,'#EAF7F2','+'],[cons,heads[1],DECK_NEG,'#FFF1EA','−']].forEach(([list,head,col,bg,sym],k)=>{const x=40+k*470;
  g+=deckRect(x,20,450,440,bg,'none',18)+deckRect(x,20,450,64,col,'none',18)+deckRect(x,60,450,24,col,'none',0)+deckLabel(x+225,54,head,{w:420,size:22,color:'#FFFFFF',valign:'middle',weight:800,what:'Column title'});
  list.slice(0,5).forEach((it,i)=>{const y=106+i*70;g+=`<circle data-node="${deckSafe(it.id)}" cx="${x+38}" cy="${y+18}" r="17" fill="${col}"/>`+deckText(x+38,y+26,sym,24,'#FFFFFF','middle',800)+deckLabel(x+68,y+(it.desc?16:25),it.label,{w:360,size:19,anchor:'start',weight:800,what:'Item label'});if(it.desc)g+=deckLabel(x+68,y+40,it.desc,{w:360,size:15,anchor:'start',color:DECK_MUTED,font:'body',what:'Item description'});});
  if(list.length>5)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`pros-cons: "${head}" shows 5 of ${list.length} items`);});
 return g+'</svg>';
}
function deckIceberg(c,variant){
 const G=deckGraph(c,variant,{max:8}),vis=deckClamp(deckNum(c.options?.visible,1),1,3),top=G.nodes.slice(0,vis),deep=G.nodes.slice(vis),cap=c.options?.labels||['VISIBLE','BELOW THE SURFACE'];
 if(!G.nodes.length)return deckEmpty(variant,'Add nodes: visible symptoms first, then underlying causes');
 let g=deckSvgOpen(variant,c.title)+deckRect(0,170,1000,310,'#E6F3F8','none',0)+deckLine(0,170,1000,170,'#007BC1',3,'10 8');
 g+=`<polygon points="500,40 600,170 400,170" fill="#FFFFFF" stroke="#007BC1" stroke-width="4"/><polygon points="400,170 600,170 760,300 690,450 310,450 240,300" fill="#BFE0EE" stroke="#007BC1" stroke-width="4"/>`;
 g+=deckText(40,150,cap[0],16,'#007BC1','start',800)+deckText(40,205,cap[1],16,'#007BC1','start',800);
 top.forEach((it,i)=>{const y=82+i*36;g+=deckLine(560,r1(y+30-i*20),640,r1(y-6),'#007BC1',2)+deckLabel(650,y,it.label,{w:330,size:20,anchor:'start',weight:800,what:'Visible item'});});
 deep.slice(0,5).forEach((it,i)=>g+=deckLabel(500,222+i*48,it.label,{w:380-Math.abs(2-i)*20,size:19,what:'Hidden item'}));
 if(deep.length>5)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`iceberg: showing 5 of ${deep.length} items below the surface`);
 return g+'</svg>';
}
// Registry: label, family, data contract and renderer. DECK_DESCRIPTORS.flow/structure derive from it.
const DIAGRAM_VARIANTS={
 flow:{
  'flowchart':['Process flow','nodes in order; optional edges {from,to,label}; kind:"decision" draws a diamond',deckFlow],
  'decision-tree':['Decision tree','nodes + edges parent→child (edge.label = answer) or node.parent',deckTree],
  'process-pipeline':['Delivery pipeline','ordered nodes; optional edges',deckFlow],
  'chevrons':['Chevron steps','ordered nodes',deckFlow],
  'zigzag':['Zigzag flow','ordered nodes',deckFlow],
  'value-chain':['Value chain','ordered nodes',deckFlow],
  'service-blueprint':['Service blueprint','nodes with lane (e.g. Customer/Frontstage/Backstage); optional start/end',deckGantt],
  'swimlane':['Swimlane','nodes with lane (or group); optional start/end for a time axis',deckGantt],
  'sequence':['Sequence / messages','nodes = participants; edges = messages in order {from,to,label,kind:"return"}',deckSequence],
  'state-machine':['State machine','nodes = states; edges = transitions (cycles allowed)',deckFlow],
  'critical-path':['Critical path','nodes + edges; critical:true on the path',deckFlow],
  'dependency':['Dependency map','nodes + edges {from,to}',deckFlow],
  'kanban':['Kanban board','nodes with status; options.columns orders the columns',deckKanban],
  'bpmn':['BPMN-inspired flow','ordered nodes; edges; kind:"gateway" for decisions',deckFlow],
  'release-train':['Release train','ordered nodes',deckFlow],
  'customer-journey':['Customer journey','ordered nodes with desc',deckFlow],
  'learner-journey':['Learner journey','ordered nodes with desc',deckFlow],
  'roadmap':['Roadmap','nodes with date (ISO) or at (number) for proportional spacing',deckTimeline],
  'milestones':['Milestones','nodes with date (ISO) or at (number)',deckTimeline],
  'timeline':['Timeline','nodes with date (ISO) or at (number)',deckTimeline],
  'gantt':['Gantt plan','nodes with start + end (number or ISO date); options.today',deckGantt],
  'lifecycle':['Lifecycle','ordered nodes around a loop; optional center',deckRadial],
  'cycle':['Cycle loop','ordered nodes around a loop; optional center',deckRadial],
  'fishbone':['Cause & effect','category nodes; causes via edges, node.parent or node.items; center = effect',deckFishbone],
  'bowtie':['Bowtie risk','nodes with group "cause" | "consequence"; center = event',deckBowtie],
  'vertical-timeline':['Vertical timeline','ordered nodes with date and desc',deckVTimeline]
 },
 structure:{
  'org-chart':['Organization chart','nodes + edges manager→report (or node.parent)',deckTree],
  'tree':['Hierarchy tree','nodes + edges parent→child (or node.parent)',deckTree],
  'mindmap':['Mind map','center + branch nodes; edges branch→leaf for second level',deckRadial],
  'hub-spoke':['Hub & spoke','center + spoke nodes',deckRadial],
  'ecosystem':['Ecosystem map','center + partner nodes',deckRadial],
  'stakeholder':['Stakeholder map','nodes; with x (interest) and y (influence) draws a 2×2 grid',deckRadial],
  'network':['Network topology','nodes + edges (value → width); options.directed',deckNetwork],
  'architecture':['System architecture','layers top→bottom as nodes',deckLayers],
  'c4':['C4 container map','layers as nodes',deckLayers],
  'layered':['Layered architecture','layers top→bottom as nodes (desc shown at right)',deckLayers],
  'cloud':['Cloud reference','layers as nodes',deckLayers],
  'pyramid':['Strategy pyramid','levels top→bottom as nodes',deckLayers],
  'funnel':['Conversion funnel','stages as nodes; value → width',deckLayers],
  'venn':['Venn diagram','2–3 set nodes; center = intersection',deckVenn],
  'concentric':['Concentric circles','layers outer→inner as nodes',deckRadial],
  'nested-circle':['Nested circles','layers outer→inner as nodes',deckRadial],
  'sankey':['Allocation / Sankey','nodes + edges {from,to,value>0}',deckSankey],
  'swot':['SWOT','items with group S/W/O/T (or 4 nodes = 4 quadrants)',deckMatrix],
  'pestel':['PESTEL','items with group P/E/S/T/E/L name',deckMatrix],
  'bcg':['BCG 2×2','nodes with x (share) + y (growth), or 4 quadrant nodes',deckMatrix],
  'ansoff':['Ansoff matrix','items with group = strategy, or 4 nodes',deckMatrix],
  'risk-matrix':['Risk matrix','nodes with x (likelihood 1–5) + y (impact 1–5)',deckMatrix],
  'priority':['Priority matrix','nodes with x (effort) + y (impact), or 4 quadrant nodes',deckMatrix],
  'raci':['RACI','task nodes with raci:{Role:"R|A|C|I"}; options.roles',deckMatrix],
  'decision-matrix':['Decision matrix','cell nodes',deckMatrix],
  'capability-map':['Capability map','cell nodes',deckMatrix],
  'balanced-scorecard':['Scorecard','items with group = perspective (Financial, Customer, Internal process, Learning & growth)',deckMatrix],
  'comparison-matrix':['Comparison matrix','cell nodes',deckMatrix],
  'quadrant':['Four quadrants','nodes with x + y and options.quadrants, or 4 nodes',deckMatrix],
  'portfolio':['Portfolio matrix','nodes with x + y, or 4 nodes',deckMatrix],
  'okrs':['OKR strategy tree','objective → key result edges (or node.parent)',deckTree],
  'radial-tree':['Radial tree','center + branches; edges for second level',deckRadial],
  'pros-cons':['Pros & cons','nodes; group:"con" marks a con; options.labels',deckProsCons],
  'iceberg':['Iceberg model','nodes: visible first (options.visible), then hidden causes',deckIceberg]
 }
};
const DIAGRAM_VARIANT_LOOKUP=Object.fromEntries(Object.entries(DIAGRAM_VARIANTS).flatMap(([family,items])=>Object.entries(items).map(([id,[label,data,render]])=>[id,{family,label,data,render}])));
function deckDiagram(c,box){
 const variant=c.variant||'flowchart',entry=DIAGRAM_VARIANT_LOOKUP[variant];
 if(!entry){XBDiag.report('variant.unknown','error',`Unknown diagram variant "${variant}"`);return deckEmpty(variant,'Unknown diagram variant: '+variant);}
 return deckWithBox(variant,box,()=>entry.render(c,variant));
}
const DECK_DESCRIPTORS={
 chart:Object.fromEntries(Object.entries(CHART_VARIANTS).map(([id,v])=>[id,v.label])),
 flow:Object.fromEntries(Object.entries(DIAGRAM_VARIANTS.flow).map(([id,v])=>[id,v[0]])),
 structure:Object.fromEntries(Object.entries(DIAGRAM_VARIANTS.structure).map(([id,v])=>[id,v[0]])),
 mermaid: {
  'mermaid-flowchart':'Mermaid flowchart','mermaid-sequence':'Mermaid sequence','mermaid-erd':'Mermaid ERD','mermaid-state':'Mermaid state','mermaid-class':'Mermaid class','mermaid-gantt':'Mermaid Gantt','mermaid-journey':'Mermaid journey','mermaid-mindmap':'Mermaid mindmap','mermaid-pie':'Mermaid pie','mermaid-quadrant':'Mermaid quadrant','mermaid-timeline':'Mermaid timeline','mermaid-gitgraph':'Mermaid gitGraph'
 }
};
const DECK_VISUAL_REGISTRY=Object.entries(DECK_DESCRIPTORS).flatMap(([family,items])=>Object.entries(items).map(([id,label])=>({id,label,family})));
const DECK_VISUAL_LOOKUP=Object.fromEntries(DECK_VISUAL_REGISTRY.map(v=>[v.id,v]));
const DECK_DEFAULT_DATA=[{label:'Foundation',value:48},{label:'CloudOps',value:72},{label:'DevOps',value:63},{label:'GenAI',value:85},{label:'Security',value:57}];
const DECK_SAMPLE_NODES=[{id:'discover',label:'Discover',desc:'Understand the challenge'},{id:'design',label:'Design',desc:'Create the solution'},{id:'build',label:'Build',desc:'Hands-on implementation'},{id:'validate',label:'Validate',desc:'Measure outcomes'},{id:'iterate',label:'Improve',desc:'Apply feedback'}];
const DECK_SAMPLE_EDGES=[{from:'discover',to:'design'},{from:'design',to:'build'},{from:'build',to:'validate'},{from:'validate',to:'iterate'}];

const DECK_DATA_CACHE=new Map();
const DataResolver = createDataResolver({getConfig:()=>DECK_CONFIG, cache:DECK_DATA_CACHE, fetchData:(...args)=>fetch(...args), report:(...args)=>XBDiag.report(...args), getOptions:()=>XB_RENDER_OPTS});
const deckData=DataResolver.data, deckRows=DataResolver.rows;
async function deckReloadRemote(){
 const lines=await DataResolver.reloadRemote();
 if(!lines.length){alert('Không có dataset remote trong JSON.');return;}
 HeaderStatus.invalidateQA();renderCurrentSlide();alert(lines.join('\n')+'\nLưu ý: dữ liệu remote không tự nhúng vào HTML xuất.');
}
function deckRect(x,y,w,h,fill,stroke='none',r=14,sw=1){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;}
function deckText(x,y,txt,size=22,color='#425453',anchor='start',weight=650){return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-family="Manrope,Arial,sans-serif" font-weight="${weight}">${deckSafe(txt)}</text>`;}
function deckLine(x1,y1,x2,y2,color='#CBD9D2',width=3,dash=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;}
function deckMarkdown(src){const raw=deckSafe(src||'');const lines=raw.split(/\r?\n/);let out='',inList=false;for(let line of lines){if(/^\s*[-*]\s+/.test(line)){if(!inList){out+='<ul>';inList=true;}out+='<li>'+line.replace(/^\s*[-*]\s+/,'')+'</li>';continue;}if(inList){out+='</ul>';inList=false;}if(/^###?\s+/.test(line)){const level=line.startsWith('###')?'h3':'h2';out+=`<${level}>${line.replace(/^#+\s*/, '')}</${level}>`;}else if(line)out+='<p>'+line+'</p>';}
 if(inList)out+='</ul>';return out.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>');}
function deckStyle(obj={}){return Object.entries(obj||{}).filter(([k,v])=>v!=null).map(([k,v])=>{let css=k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());let value=typeof v==='number'&&/^(fontSize|width|height|margin|marginTop|padding|borderRadius|gap|minHeight|maxHeight|top|left)$/.test(k)?v+'px':String(v);return `${css}:${value}`;}).join(';');}
// Author markup, URLs and CSS are preserved; ordinary text and HTML attributes are encoded where rendered.
const xbTrustedHtml=src=>String(src??'');
const xbTrustedCss=src=>String(src??'');
const xbTrustedUrl=src=>String(src??'');
const xbSlideCss=(slide,index,css)=>String(css??'');
// Equal-width table columns are shared by CSS, the solver and pagination. Measurements are
// conservative estimates; browser QA still verifies real font and author-style differences.
function deckTablePlan(c,width,rows){
 const cols=c.columns||Object.keys(rows[0]||{}).slice(0,6),cellWidth=Math.max(8,width/Math.max(1,cols.length)-48)/(XB_RENDER_OPTS.textSafety||1);
 const lines=(text,size,weight)=>Math.max(1,XBText.wrap(String(text??''),cellWidth/1.08,size,Infinity,weight).lines.length);
 const header=Math.max(64,40+Math.max(1,...cols.map(k=>lines(typeof k==='object'?k.label:k,19,800)))*22.8);
 const heights=rows.map(row=>Math.max(67,41+Math.max(1,...cols.map(k=>lines(deckShowCell(row?.[typeof k==='object'?k.key:k]),21,600)))*25.2));
 return {cols,header,heights,need:2+header+heights.reduce((a,b)=>a+b,0)};
}
function deckTable(c){
 let rows=deckData(c);if(!Array.isArray(rows))rows=[];const cols=c.columns||Object.keys(rows[0]||{}).slice(0,6);
 const omitted=c.columns?[]:Object.keys(rows[0]||{}).slice(6);if(omitted.length)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning','table: inferred columns omit '+omitted.join(', ')+'; declare columns explicitly',{omitted});
 cols.forEach(k=>{const key=typeof k==='object'?k.key:k;if(rows.length&&!rows.some(r=>r&&typeof r==='object'&&key in r))XBDiag.report('data.field-missing','warning',`table: column "${key}" is not present in any row`,{field:key});});
 if(rows.length>12)XBDiag.report('data.truncated',XB_RENDER_OPTS.strict?'error':'warning',`table: showing 12 of ${rows.length} rows; filter, aggregate or split the table`,{rows:rows.length,max:12});
 return `<table class="v1-table"><thead><tr>${cols.map(k=>`<th>${deckSafe(typeof k==='object'?k.label:k)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,12).map(r=>`<tr>${cols.map(k=>`<td>${deckSafe(deckShowCell(r?.[typeof k==='object'?k.key:k]))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function deckShowCell(v){return typeof v==='number'?deckFmt(v):v==null?'':typeof v==='object'?JSON.stringify(v):String(v);}
const deckItems=(c,data)=>Array.isArray(c.items)?c.items:data.map(d=>({label:d.label,value:Number.isFinite(d.value)?d.value:d.raw?.value}));
const deckItemText=v=>typeof v==='string'?v:v?.label||v?.text||v?.title||'';
// Composer types share one render contract; aliases use the same renderer. `data` is resolved only
// for types that read rows (DECK_DATA_COMPONENTS) and only when the component gives no inline items/value.
function deckVisualBox(c,box,card=false){
 if(!box)return null;const width=Math.max(1,box.width-42),title=c.title||c.label||'';
 const heading=title?XBText.wrap(title,width,22,Infinity,800).lines.length*28.6+12:0;
 return {width,height:Math.max(1,box.height-(card?42:34)-heading)};
}
function deckChartFrame(c,box,card=false){
 const title=c.title||c.label||'',svg=deckChart(c,deckVisualBox(c,box,card));
 if(!title&&!card)return svg;
 return `<div class="${card?'v1-chart-card':'v1-visual-frame'}">${title?`<strong class="v1-visual-heading">${deckSafe(title)}</strong>`:''}${svg}</div>`;
}
const COMPONENT_RENDERERS = Object.fromEntries([
  [['title','heading'], ({c,title})=>`<h2 class="v1-heading">${deckSafe(c.text||title)}</h2>`],
  [['text','paragraph'], ({c})=>`<div class="v1-text">${deckSafe(c.text??c.content??'')}</div>`],
  [['markdown'], ({c})=>`<div class="v1-markdown">${deckMarkdown(c.markdown||c.content||c.text)}</div>`],
  [['html'], ({c})=>`<div class="v1-raw">${xbTrustedHtml(c.html??c.content??'','html component')}</div>`],
  [['svg'], ({c})=>`<div class="v1-svg-source">${xbTrustedHtml(c.svg??c.content??'','svg component')}</div>`],
  [['image'], ({c})=>`<img class="v1-image" alt="${deckSafe(c.alt||'Image')}" src="${deckSafe(xbTrustedUrl(c.src||DECK_CONFIG.assets?.[c.assetRef]||'','image src'))}"/>`],
  [['link'], ({c})=>`<a class="v1-link" href="${deckSafe(xbTrustedUrl(c.href||c.url||'#','link href'))}" target="_blank" rel="noopener noreferrer">${deckSafe(c.text||c.label||c.href||'Open link')} ↗</a>`],
  [['metric','kpi'], ({c,title,data})=>`<div class="v1-kpi"><span>${deckSafe(title)}</span><strong>${deckSafe(c.value!=null&&c.value!==''?c.value:deckShow(data[0]?.value))}</strong><small>${deckSafe(c.delta||c.subtitle||'')}</small></div>`],
  [['badge'], ({c,title})=>`<span class="v1-badge">${deckSafe(c.text||title)}</span>`],
  [['callout'], ({c,title})=>`<div class="v1-callout"><strong>${deckSafe(title)}</strong><p>${deckSafe(c.text||c.content||'')}</p></div>`],
  [['quote'], ({c})=>`<blockquote class="v1-quote">“${deckSafe(c.text||c.content||'')}”<small>${deckSafe(c.author||'')}</small></blockquote>`],
  [['rule','divider'], ()=>'<hr class="v1-rule">'],
  [['progress'], ({c,title})=>`<div class="v1-progress"><div class="v1-progress-head"><span>${deckSafe(title)}</span><b>${deckFmt(deckNum(c.value))}%</b></div><div class="v1-track"><div style="width:${deckClamp(deckNum(c.value),0,100)}%;background:${deckSafe(/^#[0-9a-f]{3,8}$/i.test(c.color||'')?c.color:'#F97C00')}"></div></div></div>`],
  [['list'], ({c,data})=>`<ul class="v1-list">${deckItems(c,data).map(v=>`<li>${deckSafe(deckItemText(v))}</li>`).join('')}</ul>`],
  [['table'], ({c})=>deckTable(c)],
  [['icon'], ({c})=>`<span class="v1-icon-symbol">${deckSafe(c.symbol||c.name||'◆')}</span>`],
  [['chips','tags'], ({c,data})=>`<div class="v1-chips">${deckItems(c,data).map((t,i)=>`<span style="border-color:${DECK_COLORS[i%DECK_COLORS.length]}">${deckSafe(deckItemText(t))}</span>`).join('')}</div>`],
  [['legend'], ({c,data})=>`<div class="v1-legend">${deckItems(c,data).map((x,i)=>`<span><i style="background:${deckSafe(/^#[0-9a-f]{3,8}$/i.test(x?.color||'')?x.color:DECK_COLORS[i%DECK_COLORS.length])}"></i>${deckSafe(deckItemText(x)||'Item')}</span>`).join('')}</div>`],
  [['source','footnote'], ({c,title})=>`<div class="v1-footnote">${deckSafe(c.text||c.content||title)}</div>`],
  [['numbered-steps'], ({c})=>{if(!Array.isArray(c.items))XBDiag.report('data.missing',XB_RENDER_OPTS.strict?'error':'warning','numbered-steps has no items');return `<div class="v1-steps">${(Array.isArray(c.items)?c.items:XB_RENDER_OPTS.strict?[]:DECK_SAMPLE_NODES.map(x=>x.label)).map((x,i)=>`<div><em>${String(i+1).padStart(2,'0')}</em><span>${deckSafe(deckItemText(x))}</span></div>`).join('')}</div>`;}],
  [['timeline'], ({c})=>{if(!Array.isArray(c.items))XBDiag.report('data.missing',XB_RENDER_OPTS.strict?'error':'warning','timeline has no items');return `<div class="v1-timeline">${(Array.isArray(c.items)?c.items:XB_RENDER_OPTS.strict?[]:DECK_SAMPLE_NODES).map((x,i)=>`<div class="v1-time-item"><span>${deckSafe(x?.date||x?.when||String(i+1).padStart(2,'0'))}</span><strong>${deckSafe(deckItemText(x))}</strong></div>`).join('')}</div>`;}],
  [['image-card'], ({c,title})=>`<div class="v1-imgcard"><img src="${deckSafe(xbTrustedUrl(c.src||DECK_CONFIG.assets?.[c.assetRef]||'','image-card src'))}" alt="${deckSafe(c.alt||'Slide photograph')}"/><strong>${deckSafe(title)}</strong><span>${deckSafe(c.text||'')}</span></div>`],
  [['link-card'], ({c,title})=>`<a class="v1-nested-card v1-link-card" target="_blank" rel="noopener noreferrer" href="${deckSafe(xbTrustedUrl(c.href||c.url||'#','link-card href'))}"><strong>${deckSafe(title)}</strong><span>${deckSafe(c.text||c.href||'')}</span><b>↗</b></a>`],
  [['avatar'], ({c,title})=>`<div class="v1-avatar"><span>${deckSafe((c.initials||title||'XB').slice(0,3))}</span><strong>${deckSafe(title)}</strong><small>${deckSafe(c.text||c.role||'')}</small></div>`],
  [['stat-grid'], ({c,data})=>`<div class="v1-stat-grid">${deckItems(c,data).map(x=>`<div><span>${deckSafe(x?.label)}</span><strong>${deckSafe(deckShow(x?.value))}</strong></div>`).join('')}</div>`],
  [['scorecard'], ({c,title,data})=>`<div class="v1-scorecard"><strong>${deckSafe(title||'Scorecard')}</strong>${deckItems(c,data).map(x=>`<div><span>${deckSafe(x?.label)}</span><b>${deckSafe(deckShow(x?.value))}</b></div>`).join('')}</div>`],
  [['rating'], ({c,title})=>`<div class="v1-rating"><strong>${deckSafe(title)}</strong><span>${'★'.repeat(deckClamp(Math.round(deckNum(c.value)),0,5))}${'☆'.repeat(5-deckClamp(Math.round(deckNum(c.value)),0,5))}</span></div>`],
  [['button'], ({c,title})=>`<a class="v1-action" href="${deckSafe(xbTrustedUrl(c.href||'#','button href'))}">${deckSafe(c.text||title||'View more')} ↗</a>`],
  [['video'], ({c})=>`<video controls poster="${deckSafe(xbTrustedUrl(c.poster||'','video poster'))}" src="${deckSafe(xbTrustedUrl(c.src||'','video src'))}" style="height:100%;width:100%;object-fit:contain"></video>`],
  [['iframe'], ({c,title})=>{if(XB_RENDER_OPTS.strict)XBDiag.report('determinism.external','info','iframe content is loaded at view time and is not part of the compiled output');return `<iframe title="${deckSafe(title||'Embedded content')}" src="${deckSafe(xbTrustedUrl(c.src||'','iframe src'))}" style="width:100%;height:100%;border:0" loading="lazy"></iframe>`;}],
  [['shape'], ({c})=>`<div style="width:100%;height:100%;background:${deckSafe(/^#[0-9a-f]{3,8}$/i.test(c.color||'')?c.color:'#F97C00')};border-radius:${deckSafe(typeof c.radius==='number'?c.radius+'px':/^[\d.]+(px|%|em|rem)?$/.test(String(c.radius||''))?c.radius:'18px')}"></div>`],
  [['spacer'], ()=>''],
  [['chart-card'], ({c,box})=>deckChartFrame(c,box,true)],
  [['code'], ({c})=>`<pre class="v1-code">${deckSafe(c.code||c.text||'')}</pre>`],
  [['chart'], ({c,box})=>deckChartFrame(c,box)],
  [['diagram'], ({c,box})=>CHART_VARIANTS[c.variant]?deckChart(c,box&&{width:box.width-42,height:box.height-34}):deckDiagram(c,box&&{width:box.width-42,height:box.height-34})],
  [['mermaid'], ({c})=>{
   const source=String(c.source||'');if(!source)XBDiag.report('data.missing','error','mermaid component has no source');
   // Offline/print fallback: Mermaid source is not parsed natively, so the fallback states that plainly instead of drawing an unrelated flow.
   if(XB_RENDER_OPTS.strict)XBDiag.report('render.enhanced-only','info','mermaid renders only with the optional CDN library; compiled/offline output shows the source text');
   return `<div class="v1-library v1-mermaid" data-source="${deckSafe(encodeURIComponent(source))}"><div class="v1-fallback"><pre class="v1-code" style="height:100%;margin:0;font-size:17px">${deckSafe(source)}</pre></div><div class="v1-enhanced"></div></div>`;}],
  [['echarts'], ({c})=>{
   const cfg=JSON.stringify(c.options||c.option||{});
   if(XB_RENDER_OPTS.strict&&!(c.dataRef||c.data||c.dataset))XBDiag.report('data.missing','warning','echarts: the offline fallback needs dataRef/data matching the option; without it the fallback shows "No data"');
   return `<div class="v1-library v1-echarts" data-option="${deckSafe(encodeURIComponent(cfg))}"><div class="v1-fallback">${(c.dataRef||c.data||c.dataset||!XB_RENDER_OPTS.strict)?deckChart({...c,variant:c.fallback||'bar'}):deckEmpty(c.fallback||'bar','Offline fallback needs dataRef')}</div><div class="v1-enhanced"></div></div>`;}],
  [['grid','columns','row','stack','card','group'], ({c,type,children,depth,childKey,box})=>{
   const plan=deckContainerPlan(c,box?.width||XB_SCENE.width,box?.height,depth);
   const cls=type==='card'?'v1-nested-card':'v1-nested-grid';
   return `<div class="${cls}" style="display:grid;width:100%;grid-template-columns:repeat(${plan.cols},minmax(0,1fr));grid-template-rows:${plan.rowHeights.map(h=>r1(h)+'px').join(' ')};gap:${plan.gap}px">${children.map((x,i)=>XBDiag.at([childKey,i],()=>deckComponent(x,depth+1,{...plan.boxes[i],nested:true}))).join('')}</div>`;}]
].flatMap(([names,render])=>names.map(name=>[name,render])));
const DECK_DATA_COMPONENTS=new Set(['metric','kpi','list','chips','tags','legend','stat-grid','scorecard']);
const DECK_VISUAL_TYPES=new Set(['diagram','chart','mermaid','echarts','chart-card']);
function deckComponent(c,depth=0,box=null){
 if(!c||depth>7){if(c)XBDiag.report('layout.depth','error','components nested deeper than 7 levels are not rendered');return'';}
 const type=c.type||'text',childKey=c.children?'children':'components',children=c.children||c.components||[],title=c.title||c.label||'';
 const inline=Array.isArray(c.items)||(c.value!=null&&c.value!==''),hasRef=!!(c.dataRef||c.data||c.dataset),isMetric=type==='metric'||type==='kpi';
 const needsData=DECK_DATA_COMPONENTS.has(type)&&!inline&&(hasRef||!isMetric);
 if(isMetric&&!inline&&!hasRef)XBDiag.report('data.missing',XB_RENDER_OPTS.strict?'error':'warning',`${type} "${title}" has no value`);
 const data=needsData?deckRows(deckData(c)):[];
 const renderer=COMPONENT_RENDERERS[type];
 if(!renderer)XBDiag.report('component.unknown','error',`Unknown component type "${type}"`);
 const content=renderer?renderer({c,type,children,title,data,depth,childKey,box}):`<div class="v1-callout">Unknown component: ${deckSafe(type)}</div>`;
 const style=deckStyle(c.style),pos=c.position||{},isAbs=pos.x!=null||pos.y!=null;let placement='';
 if(isAbs)placement=`position:absolute;left:${deckNum(pos.x)}px;top:${deckNum(pos.y)}px;width:${deckNum(pos.width,520)}px;height:${deckNum(pos.height,340)}px;`;
 else{const h=Math.max(1,box&&!box.absolute?box.height:deckNum(c.height??c.minHeight,180));placement=`grid-column:span ${box?.nested?1:deckClamp(Number(c.span)||(DECK_VISUAL_TYPES.has(type)&&type!=='chart-card'?12:6),1,12)};height:${r1(h)}px;max-height:${r1(h)}px;min-height:0;`;}
 return `<div class="v1-component v1-${deckSafe(type)}" data-component-id="${deckSafe(c.id||'')}" style="${placement}${deckSafe(xbTrustedCss(style,'component style'))}">${content}</div>`;
}
/* ---------------- Constraint layout for the 12-column composer scene (1728 × 642 px) ----------------
 Rows follow CSS grid auto-placement. Each item has a desired height (declared, grown to fit its text)
 and a minimum (type floor or text need). Rows shrink proportionally into the available height;
 if even the minimums do not fit, the overflow is reported (and can be repaired by splitting the slide). */
const XB_SCENE=Object.freeze({width:1728,height:642,cols:12,colGap:24,rowGap:22});
const DECK_MIN_HEIGHT={chart:230,'chart-card':250,diagram:250,mermaid:230,echarts:230,table:150,metric:140,kpi:140,progress:105,callout:105,quote:115,heading:62,title:62,text:52,paragraph:52,markdown:110,list:100,image:120,'image-card':170,'stat-grid':120,scorecard:120,'numbered-steps':120,timeline:110,video:160,iframe:160,html:80,svg:80};
const DECK_CONTAINERS=new Set(['stack','card','row','grid','columns','group']);
function deckCanGrow(c,depth=0){return !!c&&depth<=7&&c.height==null&&(DECK_VISUAL_TYPES.has(c.type)||(c.children||c.components||[]).some(k=>deckCanGrow(k,depth+1)));}
// Shared geometry for intrinsic measurement, rendering, fit QA and pagination.
function deckContainerPlan(c,width,height,depth=0){
 const kids=c.children||c.components||[],type=c.type,pad=type==='card'?54:0,gap=type==='card'?15:16;
 const cols=type==='row'?Math.max(1,kids.length):['grid','columns','group'].includes(type)?deckClamp(Number(c.columns)||2,1,6):1;
 const inW=Math.max(1,width-pad),childW=Math.max(1,(inW-gap*(cols-1))/cols),count=Math.ceil(kids.length/cols);
 const needs=kids.map(k=>deckContainerNeed(k,childW,depth+1));
 let rowHeights=Array.from({length:count},(_,r)=>Math.max(1,...needs.slice(r*cols,(r+1)*cols)));
 const need=rowHeights.reduce((a,b)=>a+b,0)+Math.max(0,count-1)*gap+pad;
 // Extra space is distributed; insufficient space is reported, never made negative.
 if(height!=null&&count&&height>need){const grow=rowHeights.map((_,r)=>kids.slice(r*cols,(r+1)*cols).some(k=>deckCanGrow(k))),n=grow.filter(Boolean).length;
  if(n){const extra=(height-need)/n;rowHeights=rowHeights.map((h,r)=>h+(grow[r]?extra:0));}
 }
 return {cols,gap,need,rowHeights,boxes:kids.map((_,i)=>({width:childW,height:rowHeights[Math.floor(i/cols)]}))};
}
function deckContainerNeed(c,width,depth=0){
 if(!c||depth>7)return 0;
 if(DECK_CONTAINERS.has(c.type))return Math.max(deckNum(c.height??c.minHeight),deckContainerPlan(c,Math.max(1,width),undefined,depth).need);
 return Math.max(deckNum(c.height??c.minHeight),Math.min(180,DECK_MIN_HEIGHT[c.type]??70),deckTextNeed(c,Math.max(1,width)));
}
function deckTextNeed(c,width){
 width=Math.max(80,width);
 const type=c.type||'text',lines=(t,size,lh,w,weight=650)=>t?XBText.wrap(String(t),Math.max(8,w)/(XB_RENDER_OPTS.textSafety||1),size,Infinity,weight).lines.length*size*lh:0;
 switch(type){
  case 'text':case 'paragraph':return lines(c.text??c.content,25,1.5,width-10,600)+26;
  case 'heading':case 'title':return lines(c.text||c.title,38,1.16,width,800)+30;
  case 'callout':return 54+(c.title||c.label?34+12:0)+lines(c.text||c.content,21,1.42,width-63,600);
  case 'quote':return 44+lines(c.text||c.content,34,1.38,width-125,760)+(c.author?44:0);
  case 'list':{const items=Array.isArray(c.items)?c.items:[];return 58+items.reduce((s,it)=>s+lines(deckItemText(it),25,1.55,width-96,600)+12,0);}
  case 'markdown':{let h=58;for(const ln of String(c.markdown||c.content||c.text||'').split(/\r?\n/)){if(!ln.trim())continue;const t=ln.replace(/^#+\s*|^\s*[-*]\s+/,'');h+=/^##\s/.test(ln)?lines(t,30,1.25,width-66,800)+18:/^###\s/.test(ln)?lines(t,25,1.25,width-66,750)+16:lines(t,22,1.5,width-(/^\s*[-*]/.test(ln)?96:66),600)+10;}return h;}
  case 'metric':case 'kpi':return 54+26+6+71+(c.delta||c.subtitle?6+24:0);
  case 'progress':return 48+30+19+22;
  case 'table':{const d=c.dataRef||c.data||c.dataset?XBDiag.mute(()=>deckData(c)):[];return deckTablePlan(c,width,Array.isArray(d)?d.slice(0,12):[]).need;}
  case 'code':return 58+String(c.code||c.text||'').split(/\r?\n/).reduce((s,l)=>s+Math.max(1,Math.ceil(XBText.width(l,21,500)/(width-66)))*31.5,0);
  case 'stat-grid':{const n=Array.isArray(c.items)?c.items.length:0;return Math.ceil(n/2)*(17*1.4+39*1.25+40)+Math.max(0,Math.ceil(n/2)-1)*12;}
  case 'scorecard':{const n=Array.isArray(c.items)?c.items.length:0;return 44+40+n*(20*1.4+25);}
  case 'numbered-steps':{const n=Array.isArray(c.items)?c.items.length:0;return 24+n*(58+12);}
  default:return 0;
 }
}
// Recursively checks text fit inside nested containers (stack/card/grid/row/columns).
function deckCheckFit(c,width,height,depth=0){
 if(!c||depth>7)return;const type=c.type||'text',kids=c.children||c.components||[],childKey=c.children?'children':'components';
 if(DECK_CONTAINERS.has(type)&&kids.length){
  const plan=deckContainerPlan(c,width,height,depth);
  if(plan.need>height+4)XBDiag.report('layout.overflow','error',`${type} needs ${Math.round(plan.need)}px but has ${Math.round(height)}px`,{need:Math.round(plan.need),available:Math.round(height)});
  kids.forEach((k,i)=>XBDiag.at([childKey,i],()=>deckCheckFit(k,plan.boxes[i].width,plan.boxes[i].height,depth+1)));return;
 }
 const need=deckTextNeed(c,width);
 if(need>height*1.06+4)XBDiag.report('text.overflow','warning',`${type} needs ≈${Math.round(need)}px height but has ${Math.round(height)}px at ${Math.round(width)}px width; text is clipped`,{need:Math.round(need),height:Math.round(height)});
 if(DECK_VISUAL_TYPES.has(type)&&type!=='mermaid'){const plot=deckVisualBox(c,{width,height},type==='chart-card'),plotW=Math.max(1,plot.width),plotH=Math.max(120,plot.height),vw=deckViewWidth(c.variant||(type==='chart'||type==='chart-card'?'bar':'flowchart'),{width:plotW,height:plotH}),scale=Math.min(plotW/vw,plotH/480);
  if(scale<.62)XBDiag.report('layout.legibility','warning',`${type} "${c.variant||''}" is drawn at ${Math.round(scale*100)}% scale (${Math.round(width)}×${Math.round(height)}px); labels fall below ${Math.round(15*scale)}px — give it more width/height`,{scale:r1(scale)});}
}
function xbSolveGrid(list,scene=XB_SCENE){
 const {width:W,height:H,cols,colGap,rowGap}=scene,colW=(W-colGap*(cols-1))/cols;
 const items=list.map((c,i)=>{const type=c?.type||'text',span=deckClamp(Number(c?.span)||(DECK_VISUAL_TYPES.has(type)&&type!=='chart-card'?12:6),1,12),width=colW*span+colGap*(span-1);
  const declared=Number.isFinite(Number(c?.height??c?.minHeight))&&Number(c?.height??c?.minHeight)>0?Number(c.height??c.minHeight):180;
  const need=DECK_CONTAINERS.has(type)?deckContainerNeed(c||{},width):deckTextNeed(c||{},width);
  return {c,i,span,width,declared,need,desired:Math.max(declared,need),min:Math.max(Math.min(declared,DECK_MIN_HEIGHT[type]??70),need)};});
 const rows=[];let cur=[],used=0;for(const it of items){if(cur.length&&used+it.span>cols){rows.push(cur);cur=[];used=0;}cur.push(it);used+=it.span;}if(cur.length)rows.push(cur);
 const gaps=rowGap*Math.max(0,rows.length-1),rowDesired=rows.map(r=>Math.max(...r.map(it=>it.desired))),rowMin=rows.map(r=>Math.max(...r.map(it=>it.min)));
 const total=rowDesired.reduce((a,b)=>a+b,0)+gaps,minTotal=rowMin.reduce((a,b)=>a+b,0)+gaps;
 let rowH=rowDesired.slice(),fits=true;
 if(total>H){
  if(minTotal<=H){const slack=rowDesired.map((d,k)=>d-rowMin[k]),sum=slack.reduce((a,b)=>a+b,0)||1,cut=total-H;rowH=rowDesired.map((d,k)=>d-slack[k]*cut/sum);}
  else{rowH=rowMin.slice();fits=false;}
 }
 // Free height goes to rows holding charts/diagrams whose height is not fixed (minHeight is a floor, height is exact).
 const usedH=rowH.reduce((a,b)=>a+b,0)+gaps,growable=rows.map(r=>r.some(it=>deckCanGrow(it.c)));
 if(fits&&usedH<H&&growable.some(Boolean)){const extra=(H-usedH)/growable.filter(Boolean).length;rows.forEach((r,k)=>{if(growable[k]){rowH[k]+=extra;r.forEach(it=>{if(deckCanGrow(it.c))it.desired=rowH[k];});}});}
 const heights=new Array(items.length);rows.forEach((r,k)=>r.forEach(it=>heights[it.i]=Math.min(it.desired,rowH[k])));
 let y=0;const placed=rows.map((r,k)=>{const top=y;y+=rowH[k]+rowGap;return {top,height:rowH[k],items:r.map(it=>it.i),overflow:top+rowH[k]>H+0.5};});
 return {heights,widths:items.map(it=>it.width),rows:placed,total:rowH.reduce((a,b)=>a+b,0)+gaps,fits,scene:{width:W,height:H}};
}
function xbResolveTheme(slide){
 const tokens=DECK_CONFIG.theme?.tokens||{},hex=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
 const preset=DECK_CONFIG.theme?.preset,variant=slide.variant||preset,dark=variant==='dark',orange=variant==='orange';
 const background=hex(slide.background,hex(tokens.background,orange?'#F97C00':dark?'#425453':'#FFFFFF'));
 const lum=color=>{const values=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return values[0]*.2126+values[1]*.7152+values[2]*.0722;};
 const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 let foreground=hex(tokens.ink,dark?'#FFFFFF':'#425453');
 if(contrast(foreground,background)<4.5)foreground=contrast('#425453',background)>=4.5?'#425453':'#FFFFFF';
 return {background,foreground,dark:lum(background)<.25,logo:orange||lum(background)<.25?'white':'primary',primary:hex(tokens.primary,'#F97C00'),teal:hex(tokens.teal,'#25AC9D')};
}
function xbResolveComposerRoot(slide){
 const content=slide.content||{},root={};
 for(const key of ['title','subtitle','components']){
  const owner=Object.prototype.hasOwnProperty.call(slide,key)?slide:Object.prototype.hasOwnProperty.call(content,key)?content:slide;
  Object.defineProperty(root,key,{enumerable:true,get:()=>owner[key]??(key==='components'?[]:''),set:value=>{owner[key]=value;}});
 }
 return root;
}
function deckComposer(slide,index,isThumb){
 const c=slide.content||{},root=xbResolveComposerRoot(slide),layout=slide.layout||'auto',listKey=Array.isArray(slide.components)?['components']:['content','components'],list=root.components;
 const theme=xbResolveTheme(slide),bg=theme.background,dark=theme.dark;
 const themeCSS=`--v1-primary:${theme.primary};--v1-ink:${theme.foreground};--v1-teal:${theme.teal};color:${theme.foreground};`;
 const logoVariant=theme.logo;const classes='v1-slide '+(dark?'v1-dark':'');
 const authorCss=xbSlideCss(slide,index,(DECK_CONFIG.customCss||'')+'\n'+(slide.customCss||''));
 const rawTitle=root.title||slide.layoutName||'Composition',title=deckSafe(rawTitle),subtitle=deckSafe(root.subtitle);
 const tl=XBText.wrap(rawTitle,1700,59,Infinity,800).lines.length,sl=XBText.wrap(root.subtitle,1680,25,Infinity,500).lines.length,headH=tl*66+(sl?10+sl*33:0);
 if(headH>159)XBDiag.report('text.overflow','warning',`slide header needs ≈${headH}px (title ${tl} line(s) at 59px, subtitle ${sl} line(s)) but the band is 159px; shorten the title or subtitle`,{at:slide.title?['title']:['content','title'],need:headH,height:159});
 const sceneClass=layout==='freeform'?'v1-scene v1-freeform':'v1-scene v1-auto';
 let comps;
 if(layout==='freeform'){
  comps=list.map((x,i)=>XBDiag.at([...listKey,i],()=>{const p=x?.position||{},px=deckNum(p.x),py=deckNum(p.y),pw=deckNum(p.width,520),ph=deckNum(p.height,340);
   if(px<0||py<0||px+pw>XB_SCENE.width+1||py+ph>XB_SCENE.height+1)XBDiag.report('layout.out-of-bounds','error',`component at (${px},${py}) ${pw}×${ph} exceeds the ${XB_SCENE.width}×${XB_SCENE.height} scene`,{at:['position']});
   list.slice(0,i).forEach((o,j)=>{const q=o?.position||{},qx=deckNum(q.x),qy=deckNum(q.y),qw=deckNum(q.width,520),qh=deckNum(q.height,340);if(px<qx+qw&&qx<px+pw&&py<qy+qh&&qy<py+ph)XBDiag.report('layout.overlap','warning',`overlaps component ${j}`,{other:j});});
   deckCheckFit(x,pw,ph);return deckComponent(x,0,{width:pw,height:ph,absolute:true});})).join('');
 }else{
  const solved=xbSolveGrid(list);
  if(!solved.fits){const first=solved.rows.find(r=>r.overflow);XBDiag.report('layout.overflow','error',`components need ≥${Math.round(solved.total)}px but the scene is ${XB_SCENE.height}px; ${first?first.items.length:0}+ component(s) from index ${first?.items[0]} are clipped — split the slide or reduce content`,{need:Math.round(solved.total),available:XB_SCENE.height,firstClipped:first?.items[0]});}
  comps=list.map((x,i)=>XBDiag.at([...listKey,i],()=>{const h=solved.heights[i];deckCheckFit(x,solved.widths[i],h);return deckComponent(x,0,{width:solved.widths[i],height:h});})).join('');
 }
 return `<div class="${classes}" data-slide-id="${deckSafe(slide.id||'slide-'+(index+1))}" style="background:${deckSafe(bg)};${themeCSS}">
  ${authorCss.trim()?`<style>${authorCss.replace(/<\/style/gi,'<\\/style')}</style>`:''}
  <div class="v1-band"></div>
  <div class="v1-brand-row"><svg class="v1-slide-logo"><use href="#xbrain-logo-${logoVariant}"></use></svg><div class="v1-brand-stamp"><b style="font:inherit" ${xbChromeAttr('sectionTag')}>${deckSafe(c.sectionTag||slide.section||'PRESENTATION AS CODE')}</b> <span>· ${String(index+1).padStart(2,'0')}</span></div></div>
  <div class="v1-slide-head"><div class="v1-eyebrow">${deckSafe(c.kicker||'XBRAIN · VISUAL INTELLIGENCE')}</div><h1 ${xbEditAttr(isThumb)} data-field="title">${title}</h1><p ${xbEditAttr(isThumb)} data-field="subtitle">${subtitle}</p></div>
  <div class="${sceneClass}">${comps}</div>
  <div class="v1-footer"><span ${xbChromeAttr('footer')}>${deckSafe(c.footer||'XBrain · CloudOps · DevOps · GenAI')}</span><span><b style="font:inherit" ${xbChromeAttr('source')}>${deckSafe(c.source||'ILLUSTRATIVE / TEMPLATE DATA')}</b> · ${String(index+1).padStart(2,'0')}</span></div>
 </div>`;
}
/* ----------------------- Preset compositions ------------------------ */
LAYOUT_CATALOG.push({type:'composer',group:'E',name:'JSON Composer',desc:'Slide composed from arbitrary JSON components; supports nested layouts, dataRefs, raw HTML/SVG, charts and diagrams.'});
const DECK_DEMO_SLIDES=[];
function deckAddExample(title,desc,components,variant='white',layout='auto'){
 DECK_DEMO_SLIDES.push({id:`v1-${String(DECK_DEMO_SLIDES.length+1).padStart(2,'0')}`,type:'composer',group:'E',layoutName:title,title,subtitle:desc,background:variant==='orange'?'#F97C00':variant==='dark'?'#425453':'#FFFFFF',variant,layout,content:{sectionTag:'JSON COMPOSER',kicker:'DATA-DRIVEN VISUAL',source:'SAMPLE DATA'},components});
}
// Honest presets: every sample visual carries the fields its variant reads (no implied relations or invented values).
const deckN=(id,label,more={})=>({id,label,...more});
const DECK_VISUAL_PRESETS={
 'bar':{dataRef:'skills'},'bar-horizontal':{dataRef:'tracks'},'grouped-bar':{dataRef:'cohorts'},'stacked-bar':{dataRef:'effortMix'},
 'line':{dataRef:'delivery'},'area':{dataRef:'delivery'},'step-line':{dataRef:'delivery'},'sparkline':{dataRef:'delivery'},
 'lollipop':{dataRef:'skills'},'dot-plot':{dataRef:'skills'},'waterfall':{dataRef:'budgetBridge'},'donut':{dataRef:'tracks'},'pie':{dataRef:'tracks'},
 'radar':{dataRef:'skills'},'scatter':{dataRef:'scoreMap',options:{xLabel:'Lab hours',yLabel:'Assessment score'}},'bubble':{dataRef:'scoreMap',options:{xLabel:'Lab hours',yLabel:'Assessment score'}},
 'heatmap':{dataRef:'effortMix'},'histogram':{dataRef:'assessmentScores',options:{bins:6}},'pareto':{dataRef:'tracks'},
 'gauge':{dataRef:'labProgress',transform:{limit:1}},'bullet':{dataRef:'labProgress'},'progress-ring':{dataRef:'labProgress'},
 'treemap':{dataRef:'tracks'},'funnel-chart':{dataRef:'intake'},'slope':{dataRef:'beforeAfter',options:{labels:['Pre-course','Post-course']}},
 'waffle':{dataRef:'tracks'},'range-bar':{dataRef:'roadmap'},'dumbbell':{dataRef:'beforeAfter',options:{labels:['Pre-course','Post-course']}},
 'marimekko':{dataRef:'effortMix'},'combo':{dataRef:'enrolment'},'stacked-100':{dataRef:'effortMix'},'diverging-bar':{dataRef:'sentiment'},
 'flowchart':{nodes:DECK_SAMPLE_NODES,edges:DECK_SAMPLE_EDGES},'process-pipeline':{nodes:DECK_SAMPLE_NODES,edges:DECK_SAMPLE_EDGES},
 'chevrons':{nodes:DECK_SAMPLE_NODES},'zigzag':{nodes:DECK_SAMPLE_NODES},'value-chain':{nodes:DECK_SAMPLE_NODES},'release-train':{nodes:DECK_SAMPLE_NODES},
 'customer-journey':{nodes:DECK_SAMPLE_NODES},'learner-journey':{nodes:DECK_SAMPLE_NODES},'bpmn':{nodes:[...DECK_SAMPLE_NODES.slice(0,3),deckN('gate','Passed review?',{kind:'gateway'}),deckN('ship','Release')],edges:[{from:'discover',to:'design'},{from:'design',to:'build'},{from:'build',to:'gate'},{from:'gate',to:'ship',label:'yes'},{from:'gate',to:'build',label:'no'}]},
 'state-machine':{nodes:[deckN('applied','Applied'),deckN('enrolled','Enrolled'),deckN('active','In training'),deckN('paused','Paused'),deckN('done','Graduated')],edges:[{from:'applied',to:'enrolled'},{from:'enrolled',to:'active'},{from:'active',to:'paused',label:'leave'},{from:'paused',to:'active',label:'resume'},{from:'active',to:'done'}]},
 'dependency':{nodes:[deckN('net','Network baseline'),deckN('iam','Identity & access'),deckN('ci','CI pipeline'),deckN('k8s','Kubernetes cluster'),deckN('obs','Observability')],edges:[{from:'net',to:'k8s'},{from:'iam',to:'ci'},{from:'iam',to:'k8s'},{from:'ci',to:'k8s'},{from:'k8s',to:'obs'}]},
 'critical-path':{nodes:[deckN('a','Scope',{critical:true}),deckN('b','Content build',{critical:true}),deckN('c','Lab setup'),deckN('d','Pilot cohort',{critical:true}),deckN('e','Launch',{critical:true})],edges:[{from:'a',to:'b',critical:true},{from:'a',to:'c'},{from:'b',to:'d',critical:true},{from:'c',to:'d'},{from:'d',to:'e',critical:true}]},
 'decision-tree':{nodes:[deckN('q','Cloud experience?'),deckN('f','Foundation track'),deckN('a','Placement test'),deckN('fast','Fast-track labs'),deckN('std','Standard labs')],edges:[{from:'q',to:'f',label:'No'},{from:'q',to:'a',label:'Yes'},{from:'a',to:'fast',label:'≥ 80%'},{from:'a',to:'std',label:'< 80%'}]},
 'org-chart':{nodes:[deckN('s','Program Steering'),deckN('c','Curriculum',{parent:'s'}),deckN('m','Mentors',{parent:'s'}),deckN('l','Lab Operations',{parent:'s'}),deckN('k','Career Support',{parent:'s'})]},
 'tree':{nodes:[deckN('r','Capability model'),deckN('a','Cloud',{parent:'r'}),deckN('b','Delivery',{parent:'r'}),deckN('a1','Networking',{parent:'a'}),deckN('a2','Compute',{parent:'a'}),deckN('b1','CI/CD',{parent:'b'}),deckN('b2','Observability',{parent:'b'})]},
 'okrs':{nodes:[deckN('o','Objective: job-ready graduates'),deckN('k1','KR1 · 80% lab completion',{parent:'o'}),deckN('k2','KR2 · 60% placed in 90 days',{parent:'o'}),deckN('k3','KR3 · NPS ≥ 50',{parent:'o'})]},
 'mindmap':{center:'Capability Engine',nodes:[deckN('c','CloudOps'),deckN('d','DevOps'),deckN('g','GenAI'),deckN('s','Security'),deckN('c1','AWS'),deckN('c2','Kubernetes'),deckN('d1','CI/CD'),deckN('g1','RAG'),deckN('s1','IAM')],edges:[{from:'c',to:'c1'},{from:'c',to:'c2'},{from:'d',to:'d1'},{from:'g',to:'g1'},{from:'s',to:'s1'}]},
 'radial-tree':{center:'Learning platform',nodes:[deckN('a','Content'),deckN('b','Labs'),deckN('c','Assessment'),deckN('a1','Videos'),deckN('b1','Sandboxes'),deckN('c1','Rubrics')],edges:[{from:'a',to:'a1'},{from:'b',to:'b1'},{from:'c',to:'c1'}]},
 'hub-spoke':{center:'XBrain',nodes:['Universities','Cloud vendors','Employers','Mentors','Alumni','Community'].map((l,i)=>deckN('p'+i,l))},
 'ecosystem':{center:'XBrain Academy',nodes:['AWS','Universities','Employers','Mentors','Alumni'].map((l,i)=>deckN('e'+i,l))},
 'stakeholder':{nodes:[deckN('a','University board',{x:3,y:9}),deckN('b','Employers',{x:8,y:8}),deckN('c','Mentors',{x:7,y:4}),deckN('d','Parents',{x:2,y:3})],options:{xLabel:'Interest →',yLabel:'Influence →'}},
 'cycle':{center:'Learning loop',nodes:DECK_SAMPLE_NODES},'lifecycle':{nodes:['Attract','Enrol','Learn','Practise','Certify','Place'].map((l,i)=>deckN('l'+i,l))},
 'swimlane':{nodes:[deckN('a','Define outcomes',{lane:'Curriculum',start:1,end:3}),deckN('b','Publish modules',{lane:'Curriculum',start:3,end:8}),deckN('c','Weekly reviews',{lane:'Mentors',start:4,end:12}),deckN('d','Provision labs',{lane:'Operations',start:2,end:5}),deckN('e','Partner demo day',{lane:'Partnerships',start:11,end:12})]},
 'service-blueprint':{nodes:[deckN('a','Applies online',{lane:'Learner'}),deckN('b','Attends labs',{lane:'Learner'}),deckN('c','Advisor call',{lane:'Frontstage'}),deckN('d','Mentor feedback',{lane:'Frontstage'}),deckN('e','Lab provisioning',{lane:'Backstage'}),deckN('f','LMS & cloud accounts',{lane:'Support'})],options:{lanes:['Learner','Frontstage','Backstage','Support']}},
 'gantt':{dataRef:'roadmap',options:{today:30,todayLabel:'Week 30'}},
 'roadmap':{nodes:[deckN('a','Discover',{date:'2026-01'}),deckN('b','Align',{date:'2026-03'}),deckN('c','Build',{date:'2026-05'}),deckN('d','Pilot',{date:'2026-08'}),deckN('e','Expand',{date:'2026-11'})]},
 'milestones':{nodes:[deckN('a','Kick-off',{date:'2026-01-12'}),deckN('b','First cohort',{date:'2026-03-02'}),deckN('c','Demo day',{date:'2026-06-20'}),deckN('d','Graduation',{date:'2026-09-15'})]},
 'timeline':{nodes:[deckN('a','Q1 plan',{date:'2026-01'}),deckN('b','Q2 pilot',{date:'2026-04'}),deckN('c','Q3 scale',{date:'2026-07'}),deckN('d','Q4 review',{date:'2026-10'})]},
 'kanban':{nodes:[deckN('a','Curriculum map',{status:'Done'}),deckN('b','Lab design',{status:'In progress'}),deckN('c','Mentor guide',{status:'Review'}),deckN('d','Assessment bank',{status:'Backlog'}),deckN('e','Capstone brief',{status:'In progress'})],options:{columns:['Backlog','In progress','Review','Done']}},
 'fishbone':{center:'Low lab completion',nodes:[deckN('a','Content',{items:['Unclear steps','Outdated screenshots']}),deckN('b','Environment',{items:['Slow provisioning','Quota limits']}),deckN('c','People',{items:['No mentor slot']}),deckN('d','Schedule',{items:['Clashes with work']})]},
 'bowtie':{center:'Lab platform outage',nodes:[deckN('a','Expired credentials',{group:'cause'}),deckN('b','Quota exhaustion',{group:'cause'}),deckN('c','Region incident',{group:'cause'}),deckN('d','Missed lab deadlines',{group:'consequence'}),deckN('e','Lower NPS',{group:'consequence'})]},
 'sequence':{nodes:[deckN('st','Student'),deckN('me','Mentor'),deckN('lp','Learning platform'),deckN('lab','Cloud lab')],edges:[{from:'st',to:'lp',label:'Submit lab'},{from:'lp',to:'lab',label:'Run checks'},{from:'lab',to:'lp',label:'Results',kind:'return'},{from:'lp',to:'me',label:'Request review'},{from:'me',to:'st',label:'Feedback',kind:'return'}]},
 'network':{nodes:['AWS Labs','XBrain','Mentors','Learners','Universities','Partners'].map((l,i)=>deckN('n'+i,l)),edges:[{from:'n1',to:'n0'},{from:'n1',to:'n2'},{from:'n1',to:'n3'},{from:'n2',to:'n3'},{from:'n4',to:'n3'},{from:'n5',to:'n1'}]},
 'sankey':{nodes:['Applications','Shortlisted','Not shortlisted','Qualified','Waitlist','Completed','Withdrew'].map((l,i)=>deckN('s'+i,l)),edges:[{from:'s0',to:'s1',value:280},{from:'s0',to:'s2',value:220},{from:'s1',to:'s3',value:200},{from:'s1',to:'s4',value:80},{from:'s3',to:'s5',value:160},{from:'s3',to:'s6',value:40}]},
 'architecture':{nodes:[deckN('a','Experience layer',{desc:'Web, mobile, LMS'}),deckN('b','Learning platform',{desc:'Content, labs, assessment'}),deckN('c','Services',{desc:'Identity, analytics'}),deckN('d','Cloud infrastructure',{desc:'AWS accounts, Kubernetes'}),deckN('e','Security & operations',{desc:'IAM, monitoring'})]},
 'c4':{nodes:['Learner web app','API gateway','Lab orchestrator','Content store'].map((l,i)=>deckN('c'+i,l))},'layered':{nodes:['Learning Portal','Content & Labs','Cloud Infrastructure','Observability'].map((l,i)=>deckN('y'+i,l))},
 'cloud':{nodes:['Edge & CDN','Application tier','Data tier','Shared services'].map((l,i)=>deckN('k'+i,l))},
 'pyramid':{nodes:['Career readiness','Capstone','Applied labs','Core skills','Foundation'].map((l,i)=>deckN('p'+i,l))},
 'funnel':{nodes:[deckN('a','Applications',{value:500}),deckN('b','Shortlisted',{value:280}),deckN('c','Qualified',{value:200}),deckN('d','Completed',{value:160})]},
 'venn':{center:'Platform engineering',nodes:[deckN('a','CloudOps'),deckN('b','DevOps'),deckN('c','GenAI')]},
 'concentric':{nodes:['Ecosystem','Partners','Program','Learner'].map((l,i)=>deckN('o'+i,l))},'nested-circle':{nodes:['Industry','Company','Team','Individual'].map((l,i)=>deckN('o'+i,l))},
 'swot':{nodes:[deckN('a','Hands-on labs',{group:'S'}),deckN('b','Mentor network',{group:'S'}),deckN('c','Small cohort size',{group:'W'}),deckN('d','Cloud talent demand',{group:'O'}),deckN('e','University partnerships',{group:'O'}),deckN('f','Low-cost online courses',{group:'T'})]},
 'pestel':{nodes:[deckN('a','Digital skills policy',{group:'Political'}),deckN('b','Tech hiring cycle',{group:'Economic'}),deckN('c','Career switchers',{group:'Social'}),deckN('d','GenAI tooling',{group:'Technological'}),deckN('e','Green data centres',{group:'Environmental'}),deckN('f','Data protection law',{group:'Legal'})]},
 'ansoff':{nodes:[deckN('a','More cohorts in Da Nang',{group:'Market penetration'}),deckN('b','GenAI track',{group:'Product development'}),deckN('c','Hanoi universities',{group:'Market development'}),deckN('d','Corporate academy',{group:'Diversification'})]},
 'bcg':{nodes:[deckN('a','GenAI',{x:7,y:8}),deckN('b','Security',{x:3,y:7}),deckN('c','CloudOps',{x:8,y:3}),deckN('d','Legacy ops',{x:2,y:2})]},
 'priority':{nodes:[deckN('a','Lab templates',{x:2,y:8}),deckN('b','Mentor portal',{x:7,y:9}),deckN('c','Badge design',{x:2,y:3}),deckN('d','Custom LMS',{x:9,y:3})]},
 'quadrant':{nodes:[deckN('a','Item A',{x:2,y:7}),deckN('b','Item B',{x:7,y:8}),deckN('c','Item C',{x:5,y:2})],options:{xLabel:'Feasibility →',yLabel:'Value →',quadrants:['Explore','Invest','Drop','Optimise']}},
 'portfolio':{nodes:[deckN('a','CloudOps',{x:7,y:6}),deckN('b','DevOps',{x:5,y:8}),deckN('c','GenAI',{x:3,y:9})],options:{xLabel:'Maturity →',yLabel:'Demand →'}},
 'risk-matrix':{nodes:[deckN('a','Mentor churn',{x:3,y:4}),deckN('b','Cloud cost overrun',{x:4,y:3}),deckN('c','Low enrolment',{x:2,y:5}),deckN('d','Lab outage',{x:2,y:2})]},
 'raci':{options:{roles:['Program','Mentors','Learners','Partners']},nodes:[deckN('t1','Plan curriculum',{raci:{Program:'A',Mentors:'R',Partners:'C'}}),deckN('t2','Run labs',{raci:{Program:'A',Mentors:'R',Learners:'I'}}),deckN('t3','Assess projects',{raci:{Program:'A',Mentors:'R',Learners:'I',Partners:'C'}}),deckN('t4','Hiring day',{raci:{Program:'A',Partners:'R',Learners:'I'}})]},
 'balanced-scorecard':{nodes:[deckN('a','Revenue per cohort',{group:'Financial'}),deckN('b','Learner NPS',{group:'Customer'}),deckN('c','Lab uptime',{group:'Internal process'}),deckN('d','Mentor certification',{group:'Learning & growth'})]},
 'decision-matrix':{nodes:['Cost','Speed','Quality','Risk'].map((l,i)=>deckN('m'+i,l))},'capability-map':{nodes:['Cloud','Data','Security','AI','DevOps','Networking'].map((l,i)=>deckN('m'+i,l))},
 'comparison-matrix':{nodes:['Option A','Option B','Option C','Option D'].map((l,i)=>deckN('m'+i,l))},
 'vertical-timeline':{nodes:DECK_SAMPLE_NODES.map((n,i)=>({...n,date:['JAN','MAR','MAY','AUG','OCT'][i]}))},
 'pros-cons':{nodes:[deckN('a','Faster onboarding'),deckN('b','Lower cloud cost'),deckN('c','Setup effort',{group:'con'})]},
 'iceberg':{nodes:['Low lab completion','Unclear instructions','No feedback loop','Setup friction'].map((l,i)=>deckN('i'+i,l))}
};
function deckPreset(id){return JSON.parse(JSON.stringify(DECK_VISUAL_PRESETS[id]||(CHART_VARIANTS[id]?{dataRef:'tracks'}:{nodes:DECK_SAMPLE_NODES})));}
function deckVis(variant,dataRef,span=12,more={}){const p=deckPreset(variant);if(dataRef)p.dataRef=dataRef;return {id:'visual-'+variant,type:'diagram',variant,...p,span,minHeight:450,...more};}
function deckCall(text,title='Design insight',span=6){return {type:'callout',title,text,span,minHeight:155};}
function deckMetric(title,value,delta,span=4){return {type:'metric',title,value,delta,span,minHeight:190};}
// Chart-focused slides: each uses the same declarative API.
[
 ['bar','Track readiness · columns','Compare capabilities at a glance'],
 ['bar-horizontal','Skills portfolio · horizontal','Prioritize workstreams with consistent bars'],
 ['grouped-bar','Program comparison · groups','Compare two cohorts and reveal differences'],
 ['stacked-bar','Capability composition · stacked','Illustrate cumulative progress across areas'],
 ['line','Learning trend · line','Explain progress across successive periods'],
 ['area','Adoption curve · area','Highlight magnitude and direction of progress'],
 ['waterfall','Value bridge · waterfall','Show changes between stages'],
 ['donut','Portfolio mix · donut','Emphasize the part-to-whole relationship'],
 ['radar','Skill profile · radar','Compare multiple dimensions at once'],
 ['scatter','Capability map · scatter','See distribution and clusters in a dataset'],
 ['heatmap','Readiness heatmap','Spot capability patterns across teams'],
 ['gauge','Target progress · gauge','Track progress to a defined threshold'],
 ['treemap','Activity allocation · treemap','See relative contribution of categories'],
 ['funnel-chart','Cohort funnel · chart','Follow a hypothetical learning pipeline'],
 ['dumbbell','Impact range · dumbbell','Compare two reference points per row']
].forEach(([id,title,subtitle])=>deckAddExample(title,subtitle,[deckVis(id)],'white'));
// Diagram-focused slides with a full-width diagram and optional insight.
[
 ['flowchart','Learning operating flow','From discovery to iterative delivery'],
 ['chevrons','Five-stage delivery','Sequential delivery stages'],
 ['decision-tree','Training decision tree','Decision paths from one shared objective'],
 ['org-chart','Training governance','Accountability and oversight hierarchy'],
 ['mindmap','Capability mind map','Connection of technical skill areas'],
 ['cycle','Continuous improvement','A repeatable feedback loop'],
 ['swimlane','Cross-team execution','Parallel roles and responsibilities'],
 ['roadmap','Program roadmap','Milestone-based planning view'],
 ['gantt','Release workstreams','Work packages across an illustrative timeline'],
 ['architecture','Cloud training architecture','Layered and modular capability stack'],
 ['venn','Technology intersections','Where skills and practices overlap'],
 ['swot','Strategic SWOT','A structured strategic assessment'],
 ['pyramid','Capability pyramid','From foundations to advanced delivery'],
 ['network','Ecosystem topology','Multiple connected stakeholders'],
 ['sequence','Operational sequence','Messages and dependencies between actors'],
 ['fishbone','Root-cause analysis','Trace potential causes of an outcome'],
 ['sankey','Resources allocation','Conceptual allocation relationships'],
 ['priority','Prioritization matrix','Organize options across four areas']
].forEach(([id,title,desc])=>deckAddExample(title,desc,[deckVis(id,undefined,12,{maxNodes:12})]));
// Real composition slides: multiple nested components and heterogeneous data sources.
deckAddExample('Leadership summary','Three priorities · one visual narrative',[
 deckMetric('Applied learning','80%','Illustrative target'),deckMetric('CloudOps labs','12','Example modules'),deckMetric('Skill pillars','05','Curriculum dimensions'),
 {type:'chart',variant:'area',dataRef:'skills',span:8,minHeight:360},deckCall('Focus on applied cloud, automation and production readiness. The figures on this slide are illustrative.','Key takeaway',4)
]);
deckAddExample('Structured data table','The same dataset can power tables and charts',[
 {type:'table',dataRef:'intake',columns:['Stage','Value'],span:6,minHeight:480},
 {type:'chart',variant:'bar-horizontal',dataRef:'intake',span:6,minHeight:480}
]);
deckAddExample('Composition & narrative','Nested layouts, quote, progress, and callout',[
 {type:'quote',text:'Learn by doing. Validate by delivering.',author:'XBrain presentation principle',span:12,minHeight:175},
 {type:'progress',title:'Labs completed · illustrative',value:72,span:4,minHeight:160},
 {type:'progress',title:'Project readiness · illustrative',value:58,span:4,minHeight:160},
 {type:'progress',title:'Mentorship coverage · illustrative',value:88,span:4,minHeight:160},
 {type:'markdown',content:'### Implementation principles\n- Hands-on labs\n- Mentorship\n- Real-world projects',span:6,minHeight:240},
 {type:'callout',title:'Important',text:'All values are proposed sample data, not verified XBrain results.',span:6,minHeight:240}
]);
deckAddExample('HTML & SVG blocks','Trusted custom content can be embedded through JSON',[
 {type:'html',span:6,minHeight:400,html:'<div style="padding:32px;border:2px solid #F97C00;border-radius:20px;background:#FFF6EF;height:100%"><div style="font:700 22px Manrope;color:#F97C00">Custom HTML</div><h2 style="font:800 40px Manrope;color:#425453;margin:16px 0">Composable story</h2><p style="font:23px Nunito;color:#425453">This card is supplied as literal HTML in presentation JSON.</p></div>'},
 {type:'svg',span:6,minHeight:400,svg:'<svg viewBox="0 0 540 280" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><circle cx="180" cy="140" r="93" fill="#F97C00" opacity=".85"/><circle cx="270" cy="140" r="93" fill="#25AC9D" opacity=".80"/><circle cx="225" cy="140" r="47" fill="#425453"/><text x="225" y="148" fill="white" text-anchor="middle" font-family="Arial" font-size="19" font-weight="700">XBrain</text></svg>'}
]);
deckAddExample('Data links & Markdown','Markdown, links, and declarative navigation',[
 {type:'markdown',span:7,minHeight:400,content:'## Reusable formats\n- **JSON** · structured source\n- **CSV / TSV** · tabular data\n- **HTML / SVG** · custom content\n- **Markdown** · written narrative\n- **URL / API** · remote sources'},
 {type:'card',span:5,minHeight:400,children:[{type:'heading',text:'Online resources'},{type:'text',text:'Link components work without a custom layout.'},{type:'link',text:'XBrain website',href:'https://www.xbrain.com.vn'}]}
]);
deckAddExample('Mermaid · sequence','Native SVG fallback; full diagram with optional CDN library',[
 {type:'mermaid',span:12,minHeight:480,source:'sequenceDiagram\n participant Student\n participant Mentor\n participant Lab\n Student->>Mentor: Ask question\n Mentor->>Lab: Assign lab\n Lab-->>Student: Return feedback'}
]);
deckAddExample('Mermaid · flowchart','Edit one Mermaid source string to change the process',[
 {type:'mermaid',span:12,minHeight:480,source:'flowchart LR\n A[Discover] --> B[Practice]\n B --> C{Assessment}\n C -->|Pass| D[Capstone]\n C -->|Review| B'}
]);
deckAddExample('ECharts · custom option','Optional advanced chart engine, offline SVG fallback',[
 {type:'echarts',span:12,minHeight:480,fallback:'line',dataRef:'skills',options:{tooltip:{trigger:'axis'},grid:{left:60,right:50,top:55,bottom:50},xAxis:{type:'category',data:['Foundation','Automation','Container','IaC','Observe']},yAxis:{type:'value'},series:[{type:'line',smooth:true,areaStyle:{opacity:.17},lineStyle:{color:'#F97C00',width:4},itemStyle:{color:'#F97C00'},data:[72,81,65,91,76]}]}}
]);
deckAddExample('Architecture + metrics','Components can be combined into one slide',[
 {type:'diagram',variant:'layered',nodes:[{label:'Learning Portal'},{label:'Content & Labs'},{label:'Cloud Infrastructure'},{label:'Observability'}],span:8,minHeight:460},
 {type:'stack',span:4,minHeight:460,children:[deckMetric('Modules','24','Illustrative'),deckMetric('Tracks','03','Illustrative')]}
]);
/* Chart & diagram template pack: copy one of these slides, then swap dataRef / nodes. */
deckAddExample('Actual vs target · combo','Bars carry the actual value, the line carries row.target',[
 {type:'chart-card',title:'Enrolment per quarter · illustrative',variant:'combo',dataRef:'enrolment',span:8,minHeight:470,options:{labels:['Actual','Target']}},
 {type:'stack',span:4,minHeight:470,children:[deckMetric('Q4 actual','210','+5% vs target',12),deckCall('Q3 missed target by 10 learners; Q4 recovered after the second intake.','Reading the chart',12)]}
]);
deckAddExample('Effort mix · 100% stacked','Every numeric field of a row becomes one stacked series',[
 {type:'chart',variant:'stacked-100',dataRef:'effortMix',span:12,minHeight:470}
]);
deckAddExample('Learner feedback · diverging','Net sentiment per topic: positive right, negative left',[
 {type:'chart',variant:'diverging-bar',dataRef:'sentiment',span:8,minHeight:470,transform:{sortBy:'value',order:'desc'}},
 {type:'stack',span:4,minHeight:470,children:[deckCall('Labs and mentor access drive satisfaction; pacing and assessment clarity need attention.','Takeaway',12),{type:'legend',items:[{label:'Net positive',color:'#25AC9D'},{label:'Net negative',color:'#FE4A0B'}],span:12,minHeight:90}]}
]);
deckAddExample('Program milestones · vertical timeline','Use node.date for the rail and node.desc for detail',[
 deckVis('vertical-timeline',undefined,12,{nodes:[
  {label:'Kick-off & discovery',date:'JAN',desc:'Stakeholder interviews and skill baseline'},
  {label:'Foundation track',date:'FEB–MAR',desc:'Cloud fundamentals and Linux labs'},
  {label:'Applied labs',date:'APR–JUN',desc:'CI/CD, containers and infrastructure as code'},
  {label:'Capstone projects',date:'JUL–AUG',desc:'Team delivery with mentor reviews'},
  {label:'Graduation & placement',date:'SEP',desc:'Demo day and partner interviews'}],minHeight:470})
]);
deckAddExample('Option review · pros & cons','Mark a node with group:"con" to place it on the right',[
 deckVis('pros-cons',undefined,8,{options:{labels:['PROS · ƯU ĐIỂM','CONS · HẠN CHẾ']},nodes:[
  {label:'Faster onboarding',desc:'Shared lab templates from day one'},
  {label:'Lower cloud cost',desc:'Sandbox accounts auto-expire'},
  {label:'Consistent grading',desc:'Same rubric across cohorts'},
  {label:'Setup effort',desc:'Two weeks to build the templates',group:'con'},
  {label:'Less flexibility',desc:'Custom stacks need approval',group:'con'}],minHeight:470}),
 deckCall('Proceed with shared lab templates; budget two weeks of setup before the next intake.','Recommendation',4)
]);
deckAddExample('Root causes · iceberg','options.visible sets how many nodes sit above the waterline',[
 deckVis('iceberg',undefined,12,{options:{visible:1,labels:['WHAT WE SEE','WHAT DRIVES IT']},nodes:['Low lab completion','Unclear lab instructions','No feedback loop','Environment setup friction','Scheduling conflicts'],minHeight:470})
]);
// Registry variants that had no sample slide yet.
[
 ['pie','Budget split · pie','Part-to-whole with few categories','tracks'],
 ['bullet','Goal attainment · bullet','Bars against a fixed target marker','skills'],
 ['slope','Before / after · slope','Change between two points in time','tracks'],
 ['waffle','Composition · waffle','100-cell share of each category','tracks'],
 ['sparkline','Trend glance · sparkline','Compact trend without axis labels','delivery'],
 ['histogram','Score distribution · histogram','Frequency across value bands','skills']
].forEach(([id,title,subtitle])=>deckAddExample(title,subtitle,[deckVis(id)]));
[
 ['hub-spoke','Partner ecosystem · hub & spoke','One centre with connected partners',['Universities','Cloud vendors','Employers','Mentors','Alumni','Community']],
 ['lifecycle','Learner lifecycle','Repeatable stages for every cohort',['Attract','Enrol','Learn','Practise','Certify','Place']],
 ['timeline','Delivery timeline','Horizontal milestones across the year',['Q1 plan','Q2 pilot','Q3 scale','Q4 review','Next year']],
 ['raci','Responsibility matrix · RACI','Who is responsible, accountable, consulted, informed',['Plan','Train','Assess','Launch']],
 ['bcg','Portfolio · BCG 2×2','Classify programmes by growth and share',['GenAI (Star)','Security (Question)','CloudOps (Cash cow)','Legacy ops (Dog)']],
 ['bowtie','Risk bowtie','Causes on the left, consequences on the right',['Lab outage','Mentor shortage','Late content','Missed milestone','Lower NPS','Partner churn']]
].forEach(([id,title,desc])=>deckAddExample(title,desc,[deckVis(id,undefined,12,{maxNodes:12})]));
slides.push(...DECK_DEMO_SLIDES);

function deckOpenLibrary(){const m=document.getElementById('v1-visual-modal');m.classList.remove('hidden');deckFilterLibrary();}
function deckCloseLibrary(){document.getElementById('v1-visual-modal').classList.add('hidden');}
function deckFilterLibrary(){const q=(document.getElementById('v1-visual-search').value||'').toLowerCase();const fam=document.getElementById('v1-visual-family').value;const list=DECK_VISUAL_REGISTRY.filter(v=>(!fam||v.family===fam)&&(!q||v.label.toLowerCase().includes(q)||v.id.includes(q)));document.getElementById('v1-visual-grid').innerHTML=list.map(v=>`<button class="v1-library-choice" data-click-action="deckAddVisual" data-click-arg="'${v.id}'"><span class="v1-family">${v.family}</span><strong>${deckSafe(v.label)}</strong><small>${v.id}</small></button>`).join('');document.getElementById('v1-library-count').textContent=list.length+'/'+DECK_VISUAL_REGISTRY.length+' variants';}
function deckAddVisual(id){let meta=DECK_VISUAL_LOOKUP[id];if(!meta)return;let title=meta.label;
 const mermaidSource={
  'mermaid-sequence':'sequenceDiagram\n Student->>Mentor: Request review\n Mentor-->>Student: Feedback',
  'mermaid-erd':'erDiagram\n STUDENT ||--o{ LAB : completes\n LAB ||--o{ RESULT : produces',
  'mermaid-state':'stateDiagram-v2\n [*] --> Applied\n Applied --> Training\n Training --> Completed',
  'mermaid-class':'classDiagram\n class Student\n class Training\n Student --> Training',
  'mermaid-gantt':'gantt\n title Cohort Plan\n dateFormat YYYY-MM-DD\n section Program\n Foundation :a1, 2026-01-05, 35d\n Labs :a2, after a1, 40d',
  'mermaid-journey':'journey\n title Learner journey\n section Learn\n Foundation: 4: Student\n Hands-on labs: 5: Student',
  'mermaid-mindmap':'mindmap\n root((XBrain))\n  CloudOps\n  DevOps\n  GenAI',
  'mermaid-pie':'pie title Learning effort\n "Labs" : 55\n "Mentorship" : 20\n "Projects" : 25',
  'mermaid-quadrant':'quadrantChart\n title Program Priorities\n x-axis Low effort --> High effort\n y-axis Low impact --> High impact\n quadrant-1 Strategize\n quadrant-2 Quick wins\n quadrant-3 Backlog\n quadrant-4 Evaluate\n Skill labs: [0.4, 0.8]',
  'mermaid-timeline':'timeline\n title Project phases\n Discovery : Foundation\n Practice : Labs\n Deliver : Capstone',
  'mermaid-gitgraph':'gitGraph\n commit\n branch labs\n checkout labs\n commit\n checkout main\n merge labs'
 };
 let component=meta.family==='mermaid'?{type:'mermaid',source:mermaidSource[id]||'flowchart LR\n A[Discover] --> B[Practice] --> C[Validate]'}:{type:'diagram',variant:id,...deckPreset(id)};component.span=12;component.minHeight=450;
 const s={id:'visual-'+Date.now(),type:'composer',layoutName:title,group:'E',title,subtitle:'AI-editable diagram template · replace JSON content and datasets.',content:{sectionTag:'CUSTOM VISUAL',source:'ILLUSTRATIVE SAMPLE DATA'},components:[component]};DeckStore.change(()=>{slides.splice(currentSlideIndex+1,0,s);currentSlideIndex++;});deckCloseLibrary();switchAppMode('workspace');}
function deckDocument(){return DeckModel.serialize(DECK_CONFIG, slides);}
function deckApplyDocument(obj, {recordHistory=true, resetView=true, strictCustom=false}={}){
  // "layouts"/"helpers" in the document replace the current ones; a document without them keeps them
  // (history snapshots are strict so undo also reverts a layout change).
  const incoming=xbIsObj(obj)?obj:null;
  const custom=incoming&&(strictCustom||'layouts' in incoming||'helpers' in incoming)
    ?{layouts:incoming.layouts,helpers:incoming.helpers}:{layouts:DECK_CONFIG.layouts,helpers:DECK_CONFIG.helpers};
  const next=DeckModel.normalize(obj,xbCatalogFor(obj,custom.layouts),DECK_DEFAULT_CONFIG); // rejects other versions before any change
  xbSyncCustom(custom);
  for(const key of ['layouts','helpers']){if(xbIsObj(custom[key])&&Object.keys(custom[key]).length)next.config[key]=xbClone(custom[key]);else delete next.config[key];}
  const previous={config:DECK_CONFIG,slides,index:currentSlideIndex,sidebar:currentSidebarFilter,gallery:currentGalleryFilter,cache:new Map(DECK_DATA_CACHE)};
  try {
    DECK_CONFIG=next.config;
    slides=next.slides;
    DECK_DATA_CACHE.clear();
    currentSlideIndex=resetView?0:Math.min(currentSlideIndex,slides.length-1);
    if(resetView){currentSidebarFilter='ALL';currentGalleryFilter='ALL';}
    renderCurrentSlide();
    notifyEngine();
  } catch(error) {
    DECK_CONFIG=previous.config;slides=previous.slides;currentSlideIndex=previous.index;xbSyncCustom(DECK_CONFIG);
    currentSidebarFilter=previous.sidebar;currentGalleryFilter=previous.gallery;
    DECK_DATA_CACHE.clear();
    for(const [key,value] of previous.cache) DECK_DATA_CACHE.set(key,value);
    renderCurrentSlide();
    notifyEngine();
    throw error;
  }
  if(recordHistory) trackDeckState();
}
function deckOpenDeckEditor(){const m=document.getElementById('v1-deck-modal'),area=document.getElementById('v1-deck-text');area.value=JSON.stringify(deckDocument(),null,2);document.getElementById('v1-deck-error').textContent='';m.classList.remove('hidden');}
function deckCloseDeckEditor(){document.getElementById('v1-deck-modal').classList.add('hidden');}
function deckApplyDeckEditor(){try{deckApplyDocument(JSON.parse(document.getElementById('v1-deck-text').value));deckCloseDeckEditor();}catch(e){document.getElementById('v1-deck-error').textContent=e.message;}}

const SchemaViewer=createSchemaViewer({getDocument:()=>typeof document!=='undefined'?document:null,getCompiler:()=>XBrainCompiler,getClipboard:()=>typeof navigator!=='undefined'?navigator.clipboard:null,download:(...args)=>downloadTextFile(...args)});
const HeaderMenus=createHeaderMenus({getDocument:()=>typeof document!=='undefined'?document:null});
const XB_ABOUT_BOUND=new WeakSet();
function openHeaderAbout(){
 const modal=document.getElementById('v1-about-modal');modal.classList.remove('hidden');
 if(!XB_ABOUT_BOUND.has(modal)){
  XB_ABOUT_BOUND.add(modal);modal.addEventListener('keydown',event=>{
   event.stopPropagation();if(event.key==='Escape'){event.preventDefault();closeHeaderAbout();return;}
   if(event.key==='Tab'){const buttons=[...modal.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
 }
 modal.querySelector('button').focus();
}
function closeHeaderAbout(){const modal=document.getElementById('v1-about-modal');if(!modal||modal.classList.contains('hidden'))return;modal.classList.add('hidden');document.getElementById('v1-menu-options-trigger').focus();}

if (typeof window !== 'undefined') window.addEventListener('deck-library-loaded', () => {
 const active=document.getElementById('active-slide-viewport');
 if(active) EnhancedRenderers.mount(active);
});

function getDeckGroups(): string[] {
  return getDeckGroupsForSlides(slides);
}

function deckRefreshCounts(){
 const tab=document.querySelector('#tab-btn-gallery span');
 if(tab)tab.textContent='Tổng quan';
 HeaderStatus.render();
 if(typeof document==='undefined')return;
 const groups = getDeckGroups();
 if (currentSidebarFilter !== 'ALL' && !groups.includes(currentSidebarFilter)) currentSidebarFilter = 'ALL';
 if (currentGalleryFilter !== 'ALL' && !groups.includes(currentGalleryFilter)) currentGalleryFilter = 'ALL';

 const sideBar = document.getElementById('sidebar-filter-bar');
 if (sideBar) {
   const allSideActive = currentSidebarFilter === 'ALL';
   const sideButtons = [
     `<button data-click-action="filterSidebarSlides" data-click-arg="'ALL'" id="side-filter-ALL" class="flex-1 min-w-[44px] py-1 px-1.5 rounded text-[11px] font-heading ${allSideActive ? 'font-bold bg-[#F97C00] text-white' : 'font-semibold bg-[#242F2F] text-slate-300 hover:text-white'}">Tất cả</button>`
   ];
   for (const g of groups) {
     const isActive = currentSidebarFilter === g;
     const meta = BUILTIN_GROUP_META[g];
     const label = g === UNGROUPED_FILTER_KEY ? 'Khác' : (meta ? meta.sideLabel : g);
     const title = g === UNGROUPED_FILTER_KEY ? 'Slide không phân nhóm' : (meta ? meta.sideTitle : `Group: ${g}`);
     const safeArg = escapeHtml(g.replace(/'/g, "\\'"));
     const safeId = escapeHtml(g);
     sideButtons.push(
       `<button data-click-action="filterSidebarSlides" data-click-arg="'${safeArg}'" id="side-filter-${safeId}" class="flex-1 min-w-[40px] py-1 px-1.5 rounded text-[11px] font-heading ${isActive ? 'font-bold bg-[#F97C00] text-white' : 'font-semibold bg-[#242F2F] text-slate-300 hover:text-white'} truncate" title="${escapeHtml(title)}">${escapeHtml(label)}</button>`
     );
   }
   sideBar.innerHTML = sideButtons.join('');
 }

 const galBar = document.getElementById('gallery-filter-bar');
 if (galBar) {
   const allGalActive = currentGalleryFilter === 'ALL';
   const galButtons = [
     `<button data-click-action="filterGallery" data-click-arg="'ALL'" id="gal-filter-ALL" class="px-4 py-2 rounded-lg text-xs font-heading font-bold ${allGalActive ? 'bg-[#F97C00] text-white' : 'bg-[#222C2C] text-slate-300 hover:text-white'}">Tất cả (${slides.length})</button>`
   ];
   for (const g of groups) {
     const isActive = currentGalleryFilter === g;
     const count = slides.filter(s => matchesGroupFilter(s, g)).length;
     const meta = BUILTIN_GROUP_META[g];
     const label = g === UNGROUPED_FILTER_KEY
       ? `Chưa phân nhóm (${count})`
       : meta
         ? (g === 'E' ? `${meta.galLabel} (${count})` : `${meta.galLabel} (${count})`)
         : `${g} (${count})`;
     const safeArg = escapeHtml(g.replace(/'/g, "\\'"));
     const safeId = escapeHtml(g);
     galButtons.push(
       `<button data-click-action="filterGallery" data-click-arg="'${safeArg}'" id="gal-filter-${safeId}" class="px-4 py-2 rounded-lg text-xs font-heading font-bold ${isActive ? 'bg-[#F97C00] text-white' : 'bg-[#222C2C] text-slate-300 hover:text-white'}">${escapeHtml(label)}</button>`
     );
   }
   galBar.innerHTML = galButtons.join('');
 }
}



const SLIDE_RENDERERS = createSlideRenderers({
  BRAND_PHOTOS,
  renderStandardWhiteHeader,
  renderStandardWhiteFooter,
  renderAwsPartnerBadge,
  renderBarChart,
  renderDoughnutChart,
});

    const xbSrc = v => Array.isArray(v) ? v.join('\n') : String(v ?? '');
    const xbIsObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
    const xbClone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
    const XB_ERRORS = [];
    const XB_LAYOUT_FNS = new Map();
    const XB_SLIDE_FNS = new Map();
    const XB_CTX = {};

    /* Everything a layout/helper can reference by name inside `render` / `template`. */
    function xbBaseContext() {
      return {
        escapeHtml, escapedContent, renderStandardWhiteHeader, renderStandardWhiteFooter, renderAwsPartnerBadge,
        renderBarChart, renderDoughnutChart, BRAND_PHOTOS, photo: key => BRAND_PHOTOS[key] || '',
        DG_COLORS, dgN, dgClamp, dgLines, dgT, dgR, dgA, dgPage,
        theme: XB_THEME, XO, XT, XTEAL, XMINT, XMINTS, XPEACH, XPEACH2, XGRAY, XLINE, XMUTED, XRED, XB_SERIES,
        fit, ink, xT, xTC, xRect, xArrow, xNum, xFmt, xNice,
        DECK_COLORS, deckSafe, deckChart, deckDiagram, deckComponent, deckMarkdown, deckTable,
        get config() { return DECK_CONFIG; },
        get meta() { return DECK_CONFIG.meta || {}; },
        get slides() { return slides; },
        get XB() { return typeof window !== 'undefined' ? window.XB : (globalThis as any).XB; },
        slide: null
      };
    }
    function xbSetCtx(name, value) {
      Object.defineProperty(XB_CTX, name, { value, writable: true, configurable: true, enumerable: true });
    }
    function xbCompileHelper(name, src) {
      if (typeof src !== 'string' && !Array.isArray(src)) return xbClone(src);
      return new Function('ctx', `with (ctx) { return (${xbSrc(src)}\n); }`)(XB_CTX);
    }
    function xbCompileRender(def, label) {
      const body = def.render !== undefined ? xbSrc(def.render)
        : def.template !== undefined ? 'return `' + xbSrc(def.template) + '`;' : "return '';";
      try {
        return new Function('ctx', `with (ctx) { return function render(slide, index, isThumbnail, c, ce, numStr, layout) {\n${body}\n}; }`)(XB_CTX);
      } catch (e) {
        XB_ERRORS.push(`${label}: ${e.message}`);
        const msg = e.message;
        return () => xbErrorSlide(`${label} không biên dịch được`, msg);
      }
    }
    function xbErrorSlide(title, detail) {
      return `<div style="width:1920px;height:1080px;background:#FFF5ED;color:#425453;padding:120px;font-family:Manrope,Arial,sans-serif;box-sizing:border-box">
        <div style="font-size:22px;font-weight:800;letter-spacing:.1em;color:#F97C00">XBRAIN Presentation as Code · LỖI RENDER</div>
        <div style="font-size:56px;font-weight:800;margin:24px 0">${escapeHtml(title)}</div>
        <pre style="font-size:24px;white-space:pre-wrap;background:#fff;border:2px solid #FBCAAB;border-radius:20px;padding:32px;max-height:560px;overflow:hidden">${escapeHtml(detail)}</pre></div>`;
    }
    function xbApplyLayoutStyles() {
      // Layout CSS is emitted beside each slide by xbRenderCustom, including static builds.
      // Remove stale global CSS nodes left by older exported applications.
      if(typeof document!=='undefined'&&document.head)document.getElementById('v1-layout-style')?.remove();
    }
    /* Rebuild helpers + custom layouts from a config object (DECK_CONFIG or an incoming document). */
    function xbSyncCustom(config) {
      XB_ERRORS.length = 0; XB_LAYOUT_FNS.clear(); XB_SLIDE_FNS.clear();
      for (const k of Object.keys(XB_CTX)) delete XB_CTX[k];
      Object.defineProperties(XB_CTX, Object.getOwnPropertyDescriptors(xbBaseContext()));
      const customConfig=config;
      for (const [name, src] of Object.entries(customConfig?.helpers || {})) {
        try { xbSetCtx(name, xbCompileHelper(name, src)); } catch (e) { XB_ERRORS.push(`helper ${name}: ${e.message}`); }
      }
      for (let i = LAYOUT_CATALOG.length - 1; i >= 0; i--) if (LAYOUT_CATALOG[i].custom) LAYOUT_CATALOG.splice(i, 1);
      for (const [type, d] of Object.entries(customConfig?.layouts || {})) {
        if (!xbIsObj(d)) continue;
        XB_LAYOUT_FNS.set(type, xbCompileRender(d, `layout ${type}`));
        if (!LAYOUT_CATALOG.some(l => l.type === type)) {
          const customGroup = normalizeSlideGroup(d.group);
          LAYOUT_CATALOG.push({ type, ...(customGroup ? { group: customGroup } : {}), name: d.name || type, desc: d.desc || 'Layout tự định nghĩa (Presentation as Code)', limits: d.limits || {}, custom: true });
        }
      }
      xbApplyLayoutStyles(config);
      if (XB_ERRORS.length) console.warn('[xbrain template-as-code]', XB_ERRORS);
    }
    function xbCustomRender(slide) {
      if (slide.render !== undefined || slide.template !== undefined) {
        const key = xbSrc(slide.render ?? slide.template) + (slide.render !== undefined ? '#r' : '#t');
        if (!XB_SLIDE_FNS.has(key)) XB_SLIDE_FNS.set(key, xbCompileRender(slide, `slide ${slide.id}`));
        return XB_SLIDE_FNS.get(key);
      }
      return XB_LAYOUT_FNS.get(slide.type) || null;
    }
    function xbEditAttr(isThumbnail) {
      return (!isThumbnail && isInlineEditEnabled && (typeof document==='undefined'||!document.body?.classList.contains('presentation-fullscreen'))) ? 'contenteditable="true"' : '';
    }
    function xbRenderCustom(fn, slide, index, isThumbnail) {
      const layout = DECK_CONFIG.layouts?.[slide.type] || {};
      const numStr = String(index + 1).padStart(2, '0'), ce = xbEditAttr(isThumbnail), c = slide.content || {};
      xbSetCtx('slide', slide);
      let html = fn(slide, index, isThumbnail, c, ce, numStr, layout);
      const frame = slide.frame !== undefined ? slide.frame : layout.frame;
      if (frame) {
        if (typeof XB_CTX[frame] !== 'function') throw new Error(`frame "${frame}" không phải hàm helper`);
        // Frames (e.g. dgPage) print title/subtitle/note as HTML: give them escaped content; raw stays in opts.raw.
        html = XB_CTX[frame](escapedContent(c), index, html, { slide, isThumbnail, ce, numStr, layout, raw: c });
      }
      const css=xbSlideCss(slide,index,[xbSrc(layout.css),xbSrc(slide.css)].filter(Boolean).join('\n'));
      return `<div data-slide-id="${deckSafe(slide.id||'slide-'+(index+1))}" style="width:100%;height:100%">${css?'<style>'+css+'</style>':''}${html}</div>`;
    }
    /* Built-in "Custom HTML" layout: standard brand header/footer + free HTML from content.html. */
    function renderCustomHtmlSlide(slide, index, isThumbnail) {
      const numStr = String(index + 1).padStart(2, '0'), ce = xbEditAttr(isThumbnail), raw = slide.content || {}, c = escapedContent(raw);
      return `<div class="w-[1920px] h-[1080px] bg-white relative overflow-hidden" style="display:flex;flex-direction:column">
        ${renderStandardWhiteHeader(c.sectionTag || 'CUSTOM', numStr)}
        <div style="position:relative;z-index:10;flex:1;padding:36px 96px 90px;display:flex;flex-direction:column">
          <h1 class="font-heading" style="font-weight:800;font-size:48px;color:#2B3736;margin:0 0 32px" ${ce} data-field="title">${c.title || ''}</h1>
          <div style="flex:1" ${ce} data-field="html">${xbTrustedHtml(raw.html??'','custom-html content.html')}</div>
        </div>
        ${renderStandardWhiteFooter(numStr, false)}
      </div>`;
    }
    function xbSampleFor(type) {
      return DECK_CONFIG.layouts?.[type]?.sample || XB_LAYOUT_SAMPLES[type] || slides.find(s => s.type === type)?.content || null;
    }
    function xbMergeMap(base, patch) {
      const out = { ...(base || {}) };
      for (const [k, v] of Object.entries(patch || {})) { if (v === null) delete out[k]; else if (v !== undefined) out[k] = xbClone(v); }
      return out;
    }
    /* Pack = {layouts?, helpers?, replace?}: merged key by key; a null value removes that key. */
    function xbMergePack(pack, { record = true } = {}) {
      const next = { ...DECK_CONFIG };
      for (const key of ['layouts', 'helpers']) {
        if (pack[key] === undefined) continue;
        const merged = pack.replace ? (xbClone(pack[key]) || {}) : xbMergeMap(DECK_CONFIG[key], pack[key]);
        if (Object.keys(merged).length) next[key] = merged; else delete next[key];
      }
      const apply = () => { DECK_CONFIG = next; xbSyncCustom(DECK_CONFIG); };
      if (record) DeckStore.change(apply); else apply();
      xbRefreshViews();
      return { layouts: Object.keys(DECK_CONFIG.layouts || {}), errors: XB_ERRORS.slice() };
    }
    function xbRefreshViews() {
      if (document.readyState === 'loading') return;
      renderCurrentSlide();
      if (currentAppMode === 'gallery') renderGalleryGrid();
      if (XB_ERRORS.length) xbToast(`Có ${XB_ERRORS.length} lỗi biên dịch layout/helper · xem console`);
    }
    /* Slides that carry their own render/template may use a type that is not in the catalog. */
    /* Catalog used to validate an incoming document: built-in layouts + the layouts it brings
       + slides that carry their own render/template. Nothing is compiled or registered here. */
    function xbCatalogFor(doc, layouts) {
      const list = Array.isArray(doc) ? doc : (doc?.slides || []);
      const base = LAYOUT_CATALOG.filter(l => !l.custom);
      const known = new Set(base.map(l => l.type));
      const extra = [];
      for (const [type, d] of Object.entries(xbIsObj(layouts) ? layouts : {}))
        if (!known.has(type) && xbIsObj(d)) { const g = normalizeSlideGroup((d as any).group); known.add(type); extra.push({ type, ...(g ? { group: g } : {}), name: (d as any).name || type }); }
      for (const s of list)
        if (xbIsObj(s) && s.type && !known.has(s.type) && (s.render !== undefined || s.template !== undefined)) { const g = normalizeSlideGroup(s.group); known.add(s.type); extra.push({ type: s.type, ...(g ? { group: g } : {}), name: s.layoutName || s.type }); }
      return base.concat(extra);
    }
    const XB_VERSION = '1.0';
    function xbRequireVersion(obj, optional) {
      if (optional && obj.version === undefined) return;
      if (obj.version !== XB_VERSION) throw new Error('Expected JSON schema version ' + XB_VERSION);
    }
    /* Import any JSON: pack (layouts/helpers only), copied slides payload, or a whole deck document. */
    function xbImportAny(obj, gap) {
      const hasSlides = Array.isArray(obj) || Array.isArray(obj?.slides);
      const packLike = xbIsObj(obj) && ('layouts' in obj || 'helpers' in obj);
      if (!hasSlides && packLike) {
        xbRequireVersion(obj, true); // packs may omit version; any other version is rejected
        const r = xbMergePack(obj);
        xbToast(`Đã nạp pack · ${r.layouts.length} layout tự định nghĩa${r.errors.length ? ' · ' + r.errors.length + ' lỗi (xem console)' : ''}`);
        return 'pack';
      }
      if (xbIsObj(obj) && obj.xbrainSlides) {
        const list = xbSlidesFromPayload(obj);
        if (!list.length) throw new Error('Không có slide hợp lệ trong dữ liệu');
        insertSlidesAt(list.map(xbMakeSlide), gap ?? currentSlideIndex + 1, 'Đã chèn');
        return 'slides';
      }
      deckApplyDocument(obj);
      return 'deck';
    }

    /* ==========================================================================
       HEADER / FOOTER ("chrome") — editable inline, then applied to this slide, a range or all.
       content keys live in each slide's content; deck keys default to DECK_CONFIG.chrome and
       can be overridden per slide in slide.chrome.
       ========================================================================== */
    const XB_CHROME_FIELDS = {
      sectionTag: { label: 'Nhãn chương (header)', store: 'content' },
      headerLabel: { label: 'Dòng chữ góc phải header', store: 'deck', fallback: 'XBrain Presentation System v1.0.0' },
      website: { label: 'Website (footer)', store: 'deck', fallback: 'www.xbrain.com.vn' },
      address: { label: 'Địa chỉ (footer)', store: 'deck', fallback: 'Vietnam Innovation Hub Town, 179 Tran Hung Dao, Da Nang City' },
      footer: { label: 'Chân trang (slide Composer)', store: 'content' },
      source: { label: 'Nguồn dữ liệu (footer Composer)', store: 'content' },
    };
    let XB_RENDER_CTX = null; // {slide, ce} of the slide being rendered, read by the shared header/footer helpers
    function xbChrome(key, slide = XB_RENDER_CTX?.slide) {
      return slide?.chrome?.[key] ?? DECK_CONFIG.chrome?.[key] ?? XB_CHROME_FIELDS[key]?.fallback ?? '';
    }
    function xbChromeAttr(key) { return `${XB_RENDER_CTX?.ce || ''} data-chrome="${key}"`; }

    function renderSlideHTML(slide, index, isThumbnail = false) {
      const previousCtx = XB_RENDER_CTX;
      XB_RENDER_CTX = { slide, ce: xbEditAttr(isThumbnail) };
      try {
        const custom = xbCustomRender(slide);
        if (custom) return xbRenderCustom(custom, slide, index, isThumbnail);
        if (slide.type === 'composer') return deckComposer(slide,index,isThumbnail);
        if (slide.type === 'custom-html') return renderCustomHtmlSlide(slide,index,isThumbnail);
        if (DIAGRAM_TYPES.has(slide.type)) return renderDiagramSlide(slide,index);
        const renderer = SLIDE_RENDERERS[slide.type];
        if (!renderer) return xbErrorSlide(`Không có layout "${slide.type}"`, 'Thêm layout này qua "layouts" trong JSON (pack) hoặc window.XB.defineLayout, hoặc cho slide một "render"/"template" riêng.');
        const numStr = String(index + 1).padStart(2, '0');
        const ce = (!isThumbnail && isInlineEditEnabled && (typeof document==='undefined'||!document.body?.classList.contains('presentation-fullscreen'))) ? 'contenteditable="true"' : '';
        return renderer({slide,index,isThumbnail,numStr,ce,c:escapedContent(slide.content || {})});
      } catch (e) {
        if (XBDiag.active) XBDiag.report('render.exception', 'error', `${slide && slide.type}: ${e.message}`);
        else console.error('[xbrain render]', slide && slide.type, e);
        return xbErrorSlide(`Slide ${String(index + 1).padStart(2, '0')} · ${slide && slide.type}`, e.stack || e.message);
      } finally {
        XB_RENDER_CTX = previousCtx;
      }
    }
    xbSyncCustom(DECK_CONFIG);

    /* ==========================================================================
       PHASE 4.3 – 4.7 — PRESENTATION ENGINE, SCALING, GALLERY, CHARTS & EXPORT
       ========================================================================== */
    let currentSlideIndex = 0;
    let currentSidebarFilter = 'ALL';
    let currentGalleryFilter = 'ALL';
    let isInlineEditEnabled = true;
    let currentAppMode = 'workspace';


    function updateCanvasScale() {
      const workspace = document.getElementById('main-workspace');
      const wrapper = document.getElementById('canvas-scale-wrapper');
      const viewport = document.getElementById('active-slide-viewport');
      if (!workspace || !wrapper || !viewport) return;

      const isFullscreen = document.body.classList.contains('presentation-fullscreen');
      const padX = isFullscreen ? 0 : 56;
      const padY = isFullscreen ? 0 : 88;

      const availW = Math.max(120, workspace.clientWidth - padX);
      const availH = Math.max(100, workspace.clientHeight - padY);

      const scale = Math.min(availW / 1920, availH / 1080);

      wrapper.style.width = `${Math.floor(1920 * scale)}px`;
      wrapper.style.height = `${Math.floor(1080 * scale)}px`;
      viewport.style.transform = `scale(${scale})`;
    }

    /* 2. Render Active Slide & Sync Editable DOM Changes */
    const XB_INLINE_BOUND=new WeakSet();
    function renderCurrentSlide() {
      const viewport = document.getElementById('active-slide-viewport');
      if (!viewport || slides.length === 0) return;

      if (currentSlideIndex >= slides.length) currentSlideIndex = slides.length - 1;
      if (currentSlideIndex < 0) currentSlideIndex = 0;

      const slide = slides[currentSlideIndex];
      EnhancedRenderers.dispose(viewport);
      viewport.innerHTML = renderSlideHTML(slide, currentSlideIndex, false);
      deckRefreshCounts();
      requestAnimationFrame(() => EnhancedRenderers.mount(viewport));
      viewport.querySelectorAll('[contenteditable="true"]:not([data-field]):not([data-chrome])').forEach(el=>el.removeAttribute('contenteditable'));
      // Delegate editing events once; handlers resolve the current slide at event time.
      if(!XB_INLINE_BOUND.has(viewport)){
        XB_INLINE_BOUND.add(viewport);
        viewport.addEventListener('focusin',event=>{
          const el=event.target.closest('[contenteditable="true"][data-chrome]');if(el)el.dataset.v1Before=el.textContent.trim();
        });
        viewport.addEventListener('keydown',event=>{
          if(event.key==='Enter'&&event.target.closest('[data-chrome]')){event.preventDefault();event.target.blur();}
        });
        viewport.addEventListener('focusout',event=>{
          const el=event.target.closest('[contenteditable="true"]');if(!el)return;
          const slide=slides[currentSlideIndex];if(!slide)return;
          if(el.dataset.chrome){const value=el.textContent.trim();if(value!==el.dataset.v1Before&&XB_CHROME_FIELDS[el.dataset.chrome])xbOpenChromeDialog(el.dataset.chrome,value);return;}
          const field=el.getAttribute('data-field');if(!field)return;
          let parent=slide.type==='composer'?xbResolveComposerRoot(slide):slide.content;
          const keys=field.split('.');
          for(const key of keys.slice(0,-1))parent=parent&&Object.prototype.hasOwnProperty.call(parent,key)?parent[key]:undefined;
          const key=keys.at(-1);if(!parent||!Object.prototype.hasOwnProperty.call(parent,key))return;
          const old=parent[key],keepHtml=(slide.type==='custom-html'&&field==='html')||(XB_LAYOUT_FNS.has(slide.type)&&/<[a-z!\/]/i.test(String(old??'')));
          let value=keepHtml?el.innerHTML.trim():el.innerText.trim();
          if(typeof old==='number'){
            if(!value||!Number.isFinite(Number(value))){el.textContent=String(old);alert('Giá trị số không hợp lệ: '+field);return;}value=Number(value);
          }
          if(value!==old){DeckStore.change(()=>{parent[key]=value;});renderSidebarList();}
        });
      }

      // Update Counter & Badges
      const totalStr = String(slides.length).padStart(2, '0');
      const curStr = String(currentSlideIndex + 1).padStart(2, '0');
      const counterEl = document.getElementById('slide-counter-badge');
      const layoutEl = document.getElementById('active-layout-badge');
      const groupEl = document.getElementById('active-group-badge');

      if (counterEl) counterEl.textContent = `${curStr} / ${totalStr}`;
      if (layoutEl) layoutEl.textContent = slide.layoutName || slide.type;
      if (groupEl) {
        const badgeText = formatGroupBadge(slide.group, 'long');
        if (badgeText) {
          groupEl.textContent = badgeText;
          groupEl.className = `text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded ${getGroupBadgeClass(slide.group)}`;
        } else {
          groupEl.textContent = '';
          groupEl.className = 'hidden';
        }
      }
      updateCanvasScale();
      renderSidebarList();
      renderInlineIcons();
      notifyEngine();
    }


    /* 4. Sidebar Slide List & Filtering */
    function filterSidebarSlides(group) {
      currentSidebarFilter = group;
      deckRefreshCounts();
      renderSidebarList();
      notifyEngine();
    }

    function renderSidebarList() {
      const container = document.getElementById('sidebar-slide-list');
      if (!container) return;
      syncSlideSelection();

      container.innerHTML = slides.map((s, idx) => {
        if (!matchesGroupFilter(s, currentSidebarFilter)) return '';
        const isActive = idx === currentSlideIndex;
        const num = String(idx + 1).padStart(2, '0');
        const headline = escapeHtml(s.content?.title || s.content?.titleLine1 || s.content?.headline || s.content?.sectionTag || s.layoutName);
        const shortBadge = formatGroupBadge(s.group, 'short');
        const groupColor = getGroupBadgeClass(s.group);

        return `
          <div draggable="true" data-slide-index="${idx}" data-click-action="sidebarClick" data-click-arg="event" title="Kéo để di chuyển · giữ Ctrl khi thả để sao chép · Ctrl/Shift+click để chọn nhiều · chuột phải để xem thao tác" class="cursor-pointer rounded-xl p-3 transition-all border ${isActive ? 'bg-[#263333] border-[#F97C00] shadow-md' : 'bg-[#151C1C] border-[#263232] hover:border-[#3E5050]'}${!isActive && selectedSlideIds.has(s.id) ? ' v1-selected' : ''}${cutState?.ids.has(s.id) ? ' v1-cut' : ''}">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md ${isActive ? 'bg-[#F97C00] text-white' : 'bg-[#242F2F] text-slate-300'} font-heading font-extrabold text-[11px] flex items-center justify-center">${num}</span>
                <span class="font-heading font-bold text-xs ${isActive ? 'text-white' : 'text-slate-300'} truncate max-w-[130px]">${escapeHtml(s.layoutName)}</span>
              </div>
              ${shortBadge ? `<span class="text-[10px] font-heading font-bold px-1.5 py-0.5 rounded max-w-[84px] truncate ${groupColor}">${escapeHtml(shortBadge)}</span>` : ''}
            </div>
            <p class="text-[11px] text-slate-400 truncate pl-8">${headline}</p>
          </div>
        `;
      }).join('');
    }

    function selectSlide(idx) {
      currentSlideIndex = idx;
      if (currentAppMode !== 'workspace') {
        switchAppMode('workspace');
      } else {
        renderCurrentSlide();
      }
      notifyEngine();
    }

    function nextSlide() {
      if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
      } else {
        currentSlideIndex = 0;
      }
      renderCurrentSlide();
      notifyEngine();
    }

    function prevSlide() {
      if (currentSlideIndex > 0) {
        currentSlideIndex--;
      } else {
        currentSlideIndex = slides.length - 1;
      }
      renderCurrentSlide();
      notifyEngine();
    }

    /* 5. Template Gallery Mode (Live Scaled 1920x1080 Previews) */
    function filterGallery(group) {
      currentGalleryFilter = group;
      deckRefreshCounts();
      renderGalleryGrid();
      notifyEngine();
    }

    function renderGalleryGrid() {
      const grid = document.getElementById('gallery-grid-container');
      if (!grid) return;
      deckRefreshCounts();

      grid.innerHTML = slides.map((s, idx) => {
        if (!matchesGroupFilter(s, currentGalleryFilter)) return '';
        const num = String(idx + 1).padStart(2, '0');
        const catMeta = LAYOUT_CATALOG.find(l => l.type === s.type) || {};
        const longBadge = formatGroupBadge(s.group, 'long');
        const badgeClass = getGroupBadgeClass(s.group);
        // Thumbnail scale: 440px wide / 1920px = 0.229166
        return `
          <div draggable="true" data-slide-index="${idx}" data-click-action="galleryClick" data-click-arg="event" title="Kéo để sắp xếp · giữ Ctrl khi thả để sao chép · Ctrl/Shift+click để chọn nhiều" class="group cursor-pointer bg-[#1C2525] border border-[#2E3C3C] hover:border-[#F97C00] rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col${selectedSlideIds.has(s.id) ? ' v1-selected' : ''}${cutState?.ids.has(s.id) ? ' v1-cut' : ''}">
            <!-- Scaled 16:9 Live Preview Box -->
            <div class="relative w-full pt-[56.25%] bg-black overflow-hidden">
              <div class="gallery-thumb-scaler absolute top-0 left-0 origin-top-left pointer-events-none" style="width:1920px; height:1080px;">
                ${renderSlideHTML(s, idx, true)}
              </div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center">
                <span class="opacity-0 group-hover:opacity-100 transition-all px-4 py-2 rounded-full bg-[#F97C00] text-white font-heading font-bold text-xs shadow-lg">
                  Mở Slide ${num} Trong Studio →
                </span>
              </div>
            </div>
            <!-- Card Footer -->
            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-heading font-extrabold text-[#FF991D]">Slide ${num} • ${escapeHtml(s.layoutName)}</span>
                  ${longBadge ? `<span class="text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded ${badgeClass}">${escapeHtml(longBadge)}</span>` : ''}
                </div>
                <p class="text-xs text-slate-300 line-clamp-2">${catMeta.desc || ''}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Scale all gallery thumbnails accurately to fit their responsive card width
      requestAnimationFrame(() => {
        document.querySelectorAll('.gallery-thumb-scaler').forEach(el => {
          const parentW = el.parentElement.clientWidth;
          const sc = parentW / 1920;
          el.style.transform = `scale(${sc})`;
        });
      });
    }

    /* 6. Mode Switching (Workspace / Gallery / Brand Design System) */
    function switchAppMode(mode) {
      currentAppMode = mode;
      const studio = document.getElementById('studio-view');
      const gallery = document.getElementById('gallery-view');
      const brand = document.getElementById('brand-system-view');

      studio?.classList.add('hidden');
      gallery?.classList.add('hidden');
      brand?.classList.add('hidden');

      HeaderMenus.close(false);
      HeaderStatus.render();

      if (mode === 'workspace') {
        studio?.classList.remove('hidden');
        renderCurrentSlide();
      } else if (mode === 'gallery') {
        gallery?.classList.remove('hidden');
        renderGalleryGrid();
      } else if (mode === 'brand') {
        brand?.classList.remove('hidden');
      }
      notifyEngine();
    }

    /* 7. Inline Editing Toggle */
    function toggleInlineEdit() {
      isInlineEditEnabled = !isInlineEditEnabled;
      const viewport = document.getElementById('active-slide-viewport');
      const label = document.getElementById('edit-mode-label');
      if (isInlineEditEnabled) {
        viewport?.classList.add('edit-mode-active');
        if (label) label.textContent = 'Chỉnh sửa trực tiếp';
      } else {
        viewport?.classList.remove('edit-mode-active');
        if (label) label.textContent = 'Chỉnh sửa trực tiếp';
      }
      renderCurrentSlide();
      notifyEngine();
    }

    /* 8. Fullscreen Presentation Mode */
    let restoreEditAfterFullscreen = null;
    function startFullscreenPresentation() {
      if (currentAppMode !== 'workspace') switchAppMode('workspace');
      if (restoreEditAfterFullscreen === null) restoreEditAfterFullscreen=isInlineEditEnabled;
      isInlineEditEnabled=false;
      document.body.classList.add('presentation-fullscreen');
      renderCurrentSlide();
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }
      requestAnimationFrame(updateCanvasScale);
    }

    function exitFullscreenPresentation() {
      document.body.classList.remove('presentation-fullscreen');
      if (restoreEditAfterFullscreen !== null) {isInlineEditEnabled=restoreEditAfterFullscreen;restoreEditAfterFullscreen=null;}
      renderCurrentSlide();
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setTimeout(updateCanvasScale, 100);
    }

    function toggleFullscreenPresentation() {
      if (document.body.classList.contains('presentation-fullscreen')) {
        exitFullscreenPresentation();
      } else {
        startFullscreenPresentation();
      }
    }

    if (typeof document !== 'undefined') document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && document.body.classList.contains('presentation-fullscreen')) {
        document.body.classList.remove('presentation-fullscreen');
        if (restoreEditAfterFullscreen !== null) {isInlineEditEnabled=restoreEditAfterFullscreen;restoreEditAfterFullscreen=null;}
        renderCurrentSlide();
        requestAnimationFrame(updateCanvasScale);
      }
    });

    /* 9. Add Slide Modal & Duplicate / Delete Slide */
    function openAddSlideModal() {
      const modal = document.getElementById('modal-add-slide');
      const grid = document.getElementById('modal-layout-picker-grid');
      if (!modal || !grid) return;

      grid.innerHTML = LAYOUT_CATALOG.map(item => {
        const badgeText = formatGroupBadge(item.group, 'long');
        const badgeClass = getGroupBadgeClass(item.group);
        return `
        <div data-click-action="addSlideByType" data-click-arg="'${item.type}'" class="cursor-pointer p-4 rounded-xl bg-[#141B1B] hover:bg-[#253232] border border-[#2D3B3B] hover:border-[#F97C00] transition-all flex flex-col justify-between">
          <div>
            ${badgeText ? `<span class="text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded ${badgeClass}">${escapeHtml(badgeText)}</span>` : `<span class="text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded bg-slate-700/40 text-slate-300">Tùy chọn</span>`}
            <h4 class="font-heading font-bold text-sm text-white mt-2">${item.name}</h4>
            <p class="text-xs text-slate-400 mt-1">${item.desc}</p>
          </div>
          <div class="mt-3 text-xs font-heading font-bold text-[#7FD7BB] flex items-center gap-1">
            <span>+ Chèn layout này</span>
          </div>
        </div>
      `;
      }).join('');

      modal.classList.remove('hidden');
    }

    function closeAddSlideModal() {
      document.getElementById('modal-add-slide').classList.add('hidden');
    }

    function addSlideByType(type) {
      const templateSlide = slides.find(s => s.type === type);
      const newSlide = templateSlide ? JSON.parse(JSON.stringify(templateSlide)) : xbMakeSlide({type, content: xbClone(xbSampleFor(type) || {})});
      newSlide.id = newSlideId();
      DeckStore.change(()=>{slides.splice(currentSlideIndex + 1, 0, newSlide);currentSlideIndex++;});
      closeAddSlideModal();
      switchAppMode('workspace');
    }

    function DuplicateCurrentSlide() {
      const copy = JSON.parse(JSON.stringify(slides[currentSlideIndex]));
      copy.id = 'slide-' + Date.now();
      DeckStore.change(()=>{slides.splice(currentSlideIndex + 1, 0, copy);currentSlideIndex++;});
      renderCurrentSlide();
    }

    function deleteCurrentSlide() {
      if (slides.length <= 1) return;
      DeckStore.change(()=>{
        slides.splice(currentSlideIndex, 1);
        if (currentSlideIndex >= slides.length) currentSlideIndex = slides.length - 1;
      });
      closeDataEditorModal();
      renderCurrentSlide();
    }

    /* 10. JSON Content Editor Modal */
    function openDataEditorModal() {
      const modal = document.getElementById('modal-json-editor');
      const textarea = document.getElementById('json-editor-textarea');
      const err = document.getElementById('json-editor-error');
      err.classList.add('hidden');
      textarea.value = JSON.stringify(slides[currentSlideIndex], null, 2);
      modal.classList.remove('hidden');
    }

    function closeDataEditorModal() {
      document.getElementById('modal-json-editor').classList.add('hidden');
    }

    function applyJsonEditorChanges() {
      const textarea = document.getElementById('json-editor-textarea');
      const err = document.getElementById('json-editor-error');
      try {
        const parsed = JSON.parse(textarea.value);
        const ownCode = parsed && (parsed.render!==undefined || parsed.template!==undefined);
        if (!parsed || !(LAYOUT_CATALOG.some(item=>item.type===parsed.type) || (ownCode && parsed.type)) || (parsed.type!=='composer' && (!parsed.content || typeof parsed.content!=='object' || Array.isArray(parsed.content)))) {
          throw new Error('type chưa được đăng ký hoặc content không hợp lệ.');
        }
        const meta = LAYOUT_CATALOG.find(item=>item.type===parsed.type) || {group: normalizeSlideGroup(parsed.group), name: parsed.layoutName || parsed.type};
        parsed.id = slides[currentSlideIndex].id;
        const resolvedGroup = (parsed.group === null || parsed.group === '')
          ? undefined
          : normalizeSlideGroup(parsed.group, meta.group);
        if (resolvedGroup) parsed.group = resolvedGroup;
        else delete parsed.group;
        parsed.layoutName = (typeof parsed.layoutName === 'string' && parsed.layoutName.trim()) ? parsed.layoutName.trim() : meta.name.replace(/^\d+\. /,'');
        DeckStore.change(()=>{slides[currentSlideIndex] = parsed;});
        closeDataEditorModal();
        renderCurrentSlide();
      } catch (e) {
        err.textContent = 'Lỗi cú pháp JSON: ' + e.message;
        err.classList.remove('hidden');
      }
    }

    function downloadTextFile(name, text, mime='application/json;charset=utf-8') {
      const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    function saveDeckJSON() {
      downloadTextFile('xbrain-presentation-data-v1.json',JSON.stringify(deckDocument(),null,2));
    }
    function importDeckJSON(){document.getElementById('import-deck-json').click();}
    async function receiveDeckJSON(evt){
      const f=evt.target.files?.[0];if(!f)return;
      try{const kind=xbImportAny(JSON.parse(await f.text()));if(kind==='deck')switchAppMode('workspace');}
      catch(err){alert('JSON import: '+err.message);}finally{evt.target.value='';}
    }
    function buildEditedHTML() {
      if (document.querySelector('script[type="module"][src*="/@vite/client"], script[type="module"][src$="/src/main.tsx"]')) {
        throw Error('Không thể xuất HTML độc lập từ Vite dev. Chạy npm run build và mở dist/index.html để xuất.');
      }
      const doc=document.documentElement.cloneNode(true);
      for(const el of doc.querySelectorAll('#v1-toast,#v1-slide-menu,#v1-chrome-dialog,.v1-drop-line,.v1-drag-ghost,#v1-layout-style'))el.remove();
      doc.querySelector('body')?.classList.remove('presentation-fullscreen');
      for(const selector of ['#print-all-slides-container','#gallery-grid-container','#sidebar-slide-list','#active-slide-viewport']){const el=doc.querySelector(selector);if(el)el.innerHTML='';}
      doc.querySelector('#canvas-scale-wrapper')?.removeAttribute('style');
      doc.querySelector('#active-slide-viewport')?.removeAttribute('style');
      for(const selector of ['#v1-schema-json','#v1-schema-status'])doc.querySelector(selector)?.replaceChildren();
      const agentConsole=doc.querySelector('#v1-agent-console');
      if(agentConsole){agentConsole.hidden=true;for(const selector of ['.v1-agent-tree','.v1-agent-output','.v1-agent-log','.v1-agent-findings'])agentConsole.querySelector(selector)?.replaceChildren();for(const input of agentConsole.querySelectorAll('textarea')){input.value='';input.replaceChildren();}for(const input of agentConsole.querySelectorAll('input')){input.value='';input.checked=false;input.removeAttribute('value');input.removeAttribute('checked');}const preview=agentConsole.querySelector('.v1-agent-preview');preview?.removeAttribute('data-run-id');preview?.removeAttribute('data-slide-id');agentConsole.querySelector('iframe')?.removeAttribute('srcdoc');}
      doc.querySelector('#app-shell')?.removeAttribute('inert');
      doc.querySelector('#v1-schema-trigger')?.setAttribute('aria-expanded','false');
      for(const menu of doc.querySelectorAll('.v1-header-menu'))menu.hidden=true;
      for(const trigger of doc.querySelectorAll('[data-v1-menu-trigger]'))trigger.setAttribute('aria-expanded','false');
      for(const modal of doc.querySelectorAll('.v1-modal,#modal-content-editor,#modal-json-editor,#modal-add-slide'))modal.classList.add('hidden');
      doc.querySelector('#studio-view')?.classList.remove('hidden');
      doc.querySelector('#gallery-view')?.classList.add('hidden');
      doc.querySelector('#brand-system-view')?.classList.add('hidden');
      const boot=doc.querySelector('#v1-embedded-deck');
      if(!boot)throw Error('Missing embedded document container');
      boot.textContent=JSON.stringify(deckDocument()).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
      return '<!DOCTYPE html>\n'+doc.outerHTML;
    }
    function downloadEditedHTML() {
      try { downloadTextFile('index-edited.html',buildEditedHTML(),'text/html;charset=utf-8'); }
      catch (error) { alert(error.message); }
    }
    function walkContent(data,path=[],out=[]) {
      if(Array.isArray(data)) data.forEach((v,i)=>walkContent(v,[...path,i],out));
      else if(data&&typeof data==='object') Object.entries(data).forEach(([k,v])=>walkContent(v,[...path,k],out));
      else if(typeof data==='string'||typeof data==='number') {
        const key=String(path.at(-1)||'');
        if(!['color','badgeColor','icon'].includes(key)) out.push({path,value:String(data??'')});
      }
      return out;
    }
    function openContentEditorModal() {
      const form=document.getElementById('content-editor-fields');form.innerHTML='';
      const current=slides[currentSlideIndex];
      const editableScope=current.type==='composer'?xbResolveComposerRoot(current):current.content;
      for(const item of walkContent(editableScope)) {
        const label=document.createElement('label');label.className='flex flex-col gap-1 text-sm';
        const caption=document.createElement('span');caption.textContent=item.path.join(' › ');caption.className='text-[#FF991D] font-bold';label.appendChild(caption);
        const field=document.createElement(item.value.length>110?'textarea':'input');
        if(field.tagName==='INPUT')field.type='text';
        else field.rows=3;
        field.value=item.value;field.dataset.path=JSON.stringify(item.path);field.className='bg-[#111717] border border-[#3B4A4A] p-3 rounded-lg text-white text-sm w-full';
        label.appendChild(field);form.appendChild(label);
      }
      document.getElementById('modal-content-editor').classList.remove('hidden');
    }
    function closeContentEditorModal(){document.getElementById('modal-content-editor').classList.add('hidden');}
    function applyContentEditor(){
      const current=slides[currentSlideIndex];
      const d=current.type==='composer'?xbResolveComposerRoot(current):current.content,updates=[];
      for(const el of document.querySelectorAll('#content-editor-fields [data-path]')){
        const path=JSON.parse(el.dataset.path);let target=d;
        for(const key of path.slice(0,-1))target=target&&Object.prototype.hasOwnProperty.call(target,key)?target[key]:undefined;
        const key=path.at(-1);if(!target||!Object.prototype.hasOwnProperty.call(target,key))return;
        let value=el.value;
        if(typeof target[key]==='number'){
          if(!value.trim()||!Number.isFinite(Number(value))){el.setAttribute('aria-invalid','true');el.focus();alert('Giá trị số không hợp lệ: '+path.join(' › '));return;}
          value=Number(value);
        }
        el.removeAttribute('aria-invalid');updates.push({target,key,value});
      }
      DeckStore.change(()=>{for(const {target,key,value} of updates)target[key]=value;});
      closeContentEditorModal();renderCurrentSlide();
    }


    /* QA in the editor uses the same compiler as agents (editor parity: legacy sample data allowed,
       document code trusted) plus pixel measurement of every rendered slide. */
    function xbEditorQA(measure){return XBrainCompiler.qa(deckDocument(),{strict:false,trust:'trusted',measure});}
    function xbDiagLine(d){const m=/^\/slides\/(\d+)(.*)$/.exec(d.path||'');return `${d.severity==='error'?'✖':'⚠'} ${m?'Slide '+(Number(m[1])+1)+(m[2]?' '+m[2].replace(/^\//,'').replace(/\//g,' › '):''):(d.path||'deck')}: ${d.message}`;}
    function runDeckQA(){
      let report;try{report=xbEditorQA(true);}catch(e){alert('QA: '+e.message);return [];}
      HeaderStatus.checked(JSON.stringify(deckDocument()),report.summary);
      const lines=report.diagnostics.filter(d=>d.severity!=='info').map(xbDiagLine);
      alert(lines.length?`Phát hiện ${report.summary.errors} lỗi, ${report.summary.warnings} cảnh báo (điểm ${Math.round(report.summary.score)}/100):\n\n${lines.slice(0,18).join('\n')}${lines.length>18?'\n… và '+(lines.length-18)+' mục khác (XB.qa() trong console để xem đủ)':''}`:
        `Đã kiểm tra ${slides.length} slide: không phát hiện lỗi dữ liệu, bố cục hay tràn chữ.

Lưu ý: vẫn nên kiểm tra trực quan trên máy chiếu.`);
      return lines;
    }
    function exportPrintPDF() {
      let report=null;try{report=xbEditorQA(false);}catch(e){console.warn('[xbrain qa]',e);}
      const issues=report?report.diagnostics.filter(d=>d.severity!=='info'):[];
      if(issues.length && !confirm(`QA: ${report.summary.errors} lỗi, ${report.summary.warnings} cảnh báo (vd. ${xbDiagLine(issues[0])}). Vẫn in PDF?`)) return;
      const printContainer = document.getElementById('print-all-slides-container');
      if (!printContainer) return;

      printContainer.innerHTML = slides.map((s, idx) => `
        <div class="print-slide-page">
          ${renderSlideHTML(s, idx, true)}
        </div>
      `).join('');

      requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    }


    /* V2 state: undo/redo, opt-in local draft, and content limits. */
    const HeaderStatus=createHeaderStatus({getDocument:()=>typeof document!=='undefined'?document:null,getInfo:()=>({name:DECK_CONFIG.metadata?.name===DECK_DEFAULT_CONFIG.metadata.name?'Bộ trình chiếu mẫu':DECK_CONFIG.metadata?.name,count:slides.length,inline:isInlineEditEnabled,mode:currentAppMode})});
    const DeckHistory=createDeckHistory({
      serialize:()=>JSON.stringify(deckDocument()),
      onChange:state=>{HeaderStatus.changed(state);XBAgent.observeStudio(state.snapshot);notifyEngine();},
      restore:snapshot=>deckApplyDocument(JSON.parse(snapshot), {recordHistory:false,resetView:false,strictCustom:true})
    });
    const DeckStore = {
      change(update){update();DeckHistory.record();notifyEngine();}
    };
    function trackDeckState(){DeckHistory.record();}
    function undoDeck(){DeckHistory.undo();}
    function redoDeck(){DeckHistory.redo();}
    const DraftRepository=createDraftRepository(()=>localStorage);
    function saveLocalDraft(){
      try{const doc=deckDocument(),when=DraftRepository.save(doc);HeaderStatus.saved(JSON.stringify(doc),when);xbToast('Đã lưu nháp trong trình duyệt.');}
      catch(err){HeaderStatus.saveFailed();xbToast('Không lưu được bản nháp. Hãy dùng Xuất → Dữ liệu JSON.');}
    }
    function restoreLocalDraft(){
      try {const o=DraftRepository.load();if(!o)throw Error('Chưa có bản nháp');if(!Array.isArray(o.slides))throw Error('Dữ liệu bản nháp không hợp lệ');
        if(!confirm('Thay bộ slide hiện tại bằng bản nháp đã lưu?'))return;
        deckApplyDocument(o);HeaderStatus.saved(JSON.stringify(deckDocument()),o.savedAt||'không có thời gian');currentSlideIndex=0;renderCurrentSlide();}
      catch(err){alert('Không mở được bản nháp: '+err.message);}
    }
    if (typeof window !== 'undefined') window.addEventListener('keydown', event => {
      const active=document.activeElement;
      const editing=active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
      if(event.key==='Escape') {
        if(document.body.classList.contains('presentation-fullscreen')) exitFullscreenPresentation();
        closeAddSlideModal();closeDataEditorModal();closeContentEditorModal();
        deckCloseLibrary();deckCloseDeckEditor();SchemaViewer.close();closeHeaderAbout();HeaderMenus.close();
        return;
      }
      if(editing) return;
      if(event.ctrlKey||event.metaKey) {
        if(event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redoDeck():undoDeck();}
        else if(event.key.toLowerCase()==='y'){event.preventDefault();redoDeck();}
        return;
      }
      const modalOpen=['modal-add-slide','modal-json-editor','modal-content-editor','v1-visual-modal','v1-deck-modal','v1-schema-modal','v1-about-modal']
        .some(id=>!document.getElementById(id).classList.contains('hidden'));
      if(currentAppMode!=='workspace'||modalOpen) return;
      if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();nextSlide();}
      else if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();prevSlide();}
    });

    if (typeof window !== 'undefined') window.addEventListener('resize', () => {
      updateCanvasScale();
      if (currentAppMode === 'gallery') {
        document.querySelectorAll('.gallery-thumb-scaler').forEach(el => {
          const parentW = el.parentElement.clientWidth;
          el.style.transform = `scale(${parentW / 1920})`;
        });
      }
    });

    // AppController: event delegation works for both static and rendered controls.
    const AppController = (() => {
      const actions = {
        toggleHeaderMenu: name => HeaderMenus.toggle(name),
        openHeaderAbout: openHeaderAbout,
        closeHeaderAbout: closeHeaderAbout,
        DuplicateCurrentSlide: DuplicateCurrentSlide,
        addSlideByType: addSlideByType,
        applyContentEditor: applyContentEditor,
        applyJsonEditorChanges: applyJsonEditorChanges,
        closeAddSlideModal: closeAddSlideModal,
        closeContentEditorModal: closeContentEditorModal,
        closeDataEditorModal: closeDataEditorModal,
        deckAddVisual: deckAddVisual,
        deckApplyDeckEditor: deckApplyDeckEditor,
        deckCloseDeckEditor: deckCloseDeckEditor,
        deckCloseLibrary: deckCloseLibrary,
        deckOpenSchema: () => SchemaViewer.open(),
        deckCloseSchema: () => SchemaViewer.close(),
        deckCopySchema: () => SchemaViewer.copy(),
        deckDownloadSchema: () => SchemaViewer.save(),
        deckFilterLibrary: deckFilterLibrary,
        deckOpenDeckEditor: deckOpenDeckEditor,
        deckOpenLibrary: deckOpenLibrary,
        openAgentConsole: () => AgentConsole.open(),
        deckReloadRemote: deckReloadRemote,
        deleteCurrentSlide: deleteCurrentSlide,
        downloadEditedHTML: downloadEditedHTML,
        exportPrintPDF: exportPrintPDF,
        filterGallery: filterGallery,
        filterSidebarSlides: filterSidebarSlides,
        galleryClick: galleryClick,
        sidebarClick: sidebarClick,
        importDeckJSON: importDeckJSON,
        nextSlide: nextSlide,
        openAddSlideModal: openAddSlideModal,
        openContentEditorModal: openContentEditorModal,
        openDataEditorModal: openDataEditorModal,
        prevSlide: prevSlide,
        receiveDeckJSON: receiveDeckJSON,
        redoDeck: redoDeck,
        restoreLocalDraft: restoreLocalDraft,
        runDeckQA: runDeckQA,
        saveDeckJSON: saveDeckJSON,
        saveLocalDraft: saveLocalDraft,
        selectSlide: selectSlide,
        startFullscreenPresentation: startFullscreenPresentation,
        switchAppMode: switchAppMode,
        toggleFullscreenPresentation: toggleFullscreenPresentation,
        toggleInlineEdit: toggleInlineEdit,
        undoDeck: undoDeck
      };
      function dispatch(event, kind) {
        const element = event.target.closest(`[data-${kind}-action]`);
        if (!element) return;
        const action = actions[element.getAttribute(`data-${kind}-action`)];
        if (!action || element.disabled) return;
        if(kind==='click'&&element.closest('.v1-header-menu'))HeaderMenus.close();
        const raw = element.getAttribute(`data-${kind}-arg`);
        if (raw === null) action();
        else if (raw === 'event') action(event);
        else if (/^'.*'$/.test(raw)) action(raw.slice(1,-1));
        else if (/^-?\d+$/.test(raw)) action(Number(raw));
      }
      function bind() {
        for (const kind of ['click','input','change'])
          document.addEventListener(kind, event => dispatch(event, kind));
      }
      return {bind};
    })();
    if (typeof document !== 'undefined') AppController.bind();

    /* ==========================================================================
       SLIDE PANEL KIỂU POWERPOINT / CANVA
       Chọn nhiều (Ctrl/Shift+click), kéo để di chuyển, Ctrl/Alt+kéo để sao chép, menu chuột phải,
       Ctrl+C / Ctrl+X / Ctrl+V (clipboard hệ thống dạng JSON, dán được sang tệp khác), Ctrl+D,
       Delete, Alt+↑/↓, Ctrl+A. Dùng được ở danh sách slide bên trái và lưới Template Gallery.
       Mọi thao tác đi qua DeckStore nên Ctrl+Z hoàn tác được.
       ========================================================================== */
    const XB_MAX_SLIDES = 400;
    let selectedSlideIds = new Set(), selAnchorIdx = 0, slideClipboard = null, dragState = null;
    const SLIDE_PANELS = { list: 'sidebar-slide-list', grid: 'gallery-grid-container' };
    const XB_BOUND_PANELS = new WeakSet();
    const pad2 = n => String(n).padStart(2, '0');
    function newSlideId() { return 'slide-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function catalogMeta(type) { return LAYOUT_CATALOG.find(l => l.type === type); }
    function xbMakeSlide(src) {
      const s = xbClone(src) || {};
      delete s.id;
      if (!s.type && Array.isArray(s.components)) s.type = 'composer';
      const meta = catalogMeta(s.type) || {};
      s.id = newSlideId();
      const resolvedGroup = (s.group === null || s.group === '')
        ? undefined
        : normalizeSlideGroup(s.group, (meta as any).group);
      if (resolvedGroup) s.group = resolvedGroup;
      else delete s.group;
      s.layoutName = s.layoutName || String((meta as any).name || s.type || 'Custom').replace(/^\d+\.\s*/, '');
      if (!xbIsObj(s.content)) s.content = {};
      return s;
    }
    function xbSlideIsValid(s) {
      if (!xbIsObj(s)) return false;
      const type = s.type || (Array.isArray(s.components) ? 'composer' : '');
      return !!catalogMeta(type) || ((s.render !== undefined || s.template !== undefined) && !!type);
    }
    function syncSlideSelection() {
      const ids = new Set(slides.map(s => s.id));
      selectedSlideIds = new Set([...selectedSlideIds].filter(id => ids.has(id)));
      const cur = slides[currentSlideIndex];
      if (cur && !selectedSlideIds.has(cur.id)) { selectedSlideIds = new Set([cur.id]); selAnchorIdx = currentSlideIndex; }
    }
    function setSingleSelection(i) { if (slides[i]) { selectedSlideIds = new Set([slides[i].id]); selAnchorIdx = i; } }
    function selectedIndices() {
      const idx = slides.map((s, i) => selectedSlideIds.has(s.id) ? i : -1).filter(i => i >= 0);
      return idx.length ? idx : [currentSlideIndex];
    }
    function applyClickSelection(e, idx) {
      if (e.shiftKey) {
        const a = Math.min(selAnchorIdx, idx), b = Math.max(selAnchorIdx, idx);
        selectedSlideIds = new Set(slides.slice(a, b + 1).map(s => s.id));
        return true;
      }
      if (e.ctrlKey || e.metaKey) {
        const id = slides[idx].id;
        if (selectedSlideIds.has(id) && selectedSlideIds.size > 1) { selectedSlideIds.delete(id); selAnchorIdx = idx; return false; }
        selectedSlideIds.add(id); selAnchorIdx = idx; return true;
      }
      setSingleSelection(idx); return true;
    }
    const xbItemIndex = e => { const item = e.target.closest?.('[data-slide-index]'); return item ? +item.dataset.slideIndex : -1; };
    function sidebarClick(e) {
      const idx = xbItemIndex(e); if (idx < 0 || !slides[idx]) return;
      document.getElementById(SLIDE_PANELS.list)?.focus({ preventScroll: true });
      if (applyClickSelection(e, idx)) { selectSlide(idx); return; }
      // Ctrl+click removed a slide from the selection: keep showing a slide that is still selected.
      if (!selectedSlideIds.has(slides[currentSlideIndex]?.id)) currentSlideIndex = slides.findIndex(s => selectedSlideIds.has(s.id));
      renderCurrentSlide();
    }
    function galleryClick(e) {
      const idx = xbItemIndex(e); if (idx < 0 || !slides[idx]) return;
      document.getElementById(SLIDE_PANELS.grid)?.focus({ preventScroll: true });
      if (e.ctrlKey || e.metaKey || e.shiftKey) { applyClickSelection(e, idx); refreshSelectionMarks(); return; }
      setSingleSelection(idx); selectSlide(idx);
    }
    function refreshSelectionMarks() {
      Object.values(SLIDE_PANELS).forEach(id => document.querySelectorAll(`#${id} [data-slide-index]`).forEach(el => {
        const s = slides[+el.dataset.slideIndex];
        el.classList.toggle('v1-selected', !!s && selectedSlideIds.has(s.id) && (id === SLIDE_PANELS.grid || +el.dataset.slideIndex !== currentSlideIndex));
      }));
    }

    /* Deck mutations: recorded by DeckStore (undo/redo), then re-rendered. */
    function applyDeckChange(focusIndex, ids, message) {
      currentSlideIndex = Math.max(0, Math.min(focusIndex, slides.length - 1));
      selectedSlideIds = new Set(ids && ids.length ? ids : [slides[currentSlideIndex].id]);
      selAnchorIdx = currentSlideIndex;
      renderCurrentSlide();
      if (currentAppMode === 'gallery') renderGalleryGrid();
      const el = document.querySelector(`#${currentAppMode === 'gallery' ? SLIDE_PANELS.grid : SLIDE_PANELS.list} [data-slide-index="${currentSlideIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
      if (message) xbToast(message);
    }
    function moveSlidesTo(indices, gap, verb = 'Đã di chuyển') {
      const ids = new Set(indices.map(i => slides[i].id));
      const moving = slides.filter(s => ids.has(s.id));
      const before = slides.slice(0, gap).filter(s => !ids.has(s.id)).length;
      const rest = slides.filter(s => !ids.has(s.id));
      rest.splice(before, 0, ...moving);
      const changed = rest.some((s, i) => s !== slides[i]);
      if (changed) DeckStore.change(() => { slides = rest; });
      applyDeckChange(before, [...ids], changed ? `${verb} ${moving.length} slide tới vị trí ${pad2(before + 1)}` : '');
    }
    function insertSlidesAt(newSlides, gap, verb = 'Đã chèn') {
      if (!newSlides.length) return;
      if (slides.length + newSlides.length > XB_MAX_SLIDES) { xbToast(`Bộ slide tối đa ${XB_MAX_SLIDES} slide`); return; }
      gap = Math.max(0, Math.min(gap, slides.length));
      DeckStore.change(() => { slides.splice(gap, 0, ...newSlides); });
      applyDeckChange(gap, newSlides.map(s => s.id), `${verb} ${newSlides.length} slide tại vị trí ${pad2(gap + 1)}`);
    }
    function copySlidesTo(indices, gap) { insertSlidesAt(indices.map(i => xbMakeSlide(slides[i])), gap, 'Đã sao chép'); }
    function duplicateSelection() { const idx = selectedIndices(); copySlidesTo(idx, idx[idx.length - 1] + 1); }
    function deleteSelection() {
      const idx = selectedIndices();
      if (idx.length >= slides.length) { xbToast('Bộ slide phải còn ít nhất 1 slide'); return; }
      const ids = new Set(idx.map(i => slides[i].id));
      DeckStore.change(() => { slides = slides.filter(s => !ids.has(s.id)); });
      applyDeckChange(Math.min(idx[0], slides.length - 1), null, `Đã xoá ${idx.length} slide · Ctrl+Z để hoàn tác`);
    }
    function moveSelectionBy(delta) {
      // Like PowerPoint: each selected slide moves one step; gaps between selected slides are kept.
      const idx = selectedIndices();
      if ((delta < 0 && idx[0] === 0) || (delta > 0 && idx[idx.length - 1] === slides.length - 1)) return;
      const ids = idx.map(i => slides[i].id), curId = slides[currentSlideIndex].id, arr = slides.slice();
      (delta > 0 ? [...idx].reverse() : idx).forEach(i => { const j = i + delta; [arr[i], arr[j]] = [arr[j], arr[i]]; });
      DeckStore.change(() => { slides = arr; });
      applyDeckChange(slides.findIndex(s => s.id === curId), ids, `Đã ${delta < 0 ? 'đưa lên' : 'đưa xuống'} ${ids.length} slide`);
    }
    function moveSelectionToEdge(edge) { moveSlidesTo(selectedIndices(), edge === 'top' ? 0 : slides.length); }
    function selectAllSlides() { selectedSlideIds = new Set(slides.map(s => s.id)); refreshSelectionMarks(); xbToast(`Đã chọn ${slides.length} slide`); }

    /* Clipboard payload {xbrainSlides:true, slides:[...], layouts?, helpers?}: custom layouts used by the
       copied slides travel with them, so they paste correctly into another copy of this file. */
    function slidePayload(indices) {
      const list = indices.map(i => { const s = xbClone(slides[i]); delete s.id; return s; });
      const payload = { xbrainSlides: true, version: XB_VERSION, slides: list };
      const used = [...new Set(list.map(s => s.type))].filter(t => DECK_CONFIG.layouts?.[t]);
      if (used.length) {
        payload.layouts = Object.fromEntries(used.map(t => [t, DECK_CONFIG.layouts[t]]));
        if (DECK_CONFIG.helpers) payload.helpers = DECK_CONFIG.helpers;
      }
      return JSON.stringify(payload);
    }
    /* Imported slide collections (clipboard payload, dropped file) must declare version 1.0. */
    function xbSlidesFromPayload(obj) {
      if (!xbIsObj(obj)) throw new Error('Expected a JSON object with version ' + XB_VERSION);
      xbRequireVersion(obj);
      if (obj.layouts || obj.helpers) {
        const missing = Object.keys(obj.layouts || {}).some(t => !DECK_CONFIG.layouts?.[t]);
        if (missing || obj.helpers) xbMergePack({ layouts: obj.layouts, helpers: obj.helpers });
      }
      return (Array.isArray(obj.slides) ? obj.slides : []).filter(xbSlideIsValid);
    }
    function parseSlidePayload(text) {
      let obj; try { obj = JSON.parse(text); } catch (e) { return []; }
      if (!xbIsObj(obj) || !obj.xbrainSlides) return [];
      try { return xbSlidesFromPayload(obj); } catch (e) { xbToast('Không dán được: ' + e.message); return []; }
    }
    function writeSystemClipboard(text) {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => fallbackCopy(text)); else fallbackCopy(text);
    }
    function fallbackCopy(text) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove();
    }
    function writeSlidesToClipboard(idx, clipboardEvent, extra) {
      slideClipboard = idx.map(i => xbClone(slides[i]));
      let payload = slidePayload(idx);
      if (extra) payload = JSON.stringify({ ...JSON.parse(payload), ...extra });
      if (clipboardEvent) clipboardEvent.clipboardData.setData('text/plain', payload); else writeSystemClipboard(payload);
    }
    function copySelection(clipboardEvent) {
      const idx = selectedIndices();
      clearCut(false);
      writeSlidesToClipboard(idx, clipboardEvent);
      xbToast(`Đã sao chép ${idx.length} slide · Ctrl+V để dán`);
    }
    /* Cut works like a file manager: the slides stay in place, faded, until they are pasted somewhere
       else (then they are moved there, one undo step). Esc or a new Ctrl+C cancels the cut. */
    let cutState = null;
    function refreshCutMarks() {
      Object.values(SLIDE_PANELS).forEach(id => document.querySelectorAll(`#${id} [data-slide-index]`).forEach(el => {
        const s = slides[+el.dataset.slideIndex];
        el.classList.toggle('v1-cut', !!(s && cutState?.ids.has(s.id)));
      }));
    }
    function clearCut(notify) {
      if (!cutState) return;
      cutState = null; refreshCutMarks();
      if (notify) xbToast('Đã huỷ thao tác cắt');
    }
    function cutSelection(clipboardEvent) {
      const idx = selectedIndices();
      if (idx.length >= slides.length) { xbToast('Không thể cắt toàn bộ bộ slide'); return; }
      const token = 'cut-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      writeSlidesToClipboard(idx, clipboardEvent, { cutToken: token });
      cutState = { ids: new Set(idx.map(i => slides[i].id)), token };
      refreshCutMarks();
      xbToast(`Đã cắt ${idx.length} slide · chọn vị trí mới rồi Ctrl+V để chuyển tới đó · Esc để huỷ`);
    }
    function pasteCutSlides() {
      const ids = cutState.ids;
      const idx = slides.map((s, i) => ids.has(s.id) ? i : -1).filter(i => i >= 0);
      if (!idx.length) { clearCut(false); xbToast('Các slide đã cắt không còn trong bộ slide'); return; }
      const target = selectedIndices().filter(i => !ids.has(slides[i].id));
      if (!target.length) { xbToast('Chọn một slide khác làm vị trí đích rồi Ctrl+V · Esc để huỷ cắt'); return; }
      cutState = null;
      moveSlidesTo(idx, target[target.length - 1] + 1, 'Đã chuyển');
    }
    function pasteSlides(list) {
      if (cutState) { pasteCutSlides(); return; }
      if (!list || !list.length) { xbToast('Chưa có slide trong bộ nhớ tạm · dùng Ctrl+C trước, hoặc Ctrl+V để dán từ tệp khác'); return; }
      const idx = selectedIndices();
      insertSlidesAt(list.map(xbMakeSlide), idx[idx.length - 1] + 1, 'Đã dán');
    }

    /* Drag & drop */
    function slideItems(container) { return [...container.querySelectorAll('[data-slide-index]')]; }
    function dropTarget(container, mode, e) {
      const items = slideItems(container);
      if (!items.length) return { gap: slides.length, el: null, before: false };
      if (mode === 'list') {
        for (const el of items) { const r = el.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) return { gap: +el.dataset.slideIndex, el, before: true }; }
        const last = items[items.length - 1]; return { gap: +last.dataset.slideIndex + 1, el: last, before: false };
      }
      let best = null, bestD = Infinity;
      for (const el of items) {
        const r = el.getBoundingClientRect(), dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom), d = dx * dx + dy * dy * 4;
        if (d < bestD) { bestD = d; best = el; }
      }
      const r = best.getBoundingClientRect(), before = e.clientX < r.left + r.width / 2;
      return { gap: +best.dataset.slideIndex + (before ? 0 : 1), el: best, before };
    }
    function showDropLine(container, mode, t, copy) {
      let line = container.querySelector(':scope > .v1-drop-line');
      if (!line) { line = document.createElement('div'); line.className = 'v1-drop-line'; container.appendChild(line); }
      line.dataset.label = copy ? 'Sao chép vào đây' : 'Di chuyển tới đây';
      line.classList.toggle('v1-vertical', mode === 'grid');
      const el = t.el; if (!el) { line.style.display = 'none'; return; }
      line.style.display = 'block';
      if (mode === 'list') {
        line.style.left = el.offsetLeft + 'px'; line.style.width = el.offsetWidth + 'px'; line.style.height = '3px';
        line.style.top = (t.before ? el.offsetTop - 7 : el.offsetTop + el.offsetHeight + 4) + 'px';
      } else {
        line.style.top = el.offsetTop + 'px'; line.style.height = el.offsetHeight + 'px'; line.style.width = '4px';
        line.style.left = (t.before ? el.offsetLeft - 16 : el.offsetLeft + el.offsetWidth + 12) + 'px';
      }
    }
    function hideDropLine(container) { container.querySelector(':scope > .v1-drop-line')?.remove(); }
    function autoScroll(scroller, e) {
      const r = scroller.getBoundingClientRect(), edge = 48;
      if (e.clientY < r.top + edge) scroller.scrollTop -= 14; else if (e.clientY > r.bottom - edge) scroller.scrollTop += 14;
    }
    async function xbHandleExternalDrop(e, gap) {
      let list = parseSlidePayload(e.dataTransfer.getData('text/plain'));
      const file = [...(e.dataTransfer.files || [])].find(f => /\.json$/i.test(f.name));
      if (!list.length && file) {
        const text = await file.text(); let obj = null;
        try { obj = JSON.parse(text); } catch (err) { xbToast('Tệp JSON lỗi cú pháp: ' + err.message); return; }
        const hasSlides = Array.isArray(obj) || Array.isArray(obj?.slides);
        if (!hasSlides && xbIsObj(obj) && ('layouts' in obj || 'helpers' in obj)) { xbImportAny(obj); return; }
        list = xbSlidesFromPayload(obj); // throws on a missing/other version: nothing is changed
      }
      if (list.length) insertSlidesAt(list.map(xbMakeSlide), gap, 'Đã chèn');
      else xbToast('Nội dung kéo vào không phải slide XBrain hợp lệ');
    }
    function bindSlideDnD(container, mode, scroller) {
      if (!container || XB_BOUND_PANELS.has(container)) return;
      XB_BOUND_PANELS.add(container); container.tabIndex = 0;
      container.addEventListener('dragstart', e => {
        const item = e.target.closest?.('[data-slide-index]'); if (!item) return;
        const idx = +item.dataset.slideIndex;
        if (!selectedSlideIds.has(slides[idx].id)) { setSingleSelection(idx); refreshSelectionMarks(); }
        const indices = selectedIndices();
        dragState = { indices, ids: indices.map(i => slides[i].id) };
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/plain', slidePayload(indices));
        const ghost = document.createElement('div'); ghost.className = 'v1-drag-ghost';
        ghost.textContent = indices.length > 1 ? `${indices.length} slide` : `Slide ${pad2(idx + 1)} · ${slides[idx].layoutName || slides[idx].type}`;
        document.body.appendChild(ghost); e.dataTransfer.setDragImage(ghost, 18, 18); setTimeout(() => ghost.remove(), 0);
        requestAnimationFrame(() => slideItems(container).forEach(el => { if (dragState && dragState.ids.includes(slides[+el.dataset.slideIndex]?.id)) el.classList.add('v1-dragging'); }));
      });
      container.addEventListener('dragover', e => {
        e.preventDefault();
        const copy = !dragState || e.ctrlKey || e.altKey || e.metaKey;
        e.dataTransfer.dropEffect = copy ? 'copy' : 'move';
        showDropLine(container, mode, dropTarget(container, mode, e), copy);
        autoScroll(scroller || container, e);
      });
      container.addEventListener('dragleave', e => { if (!container.contains(e.relatedTarget)) hideDropLine(container); });
      container.addEventListener('drop', e => {
        e.preventDefault();
        const t = dropTarget(container, mode, e); hideDropLine(container);
        if (dragState) {
          const { indices } = dragState; dragState = null;
          if (e.ctrlKey || e.altKey || e.metaKey) copySlidesTo(indices, t.gap); else moveSlidesTo(indices, t.gap);
          return;
        }
        xbHandleExternalDrop(e, t.gap).catch(err => xbToast('Không chèn được: ' + err.message));
      });
      container.addEventListener('dragend', () => {
        dragState = null; hideDropLine(container);
        container.querySelectorAll('.v1-dragging').forEach(el => el.classList.remove('v1-dragging'));
      });
      container.addEventListener('contextmenu', e => {
        const item = e.target.closest?.('[data-slide-index]'); if (!item) return;
        e.preventDefault();
        const idx = +item.dataset.slideIndex;
        if (!selectedSlideIds.has(slides[idx].id)) { setSingleSelection(idx); if (mode === 'list') selectSlide(idx); else refreshSelectionMarks(); }
        openSlideMenu(e.clientX, e.clientY);
      });
    }

    /* Right-click menu */
    function openSlideMenu(x, y) {
      closeSlideMenu();
      const idx = selectedIndices(), n = idx.length;
      const atTop = idx[0] === 0, atBottom = idx[idx.length - 1] === slides.length - 1;
      const items = [
        ['Sao chép', 'Ctrl+C', () => copySelection()], ['Cắt', 'Ctrl+X', () => cutSelection(), n >= slides.length],
        ['Dán sau slide này', 'Ctrl+V', () => pasteSlides(slideClipboard), !slideClipboard], ['Nhân bản', 'Ctrl+D', duplicateSelection], '-',
        ['Lên trên', 'Alt+↑', () => moveSelectionBy(-1), atTop], ['Xuống dưới', 'Alt+↓', () => moveSelectionBy(1), atBottom],
        ['Đưa lên đầu', '', () => moveSelectionToEdge('top'), atTop], ['Đưa xuống cuối', '', () => moveSelectionToEdge('bottom'), atBottom], '-',
        ['Xoá', 'Del', deleteSelection, n >= slides.length, 'v1-danger'],
      ];
      const menu = document.createElement('div'); menu.className = 'v1-menu'; menu.id = 'v1-slide-menu'; menu.setAttribute('role', 'menu');
      menu.innerHTML = `<div class="v1-menu-head">${n > 1 ? n + ' slide đã chọn' : 'Slide ' + pad2(idx[0] + 1)}</div>`;
      items.forEach(it => {
        if (it === '-') { menu.insertAdjacentHTML('beforeend', '<div class="v1-menu-sep"></div>'); return; }
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.disabled = !!it[3]; if (it[4]) b.className = it[4];
        b.innerHTML = `<span>${it[0]}</span><kbd>${it[1]}</kbd>`; b.addEventListener('click', () => { closeSlideMenu(); it[2](); });
        menu.appendChild(b);
      });
      document.body.appendChild(menu);
      const r = menu.getBoundingClientRect();
      menu.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; menu.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    }
    function closeSlideMenu() { document.getElementById('v1-slide-menu')?.remove(); }
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      document.addEventListener('mousedown', e => { if (!e.target.closest?.('#v1-slide-menu')) closeSlideMenu(); });
      window.addEventListener('blur', closeSlideMenu);
      window.addEventListener('resize', closeSlideMenu);
    }

    let xbToastTimer = null;
    function xbToast(msg) {
      if (!msg) return;
      let el = document.getElementById('v1-toast');
      if (!el) { el = document.createElement('div'); el.id = 'v1-toast'; el.className = 'v1-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
      el.textContent = msg; el.classList.add('show');
      clearTimeout(xbToastTimer); xbToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
    }

    /* Keyboard + clipboard events (ignored while typing, in modals, brand view or fullscreen). */
    const XB_MODALS = ['modal-add-slide', 'modal-json-editor', 'modal-content-editor', 'v1-visual-modal', 'v1-deck-modal', 'v1-schema-modal', 'v1-about-modal', 'v1-chrome-dialog'];
    function slideShortcutsActive() {
      const a = document.activeElement;
      const typing = a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
      const modal = XB_MODALS.some(id => { const m = document.getElementById(id); return m && !m.classList.contains('hidden'); });
      return !HeaderMenus.isOpen && !typing && !modal && document.getElementById('v1-agent-console')?.hidden!==false && currentAppMode !== 'brand' && !document.body.classList.contains('presentation-fullscreen');
    }
    const focusInSlidePanel = () => !!document.activeElement?.closest?.(`#${SLIDE_PANELS.list},#${SLIDE_PANELS.grid}`);
    if (typeof window !== 'undefined') window.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeSlideMenu(); clearCut(true); return; }
      if (!slideShortcutsActive()) return;
      const k = e.key, mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && k.toLowerCase() === 'd') { e.preventDefault(); duplicateSelection(); }
      else if (mod && k.toLowerCase() === 'a' && focusInSlidePanel()) { e.preventDefault(); selectAllSlides(); }
      else if (e.altKey && (k === 'ArrowUp' || k === 'ArrowDown')) { e.preventDefault(); moveSelectionBy(k === 'ArrowUp' ? -1 : 1); }
      else if ((k === 'Delete' || k === 'Backspace') && focusInSlidePanel()) { e.preventDefault(); deleteSelection(); }
      else if (!e.altKey && !mod && (k === 'ArrowUp' || k === 'ArrowDown') && focusInSlidePanel() && currentAppMode === 'workspace') { e.preventDefault(); k === 'ArrowUp' ? prevSlide() : nextSlide(); }
    });
    if (typeof document !== 'undefined') document.addEventListener('copy', e => {
      if (!slideShortcutsActive() || !window.getSelection().isCollapsed) return;
      e.preventDefault(); copySelection(e);
    });
    if (typeof document !== 'undefined') document.addEventListener('cut', e => {
      if (!slideShortcutsActive() || !window.getSelection().isCollapsed) return;
      e.preventDefault(); cutSelection(e);
    });
    if (typeof document !== 'undefined') document.addEventListener('paste', e => {
      if (!slideShortcutsActive()) return;
      const text = e.clipboardData?.getData('text/plain') || '';
      e.preventDefault();
      let token = null; try { token = JSON.parse(text)?.cutToken || null; } catch (err) { }
      // Our own pending cut (same file) → move; slides copied elsewhere → insert copies.
      if (cutState && (!text || token === cutState.token)) { pasteCutSlides(); return; }
      const list = parseSlidePayload(text);
      if (list.length) { clearCut(false); insertSlidesAt(list.map(xbMakeSlide), selectedIndices().at(-1) + 1, 'Đã dán'); return; }
      pasteSlides(slideClipboard);
    });

    /* ==========================================================================
       HEADER / FOOTER SYNC — chọn phạm vi áp dụng sau khi sửa: trang này, khoảng trang, toàn bộ
       ========================================================================== */
    /* Indices of the slides that actually show this header/footer field (cover, closing… are skipped). */
    function xbChromeSlides(key) {
      const marker = `data-chrome="${key}"`;
      return slides.map((s, i) => renderSlideHTML(s, i, true).includes(marker) ? i : -1).filter(i => i >= 0);
    }
    /* scope: 'current' | 'all' | [from, to] (1-based, inclusive). Returns the number of slides changed. */
    function xbApplyChrome(key, value, scope = 'current') {
      const field = XB_CHROME_FIELDS[key];
      if (!field) throw new Error('Không có trường header/footer "' + key + '"');
      value = String(value ?? '').trim();
      const eligible = xbChromeSlides(key);
      const all = scope === 'all';
      const [from, to] = Array.isArray(scope) ? scope.map(n => Number(n) - 1) : [currentSlideIndex, currentSlideIndex];
      const targets = all ? eligible : eligible.filter(i => i >= Math.min(from, to) && i <= Math.max(from, to));
      if (!targets.length) return 0;
      DeckStore.change(() => {
        if (field.store === 'content') {
          targets.forEach(i => { const s = slides[i]; s.content = { ...(s.content || {}), [key]: value }; });
        } else if (all) {
          DECK_CONFIG = { ...DECK_CONFIG, chrome: { ...(DECK_CONFIG.chrome || {}), [key]: value } };
          slides.forEach(s => { if (s.chrome) { delete s.chrome[key]; if (!Object.keys(s.chrome).length) delete s.chrome; } });
        } else {
          targets.forEach(i => { const s = slides[i]; s.chrome = { ...(s.chrome || {}), [key]: value }; });
        }
      });
      renderCurrentSlide();
      if (currentAppMode === 'gallery') renderGalleryGrid();
      return targets.length;
    }
    function xbCloseChromeDialog() { document.getElementById('v1-chrome-dialog')?.remove(); }
    function xbOpenChromeDialog(key, value) {
      xbCloseChromeDialog();
      const field = XB_CHROME_FIELDS[key], eligible = xbChromeSlides(key), n = slides.length, cur = currentSlideIndex + 1;
      const wrap = document.createElement('div');
      wrap.id = 'v1-chrome-dialog'; wrap.className = 'v1-chrome-backdrop';
      wrap.innerHTML = `<div class="v1-chrome-dialog" role="dialog" aria-modal="true" aria-labelledby="v1-chrome-title">
        <div class="v1-chrome-head" id="v1-chrome-title">Áp dụng thay đổi · ${escapeHtml(field.label)}</div>
        <div class="v1-chrome-value">“${escapeHtml(value || '(trống)')}”</div>
        <label><input type="radio" name="v1-chrome-scope" value="current" checked> Chỉ trang này <b>(${pad2(cur)})</b></label>
        <label><input type="radio" name="v1-chrome-scope" value="range"> Các trang từ
          <input type="number" class="v1-chrome-num" data-end="from" min="1" max="${n}" value="${cur}"> đến
          <input type="number" class="v1-chrome-num" data-end="to" min="1" max="${n}" value="${n}"></label>
        <label><input type="radio" name="v1-chrome-scope" value="all"> Toàn bộ các trang</label>
        <div class="v1-chrome-count"></div>
        <div class="v1-chrome-actions"><button type="button" data-act="cancel">Huỷ</button><button type="button" data-act="apply" class="v1-chrome-primary">Áp dụng</button></div>
      </div>`;
      document.body.appendChild(wrap);
      const $ = sel => wrap.querySelector(sel);
      const scope = () => {
        const v = $('input[name="v1-chrome-scope"]:checked').value;
        if (v !== 'range') return v;
        const clamp = x => Math.max(1, Math.min(n, Math.round(Number(x) || 1)));
        return [clamp($('[data-end="from"]').value), clamp($('[data-end="to"]').value)];
      };
      const count = () => {
        const s = scope();
        if (s === 'all') return eligible.length;
        const [a, b] = Array.isArray(s) ? [Math.min(...s) - 1, Math.max(...s) - 1] : [currentSlideIndex, currentSlideIndex];
        return eligible.filter(i => i >= a && i <= b).length;
      };
      const refresh = () => {
        const c = count();
        $('.v1-chrome-count').textContent = c ? `Sẽ cập nhật ${c} trang · bỏ qua trang không có trường này` : 'Không có trang nào trong phạm vi này có trường này';
        $('[data-act="apply"]').disabled = !c;
      };
      const cancel = () => { xbCloseChromeDialog(); renderCurrentSlide(); xbToast('Đã huỷ thay đổi header/footer'); };
      const apply = () => {
        const s = scope(), changed = xbApplyChrome(key, value, s);
        xbCloseChromeDialog();
        xbToast(`Đã cập nhật “${field.label}” cho ${changed} trang · Ctrl+Z để hoàn tác`);
      };
      wrap.querySelectorAll('.v1-chrome-num').forEach(inp => {
        inp.addEventListener('focus', () => { $('input[value="range"]').checked = true; refresh(); });
        inp.addEventListener('input', refresh);
      });
      wrap.querySelectorAll('input[name="v1-chrome-scope"]').forEach(r => r.addEventListener('change', refresh));
      $('[data-act="cancel"]').addEventListener('click', cancel);
      $('[data-act="apply"]').addEventListener('click', apply);
      wrap.addEventListener('mousedown', e => { if (e.target === wrap) e.preventDefault(); }); // modal: clicks outside do nothing
      wrap.addEventListener('keydown', e => {
        e.stopPropagation(); // keep slide shortcuts (arrows, Delete, Ctrl+Z…) away while the dialog is open
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        else if (e.key === 'Enter' && !$('[data-act="apply"]').disabled) { e.preventDefault(); apply(); }
      });
      refresh();
      $('input[name="v1-chrome-scope"]:checked').focus();
    }


    const XBrainCompiler=(()=>{
    const XB_COMPILER_VERSION='1.0.0-agent.1';
    // Single source of truth: structural contract below + enums/conditionals derived from the live registries.
    function xbSchema(){
      const s=xbClone(XB_SCHEMA_BASE),d=s.$defs,builtins=LAYOUT_CATALOG.filter(l=>!l.custom).map(l=>l.type);
      d.chartVariant.enum=Object.keys(CHART_VARIANTS);
      d.chartVariant['x-v1-constraints']=Object.fromEntries(Object.entries(CHART_VARIANTS).map(([id,v])=>[id,xbClone(v.constraints)]));
      for(const layout of LAYOUT_CATALOG.filter(l=>!l.custom))if(d['content-'+layout.type])d['content-'+layout.type]['x-v1-limits']=xbClone(layout.limits||{});
      for(const type of ['custom-html','custom-diagram'])d['content-'+type].description=d['content-'+type].description.replace(/ content\.(html|svg) is trusted author markup inserted without sanitizing\./,' Author markup is inserted as provided.');
      d.diagramVariant.enum=[...Object.keys(CHART_VARIANTS),...Object.keys(DIAGRAM_VARIANT_LOOKUP)];
      d.componentType.enum=Object.keys(COMPONENT_RENDERERS);
      d.slide.properties.type.enum=builtins.slice();
      d.codeSlide.properties.type.not.enum=builtins.slice();
      d.layoutSlide.properties.type.not.enum=builtins.slice();
      d.slide.allOf=builtins.filter(t=>d['content-'+t]).map(t=>({if:{properties:{type:{enum:[t]}},required:['type']},then:t==='composer'
        ?{properties:{content:{$ref:'#/$defs/content-composer'}},anyOf:[{required:['components']},{required:['content'],properties:{content:{required:['components']}}}]}
        :{properties:{content:{$ref:'#/$defs/content-'+t}},required:['content']}}));
      return s;
    }
    // JSON Schema 2020-12 subset used by the contract ($ref, type, enum, const, properties, required,
    // additionalProperties, items, min/max*, pattern, propertyNames, anyOf, allOf, not, if/then/else).
    function xbSchemaValidate(root,doc){
      const defs=root.$defs||{},isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v),eq=(a,b)=>xbCanonical(a)===xbCanonical(b);
      const ptr=p=>p.length?'/'+p.map(k=>String(k).replace(/~/g,'~0').replace(/\//g,'~1')).join('/'):'';
      const typeOf=v=>v===null?'null':Array.isArray(v)?'array':typeof v==='number'?(Number.isInteger(v)?'integer':'number'):typeof v;
      const is=(t,v)=>t==='number'?typeof v==='number'&&Number.isFinite(v):t==='integer'?Number.isInteger(v):t==='array'?Array.isArray(v):t==='object'?isObj(v):t==='null'?v===null:typeof v===t;
      const reCache=new Map(),re=p=>{if(!reCache.has(p))reCache.set(p,new RegExp(p,'u'));return reCache.get(p);};
      function check(s,x,path,out){
        if(s===true||s==null)return true;
        let ok=true;const add=(keyword,message,extra={},at=path)=>{out.push({path:ptr(at),keyword,message,...extra});ok=false;};
        if(s===false){add('false','value is not allowed');return false;}
        if(s.$ref){const m=/^#\/\$defs\/(.+)$/.exec(s.$ref),t=m&&defs[m[1]];if(!t)add('$ref','unresolved reference '+s.$ref);else if(!check(t,x,path,out))ok=false;}
        if(s.type){const ts=[].concat(s.type);if(!ts.some(t=>is(t,x))){add('type',`expected ${ts.join(' or ')}, got ${typeOf(x)}`,{expected:ts,actual:typeOf(x)});return false;}}
        if('const' in s&&!eq(x,s.const))add('const',`must equal ${JSON.stringify(s.const)}`,{expected:s.const});
        if(s.enum&&!s.enum.some(e=>eq(e,x)))add('enum',`${JSON.stringify(x)} is not allowed`,{allowed:s.enum,actual:x});
        if(typeof x==='string'){if(s.minLength!=null&&[...x].length<s.minLength)add('minLength',`must have at least ${s.minLength} character(s)`);if(s.maxLength!=null&&[...x].length>s.maxLength)add('maxLength',`must have at most ${s.maxLength} character(s)`);if(s.pattern&&!re(s.pattern).test(x))add('pattern',`must match ${s.pattern}`,{pattern:s.pattern});}
        if(typeof x==='number'){if(s.minimum!=null&&x<s.minimum)add('minimum',`must be ≥ ${s.minimum}`,{limit:s.minimum,actual:x});if(s.maximum!=null&&x>s.maximum)add('maximum',`must be ≤ ${s.maximum}`,{limit:s.maximum,actual:x});if(s.exclusiveMinimum!=null&&x<=s.exclusiveMinimum)add('exclusiveMinimum',`must be > ${s.exclusiveMinimum}`,{limit:s.exclusiveMinimum,actual:x});if(s.exclusiveMaximum!=null&&x>=s.exclusiveMaximum)add('exclusiveMaximum',`must be < ${s.exclusiveMaximum}`,{limit:s.exclusiveMaximum,actual:x});}
        if(Array.isArray(x)){if(s.minItems!=null&&x.length<s.minItems)add('minItems',`must have at least ${s.minItems} item(s)`,{limit:s.minItems});if(s.maxItems!=null&&x.length>s.maxItems)add('maxItems',`must have at most ${s.maxItems} item(s)`,{limit:s.maxItems,actual:x.length});
          if(s.uniqueItems){const seen=new Set();x.forEach((it,i)=>{const key=xbCanonical(it);if(seen.has(key))add('uniqueItems','items must be unique',{index:i});seen.add(key);});}
          if(s.items!==undefined)x.forEach((it,i)=>{if(!check(s.items,it,[...path,i],out))ok=false;});}
        if(isObj(x)){
          if(s.minProperties!=null&&Object.keys(x).length<s.minProperties)add('minProperties',`must have at least ${s.minProperties} properties`);
          if(s.maxProperties!=null&&Object.keys(x).length>s.maxProperties)add('maxProperties',`must have at most ${s.maxProperties} properties`);
          for(const k of s.required||[])if(!Object.prototype.hasOwnProperty.call(x,k))add('required',`missing required property "${k}"`,{property:k});
          if(s.propertyNames)for(const k of Object.keys(x)){if(!check(s.propertyNames,k,[...path,k],[]))add('propertyNames',`property name "${k}" is not allowed`,{property:k},[...path,k]);}
          const props=s.properties||{};
          for(const [k,v] of Object.entries(x)){
            if(Object.prototype.hasOwnProperty.call(props,k)){if(!check(props[k],v,[...path,k],out))ok=false;}
            else if(s.additionalProperties===false)add('additionalProperties',`unknown property "${k}"`,{property:k,allowed:Object.keys(props)},[...path,k]);
            else if(isObj(s.additionalProperties)&&!check(s.additionalProperties,v,[...path,k],out))ok=false;
          }
        }
        for(const sub of s.allOf||[])if(!check(sub,x,path,out))ok=false;
        if(s.anyOf){let best=null; // closest branch = the one whose shallowest error is deepest (its outer shape matched), then fewest errors
          for(const sub of s.anyOf){const tmp=[];if(check(sub,x,path,tmp)){best=null;break;}const depth=Math.min(...tmp.map(e=>e.path.split('/').length+(e.keyword==='required'||e.keyword==='not'||e.keyword==='additionalProperties'&&e.path.split('/').length===path.length+2?0:1)));if(!best||depth>best.depth||depth===best.depth&&tmp.length<best.errs.length)best={errs:tmp,depth};}
          if(best){out.push(...best.errs);ok=false;}}
        if(s.not){if(check(s.not,x,path,[]))add('not','matches a shape that is not allowed here');}
        if('if' in s){if(check(s.if,x,path,[])){if(s.then!==undefined&&!check(s.then,x,path,out))ok=false;}else if(s.else!==undefined&&!check(s.else,x,path,out))ok=false;}
        return ok;
      }
      const errors=[];check(root,doc,[],errors);
      const seen=new Set();return errors.filter(e=>{const k=e.path+'|'+e.keyword+'|'+e.message;if(seen.has(k))return false;seen.add(k);return true;});
    }
    // Optimal-string-alignment distance: insert/delete/substitute/transpose cost 1 ("titel" → "title" = 1).
    function xbLev(a,b){a=String(a);b=String(b);if(a===b)return 0;const m=a.length,n=b.length;if(!m||!n)return m||n;const d=Array.from({length:m+1},(_,i)=>[i,...new Array(n).fill(0)]);for(let j=1;j<=n;j++)d[0][j]=j;
      for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const cost=a[i-1]===b[j-1]?0:1;d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[m][n];}
    // Nearest allowed name: exact case-insensitive match, known alias, or a unique candidate within edit distance 2.
    const XB_ALIASES={'barchart':'bar','bar-chart':'bar','column':'bar','columns-chart':'bar','column-chart':'bar','horizontal-bar':'bar-horizontal','hbar':'bar-horizontal','line-chart':'line','linechart':'line','area-chart':'area','pie-chart':'pie','piechart':'pie','doughnut':'donut','donut-chart':'donut','stacked':'stacked-bar','grouped':'grouped-bar','stacked-column':'stacked-bar','100-stacked':'stacked-100','percent-stacked':'stacked-100','scatter-plot':'scatter','bubble-chart':'bubble','heat-map':'heatmap','tree-map':'treemap','funnel-chart':'funnel-chart','timeline-vertical':'vertical-timeline','org':'org-chart','orgchart':'org-chart','organization-chart':'org-chart','mind-map':'mindmap','flow':'flowchart','flow-chart':'flowchart','process':'flowchart','gantt-chart':'gantt','sankey-diagram':'sankey','venn-diagram':'venn','swot-analysis':'swot','kpi-card':'metric','stat':'metric','paragraph-text':'paragraph','bullets':'list','bullet-list':'list','img':'image','picture':'image','subTitle':'subtitle','sub_title':'subtitle','heading':'title'};
    function xbNearest(name,allowed,{aliases=true}={}){
      const s=String(name);if(allowed.includes(s))return s;
      const ci=allowed.filter(a=>a.toLowerCase()===s.toLowerCase());if(ci.length===1)return ci[0];
      if(aliases&&XB_ALIASES[s]&&allowed.includes(XB_ALIASES[s]))return XB_ALIASES[s];
      const norm=x=>x.toLowerCase().replace(/[\s_]+/g,'-');const nm=allowed.filter(a=>norm(a)===norm(s));if(nm.length===1)return nm[0];
      const limit=s.length<=3?0:s.length<=6?1:2,scored=allowed.map(a=>({a,d:xbLev(norm(s),norm(a))})).filter(x=>x.d<=limit).sort((x,y)=>x.d-y.d);
      return scored.length&&(scored.length===1||scored[0].d<scored[1].d)?scored[0].a:null;
    }
    // Deterministic 64-bit hash (two 32-bit FNV/murmur mixes) as 16 hex digits.
    function xbHash(str){let h1=0x811c9dc5,h2=0x9747b28c;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,16777619);h2=Math.imul(h2^c,2246822507);h2^=h2>>>13;}h1^=h1>>>16;h1=Math.imul(h1,2246822507);h2=Math.imul(h2^h2>>>16,3266489909);return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0');}
    function xbCanonical(v){if(Array.isArray(v))return '['+v.map(xbCanonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+xbCanonical(v[k])).join(',')+'}';return JSON.stringify(v===undefined?null:v);}
    const XB_DIAGNOSTIC_CODES=Object.freeze({
      'qa.browser-unavailable':'Browser QA was requested but no browser executable was found.',
      'qa.browser-failed':'Browser QA could not complete; inspect the browser error.',
      'schema.invalid':'Document does not match the v1 JSON contract (see keyword/allowed).',
      'version.unsupported':'Only JSON schema version "1.0" is accepted; nothing was changed.',
      'data.missing':'A visual or data component has no data reference/inline data.',
      'data.unknown-ref':'dataRef / data.$ref names a dataset that does not exist.',
      'data.empty':'The data source exists but has no rows/nodes.',
      'data.derive':'A declarative arithmetic expression has invalid operands or divides by zero.',
      'data.parse':'A dataset string could not be parsed in its declared format.',
      'data.implicit-sample':'Legacy editor only: no data reference, built-in sample shown.',
      'data.field-missing':'Rows/nodes lack a field the variant needs (e.g. x, start/end, target, status).',
      'data.non-numeric':'A value that must be numeric is not; it is skipped, never invented.',
      'data.negative':'Negative values are not valid for this variant and are excluded.',
      'data.out-of-range':'A value lies outside the variant scale and is clamped visually.',
      'data.series-missing':'A multi-series variant got fewer than 2 numeric series.',
      'data.truncated':'More rows/nodes/items than the layout can show; the rest are not drawn.',
      'data.aggregated':'Small categories were combined (e.g. "Other" slice).',
      'data.inconsistent':'Values contradict each other (e.g. waterfall total vs running sum, RACI without one A).',
      'data.unmapped':'Items reference a group/status/column that does not exist.',
      'graph.duplicate-id':'Two nodes share an id.',
      'graph.dangling-edge':'An edge or parent references a node that does not exist.',
      'graph.cycle':'A cycle was detected; supported layered renderers route original feedback edges outside the graph.',
      'graph.edges-missing':'The variant expresses relations but no edges were given.',
      'graph.edges-ignored':'Edges are given but this variant does not draw them.',
      'graph.implicit-hierarchy':'No explicit structure; a documented default arrangement was used.',
      'graph.multiple-parents':'A hierarchy node has multiple parents; layered trees preserve every declared edge.',
      'graph.isolated':'Nodes without any flow are not drawn.',
      'text.truncated':'Text did not fit even at the minimum font size and was shortened (full text kept in <title>).',
      'text.overflow':'Estimated text height exceeds its box; content would be clipped.',
      'text.length':'A template field exceeds its recommended character budget.',
      'text.hidden':'Labels omitted for tiny marks (values kept in tooltips).',
      'layout.overflow':'Composer components cannot fit the 1728×642 scene even at minimum heights.',
      'layout.out-of-bounds':'A freeform component lies outside the scene.',
      'layout.overlap':'Two freeform components overlap.',
      'layout.text-collision':'Two SVG labels overlap by more than 15% of the smaller box.',
      'layout.legibility':'A chart/diagram is drawn so small that labels become illegible.',
      'layout.depth':'Components nested deeper than 7 levels are not rendered.',
      'layout.measured-overflow':'Browser measurement: an element\'s content exceeds its box or the slide.',
      'content.truncated':'A template array is longer than the layout limit; extra items are not drawn.',
      'component.unknown':'Unknown component type.',
      'variant.unknown':'Unknown chart/diagram variant.',
      'semantic.mismatch':'Self-check: mark geometry is not proportional to its data value.',
      'code.compile':'Template-as-code failed to compile.',
      'render.exception':'A renderer threw; the slide shows an error page.',
      'render.enhanced-only':'Content needs an optional CDN library; offline output shows a fallback.',
      'determinism.external-missing':'An external dataset needs an inline value/data snapshot before compilation.',
      'determinism.external':'Content loaded at view time is not part of the compiled output.',
      'slide.duplicate-id':'Duplicate slide id; it is made unique on normalization.'
    });
    const XB_SEVERITY_WEIGHT={error:25,warning:4,info:0};

    // Render with the given document and options, then restore the editor state exactly.
    function xbWithDeck(input,opts,fn){
      const prev={config:DECK_CONFIG,slides,opts:XB_RENDER_OPTS,cache:new Map(DECK_DATA_CACHE)};
      XB_RENDER_OPTS={...XB_RENDER_DEFAULTS,...xbOptions(opts)};
      try{
        const defaults=XB_RENDER_OPTS.strict?{...DECK_DEFAULT_CONFIG,datasets:{},metadata:{}}:DECK_DEFAULT_CONFIG;
        const doc=Array.isArray(input)?{version:'1.0',slides:input}:input;
        const custom={layouts:doc.layouts,helpers:doc.helpers};
        const next=DeckModel.normalize(doc,xbCatalogFor(doc,doc.layouts),defaults);
        DECK_CONFIG=next.config;slides=next.slides;DECK_DATA_CACHE.clear();xbSyncCustom(custom);
        return fn(next,doc);
      }finally{
        DECK_CONFIG=prev.config;slides=prev.slides;XB_RENDER_OPTS=prev.opts;DECK_DATA_CACHE.clear();
        for(const [k,v] of prev.cache)DECK_DATA_CACHE.set(k,v);xbSyncCustom(DECK_CONFIG);
      }
    }
    function xbVersionGate(doc){
      if(Array.isArray(doc))return null;
      if(!xbIsObj(doc))return {code:'schema.invalid',severity:'error',path:'',message:'Document must be a JSON object or an array of slides'};
      if(doc.version!=='1.0')return {code:'version.unsupported',severity:'error',path:'/version',message:`Expected JSON schema version 1.0, got ${JSON.stringify(doc.version)}`};
      return null;
    }
    function xbContentChecks(doc){
      const out=[],list=Array.isArray(doc)?doc:Array.isArray(doc.slides)?doc.slides:[],sets=xbIsObj(doc.datasets)?doc.datasets:{},assets=xbIsObj(doc.assets)?doc.assets:{};
      const ids=new Map();
      for(const [name,definition] of Object.entries(sets))if(definition?.url&&definition.value===undefined&&definition.data===undefined)out.push({code:'determinism.external-missing',severity:'error',path:'/datasets/'+name.replace(/~/g,'~0').replace(/\//g,'~1'),message:`Dataset "${name}" has an external URL without an inline snapshot; provide inline data before compiling`});
      list.forEach((s,i)=>{if(!xbIsObj(s))return;const base=`/slides/${i}`;
        if(s.id!=null){if(ids.has(s.id))out.push({code:'slide.duplicate-id',severity:'warning',path:base+'/id',message:`slide id "${s.id}" is also used by slide ${ids.get(s.id)}`});else ids.set(s.id,i);}
        const meta=LAYOUT_CATALOG.find(l=>l.type===s.type&&!l.custom);
        for(const [k,limit] of Object.entries(meta?.limits||{})){const [arr,sub]=k.split('.'),v=s.content?.[arr];if(!Array.isArray(v))continue;
          if(!sub){if(v.length>limit)out.push({code:'content.truncated',severity:'error',path:`${base}/content/${arr}`,message:`${s.type}.${arr} has ${v.length} items; the layout draws ${limit} — move the rest to another slide`,limit,actual:v.length});}
          else v.forEach((it,j)=>{if(Array.isArray(it?.[sub])&&it[sub].length>limit)out.push({code:'content.truncated',severity:'error',path:`${base}/content/${arr}/${j}/${sub}`,message:`${s.type}.${k} has ${it[sub].length} items; the layout draws ${limit}`,limit,actual:it[sub].length});});}
        if(meta&&s.type!=='composer'&&xbIsObj(s.content)){const diagram=DIAGRAM_TYPES.has(s.type);
          const walk=(v,path,key)=>{if(['svg','html','color','badgeColor','icon'].includes(key))return;
            if(typeof v==='string'){const limit=!diagram?700:path===`${base}/content/title`?100:key==='subtitle'?220:['desc','action','short'].includes(key)?120:['title','label','metric','tag'].includes(key)?85:180;
              if(v.length>limit)out.push({code:'text.length',severity:'warning',path,message:`${v.length} characters exceeds the ${limit}-character budget for "${key}"`,limit,actual:v.length});}
            else if(Array.isArray(v))v.forEach((x,j)=>walk(x,`${path}/${j}`,key));
            else if(xbIsObj(v))Object.entries(v).forEach(([k,x])=>walk(x,`${path}/${k}`,k));};
          walk(s.content,`${base}/content`,'content');}
        const comps=(c,path)=>{if(!xbIsObj(c))return;const ref=typeof c.dataRef==='string'?c.dataRef:typeof c.data?.$ref==='string'?c.data.$ref:null;
          if(ref){const name=ref.replace(/^datasets\./,'');if(!Object.prototype.hasOwnProperty.call(sets,name))out.push({code:'data.unknown-ref',severity:'error',path:path+(c.dataRef?'/dataRef':'/data/$ref'),message:`Dataset "${name}" does not exist (available: ${Object.keys(sets).join(', ')||'none'})`,ref:name,suggestion:xbNearest(name,Object.keys(sets),{aliases:false})});}
          if(c.assetRef&&!Object.prototype.hasOwnProperty.call(assets,c.assetRef))out.push({code:'data.unknown-ref',severity:'error',path:path+'/assetRef',message:`Asset "${c.assetRef}" does not exist`});
          for(const key of ['children','components'])if(Array.isArray(c[key]))c[key].forEach((x,j)=>comps(x,`${path}/${key}/${j}`));};
        (Array.isArray(s.components)?s.components:[]).forEach((c,j)=>comps(c,`${base}/components/${j}`));
        (Array.isArray(s.content?.components)?s.content.components:[]).forEach((c,j)=>comps(c,`${base}/content/components/${j}`));
      });
      return out;
    }
    function validate(doc,opts={}){
      const gate=xbVersionGate(doc);if(gate)return {ok:false,diagnostics:[gate]};
      const wrapped=Array.isArray(doc)?{version:'1.0',slides:doc}:doc;
      const diagnostics=xbSchemaValidate(xbSchema(),wrapped).map(e=>{const d={code:'schema.invalid',severity:'error',...e};
        if(e.keyword==='additionalProperties'){const s=xbNearest(e.property,e.allowed||[],{aliases:true});if(s)d.suggestion=s;delete d.allowed;}
        if(e.keyword==='enum'&&typeof e.actual==='string'){const s=xbNearest(e.actual,e.allowed.filter(a=>typeof a==='string'));if(s)d.suggestion=s;if(e.allowed.length>30)delete d.allowed;}
        return d;});
      diagnostics.push(...xbContentChecks(wrapped));
      return {ok:!diagnostics.some(d=>d.severity==='error'),diagnostics};
    }
    function xbSvgTextCollisions(svg){
      const out=[],attr=(tag,key)=>new RegExp('\\s'+key+'="([^"]*)"').exec(tag)?.[1];
      const labels=[...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].map(m=>{
        const tag=m[0].slice(0,m[0].indexOf('>')+1),text=m[2].replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<[^>]*>/g,'');
        if(attr(tag,'transform'))return null;
        const estimated=attr(tag,'data-v1-bbox')?.split(',').map(Number),x=deckToNumber(attr(tag,'x')),y=deckToNumber(attr(tag,'y')),size=deckToNumber(attr(tag,'font-size'));
        if(estimated?.length===4&&estimated.every(Number.isFinite))return {text,x:estimated[0],y:estimated[1],width:estimated[2],height:estimated[3]};
        if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(size))return null;
        const w=XBText.width(text,size,deckToNumber(attr(tag,'font-weight'))||700),anchor=attr(tag,'text-anchor');
        return {text,x:x-(anchor==='middle'?w/2:anchor==='end'?w:0),y:y-size*.82,width:w,height:size};
      }).filter(b=>b&&b.width>0&&b.height>0);
      for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
        const a=labels[i],b=labels[j],area=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
        const ratio=area/Math.min(a.width*a.height,b.width*b.height);
        if(ratio>.15)out.push({code:'layout.text-collision',severity:'warning',path:'',message:`SVG labels overlap (${Math.round(ratio*100)}%): "${a.text}" / "${b.text}"`,labels:[a,b],overlap:r1(ratio),measurement:'estimated'});
      }
      return out;
    }
    // Self-check: marks of one SVG must be proportional to their data values.
    function xbSemanticCheck(html){
      const out=[],svgs=html.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)||[];
      const attr=(tag,n)=>{const m=new RegExp(`\\s${n}="([^"]*)"`).exec(tag);return m?m[1]:null;};
      for(const svg of svgs){out.push(...xbSvgTextCollisions(svg));const variant=attr(svg.slice(0,svg.indexOf('>')),'data-variant');
        const marks=(svg.match(/<(rect|path)[^>]*data-mark="(bar|area|flow)"[^>]*>/g)||[]).map(t=>({kind:attr(t,'data-mark'),v:Number(attr(t,'data-v')),w:Number(attr(t,'width')),h:Number(attr(t,'height')),sw:Number(attr(t,'stroke-width'))})).filter(m=>Number.isFinite(m.v)&&m.v!==0);
        const groups={bar:marks.filter(m=>m.kind==='bar'),area:marks.filter(m=>m.kind==='area'),flow:marks.filter(m=>m.kind==='flow'&&m.sw>2)};
        const spread=list=>{if(list.length<2)return 0;const lo=Math.min(...list),hi=Math.max(...list);return hi?(hi-lo)/hi:0;};
        let dev=0;
        if(groups.bar.length>1&&!['stacked-bar','grouped-bar'].includes(variant)){const sameW=spread(groups.bar.map(m=>m.w))<1e-6;dev=Math.max(dev,spread(groups.bar.filter(m=>Math.abs(m.v)>0).map(m=>(sameW?m.h:m.w)/Math.abs(m.v))));}
        if(groups.area.length>1)dev=Math.max(dev,spread(groups.area.map(m=>(m.w+4)*(m.h+4)/m.v)));
        if(groups.flow.length>1)dev=Math.max(dev,spread(groups.flow.map(m=>m.sw/m.v)));
        if(dev>.03)out.push({code:'semantic.mismatch',severity:'error',path:'',message:`${variant}: mark sizes deviate ${Math.round(dev*100)}% from proportionality with their values`,deviation:r1(dev)});}
      return out;
    }
    function xbSummary(diags,count){const n=s=>diags.filter(d=>d.severity===s).length,e=n('error'),w=n('warning'),i=n('info');return {slides:count,errors:e,warnings:w,info:i,score:Math.max(0,100-diags.reduce((s,d)=>s+(XB_SEVERITY_WEIGHT[d.severity]||0),0)/Math.max(1,count))};}
    function xbOptions(opts){const textSafety=Number.isFinite(opts.textSafety)?deckClamp(opts.textSafety,1,2):1;return {strict:opts.strict!==false,trust:'trusted',...(textSafety>1?{textSafety}:{})};}
    function compile(doc,opts={}){
      const o=xbOptions(opts);
      const checked=validate(doc,o),gate=xbVersionGate(doc);
      if(gate)return {ok:false,compiler:XB_COMPILER_VERSION,options:o,slides:[],diagnostics:checked.diagnostics,summary:xbSummary(checked.diagnostics,0)};
      let result;
      try{result=xbWithDeck(doc,o,(next,raw)=>{
        const compileErrors=XB_ERRORS.map(m=>({code:'code.compile',severity:'error',path:'/layouts',message:m}));
        const out=next.slides.map((slide,i)=>{
          const r=XBDiag.collect(()=>XBDiag.at(['slides',i],()=>{
            if(slide.type==='custom-html'||slide.type==='custom-diagram'){const key=slide.type==='custom-html'?'html':'svg',raw0=String(slide.content?.[key]??'');const clean=xbTrustedHtml(raw0,`${slide.type} content.${key}`);if(clean!==raw0)slide={...slide,content:{...slide.content,[key]:clean}};}
            return renderSlideHTML(slide,i,true);}));
          const diagnostics=[...r.diagnostics,...xbSemanticCheck(r.value).map(d=>({...d,path:`/slides/${i}`}))];
          return {index:i,id:slide.id,type:slide.type,html:r.value,hash:xbHash(r.value),diagnostics};});
        return {document:DeckModel.serialize(next.config,next.slides),slides:out,compileErrors};});}
      catch(e){const d={code:'schema.invalid',severity:'error',path:'',message:e.message},diagnostics=[...checked.diagnostics,d];return {ok:false,compiler:XB_COMPILER_VERSION,options:o,slides:[],diagnostics,summary:xbSummary(diagnostics,0)};}
      const diagnostics=[...checked.diagnostics,...result.compileErrors,...result.slides.flatMap(s=>s.diagnostics)];
      const seen=new Set(),uniq=diagnostics.filter(d=>{const k=d.code+'|'+d.path+'|'+d.message;if(seen.has(k))return false;seen.add(k);return true;});
      const summary=xbSummary(uniq,result.slides.length);
      return {ok:summary.errors===0,compiler:XB_COMPILER_VERSION,release:'1.0.0',schemaVersion:'1.0',options:o,
        hash:xbHash(XB_COMPILER_VERSION+'|'+xbCanonical(o)+'|'+result.slides.map(s=>s.hash).join('')),
        document:result.document,slides:result.slides,diagnostics:uniq,summary};
    }
    function qa(doc,opts={}){
      const r=compile(doc,opts);let diagnostics=r.diagnostics;
      if(opts.measure&&typeof document!=='undefined'&&document.body&&r.slides.length)diagnostics=diagnostics.concat(xbMeasureInDocument(r.slides));
      const summary=xbSummary(diagnostics,r.slides.length);
      const perSlide=r.slides.map(s=>({index:s.index,id:s.id,type:s.type,...xbSummary(diagnostics.filter(d=>d.path===`/slides/${s.index}`||d.path.startsWith(`/slides/${s.index}/`)),1)}));
      return {ok:summary.errors===0,compiler:r.compiler,hash:r.hash,options:r.options,summary,slides:perSlide,diagnostics};
    }
    /* Pixel QA (browser only): every element with clipped or escaping content is reported. */
    /* Pixel QA (browser only): text that is clipped by an overflow:hidden box or leaves the slide. Decorative
       shapes are ignored; only elements that own text are measured. */
    function xbMeasureSlides(root){
      const out=[],seen=new Set();
      const label=el=>el.getAttribute('data-component-id')?'component '+el.getAttribute('data-component-id'):el.getAttribute('data-field')?'field '+el.getAttribute('data-field'):el.getAttribute('data-chrome')?'chrome '+el.getAttribute('data-chrome'):(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):el.tagName.toLowerCase());
      const ownsText=el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      root.querySelectorAll('[data-xb-slide]').forEach(page=>{const i=Number(page.getAttribute('data-xb-slide')),P=page.getBoundingClientRect(),tol=2*(P.width/1920||1);
        const evidence=el=>{const source=el.closest('[data-xb-source-path]'),r=el.getBoundingClientRect(),scale=P.width/1920||1;return {sourcePath:source?.getAttribute('data-xb-source-path')||null,bounds:{coordinateSpace:'slide-1920x1080',x:(r.left-P.left)/scale,y:(r.top-P.top)/scale,width:r.width/scale,height:r.height/scale}};};
        const push=(key,message,selector,details={},el=page)=>{const source=el.closest('[data-xb-source-path]')?.getAttribute('data-xb-source-path')||'',dedupeKey=key+'|'+source;if(seen.has(dedupeKey))return;seen.add(dedupeKey);out.push({code:'layout.measured-overflow',severity:'warning',path:'/slides/'+i,message,selector,...details,...evidence(el)});};
        page.querySelectorAll('*').forEach(el=>{const tag=el.tagName.toLowerCase();if(tag==='style'||tag==='script'||tag==='title'||!ownsText(el))return;
          const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
          const txt=el.textContent.trim().replace(/\s+/g,' ').slice(0,60);
          if(el.namespaceURI!=='http://www.w3.org/2000/svg'&&/(hidden|clip)/.test(cs.overflow+cs.overflowX+cs.overflowY)&&(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2))push(i+'|self|'+label(el),label(el)+': text exceeds its clipping box ("'+txt+'")',label(el),{requiredHeight:el.scrollHeight,availableHeight:el.clientHeight,reflowRatio:Math.max(1,el.scrollHeight/Math.max(1,el.clientHeight))},el);
          for(let p=el.parentElement;p&&p!==page;p=p.parentElement){if(p.closest('svg')&&p.tagName.toLowerCase()!=='svg')continue;const pc=getComputedStyle(p);if(!/(hidden|clip)/.test(pc.overflow+pc.overflowX+pc.overflowY))continue;const B=p.getBoundingClientRect();
            if(r.right>B.right+tol||r.bottom>B.bottom+tol||r.left<B.left-tol||r.top<B.top-tol){push(i+'|'+label(p)+'|'+label(el),label(p)+': text is clipped ("'+txt+'")',label(p),{requiredHeight:p.scrollHeight,availableHeight:p.clientHeight,reflowRatio:Math.max(1,p.scrollHeight/Math.max(1,p.clientHeight))},el);return;}}
          if(r.right>P.right+tol||r.bottom>P.bottom+tol||r.left<P.left-tol||r.top<P.top-tol)push(i+'|slide|'+label(el),label(el)+': text extends beyond the slide ("'+txt+'")',label(el),{},el);});});
      root.querySelectorAll('[data-xb-slide]').forEach(page=>{
        const index=Number(page.getAttribute('data-xb-slide'));
        page.querySelectorAll('svg').forEach((svg,svgIndex)=>{
          const elements=[...svg.querySelectorAll('text,circle[data-mark="point"]')].filter(el=>el.closest('svg')===svg);
          const boxes=elements.map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {el,text:el.tagName.toLowerCase()==='text'?el.textContent.trim():'point',kind:el.tagName.toLowerCase(),x:r.x,y:r.y,width:r.width,height:r.height,visible:cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0};}).filter(b=>b.visible);
          for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
            const a=boxes[i],b=boxes[j];if(a.kind!=='text'||b.kind!=='text')continue;
            const area=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)),ratio=area/Math.min(a.width*a.height,b.width*b.height);
            if(ratio>.15)out.push({code:'layout.text-collision',severity:'warning',path:'/slides/'+index,message:'SVG labels overlap ('+Math.round(ratio*100)+'%): "'+a.text+'" / "'+b.text+'"',selector:'svg:nth-of-type('+(svgIndex+1)+')',labels:[a,b].map(({el,visible,...box})=>box),overlap:ratio,measurement:'browser'});
          }
        });
      });
      return out;
    }
    function xbMeasureInDocument(slidesOut){
      const host=document.createElement('div');host.style.cssText='position:absolute;left:-30000px;top:0;width:1920px;pointer-events:none;'; // visible (measured) but off-screen
      host.innerHTML=slidesOut.map(s=>`<div data-xb-slide="${s.index}" style="width:1920px;height:1080px;position:relative;overflow:hidden">${s.html}</div>`).join('');
      document.body.appendChild(host);try{return xbMeasureSlides(host);}finally{host.remove();}
    }
    /* Deterministic repairs: only changes whose meaning is unambiguous. Everything else stays a diagnostic. */
    function xbGet(doc,path){return path.split('/').slice(1).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~')).reduce((o,k)=>o==null?undefined:o[Array.isArray(o)?Number(k):k],doc);}
    function xbParentOf(doc,path){const parts=path.split('/').slice(1).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));const key=parts.pop();return {parent:parts.reduce((o,k)=>o==null?undefined:o[Array.isArray(o)?Number(k):k],doc),key};}
    function xbCoerceNumber(v,percent=false){if(typeof v!=='string')return undefined;const t=(percent?v.trim().replace(/%$/,''):v.trim()).replace(/\s/g,'');let n;if(/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t))n=Number(t.replace(/,/g,''));else if(/^[-+]?\d+(\.\d+)?$/.test(t))n=Number(t);else if(/^[-+]?\d+,\d+$/.test(t))n=Number(t.replace(',','.'));return Number.isFinite(n)?n:undefined;}
    function xbSplitOverflow(doc,changes,opts){
      const out=[],ids=new Set((doc.slides||[]).map(s=>s.id).filter(Boolean));
      const fragment=(c,width,available,depth=0)=>{
        if(!c||depth>7)return [c];
        if(c.type==='table'){
          const resolved=XBDiag.collect(()=>deckData(c)),rows=resolved.value;
          // A snapshot must never erase a failed transform or source diagnostic.
          if(resolved.diagnostics.some(d=>d.severity==='error')||!Array.isArray(rows)||!rows.length||(!c.columns&&Object.keys(rows[0]||{}).length>6))return [c];
          const plan=deckTablePlan(c,width,rows),groups=[];let group=[],height=2+plan.header;
          rows.forEach((row,i)=>{if(group.length&&(group.length>=12||height+plan.heights[i]>available)){groups.push(group);group=[];height=2+plan.header;}group.push(row);height+=plan.heights[i];});if(group.length)groups.push(group);
          if(groups.length<2)return [c];
          // Snapshot the transformed rows so grouping/joins are never repeated after slicing.
          return groups.map(data=>{const copy=xbClone(c);delete copy.dataRef;delete copy.dataset;delete copy.transform;copy.data=data;copy.columns=xbClone(plan.cols);delete copy.height;copy.minHeight=Math.ceil(deckTablePlan(copy,width,data).need);return copy;});
        }
        if(['text','paragraph'].includes(c.type)&&typeof (c.text??c.content)==='string'){
          const key=c.text!==undefined?'text':'content',source=c[key],parts=[];let text='';
          const wrap=value=>{const copy=xbClone(c);copy[key]=value;delete copy.height;copy.minHeight=Math.ceil(deckTextNeed(copy,width));return copy;};
          for(const token of source.match(/\S+\s*|\s+/gu)||[]){const trial=text+token;if(text&&deckTextNeed(wrap(trial),width)>available){parts.push(wrap(text));text=token;}else text=trial;}
          if(text)parts.push(wrap(text));return parts.length>1?parts:[c];
        }
        if(c.type==='list'&&Array.isArray(c.items)){
          const parts=[];let items=[];
          const wrap=values=>{const copy=xbClone(c);copy.items=values;delete copy.height;copy.minHeight=Math.ceil(deckTextNeed(copy,width));return copy;};
          for(const item of c.items){const trial=items.concat([item]);if(items.length&&deckTextNeed(wrap(trial),width)>available){parts.push(wrap(items));items=[item];}else items=trial;}
          if(items.length)parts.push(wrap(items));return parts.length>1?parts:[c];
        }
        if(!DECK_CONTAINERS.has(c.type))return [c];
        const key=Array.isArray(c.children)?'children':'components',kids=c[key]||[],plan=deckContainerPlan(c,width),pad=c.type==='card'?54:0,childAvailable=Math.max(80,available-pad);
        const expanded=kids.flatMap((k,i)=>fragment(k,plan.boxes[i].width,childAvailable,depth+1));
        if(!expanded.length)return [c];
        const parts=[];let cur=[];
        const wrap=items=>{const copy={...xbClone(c),[key]:items};delete copy.height;delete copy.minHeight;return copy;};
        // Keep horizontal rows intact when possible, splitting only when a row exceeds the page.
        const cols=plan.cols,units=['row','grid','columns','group'].includes(c.type)?Array.from({length:Math.ceil(expanded.length/cols)},(_,i)=>expanded.slice(i*cols,(i+1)*cols)):expanded.map(k=>[k]);
        for(const unit of units){const trial=cur.concat(unit);if(cur.length&&deckContainerNeed(wrap(trial),width)>available){parts.push(wrap(cur));cur=unit;}else cur=trial;}
        if(cur.length)parts.push(wrap(cur));
        return parts.length===1&&expanded.length===kids.length&&expanded.every((k,i)=>k===kids[i])?[c]:parts;
      };
      (doc.slides||[]).forEach((slide,i)=>{
        const list=slide?.components||slide?.content?.components;
        if(slide?.type!=='composer'||!Array.isArray(list)||slide.layout==='freeform'){out.push(slide);return;}
        const chunks=xbWithDeck(doc,{...opts,strict:true},()=>XBDiag.mute(()=>{
          const original=xbSolveGrid(list),expanded=list.flatMap((c,j)=>fragment(c,original.widths[j],XB_SCENE.height));
          const chunks=[];let cur=[];
          for(const c of expanded){const trial=cur.concat(c);if(cur.length&&!xbSolveGrid(trial).fits){chunks.push(cur);cur=[c];}else cur=trial;}
          if(cur.length)chunks.push(cur);return chunks;
        }));
        if(chunks.length<2){out.push(slide);return;}
        chunks.forEach((chunk,k)=>{
          const copy=xbClone(slide),root=xbResolveComposerRoot(copy);root.components=chunk;
          if(k&&copy.id){const base=copy.id;let suffix=k+1;while(ids.has(`${base}-${suffix}`))suffix++;copy.id=`${base}-${suffix}`;ids.add(copy.id);}
          root.title=(root.title||copy.layoutName||'Slide')+` (${k+1}/${chunks.length})`;out.push(copy);
        });
        changes.push({path:`/slides/${i}`,action:'split-slide',reason:`deep pagination into ${chunks.length} slides within the 642px scene`,parts:chunks.length});
      });
      doc.slides=out;
    }
    function repair(input,opts={}){
      const changes=[];let doc=xbClone(input);
      if(Array.isArray(doc)){doc={version:'1.0',slides:doc};changes.push({path:'',action:'wrap',reason:'raw slide array wrapped into a v1 document'});}
      if(xbVersionGate(doc))return {ok:false,document:input,changes:[],diagnostics:[xbVersionGate(doc)]};
      const schema=xbSchema();
      for(let pass=0;pass<6;pass++){
        let changed=false;
        for(const e of xbSchemaValidate(schema,doc)){
          const {parent,key}=xbParentOf(doc,e.path);if(parent==null)continue;
          if(e.keyword==='additionalProperties'){const to=xbNearest(e.property,e.allowed||[]);if(to&&!(to in parent)){parent[to]=parent[e.property];delete parent[e.property];changes.push({path:e.path,action:'rename',from:e.property,to,reason:'unknown property; nearest allowed name'});changed=true;}}
          else if(e.keyword==='enum'&&typeof e.actual==='string'&&key==='type'&&e.allowed.includes('chart')&&!xbNearest(e.actual,e.allowed,{aliases:false})){
            // "barchart", "pie-chart", "timeline-vertical": a visual named as a component type → chart/diagram + variant
            const all=[...Object.keys(CHART_VARIANTS),...Object.keys(DIAGRAM_VARIANT_LOOKUP)],v=xbNearest(String(e.actual).replace(/[-_ ]?(chart|diagram|graph)$/i,''),all)||xbNearest(e.actual,all);
            if(v){const t=CHART_VARIANTS[v]?'chart':'diagram';parent.type=t;if(!parent.variant)parent.variant=v;changes.push({path:e.path,action:'replace',from:e.actual,to:{type:t,variant:v},reason:'component type names a visual variant'});changed=true;}}
          else if(e.keyword==='enum'&&typeof e.actual==='string'){const to=xbNearest(e.actual,e.allowed.filter(a=>typeof a==='string'));
            if(to&&to!==e.actual){parent[key]=to;changes.push({path:e.path,action:'replace',from:e.actual,to,reason:'value not allowed; nearest allowed value'});changed=true;}
            else if(key==='variant'&&parent.type==='chart'&&DIAGRAM_VARIANT_LOOKUP[e.actual]){parent.type='diagram';changes.push({path:e.path.replace(/\/variant$/,'/type'),action:'replace',from:'chart',to:'diagram',reason:`"${e.actual}" is a diagram variant`});changed=true;}}
          else if(e.keyword==='type'&&(e.expected||[]).some(t=>t==='number'||t==='integer')){const before=parent[key],n=xbCoerceNumber(before,parent.type==='progress'&&key==='value');if(n!==undefined&&(!e.expected.includes('integer')||e.expected.includes('number')||Number.isInteger(n))){parent[key]=n;changes.push({path:e.path,action:'coerce',from:before,to:n,reason:'numeric string converted to number without rounding'});changed=true;}}
          // Only geometry may be clamped. Business values, counts and measurements remain author data.
          else if((e.keyword==='minimum'||e.keyword==='maximum')&&['span','height','minHeight','gap','maxNodes'].includes(key)&&typeof parent[key]==='number'){const to=e.limit;parent[key]=to;changes.push({path:e.path,action:'clamp',from:e.actual,to,reason:`layout bound (${e.message})`});changed=true;}
          else if(e.keyword==='required'&&e.property==='content'&&xbIsObj(xbGet(doc,e.path))){xbGet(doc,e.path).content={};changes.push({path:e.path+'/content',action:'set',to:{},reason:'layout slides require a content object'});changed=true;}
        }
        // dataRef typos: nearest dataset name
        const sets=Object.keys(doc.datasets||{});
        for(const d of xbContentChecks(doc))if(d.code==='data.unknown-ref'&&d.suggestion&&d.ref){const {parent,key}=xbParentOf(doc,d.path);if(parent&&parent[key]===d.ref||parent?.[key]==='datasets.'+d.ref){parent[key]=d.suggestion;changes.push({path:d.path,action:'replace',from:d.ref,to:d.suggestion,reason:`dataset not found; nearest of ${sets.join(', ')}`});changed=true;}}
        if(!changed)break;
      }
      // Invalid shapes must not reach layout/data code; leave them available for agent correction.
      if(xbSchemaValidate(schema,doc).length){const report=qa(doc,opts);return {ok:false,document:doc,changes,diagnostics:report.diagnostics,summary:report.summary};}
      // Freeform: move components back into the scene.
      (doc.slides||[]).forEach((s,i)=>{if(s?.layout!=='freeform')return;const list=s.components||s.content?.components||[];list.forEach((c,j)=>{const p=c?.position;if(!xbIsObj(p))return;const W=XB_SCENE.width,H=XB_SCENE.height,w=Math.min(deckNum(p.width,520),W),h=Math.min(deckNum(p.height,340),H),x=deckClamp(deckNum(p.x),0,W-w),y=deckClamp(deckNum(p.y),0,H-h);
        if(x!==deckNum(p.x)||y!==deckNum(p.y)||w!==deckNum(p.width,520)||h!==deckNum(p.height,340)){const from={...p};Object.assign(p,{x,y,width:w,height:h});changes.push({path:`/slides/${i}/${s.components?'components':'content/components'}/${j}/position`,action:'move',from,to:{...p},reason:'component was outside the 1728×642 scene'});}});});
      xbSplitOverflow(doc,changes,opts);
      const report=qa(doc,opts);
      return {ok:report.ok,document:doc,changes,diagnostics:report.diagnostics,summary:report.summary};
    }
    function contract(){
      const schema=xbSchema(),d=schema.$defs;
      return {release:'1.0.0',schemaVersion:'1.0',compiler:XB_COMPILER_VERSION,schema,
        scene:{slide:{width:1920,height:1080},composer:{...XB_SCENE},svgViewBox:{width:1000,height:480},diagramPage:{width:1728,height:600}},
        layouts:LAYOUT_CATALOG.filter(l=>!l.custom).map(l=>({type:l.type,group:l.group,name:l.name,desc:l.desc,limits:l.limits||{},contentSchema:d['content-'+l.type]||null,sample:xbClone(xbSampleFor(l.type))})),
        components:Object.keys(COMPONENT_RENDERERS),
        variants:{chart:Object.entries(CHART_VARIANTS).map(([id,v])=>({id,label:v.label,data:v.data,constraints:xbClone(v.constraints)})),
          ...Object.fromEntries(Object.entries(DIAGRAM_VARIANTS).map(([fam,items])=>[fam,Object.entries(items).map(([id,[label,data]])=>({id,label,data}))])),
          mermaid:Object.entries(DECK_DESCRIPTORS.mermaid).map(([id,label])=>({id,label,data:'mermaid component: source string (enhanced renderer only)'}))},
        fieldAliases:DECK_FIELD_ALIASES,diagnostics:XB_DIAGNOSTIC_CODES,
        repairPolicy:{preserves:['business values','item order','text','transformed table rows'],automatic:['unambiguous names','numeric strings without rounding','layout bounds','pagination'],requiresAuthor:['missing version','missing values','invalid ranges','ambiguous relations','unsupported code']},
        options:{strict:'default true: no sample data, missing data is an error',trust:'author layouts, helpers, HTML, SVG and CSS are preserved and executed as provided',textSafety:'default 1, bounded [1,2]: deterministic body/table text width reserve; pipeline may calibrate it from browser overflow'}};
    }
    // Static, script-free page with every compiled slide (deterministic; CSS and sprite are passed in).
    function staticPage(compiled,{css='',sprite='',title='',fonts=''}={}){
      const name=deckSafe(title||compiled.document?.metadata?.name||'XBrain presentation');
      return `<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="generator" content="XBrain compiler ${XB_COMPILER_VERSION}">\n<meta name="xbrain-build" content="${compiled.hash}">\n<title>${name}</title>\n${fonts}<style>${css}</style>\n<style>html,body{margin:0;background:#2B3736}body{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0}.xb-page{width:1920px;height:1080px;position:relative;overflow:hidden;background:#fff;flex:none}@media print{body{padding:0;gap:0;background:#fff}.xb-page{break-after:page;page-break-after:always}}</style>\n</head>\n<body>\n${sprite}\n${compiled.slides.map(s=>`<section class="xb-page" data-xb-slide="${s.index}" data-hash="${s.hash}">${s.html}</section>`).join('\n')}\n</body>\n</html>\n`;
    }
    // Resolve the same post-transform table rows and headers used by rendering.
    // The agent repair gate compares these snapshots, never raw dataset guesses.
    function tableSnapshots(doc,opts={}){
      try{return xbWithDeck(doc,{strict:true,trust:'trusted'},(_,raw)=>{
        const tables=[],errors=[];
        function visit(c,path,depth){
          if(!c||typeof c!=='object')return;if(depth>7){errors.push({path,code:'layout.depth'});return;}
          if(c.type==='table'){
            const result=XBDiag.collect(()=>{const rows=deckData(c);if(!Array.isArray(rows))throw Error('Table rows are not an array');return {rows:xbClone(rows),columns:xbClone(deckTablePlan(c,XB_SCENE.width,rows).cols)};});
            for(const diagnostic of result.diagnostics)if(diagnostic.severity==='error')errors.push({path,code:diagnostic.code});
            tables.push({path,...result.value});
          }
          if(DECK_CONTAINERS.has(c.type)){const key=c.children?'children':'components';if(Array.isArray(c[key]))c[key].forEach((child,i)=>visit(child,path+'/'+key+'/'+i,depth+1));}
        }
        (raw.slides||[]).forEach((slide,i)=>{if(slide?.type!=='composer')return;const list=Array.isArray(slide.components)?slide.components:slide.content?.components,base=Array.isArray(slide.components)?'/slides/'+i+'/components':'/slides/'+i+'/content/components';if(Array.isArray(list))list.forEach((c,j)=>visit(c,base+'/'+j,0));});
        return {ok:errors.length===0,tables,errors};
      });}catch(error){return {ok:false,tables:[],errors:[{path:'',code:'table.snapshot-failed'}]};}
    }
    return Object.freeze({version:XB_COMPILER_VERSION,schema:xbSchema,contract,builtinDeck:()=>xbClone(deckDocument()),validate,compile,qa,repair,staticPage,tableSnapshots,measure:root=>xbMeasureSlides(root),measureSource:()=>xbMeasureSlides.toString(),hash:xbHash,codes:XB_DIAGNOSTIC_CODES});
    })();
    globalThis.XBrainCompiler=XBrainCompiler;
    /* ==========================================================================
       window.XB — API cho agent / console
       ========================================================================== */
    function xbInsertOne(slide, index) {
      const s = xbMakeSlide(slide);
      insertSlidesAt([s], index ?? currentSlideIndex + 1, 'Đã thêm');
      return s.id;
    }
    const XB_API = (globalThis as any).XB = (typeof window !== 'undefined' ? (window as any) : globalThis).XB = {
      version: '1.0.0',
      schemaVersion: XB_VERSION,
      getDeck: () => xbClone(deckDocument()),
      setDeck(doc) { deckApplyDocument(xbClone(doc)); return slides.length; },
      import: (obj, index) => xbImportAny(xbClone(obj), index),
      merge: pack => xbMergePack(xbClone(pack)),
      defineLayout: (type, def) => xbMergePack({ layouts: { [type]: xbClone(def) } }),
      removeLayout: type => xbMergePack({ layouts: { [type]: null } }),
      defineHelper: (name, src) => xbMergePack({ helpers: { [name]: src } }),
      layouts: () => LAYOUT_CATALOG.map(({ type, group, name, desc, limits, custom }) => ({ type, group, name, desc, limits: limits || {}, custom: !!custom })),
      sample: type => xbClone(xbSampleFor(type)),
      slides: () => xbClone(slides),
      addSlide(type, content, index, extra = {}) {
        return xbInsertOne({ ...xbClone(extra), type, content: xbClone(content ?? xbSampleFor(type) ?? {}) }, index);
      },
      insertSlides(list, index) {
        const arr = (Array.isArray(list) ? list : [list]).filter(xbSlideIsValid).map(xbMakeSlide);
        insertSlidesAt(arr, index ?? currentSlideIndex + 1, 'Đã thêm');
        return arr.map(s => s.id);
      },
      updateSlide(index, patch) {
        if (!slides[index]) throw new Error('Không có slide ' + index);
        DeckStore.change(() => { slides[index].content = { ...(slides[index].content || {}), ...xbClone(patch) }; });
        renderCurrentSlide();
      },
      replaceSlide(index, slide) {
        if (!slides[index]) throw new Error('Không có slide ' + index);
        const s = xbMakeSlide(slide); s.id = slides[index].id;
        DeckStore.change(() => { slides[index] = s; });
        renderCurrentSlide();
      },
      removeSlide(index) { setSingleSelection(index); deleteSelection(); },
      moveSlide(from, to) { moveSlidesTo([from], to > from ? to + 1 : to); },
      render: (slideOrIndex, index = 0) => typeof slideOrIndex === 'number'
        ? renderSlideHTML(slides[slideOrIndex], slideOrIndex, true)
        : renderSlideHTML(xbMakeSlide(slideOrIndex), index, true),
      select: i => selectSlide(i),
      undo: () => undoDeck(),
      redo: () => redoDeck(),
      errors: () => XB_ERRORS.slice(),
      chromeFields: () => Object.entries(XB_CHROME_FIELDS).map(([key, f]) => ({ key, label: f.label, store: f.store, value: xbChrome(key, slides[currentSlideIndex]), slides: xbChromeSlides(key).map(i => i + 1) })),
      setChrome: (key, value, scope = 'all') => xbApplyChrome(key, value, scope),
      exportHTML: () => buildEditedHTML(),
      exportJSON: () => JSON.stringify(deckDocument(), null, 2),
      ctx: XB_CTX,
      // Agent-native compiler (strict by default, with author code enabled).
      compiler: XBrainCompiler,
      qa: (opts = {}) => XBrainCompiler.qa(deckDocument(), { measure: true, ...opts }),
      repair: (opts = {}) => XBrainCompiler.repair(deckDocument(), opts),
      agent: null as any,
    };

    /* AGENT: isolated candidate and transactional JSON Patch subset. */
    const XBAgent=(({getDocument,getWindow,getNavigator,encodeBytes})=>{
      const sessionId='sess-'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
      let sequence=0,request=0,studioSnapshot=null,studioRevision=null,booted=false,resolveReady;
      let candidate=null,candidateRevision=null,candidateStudioRevision=null;
      let runSequence=0,renderQueue=Promise.resolve(),jobStatus='idle',activeJob=null;
      const runs=new Map(),blockingCodes=new Set(['layout.measured-overflow','data.truncated','text.truncated','layout.legibility','layout.text-collision','slide.duplicate-id','render.enhanced-only']);
      let artifactSequence=0;const artifacts=new Map();
      let proposalSequence=0,repairAttempts=0;const proposals=new Map(),snapshots=new Map();
      let eventSequence=0;const events=[],listeners=new Set();
      const bootPromise=new Promise(resolve=>{resolveReady=resolve;});
      const nextRevision=()=> 'r-'+sessionId+'-'+(++sequence);
      function fail(code,message,details){const error=new Error(message);error.code=code;error.details=details;throw error;}
      const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
      function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';return JSON.stringify(value);}
      function jsonCopy(input){
        const pending=[{value:input,depth:0}],seen=new Set();let count=0,chars=0;
        while(pending.length){
          const {value,depth,exit}=pending.pop();if(exit){seen.delete(value);continue;}if(++count>200000||depth>64)fail('INPUT_TOO_LARGE','JSON exceeds node or depth limit');
          if(value===null||typeof value==='boolean')continue;
          if(typeof value==='string'){chars+=value.length;if(chars>10485760)fail('INPUT_TOO_LARGE','JSON exceeds size limit');continue;}
          if(typeof value==='number'&&Number.isFinite(value))continue;
          if(typeof value!=='object')fail('INVALID_ARGUMENT','Input must contain only JSON values');
          if(seen.has(value))fail('INVALID_ARGUMENT','Cyclic objects are not accepted');seen.add(value);pending.push({value,exit:true});
          if(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null)fail('INVALID_ARGUMENT','Input must contain plain JSON objects');
          if(Object.getOwnPropertySymbols(value).length)fail('INVALID_ARGUMENT','Symbol properties are not JSON');
          const keys=Object.keys(value),names=Object.getOwnPropertyNames(value);
          if(names.length!==keys.length+(Array.isArray(value)?1:0))fail('INVALID_ARGUMENT','Non-enumerable properties are not accepted');
          if(Array.isArray(value)&&(keys.length!==value.length||keys.some((key,i)=>key!==String(i))))fail('INVALID_ARGUMENT','Sparse arrays or extra array properties are not JSON');
          for(const key of keys){
            const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!own(d,'value'))fail('INVALID_ARGUMENT','Accessors are not accepted');
            chars+=key.length;if(chars>10485760)fail('INPUT_TOO_LARGE','JSON exceeds size limit');pending.push({value:d.value,depth:depth+1});
          }
        }
        const text=JSON.stringify(input);if(encodeBytes(text).length>10485760)fail('INPUT_TOO_LARGE','JSON exceeds 10 MiB');
        return JSON.parse(text);
      }
      function checkDocument(doc){
        if(!doc||typeof doc!=='object'||Array.isArray(doc))fail('INVALID_ARGUMENT','Document must be an object');
        if(doc.version!=='1.0')fail('VERSION_UNSUPPORTED','Document version must be 1.0');
        if(!Array.isArray(doc.slides)||doc.slides.length<1)fail('INVALID_ARGUMENT','Document must contain at least one slide');
        if(doc.slides.length>400)fail('INPUT_TOO_LARGE','Document exceeds 400 slides');
      }
      function guardBase(args){
        if(!args||!own(args,'baseRevision'))fail('INVALID_ARGUMENT','baseRevision is required');
        if(args.baseRevision!==null&&typeof args.baseRevision!=='string')fail('INVALID_ARGUMENT','baseRevision must be a string or null');
        if(args.baseRevision!==candidateRevision)fail('REVISION_CONFLICT','Candidate revision changed',{expected:args.baseRevision,current:candidateRevision});
      }
      function pointer(path){
        if(typeof path!=='string'||(path!==''&&!path.startsWith('/'))||path.length>4096)fail('PATCH_PATH_INVALID','Invalid JSON Pointer');
        if(path==='')return [];
        return path.slice(1).split('/').map(part=>{if(/~(?![01])/.test(part))fail('PATCH_PATH_INVALID','Invalid JSON Pointer escape');return part.replace(/~1/g,'/').replace(/~0/g,'~');});
      }
      function arrayIndex(key,length,add){
        if(add&&key==='-')return length;
        if(!/^(0|[1-9]\d*)$/.test(key))fail('PATCH_PATH_INVALID','Invalid array index');
        const index=Number(key);if(!Number.isSafeInteger(index)||index>(add?length:length-1))fail('PATCH_PATH_INVALID','Array index out of bounds');return index;
      }
      function at(root,parts){
        let value=root;for(const key of parts){if(value===null||typeof value!=='object')fail('PATCH_PATH_INVALID','Pointer parent is not a container');const k=Array.isArray(value)?arrayIndex(key,value.length,false):key;if(!own(value,k))fail('PATCH_PATH_INVALID','Pointer does not exist');value=value[k];}return value;
      }
      function patch(args){
        guardBase(args);if(!candidate)fail('SOURCE_UNAVAILABLE','No candidate');
        const operations=jsonCopy(args.operations);if(!Array.isArray(operations)||operations.length>256)fail('INPUT_TOO_LARGE','Patch must have at most 256 operations');
        let doc=jsonCopy(candidate);const changedPaths=[];
        let scopeParts=null;
        if(args.scope!=null){
          const scope=jsonCopy(args.scope);if(!scope||typeof scope!=='object'||typeof scope.sourcePath!=='string')fail('INVALID_ARGUMENT','Scope requires sourcePath');
          scopeParts=pointer(scope.sourcePath);at(doc,scopeParts);
          if(scope.slideId!=null){if(scopeParts[0]!=='slides'||!/^\d+$/.test(scopeParts[1]||'')||doc.slides[Number(scopeParts[1])]?.id!==scope.slideId)fail('PATCH_OUT_OF_SCOPE','Scope slide does not match candidate');}
        }
        for(const operation of operations){
          if(!operation||typeof operation!=='object'||Array.isArray(operation))fail('INVALID_ARGUMENT','Invalid patch operation');
          const op=operation.op,parts=pointer(operation.path);
          if(!['add','remove','replace','test'].includes(op))fail('PATCH_OP_UNSUPPORTED','Unsupported patch operation');
          if(['add','replace','test'].includes(op)&&!own(operation,'value'))fail('INVALID_ARGUMENT','Patch value is required');
          if(op!=='test'&&scopeParts&&!scopeParts.every((v,i)=>parts[i]===v))fail('PATCH_OUT_OF_SCOPE','Patch changes data outside scope');
          if(op==='test'){if(canonical(at(doc,parts))!==canonical(operation.value))fail('PATCH_TEST_FAILED','Patch test failed');continue;}
          if(!parts.length){if(op==='remove')fail('PATCH_PATH_INVALID','Cannot remove document root');doc=operation.value;}
          else{
            const parent=at(doc,parts.slice(0,-1)),key=parts[parts.length-1];
            if(parent===null||typeof parent!=='object')fail('PATCH_PATH_INVALID','Pointer parent is not a container');
            if(Array.isArray(parent)){const i=arrayIndex(key,parent.length,op==='add');if(op==='add')parent.splice(i,0,operation.value);else if(op==='remove')parent.splice(i,1);else parent[i]=operation.value;}
            else {if(op!=='add'&&!own(parent,key))fail('PATCH_PATH_INVALID','Pointer does not exist');if(op==='remove')delete parent[key];else Object.defineProperty(parent,key,{value:operation.value,writable:true,enumerable:true,configurable:true});}
          }
          changedPaths.push(operation.path);
        }
        doc=jsonCopy(doc);checkDocument(doc);
        const indices=new Set();let allSlides=operations.some(op=>['add','remove'].includes(op.op)&&/^\/slides\/(?:\d+|-)$/.test(op.path));for(const path of changedPaths){const match=/^\/slides\/(\d+)(?:\/|$)/.exec(path);if(match)indices.add(Number(match[1]));else allSlides=true;}
        const affectedSlideIds=[...new Set((allSlides?[...candidate.slides,...doc.slides].map(s=>s?.id):[...indices].flatMap(i=>[candidate.slides[i]?.id,doc.slides[i]?.id])).filter(Boolean))];
        return {document:doc,changedPaths,affectedSlideIds,beforeFingerprint:XBrainCompiler.hash(canonical(candidate)),afterFingerprint:XBrainCompiler.hash(canonical(doc))};
      }
      function rememberCandidate(){if(candidate){snapshots.set(candidateRevision,jsonCopy(candidate));while(snapshots.size>4)snapshots.delete(snapshots.keys().next().value);}}
      function agentContentDiagnostics(doc){
        const out=[];
        const hidden=(path)=>out.push({code:'data.unrendered-children',severity:'error',path,message:'This component collection is not rendered; move it to a supported container.'});
        (doc.slides||[]).forEach((slide,index)=>{if(!slide||typeof slide!=='object')return;const base='/slides/'+index;
          if(slide.type==='composer'&&Object.prototype.hasOwnProperty.call(slide,'components')&&Array.isArray(slide.content?.components)&&slide.content.components.length)hidden(base+'/content/components');
          function visit(c,path,depth){if(!c||typeof c!=='object'||depth>7)return;
            if(!DECK_CONTAINERS.has(c.type||'text'))for(const key of ['children','components'])if(Array.isArray(c[key])&&c[key].length)hidden(path+'/'+key);
            if(DECK_CONTAINERS.has(c.type||'text')&&c.children&&Array.isArray(c.components)&&c.components.length)hidden(path+'/components');
            for(const key of ['children','components'])if(Array.isArray(c[key]))c[key].forEach((child,i)=>visit(child,path+'/'+key+'/'+i,depth+1));
          }
          for(const [key,list] of [['components',slide.components],['content/components',slide.content?.components]])if(Array.isArray(list))list.forEach((c,i)=>visit(c,base+'/'+key+'/'+i,0));
        });return out;
      }
      function storeCandidate(doc){
        checkDocument(doc);const validation=XBrainCompiler.validate(doc,{strict:true,trust:'trusted'}),diagnostics=[...validation.diagnostics,...agentContentDiagnostics(doc)],seen=new Set(),normalization=[];
        doc.slides.forEach((slide,index)=>{if(!slide||typeof slide.id!=='string'||!slide.id)normalization.push({path:'/slides/'+index+'/id',reason:'missing'});else if(seen.has(slide.id))normalization.push({path:'/slides/'+index+'/id',reason:'duplicate'});else seen.add(slide.id);});
        candidate=doc;candidateRevision=nextRevision();candidateStudioRevision=studioRevision;repairAttempts=0;rememberCandidate();
        return {revision:candidateRevision,data:{validation:{valid:validation.ok&&!diagnostics.some(d=>d.severity==='error')},diagnostics,normalization,validationFresh:true,qaFresh:false}};
      }
      function syncStudio(){
        const snapshot=JSON.stringify(deckDocument());
        if(snapshot!==studioSnapshot){studioSnapshot=snapshot;studioRevision=nextRevision();}
        return studioRevision;
      }
      function candidateSnapshot(revision){
        if(!candidate)fail('SOURCE_UNAVAILABLE','No candidate');
        if(revision!=null&&typeof revision!=='string')fail('INVALID_ARGUMENT','revision must be a string');
        if(revision!=null&&revision!==candidateRevision)fail('REVISION_CONFLICT','Candidate revision changed',{expected:revision,current:candidateRevision});
        syncStudio();return {document:jsonCopy(candidate),revision:candidateRevision,studioRevision};
      }
      function runtimeAssets(){
        const doc=getDocument();
        const domCss=doc?[...doc.head.querySelectorAll('style')].map(el=>el.textContent).join('\n'):'';
        const domSprite=doc?.querySelector('svg.v1-svg-defs')?.outerHTML||'';
        return {css:domCss.trim()?domCss:XBRAIN_EMBEDDED_CSS,sprite:domSprite||XBRAIN_SVG_SPRITE,fonts:''};
      }
      function agentPage(compiled,preview=false){
        const assets=runtimeAssets();
        let page=XBrainCompiler.staticPage(compiled,{css:assets.css,sprite:assets.sprite,fonts:assets.fonts});
        if(preview)page=page.replace('</head>','<style>body{padding:0;gap:0}</style></head>');
        return page;
      }
      function waitLimit(promise,ms){let timer;return Promise.race([promise,new Promise(resolve=>{timer=setTimeout(()=>resolve('timeout'),ms);})]).finally(()=>clearTimeout(timer));}
      function instrumentPreview(doc,source,indices){
        const pages=[...doc.body.children].filter(node=>node.matches('section.xb-page[data-xb-slide]'));
        if(pages.length!==indices.length||pages.some((page,i)=>page.getAttribute('data-xb-slide')!==String(indices[i])))throw new Error('Preview slide boundaries are invalid');
        const saved=[],added=[],selectors={};
        doc.querySelectorAll('[data-xb-source-path]').forEach(node=>{saved.push([node,'data-xb-source-path',node.getAttribute('data-xb-source-path')]);node.removeAttribute('data-xb-source-path');});
        doc.querySelectorAll('[data-xb-slide]').forEach(node=>{if(!pages.includes(node)){saved.push([node,'data-xb-slide',node.getAttribute('data-xb-slide')]);node.removeAttribute('data-xb-slide');}});
        pages.forEach(page=>{
          const index=Number(page.getAttribute('data-xb-slide')),slide=source.slides[index];if(slide?.type!=='composer')return;
          const list=Array.isArray(slide.components)?slide.components:slide.content?.components,base=Array.isArray(slide.components)?'/slides/'+index+'/components':'/slides/'+index+'/content/components';
          if(!Array.isArray(list))return;const paths=[];
          function visit(c,path,depth){if(!c||typeof c!=='object'||depth>7)return;const type=c.type||'text';paths.push({path,type});if(DECK_CONTAINERS.has(type)){const key=c.children?'children':'components',children=c[key];if(Array.isArray(children))children.forEach((child,i)=>visit(child,path+'/'+key+'/'+i,depth+1));}}
          list.forEach((c,i)=>visit(c,base+'/'+i,0));const nodes=[...page.querySelectorAll('.v1-component')];
          if(nodes.length!==paths.length||nodes.some((node,i)=>!node.classList.contains('v1-'+paths[i].type)))return;
          nodes.forEach((node,i)=>{node.setAttribute('data-xb-source-path',paths[i].path);added.push(node);const steps=[];let child=node;
            while(child&&child!==page){const parent=child.parentElement;if(!parent)break;steps.unshift('*:nth-child('+([...parent.children].indexOf(child)+1)+')');child=parent;}
            if(child===page)selectors[paths[i].path]='body > section.xb-page[data-xb-slide="'+index+'"] > '+steps.join(' > ');
          });
        });
        return {selectors,restore(){added.forEach(node=>node.removeAttribute('data-xb-source-path'));saved.forEach(([node,key,value])=>node.setAttribute(key,value));}};
      }
      async function measureChunk(compiled,subset,source){
        const docRoot=getDocument(),frame=docRoot.createElement('iframe');frame.setAttribute('aria-hidden','true');
        frame.style.cssText='position:fixed;left:-32000px;top:0;width:1920px;height:1080px;border:0;pointer-events:none';
        try{
          const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(new Error('Preview failed to load'));});
          frame.srcdoc=agentPage({...compiled,slides:subset},true);docRoot.body.appendChild(frame);
          if(await waitLimit(loaded,5000)==='timeout')return {status:'timeout',diagnostics:[],fontStatus:'timeout',assetStatus:'timeout'};
          const doc=frame.contentDocument;if(!doc||!doc.body)throw new Error('Preview document unavailable');
          if(doc.body.querySelectorAll('*').length>30000)return {status:'failed',diagnostics:[{code:'qa.resource-limit',severity:'error',path:'',message:'Preview batch exceeds 30,000 DOM nodes'}],fontStatus:'unavailable',assetStatus:'unavailable'};
          const fontStatus=doc.fonts?await waitLimit(doc.fonts.ready.then(()=> 'ready'),3000):'unavailable';
          const images=[...doc.images];const imageStatus=await waitLimit(Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});}))).then(()=> 'ready'),3000);
          const assetStatus=imageStatus==='timeout'?'timeout':images.some(img=>!img.naturalWidth)?'failed':'ready';
          if(await waitLimit(new Promise(resolve=>getWindow().requestAnimationFrame(()=>getWindow().requestAnimationFrame(resolve))),3000)==='timeout')return {status:'timeout',diagnostics:[],fontStatus,assetStatus};
          const mapping=instrumentPreview(doc,source,subset.map(slide=>slide.index));let diagnostics;
          try{diagnostics=XBrainCompiler.measure(doc.body);}finally{mapping.restore();}
          diagnostics.forEach(item=>{if(item.sourcePath&&mapping.selectors[item.sourcePath]){item.measurementLabel=item.selector;item.selector=mapping.selectors[item.sourcePath];}});
          return {status:'completed',diagnostics,fontStatus,assetStatus};
        }finally{frame.remove();}
      }
      function findingsFor(diagnostics,doc,runId){
        return diagnostics.map((d,i)=>{
          const match=/^\/slides\/(\d+)(?:\/|$)/.exec(d.path||''),index=match?Number(match[1]):null,slide=index==null?null:doc.slides[index];
          const candidatePath=d.sourcePath||d.path;let exact=false;if(match&&typeof candidatePath==='string'&&candidatePath.startsWith('/slides/'+index+'/')&&/\/(?:components|children)\/\d+(?:\/|$)/.test(candidatePath)){try{at(doc,pointer(candidatePath));exact=true;}catch(_){}}
          const sourcePath=exact?candidatePath:(index==null?'':'/slides/'+index),selector=exact&&d.sourcePath?d.selector:null;
          return {...d,findingId:runId+':f'+(i+1),origin:d.measurement==='browser'||d.code==='layout.measured-overflow'?'browser-measure':'compiler',blocking:d.severity==='error'||blockingCodes.has(d.code),slideId:slide?.id??null,sourcePath,componentRef:exact?runId+':'+sourcePath:null,granularity:exact?'component':'slide',confidence:exact?'high':'low',measurementLabel:d.measurementLabel||d.selector||null,selector};
        });
      }
      function runResult(run){
        syncStudio();const fresh=run.revision===candidateRevision&&run.studioRevision===studioRevision;
        const reasons=run.findings.filter(f=>f.blocking).map(f=>({code:f.code,path:f.sourcePath}));
        if(run.measurement!=='browser-completed')reasons.push({code:'QA_NOT_MEASURED'});
        if(run.checkedSlideIds.length!==run.totalSlideCount)reasons.push({code:'QA_PARTIAL'});
        if(run.profile!=='agent-strict')reasons.push({code:'QA_PROFILE_MISMATCH'});
        if(run.fontStatus!=='ready')reasons.push({code:'ASSET_NOT_READY'});
        if(!fresh)reasons.push({code:'QA_STALE'});
        return {runId:run.runId,status:fresh?run.status:'stale',fresh,qa:{passed:reasons.length===0,checkedSlides:run.checkedSlideIds.length,totalSlides:run.totalSlideCount,errors:run.findings.filter(f=>f.severity==='error').length,warnings:run.findings.filter(f=>f.severity==='warning').length,measurement:run.measurement,visualReview:run.review?'agent-reported':'not-assessed',review:run.review||null,gateReasons:reasons},findings:run.findings};
      }
      function runManifest(run){return {compilerVersion:XBrainCompiler.version,inputFingerprint:run.inputFingerprint,profile:run.profile,strict:true,trust:'trusted',renderMode:run.renderMode,fontProfile:'document-fonts-with-fallback',assetPolicy:'browser-managed',viewport:run.viewport,fontStatus:run.fontStatus,assetStatus:run.assetStatus,checkedSlideIds:run.checkedSlideIds,totalSlideCount:run.totalSlideCount,startedAt:run.startedAt,endedAt:run.endedAt,htmlHash:run.compiled.hash};}
      function strictRun(revision,runId){
        const run=runId?runs.get(runId):[...runs.values()].reverse().find(r=>r.revision===revision&&r.profile==='agent-strict');
        if(!run)fail('QA_NOT_MEASURED','A full browser QA run is required');
        if(run.revision!==revision||!runResult(run).fresh)fail('QA_STALE','QA does not match the current candidate and Studio');
        if(run.profile!=='agent-strict')fail('QA_STALE','QA profile does not match strict export');
        const quality=runResult(run).qa;
        if(quality.measurement!=='browser-completed'||quality.checkedSlides!==quality.totalSlides)fail('QA_NOT_MEASURED','Full-deck browser measurement is required',{gateReasons:quality.gateReasons});
        if(!quality.passed)fail('QA_GATE_FAILED','QA findings block this operation',{gateReasons:quality.gateReasons.slice(0,100)});
        return run;
      }
      // Conservative audit: an automatic repair is accepted only when the
      // original business atoms can still be found in order and without edits.
      function preservation(from,to,changes=[]){
        const componentGeometry=new Set(['type','variant','layout','position','height','minHeight','width','span','gap','x','y','style']);
        const split=changes.some(c=>c.action==='split-slide');let tableAudit={status:'not-required',sourceTables:0,fragmentTables:0};
        if(split){
          const original=XBrainCompiler.tableSnapshots(from,{trust:'trusted'}),repaired=XBrainCompiler.tableSnapshots(to,{trust:'trusted'});let index=0,ok=original.ok&&repaired.ok;
          if(ok)for(const source of original.tables){let offset=0,consumed=false;
            do{const fragment=repaired.tables[index++];if(!fragment||canonical(fragment.columns)!==canonical(source.columns)){ok=false;break;}
              consumed=true;for(const row of fragment.rows){if(offset>=source.rows.length||canonical(row)!==canonical(source.rows[offset++])){ok=false;break;}}
              if(!ok||(!fragment.rows.length&&offset<source.rows.length)){ok=false;break;}
            }while(offset<source.rows.length);
            if(!ok||!consumed||offset!==source.rows.length){ok=false;break;}
          }
          if(index!==repaired.tables.length)ok=false;
          tableAudit={status:ok?'preserved':'unverified',sourceTables:original.tables.length,fragmentTables:repaired.tables.length,errors:[...original.errors,...repaired.errors].slice(0,20)};
        }
        function atoms(doc){const out=[];function visit(value,path,key){
          if(Array.isArray(value)){value.forEach((v,i)=>visit(v,path+'/'+i,key));return;}
          if(value&&typeof value==='object'){const slideNode=/^\/slides\/\d+$/.test(path),componentNode=/^\/slides\/\d+\/(?:content\/)?components\/\d+(?:(?:\/children|\/components)\/\d+)*$/.test(path);
            for(const [k,v] of Object.entries(value)){const p=path+'/'+k.replace(/~/g,'~0').replace(/\//g,'~1');if((slideNode&&['id','type','layout','layoutName','group'].includes(k))||(componentNode&&componentGeometry.has(k))||(split&&componentNode&&value.type==='table'&&['data','dataRef','dataset','transform','columns'].includes(k)))continue;visit(v,p,k);}return;}
          out.push({key,value,path});
        }visit(doc,'','');return out;}
        const before=atoms(from),after=atoms(to);let cursor=0;const missing=[];
        for(const item of before){let found=-1,end=-1;
          for(let j=cursor;j<after.length;j++){
            if(after[j].key!==item.key)continue;
            if(after[j].value===item.value||(/^\/slides\/\d+\/(?:content\/)?title$/.test(item.path)&&typeof item.value==='string'&&typeof after[j].value==='string'&&after[j].value.startsWith(item.value)&&/^ \(\d+\/\d+\)$/.test(after[j].value.slice(item.value.length)))){found=j;end=j+1;break;}
            if(typeof item.value==='string'&&/^\/slides\/\d+\/(?:content\/)?components\/\d+(?:(?:\/children|\/components)\/\d+)*\/(?:text|content)$/.test(item.path)&&typeof after[j].value==='string'){
              let joined='';for(let k=j;k<after.length&&k<j+128&&after[k].key===item.key&&typeof after[k].value==='string';k++){joined+=after[k].value;if(joined===item.value){found=j;end=k+1;break;}if(!item.value.startsWith(joined))break;}if(found>=0)break;
            }
          }
          if(found<0){missing.push(item.path);break;}cursor=end;
        }
        return {status:missing.length||tableAudit.status==='unverified'?'unverified':'preserved',missingPaths:missing.slice(0,20),tableAudit,method:'ordered-business-atoms-and-transformed-tables'};
      }
      function changedPaths(a,b,path='',out=[]){
        if(canonical(a)===canonical(b))return out;
        if(out.length>=1000)return out;
        if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b)||(Array.isArray(a)&&a.length!==b.length)){out.push(path);return out;}
        const keys=new Set([...Object.keys(a),...Object.keys(b)]);
        for(const key of keys){const p=path+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1');if(!own(a,key)||!own(b,key))out.push(p);else changedPaths(a[key],b[key],p,out);if(out.length>=1000)break;}return out;
      }
      async function renderSnapshot(args){
        const snap=candidateSnapshot(args?.revision),startedAt=new Date().toISOString(),inputFingerprint=XBrainCompiler.hash(canonical(snap.document));jobStatus='compiling';
        try{
          if(args?.profile&&!['agent-strict','draft'].includes(args.profile))fail('INVALID_ARGUMENT','Unsupported profile');
          const compiled=XBrainCompiler.compile(snap.document,{strict:true,trust:'trusted'});
          const available=compiled.slides;if(available.some(s=>s.html.length>1048576)||available.reduce((sum,s)=>sum+s.html.length,0)>33554432)fail('INPUT_TOO_LARGE','Compiled HTML exceeds the preview budget');let selected=available;
          if(args?.slides!==undefined){
            if(!Array.isArray(args.slides)||!args.slides.length)fail('INVALID_ARGUMENT','slides must be a nonempty array');
            const indices=new Set();for(const value of args.slides){const i=typeof value==='number'?value:available.findIndex(s=>s.id===value);if(!Number.isInteger(i)||i<0||i>=available.length||indices.has(i))fail('INVALID_ARGUMENT','Unknown or duplicate slide');indices.add(i);}selected=available.filter(s=>indices.has(s.index));
          }
          const runId='run-'+(++runSequence),diagnostics=compiled.diagnostics.concat(agentContentDiagnostics(snap.document)),fontStatuses=[],assetStatuses=[],checked=[];let measurement=selected.length?'browser-completed':'unavailable';activeJob={runId,cancelled:false};
          const batches=[];let batch=[],batchSize=0;for(const slide of selected){if(batch.length&&(batch.length>=5||batchSize+slide.html.length>1048576)){batches.push(batch);batch=[];batchSize=0;}batch.push(slide);batchSize+=slide.html.length;}if(batch.length)batches.push(batch);
          jobStatus='measuring';
          for(const subset of batches){
            if(activeJob.cancelled){measurement='partial';break;}
            const measured=await measureChunk(compiled,subset,snap.document);fontStatuses.push(measured.fontStatus);assetStatuses.push(measured.assetStatus);diagnostics.push(...measured.diagnostics);
            if(measured.status!=='completed'){measurement='failed';break;}checked.push(...subset.map(s=>s.id));
          }
          const findings=findingsFor(diagnostics,snap.document,runId);
          const run={runId,revision:snap.revision,studioRevision:snap.studioRevision,inputFingerprint,compiled,sourceDocument:snap.document,checkedSlideIds:checked,totalSlideCount:snap.document.slides.length,measurement,findings,fontStatus:fontStatuses.includes('timeout')?'timeout':fontStatuses.includes('unavailable')?'unavailable':'ready',assetStatus:assetStatuses.includes('timeout')?'timeout':assetStatuses.includes('failed')?'failed':'ready',status:measurement==='partial'?'cancelled':findings.length?'completed-with-findings':'completed',profile:args?.profile||'agent-strict',startedAt,endedAt:new Date().toISOString(),renderMode:'native',viewport:{width:1920,height:1080}};
          runs.set(runId,run);while(runs.size>3)runs.delete(runs.keys().next().value);
          return {revision:snap.revision,data:{...runResult(run),manifest:runManifest(run),slides:selected.map(({index,id,type,hash})=>({index,id,type,hash}))}};
        }finally{activeJob=null;jobStatus='idle';}
      }
      function response(operation,work){
        const requestId='req-'+(++request),start=Date.now();
        return bootPromise.then(async()=>{
          let envelope;
          try{const result=await work();envelope={apiVersion:'agent.1',ok:true,operation,requestId,sessionId,revision:result.revision??null,durationMs:Date.now()-start,data:JSON.parse(JSON.stringify(result.data))};}
          catch(error){envelope={apiVersion:'agent.1',ok:false,operation,requestId,sessionId,revision:candidateRevision??studioRevision,durationMs:Date.now()-start,error:{code:error.code||'OPERATION_FAILED',message:String(error.message||error),retryable:['REVISION_CONFLICT','PATCH_TEST_FAILED'].includes(error.code),...(error.details?{details:JSON.parse(JSON.stringify(error.details))}:{})}};}
          if(!['ready','getState','getDeck','getLogs','getPreview','getRun','inspect'].includes(operation)){
            const entry={eventId:++eventSequence,operation,status:envelope.ok?'success':'error',revision:envelope.revision,code:envelope.error?.code||null,durationMs:envelope.durationMs,time:new Date().toISOString()};
            events.push(entry);if(events.length>200)events.shift();for(const listener of listeners){try{listener({...entry});}catch(_){}}
          }
          return envelope;
        });
      }
      const facade=Object.freeze({
        ready:()=>response('ready',()=>({revision:syncStudio(),data:{ready:true,release:'1.0.0',schemaVersion:XB_VERSION,compilerVersion:XBrainCompiler.version}})),
        capabilities:({detail='compact'}={})=>response('capabilities',()=>{
          if(!['compact','full'].includes(detail)){const e=new Error('Unsupported capability detail');e.code='INVALID_ARGUMENT';throw e;}
          const contract=XBrainCompiler.contract();
          const data={release:contract.release,schemaVersion:contract.schemaVersion,compilerVersion:contract.compiler,agentApiVersion:'agent.1',documentLimit:{maxSlides:400,maxJsonBytes:10485760,maxNodes:200000,maxDepth:64,maxPatchOperations:256},scene:contract.scene.slide,
            modes:{javascript:true,browserUi:true,offlineCore:true,backendRequired:false},
            features:{candidate:true,jsonPatch:true,patchOperations:['add','remove','replace','test'],browserMeasure:true,repairProposal:true,studioCommit:true,secureStudioCommit:false,trustedAuthorContent:true,sandboxedPreview:false,cancelBetweenBatches:true,inPagePngScreenshot:false,visualVisionQa:'external-agent',renderedHtml:true,staticHtmlExport:true,editableHtmlExport:false},
            qualityPolicy:{blockingCodes:[...blockingCodes],renderProfiles:['draft','agent-strict'],exportProfiles:['draft','agent-strict','agent-strict-reviewed']},agentDiagnostics:['data.unrendered-children','qa.resource-limit'],
            apiErrors:['OPERATION_FAILED','INVALID_ARGUMENT','SOURCE_UNAVAILABLE','REVISION_CONFLICT','VERSION_UNSUPPORTED','INPUT_TOO_LARGE','PATCH_PATH_INVALID','PATCH_TEST_FAILED','PATCH_OUT_OF_SCOPE','PATCH_OP_UNSUPPORTED','RENDER_NOT_READY','REPAIR_LIMIT','REPAIR_SCOPE_ESCALATION','PRESERVATION_UNVERIFIED','REPAIR_STAGNATED','QA_NOT_MEASURED','QA_STALE','QA_GATE_FAILED','EXPORT_FORMAT_UNAVAILABLE','VISUAL_REVIEW_REQUIRED','DOWNLOAD_BLOCKED'],
            counts:{layouts:contract.layouts.length,components:contract.components.length,chartVariants:contract.variants.chart.length},links:{schema:'getSchema',contract:'getContract'}};
          if(detail==='full')data.contract=contract;
          return {revision:syncStudio(),data};
        }),
        getSchema:()=>response('getSchema',()=>({revision:syncStudio(),data:XBrainCompiler.schema()})),
        getContract:()=>response('getContract',()=>({revision:syncStudio(),data:XBrainCompiler.contract()})),
        getState:()=>response('getState',()=>{syncStudio();const latest=[...runs.values()].at(-1);return {revision:candidateRevision??studioRevision,data:{ready:booted,mode:currentAppMode,studioRevision,candidateRevision,hasCandidate:!!candidate,candidateStudioRevision,diverged:!!candidate&&candidateStudioRevision!==studioRevision,jobStatus,activeRunId:activeJob?.runId||null,qaFreshness:latest?(runResult(latest).fresh?'fresh':'stale'):'unavailable'}};}),
        getDeck:(args={})=>response('getDeck',()=>{
          const source=args?.source||(candidate?'candidate':'studio');
          if(source==='candidate'&&candidate)return {revision:candidateRevision,data:{source,document:jsonCopy(candidate)}};
          if(source==='studio')return {revision:syncStudio(),data:{source,document:xbClone(deckDocument())}};
          fail('SOURCE_UNAVAILABLE','Deck source is unavailable: '+source);
        }),
        setCandidate:args=>response('setCandidate',()=>{
          guardBase(args);const doc=jsonCopy(args.document);syncStudio();return storeCandidate(doc);
        }),
        syncFromStudio:args=>response('syncFromStudio',()=>{
          guardBase(args);if(!own(args,'expectedStudioRevision'))fail('INVALID_ARGUMENT','expectedStudioRevision is required');
          if(typeof args.expectedStudioRevision!=='string')fail('INVALID_ARGUMENT','expectedStudioRevision must be a string');
          syncStudio();if(args.expectedStudioRevision!==studioRevision)fail('REVISION_CONFLICT','Studio revision changed',{expected:args.expectedStudioRevision,current:studioRevision});
          return storeCandidate(jsonCopy(deckDocument()));
        }),
        validate:(args={})=>response('validate',()=>{const snap=candidateSnapshot(args?.revision);if(args?.profile&&!['agent-strict','draft'].includes(args.profile))fail('INVALID_ARGUMENT','Unsupported profile');const result=XBrainCompiler.compile(snap.document,{strict:true,trust:'trusted'}),diagnostics=result.diagnostics.concat(agentContentDiagnostics(snap.document)),errors=diagnostics.filter(d=>d.severity==='error').length,warnings=diagnostics.filter(d=>d.severity==='warning').length;return {revision:snap.revision,data:{validation:{valid:errors===0,errors,warnings},diagnostics}};}),
        render:(args={})=>response('render',()=>{const job=renderQueue.then(()=>renderSnapshot(args));renderQueue=job.catch(()=>{});return job;}),
        cancel:(args={})=>response('cancel',()=>{if(!activeJob||(args.runId&&args.runId!==activeJob.runId))fail('RENDER_NOT_READY','No matching active render');activeJob.cancelled=true;return {revision:candidateRevision,data:{runId:activeJob.runId,accepted:true,scope:'between-measurement-batches'}};}),
        inspect:(args={})=>response('inspect',()=>{const run=args.runId?runs.get(args.runId):[...runs.values()].at(-1);if(!run)fail('RENDER_NOT_READY','No such render run');const data=runResult(run);if(args.slideId!=null)data.findings=data.findings.filter(f=>f.slideId===args.slideId);return {revision:run.revision,data};}),
        getRun:(args={})=>response('getRun',()=>{const run=runs.get(args.runId);if(!run)fail('RENDER_NOT_READY','No such render run');return {revision:run.revision,data:{...runResult(run),manifest:runManifest(run)}};}),
        getPreview:(args={})=>response('getPreview',()=>{const run=runs.get(args.runId);if(!run)fail('RENDER_NOT_READY','No such render run');const slide=typeof args.slide==='number'?run.compiled.slides.find(s=>s.index===args.slide):run.compiled.slides.find(s=>s.id===args.slide);if(!slide||!run.checkedSlideIds.includes(slide.id))fail('INVALID_ARGUMENT','Slide was not measured in this run');return {revision:run.revision,data:{runId:run.runId,slideId:slide.id,index:slide.index,fresh:runResult(run).fresh,html:agentPage({...run.compiled,slides:[slide]},true),previewSelector:'[data-testid="xb-agent-preview"]'}};}),
        getLogs:(args={})=>response('getLogs',()=>{const after=Number(args.after)||0,limit=Math.max(1,Math.min(200,Number(args.limit)||100));return {revision:candidateRevision,data:{events:events.filter(e=>e.eventId>after).slice(0,limit).map(e=>({...e}))}};}),
        clearLogs:()=>response('clearLogs',()=>{events.length=0;return {revision:candidateRevision,data:{cleared:true}};}),
        subscribe:handler=>{if(typeof handler!=='function')throw new TypeError('handler must be a function');listeners.add(handler);return ()=>listeners.delete(handler);},
        proposeRepair:(args={})=>response('proposeRepair',()=>{
          guardBase(args);if(!candidate)fail('SOURCE_UNAVAILABLE','No candidate');if(args.strategy&&args.strategy!=='deterministic')fail('INVALID_ARGUMENT','Unsupported repair strategy');
          if(repairAttempts>=3)fail('REPAIR_LIMIT','Repair proposal limit reached; revise the candidate explicitly');repairAttempts++;
          const before=jsonCopy(candidate),result=XBrainCompiler.repair(before,{strict:true,trust:'trusted'}),repaired=jsonCopy(result.document);checkDocument(repaired);
          const paths=changedPaths(candidate,repaired),audit=preservation(candidate,repaired,result.changes),scope=args.scope||null;let escalation=null;
          if(scope){const parts=pointer(scope.sourcePath);at(candidate,parts);if(scope.slideId!=null&&(parts[0]!=='slides'||candidate.slides[Number(parts[1])]?.id!==scope.slideId))fail('PATCH_OUT_OF_SCOPE','Scope slide does not match candidate');
            if(paths.length>=1000||paths.some(path=>!parts.every((part,i)=>pointer(path)[i]===part)))escalation='deck';}
          const proposalId='proposal-'+(++proposalSequence),proposal={proposalId,revision:candidateRevision,document:repaired,changes:result.changes,diagnostics:result.diagnostics,changedPaths:paths,preservation:audit,scopeEscalation:escalation};
          proposals.set(proposalId,proposal);while(proposals.size>3)proposals.delete(proposals.keys().next().value);
          return {revision:candidateRevision,data:{proposalId,changes:proposal.changes,changedPaths:paths,diagnostics:proposal.diagnostics,preservation:audit,scopeEscalation:escalation,document:jsonCopy(repaired),stagnated:paths.length===0}};
        }),
        acceptRepair:args=>response('acceptRepair',()=>{
          guardBase(args);const proposal=proposals.get(args.proposalId);if(!proposal||proposal.revision!==candidateRevision)fail('REVISION_CONFLICT','Repair proposal is unavailable or stale');
          if(proposal.scopeEscalation&&args.acceptScope!=='deck')fail('REPAIR_SCOPE_ESCALATION','Repair changes data outside the requested scope');
          if(proposal.preservation.status!=='preserved')fail('PRESERVATION_UNVERIFIED','Repair preservation could not be verified',proposal.preservation);
          if(!proposal.changedPaths.length)fail('REPAIR_STAGNATED','Repair made no changes');
          const previousRevision=candidateRevision;candidate=jsonCopy(proposal.document);candidateRevision=nextRevision();rememberCandidate();proposals.delete(args.proposalId);
          return {revision:candidateRevision,data:{previousRevision,changedPaths:proposal.changedPaths,preservation:proposal.preservation,validationFresh:false,qaFresh:false}};
        }),
        getPreservationReport:(args={})=>response('getPreservationReport',()=>{const from=snapshots.get(args.fromRevision),to=snapshots.get(args.toRevision);if(!from||!to)fail('SOURCE_UNAVAILABLE','Revision snapshot is unavailable');return {revision:args.toRevision,data:preservation(from,to)};}),
        commitCandidate:args=>response('commitCandidate',()=>{
          guardBase(args);if(!candidate)fail('SOURCE_UNAVAILABLE','No candidate');if(!own(args,'expectedStudioRevision'))fail('INVALID_ARGUMENT','expectedStudioRevision is required');
          if(typeof args.expectedStudioRevision!=='string')fail('INVALID_ARGUMENT','expectedStudioRevision must be a string');
          syncStudio();if(args.expectedStudioRevision!==studioRevision)fail('REVISION_CONFLICT','Studio revision changed',{expected:args.expectedStudioRevision,current:studioRevision});
          const run=strictRun(candidateRevision,args.qaRunId),doc=jsonCopy(candidate);
          DeckStore.change(()=>deckApplyDocument(doc,{recordHistory:false,strictCustom:true}));syncStudio();candidateStudioRevision=studioRevision;
          return {revision:candidateRevision,data:{studioRevision,qaRunId:run.runId,undoRecorded:true}};
        }),
        markVisualReview:(args={})=>response('markVisualReview',()=>{
          const run=runs.get(args.runId);if(!run)fail('RENDER_NOT_READY','No such render run');strictRun(run.revision,run.runId);
          if(args.status!=='approved'||typeof args.evidence!=='string'||!args.evidence.trim()||args.evidence.length>500||typeof args.reviewer!=='string'||!args.reviewer.trim()||args.reviewer.length>120)fail('INVALID_ARGUMENT','Approved review requires reviewer and evidence reference');
          run.review={status:'approved',reviewer:args.reviewer,evidence:args.evidence,origin:'external-agent'};return {revision:run.revision,data:{runId:run.runId,visualReview:'agent-reported',review:{...run.review}}};
        }),
        exportArtifact:(args={})=>response('exportArtifact',()=>{
          const snap=candidateSnapshot(args.revision);if(!['json','static-html'].includes(args.format))fail('EXPORT_FORMAT_UNAVAILABLE','Only JSON and static HTML are available');
          const profile=args.profile||'agent-strict';if(!['agent-strict','agent-strict-reviewed','draft'].includes(profile))fail('INVALID_ARGUMENT','Unsupported export profile');
          if(profile==='draft'&&args.format!=='json')fail('QA_GATE_FAILED','Draft export is limited to JSON');
          const run=profile!=='draft'?strictRun(snap.revision,args.qaRunId):null;
          if(profile==='agent-strict-reviewed'&&!run.review)fail('VISUAL_REVIEW_REQUIRED','External agent review metadata is required');
          const content=args.format==='json'?JSON.stringify(snap.document,null,2):agentPage(run.compiled);
          const artifactId='art-'+(++artifactSequence),filename=args.format==='json'?'xbrain-deck.json':'xbrain-presentation.html',mimeType=args.format==='json'?'application/json;charset=utf-8':'text/html;charset=utf-8';
          artifacts.set(artifactId,{artifactId,revision:snap.revision,studioRevision:snap.studioRevision,format:args.format,content,filename,mimeType,qaRunId:run?.runId||null});while(artifacts.size>3)artifacts.delete(artifacts.keys().next().value);
          return {revision:snap.revision,data:{artifactId,format:args.format,filename,mimeType,bytes:encodeBytes(content).length,qaRunId:run?.runId||null,quality:{passed:!!run,profile,visualReview:run?.review?'agent-reported':'not-assessed'},delivery:{getArtifact:true,downloadButtonAvailable:true}}};
        }),
        getArtifact:(args={})=>response('getArtifact',()=>{const artifact=artifacts.get(args.artifactId);if(!artifact)fail('INVALID_ARGUMENT','Artifact is unavailable');if(args.as&&args.as!=='text')fail('INVALID_ARGUMENT','Only text delivery is available');syncStudio();return {revision:artifact.revision,data:{...artifact,fresh:artifact.revision===candidateRevision&&artifact.studioRevision===studioRevision}};}),
        downloadArtifact:(args={})=>response('downloadArtifact',()=>{const artifact=artifacts.get(args.artifactId);if(!artifact)fail('INVALID_ARGUMENT','Artifact is unavailable');syncStudio();if(artifact.revision!==candidateRevision||artifact.studioRevision!==studioRevision)fail('QA_STALE','Artifact was created before the latest candidate or Studio change');const nav=getNavigator(),win=getWindow();if(nav.userActivation&&!nav.userActivation.isActive)fail('DOWNLOAD_BLOCKED','Use the download button with a user gesture');const url=win.URL.createObjectURL(new win.Blob([artifact.content],{type:artifact.mimeType}));try{const link=getDocument().createElement('a');link.href=url;link.download=artifact.filename;link.click();}finally{setTimeout(()=>win.URL.revokeObjectURL(url),1000);}return {revision:artifact.revision,data:{accepted:true,filename:artifact.filename}};}),
        previewPatch:args=>response('previewPatch',()=>{const result=patch(args),validation=XBrainCompiler.validate(result.document,{strict:true,trust:'trusted'}),diagnostics=validation.diagnostics.concat(agentContentDiagnostics(result.document));return {revision:candidateRevision,data:{changedPaths:result.changedPaths,affectedSlideIds:result.affectedSlideIds,beforeFingerprint:result.beforeFingerprint,afterFingerprint:result.afterFingerprint,validationImpact:{valid:!diagnostics.some(d=>d.severity==='error'),diagnostics},needsValidation:true}};}),
        applyPatch:args=>response('applyPatch',()=>{const result=patch(args),previousRevision=candidateRevision;candidate=result.document;candidateRevision=nextRevision();repairAttempts=0;rememberCandidate();return {revision:candidateRevision,data:{previousRevision,changedPaths:result.changedPaths,affectedSlideIds:result.affectedSlideIds,beforeFingerprint:result.beforeFingerprint,afterFingerprint:result.afterFingerprint,needsValidation:true,validationFresh:false,qaFresh:false}};}),
        resetCandidate:args=>response('resetCandidate',()=>{guardBase(args);candidate=null;candidateRevision=nextRevision();candidateStudioRevision=null;repairAttempts=0;return {revision:candidateRevision,data:{candidateRevision,empty:true}};})
      });
      return {facade,observeStudio(snapshot){if(snapshot!==studioSnapshot){studioSnapshot=snapshot;studioRevision=nextRevision();}},boot(){if(booted)return;syncStudio();booted=true;resolveReady();const win=getWindow();if(typeof win?.dispatchEvent==='function'&&typeof win?.Event==='function')win.dispatchEvent(new win.Event('xb-agent-ready'));}};
    })({getDocument:()=>typeof document!=='undefined'?document:null,getWindow:()=>typeof window!=='undefined'?window:globalThis,getNavigator:()=>typeof navigator!=='undefined'?navigator:{},encodeBytes:text=>new TextEncoder().encode(text)});
    XB_API.agent=XBAgent.facade; if (typeof window !== 'undefined') (window as any).XB = XB_API;

    /* Agent Console: a DOM adapter for the public facade, never a second engine. */
    const AgentConsole=(()=>{
      const api=XBAgent.facade;let root,lastRunId=null,lastArtifactId=null,lastProposalId=null,selected=0,visibleSlides=80,previewBase=null,studioBase=null,bound=false,findings=[];
      const node=name=>root.querySelector('[data-testid="'+name+'"]');
      const text=(name,value)=>{node(name).textContent=value;};
      function show(result){text('xb-agent-response-json',JSON.stringify(result,null,2));}
      function clearPreview(){const box=node('xb-agent-preview');box.querySelector('iframe').removeAttribute('srcdoc');delete box.dataset.runId;delete box.dataset.slideId;box.dataset.state='empty';text('xb-agent-preview-status','No rendered preview.');highlight(null);}
      function sizePreview(){const box=node('xb-agent-preview'),frame=box.querySelector('iframe');frame.style.transform='scale('+(box.clientWidth/1920)+')';}
      async function refreshLogs(){const log=await api.getLogs({limit:200}),filter=node('xb-agent-log-filter').value;if(log.ok)text('xb-agent-execution-log',log.data.events.filter(e=>filter==='all'||e.status===filter).map(e=>`${e.eventId} · ${e.operation} · ${e.status}${e.code?' · '+e.code:''}`).join('\n'));}
      function highlight(finding){const overlay=root.querySelector('.v1-agent-highlight'),b=finding?.bounds;if(!b||b.coordinateSpace!=='slide-1920x1080'){overlay.hidden=true;return;}overlay.hidden=false;overlay.style.left=(b.x/1920*100)+'%';overlay.style.top=(b.y/1080*100)+'%';overlay.style.width=(b.width/1920*100)+'%';overlay.style.height=(b.height/1080*100)+'%';}
      async function showPreview(){
        if(!lastRunId)return;const result=await api.getPreview({runId:lastRunId,slide:selected}),box=node('xb-agent-preview');
        if(result.ok){const frame=box.querySelector('iframe');frame.srcdoc=result.data.html;box.dataset.runId=lastRunId;box.dataset.slideId=result.data.slideId;box.dataset.state=result.data.fresh?'ready':'stale';text('xb-agent-preview-status',result.data.fresh?'Visual review is performed externally.':'Preview is stale; render again.');sizePreview();}
      }
      async function refresh(){
        const state=await api.getState();if(!state.ok)return;
        text('xb-agent-revision',state.data.candidateRevision||'none');
        const tree=node('xb-agent-deck-tree');tree.replaceChildren();
        if(state.data.hasCandidate){const result=await api.getDeck({source:'candidate'});if(result.ok){const slides=result.data.document.slides||[];if(selected>=slides.length)selected=0;
          visibleSlides=Math.max(visibleSlides,selected+1);slides.slice(0,visibleSlides).forEach((slide,index)=>{const id=String(slide?.id||'slide-'+(index+1)),li=document.createElement('li'),button=document.createElement('button');
            li.setAttribute('role','none');button.type='button';button.setAttribute('role','treeitem');button.dataset.v1AgentAction='select';button.dataset.index=String(index);button.dataset.slideId=id;button.dataset.testid='xb-agent-slide-'+id;button.setAttribute('aria-selected',String(index===selected));button.textContent=String(index+1).padStart(2,'0')+' · '+String(slide?.title||slide?.content?.title||id);li.append(button);tree.append(li);});node('xb-agent-more-slides').hidden=slides.length<=visibleSlides;}}
        else node('xb-agent-more-slides').hidden=true;
        if(lastRunId){const run=await api.getRun({runId:lastRunId});if(run.ok){const q=run.data.qa;text('xb-agent-qa-summary',`QA: ${q.passed?'passed':run.data.fresh?'issues':'stale'} · ${q.checkedSlides}/${q.totalSlides} measured · ${q.errors} errors · ${q.warnings} warnings`);node('xb-agent-qa-summary').dataset.state=q.passed?'passed':run.data.fresh?'issues':'stale';if(!run.data.fresh){node('xb-agent-preview').dataset.state='stale';text('xb-agent-preview-status','Preview is stale; render again.');highlight(null);}}}
        else{text('xb-agent-qa-summary','QA: not measured');node('xb-agent-qa-summary').dataset.state='unavailable';}
      }
      function showFindings(result){
        if(!result.ok)return;const box=node('xb-agent-findings');box.replaceChildren();findings=result.data.findings;
        if(!findings.length){box.textContent='No findings.';return;}
        for(const finding of findings){const item=document.createElement('button');item.type='button';item.dataset.v1AgentAction='finding';item.dataset.findingId=finding.findingId;item.textContent=`${finding.blocking?'BLOCKING · ':''}${finding.severity} · ${finding.code} · ${finding.sourcePath||'/'} — ${finding.message}`;box.append(item);}
      }
      async function act(action,button){
        if(action==='close'){root.hidden=true;document.getElementById('app-shell').inert=false;document.getElementById('v1-menu-ai-trigger').focus();return;}
        if(action==='select'){selected=Number(button.dataset.index);highlight(null);await refresh();await showPreview();return;}
        if(action==='finding'){const finding=findings.find(f=>f.findingId===button.dataset.findingId),match=/^\/slides\/(\d+)/.exec(finding?.sourcePath||'');if(match){selected=Number(match[1]);await refresh();await showPreview();highlight(finding);}return;}
        if(action==='more'){visibleSlides+=80;await refresh();return;}
        if(action==='copy-response'){try{await navigator.clipboard.writeText(node('xb-agent-response-json').textContent);}catch(_){const range=document.createRange();range.selectNodeContents(node('xb-agent-response-json'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}return;}
        button.disabled=true;button.dataset.state='busy';button.setAttribute('aria-busy','true');let result;
        try{
          if(action==='download'){result=await api.downloadArtifact({artifactId:lastArtifactId});}
          else{
            const state=(await api.getState()).data,revision=state.candidateRevision;
            if(action==='state')result=await api.getState();
            else if(action==='candidate')result=await api.getDeck({source:'candidate'});
            else if(action==='load'){result=await api.setCandidate({document:JSON.parse(node('xb-agent-deck-input').value),baseRevision:revision});if(result.ok){studioBase=state.studioRevision;selected=0;visibleSlides=80;lastRunId=null;lastArtifactId=null;lastProposalId=null;previewBase=null;clearPreview();}}
            else if(action==='sync'){result=await api.syncFromStudio({baseRevision:revision,expectedStudioRevision:state.studioRevision});if(result.ok){studioBase=state.studioRevision;selected=0;visibleSlides=80;lastRunId=null;lastArtifactId=null;lastProposalId=null;previewBase=null;clearPreview();}}
            else if(action==='reset'){result=await api.resetCandidate({baseRevision:revision});if(result.ok){selected=0;lastRunId=null;lastArtifactId=null;lastProposalId=null;previewBase=null;clearPreview();}}
            else if(action==='validate')result=await api.validate({revision});
            else if(action==='render'){const subset=node('xb-agent-render-scope').value==='selected';result=await api.render({revision,...(subset?{slides:[selected]}:{})});if(result.ok){lastRunId=result.data.runId;if(!subset)selected=0;highlight(null);showFindings(result);await showPreview();}}
            else if(action==='cancel')result=await api.cancel({runId:state.activeRunId});
            else if(action==='inspect'){result=await api.inspect({runId:lastRunId});showFindings(result);}
            else if(action==='preview-patch'){const scope=node('xb-agent-scope').value.trim();result=await api.previewPatch({baseRevision:revision,operations:JSON.parse(node('xb-agent-patch-input').value),...(scope?{scope:JSON.parse(scope)}:{})});if(result.ok)previewBase=revision;}
            else if(action==='apply-patch'){const scope=node('xb-agent-scope').value.trim();result=await api.applyPatch({baseRevision:previewBase??revision,operations:JSON.parse(node('xb-agent-patch-input').value),...(scope?{scope:JSON.parse(scope)}:{})});if(result.ok){previewBase=null;lastArtifactId=null;lastProposalId=null;}}
            else if(action==='propose'){const scope=node('xb-agent-scope').value.trim();result=await api.proposeRepair({baseRevision:revision,...(scope?{scope:JSON.parse(scope)}:{})});if(result.ok)lastProposalId=result.data.proposalId;}
            else if(action==='accept'){result=await api.acceptRepair({baseRevision:revision,proposalId:lastProposalId,...(node('xb-agent-accept-deck').checked?{acceptScope:'deck'}:{})});if(result.ok){lastProposalId=null;lastArtifactId=null;}}
            else if(action==='commit'){result=await api.commitCandidate({baseRevision:revision,expectedStudioRevision:studioBase,qaRunId:lastRunId});if(result.ok)lastArtifactId=null;}
            else if(action==='export'){result=await api.exportArtifact({revision,format:'static-html',profile:'agent-strict',qaRunId:lastRunId});if(result.ok)lastArtifactId=result.data.artifactId;}
            else if(action==='export-reviewed'){result=await api.exportArtifact({revision,format:'static-html',profile:'agent-strict-reviewed',qaRunId:lastRunId});if(result.ok)lastArtifactId=result.data.artifactId;}
            else if(action==='export-json'){result=await api.exportArtifact({revision,format:'json',profile:'agent-strict',qaRunId:lastRunId});if(result.ok)lastArtifactId=result.data.artifactId;}
            else if(action==='review')result=await api.markVisualReview({runId:lastRunId,status:'approved',reviewer:'external-agent',evidence:node('xb-agent-review-evidence').value});
            else if(action==='clear-log')result=await api.clearLogs();
            else if(action==='artifact')result=await api.getArtifact({artifactId:lastArtifactId});
          }
          if(result){show(result);button.dataset.state=result.ok?'success':'error';}
          await refresh();
        }catch(error){button.dataset.state='error';show({ok:false,operation:action,error:{code:'INVALID_ARGUMENT',message:String(error.message||error)}});}
        finally{button.disabled=false;button.setAttribute('aria-busy','false');}
      }
      return {
        bind(){if(bound)return;bound=true;root=document.getElementById('v1-agent-console');
          root.addEventListener('click',event=>{const button=event.target.closest('[data-v1-agent-action]');if(button&&root.contains(button))act(button.dataset.v1AgentAction,button);});
          root.addEventListener('change',event=>{if(event.target===node('xb-agent-log-filter'))refreshLogs();});
          window.addEventListener('resize',()=>{if(!root.hidden)sizePreview();});api.subscribe(()=>refreshLogs());
          api.ready().then(()=>{const ready=node('xb-agent-ready');ready.dataset.state='ready';ready.textContent='Ready';});
        },
        async open(){root.hidden=false;document.getElementById('app-shell').inert=true;const state=await api.getState();studioBase=state.data.candidateStudioRevision??state.data.studioRevision;await refresh();await refreshLogs();node('xb-agent-validate').focus();}
      };
    })();



// Normalize built-in sample slides immediately
(() => {
  const seen = new Set();
  slides.forEach((s, i) => {
    const meta = catalogMeta(s.type) || {};
    if (!s.id || seen.has(s.id)) s.id = `slide-${s.type || "x"}-${i + 1}`;
    seen.add(s.id);
    const resolvedGroup = (s.group === null || s.group === "")
      ? undefined
      : normalizeSlideGroup(s.group, (meta as any).group);
    if (resolvedGroup) s.group = resolvedGroup;
    else delete s.group;
    s.layoutName = s.layoutName || String((meta as any).name || s.type).replace(/^\d+\.\s*/, "");
    if (!xbIsObj(s.content)) s.content = {};
  });
})();

XBAgent.boot();

let studioMounted = false;
export function mountXBrainStudio(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  bindSlideDnD(document.getElementById(SLIDE_PANELS.list), "list");
  bindSlideDnD(document.getElementById(SLIDE_PANELS.grid), "grid", document.getElementById("gallery-view"));
  if (!studioMounted) {
    studioMounted = true;
    const bootText = document.getElementById("v1-embedded-deck")?.textContent?.trim();
    if (bootText) {
      try {
        deckApplyDocument(JSON.parse(bootText), { recordHistory: false });
      } catch (e) {
        console.warn("Embedded deck data invalid", e);
      }
    }
    HeaderMenus.bind();
    trackDeckState();
    AgentConsole.bind();
    XBAgent.boot();
  }
  renderCurrentSlide();
  renderInlineIcons();
  notifyEngine();
}

export function getEngineSnapshot() {
  if (!cachedSnapshot) {
    cachedSnapshot = {
      slides: slides.slice(),
      currentSlide: slides[currentSlideIndex] || slides[0] || null,
      currentSlideIndex,
      currentSidebarFilter,
      currentGalleryFilter,
      isInlineEditEnabled,
      currentAppMode,
      deckConfig: DECK_CONFIG,
      layoutCatalog: LAYOUT_CATALOG,
      groups: getDeckGroups(),
    };
  }
  return cachedSnapshot;
}

export {
  XBrainCompiler,
  XB_API as XB,
  XBAgent,
  AgentConsole,
  DataResolver,
  createDataResolver,
  DeckModel,
  EnhancedRenderers,
  XBText,
  XBDiag,
  xbSolveGrid,
  LAYOUT_CATALOG,
  CHART_VARIANTS,
  DIAGRAM_VARIANTS,
  COMPONENT_RENDERERS,
  SLIDE_RENDERERS,
  DIAGRAM_RENDERERS,
  switchAppMode,
  toggleInlineEdit,
  startFullscreenPresentation,
  toggleFullscreenPresentation,
  openAddSlideModal,
  closeAddSlideModal,
  addSlideByType,
  DuplicateCurrentSlide,
  deleteCurrentSlide,
  openDataEditorModal,
  closeDataEditorModal,
  applyJsonEditorChanges,
  saveDeckJSON,
  importDeckJSON,
  receiveDeckJSON,
  downloadEditedHTML,
  openContentEditorModal,
  closeContentEditorModal,
  applyContentEditor,
  runDeckQA,
  exportPrintPDF,
  saveLocalDraft,
  restoreLocalDraft,
  undoDeck,
  redoDeck,
  filterSidebarSlides,
  filterGallery,
  selectSlide,
  nextSlide,
  prevSlide,
  deckOpenLibrary,
  deckCloseLibrary,
  deckFilterLibrary,
  deckOpenDeckEditor,
  deckCloseDeckEditor,
  deckApplyDeckEditor,
  deckReloadRemote,
  openHeaderAbout,
  closeHeaderAbout,
};

