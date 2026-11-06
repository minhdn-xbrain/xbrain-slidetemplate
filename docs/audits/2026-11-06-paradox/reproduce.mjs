// Read-only audit probes. Exit 1 is expected on the audited baseline.
// Run from any directory; optional first argument saves the JSON observations.
import fs from 'node:fs';
import {loadRuntime} from '../../../tools/xbrain.mjs';
const rt=loadRuntime();
const fixture=JSON.parse(fs.readFileSync(new URL('../../../tests/fixtures/paradox_xbrain.json',import.meta.url),'utf8'));
const compile=s=>rt.call('compile',{version:'1.0',slides:[s]});
const observations=[];const check=(name,condition,actual)=>observations.push({name,passed:!!condition,actual});
const heat=compile({type:'heatmap',content:{columns:['Risk'],rows:[{label:'District',values:[27.1]}]}});
check('Heatmap preserves 27.1 instead of clamping to 5',/>27[.,]1<\/tspan>/.test(heat.slides[0].html),{visible:heat.slides[0].html.match(/<tspan[^>]*>5<\/tspan>/)?.[0],diagnostics:heat.diagnostics});
const rows=compile({type:'heatmap',content:{columns:['Risk'],rows:Array.from({length:7},(_,i)=>({label:`District-${i+1}`,values:[1]}))}});
check('Seventh heatmap row is visible',rows.slides[0].html.includes('District-7'),{diagnostics:rows.diagnostics});
const sankey=compile(fixture.slides[10]);
check('Sankey preserves Microgrid source',sankey.slides[0].html.includes('Microgrid'),{diagnostics:sankey.diagnostics});
const pri=compile({type:'priority-matrix',content:{items:[{label:'A',x:107.4,y:45},{label:'B',x:225.5,y:38}]}});
const coords=[...pri.slides[0].html.matchAll(/<circle cx="([^"]+)" cy="[^"]+" r="27"/g)].map(m=>m[1]);
check('Distinct raw X values have distinct positions or an out-of-range error',new Set(coords).size===2||pri.diagnostics.some(d=>d.code==='data.out-of-range'),{coords,diagnostics:pri.diagnostics});
const line=compile(fixture.slides[13]);check('72h endpoint is visible',line.slides[0].html.includes('>72h</tspan>'),{diagnostics:line.diagnostics.filter(d=>d.code==='content.truncated')});
const cols=compile(fixture.slides[35]);check('Matrix rejects five value columns with four values',cols.diagnostics.some(d=>d.code==='data.inconsistent'||d.code==='schema.invalid'),{diagnostics:cols.diagnostics});
const control=compile({type:'priority-matrix',content:{items:[{label:'A',x:10,y:45},{label:'B',x:80,y:38}]}});check('Control: distinct normalized X stays distinct',new Set([...control.slides[0].html.matchAll(/<circle cx="([^"]+)" cy="[^"]+" r="27"/g)].map(m=>m[1])).size===2,{});
for(const o of observations) console.log(`${o.passed?'PASS':'FAIL'} ${o.name}: ${JSON.stringify(o.actual)}`);
if(process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify(observations,null,2)+'\n');
process.exitCode=observations.some(o=>!o.passed)?1:0;
