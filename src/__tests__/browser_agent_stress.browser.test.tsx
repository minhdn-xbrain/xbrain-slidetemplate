// Repeat bounded render, repair proposal and patch cycles; renderer heap after GC is sampled, not a leak proof.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import { test } from 'vitest';

test('browser agent stress', async () => {
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1366,height:768}});await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.collectGarbage');
 const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));const before=await metrics();
 const result=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();const slides=Array.from({length:12},(_,i)=>({id:'s'+i,type:'composer',title:'Slide '+i,components:[{type:'text',text:'Stable business content '+i}]}));
  let loaded=await a.setCandidate({baseRevision:null,document:{version:'1.0',slides}}),rev=loaded.revision;const start=performance.now(),runs: string[]=[];
  for(let i=0;i<20;i++){
   const run=await a.render({revision:rev});if(!run.ok||run.data.qa.checkedSlides!==12)return {error:run,iteration:i};runs.push(run.data.runId);
   const repair=await a.proposeRepair({baseRevision:rev});if(!repair.ok)return {error:repair,iteration:i};
   const patched=await a.applyPatch({baseRevision:rev,operations:[{op:'replace',path:'/slides/0/title',value:'Slide 0 iteration '+i}]});if(!patched.ok)return {error:patched,iteration:i};rev=patched.revision;
  }
  const oldRun=await a.getRun({runId:runs[0]}),newRun=await a.getRun({runId:runs.at(-1)});return {iterations:20,durationMs:Math.round(performance.now()-start),oldRunCode:oldRun.error?.code,newRunAvailable:newRun.ok};
 });
 await cdp.send('HeapProfiler.collectGarbage');const after=await metrics();assert.equal(result.iterations,20,JSON.stringify(result));assert.equal(result.oldRunCode,'RENDER_NOT_READY');assert.equal(result.newRunAvailable,true);
 console.log(JSON.stringify({browser:browser.version(),network:'external blocked',...result,rendererHeapBefore:before.JSHeapUsedSize,rendererHeapAfter:after.JSHeapUsedSize},null,2));await context.close();
}finally{await browser.close();}

});
