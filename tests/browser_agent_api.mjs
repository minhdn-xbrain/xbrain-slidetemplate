// Read-only agent facade: file and static-host parity, readiness and isolation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=http.createServer((req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'index.html')));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try {
 for(const url of [pathToFileURL(path.join(root,'index.html')).href,`http://127.0.0.1:${server.address().port}/index.html`]){
  const context=await browser.newContext();await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
  await context.addInitScript(()=>{
   if(window!==window.top)return;
   window.__agentReadyEvents=0;window.__readyBeforeBoot=false;
   window.addEventListener('xb-agent-ready',()=>window.__agentReadyEvents++);
   document.addEventListener('DOMContentLoaded',()=>{
    window.XB.agent.ready().then(()=>{window.__readyBeforeBoot=window.__agentReadyEvents===0;});
   });
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const result=await page.evaluate(async()=>{
   const a=window.XB.agent, ready=await a.ready(),cap=await a.capabilities(),full=await a.capabilities({detail:'full'}),contract=await a.getContract(),schema=await a.getSchema(),state=await a.getState(),first=await a.getDeck({source:'studio'});
   const unchanged=JSON.stringify(window.XB.getDeck()); first.data.document.slides[0].title='external mutation';
   const second=await a.getDeck({source:'studio'}),invalid=await a.getDeck({source:'candidate'});
   window.XB.updateSlide(0,{source:'revision check'});window.XB.undo();
   const afterUndo=await a.getState();
   return {ready,cap,full,contract,schema,state,second,invalid,unchanged,actual:JSON.stringify(window.XB.getDeck()),events:window.__agentReadyEvents,readyBeforeBoot:window.__readyBeforeBoot,afterUndo};
  });
  assert.equal(result.events,1);assert.equal(result.readyBeforeBoot,false);assert.equal(result.ready.ok,true);assert.equal(result.ready.apiVersion,'agent.1');
  assert.equal(result.cap.data.release,'1.0.0');assert.equal(result.cap.data.schemaVersion,'1.0');
  assert.equal(result.cap.data.counts.layouts,result.contract.data.layouts.length);assert.equal(result.cap.data.counts.components,result.contract.data.components.length);assert.equal(result.cap.data.counts.chartVariants,result.contract.data.variants.chart.length);
  assert.deepEqual(result.schema.data,result.contract.data.schema);assert.equal(result.cap.data.features.candidate,true);assert.equal(result.cap.data.features.trustedAuthorContent,true);assert.equal(result.cap.data.features.sandboxedPreview,false);assert.deepEqual(result.cap.data.features.patchOperations,['add','remove','replace','test']);assert.equal(result.cap.data.modes.browserUi,true);
  assert.equal(result.state.data.candidateRevision,null);assert.ok(result.state.data.studioRevision);assert.equal(result.second.revision,result.state.data.studioRevision);
  assert.notEqual(result.afterUndo.data.studioRevision,result.state.data.studioRevision);
  assert.equal(result.unchanged,result.actual);assert.equal(result.invalid.ok,false);assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('Agent read-only facade: file and HTTP passed');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
