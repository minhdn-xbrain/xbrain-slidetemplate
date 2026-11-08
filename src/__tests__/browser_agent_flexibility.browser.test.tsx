import type { AddressInfo } from 'node:net';
// The agent accepts author HTML, CSS, JavaScript, remote assets and JSON keys.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import { test } from 'vitest';

test('browser agent flexibility', async () => {
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');let images=0;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP438DwHwAGgAJ/EEwb4QAAAABJRU5ErkJggg==','base64');
const server=http.createServer((req,res)=>{if(req.url==='/asset.png'){images++;res.writeHead(200,{'content-type':'image/png'});res.end(png);return;}res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,'dist/index.html')));});
await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const page=await context.newPage();await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/index.html`);
 const result=await page.evaluate(async origin=>{
  const a=XB.agent;await a.ready();const state=(await a.getState()).data;
  const doc={version:'1.0',helpers:{double:'(x)=>x*2'},slides:[{id:'one',type:'composer',title:'Flexible',customCss:'@keyframes authored {from{opacity:0}to{opacity:1}} body{--author-value:1}.author-fixed{position:fixed}',components:[{type:'html',height:200,style:{backgroundColor:'#fff',fontFamily:'"Times New Roman", serif'},html:`<div id="author-content" data-xb-slide="8" data-xb-source-path="authored">Author content <img src="${origin}/asset.png" alt="asset"></div><script>parent.__authorRan=(parent.__authorRan||0)+1;<\/script>`},{type:'link',text:'Action',href:'javascript:void(0)'}]}]};
  const created=await a.setCandidate({baseRevision:null,document:doc}),validated=await a.validate({revision:created.revision}),render=await a.render({revision:created.revision});
  const preview=await a.getPreview({runId:render.data.runId,slide:0});
  const exported=await a.exportArtifact({revision:created.revision,format:'static-html',qaRunId:render.data.runId}),artifact=exported.ok?await a.getArtifact({artifactId:exported.data.artifactId}):null;
  const committed=await a.commitCandidate({baseRevision:created.revision,expectedStudioRevision:state.studioRevision,qaRunId:render.data.runId});
  const candidate=(await a.getDeck({source:'candidate'})).data.document;
  const patched=await a.applyPatch({baseRevision:created.revision,operations:[{op:'add',path:'/slides/0/content',value:JSON.parse('{"__proto__":{"label":"kept"},"constructor":"kept"}')} ]});
  const after=await a.getDeck({source:'candidate'});
  return {created,validated,render,preview,exported,artifact,committed,candidate,patched,after,special:JSON.stringify(after.data.document.slides[0].content),authorRan:window.__authorRan||0};
 },`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
 assert.equal(result.created.ok,true);assert.equal(result.validated.data.validation.valid,true,JSON.stringify(result.validated));assert.equal(result.render.data.manifest.trust,'trusted');
 assert.match(result.preview.data.html,/data-xb-source-path="authored"/);assert.match(result.preview.data.html,/data-xb-slide="8"/);assert.ok(result.authorRan>0);assert.ok(images>0);assert.equal(result.exported.ok,true,JSON.stringify(result.exported));assert.equal(result.committed.ok,true,JSON.stringify(result.committed));
 assert.match(result.artifact.data.content,/font-family:&quot;Times New Roman&quot;, serif/);assert.match(result.artifact.data.content,/<script>/i);assert.match(result.artifact.data.content,/@keyframes authored/);assert.match(result.artifact.data.content,/position:fixed/);assert.match(result.artifact.data.content,/body\{--author-value:1\}/);assert.doesNotMatch(result.artifact.data.content,/Content-Security-Policy/i);
 assert.equal(result.patched.ok,true,JSON.stringify(result.patched));const special=JSON.parse(result.special);assert.equal(special.__proto__.label,'kept');assert.equal(special.constructor,'kept');
 const layoutResult=await page.evaluate(async()=>{
  const a=XB.agent,state=(await a.getState()).data;
  const document={version:'1.0',helpers:{label:'(value)=>value.toUpperCase()'},layouts:{custom:{name:'Custom',group:'A',template:'<div id="custom-layout">${label(c.title)}</div>',css:'@keyframes custom-layout{from{opacity:0}to{opacity:1}}'}},slides:[{id:'custom',type:'custom',content:{title:'Layout works'}}]};
  const loaded=await a.setCandidate({baseRevision:state.candidateRevision,document}),run=await a.render({revision:loaded.revision}),exported=await a.exportArtifact({revision:loaded.revision,format:'static-html',qaRunId:run.data.runId});
  const artifact=exported.ok?await a.getArtifact({artifactId:exported.data.artifactId}):null;
  const committed=await a.commitCandidate({baseRevision:loaded.revision,expectedStudioRevision:state.studioRevision,qaRunId:run.data.runId});
  return {loaded,run,exported,artifact,committed};
 });
 assert.equal(layoutResult.run.ok,true,JSON.stringify(layoutResult.run));assert.equal(layoutResult.exported.ok,true,JSON.stringify(layoutResult.exported));assert.equal(layoutResult.committed.ok,true,JSON.stringify(layoutResult.committed));assert.match(layoutResult.artifact.data.content,/LAYOUT WORKS/);assert.match(layoutResult.artifact.data.content,/@keyframes custom-layout/);
 const out='/tmp/xbrain-flexible-export.html';fs.writeFileSync(out,result.artifact.data.content);const reopened=await context.newPage();await reopened.goto(pathToFileURL(out).href);assert.equal(await reopened.locator('#author-content').count(),1);
 await context.close();console.log('Agent trusted HTML, CSS, script, URL and JSON key workflow passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

});
