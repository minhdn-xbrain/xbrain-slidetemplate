// Measured component findings should carry verified source paths and slide coordinates.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
 const result=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();const components=Array.from({length:10},(_,i)=>({type:'text',position:{x:(i%5)*310,y:Math.floor(i/5)*100,width:300,height:60},text:('Component '+i+' must visibly overflow. ').repeat(45)}));
  const doc={version:'1.0',slides:[{id:'s',type:'composer',title:'Provenance',layout:'freeform',components}]};
  const created=await a.setCandidate({baseRevision:null,document:doc});const render=await a.render({revision:created.revision});const inspected=await a.inspect({runId:render.data.runId});const blocked=await a.exportArtifact({revision:created.revision,format:'static-html',qaRunId:render.data.runId});
  const nestedDoc={version:'1.0',slides:[{id:'nested',type:'composer',layout:'freeform',title:'Nested',components:[{type:'stack',position:{x:0,y:0,width:300,height:60},children:[{type:'text',text:'Nested overflow content. '.repeat(100)}]}]}]};
  const staged=await a.setCandidate({baseRevision:created.revision,document:nestedDoc}),nestedRun=await a.render({revision:staged.revision}),nested=await a.inspect({runId:nestedRun.data.runId});return {inspected,blocked,nested};
 });
 const measured=result.inspected.data.findings.filter(x=>x.code==='layout.measured-overflow');assert.ok(measured.length,JSON.stringify(result.inspected.data.findings));
 assert.ok(measured.some(x=>x.granularity==='component'&&x.sourcePath==='/slides/0/components/0'&&x.selector&&x.bounds?.coordinateSpace==='slide-1920x1080'),JSON.stringify(measured));
 const mapped=new Set(measured.filter(x=>x.granularity==='component').map(x=>x.sourcePath));assert.ok(mapped.size>=9,JSON.stringify([...mapped]));
 assert.equal(result.blocked.error.code,'QA_GATE_FAILED');assert.ok(result.blocked.error.details.gateReasons.some(x=>x.code==='layout.measured-overflow'));
 assert.ok(result.nested.data.findings.some(x=>x.code==='layout.measured-overflow'&&x.sourcePath==='/slides/0/components/0/children/0'),JSON.stringify(result.nested.data.findings));
 await context.close();console.log('Agent component provenance and bounds checks passed');
}finally{await browser.close();}
